"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseServer } from "@/lib/supabase/server";

export type AuthState = { error: string | null; message: string | null };

/**
 * Sign in, sign up and sign out.
 *
 * Errors are returned as plain strings for the form to render, never thrown:
 * a failed login is an ordinary outcome, not an exception. The messages stay
 * deliberately vague about whether an address exists, so the form cannot be
 * used to enumerate customers.
 */

export async function signIn(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { error: "Accounts are not configured yet.", message: null };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) {
    return { error: "Enter your email and password.", message: null };
  }

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return { error: "That email and password do not match.", message: null };
  }

  revalidatePath("/", "layout");
  return { error: null, message: null };
}

export async function signUp(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const supabase = await getSupabaseServer();
  if (!supabase) return { error: "Accounts are not configured yet.", message: null };

  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const fullName = String(formData.get("full_name") ?? "").trim();

  if (password.length < 8) {
    return { error: "Use a password of at least 8 characters.", message: null };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });

  if (error) {
    /* Stay vague about whether an address already exists — that would turn
       this form into a customer list. But a rate limit or a malformed address
       is the visitor's problem to act on, so say so plainly rather than
       leaving them retrying a form that cannot succeed. */
    if (error.code === "over_email_send_rate_limit") {
      return {
        error: "Too many sign-ups just now. Try again in a few minutes.",
        message: null,
      };
    }
    if (error.code === "email_address_invalid") {
      return { error: "That email address is not valid.", message: null };
    }
    if (error.code === "weak_password") {
      return { error: "Choose a stronger password.", message: null };
    }
    return { error: "We could not create that account.", message: null };
  }

  // With email confirmation on, there is no session yet.
  if (!data.session) {
    return {
      error: null,
      message: "Check your inbox to confirm your address, then sign in.",
    };
  }

  revalidatePath("/", "layout");
  return { error: null, message: null };
}

export async function signOut(): Promise<void> {
  const supabase = await getSupabaseServer();
  if (!supabase) return;
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
}
