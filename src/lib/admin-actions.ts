"use server";

import { revalidatePath } from "next/cache";
import { query, withTx } from "@/lib/db";
import { getSessionAdmin } from "@/lib/admin-auth";
import { toHandle } from "@/lib/slug";

export type AdminState = { error: string | null; message: string | null };

/**
 * Product editing for the shop owner.
 *
 * Every action starts with requireAdmin(). There is no row-level security
 * behind it any more, so this check IS the boundary: a new action that skips
 * it is open to everyone.
 */
async function requireAdmin(): Promise<boolean> {
  return Boolean(await getSessionAdmin());
}

function refresh() {
  // Products appear in the header count, the shop, the home page and the
  // product pages, so the whole tree is revalidated rather than one route.
  revalidatePath("/", "layout");
}

function parsePriceToCents(raw: string): number | null {
  const trimmed = raw.trim();
  if (trimmed === "") return null;
  const value = Number(trimmed.replace(",", "."));
  if (!Number.isFinite(value) || value < 0) return null;
  // Round once, here, into integer cents. Never store a float.
  return Math.round(value * 100);
}

export async function createProduct(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await requireAdmin())) return { error: "Not allowed.", message: null };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the product a name.", message: null };

  const handle = toHandle(String(formData.get("handle") ?? "") || name);
  if (!handle) return { error: "That name makes an empty URL.", message: null };

  const kind = String(formData.get("kind") ?? "olive-oil");
  const priceRaw = String(formData.get("price") ?? "");
  const priceCents = parsePriceToCents(priceRaw);
  const stock = Math.max(0, Math.floor(Number(formData.get("stock") ?? 0) || 0));

  try {
    await withTx(async (c) => {
      const {
        rows: [product],
      } = await c.query<{ id: number }>(
        `insert into zuruny_products
           (handle, name, kind, status, description, description_fr,
            named_after_from, memory, pull_quote, position)
         values ($1, $2, $3, 'draft', $4, $5, $6, $7, $8, 999)
         returning id`,
        [
          handle,
          name,
          kind,
          String(formData.get("description") ?? "").trim(),
          String(formData.get("description_fr") ?? "").trim() || null,
          String(formData.get("named_after_from") ?? "").trim() || null,
          String(formData.get("memory") ?? "").trim() || null,
          String(formData.get("pull_quote") ?? "").trim() || null,
        ],
      );
      // New products start as drafts. Publishing is a separate, deliberate act.
      // A product with no variant can never be priced or sold, so both rows
      // are written together or not at all.
      await c.query(
        `insert into zuruny_variants (product_id, label, price_cents, stock, available)
         values ($1, null, $2, $3, $4)`,
        [product.id, priceCents, stock, stock > 0],
      );
    });
  } catch (error) {
    if ((error as { code?: string }).code === "23505") {
      return { error: `A product already uses the URL "${handle}".`, message: null };
    }
    // A CHECK violation here means the kind was not one of the allowed values.
    return { error: "Could not create that product.", message: null };
  }

  refresh();
  return { error: null, message: `Added "${name}" as a draft.` };
}

export async function updateProduct(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await requireAdmin())) return { error: "Not allowed.", message: null };

  const handle = String(formData.get("handle") ?? "");
  const [product] = await query<{ id: number; name: string }>(
    "select id, name from zuruny_products where handle = $1",
    [handle],
  );
  if (!product) return { error: "That product no longer exists.", message: null };

  const status = String(formData.get("status") ?? "draft");
  // Price and stock live on the first variant for single-size products.
  const priceCents = parsePriceToCents(String(formData.get("price") ?? ""));
  const stock = Math.max(0, Math.floor(Number(formData.get("stock") ?? 0) || 0));
  const variantId = Number(formData.get("variant_id") ?? "");

  try {
    await withTx(async (c) => {
      await c.query(
        `update zuruny_products
            set name = $1, status = $2, description = $3, description_fr = $4,
                named_after_from = $5, memory = $6, pull_quote = $7
          where id = $8`,
        [
          String(formData.get("name") ?? "").trim() || product.name,
          status === "active" ? "active" : "draft",
          String(formData.get("description") ?? "").trim(),
          String(formData.get("description_fr") ?? "").trim() || null,
          String(formData.get("named_after_from") ?? "").trim() || null,
          String(formData.get("memory") ?? "").trim() || null,
          String(formData.get("pull_quote") ?? "").trim() || null,
          product.id,
        ],
      );
      if (variantId) {
        /* Out of stock is expressed as stock 0, so availability follows it
           rather than being a second switch that can disagree. The product id
           in the WHERE stops a forged variant_id editing someone else's row. */
        await c.query(
          `update zuruny_variants set price_cents = $1, stock = $2, available = $3
            where id = $4 and product_id = $5`,
          [priceCents, stock, stock > 0, variantId, product.id],
        );
      }
    });
  } catch {
    return { error: "Could not save that change.", message: null };
  }

  refresh();
  return { error: null, message: "Saved." };
}

export async function deleteProduct(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  if (!(await requireAdmin())) return { error: "Not allowed.", message: null };

  const handle = String(formData.get("handle") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  // Deleting a product removes its variants, images and spec by cascade, and
  // cannot be undone from here — so the owner types the name to mean it.
  if (confirm.trim().toLowerCase() !== handle.toLowerCase()) {
    return {
      error: `Type the URL "${handle}" to confirm deletion.`,
      message: null,
    };
  }

  try {
    await query("delete from zuruny_products where handle = $1", [handle]);
  } catch {
    return { error: "Could not delete that product.", message: null };
  }

  refresh();
  return { error: null, message: `Deleted "${handle}".` };
}
