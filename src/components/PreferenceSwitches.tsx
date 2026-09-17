"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/lib/preferences";
import { LOCALES, LOCALE_LABEL, DEFAULT_LOCALE, isLocale } from "@/lib/i18n";
import { REGIONS, type Region } from "@/lib/region";

/** Strip any locale prefix, leaving the bare route. */
function barePath(pathname: string): string {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length && isLocale(segments[0])) segments.shift();
  return "/" + segments.join("/");
}

/**
 * Language switch. A real link per language rather than a JS toggle, so each
 * version is crawlable and can be opened in a new tab.
 */
export function LanguageSwitch() {
  const { locale, t } = usePreferences();
  const pathname = usePathname();
  const bare = barePath(pathname ?? "/");

  return (
    <div
      className="flex items-center"
      role="group"
      aria-label={t.language.switchLabel}
    >
      {LOCALES.map((l, i) => {
        const href =
          l === DEFAULT_LOCALE ? bare : `/${l}${bare === "/" ? "" : bare}`;
        const active = l === locale;
        return (
          <span key={l} className="flex items-center">
            {i > 0 && (
              <span aria-hidden className="px-1 text-[var(--text-faint)]">
                /
              </span>
            )}
            <Link
              href={href}
              hrefLang={l}
              aria-current={active ? "true" : undefined}
              className={`u-mono transition-colors duration-300 ${
                active
                  ? "text-ochre"
                  : "text-[var(--text-faint)] hover:text-cream"
              }`}
            >
              {LOCALE_LABEL[l]}
            </Link>
          </span>
        );
      })}
    </div>
  );
}

/**
 * Delivery region. Changing it rewrites the price of everything on the page,
 * so it is a control, not a link — it sets the cookie and asks the server for
 * fresh markup rather than doing the arithmetic client-side.
 */
export function RegionSwitch() {
  const { region, setRegion, t } = usePreferences();

  const label: Record<Region, string> = {
    LB: t.region.lebanon,
    INTL: t.region.international,
  };

  return (
    <div
      className="flex items-center"
      role="group"
      aria-label={t.region.switchLabel}
    >
      {REGIONS.map((r, i) => {
        const active = r === region;
        return (
          <span key={r} className="flex items-center">
            {i > 0 && (
              <span aria-hidden className="px-1 text-[var(--text-faint)]">
                /
              </span>
            )}
            <button
              type="button"
              onClick={() => setRegion(r)}
              aria-pressed={active}
              className={`u-mono transition-colors duration-300 ${
                active
                  ? "text-ochre"
                  : "text-[var(--text-faint)] hover:text-cream"
              }`}
            >
              {label[r]}
            </button>
          </span>
        );
      })}
    </div>
  );
}
