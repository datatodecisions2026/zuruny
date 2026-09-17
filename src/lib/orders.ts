import "server-only";
import { headers } from "next/headers";
import { getSupabaseServer, getSupabaseAdmin } from "@/lib/supabase/server";
import { REGION_HEADER, isRegion, priceForRegion, type Region } from "@/lib/region";
import type { Locale } from "@/lib/i18n";

export type BasketLine = {
  handle: string;
  variantLabel: string | null;
  qty: number;
};

export type PlacedOrder = {
  reference: string;
  subtotalCents: number;
  region: Region;
  /* Taken from the authenticated session, never from the form — the payment
     receipt must go to the account that placed the order. */
  email: string;
};

export type OrderResult =
  | { ok: true; order: PlacedOrder }
  | { ok: false; error: "not-configured" | "not-signed-in" | "empty" | "unavailable" | "failed" };

/** A short, human-readable reference the customer and Paystack both quote. */
function newReference(): string {
  const now = new Date();
  const stamp =
    now.getUTCFullYear().toString().slice(2) +
    String(now.getUTCMonth() + 1).padStart(2, "0") +
    String(now.getUTCDate()).padStart(2, "0");
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `ZRN-${stamp}-${rand}`;
}

/**
 * Turns a basket into an order.
 *
 * Everything that decides money is resolved here, on the server:
 *
 *   - Unit prices are read from the database, never from the request. The
 *     browser sends only a handle, a variant and a quantity.
 *   - The delivery region comes from the detected header, not the payload, so
 *     a crafted request cannot buy international stock at Lebanon prices.
 *   - Availability, stock and "has a price at all" are re-checked, because the
 *     basket in someone's browser may be hours old.
 *
 * The order is written with the service role precisely so that `authenticated`
 * has no INSERT policy on zuruny_orders — a client cannot write its own totals.
 */
export async function placeOrder(input: {
  lines: BasketLine[];
  locale: Locale;
  shipping: {
    name?: string;
    address?: string;
    country?: string;
    phone?: string;
  };
}): Promise<OrderResult> {
  if (input.lines.length === 0) return { ok: false, error: "empty" };

  const admin = getSupabaseAdmin();
  const supabase = await getSupabaseServer();
  if (!admin || !supabase) return { ok: false, error: "not-configured" };

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "not-signed-in" };

  const headerRegion = (await headers()).get(REGION_HEADER);
  const region: Region = isRegion(headerRegion) ? headerRegion : "INTL";

  // Re-read every line from the catalogue.
  const handles = [...new Set(input.lines.map((l) => l.handle))];
  const { data: products, error } = await admin
    .from("zuruny_products")
    .select("handle, name, status, zuruny_variants(label, price_cents, stock, available)")
    .in("handle", handles);

  if (error || !products) return { ok: false, error: "failed" };

  type Row = {
    handle: string;
    name: string;
    status: string;
    zuruny_variants: {
      label: string | null;
      price_cents: number | null;
      stock: number;
      available: boolean;
    }[];
  };

  const items: {
    product_handle: string;
    product_name: string;
    variant_label: string | null;
    qty: number;
    unit_price_cents: number;
    line_total_cents: number;
  }[] = [];

  for (const line of input.lines) {
    const product = (products as Row[]).find((p) => p.handle === line.handle);
    if (!product || product.status !== "active") {
      return { ok: false, error: "unavailable" };
    }

    const variant = product.zuruny_variants.find(
      (v) => (v.label ?? null) === line.variantLabel,
    );
    if (
      !variant ||
      variant.price_cents === null ||
      !variant.available ||
      variant.stock <= 0
    ) {
      return { ok: false, error: "unavailable" };
    }

    const qty = Math.max(1, Math.min(Math.floor(line.qty), variant.stock));
    const unit = priceForRegion(variant.price_cents, region);

    items.push({
      product_handle: product.handle,
      product_name: product.name,
      variant_label: variant.label ?? null,
      qty,
      unit_price_cents: unit,
      line_total_cents: unit * qty,
    });
  }

  const subtotalCents = items.reduce((sum, i) => sum + i.line_total_cents, 0);
  const reference = newReference();

  const { data: order, error: orderError } = await admin
    .from("zuruny_orders")
    .insert({
      reference,
      user_id: user.id,
      email: user.email,
      status: "pending_payment",
      region,
      locale: input.locale,
      subtotal_cents: subtotalCents,
      currency: "USD",
      shipping_name: input.shipping.name ?? null,
      shipping_address: input.shipping.address ?? null,
      shipping_country: input.shipping.country ?? null,
      shipping_phone: input.shipping.phone ?? null,
    })
    .select("id, reference")
    .single();

  if (orderError || !order) return { ok: false, error: "failed" };

  const { error: itemsError } = await admin
    .from("zuruny_order_items")
    .insert(items.map((i) => ({ ...i, order_id: order.id })));

  if (itemsError) {
    // Never leave a total with no lines behind it.
    await admin.from("zuruny_orders").delete().eq("id", order.id);
    return { ok: false, error: "failed" };
  }

  return {
    ok: true,
    order: { reference, subtotalCents, region, email: user.email ?? "" },
  };
}

export type OrderSummaryRow = {
  reference: string;
  status: string;
  region: string;
  subtotal_cents: number;
  created_at: string;
  zuruny_order_items: {
    product_name: string;
    variant_label: string | null;
    qty: number;
    line_total_cents: number;
  }[];
};

/** The signed-in customer's own orders. RLS does the filtering, not this query. */
export async function getMyOrders(): Promise<OrderSummaryRow[]> {
  const supabase = await getSupabaseServer();
  if (!supabase) return [];

  const { data } = await supabase
    .from("zuruny_orders")
    .select(
      "reference, status, region, subtotal_cents, created_at, zuruny_order_items(product_name, variant_label, qty, line_total_cents)",
    )
    .order("created_at", { ascending: false });

  return (data as OrderSummaryRow[] | null) ?? [];
}
