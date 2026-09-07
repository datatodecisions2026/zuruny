import "server-only";
import { cookies } from "next/headers";

const COOKIE = "zuruny_admin";

/** A shared password is thin, but it keeps the CMS off the open internet
 *  until real accounts exist. The password never reaches the browser; only
 *  this opaque flag does. */
export async function isSignedIn() {
  // With no password configured the CMS is open. That is deliberate for local
  // work; setting ADMIN_PASSWORD turns the gate on, and production must set it.
  if (!process.env.ADMIN_PASSWORD) return true;
  const store = await cookies();
  return store.get(COOKIE)?.value === "1";
}

export async function signIn(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || password !== expected) return false;
  const store = await cookies();
  store.set(COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return true;
}

export async function signOut() {
  const store = await cookies();
  store.delete(COOKIE);
}

export function passwordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}
