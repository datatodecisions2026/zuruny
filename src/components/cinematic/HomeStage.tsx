"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { clamp } from "@/data/homepageStory";
import { getDict, type Locale } from "@/lib/i18n";
import { CinematicEndCta } from "@/components/cinematic/CinematicOverlays";
import { FILM_CLASS } from "@/components/SkotHeroMotion";
import { CHAPTERS, LANDED, activeChapter, chapterOpacity, ctaReveal, warmth } from "@/data/oilSceneTimeline";

// Real-time 3D jars falling through a cream sky onto the "Zuruny Final" still
// life. Browser only.
const OilScene = dynamic(() => import("./OilScene"), { ssr: false });

// Let the hero's films get the network first; the model streams in after,
// long before anyone scrolls to it.
const SCENE_DELAY_MS = 1500;
// The stage scrolls 650svh (section height minus the pinned screen).
const STAGE_SVH = 650;
// Share of the stage's scroll that turns the tree (1.5–5 s of tree_rotate,
// scrubbed) before the hard cut to the jars; the jar scene takes the rest.
// Held at 150svh so the tree turns exactly as before.
const BRIDGE_SPAN = 150 / STAGE_SVH;
// The hero (idle loop, logo, cards) blends into the turning tree over the
// first 40svh. Same tree, same backlit light, so the blend reads as the
// lobby coming to life rather than one scene over another.
const HERO_FADE = 40 / STAGE_SVH;
// Stills in public/skot/bridge-mobile that stand in for the bridge film on phones.
const MOBILE_FRAMES = 30;

function smoothstep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}


/**
 * The homepage's opening, all screen sizes, one pinned stage scrubbed by
 * GSAP/ScrollTrigger. The tree hero (`hero`) holds the first screen like a
 * game lobby; scrolling blends it into the bridge film underneath, so the
 * tree starts turning and lights up with the scroll, then a hard cut to the
 * real-time 3D jars: four copy chapters in the sky, then the still life.
 * Film never blends over the 3D scene: that muddied both.
 */
