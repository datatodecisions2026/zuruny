import { NextResponse } from "next/server";
import { verifyWebhookSignature, verifyTransaction } from "@/lib/paystack";
import { dbConfigured, query } from "@/lib/db";

/**
 * Paystack webhook.
 *
 * This is the only place an order becomes `paid`. Three things guard it:
 *
 *   1. The raw body is read as text and the HMAC is computed over those exact
 *      bytes. Parsing first and re-serialising would change them and the
 *      signature would never match.
 *   2. The signature is checked before anything else is done with the payload.
 *   3. Even with a valid signature, the transaction is re-verified against
 *      Paystack's API and the amount is compared with what we recorded — a
 *      signed event still should not be trusted to state its own amount.
 *
 * Paystack retries on non-2xx, so anything we cannot process returns 200 with
 * the reason logged rather than trapping us in a retry loop.
 */
export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-paystack-signature");

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "bad signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const reference = event.data?.reference;
  if (event.event !== "charge.success" || !reference) {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (!dbConfigured) {
    console.error("[zuruny] Webhook received but the database is not configured");
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const [order] = await query<{ id: number; status: string; subtotal_cents: number }>(
    "select id, status, subtotal_cents from zuruny_orders where reference = $1",
    [reference],
  );

  if (!order) {
    console.error("[zuruny] Webhook for an unknown order:", reference);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  // Idempotent: Paystack can deliver the same event more than once.
  if (order.status === "paid") {
    return NextResponse.json({ received: true }, { status: 200 });
  }

  const verified = await verifyTransaction(reference);

  if (!verified.paid) {
    console.error("[zuruny] charge.success did not verify:", reference);
    return NextResponse.json({ received: true }, { status: 200 });
  }

  if (verified.amountCents !== order.subtotal_cents) {
    // Underpayment, or a tampered amount. Never fulfil on this.
    console.error(
      `[zuruny] Amount mismatch on ${reference}: paid ${verified.amountCents}, expected ${order.subtotal_cents}`,
    );
    return NextResponse.json({ received: true }, { status: 200 });
  }

  await query("update zuruny_orders set status = 'paid', paid_at = now() where id = $1", [order.id]);

  return NextResponse.json({ received: true }, { status: 200 });
}
