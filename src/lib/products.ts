import "server-only";
import { cache } from "react";
import { getSupabaseServer, supabaseConfigured } from "@/lib/supabase/server";
import { products as seedProducts, type Product, type ProductKind } from "@/lib/catalog";

/**
 * The catalogue, read from Supabase.
 *
 * `catalog.ts` stays as the seed and as the fallback: if Supabase is not
 * configured (a fresh clone, a preview without env vars) the site still
 * renders the shop rather than showing an empty store. The database is the
 * source of truth whenever it is reachable.
 *
 * Wrapped in React's `cache` so one request that renders the header, the
 * shop grid and a product page hits the database once, not three times.
 */

type Row = {
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

const SELECT =
  "handle, name, kind, status, named_after_from, description, description_fr, memory, pull_quote, position, " +
  "zuruny_variants(label, price_cents, stock, available, position), " +
  "zuruny_product_images(src, width, height, alt, position), " +
  "zuruny_product_spec(label, value, label_fr, value_fr, position)";

function toProduct(row: Row): Product {
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
 * Everything the caller is allowed to see. RLS decides that: an anonymous
 * visitor gets only `status = 'active'`, an admin gets drafts too.
 */
export const getProducts = cache(async (): Promise<Product[]> => {
  if (!supabaseConfigured) return seedProducts;

  const supabase = await getSupabaseServer();
  if (!supabase) return seedProducts;

  const { data, error } = await supabase
    .from("zuruny_products")
    .select(SELECT)
    .order("position");

  if (error || !data) {
    /* Falling back keeps the shop up, but it must never be silent. An RLS
       mistake once made every product unreadable and this fallback served
       the seed file instead — so the site looked fine while the admin's
       edits went nowhere. Anything that lands here needs investigating. */
    console.error(
      "[zuruny] Falling back to the seed catalogue — the database read failed:",
      error?.message ?? "no rows returned",
    );
    return seedProducts;
  }
  return (data as unknown as Row[]).map(toProduct);
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
