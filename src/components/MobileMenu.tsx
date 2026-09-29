"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePreferences } from "@/lib/preferences";
import { localePath, primaryNavigation } from "@/lib/i18n";
import { LanguageSwitch } from "@/components/PreferenceSwitches";

/**
 * Full-screen menu for narrow viewports.
 *
 * The earlier build refused a hamburger on the grounds that three
 * destinations do not need hiding — but that was before the header also had
 * to carry a delivery region, a language and a basket. At 390px those controls
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
    ...primaryNavigation(locale),
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
          <ul className="space-y-1">
            {nav.map((item, i) => {
              const current = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <li
                  key={item.href}
                  style={{ transitionDelay: open ? `${i * 60}ms` : "0ms" }}
                  className={`transition-[opacity,transform] duration-500 ease-[var(--ease-out-soft)] ${
                    open
                      ? "translate-y-0 opacity-100"
                      : "translate-y-4 opacity-0"
                  }`}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={current ? "page" : undefined}
                    className="group flex items-center gap-5 py-2"
                  >
                    <span
                      className={`grid size-12 shrink-0 place-items-center rounded-full border text-ochre transition-[border-color,background-color,transform] duration-500 ease-[var(--ease-out-soft)] group-hover:border-ochre group-hover:bg-ochre/10 group-active:scale-90 ${
                        current ? "border-ochre bg-ochre/10" : "border-[var(--rule-strong)]"
                      }`}
                    >
                      <NavIcon
                        name={item.href.split("/").pop() ?? ""}
                        drawn={open}
                        delay={i * 60 + 200}
                      />
                    </span>
                    <span
                      className={`u-display text-[length:var(--step-3)] transition-colors duration-300 group-hover:text-ochre ${
                        current ? "text-ochre" : "text-cream"
                      }`}
                    >
                      {item.label}
                    </span>
                    <span
                      aria-hidden
                      className={`ml-auto text-ochre transition-[opacity,transform] duration-500 ease-[var(--ease-out-soft)] group-hover:translate-x-0 group-hover:opacity-100 ${
                        current ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                      }`}
                    >
                      &rarr;
                    </span>
                  </Link>
                </li>
              );
            })}
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

/* Line icons keyed by the route's last segment: an oil tin for the shop, an
   open book for the names, an olive sprig for the artisans, a cedar for the
   story, a globe for shipping, a bust for the account. */
const ICONS: Record<string, string[]> = {
  shop: ["M9 3h6v3H9z", "M7 6h10v15H7z", "M7 11h10", "M7 17h10"],
  names: [
    "M12 6.5C10 5 7 4.5 4 5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z",
    "M12 6.5v14",
  ],
  artisans: [
    "M5 20C9 15.5 13 10.5 19 4",
    "M9.5 15C7 15 5.4 13.7 5 11.5c2.4 0 4 1.3 4.5 3.5z",
    "M9.5 15c2.3.6 3.5 2.1 3.5 4.2-2.4-.3-3.6-1.9-3.5-4.2z",
    "M14 9.8c-.2-2.4.9-4 3-4.8.4 2.3-.7 4-3 4.8z",
    "M14 9.8c2.3-.8 4.1-.3 5.3 1.4-2.1 1.1-4 .6-5.3-1.4z",
  ],
  about: ["M12 3 7 9h3l-4 5h4l-4 5h12l-4-5h4l-4-5h3z", "M12 19v2.5"],
  shipping: [
    "M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z",
    "M3.5 12h17",
    "M12 3.5c2.4 2.5 3.6 5.3 3.6 8.5s-1.2 6-3.6 8.5c-2.4-2.5-3.6-5.3-3.6-8.5S9.6 6 12 3.5z",
  ],
  account: [
    "M12 5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z",
    "M5 20c1.2-3.6 3.8-5.5 7-5.5s5.8 1.9 7 5.5",
  ],
};

/** Strokes draw themselves in when the menu opens; they tilt on hover. */
function NavIcon({ name, drawn, delay }: { name: string; drawn: boolean; delay: number }) {
  const paths = ICONS[name];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden
      className="size-6 fill-none stroke-current transition-transform duration-500 ease-[var(--ease-out-soft)] group-hover:-rotate-6 group-hover:scale-110"
      strokeWidth={1.25}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths.map((d) => (
        <path
          key={d}
          d={d}
          pathLength={1}
          strokeDasharray={1}
          style={{
            strokeDashoffset: drawn ? 0 : 1,
            transition: `stroke-dashoffset 1.1s var(--ease-out-soft) ${drawn ? delay : 0}ms`,
          }}
        />
      ))}
    </svg>
  );
}
