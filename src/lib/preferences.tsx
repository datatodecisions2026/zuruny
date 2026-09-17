"use client";

import { createContext, useContext, useMemo } from "react";
import type { Locale } from "@/lib/i18n";
import { getDict, type Dict } from "@/lib/i18n";
import type { Region } from "@/lib/region";

/**
 * Locale and region, seeded from the server so the first paint is already
 * correct, and readable by client components (the basket) which cannot take
 * them as props from a server tree.
 *
 * Region is read-only on purpose. It is detected per request in the proxy and
 * there is no setter, because a visitor who could choose their own delivery
 * region would simply choose the cheaper one.
 */

type PreferencesValue = {
  locale: Locale;
  region: Region;
  t: Dict;
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
  const value = useMemo(
    () => ({ locale, region, t: getDict(locale) }),
    [locale, region],
  );

  return (
    <PreferencesContext.Provider value={value}>
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
