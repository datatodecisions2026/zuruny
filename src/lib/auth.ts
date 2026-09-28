import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createHash, randomBytes } from "node:crypto";
import { query } from "@/lib/db";

export type SessionUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  isAdmin: boolean;
};

const COOKIE = "zuruny_session";
const DAYS = 30;

const hash = (token: string) => createHash("sha256").update(token).digest("hex");

/** Opens a session for a user and sets the cookie. Call from a server action. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("base64url");
  await query(
    `insert into zuruny_sessions (token_hash, user_id, expires_at)
     values ($1, $2, now() + make_interval(days => $3))`,
    [hash(token), userId, DAYS],
  );
  // Expired rows are swept here, on login, instead of by a cron job.
  await query("delete from zuruny_sessions where expires_at < now()");

  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: DAYS * 86400,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) await query("delete from zuruny_sessions where token_hash = $1", [hash(token)]);
  jar.delete(COOKIE);
}

/**
 * The signed-in user, or null.
 *
 * The role is read from the database on every request, never carried in the
 * cookie, so revoking an admin takes effect on their next request.
 * Cached per request: pages, actions and the product read all ask.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;

  const [row] = await query<{ id: string; email: string; full_name: string | null; role: string }>(
    `select u.id, u.email, u.full_name, u.role
       from zuruny_sessions s join zuruny_users u on u.id = s.user_id
      where s.token_hash = $1 and s.expires_at > now()`,
    [hash(token)],
  );
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    isAdmin: row.role === "admin",
  };
});
