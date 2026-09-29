"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { dbConfigured, query } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { clientIp, isThrottled, recordFailure } from "@/lib/login-throttle";

export type AuthState = { error: string | null; message: string | null; email?: string };

/**
 * Sign in, sign up and sign out.
 *
 * Errors are returned as plain strings for the form to render, never thrown:
 * a failed login is an ordinary outcome, not an exception. The messages stay
 * deliberately vague about whether an address exists, so the form cannot be
 * used to enumerate customers.
 */

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
    return { error: "Enter your email and password.", message: null, email };
  }

  const ip = await clientIp();
  if (isThrottled("customer", ip)) {
    return { error: "Too many attempts. Try again in a few minutes.", message: null, email };
  }

  const [user] = await query<{ id: string; password_hash: string }>(
    "select id, password_hash from zuruny_users where lower(email) = $1",
    [email],
  );
  const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
  if (!user || !ok) {
    recordFailure("customer", ip);
    /* The email is echoed back and bound as defaultValue on the input below.
       Without this, a failed submit leaves the field's live DOM value out of
       sync with what the next render expects, and since it's `required`,
       the browser silently blocks the next submit with no visible error —
       looks like "the correct password doesn't work either". */
    return { error: "That email and password do not match.", message: null, email };
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
    return { error: "That email address is not valid.", message: null, email };
  }
  if (password.length < 8) {
    return { error: "Use a password of at least 8 characters.", message: null, email };
  }

  // Sign-ups share the login throttle so the form cannot be used to spray accounts.
  const ip = await clientIp();
  if (isThrottled("customer", ip)) {
    return { error: "Too many attempts. Try again in a few minutes.", message: null, email };
  }
  recordFailure("customer", ip);

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
  if (!user) return { error: "We could not create that account.", message: null, email };

  await createSession(user.id);
  revalidatePath("/", "layout");
  return { error: null, message: null };
}

export async function signOut(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
}
