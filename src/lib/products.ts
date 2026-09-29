import "server-only";
import { cache } from "react";
import { dbConfigured, query } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { products as seedProducts, type Product, type ProductKind } from "@/lib/catalog";

/**
 * The catalogue, read from Postgres.
 *
 * `catalog.ts` stays as the seed and as the fallback: if the database is not
 * configured (a fresh clone, a preview without env vars) the site still
 * renders the shop rather than showing an empty store. The database is the
 * source of truth whenever it is reachable.
 *
 * Wrapped in React's `cache` so one request that renders the header, the
 * shop grid and a product page hits the database once, not three times.
 */

export type Row = {
  // Selected so other queries (chapters.ts) can join on it; toProduct() below
  // never reads it, since Product itself has no id — the handle is its key.
  id: number;
  handle: string;
  name: string;
  kind: ProductKind;
  status: "active" | "draft";
  named_after_from: string | null;
  description: string;
  description_fr: string | null;
  memory: string | null;
  pull_quote: string | null;
  position: number;
  zuruny_variants: {
    label: string | null;
    price_cents: number | null;
    stock: number;
    available: boolean;
    position: number;
  }[];
  zuruny_product_images: {
    src: string;
    width: number;
    height: number;
    alt: string;
    position: number;
  }[];
  zuruny_product_spec: {
    label: string;
    value: string;
    label_fr: string | null;
    value_fr: string | null;
    position: number;
  }[];
};

/* One round trip: each child table is folded into a JSON array on its parent,
   under the same column names the Row type above expects. */
const agg = (table: string, cols: string, alias: string) =>
  `coalesce((select json_agg(x order by x.position) from (select ${cols} from ${table} c where c.product_id = p.id) x), '[]'::json) as ${alias}`;

export const SELECT = `
  select p.id, p.handle, p.name, p.kind, p.status, p.named_after_from, p.description,
         p.description_fr, p.memory, p.pull_quote, p.position,
         ${agg("zuruny_variants", "c.label, c.price_cents, c.stock, c.available, c.position", "zuruny_variants")},
         ${agg("zuruny_product_images", "c.src, c.width, c.height, c.alt, c.position", "zuruny_product_images")},
         ${agg("zuruny_product_spec", "c.label, c.value, c.label_fr, c.value_fr, c.position", "zuruny_product_spec")}
    from zuruny_products p`;

export function toProduct(row: Row): Product {
  const by = <T extends { position: number }>(a: T, b: T) => a.position - b.position;

  return {
    handle: row.handle,
    name: row.name,
    kind: row.kind,
    status: row.status,
    namedAfterFrom: row.named_after_from ?? undefined,
    description: row.description,
    descriptionFr: row.description_fr ?? undefined,
    memory: row.memory ?? undefined,
    pullQuote: row.pull_quote ?? undefined,
    spec: [...row.zuruny_product_spec].sort(by).map((s) => ({
      label: s.label,
      value: s.value,
      labelFr: s.label_fr ?? undefined,
      valueFr: s.value_fr ?? undefined,
    })),
    images: [...row.zuruny_product_images].sort(by).map((i) => ({
      src: i.src,
      w: i.width,
      h: i.height,
      alt: i.alt,
    })),
    variants: [...row.zuruny_variants].sort(by).map((v) => ({
      label: v.label,
      priceCents: v.price_cents,
      stock: v.stock,
      available: v.available,
    })),
  };
}

/**
 * Everything the caller is allowed to see: an anonymous visitor gets only
 * `status = 'active'`, an admin gets drafts too.
 */
export const getProducts = cache(async (): Promise<Product[]> => {
  if (!dbConfigured) return seedProducts;

  try {
    const isAdmin = (await getSessionUser())?.isAdmin ?? false;
    const rows = await query<Row>(
      `${SELECT} ${isAdmin ? "" : "where p.status = 'active'"} order by p.position`,
    );
    return rows.map(toProduct);
  } catch (error) {
    /* Falling back keeps the shop up, but it must never be silent. Anything
       that lands here needs investigating — otherwise the site looks fine
       while the admin's edits go nowhere. */
    console.error(
      "[zuruny] Falling back to the seed catalogue — the database read failed:",
      error instanceof Error ? error.message : error,
    );
    return seedProducts;
  }
});

export const getLiveProducts = cache(async (): Promise<Product[]> => {
  return (await getProducts()).filter((p) => p.status === "active");
});

/** The named ones — a person, a memory, a jar. The site's spine. */
export const getNamedProducts = cache(async (): Promise<Product[]> => {
  return (await getLiveProducts()).filter((p) => p.memory);
});

/** The made things — no memory, but the best photography we have. */
export const getObjectProducts = cache(async (): Promise<Product[]> => {
  return (await getLiveProducts()).filter((p) => !p.memory);
});

export const getProduct = cache(
  async (handle: string): Promise<Product | null> => {
    return (await getLiveProducts()).find((p) => p.handle === handle) ?? null;
  },
);
