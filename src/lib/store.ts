import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

/**
 * The catalogue has two backends.
 *
 * - **local**: a JSON file in `data/catalog.json`. No accounts, no keys, works
 *   the moment you clone the repo. This is the default, and what the CMS runs
 *   on while you are building.
 * - **supabase**: used only when SUPABASE_SECRET_KEY is present. Needed in
 *   production, because Vercel's filesystem is read-only at runtime, so file
 *   writes would silently vanish.
 *
 * Both speak the same shape, so nothing above this file knows the difference.
 */

export type VariantRow = {
  id: number;
  title: string;
  price_cents: number;
  currency: string;
  inventory: number;
  available: boolean;
  position: number;
};

export type ImageRow = {
  id: number;
  url: string;
  alt: string | null;
  position: number;
};

export type ProductRow = {
  id: number;
  handle: string;
  title: string;
  kind: string;
  village: string | null;
  description: string | null;
  story: string | null;
  pull_quote: string | null;
  spec: { label: string; value: string }[];
  status: "draft" | "active" | "archived";
  position: number;
  variants: VariantRow[];
  images: ImageRow[];
};

export const usingSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SECRET_KEY);

export const backendName = () => (usingSupabase() ? "Supabase" : "local file");

/* ------------------------------------------------------------------ local */

const FILE = path.join(process.cwd(), "data", "catalog.json");

async function readFile(): Promise<ProductRow[]> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as ProductRow[];
  } catch {
    return [];
  }
}

async function writeFile(rows: ProductRow[]) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  await fs.writeFile(FILE, JSON.stringify(rows, null, 2) + "\n", "utf8");
}

const nextId = (nums: number[]) => (nums.length ? Math.max(...nums) + 1 : 1);

/* --------------------------------------------------------------- supabase */

function sb() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { persistSession: false } },
  );
}

const SELECT =
  "id, handle, title, kind, village, description, story, pull_quote, spec, status, position, " +
  "zuruny_product_variants (id, title, price_cents, currency, inventory, available, position), " +
  "zuruny_product_images (id, url, alt, position)";

type SbRow = Omit<ProductRow, "variants" | "images"> & {
  zuruny_product_variants: VariantRow[];
  zuruny_product_images: ImageRow[];
};

const fromSb = (r: SbRow): ProductRow => ({
  ...r,
  spec: r.spec ?? [],
  variants: [...(r.zuruny_product_variants ?? [])].sort(
    (a, b) => a.position - b.position,
  ),
  images: [...(r.zuruny_product_images ?? [])].sort(
    (a, b) => a.position - b.position,
  ),
});

/* ------------------------------------------------------------------- api */

export async function listProducts(): Promise<ProductRow[]> {
  if (!usingSupabase()) {
    return (await readFile()).sort((a, b) => a.position - b.position);
  }
  const { data } = await sb()
    .from("zuruny_products")
    .select(SELECT)
    .order("position");
  return ((data ?? []) as unknown as SbRow[]).map(fromSb);
}

export async function getProductRow(handle: string): Promise<ProductRow | null> {
  if (!usingSupabase()) {
    return (await readFile()).find((p) => p.handle === handle) ?? null;
  }
  const { data } = await sb()
    .from("zuruny_products")
    .select(SELECT)
    .eq("handle", handle)
    .maybeSingle();
  return data ? fromSb(data as unknown as SbRow) : null;
}

