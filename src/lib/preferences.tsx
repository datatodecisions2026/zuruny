"use client";

import { createContext, useContext, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
import { getDict, type Dict } from "@/lib/i18n";
import { REGION_COOKIE, type Region } from "@/lib/region";

/**
 * Locale and region, seeded from the server so the first paint is already
 * correct, and readable by client components (the basket) which cannot take
 * them as props from a server tree.
 */

type PreferencesValue = {
  locale: Locale;
  region: Region;
  t: Dict;
  setRegion: (region: Region) => void;
};

const PreferencesContext = createContext<PreferencesValue | null>(null);

export function PreferencesProvider({
  locale,
  region,
  children,
}: {
  locale: Locale;
  region: Region;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const setRegion = useCallback(
    (next: Region) => {
      document.cookie = `${REGION_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
      // Prices are rendered on the server, so ask for fresh markup rather
      // than trying to recompute them here and drift from the source.
      router.refresh();
    },
    [router],
  );

  return (
    <PreferencesContext.Provider
      value={{ locale, region, t: getDict(locale), setRegion }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesValue {
  const ctx = useContext(PreferencesContext);
  if (!ctx) {
    throw new Error("usePreferences must be used inside <PreferencesProvider>");
  }
  return ctx;
}
