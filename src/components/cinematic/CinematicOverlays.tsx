import type { RefObject } from "react";
import Link from "next/link";
import { getDict, localePath, type Locale } from "@/lib/i18n";

export function CinematicBrand() {
  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center px-[var(--gutter)] text-center">
      <div className="relative isolate flex flex-col items-center drop-shadow-[0_3px_12px_rgba(0,0,0,0.72)]">
        <span
          aria-hidden="true"
          className="u-emblem size-[clamp(4.5rem,9vw,7.5rem)] text-cream"
          style={{
            ["--emblem-src" as string]: "url(/brand/emblem-mark.png)",
          }}
        />
        <h1 className="u-mono mt-6 text-[clamp(0.85rem,1.4vw,1.1rem)] tracking-[0.42em] text-cream">
          Zuruny
        </h1>
      </div>
    </div>
  );
}

export function CinematicEndCta({
  locale,
  containerRef,
}: {
  locale: Locale;
  containerRef: RefObject<HTMLDivElement | null>;
}) {
  const t = getDict(locale);

  return (
    <div
      ref={containerRef}
      data-end-cta
      inert
      aria-hidden="true"
      className="absolute inset-x-0 bottom-[clamp(4rem,10vh,7rem)] z-30 flex justify-center px-[var(--gutter)] will-change-transform"
      style={{ opacity: 0, pointerEvents: "none" }}
    >
      <div className="relative isolate flex flex-wrap items-center justify-center gap-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.82)] sm:gap-4">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(11,9,8,0.58)_0%,rgba(11,9,8,0.2)_52%,transparent_76%)]"
        />
        <Link
          href={localePath(locale, "/shop")}
          className="u-mono bg-cream px-6 py-4 text-ground transition-colors duration-300 hover:bg-ochre sm:px-8"
        >
          {t.hero.ctaShop}
        </Link>
        <Link
          href={localePath(locale, "/names")}
          className="u-mono border border-cream/55 px-6 py-4 text-cream transition-[border-color,color] duration-300 hover:border-ochre hover:text-ochre sm:px-8"
        >
          {t.hero.ctaNames}
        </Link>
      </div>
    </div>
  );
}
