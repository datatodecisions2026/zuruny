"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";
import { getSessionUser } from "@/lib/auth";

export type AdminState = { error: string | null; message: string | null };

/**
 * Product editing for the shop owner.
 *
 * These run as the signed-in user, NOT with the service role, so every write
 * passes through the zuruny_*_admin_write RLS policies. The role check below
 * is a courtesy that produces a readable message — the database is the actual
 * boundary, and it would refuse a customer even if this check were removed.
 */
async function requireAdmin() {
  const user = await getSessionUser();
  if (!user?.isAdmin) return null;
  return getSupabaseServer();
}

function refresh() {
  // Products appear in the header count, the shop, the home page and the
  // product pages, so the whole tree is revalidated rather than one route.
  revalidatePath("/", "layout");
}

/** Slug from a name, so the owner never has to think about URLs. */
function toHandle(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
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
  const supabase = await requireAdmin();
  if (!supabase) return { error: "Not allowed.", message: null };

  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Give the product a name.", message: null };

  const handle = toHandle(String(formData.get("handle") ?? "") || name);
  if (!handle) return { error: "That name makes an empty URL.", message: null };

  const kind = String(formData.get("kind") ?? "olive-oil");
  const priceRaw = String(formData.get("price") ?? "");
  const priceCents = parsePriceToCents(priceRaw);
  const stock = Math.max(0, Math.floor(Number(formData.get("stock") ?? 0) || 0));

  const { data: product, error } = await supabase
    .from("zuruny_products")
    .insert({
      handle,
      name,
      kind,
      // New products start as drafts. Publishing is a separate, deliberate act.
      status: "draft",
      description: String(formData.get("description") ?? "").trim(),
      description_fr: String(formData.get("description_fr") ?? "").trim() || null,
      position: 999,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: `A product already uses the URL "${handle}".`, message: null };
    }
    return { error: "Could not create that product.", message: null };
  }

  const { error: variantError } = await supabase.from("zuruny_variants").insert({
    product_id: product.id,
    label: null,
    price_cents: priceCents,
    stock,
    available: stock > 0,
  });

  if (variantError) {
    // A product with no variant can never be priced or sold; don't leave one.
    await supabase.from("zuruny_products").delete().eq("id", product.id);
    return { error: "Could not create that product.", message: null };
  }

  refresh();
  return { error: null, message: `Added "${name}" as a draft.` };
}

export async function updateProduct(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "Not allowed.", message: null };

  const handle = String(formData.get("handle") ?? "");
  const { data: product, error: findError } = await supabase
    .from("zuruny_products")
    .select("id, name")
    .eq("handle", handle)
    .single();

  if (findError || !product) {
    return { error: "That product no longer exists.", message: null };
  }

  const status = String(formData.get("status") ?? "draft");
  const { error } = await supabase
    .from("zuruny_products")
    .update({
      name: String(formData.get("name") ?? "").trim() || product.name,
      status: status === "active" ? "active" : "draft",
      description: String(formData.get("description") ?? "").trim(),
      description_fr: String(formData.get("description_fr") ?? "").trim() || null,
    })
    .eq("id", product.id);

  if (error) return { error: "Could not save that change.", message: null };

  // Price and stock live on the first variant for single-size products.
  const priceCents = parsePriceToCents(String(formData.get("price") ?? ""));
  const stock = Math.max(0, Math.floor(Number(formData.get("stock") ?? 0) || 0));
  const variantId = String(formData.get("variant_id") ?? "");

  if (variantId) {
    const { error: variantError } = await supabase
      .from("zuruny_variants")
      .update({
        price_cents: priceCents,
        stock,
        // Out of stock is expressed as stock 0, so availability follows it
        // rather than being a second switch that can disagree.
        available: stock > 0,
      })
      .eq("id", Number(variantId));

    if (variantError) {
      return { error: "Saved the product, but not the price.", message: null };
    }
  }

  refresh();
  return { error: null, message: "Saved." };
}

export async function deleteProduct(
  _prev: AdminState,
  formData: FormData,
): Promise<AdminState> {
  const supabase = await requireAdmin();
  if (!supabase) return { error: "Not allowed.", message: null };

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

  const { error } = await supabase
    .from("zuruny_products")
    .delete()
    .eq("handle", handle);

  if (error) return { error: "Could not delete that product.", message: null };

  refresh();
  return { error: null, message: `Deleted "${handle}".` };
}
