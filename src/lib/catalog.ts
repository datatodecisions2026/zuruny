import { listProducts, getProductRow, type ProductRow } from "@/lib/store";
import { people, objectNotes } from "@/data/site";

/**
 * Zuruny's own catalogue.
 *
 * Rows come from whichever backend store.ts picked — a local JSON file by
 * default, Supabase when its key is present. Only active products are exposed
 * here; drafts stay invisible to the storefront.
 *
 * Money is stored as integer minor units and only becomes a decimal at the edge
 * of the system, in `money()`.
 */

export type Variant = {
  id: number;
  title: string;
  priceCents: number;
  currency: string;
  inventory: number;
  available: boolean;
};

export type Product = {
  id: number;
  handle: string;
  title: string;
  name: string;
  kind: string;
  village: string | null;
  description: string | null;
  story: string | null;
  pullQuote: string | null;
  spec: { label: string; value: string }[];
  status: "draft" | "active" | "archived";
  variants: Variant[];
  images: string[];
  note?: string;
  /** No sellable price set yet, so it must not be offered for sale. */
  unpriced: boolean;
};

const NOTE_BY_HANDLE: Record<string, string> = {
  "bri2-zeit": objectNotes[0].body,
  tantour: objectNotes[1].body,
  costers: objectNotes[2].body,
};

function toProductFromRow(row: ProductRow): Product {
  // Editorial written before the catalogue existed still lives in site.ts; a
  // row's own story/pull quote wins once it has been filled in.
  const editorial = people.find((p) => p.handle === row.handle);
  const variants = row.variants.map((v) => ({
    id: v.id,
    title: v.title,
    priceCents: v.price_cents,
    currency: v.currency,
    inventory: v.inventory,
    available: v.available && v.inventory > 0,
  }));

  return {
    id: row.id,
    handle: row.handle,
    title: row.title,
    name: row.title,
    kind: row.kind,
    village: row.village ?? editorial?.village ?? null,
    description: row.description,
    story: row.story ?? editorial?.memory ?? null,
    pullQuote: row.pull_quote ?? editorial?.pull ?? null,
    spec: row.spec?.length ? row.spec : (editorial?.spec ?? []),
    status: row.status,
    variants,
    images: row.images.map((i) => i.url),
    note: NOTE_BY_HANDLE[row.handle],
    unpriced: variants.every((v) => v.priceCents <= 0),
  };
}

export async function getProducts(): Promise<Product[]> {
  const rows = await listProducts();
  return rows.filter((r) => r.status === 'active').map(toProductFromRow);
}

export async function getProduct(handle: string): Promise<Product | undefined> {
  const row = await getProductRow(handle);
  if (!row || row.status !== 'active') return undefined;
  return toProductFromRow(row);
}

export { money } from "@/lib/money";
