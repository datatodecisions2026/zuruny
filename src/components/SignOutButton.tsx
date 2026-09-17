"use client";

import { signOut } from "@/lib/auth-actions";
import { usePreferences } from "@/lib/preferences";

export function SignOutButton() {
  const { t } = usePreferences();
  return (
    <form action={signOut}>
      <button
        type="submit"
        className="u-mono border border-[var(--rule-strong)] px-6 py-3 text-cream transition-colors duration-300 hover:border-ochre hover:text-ochre"
      >
        {t.nav.signOut}
      </button>
    </form>
  );
}
