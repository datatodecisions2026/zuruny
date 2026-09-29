import "server-only";
import { headers } from "next/headers";
import { dbConfigured, query, withTx } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
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
 * The order and its lines are written in one transaction, so a total is never
 * left behind without its lines.
 *
 * Stock is only checked here, not reserved: two checkouts racing for the
 * last unit can both succeed. Low-volume today, so acceptable — a guarded
 * decrement (`UPDATE ... SET stock = stock - $1 WHERE stock >= $1`) is the
 * fix if overselling ever actually happens.
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

  if (!dbConfigured) return { ok: false, error: "not-configured" };

  const user = await getSessionUser();
  if (!user) return { ok: false, error: "not-signed-in" };

  const headerRegion = (await headers()).get(REGION_HEADER);
  const region: Region = isRegion(headerRegion) ? headerRegion : "INTL";

  // Re-read every line from the catalogue.
  const handles = [...new Set(input.lines.map((l) => l.handle))];
  let products: Row[];
  try {
    products = await query<Row>(
      `select p.handle, p.name, p.status,
              coalesce((select json_agg(json_build_object(
                          'label', v.label, 'price_cents', v.price_cents,
                          'stock', v.stock, 'available', v.available))
                        from zuruny_variants v where v.product_id = p.id), '[]'::json)
                as zuruny_variants
         from zuruny_products p where p.handle = any($1)`,
      [handles],
    );
  } catch {
    return { ok: false, error: "failed" };
  }

  const items: {
    product_handle: string;
    product_name: string;
    variant_label: string | null;
    qty: number;
    unit_price_cents: number;
    line_total_cents: number;
  }[] = [];

  for (const line of input.lines) {
    const product = products.find((p) => p.handle === line.handle);
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

  try {
    await withTx(async (c) => {
      const {
        rows: [order],
      } = await c.query<{ id: number }>(
        `insert into zuruny_orders
           (reference, user_id, email, status, region, locale, subtotal_cents, currency,
            shipping_name, shipping_address, shipping_country, shipping_phone)
         values ($1, $2, $3, 'pending_payment', $4, $5, $6, 'USD', $7, $8, $9, $10)
         returning id`,
        [
          reference,
          user.id,
          user.email,
          region,
          input.locale,
          subtotalCents,
          input.shipping.name ?? null,
          input.shipping.address ?? null,
          input.shipping.country ?? null,
          input.shipping.phone ?? null,
        ],
      );
      for (const i of items) {
        await c.query(
          `insert into zuruny_order_items
             (order_id, product_handle, product_name, variant_label, qty, unit_price_cents, line_total_cents)
           values ($1, $2, $3, $4, $5, $6, $7)`,
          [order.id, i.product_handle, i.product_name, i.variant_label, i.qty, i.unit_price_cents, i.line_total_cents],
        );
      }
    });
  } catch (error) {
    console.error("[zuruny] Could not write the order:", error);
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

/** The signed-in customer's own orders. */
export async function getMyOrders(): Promise<OrderSummaryRow[]> {
  const user = await getSessionUser();
  if (!user) return [];

  return query<OrderSummaryRow>(
    `select o.reference, o.status, o.region, o.subtotal_cents, o.created_at,
            coalesce((select json_agg(json_build_object(
                        'product_name', i.product_name, 'variant_label', i.variant_label,
                        'qty', i.qty, 'line_total_cents', i.line_total_cents) order by i.id)
                      from zuruny_order_items i where i.order_id = o.id), '[]'::json)
              as zuruny_order_items
       from zuruny_orders o
      where o.user_id = $1
      order by o.created_at desc`,
    [user.id],
  );
}
