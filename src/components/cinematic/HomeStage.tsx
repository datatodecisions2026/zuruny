"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { clamp } from "@/data/homepageStory";
import { getDict, type Locale } from "@/lib/i18n";
import { CinematicEndCta } from "@/components/cinematic/CinematicOverlays";
import { HERO_READY } from "@/components/SkotHeroMotion";
import { CHAPTERS, LANDED, activeChapter, chapterOpacity, ctaReveal, warmth } from "@/data/oilSceneTimeline";

// Real-time 3D jars falling through a cream sky onto the "Zuruny Final" still
// life. Browser only.
const OilScene = dynamic(() => import("./OilScene"), { ssr: false });

// Once the hero's films are in (its loader lifts), the models stream while
// the intro rotation plays, long before anyone scrolls to them.
const SCENE_DELAY_MS = 1500;
// If the hero never reports ready, load the scene anyway.
const SCENE_FALLBACK_MS = 20000;
// The stage scrolls 550svh (section height minus the pinned screen).
const STAGE_SVH = 550;
// The hero lifts off the jar scene like a stage curtain over the first 100svh.
const CURTAIN_SPAN = 100 / STAGE_SVH;
// The jar scene starts with the lift, so the jars are already falling in
// under the rising curtain.
const SCENE_START = 0;
// How far the hero's contents lag the curtain as it lifts (parallax), as a
// share of the screen height.
const CURTAIN_LAG = 0.35;
// How far chapter copy drifts across its chapter, as a share of the screen height.
const DRIFT_SHARE = 0.12;

function smoothstep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}


/**
 * The homepage's opening, all screen sizes, one pinned stage scrubbed by
 * GSAP/ScrollTrigger. The tree hero (`hero`) holds the first screen like a
 * game lobby; scrolling lifts it like a stage curtain, its contents lagging
 * behind, off the real-time 3D jars already falling underneath: four copy
 * chapters in the sky, then the still life.
 */
