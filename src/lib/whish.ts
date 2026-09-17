import "server-only";

/**
 * Whish Money (Lebanon) — payment collection.
 *
 * WHAT IS CONFIRMED from Whish's published technical specification:
 *   - REST over HTTPS, with these base URLs:
 *       live    https://whish.money/itel-service/api/
 *       sandbox https://lb.sandbox.whish.money/itel-service/api/
 *   - Every request carries three headers: `channel`, `secret`, `websiteurl`.
 *     The first two are issued by Whish after merchant verification; the third
 *     is the site the integration runs on.
 *   - Every response carries a `status` boolean for success/failure.
 *
 * WHAT IS NOT CONFIRMED: the exact endpoint paths and request field names.
 * Whish sends those in a PDF once the merchant account is verified, and they
 * are not published. Rather than guess and ship something that looks wired up
 * but silently fails, every unconfirmed value is collected in ENDPOINTS below
 * for a one-line correction against that PDF, and the whole module refuses to
 * run until credentials exist.
 *
 * Nothing here ever marks an order paid on its own. Payment state changes only
 * when Whish confirms it.
 */

const BASES = {
  live: "https://whish.money/itel-service/api",
  sandbox: "https://lb.sandbox.whish.money/itel-service/api",
} as const;

/**
 * >>> CONFIRM THESE AGAINST THE WHISH MERCHANT PDF BEFORE GOING LIVE. <<<
 * Paths only — the transport, headers and response envelope above are known.
 */
const ENDPOINTS = {
  collect: "/payment/whish",
  status: "/payment/collect/status",
  rate: "/payment/rate",
  balance: "/payment/account/balance",
} as const;

export type WhishConfig = {
  channel: string;
  secret: string;
  websiteUrl: string;
  base: string;
};

export function getWhishConfig(): WhishConfig | null {
  const channel = process.env.WHISH_CHANNEL;
  const secret = process.env.WHISH_SECRET;
  const websiteUrl = process.env.WHISH_WEBSITE_URL;
  if (!channel || !secret || !websiteUrl) return null;

  const base =
    process.env.WHISH_ENV === "live" ? BASES.live : BASES.sandbox;
  return { channel, secret, websiteUrl, base };
}

/** True when Whish is configured and a payment can actually be opened. */
export function whishConfigured(): boolean {
  return getWhishConfig() !== null;
}

type WhishResponse<T> = {
  status: boolean;
  code?: string;
  dialog?: { title?: string; message?: string };
  data?: T;
};

async function call<T>(
  path: string,
  body: Record<string, unknown>,
): Promise<WhishResponse<T>> {
  const config = getWhishConfig();
  if (!config) {
    throw new Error("Whish is not configured");
  }

  const response = await fetch(`${config.base}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      channel: config.channel,
      secret: config.secret,
      websiteurl: config.websiteUrl,
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Whish responded ${response.status}`);
  }
  return (await response.json()) as WhishResponse<T>;
}

/**
 * Opens a collection and returns the URL to send the payer to.
 *
 * Amounts are passed as a decimal string built from integer cents, so the
 * cents stay the source of truth and no float ever touches a price.
 */
export async function openCollection(input: {
  amountCents: number;
  currency: string;
  reference: string;
  successUrl: string;
  failureUrl: string;
  callbackUrl: string;
}): Promise<{ collectUrl: string | null; raw: unknown }> {
  const result = await call<{ collectUrl?: string; link?: string }>(
    ENDPOINTS.collect,
    {
      amount: (input.amountCents / 100).toFixed(2),
      currency: input.currency,
      invoice: input.reference,
      externalId: input.reference,
      successCallbackUrl: input.successUrl,
      failureCallbackUrl: input.failureUrl,
      successRedirectUrl: input.successUrl,
      failureRedirectUrl: input.failureUrl,
      callbackUrl: input.callbackUrl,
    },
  );

  const data = result.data ?? {};
  return {
    collectUrl: data.collectUrl ?? data.link ?? null,
    raw: result,
  };
}

/** Asks Whish whether a collection has been paid. Never inferred locally. */
export async function getCollectionStatus(
  reference: string,
): Promise<{ paid: boolean; raw: unknown }> {
  const result = await call<{ collectStatus?: string; status?: string }>(
    ENDPOINTS.status,
    { invoice: reference, externalId: reference },
  );

  const state = String(
    result.data?.collectStatus ?? result.data?.status ?? "",
  ).toLowerCase();

  return { paid: result.status === true && state === "success", raw: result };
}
