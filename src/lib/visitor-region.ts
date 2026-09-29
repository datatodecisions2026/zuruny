import { LEBANON_IPV4, LEBANON_IPV6 } from "./lebanon-prefixes.ts";
import { regionFromCountry, type Region } from "./region.ts";

/**
 * Country from the address nginx actually saw, used when the host sends no
 * country header. A visitor cannot choose this: nginx replaces X-Real-IP
 * with $remote_addr, and the fallback is the last X-Forwarded-For hop (the
 * one nginx appended), never the first, which the client can forge.
 */

type V4Prefix = { base: number; mask: number };
type V6Prefix = { base: bigint; mask: bigint };

const v4Prefixes: V4Prefix[] = LEBANON_IPV4.map(compileV4);
const v6Prefixes: V6Prefix[] = LEBANON_IPV6.map(compileV6);

export function isLebanonAddress(address: string): boolean {
  const v4 = ipv4ToInt(stripMapped(address));
  if (v4 !== null) return v4Prefixes.some((p) => (v4 & p.mask) === p.base);
  const v6 = ipv6ToBig(address);
  if (v6 === null) return false;
  return v6Prefixes.some((p) => (v6 & p.mask) === p.base);
}

/** Lebanon when the address is allocated there. Public addresses elsewhere stay international. */
export function regionFromAddress(address: string): Region {
  return regionFromCountry(isLebanonAddress(address) ? "LB" : "ZZ");
}

/**
 * The visitor address the reverse proxy observed. Private and empty values
 * are ignored so a missing header does not get treated as a country.
 */
export function visitorAddress(headers: Headers): string | null {
  const real = publicAddress(headers.get("x-real-ip"));
  if (real) return real;

  const forwarded = headers.get("x-forwarded-for");
  if (!forwarded) return null;
  const hops = forwarded
    .split(",")
    .map((part) => publicAddress(part))
    .filter((part): part is string => part !== null);
  return hops.at(-1) ?? null;
}

function publicAddress(value: string | null | undefined): string | null {
  if (!value) return null;
  const address = value.trim().replace(/^\[|\]$/g, "");
  if (!address || isPrivate(address)) return null;
  return address;
}

function isPrivate(address: string): boolean {
  const v4 = ipv4ToInt(stripMapped(address));
  if (v4 !== null) {
    const a = v4 >>> 24;
    const b = (v4 >>> 16) & 0xff;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 100 && b >= 64 && b <= 127) return true;
    return false;
  }
  const v6 = ipv6ToBig(address);
  if (v6 === null) return true;
  if (v6 === 0n || v6 === 1n) return true;
  const top = Number((v6 >> 112n) & 0xffffn);
  if ((top & 0xfe00) === 0xfc00) return true; // fc00::/7
  if ((top & 0xffc0) === 0xfe80) return true; // fe80::/10
  return false;
}

function stripMapped(address: string): string {
  const mapped = address.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i);
  return mapped ? mapped[1] : address;
}

function ipv4ToInt(address: string): number | null {
  const parts = address.split(".");
  if (parts.length !== 4) return null;
  let value = 0;
  for (const part of parts) {
    if (!/^\d{1,3}$/.test(part)) return null;
    const octet = Number(part);
    if (octet > 255) return null;
    value = (value * 256 + octet) >>> 0;
  }
  return value;
}

function compileV4(prefix: string): V4Prefix {
  const [address, bitsText] = prefix.split("/");
  const bits = Number(bitsText);
  const base = ipv4ToInt(address);
  if (base === null || bits < 0 || bits > 32) throw new Error(`bad prefix ${prefix}`);
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return { base: (base & mask) >>> 0, mask };
}

function ipv6ToBig(address: string): bigint | null {
  let ip = address.toLowerCase();
  const v4tail = ip.match(/^(.*:)(\d+\.\d+\.\d+\.\d+)$/);
  if (v4tail) {
    const n = ipv4ToInt(v4tail[2]);
    if (n === null) return null;
    ip = `${v4tail[1]}${((n >>> 16) & 0xffff).toString(16)}:${(n & 0xffff).toString(16)}`;
  }
  const halves = ip.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  if (halves.length === 1 && left.length !== 8) return null;
  const missing = 8 - left.length - right.length;
  if (missing < 0) return null;
  const groups = [...left, ...Array(missing).fill("0"), ...right];
  if (groups.length !== 8) return null;
  let out = 0n;
  for (const group of groups) {
    if (!/^[0-9a-f]{1,4}$/.test(group)) return null;
    out = (out << 16n) + BigInt(parseInt(group, 16));
  }
  return out;
}

function compileV6(prefix: string): V6Prefix {
  const [address, bitsText] = prefix.split("/");
  const bits = Number(bitsText);
  const base = ipv6ToBig(address);
  if (base === null || bits < 0 || bits > 128) throw new Error(`bad prefix ${prefix}`);
  const mask = bits === 0 ? 0n : ((1n << 128n) - 1n) ^ ((1n << BigInt(128 - bits)) - 1n);
  return { base: base & mask, mask };
}
