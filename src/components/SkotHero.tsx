import Link from "next/link";
import { Rokkitt } from "next/font/google";
import { SkotHeroMotion } from "@/components/SkotHeroMotion";
import { getDict, localePath, type Locale } from "@/lib/i18n";

const rokkitt = Rokkitt({ subsets: ["latin"], display: "swap" });

const GLASS = {
  backgroundImage:
    "linear-gradient(102.16deg, rgba(255,255,255,0.5) 3.89%, rgba(255,255,255,0.025) 97.64%)",
};

/* The tree hero, built from Figma GRIGOLETTO "52 — Skot" / Screen 01. A layer
   of HomeStage: it fills the pinned viewport and dissolves into the 3D pour
   on scroll. Desktop is the 1440×810 artboard scaled by --u (one design px)
   to fit, anchored bottom-centre; phones get a portrait adaptation of it.
   Splendor Escape (the template's display face) isn't a web font we ship,
   so those runs use the site's display serif. */
export function SkotHero({ locale }: { locale: Locale }) {
  const t = getDict(locale).skot;
  const about = localePath(locale, "/about");

  return (
    <div
      className={`${rokkitt.className} absolute inset-0 isolate overflow-hidden bg-[#020201] text-white`}
      style={{ ["--u" as string]: "min(100vw / 1440, 100svh / 810)" }}
    >
      <h1 className="sr-only">Zuruny</h1>
      <SkotHeroMotion />

      {/* Phones */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16 md:hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/35 to-transparent"
        />
        <div className="flex gap-3">
          <Link
            href={about}
            aria-label={t.filmLabel}
            className="relative aspect-[160/165] w-24 shrink-0 rounded-3xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            <img src="/film/zuruny-about-poster.webp" alt="" className="size-full rounded-3xl object-cover" />
            <img src="/skot/play.svg" alt="" className="absolute bottom-1.5 left-1.5 size-9" />
          </Link>
          <div className="flex-1 rounded-3xl p-4 backdrop-blur-[20px]" style={GLASS}>
            <h3 className="font-display text-xl uppercase leading-none">{t.cardTitle}</h3>
            <p className="mt-2 text-xs leading-snug opacity-75">{t.cardBody}</p>
          </div>
        </div>
      </div>

      {/* Desktop artboard */}
      <div className="absolute bottom-0 left-1/2 hidden h-[calc(var(--u)*810)] w-[calc(var(--u)*1440)] -translate-x-1/2 md:block">
        <Link
          href={about}
          aria-label={t.filmLabel}
          className="absolute left-[calc(var(--u)*871.76)] top-[calc(var(--u)*610)] h-[calc(var(--u)*165)] w-[calc(var(--u)*160)] rounded-[calc(var(--u)*32)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
        >
          <img
            src="/film/zuruny-about-poster.webp"
            alt=""
            className="size-full rounded-[calc(var(--u)*32)] object-cover"
          />
          <img
            src="/skot/play.svg"
            alt=""
            className="absolute left-[calc(var(--u)*6)] top-[calc(var(--u)*97)] size-[calc(var(--u)*60.11)]"
          />
        </Link>

        <div
          className="absolute left-[calc(var(--u)*1050.77)] top-[calc(var(--u)*613)] flex h-[calc(var(--u)*162)] items-center gap-[calc(var(--u)*12)] rounded-[calc(var(--u)*32)] pr-[calc(var(--u)*20)] backdrop-blur-[20px]"
          style={GLASS}
        >
          <img
            src="/film/em-ramiz-poster.jpg"
            alt=""
            className="h-full w-[calc(var(--u)*160)] shrink-0 rounded-[calc(var(--u)*24)] object-cover"
          />
          <div className="flex w-[calc(var(--u)*173.23)] flex-col gap-[calc(var(--u)*20)] py-[calc(var(--u)*20)]">
            <h3 className="font-display text-[calc(var(--u)*28)] uppercase leading-none">
              {t.cardTitle}
            </h3>
            <p className="text-[calc(var(--u)*14)] tracking-[-0.01em] opacity-70">
              {t.cardBody}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
