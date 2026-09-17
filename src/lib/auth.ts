import "server-only";
import { getSupabaseServer } from "@/lib/supabase/server";

export type SessionUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  isAdmin: boolean;
};

/**
 * The signed-in user, or null.
 *
 * Uses getUser() rather than getSession(): getSession reads the cookie and
 * trusts it, getUser verifies it against the auth server. For anything that
 * gates the admin area, the cookie alone is not good enough.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await getSupabaseServer();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("zuruny_profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email ?? null,
    fullName: (profile?.full_name as string | null) ?? null,
    // The role lives in the database, not in the JWT, so revoking an admin
    // takes effect on the next request rather than at token expiry.
    isAdmin: profile?.role === "admin",
  };
}
