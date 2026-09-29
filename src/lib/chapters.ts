import "server-only";
import { cache } from "react";
import { dbConfigured, query } from "@/lib/db";
import { SELECT, toProduct, type Row as ProductRow } from "@/lib/products";
import type { Product, ProductImage } from "@/lib/catalog";

/**
 * The Names journal's chapters, read from Postgres.
 *
 * Formerly src/data/namesJournal.ts's hardcoded chapterRegistry +
 * chapterAssets. The story text was always product.memory (unchanged); what
 * moved here is the chapter list itself and its book-specific images.
 *
 * A chapter may point at a draft product (allow_draft) — the one exception
 * the storefront has always allowed, so the query bypasses the usual
 * admin-only-sees-drafts rule for exactly the rows a chapter names.
 */

export type ArchiveAssets = {
  dedication: ProductImage;
  product?: ProductImage;
  place?: ProductImage;
  portrait?: ProductImage;
  details?: ProductImage[];
};

export type NameChapter = {
  slug: string;
  number: number;
  product: Product;
  productHandle?: string;
  assets: ArchiveAssets;
};

export type ChapterKind = "dedication" | "product" | "place" | "portrait" | "detail";

type ChapterRow = {
  id: number;
  slug: string;
  position: number;
  product: ProductRow;
  images: { kind: ChapterKind; src: string; width: number; height: number; alt: string; position: number }[];
};

function toImage(row: { src: string; width: number; height: number; alt: string }): ProductImage {
  return { src: row.src, w: row.width, h: row.height, alt: row.alt };
}

function toAssets(images: ChapterRow["images"]): ArchiveAssets | null {
  const by = (kind: ChapterKind) =>
    [...images].filter((i) => i.kind === kind).sort((a, b) => a.position - b.position);

  const dedication = by("dedication")[0];
  if (!dedication) return null; // a chapter cannot render without one

  const single = (kind: ChapterKind) => {
    const row = by(kind)[0];
    return row ? toImage(row) : undefined;
  };
  const details = by("detail").map(toImage);

  return {
    dedication: toImage(dedication),
    product: single("product"),
    place: single("place"),
    portrait: single("portrait"),
    details: details.length ? details : undefined,
  };
}

/** For public reading: `/names` and anything that renders the book. */
export const getChapters = cache(async (): Promise<NameChapter[]> => {
  if (!dbConfigured) return [];

  try {
    const rows = await query<{
      id: number;
      slug: string;
      position: number;
      allow_draft: boolean;
      product: ProductRow;
      images: ChapterRow["images"];
    }>(
      `select c.id, c.slug, c.position, c.allow_draft,
              row_to_json(p) as product,
              coalesce((select json_agg(json_build_object(
                          'kind', i.kind, 'src', i.src, 'width', i.width,
                          'height', i.height, 'alt', i.alt, 'position', i.position))
                        from zuruny_chapter_images i where i.chapter_id = c.id), '[]'::json)
                as images
         from zuruny_chapters c
         join (${SELECT}) p on p.id = c.product_id
        where p.status = 'active' or c.allow_draft
        order by c.position`,
    );

    return rows.flatMap((row, index) => {
      const assets = toAssets(row.images);
      if (!assets) return [];
      const product = toProduct(row.product);
      return [
        {
          slug: row.slug,
          number: index + 1,
          product,
          productHandle: product.status === "active" ? product.handle : undefined,
          assets,
        },
      ];
    });
  } catch (error) {
    console.error(
      "[zuruny] Could not read the Names journal chapters:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
});

/** For the admin editor: every chapter, regardless of the linked product's status. */
export type AdminChapter = {
  id: number;
  slug: string;
  position: number;
  allowDraft: boolean;
  productId: number;
  productHandle: string;
  productName: string;
  productStatus: string;
  hasMemory: boolean;
  images: { id: number; kind: ChapterKind; src: string; width: number; height: number; alt: string; position: number }[];
};

export async function getAdminChapters(): Promise<AdminChapter[]> {
  const rows = await query<{
    id: number;
    slug: string;
    position: number;
    allow_draft: boolean;
    product_id: number;
    handle: string;
    name: string;
    status: string;
    memory: string | null;
    images: AdminChapter["images"];
  }>(
    `select c.id, c.slug, c.position, c.allow_draft, c.product_id,
            p.handle, p.name, p.status, p.memory,
            coalesce((select json_agg(json_build_object(
                        'id', i.id, 'kind', i.kind, 'src', i.src, 'width', i.width,
                        'height', i.height, 'alt', i.alt, 'position', i.position) order by i.position)
                      from zuruny_chapter_images i where i.chapter_id = c.id), '[]'::json)
              as images
       from zuruny_chapters c
       join zuruny_products p on p.id = c.product_id
      order by c.position`,
  );

  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    position: r.position,
    allowDraft: r.allow_draft,
    productId: r.product_id,
    productHandle: r.handle,
    productName: r.name,
    productStatus: r.status,
    hasMemory: Boolean(r.memory?.trim()),
    images: r.images,
  }));
}

/** Products with a story but not yet a chapter — what the "add a name" picker offers. */
export async function getChapterCandidates(): Promise<{ id: number; handle: string; name: string }[]> {
  return query(
    `select p.id, p.handle, p.name
       from zuruny_products p
      where p.memory is not null and p.memory <> ''
        and not exists (select 1 from zuruny_chapters c where c.product_id = p.id)
      order by p.name`,
  );
}
