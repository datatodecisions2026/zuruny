"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/lib/preferences";
import { localePath } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/PreferenceSwitches";

/**
 * Full-screen menu for narrow viewports.
 *
 * The earlier build refused a hamburger on the grounds that three
 * destinations do not need hiding — but that was before the header also had
 * to carry a delivery region, a language and a basket. At 390px those five
 * controls could not share a bar without colliding, so the menu earns its
 * place: it takes the crowding off the bar and gives the links room to be set
 * at display size instead of squeezed into 11px mono.
 */
export function MobileMenu() {
  const { locale, region, t } = usePreferences();
  const pathname = usePathname();
  /* The menu is open only for the route it was opened on. Deriving it this
     way closes it on every navigation — link taps, the language switch, and
     the browser back button alike — without an effect that calls setState on
     each route change. */
  const [openedOn, setOpenedOn] = useState<string | null>(null);
  const open = openedOn !== null && openedOn === pathname;
  const setOpen = (next: boolean) => setOpenedOn(next ? pathname : null);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const nav = [
    { href: localePath(locale, "/shop"), label: t.nav.shop },
    { href: localePath(locale, "/#names"), label: t.nav.theNames },
    { href: localePath(locale, "/#reach"), label: t.nav.shipping },
    { href: localePath(locale, "/account"), label: t.nav.account },
  ];

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenedOn(null);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls="mobile-menu"
        aria-label={open ? t.nav.closeMenu : t.nav.openMenu}
        className="relative z-60 grid size-11 place-items-center text-cream transition-colors duration-300 hover:text-ochre"
      >
        {/* Two rules that cross into an X. One element per line, animated on
            transform only, so it stays on the compositor. */}
        <span aria-hidden className="relative block h-3 w-6">
          <span
            className={`absolute left-0 block h-px w-full bg-current transition-transform duration-[450ms] ease-[var(--ease-out-soft)] ${
              open ? "top-1/2 rotate-45" : "top-0 rotate-0"
            }`}
          />
          <span
            className={`absolute left-0 block h-px w-full bg-current transition-transform duration-[450ms] ease-[var(--ease-out-soft)] ${
              open ? "top-1/2 -rotate-45" : "top-full rotate-0"
            }`}
          />
        </span>
      </button>

      {/* The panel itself. Kept mounted so the close animation can play. */}
      <div
        id="mobile-menu"
        ref={panelRef}
        role="dialog"
        aria-modal={open}
        aria-label={t.nav.primary}
        tabIndex={-1}
        aria-hidden={!open}
        className={`fixed inset-0 z-50 flex flex-col overflow-y-auto bg-ground transition-[opacity,visibility] duration-500 ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="u-sprig absolute inset-0 -z-10" aria-hidden />

        <nav className="flex flex-1 flex-col justify-center px-[var(--gutter)] py-28">
          <ul className="space-y-2">
            {nav.map((item, i) => (
              <li
                key={item.href}
                style={{ ["--i" as string]: i }}
                className={`transition-[opacity,transform] duration-500 ease-[var(--ease-out-soft)] ${
                  open
                    ? "translate-y-0 opacity-100"
                    : "translate-y-4 opacity-0"
                }`}
              >
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="u-display block py-2 text-[length:var(--step-3)] text-cream transition-colors duration-300 hover:text-ochre"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>

          <div
            className={`mt-14 space-y-6 border-t border-[var(--rule)] pt-8 transition-[opacity,transform] duration-500 ease-[var(--ease-out-soft)] ${
              open ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: open ? "180ms" : "0ms" }}
          >
            <div>
              <p className="u-mono mb-2 text-[var(--text-faint)]">
                {t.region.label}
              </p>
              {/* Stated, not offered. Detected from the visitor's country. */}
              <p className="u-mono text-ochre">
                {region === "LB" ? t.region.lebanon : t.region.international}
              </p>
              <p className="u-mono mt-2 text-[var(--text-faint)]">
                {region === "LB" ? t.region.lbNote : t.region.intlNote}
              </p>
            </div>

            <div>
              <p className="u-mono mb-3 text-[var(--text-faint)]">
                {t.language.switchLabel}
              </p>
              <LanguageSwitch />
            </div>

            <a
              href="mailto:hello@zuruny.co"
              className="u-mono block text-[var(--text-muted)] underline-offset-8 transition-colors duration-300 hover:text-cream hover:underline"
            >
              hello@zuruny.co
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
}
