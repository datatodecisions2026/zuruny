"use client";

import { createBrowserClient } from "@supabase/ssr";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Browser client, used only for the sign-in / sign-up / sign-out flows.
 *
 * It carries the publishable key, which is public by design — every row it can
 * reach is governed by RLS. Nothing that decides a price or writes an order
 * goes through here.
 */
export function getSupabaseBrowser() {
  if (!URL || !PUBLISHABLE) return null;
  return createBrowserClient(URL, PUBLISHABLE);
}
