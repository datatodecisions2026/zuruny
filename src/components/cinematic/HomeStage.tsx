"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { endCtaMotion, clamp } from "@/data/homepageStory";
import { getDict, type Locale } from "@/lib/i18n";
import { CinematicEndCta } from "@/components/cinematic/CinematicOverlays";
import { FILM_CLASS } from "@/components/SkotHeroMotion";

// Real-time 3D pour (jar → drops → cup, falling olives), built from the
// "Zuruny Final" Blender scene. Browser only.
const OilScene = dynamic(() => import("./OilScene"), { ssr: false });

// Let the hero's films get the network first; the model streams in after,
// long before anyone scrolls to it.
const SCENE_DELAY_MS = 1500;
// Share of the stage's scroll that turns the tree (1.5–5 s of tree_rotate,
// scrubbed) before the hard cut to the jar; the pour takes the rest. 150svh
// of a 450svh scroll.
const BRIDGE_SPAN = 1 / 3;
// The hero (idle loop, logo, cards) blends into the turning tree over the
// first 40svh. Same tree, same backlit light, so the blend reads as the
// lobby coming to life rather than one scene over another.
const HERO_FADE = 40 / 450;

function smoothstep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

/** Eyebrow/title/body fade in early, hold, then clear well before the CTA reveal. */
function copyMotion(progress: number) {
  const enter = smoothstep((progress - 0.05) / 0.11);
  const exit = 1 - smoothstep((progress - 0.42) / 0.13);
  return { opacity: enter * exit, y: (1 - enter) * 28 };
}

/**
 * The homepage's opening, all screen sizes, one pinned stage scrubbed by
 * GSAP/ScrollTrigger. The tree hero (`hero`) holds the first screen like a
 * game lobby; scrolling blends it into the bridge film underneath, so the
 * tree starts turning and lights up with the scroll, then a hard cut to the
 * real-time 3D pour. Film never blends over the 3D scene: that muddied both.
 */
export function HomeStage({ locale, hero }: { locale: Locale; hero: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const pausedFilmsRef = useRef<HTMLVideoElement[]>([]);
  const bridgeRef = useRef<HTMLVideoElement>(null);
  const pendingSeekRef = useRef<number | null>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const endCtaRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const invalidateRef = useRef<(() => void) | null>(null);
  const [sceneOn, setSceneOn] = useState(false);
  const t = getDict(locale);
  const copy = t.cinematic.oilDrop;

  const renderProgress = useCallback((stage: number) => {
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

    const copyEl = copyRef.current;
    if (copyEl) {
      const motion = copyMotion(progress);
      copyEl.style.opacity = String(motion.opacity);
      copyEl.style.transform = `translate3d(0, ${motion.y}px, 0)`;
    }

    const endCta = endCtaRef.current;
    if (endCta) {
      const motion = endCtaMotion(progress);
      const interactive = motion.opacity > 0.9;
      endCta.style.opacity = String(motion.opacity);
      endCta.style.transform = `translate3d(0, ${motion.y}px, 0)`;
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
      if (bridge) {
        // Every frame is a keyframe, so seeks land instantly both ways.
        const cut = window.matchMedia("(min-width: 768px)").matches ? "" : "-mobile";
        bridge.muted = true;
        bridge.poster = `/skot/tree-bridge${cut}-poster.webp`;
        bridge.src = `/skot/tree-bridge${cut}.mp4`;
      }
      setSceneOn(true);
    }, SCENE_DELAY_MS);
    return () => {
      window.clearTimeout(timeoutId);
      bridge?.removeEventListener("seeked", onSeeked);
    };
  }, []);

  const noop = useCallback(() => {}, []);

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
      aria-label={locale === "fr" ? "Zuruny, de l'arbre à la goutte" : "Zuruny, from the tree to the drop"}
      className="relative isolate block h-[550svh] overflow-clip bg-ground motion-reduce:h-[100svh]"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center gap-8 overflow-hidden px-[var(--gutter)] md:items-start">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          {sceneOn && (
            <OilScene
              backdrop={copy.backdrop}
              progressRef={progressRef}
              invalidateRef={invalidateRef}
              onReady={noop}
              onProgress={noop}
            />
          )}
        </div>

        {/* Studio vignette over the burgundy sweep, heavier on the left as in
            oil_drop_new.mp4. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_85%_70%_at_58%_42%,transparent_45%,rgba(24,4,9,0.7)_100%)]"
        />

        {/* On wide screens the drop rides right of centre (OilScene), so the
            copy takes the left. */}
        <div
          ref={copyRef}
          className="relative z-10 max-w-[30ch] text-center will-change-transform md:ml-[6vw] md:max-w-[34ch] md:text-left"
          style={{ opacity: 0 }}
        >
          <p className="u-mono mb-3 text-ochre">{copy.eyebrow}</p>
          <h2 className="u-display text-[length:var(--step-3)] text-cream">
            {copy.title}
          </h2>
          <p className="u-measure mt-3 text-[length:var(--step-0)] text-[var(--text-muted)]">
            {copy.body}
          </p>
        </div>

        <CinematicEndCta locale={locale} containerRef={endCtaRef} />

        <video
          ref={bridgeRef}
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
          className={`${FILM_CLASS} z-40`}
        />

        <div ref={heroRef} className="absolute inset-0 z-50">
          {hero}
        </div>
      </div>
    </section>
  );
}
