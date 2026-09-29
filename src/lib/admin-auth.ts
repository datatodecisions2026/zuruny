import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { query } from "@/lib/db";

/**
 * The owner's login. Deliberately its own cookie, its own table, its own
 * session table — entirely separate from customer accounts (src/lib/auth.ts).
 * A customer session cookie is never read here, and this one is never read
 * by the customer-facing code, so neither can be presented on the other's
 * routes even by accident.
 */

export type AdminSession = { id: string; email: string; fullName: string | null };

const COOKIE = "zuruny_admin_session";
const DAYS = 7; // shorter-lived than a customer session — this one can write.

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

export async function createAdminSession(adminId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await query(
    `insert into zuruny_admin_sessions (token_hash, admin_id, expires_at)
     values ($1, $2, now() + make_interval(days => $3))`,
    [hash(token), adminId, DAYS],
  );
  await query("delete from zuruny_admin_sessions where expires_at < now()");

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DAYS * 86400,
  });
}

export async function destroyAdminSession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await query("delete from zuruny_admin_sessions where token_hash = $1", [hash(token)]);
  jar.delete(COOKIE);
}

/** The signed-in admin, or null. Cached per request. */
export const getSessionAdmin = cache(async (): Promise<AdminSession | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const [row] = await query<{ id: string; email: string; full_name: string | null }>(
    `select a.id, a.email, a.full_name
       from zuruny_admin_sessions s join zuruny_admins a on a.id = s.admin_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hash(token)],
  );
  return row ? { id: row.id, email: row.email, fullName: row.full_name } : null;
});