export function HomeStage({ locale, hero }: { locale: Locale; hero: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const pausedFilmsRef = useRef<HTMLVideoElement[]>([]);
  const bridgeRef = useRef<HTMLVideoElement>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const chapterRefs = useRef<(HTMLDivElement | null)[]>([]);
  const navRef = useRef<HTMLElement>(null);
  const studioRef = useRef<HTMLDivElement>(null);
  const endCtaRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const stageRef = useRef(0);
  const frameCanvasRef = useRef<HTMLCanvasElement>(null);
  const framesRef = useRef<HTMLImageElement[]>([]);
  const drawnRef = useRef(-1);
  const invalidateRef = useRef<(() => void) | null>(null);
  const [sceneOn, setSceneOn] = useState(false);
  const t = getDict(locale);
  const chapters = t.cinematic.jars;

  const renderProgress = useCallback((stage: number) => {
    stageRef.current = stage;
    const heroEl = heroRef.current;
    if (heroEl) {
      const fade = smoothstep(stage / HERO_FADE);
      heroEl.style.opacity = String(1 - fade);
      const gone = fade >= 1;
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

    const turning = stage < BRIDGE_SPAN;
    const canvas = frameCanvasRef.current;
    if (canvas) {
      canvas.style.visibility = turning ? "visible" : "hidden";
      const frames = framesRef.current;
      const i = Math.round(clamp(stage / BRIDGE_SPAN, 0, 1) * (MOBILE_FRAMES - 1));
      const img = frames[i]?.complete && frames[i].naturalWidth ? frames[i] : null;
      // A frame that hasn't arrived yet keeps the previous one on screen.
      if (turning && img && drawnRef.current !== i) {
        drawnRef.current = i;
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
      }
    }

    const bridge = bridgeRef.current;
    if (bridge) {
      const turning = stage < BRIDGE_SPAN;
      bridge.style.visibility = turning ? "visible" : "hidden";
      if (turning && Number.isFinite(bridge.duration)) {
        const time = clamp(stage / BRIDGE_SPAN, 0, 1) * (bridge.duration - 0.05);
        // One seek at a time; the latest target waits for the current one.
        if (bridge.seeking) pendingSeekRef.current = time;
        else bridge.currentTime = time;
      }
    }

    const progress = clamp((stage - BRIDGE_SPAN) / (1 - BRIDGE_SPAN), 0, 1);
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
    });

    const nav = navRef.current;
    if (nav) {
      const shown = stage >= BRIDGE_SPAN && progress < LANDED - 0.04;
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

  // After the hero's loop has the network: the bridge film and the model.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const bridge = bridgeRef.current;
    const onSeeked = () => {
      const next = pendingSeekRef.current;
      pendingSeekRef.current = null;
      if (bridge && next !== null) bridge.currentTime = next;
    };
    bridge?.addEventListener("seeked", onSeeked);
    const timeoutId = window.setTimeout(() => {
      if (!window.matchMedia("(min-width: 768px)").matches) {
        // Phones: seeking a video every scroll tick lags, so the turn is 30
        // stills painted to a canvas instead.
        framesRef.current = Array.from({ length: MOBILE_FRAMES }, (_, n) => {
          const img = new Image();
          img.src = `/skot/bridge-mobile/f${String(n + 1).padStart(2, "0")}.webp`;
          return img;
        });
        framesRef.current[0].onload = () => renderProgress(stageRef.current);
      } else if (bridge) {
        // Every frame is a keyframe, so seeks land instantly both ways.
        bridge.muted = true;
        bridge.poster = "/skot/tree-bridge-poster.webp";
        bridge.src = "/skot/tree-bridge.mp4";
      }
      setSceneOn(true);
    }, SCENE_DELAY_MS);
    return () => {
      window.clearTimeout(timeoutId);
      bridge?.removeEventListener("seeked", onSeeked);
    };
  }, [renderProgress]);

  const noop = useCallback(() => {}, []);

  // Nav: scroll to the middle of a chapter.
  const goTo = useCallback((i: number) => {
    const section = sectionRef.current;
    if (!section) return;
    const { from, to } = CHAPTERS[i];
    const stage = BRIDGE_SPAN + (1 - BRIDGE_SPAN) * ((from + to) / 2);
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
      className="relative isolate block h-[750svh] overflow-clip bg-ground motion-reduce:h-[100svh]"
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
            className={`absolute inset-x-0 bottom-[max(3.5rem,9svh)] z-10 px-[var(--gutter)] text-center will-change-transform md:inset-x-auto md:bottom-auto md:top-1/2 md:max-w-[36ch] md:-translate-y-1/2 md:px-0 md:text-left ${
              CHAPTERS[i].side === "left" ? "md:left-[7vw]" : "md:right-[7vw]"
            }`}
            style={{ opacity: 0, visibility: "hidden" }}
          >
            <p className="u-mono mb-3 text-raspberry">{chapter.eyebrow}</p>
            <h2 className="u-display text-[length:var(--step-3)] leading-[0.95] text-oxblood md:text-[length:var(--step-4)]">
              {chapter.title}
            </h2>
            <p className="u-measure mx-auto mt-4 text-[length:var(--step-0)] text-oxblood/75 md:mx-0">{chapter.body}</p>
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

        <video
          ref={bridgeRef}
          muted
          playsInline
          preload="none"
          aria-hidden="true"
          className={`${FILM_CLASS} z-40 max-md:hidden`}
        />
        <canvas
          ref={frameCanvasRef}
          width={540}
          height={960}
          aria-hidden="true"
          className={`${FILM_CLASS} z-40 md:hidden`}
        />

        <div ref={heroRef} className="absolute inset-0 z-50">
          {hero}
        </div>
      </div>
    </section>
  );
}
