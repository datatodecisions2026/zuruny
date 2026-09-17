/**
 * Regional pricing.
 *
 * Zuruny quotes one base price in USD. Inside Lebanon that is what you pay.
 * Outside Lebanon it is multiplied, to cover export, freight and handling.
 *
 * The multiplier is applied to integer cents and rounded once, here. Nothing
 * else in the codebase is allowed to do price arithmetic — that is how you end
 * up with a basket that disagrees with a product page by a cent.
 */

export const REGIONS = ["LB", "INTL"] as const;
export type Region = (typeof REGIONS)[number];

export const REGION_COOKIE = "zuruny_region";

/** Outside Lebanon, everything is 2.5x the Lebanon price. */
export const INTL_MULTIPLIER = 2.5;

export function isRegion(value: unknown): value is Region {
  return typeof value === "string" && (REGIONS as readonly string[]).includes(value);
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

/** Vercel gives us the visitor's country; only Lebanon gets local pricing. */
export function regionFromCountry(country: string | null | undefined): Region {
  return country?.toUpperCase() === "LB" ? "LB" : "INTL";
}
