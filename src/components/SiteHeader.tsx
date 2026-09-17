import Link from "next/link";
import { CartButton } from "@/components/CartButton";
import { MobileMenu } from "@/components/MobileMenu";
import { LanguageSwitch } from "@/components/PreferenceSwitches";
import { getDict, localePath, type Locale } from "@/lib/i18n";
import type { Region } from "@/lib/region";

/**
 * One bar, three zones: mark, navigation, controls.
 *
 * The previous version stacked up to four rows on a phone — nav links, a
 * delivery region, a language pair and a wrapping price note — and they
 * collided at 390px. Everything below `lg` now collapses into the menu, so
 * the bar itself is only ever a single row: mark, basket, menu.
 */
export function SiteHeader({
  locale,
  region,
}: {
  locale: Locale;
  region: Region;
}) {
  const t = getDict(locale);

  const nav = [
    { href: localePath(locale, "/shop"), label: t.nav.shop },
    { href: localePath(locale, "/#names"), label: t.nav.theNames },
    { href: localePath(locale, "/#reach"), label: t.nav.shipping },
  ];

  return (
    <header className="fixed inset-x-0 top-0 z-40">
      {/* The page's own read-progress. Driven by scroll(root), so it costs
          nothing and it is the one piece of chrome that is always moving. */}
      <div className="h-px w-full bg-[var(--rule)]">
        <div className="m-progress h-px w-full origin-left scale-x-0 bg-ochre" />
      </div>

      {/* Gradient only, no backdrop-blur: the filter applies across the whole
          box while the gradient fades, which leaves a hard seam straight
          across the hero photograph. */}
      <div className="bg-gradient-to-b from-ground via-ground/85 to-transparent pb-6">
        <nav
          aria-label={t.nav.primary}
          className="flex items-center gap-6 px-[var(--gutter)] py-4"
        >
          <Link
            href={localePath(locale, "/")}
            className="group flex shrink-0 items-center gap-3"
            aria-label={t.nav.home}
          >
            <span
              aria-hidden
              className="u-emblem block size-7 text-cream transition-[color,transform] duration-700 ease-[var(--ease-out-soft)] group-hover:rotate-90 group-hover:text-ochre"
              style={{ ["--emblem-src" as string]: "url(/brand/emblem.png)" }}
            />
            <span className="u-mono text-cream">Zuruny</span>
          </Link>

          {/* Centre zone. Only exists on desktop; on smaller screens these
              links live in the menu at display size. */}
          <ul className="hidden flex-1 items-center justify-center gap-8 lg:flex">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="u-mono u-underline text-[var(--text-muted)] transition-colors duration-300 hover:text-cream"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex items-center gap-4 lg:ml-0">
            <div className="hidden lg:block">
              <LanguageSwitch />
            </div>

            <CartButton />
            <MobileMenu />
          </div>
        </nav>

        {/* Which prices are on screen, in words. Desktop only — on a phone it
            wrapped to two lines and pushed the fixed bar over the page; the
            menu carries the same sentence beside the region switch. */}
        <p className="u-mono hidden px-[var(--gutter)] text-[var(--text-faint)] lg:block">
          {region === "LB" ? t.region.lbNote : t.region.intlNote}
        </p>
      </div>
    </header>
  );
}
