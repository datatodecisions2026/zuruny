import Link from "next/link";
import { Rokkitt } from "next/font/google";
import { SkotHeroMotion } from "@/components/SkotHeroMotion";
import { getDict, localePath, type Locale } from "@/lib/i18n";

const rokkitt = Rokkitt({ subsets: ["latin"], display: "swap" });

// Cards wait below and transparent until the root gets data-cards.
const GLIDE =
  "opacity-0 translate-y-6 transition-[opacity,translate] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-data-[cards]/hero:translate-y-0 group-data-[cards]/hero:opacity-100 motion-reduce:transition-none";

const GLASS = {
  backgroundImage:
    "linear-gradient(102.16deg, rgba(255,255,255,0.5) 3.89%, rgba(255,255,255,0.025) 97.64%)",
};

/* The tree hero, built from Figma GRIGOLETTO "52 — Skot" / Screen 01. A layer
   of HomeStage: it fills the pinned viewport and lifts off the 3D jar scene
   like a stage curtain on scroll. The cards glide in once the intro rotation
   nears its end (SkotHeroMotion sets data-cards on this root). Desktop is the 1440×810 artboard scaled by --u (one design px)
   to fit, anchored bottom-centre; phones get a portrait adaptation of it.
   Splendor Escape (the template's display face) isn't a web font we ship,
   so those runs use the site's display serif. */
export function SkotHero({ locale }: { locale: Locale }) {
  const dict = getDict(locale);
  const t = dict.skot;
  const about = localePath(locale, "/about");

  return (
    <div
      className={`${rokkitt.className} group/hero absolute inset-0 isolate overflow-hidden bg-[#020201] text-white [container-type:size]`}
      style={{ ["--u" as string]: "min(100vw / 1440, 100svh / 810)" }}
    >
      <h1 className="sr-only">Zuruny</h1>
      <SkotHeroMotion loading={dict.cinematic.loading} />

      {/* Desktop films carry a watermark star at (1160, 600) of 1280 × 720,
          ~48px across; phones' films have none. An olive branch from the
          journal sits over it, placed in film pixels through the same
          cover-fit the film uses (--s: film px → screen), so it tracks the
          star at any window size. A soft blur underneath catches what the
          leaves leave uncovered. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute hidden md:block"
        style={{
          ["--s" as string]: "max(100cqw / 1280, 100cqh / 720)",
          ["--w" as string]: "calc(var(--s) * 240)",
          width: "var(--w)",
          left: "calc(50% + var(--s) * 520 - var(--w) * 0.22)",
          top: "calc(50% + var(--s) * 240 - var(--w) * 0.36)",
        }}
      >
        <div
          className="absolute size-[calc(var(--s)*80)] rounded-full backdrop-blur-md [mask-image:radial-gradient(closest-side,#000_55%,transparent)]"
          style={{ left: "calc(var(--w) * 0.22 - var(--s) * 40)", top: "calc(var(--w) * 0.36 - var(--s) * 40)" }}
        />
        <img
          src="/hero_scenes/olive-branch.webp"
          alt=""
          className="relative w-full origin-[22%_58%] -rotate-12 drop-shadow-[0_6px_10px_rgba(0,0,0,0.45)]"
        />
      </div>

      {/* Phones */}
      <div className="absolute inset-x-0 bottom-0 px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-16 md:hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-black/35 to-transparent"
        />
        <div className={`flex gap-3 ${GLIDE}`}>
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
          className={`absolute left-[calc(var(--u)*871.76)] top-[calc(var(--u)*610)] h-[calc(var(--u)*165)] w-[calc(var(--u)*160)] rounded-[calc(var(--u)*32)] ${GLIDE} focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white`}
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
          className={`absolute left-[calc(var(--u)*1050.77)] top-[calc(var(--u)*613)] flex h-[calc(var(--u)*162)] items-center gap-[calc(var(--u)*12)] rounded-[calc(var(--u)*32)] pr-[calc(var(--u)*20)] backdrop-blur-[20px] ${GLIDE} delay-150`}
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
