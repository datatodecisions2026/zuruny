/**
 * Regional pricing.
 *
 * Zuruny quotes one base price in USD. Inside Lebanon that is what you pay.
 * Outside Lebanon it is multiplied, to cover export, freight and handling.
 *
 * The region is DETECTED and is not a user preference. There is deliberately
 * no switch: if a visitor could pick their own region, anyone abroad would
 * simply choose Lebanon and pay 40% of the asking price. It is resolved once
 * per request in the proxy from the visitor's country and passed down as a
 * request header.
 *
 * The multiplier is applied to integer cents and rounded once, here. Nothing
 * else in the codebase is allowed to do price arithmetic — that is how you end
 * up with a basket that disagrees with a product page by a cent.
 */

export const REGIONS = ["LB", "INTL"] as const;
export type Region = (typeof REGIONS)[number];

/** Set by the proxy on every request; read by the server components. */
export const REGION_HEADER = "x-zuruny-region";

/** Outside Lebanon, everything is 2.5x the Lebanon price. */
export const INTL_MULTIPLIER = 2.5;

export function isRegion(value: unknown): value is Region {
  return (
    typeof value === "string" && (REGIONS as readonly string[]).includes(value)
  );
}

/**
 * The only place a price is converted. Takes base (Lebanon) cents, returns
 * cents for the region. Rounded to the nearest cent, never a float.
 */
export function priceForRegion(baseCents: number, region: Region): number {
  if (region === "LB") return baseCents;
  return Math.round(baseCents * INTL_MULTIPLIER);
}

/** Nullable passthrough, for products with no price set. */
export function maybePriceForRegion(
  baseCents: number | null,
  region: Region,
): number | null {
  return baseCents === null ? null : priceForRegion(baseCents, region);
}

/**
 * Headers that carry the visitor's country, in priority order.
 *
 * Deliberately not tied to one host. `x-vercel-ip-country` only exists on
 * Vercel; deploying anywhere else made every request fall through to
 * international, which silently charges Lebanese customers 2.5x. Cloudflare
 * sets `cf-ipcountry`, and several reverse proxies can be configured to set
 * one of the generic names.
 */
const COUNTRY_HEADERS = [
  "x-vercel-ip-country",
  "cf-ipcountry",
  "x-geo-country",
  "x-country-code",
] as const;

/**
 * Only Lebanon gets local pricing. Anything unknown falls through to
 * international — the safer default, since under-quoting means eating the
 * freight difference on a real order.
 */
export function regionFromCountry(country: string | null | undefined): Region {
  return country?.trim().toUpperCase() === "LB" ? "LB" : "INTL";
}

/**
 * Reads the country from whichever header the current host provides.
 *
 * Returns the region AND whether a country was actually found, because
 * "nobody told us" and "we were told it is France" both produce INTL and only
 * one of them is a misconfiguration worth shouting about.
 */
export function detectRegion(headers: Headers): {
  region: Region;
  country: string | null;
  headerUsed: string | null;
} {
  for (const name of COUNTRY_HEADERS) {
    const value = headers.get(name)?.trim();
    // Cloudflare sends "XX" for anonymising proxies and "T1" for Tor.
    if (value && value.length === 2 && !["XX", "T1"].includes(value.toUpperCase())) {
      return { region: regionFromCountry(value), country: value.toUpperCase(), headerUsed: name };
    }
  }
  return { region: "INTL", country: null, headerUsed: null };
}
