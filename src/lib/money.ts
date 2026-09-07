/**
 * Client-safe. Kept out of catalog.ts so that importing a formatter does not
 * drag the server-only data store into a browser bundle.
 */
export const money = (cents: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(
    cents / 100,
  );
