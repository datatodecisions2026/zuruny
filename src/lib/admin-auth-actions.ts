"use server";

import bcrypt from "bcryptjs";
import { dbConfigured, query } from "@/lib/db";
import { createAdminSession, destroyAdminSession } from "@/lib/admin-auth";
import { clientIp, isThrottled, recordFailure } from "@/lib/login-throttle";

export type AdminAuthState = { error: string | null; message: string | null; email?: string };

// Compared against when the email is unknown, so timing does not reveal it.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", 10);

/**
 * Sign in only — there is no public admin sign-up. The one admin account is
 * created with scripts/seed-admin.mjs.
 */
export async function adminSignIn(
  _prev: AdminAuthState,
  formData: FormData,
): Promise<AdminAuthState> {
  if (!dbConfigured) return { error: "Not configured yet.", message: null };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email and password.", message: null, email };
  }

  const ip = await clientIp();
  if (isThrottled("admin", ip)) {
    return { error: "Too many attempts. Try again in a few minutes.", message: null, email };
  }

  const [admin] = await query<{ id: string; password_hash: string }>(
    "select id, password_hash from zuruny_admins where lower(email) = $1",
    [email],
  );
  const ok = await bcrypt.compare(password, admin?.password_hash ?? DUMMY_HASH);
  if (!admin || !ok) {
    recordFailure("admin", ip);
    /* The email is echoed back and bound as defaultValue on the input below.
       Without this, a failed submit leaves the field's live DOM value out of
       sync with what the next render expects, and since it's `required`,
       the browser silently blocks the next submit with no visible error —
       looks like "the correct password doesn't work either". */
    return { error: "That email and password do not match.", message: null, email };
  }

  await createAdminSession(admin.id);
  return { error: null, message: null };
}

export async function adminSignOut(): Promise<void> {
  await destroyAdminSession();
}
