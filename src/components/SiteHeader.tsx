import Link from "next/link";
import { CartButton } from "@/components/CartButton";
import { LanguageSwitch, RegionSwitch } from "@/components/PreferenceSwitches";
import { getDict, localePath, type Locale } from "@/lib/i18n";
import type { Region } from "@/lib/region";

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
      <div className="bg-gradient-to-b from-ground via-ground/80 to-transparent pb-5">
        <nav
          aria-label={t.nav.primary}
          className="mx-auto flex items-center justify-between gap-6 px-[var(--gutter)] py-4"
        >
          <Link
            href={localePath(locale, "/")}
            className="group flex items-center gap-3"
            aria-label={t.nav.home}
          >
            <span
              aria-hidden
              className="u-emblem block size-7 text-cream transition-[color,transform] duration-700 ease-[var(--ease-out-soft)] group-hover:rotate-90 group-hover:text-ochre"
              style={{ ["--emblem-src" as string]: "url(/brand/emblem.png)" }}
            />
            <span className="u-mono text-cream">Zuruny</span>
          </Link>

          <div className="flex items-center gap-6">
            <ul className="hidden items-center gap-6 lg:flex">
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

            <div className="hidden items-center gap-4 sm:flex">
              <RegionSwitch />
              <span aria-hidden className="text-[var(--rule-strong)]">
                |
              </span>
              <LanguageSwitch />
            </div>

            <CartButton />
          </div>
        </nav>

        {/* Below `lg` the inline list is hidden, so the same links get their
            own row. A hamburger would hide the shop behind a tap on a site
            with three destinations. These stack rather than sharing a row:
            side by side at 390px they collide. */}
        <div className="flex flex-col gap-2 px-[var(--gutter)] pb-1 lg:hidden">
          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
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

          {/* Only below `sm` — at `sm` and up these sit in the row above. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 sm:hidden">
            <span className="u-mono text-[var(--text-faint)]">
              {t.region.label}
            </span>
            <RegionSwitch />
            <span aria-hidden className="text-[var(--rule-strong)]">
              |
            </span>
            <LanguageSwitch />
          </div>
        </div>

        {/* Says which prices are on screen, in words, rather than leaving the
            visitor to work out why a tin costs what it costs. Hidden on the
            narrowest screens, where it wraps to two lines and pushes a fixed
            header over the page beneath it; the labelled switch carries the
            same meaning there. */}
        <p className="u-mono hidden px-[var(--gutter)] pt-2 text-[var(--text-faint)] sm:block">
          {region === "LB" ? t.region.lbNote : t.region.intlNote}
        </p>
      </div>
    </header>
  );
}
