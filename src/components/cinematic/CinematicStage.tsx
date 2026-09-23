"use client";

import { useCallback, useEffect, useRef } from "react";
import {
  SCENES,
  endCtaMotion,
  sceneCopyMotion,
  sceneOpacity,
  scenePlaybackProgress,
  clamp,
} from "@/data/homepageStory";
import { getDict, type Locale } from "@/lib/i18n";
import {
  CinematicEndCta,
} from "@/components/cinematic/CinematicOverlays";
import { CinematicScene } from "@/components/cinematic/CinematicScene";

const SEEK_THRESHOLD_SECONDS = 0.04;

/**
 * A pinned, scroll-scrubbed sequence of films. The scene ranges in
 * homepageStory.ts overlap briefly, which gives each transition its crossfade.
 */
export function CinematicStage({ locale }: { locale: Locale }) {
  const containerRef = useRef<HTMLElement>(null);
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const textRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const endCtaRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const t = getDict(locale);

  const renderProgress = useCallback((progress: number) => {
    SCENES.forEach((scene, index) => {
      const opacity = sceneOpacity(SCENES, index, progress);
      const layer = layerRefs.current[scene.id];
      const video = videoRefs.current[scene.id];
      const copy = textRefs.current[scene.id];

      if (layer) {
        layer.style.opacity = String(opacity);
        layer.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
      }

      if (
        video &&
        !scene.loop &&
        video.readyState >= HTMLMediaElement.HAVE_METADATA
      ) {
        const target = scenePlaybackProgress(scene, progress) * video.duration;
        if (
          Number.isFinite(target) &&
          Math.abs(video.currentTime - target) > SEEK_THRESHOLD_SECONDS
        ) {
          video.currentTime = target;
        }
      }

      if (copy) {
        const motion = sceneCopyMotion(scene, progress);
        copy.style.opacity = String(motion.opacity);
        copy
          .querySelectorAll<HTMLElement>("[data-parallax-depth]")
          .forEach((element) => {
            const depth = Number(element.dataset.parallaxDepth ?? "1");
            element.style.transform = `translate3d(${motion.x * depth}px, ${motion.y * depth}px, 0)`;
          });
      }
    });

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
    const container = containerRef.current;
    const idle = videoRefs.current.idle;
    if (!container) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      renderProgress(0);
      idle?.pause();
      const endCta = endCtaRef.current;
      if (endCta) {
        endCta.style.opacity = "1";
        endCta.style.transform = "none";
        endCta.style.pointerEvents = "auto";
        endCta.removeAttribute("inert");
        endCta.setAttribute("aria-hidden", "false");
      }
      return;
    }

    let active = false;

    const update = () => {
      rafRef.current = null;
      if (!active) return;

      const rect = container.getBoundingClientRect();
      const scrollable = rect.height - window.innerHeight;
      const progress =
        scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;

      renderProgress(progress);
    };

    const scheduleUpdate = () => {
      if (active && rafRef.current === null) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          active = true;
          void idle?.play().catch(() => {
            // The poster remains visible when autoplay is unavailable.
          });
          scheduleUpdate();
          return;
        }

        active = false;
        idle?.pause();
        if (rafRef.current !== null) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      },
      { rootMargin: "20% 0px" },
    );

    observer.observe(container);
    window.addEventListener("scroll", scheduleUpdate, { passive: true });
    window.addEventListener("resize", scheduleUpdate);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", scheduleUpdate);
      idle?.pause();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [renderProgress]);

  return (
    <section
      ref={containerRef}
      aria-label={
        locale === "fr"
          ? "Voyage cinématographique de Zuruny"
          : "Zuruny cinematic journey"
      }
      className="relative isolate h-[var(--stage-height)] overflow-clip bg-ground motion-reduce:h-[100svh]"
      style={{
        ["--stage-height" as string]: `${SCENES.length * 100}svh`,
      }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {SCENES.map((scene) => {
          const copy = t.cinematic[scene.id];

          return (
            <CinematicScene
              key={scene.id}
              scene={scene}
              copy={copy}
              onLayerRef={(element) => {
                layerRefs.current[scene.id] = element;
              }}
              onVideoRef={(element) => {
                videoRefs.current[scene.id] = element;
              }}
              onTextRef={(element) => {
                textRefs.current[scene.id] = element;
              }}
            />
          );
        })}

        <CinematicEndCta locale={locale} containerRef={endCtaRef} />
      </div>
    </section>
  );
}
