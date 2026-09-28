"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";
import { endCtaMotion, clamp } from "@/data/homepageStory";
import { getDict, type Locale } from "@/lib/i18n";
import { CinematicEndCta } from "@/components/cinematic/CinematicOverlays";

// Real-time 3D pour (jar → drops → cup, falling olives), built from the
// "Zuruny Final" Blender scene. Browser only.
const OilScene = dynamic(() => import("./OilScene"), { ssr: false });

// Share of the stage's scroll spent dissolving the hero into the pour; the
// pour scrubs across the rest.
const HERO_SPAN = 0.2;
// Let the hero's films get the network first; the model streams in after,
// long before anyone scrolls to it.
const SCENE_DELAY_MS = 1500;

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
 * The homepage's pinned stage, all screen sizes. The tree hero (`hero`)
 * holds the first screen like a game lobby; scrolling dissolves it into the
 * real-time 3D pour underneath, which GSAP/ScrollTrigger scrubs from there.
 */
export function HomeStage({ locale, hero }: { locale: Locale; hero: ReactNode }) {
  const sectionRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const endCtaRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const invalidateRef = useRef<(() => void) | null>(null);
  const pausedFilmsRef = useRef<HTMLVideoElement[]>([]);
  const [sceneOn, setSceneOn] = useState(false);
  const t = getDict(locale);
  const copy = t.cinematic.oilDrop;

  const renderProgress = useCallback((stage: number) => {
    const fade = smoothstep(stage / HERO_SPAN);
    const heroEl = heroRef.current;
    if (heroEl) {
      heroEl.style.opacity = String(1 - fade);
      heroEl.style.transform = `scale(${1 + 0.08 * fade})`;
      const gone = fade >= 1;
      heroEl.style.visibility = gone ? "hidden" : "visible";
      heroEl.toggleAttribute("inert", gone);
      // Don't decode films nobody can see; resume exactly those on return.
      if (gone && pausedFilmsRef.current.length === 0) {
        heroEl.querySelectorAll("video").forEach((video) => {
          if (!video.paused) {
            video.pause();
            pausedFilmsRef.current.push(video);
          }
        });
      } else if (!gone && pausedFilmsRef.current.length > 0) {
        pausedFilmsRef.current.forEach((video) => void video.play().catch(() => {}));
        pausedFilmsRef.current = [];
      }
    }

    const progress = clamp((stage - HERO_SPAN) / (1 - HERO_SPAN), 0, 1);
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

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const timeoutId = window.setTimeout(() => setSceneOn(true), SCENE_DELAY_MS);
    return () => window.clearTimeout(timeoutId);
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
      className="relative isolate block h-[500svh] overflow-clip bg-ground motion-reduce:h-[100svh]"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center gap-8 overflow-hidden px-[var(--gutter)] md:items-start">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
          {sceneOn && (
            <OilScene
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

        <div ref={heroRef} className="absolute inset-0 z-40 origin-center will-change-[opacity,transform]">
          {hero}
        </div>
      </div>
    </section>
  );
}
