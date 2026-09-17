"use server";

import { headers } from "next/headers";
import { placeOrder, type BasketLine } from "@/lib/orders";
import { getSupabaseAdmin } from "@/lib/supabase/server";
import { initializeTransaction, paystackConfigured } from "@/lib/paystack";
import { localePath, type Locale } from "@/lib/i18n";

export type CheckoutResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

/**
 * Basket to payment.
 *
 * The browser sends only handles, variants and quantities. Everything that
 * decides money — unit prices, the delivery region, the total — is resolved
 * server-side in placeOrder() and then handed to Paystack. The amount charged
 * is therefore never a number the client chose.
 */
export async function startCheckout(input: {
  lines: BasketLine[];
  locale: Locale;
  shipping: {
    name?: string;
    address?: string;
    country?: string;
    phone?: string;
  };
}): Promise<CheckoutResult> {
  if (!paystackConfigured()) {
    return { ok: false, error: "not-configured" };
  }

  const result = await placeOrder(input);
  if (!result.ok) return { ok: false, error: result.error };

  const { reference, subtotalCents } = result.order;

  const host = (await headers()).get("host");
  const proto = host?.startsWith("localhost") ? "http" : "https";
  const origin = `${proto}://${host}`;
  const callbackUrl = `${origin}${localePath(input.locale, `/order/${reference}`)}`;

  const admin = getSupabaseAdmin();

  try {
    const { authorizationUrl, message } = await initializeTransaction({
      email: result.order.email,
      amountCents: subtotalCents,
      reference,
      callbackUrl,
      metadata: { order_reference: reference, region: result.order.region },
    });

    if (!authorizationUrl) {
      // The order exists but no payment could be opened for it. Mark it so it
      // does not sit in pending_payment forever looking like an abandoned sale.
      await admin
        ?.from("zuruny_orders")
        .update({ status: "failed" })
        .eq("reference", reference);
      console.error("[zuruny] Paystack did not return a checkout URL:", message);
      return { ok: false, error: "payment-unavailable" };
    }

    await admin
      ?.from("zuruny_orders")
      .update({ payment_provider: "paystack", payment_reference: reference })
      .eq("reference", reference);

    return { ok: true, redirectTo: authorizationUrl };
  } catch (error) {
    await admin
      ?.from("zuruny_orders")
      .update({ status: "failed" })
      .eq("reference", reference);
    console.error("[zuruny] Paystack initialize threw:", error);
    return { ok: false, error: "payment-unavailable" };
  }
}
