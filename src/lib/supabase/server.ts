import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const PUBLISHABLE = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

/** The site runs without Supabase configured; features degrade rather than crash. */
export const supabaseConfigured = Boolean(URL && PUBLISHABLE);

/** True only when the server can write orders. */
export const canPlaceOrders = Boolean(URL && SERVICE_ROLE);

/**
 * Request-scoped client carrying the visitor's session.
 *
 * Everything it reads and writes is subject to RLS, which is the point: a
 * signed-in customer sees their own orders because the database says so, not
 * because a query remembered to filter.
 */
export async function getSupabaseServer() {
  if (!URL || !PUBLISHABLE) return null;
  const cookieStore = await cookies();

  return createServerClient(URL, PUBLISHABLE, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          /* Called from a Server Component, where cookies are read-only.
             The session is refreshed by the proxy instead. */
        }
      },
    },
  });
}

/**
 * Service-role client. Bypasses RLS, so it is confined to the order-writing
 * path and never handed a value that came from the browser unchecked.
 *
 * Prices and the delivery region are resolved here rather than accepted from
 * the client: otherwise a crafted request could order $70 oil for $28.
 */
export function getSupabaseAdmin() {
  if (!URL || !SERVICE_ROLE) return null;
  return createAdminClient(URL, SERVICE_ROLE, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