export async function insertProduct(input: {
  handle: string;
  title: string;
  kind: string;
}): Promise<{ handle?: string; error?: string }> {
  if (!usingSupabase()) {
    const rows = await readFile();
    if (rows.some((r) => r.handle === input.handle)) {
      return { error: `A product with the web address “${input.handle}” already exists.` };
    }
    rows.push({
      id: nextId(rows.map((r) => r.id)),
      handle: input.handle,
      title: input.title,
      kind: input.kind,
      village: null,
      description: null,
      story: null,
      pull_quote: null,
      spec: [],
      status: "draft",
      position: rows.length,
      variants: [],
      images: [],
    });
    await writeFile(rows);
    return { handle: input.handle };
  }

  const { data, error } = await sb()
    .from("zuruny_products")
    .insert({ ...input, status: "draft", position: 999 })
    .select("handle")
    .single();
  if (error) {
    return {
      error:
        error.code === "23505"
          ? `A product with the web address “${input.handle}” already exists.`
          : error.message,
    };
  }
  return { handle: data.handle };
}

export async function patchProduct(
  id: number,
  patch: Partial<ProductRow>,
): Promise<{ handle?: string; error?: string }> {
  if (!usingSupabase()) {
    const rows = await readFile();
    const row = rows.find((r) => r.id === id);
    if (!row) return { error: "That product no longer exists." };
    Object.assign(row, patch);
    await writeFile(rows);
    return { handle: row.handle };
  }
  const { data, error } = await sb()
    .from("zuruny_products")
    .update(patch)
    .eq("id", id)
    .select("handle")
    .single();
  return error ? { error: error.message } : { handle: data.handle };
}

export async function removeProduct(id: number) {
  if (!usingSupabase()) {
    await writeFile((await readFile()).filter((r) => r.id !== id));
    return;
  }
  await sb().from("zuruny_products").delete().eq("id", id);
}

export async function upsertVariant(
  productId: number,
  variant: Omit<VariantRow, "id" | "currency"> & { id?: number | null },
): Promise<{ error?: string }> {
  if (!usingSupabase()) {
    const rows = await readFile();
    const row = rows.find((r) => r.id === productId);
    if (!row) return { error: "That product no longer exists." };
    const clash = row.variants.find(
      (v) => v.title === variant.title && v.id !== variant.id,
    );
    if (clash) return { error: "That size already exists on this product." };

    if (variant.id) {
      const existing = row.variants.find((v) => v.id === variant.id);
      if (existing) Object.assign(existing, variant);
    } else {
      const ids = rows.flatMap((r) => r.variants.map((v) => v.id));
      row.variants.push({ ...variant, id: nextId(ids), currency: "USD" });
    }
    await writeFile(rows);
    return {};
  }

  const payload = { ...variant, product_id: productId };
  delete (payload as { id?: number | null }).id;
  const { error } = variant.id
    ? await sb().from("zuruny_product_variants").update(payload).eq("id", variant.id)
    : await sb().from("zuruny_product_variants").insert(payload);
  if (!error) return {};
  return {
    error:
      error.code === "23505"
        ? "That size already exists on this product."
        : error.message,
  };
}

export async function removeVariant(id: number) {
  if (!usingSupabase()) {
    const rows = await readFile();
    rows.forEach((r) => (r.variants = r.variants.filter((v) => v.id !== id)));
    await writeFile(rows);
    return;
  }
  await sb().from("zuruny_product_variants").delete().eq("id", id);
}

export async function insertImage(
  productId: number,
  image: Omit<ImageRow, "id">,
): Promise<{ error?: string }> {
  if (!usingSupabase()) {
    const rows = await readFile();
    const row = rows.find((r) => r.id === productId);
    if (!row) return { error: "That product no longer exists." };
    const ids = rows.flatMap((r) => r.images.map((i) => i.id));
    row.images.push({ ...image, id: nextId(ids) });
    await writeFile(rows);
    return {};
  }
  const { error } = await sb()
    .from("zuruny_product_images")
    .insert({ ...image, product_id: productId });
  return error ? { error: error.message } : {};
}

export async function removeImage(id: number) {
  if (!usingSupabase()) {
    const rows = await readFile();
    rows.forEach((r) => (r.images = r.images.filter((i) => i.id !== id)));
    await writeFile(rows);
    return;
  }
  await sb().from("zuruny_product_images").delete().eq("id", id);
}
