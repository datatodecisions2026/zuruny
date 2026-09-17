import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Paystack.
 *
 * Amounts are passed in the currency's smallest unit, which for USD is cents —
 * exactly how prices are already stored, so no conversion and no float ever
 * enters the payment path.
 *
 * Merchant-country note: Paystack registers businesses in Nigeria, Ghana,
 * South Africa and Kenya (Côte d'Ivoire, Egypt and Rwanda in beta). A
 * Lebanese entity cannot hold the merchant account; the merchant of record
 * must be in a supported country. Customers may pay from anywhere.
 */

const BASE = "https://api.paystack.co";

export type PaystackConfig = {
  secretKey: string;
  publicKey: string | null;
  currency: string;
};

export function getPaystackConfig(): PaystackConfig | null {
  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return null;
  return {
    secretKey,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? null,
    // USD needs international payments enabled on the account. NGN, GHS, ZAR
    // and KES are the domestic settlement currencies.
    currency: process.env.PAYSTACK_CURRENCY || "USD",
  };
}

export function paystackConfigured(): boolean {
  return getPaystackConfig() !== null;
}

/** Live keys start sk_live_; anything else is a test key. */
export function paystackIsLive(): boolean {
  return (process.env.PAYSTACK_SECRET_KEY ?? "").startsWith("sk_live_");
}

type Envelope<T> = { status: boolean; message: string; data?: T };

async function call<T>(
  path: string,
  init: { method: "GET" | "POST"; body?: unknown },
): Promise<Envelope<T>> {
  const config = getPaystackConfig();
  if (!config) throw new Error("Paystack is not configured");

  const response = await fetch(`${BASE}${path}`, {
    method: init.method,
    headers: {
      Authorization: `Bearer ${config.secretKey}`,
      "Content-Type": "application/json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    cache: "no-store",
  });

  const json = (await response.json()) as Envelope<T>;
  return json;
}

/**
 * Opens a transaction and returns the hosted checkout URL.
 *
 * `reference` is our own order reference, so a Paystack webhook can always be
 * matched back to an order without a second lookup table.
 */
export async function initializeTransaction(input: {
  email: string;
  amountCents: number;
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorizationUrl: string | null; message: string }> {
  const config = getPaystackConfig();
  if (!config) throw new Error("Paystack is not configured");

  const result = await call<{
    authorization_url: string;
    access_code: string;
    reference: string;
  }>("/transaction/initialize", {
    method: "POST",
    body: {
      email: input.email,
      // Smallest currency unit. Our cents are already that for USD.
      amount: input.amountCents,
      currency: config.currency,
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata ?? {},
    },
  });

  return {
    authorizationUrl: result.data?.authorization_url ?? null,
    message: result.message,
  };
}

export type VerifiedTransaction = {
  paid: boolean;
  amountCents: number | null;
  currency: string | null;
  status: string | null;
};

/**
 * Asks Paystack what actually happened. An order is never marked paid on the
 * strength of a redirect — a customer can reach the success URL without
 * having paid by simply visiting it.
 */
export async function verifyTransaction(
  reference: string,
): Promise<VerifiedTransaction> {
  const result = await call<{
    status: string;
    amount: number;
    currency: string;
  }>(`/transaction/verify/${encodeURIComponent(reference)}`, {
    method: "GET",
  });

  const data = result.data;
  return {
    paid: result.status === true && data?.status === "success",
    amountCents: data?.amount ?? null,
    currency: data?.currency ?? null,
    status: data?.status ?? null,
  };
}

/**
 * Webhook authenticity.
 *
 * Paystack signs the RAW request body with the secret key using HMAC SHA-512
 * and sends it as `x-paystack-signature`. The body must be verified exactly as
 * received — parsing and re-serialising it changes the bytes and the signature
 * will never match.
 *
 * Compared with a constant-time comparison so the check cannot be probed a
 * byte at a time.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  const config = getPaystackConfig();
  if (!config || !signature) return false;

  const expected = createHmac("sha512", config.secretKey)
    .update(rawBody, "utf8")
    .digest("hex");

  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(signature, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