export function HomeStage({ locale, hero }: { locale: Locale; hero: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const pausedFilmsRef = useRef<HTMLVideoElement[]>([]);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const navRef = useRef<HTMLElement>(null);
  const studioRef = useRef<HTMLDivElement>(null);
  const endCtaRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const invalidateRef = useRef<(() => void) | null>(null);
  const [sceneOn, setSceneOn] = useState(false);
  const t = getDict(locale);
  const chapters = t.cinematic.jars;

  const renderProgress = useCallback((stage: number) => {
    const heroEl = heroRef.current;
    if (heroEl) {
      const lift = smoothstep(stage / CURTAIN_SPAN);
      heroEl.style.transform = `translate3d(0, ${-lift * 100}%, 0)`;
      // Its contents lag the curtain, so the tree and cards drift as it rises.
      const inner = heroEl.firstElementChild as HTMLElement | null;
      if (inner) inner.style.transform = `translate3d(0, ${lift * CURTAIN_LAG * 100}%, 0)`;
      const radius = `${Math.round(lift * 48)}px`;
      heroEl.style.borderBottomLeftRadius = radius;
      heroEl.style.borderBottomRightRadius = radius;
      heroEl.style.boxShadow = lift > 0 ? `0 40px 90px -20px rgba(0,0,0,${0.55 * (1 - lift)})` : "none";
      const gone = lift >= 1;
      heroEl.style.visibility = gone ? "hidden" : "visible";
      heroEl.toggleAttribute("inert", gone);
      // Don't decode the loop once nobody can see it; resume it on return.
      if (gone && pausedFilmsRef.current.length === 0) {
        pausedFilmsRef.current = [...heroEl.querySelectorAll("video")].filter((video) => !video.paused);
        pausedFilmsRef.current.forEach((video) => video.pause());
      } else if (!gone && pausedFilmsRef.current.length > 0) {
        pausedFilmsRef.current.forEach((video) => void video.play().catch(() => {}));
        pausedFilmsRef.current = [];
      }
    }

    const progress = clamp((stage - SCENE_START) / (1 - SCENE_START), 0, 1);
    if (progress !== progressRef.current) {
      progressRef.current = progress;
      invalidateRef.current?.();
    }

    chapterRefs.current.forEach((el, i) => {
      if (!el) return;
      const shown = chapterOpacity(progress, i);
      el.style.opacity = String(shown);
      el.style.transform = `translate3d(0, ${(1 - shown) * 28}px, 0)`;
      el.style.visibility = shown > 0 ? "visible" : "hidden";
      // Parallax: through its chapter the copy drifts up, each line at its own
      // speed (eyebrow fastest, body slowest, scaling --drift), so the lines
      // ease apart as they go without ever colliding.
      const { from, to } = CHAPTERS[i];
      const local = clamp((progress - from) / (to - from), 0, 1);
      el.style.setProperty("--drift", `${(0.5 - local) * DRIFT_SHARE * window.innerHeight}px`);
    });

    const nav = navRef.current;
    if (nav) {
      const shown = stage >= CURTAIN_SPAN && progress < LANDED - 0.04;
      nav.style.opacity = shown ? "1" : "0";
      nav.style.pointerEvents = shown ? "auto" : "none";
      nav.toggleAttribute("inert", !shown);
      const active = activeChapter(progress);
      nav.querySelectorAll("button").forEach((b, i) => b.toggleAttribute("data-active", i === active));
    }

    if (studioRef.current) studioRef.current.style.opacity = String(warmth(progress));

    const endCta = endCtaRef.current;
    if (endCta) {
      const reveal = ctaReveal(progress);
      const interactive = reveal > 0.9;
      endCta.style.opacity = String(reveal);
      endCta.style.transform = `translate3d(0, ${(1 - reveal) * 24}px, 0)`;
      endCta.style.pointerEvents = interactive ? "auto" : "none";
      endCta.toggleAttribute("inert", !interactive);
      endCta.setAttribute("aria-hidden", String(!interactive));
    }
  }, []);

  // Fetch the models once the hero's films are in.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let delay = 0;
    const onReady = () => {
      delay = window.setTimeout(() => setSceneOn(true), SCENE_DELAY_MS);
    };
    window.addEventListener(HERO_READY, onReady, { once: true });
    const fallback = window.setTimeout(() => setSceneOn(true), SCENE_FALLBACK_MS);
    return () => {
      window.removeEventListener(HERO_READY, onReady);
      window.clearTimeout(delay);
      window.clearTimeout(fallback);
    };
  }, []);

  const noop = useCallback(() => {}, []);

  // Nav: scroll to the middle of a chapter.
  const goTo = useCallback((i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const { from, to } = CHAPTERS[i];
    const stage = SCENE_START + (1 - SCENE_START) * ((from + to) / 2);
    const top = section.getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: top + stage * (section.offsetHeight - window.innerHeight), behavior: "smooth" });
  }, []);

  useEffect(() => {
    const section = sectionRef.current;
    // Reduced motion: the stage collapses to one screen holding the hero.
    if (!section || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let disposed = false;
    let cleanup = () => {};

    async function start() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed || !section) return;
      gsap.registerPlugin(ScrollTrigger);

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        onUpdate: (self) => renderProgress(self.progress),
      });
      renderProgress(trigger.progress);
      cleanup = () => trigger.kill();
    }

    start().catch(() => {});
    return () => {
      disposed = true;
      cleanup();
    };
  }, [renderProgress]);

  return (
    <section
      ref={sectionRef}
      aria-label={locale === "fr" ? "Zuruny, de l'arbre au pot" : "Zuruny, from the tree to the jar"}
      className="relative isolate block h-[650svh] overflow-clip bg-ground motion-reduce:h-[100svh]"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center gap-8 overflow-hidden px-[var(--gutter)] md:items-start">
        {/* Cream until the model arrives, so the copy never sits on the dark ground. */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[#f1ece3]">
          {sceneOn && (
            <OilScene progressRef={progressRef} invalidateRef={invalidateRef} onReady={noop} onProgress={noop} />
          )}
        </div>

        {/* Studio vignette, only once the sky has warmed to burgundy. */}
        <div
          ref={studioRef}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_85%_70%_at_58%_42%,transparent_45%,rgba(24,4,9,0.7)_100%)]"
          style={{ opacity: 0 }}
        />

        {/* Chapters: on wide screens beside the jars, alternating sides; on
            phones below them (OilScene lifts the jars into the upper half). */}
        {chapters.map((chapter, i) => (
          <div
            key={chapter.title}
            ref={(el) => {
              chapterRefs.current[i] = el;
            }}
            className={`absolute inset-x-0 bottom-[calc(max(5rem,13svh)+env(safe-area-inset-bottom))] z-10 px-[var(--gutter)] text-center will-change-transform md:inset-x-auto md:bottom-auto md:top-1/2 md:max-w-[36ch] md:-translate-y-1/2 md:px-0 md:text-left ${
              CHAPTERS[i].side === "left" ? "md:left-[7vw]" : "md:right-[7vw]"
            }`}
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <p className="u-mono mb-3 text-raspberry [translate:0_calc(var(--drift,0px)*1.25)]">{chapter.eyebrow}</p>
            <h2 className="u-display text-[length:var(--step-3)] leading-[0.95] text-oxblood [translate:0_var(--drift,0px)] md:text-[length:var(--step-4)]">
              {chapter.title}
            </h2>
            <p className="u-measure mx-auto mt-3 text-[length:var(--step-0)] text-oxblood/75 [translate:0_calc(var(--drift,0px)*0.75)] md:mx-0 md:mt-4">
              {chapter.body}
            </p>
          </div>
        ))}

        <nav
          ref={navRef}
          aria-label={locale === "fr" ? "Chapitres" : "Chapters"}
          className="absolute inset-x-0 bottom-6 z-20 hidden justify-center gap-8 transition-opacity duration-500 md:flex"
          style={{ opacity: 0, pointerEvents: "none" }}
          inert
        >
          {chapters.map((chapter, i) => (
            <button
              key={chapter.title}
              type="button"
              onClick={() => goTo(i)}
              className="group u-mono flex items-center gap-2 text-[length:var(--step--1)] text-oxblood/45 transition-colors duration-300 hover:text-oxblood data-[active]:text-oxblood"
            >
              <span className="h-px w-4 bg-current transition-[width] duration-300 group-data-[active]:w-8" />
              {chapter.title}
            </button>
          ))}
        </nav>

        <CinematicEndCta locale={locale} containerRef={endCtaRef} />

        {/* The curtain: rounded and shadowed along its bottom edge as it lifts. */}
        <div ref={heroRef} className="absolute inset-0 z-50 overflow-hidden will-change-transform">
          {hero}
        </div>
      </div>
    </section>
  );
}
