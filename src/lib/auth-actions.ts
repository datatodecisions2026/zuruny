"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import bcrypt from "bcryptjs";
import { dbConfigured, query } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";

export type AuthState = { error: string | null; message: string | null };

/**
 * Sign in, sign up and sign out.
 *
 * Errors are returned as plain strings for the form to render, never thrown:
 * a failed login is an ordinary outcome, not an exception. The messages stay
 * deliberately vague about whether an address exists, so the form cannot be
 * used to enumerate customers.
 */

/* Login throttle: 10 failures per IP per 15 minutes.
   ponytail: in-memory, so it is per process and resets on restart. Fine for a
   single pm2 instance; move to a table if the app ever runs clustered. */
const WINDOW_MS = 15 * 60_000;
const MAX_FAILS = 10;
const fails = new Map<string, number[]>();

async function clientIp(): Promise<string> {
  const h = await headers();
  /* x-real-ip is set by nginx from the socket address, so a client cannot fake
     it. x-forwarded-for's first entry can be client-supplied, hence only a fallback
     for setups without that header (local dev). */
  return h.get("x-real-ip") || h.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function recentFails(ip: string): number[] {
  const now = Date.now();
  const list = (fails.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  fails.set(ip, list);
  return list;
}

// Compared against when the email is unknown, so timing does not reveal it.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!dbConfigured) return { error: "Accounts are not configured yet.", message: null };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email and password.", message: null };
  }

  const ip = await clientIp();
  if (recentFails(ip).length >= MAX_FAILS) {
    return { error: "Too many attempts. Try again in a few minutes.", message: null };
  }

  const [user] = await query<{ id: string; password_hash: string }>(
    "select id, password_hash from zuruny_users where lower(email) = $1",
    [email],
  );
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    recentFails(ip).push(Date.now());
    return { error: "That email and password do not match.", message: null };
  }

  await createSession(user.id);
  revalidatePath("/", "layout");
  return { error: null, message: null };
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  if (!dbConfigured) return { error: "Accounts are not configured yet.", message: null };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { error: "That email address is not valid.", message: null };
  }
  if (password.length < 8) {
    return { error: "Use a password of at least 8 characters.", message: null };
  }

  // Sign-ups share the login throttle so the form cannot be used to spray accounts.
  const ip = await clientIp();
  if (recentFails(ip).length >= MAX_FAILS) {
    return { error: "Too many attempts. Try again in a few minutes.", message: null };
  }
  recentFails(ip).push(Date.now());

  // bcrypt only reads the first 72 bytes, so longer passwords add nothing.
  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await query<{ id: string }>(
    `insert into zuruny_users (email, password_hash, full_name)
     values ($1, $2, $3)
     on conflict (lower(email)) do nothing
     returning id`,
    [email, passwordHash, fullName || null],
  );

  /* Stay vague about whether an address already exists — that would turn this
     form into a customer list. */
  if (!user) return { error: "We could not create that account.", message: null };

  await createSession(user.id);
  revalidatePath("/", "layout");
  return { error: null, message: null };
}

export async function signOut(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
}
