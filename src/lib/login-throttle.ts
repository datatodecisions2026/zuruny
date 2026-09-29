import "server-only";
import { headers } from "next/headers";

/* ponytail: in-memory, so it is per process and resets on restart. Fine for
   a single pm2 instance; move to a table if the app ever runs clustered. */
const WINDOW_MS = 15 * 60_000;
const MAX_FAILS = 10;
const fails = new Map<string, number[]>();

export async function clientIp(): Promise<string> {
  const h = await headers();
  /* x-real-ip is set by nginx from the socket address, so a client cannot
     fake it. x-forwarded-for's first entry can be client-supplied, hence
     only a fallback for setups without that header (local dev). */
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

/**
 * 10 failures per IP per 15 minutes. `bucket` keeps admin and customer
 * login attempts from the same IP from spending the same budget, so a
 * flood at one doesn't lock out the other.
 */
export function isThrottled(bucket: string, ip: string): boolean {
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const recent = (fails.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  fails.set(key, recent);
  return recent.length >= MAX_FAILS;
}

export function recordFailure(bucket: string, ip: string): void {
  const key = `${bucket}:${ip}`;
  const list = fails.get(key) ?? [];
  list.push(Date.now());
  fails.set(key, list);
}
