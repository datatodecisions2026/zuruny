"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  SCENES,
  brandExitMotion,
  endCtaMotion,
  sceneCopyMotion,
  sceneOpacity,
  scenePlaybackProgress,
  clamp,
  type StoryScene,
} from "@/data/homepageStory";
import { getDict, type Locale } from "@/lib/i18n";
import {
  CinematicEndCta,
} from "@/components/cinematic/CinematicOverlays";
import { CinematicScene } from "@/components/cinematic/CinematicScene";
import { CinematicBrand } from "@/components/cinematic/CinematicBrand";
import { CinematicLoader } from "@/components/cinematic/CinematicLoader";

const SEEK_THRESHOLD_SECONDS = 0.04;
// Fraction of the remaining gap closed per frame when easing the seek
// target toward the scroll-derived position. Lower = more glide, higher =
// more 1:1 with the raw scroll.
const SEEK_EASE = 0.18;
const FRAME_BUDGET_MS = 1000 / 60;

/** Eases `sceneId`'s stored progress toward `rawLocal` and returns it. */
function easeLocalProgress(
  store: Record<string, number>,
  sceneId: string,
  rawLocal: number,
): number {
  const previous = store[sceneId] ?? rawLocal;
  const eased = previous + (rawLocal - previous) * SEEK_EASE;
  store[sceneId] = eased;
  return eased;
}

/** Drives a single scene's video seek. */
function driveSceneScrub(
  scene: StoryScene,
  progress: number,
  video: HTMLVideoElement | null,
  easedProgress: Record<string, number>,
): void {
  if (scene.loop) return;

  if (
    !video ||
    video.readyState < HTMLMediaElement.HAVE_METADATA ||
    // A seek already in flight has a decoder working on it; queuing
    // another on top makes weak hardware fall behind and stutter through
    // a backlog. Skip this tick — the next rAF re-reads the live scroll
    // position, so it always resumes at the current target instead of
    // working through stale ones.
    video.seeking
  ) {
    return;
  }

  const rawLocal = scenePlaybackProgress(scene, progress);
  const easedLocal = easeLocalProgress(easedProgress, scene.id, rawLocal);
  const target = easedLocal * video.duration;
  if (
    Number.isFinite(target) &&
    Math.abs(video.currentTime - target) > SEEK_THRESHOLD_SECONDS
  ) {
    video.currentTime = target;
  }
}

/** Drives a single scene's copy motion (opacity + parallax offsets). */
function driveSceneCopy(
  scene: StoryScene,
  progress: number,
  copy: HTMLDivElement | null,
): void {
  if (!copy) return;
  const motion = sceneCopyMotion(scene, progress);
  copy.style.opacity = String(motion.opacity);
  copy
    .querySelectorAll<HTMLElement>("[data-parallax-depth]")
    .forEach((element) => {
      const depth = Number(element.dataset.parallaxDepth ?? "1");
      element.style.transform = `translate3d(${motion.x * depth}px, ${motion.y * depth}px, 0)`;
    });
}

/**
 * A pinned, scroll-scrubbed sequence of films — desktop only. Mobile renders
 * MobileOilHero instead (see page.tsx). The scene ranges in
 * homepageStory.ts overlap briefly, which gives each transition its crossfade.
 */
export function CinematicStage({ locale }: { locale: Locale }) {
  const containerRef = useRef<HTMLElement>(null);
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const textRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const endCtaRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const loaderFillRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const easedProgressRef = useRef<Record<string, number>>({});
  const [ready, setReady] = useState(false);
  const t = getDict(locale);

  const renderProgress = useCallback((progress: number) => {
    const brand = brandRef.current;
    if (brand) {
      const motion = brandExitMotion(progress);
      brand.style.opacity = String(motion.opacity);
      brand.style.transform = `translate3d(0, ${motion.y}px, 0) scale(${motion.scale})`;
    }

    SCENES.forEach((scene, index) => {
      const opacity = sceneOpacity(SCENES, index, progress);
      const layer = layerRefs.current[scene.id];
      const video = videoRefs.current[scene.id];

      if (layer) {
        layer.style.opacity = String(opacity);
        layer.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
      }

      if (scene.loop && video) {
        // Cross-fading a live, still-decoding video against the next
        // scene glitches on some GPUs — the video decode surface
        // composites through a different path than a plain image, and
        // blending mid-decode is where that shows up. A still frame
        // blends cleanly, and the crossfade window is short enough
        // (~1/10 of a screen of scroll) that freezing it is invisible.
        if (opacity < 1) {
          if (!video.paused) video.pause();
        } else if (video.paused) {
          void video.play().catch(() => {});
        }
      }

      driveSceneScrub(scene, progress, video, easedProgressRef.current);
      driveSceneCopy(scene, progress, textRefs.current[scene.id]);
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

  // iOS Safari only repaints a seeked frame on a video that has played at
  // least once; scrubbing currentTime on a never-played video just freezes
  // on frame 0. Nudge each video awake so later scroll-driven seeks render.
  // The same pass tracks how buffered each video is, so the loading screen
  // can hold until everything is actually usable, instead of a scroll that
  // stutters fetching data it doesn't have yet.
  useEffect(() => {
    // This stage is desktop-only (see the `hidden md:block` on the section
    // below) but still mounts on mobile, just invisible — without this
    // check it would silently buffer four tree/oil videos on a phone for
    // a view no one sees. Skip straight to ready so the scroll-lock effect
    // below doesn't hang waiting for a load that will never run.
    if (!window.matchMedia("(min-width: 768px)").matches) {
      const timeoutId = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(timeoutId);
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const minVisibleMs = reducedMotion ? 0 : 900;
    const shownAt = Date.now();
    let settled = false;
    let disposed = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      const elapsed = Date.now() - shownAt;
      const wait = Math.max(0, minVisibleMs - elapsed);
      window.setTimeout(() => {
        if (!disposed) setReady(true);
      }, wait);
    };

    const prime = (video: HTMLVideoElement) => {
      void video
        .play()
        .then(() => video.pause())
        .catch(() => {});
    };

    const isFullyBuffered = (video: HTMLVideoElement) => {
      const { buffered, duration } = video;
      if (!Number.isFinite(duration) || duration <= 0) return false;
      return (
        buffered.length > 0 &&
        buffered.end(buffered.length - 1) >= duration - 0.25
      );
    };

    // Each scene contributes one 0..1 "how loaded is it" fraction.
    const fractions = new Map<string, number>();
    const cleanups: Array<() => void> = [];

    const recompute = () => {
      if (disposed) return;
      const values = [...fractions.values()];
      const fill = loaderFillRef.current;
      if (fill) {
        const total = values.reduce((a, b) => a + b, 0);
        fill.style.transform = `scaleX(${total / SCENES.length})`;
      }
      if (fractions.size === SCENES.length && values.every((v) => v >= 1)) {
        finish();
      }
    };

    SCENES.forEach((scene) => {
      const video = videoRefs.current[scene.id];
      if (!video) return;
      fractions.set(scene.id, 0);

      const checkBuffered = () => {
        fractions.set(scene.id, isFullyBuffered(video) ? 1 : 0);
        recompute();
      };

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        prime(video);
      } else {
        video.addEventListener("loadeddata", () => prime(video), {
          once: true,
        });
      }
      video.addEventListener("progress", checkBuffered);
      cleanups.push(() =>
        video.removeEventListener("progress", checkBuffered),
      );
      checkBuffered();
    });

    // A flaky connection should not strand the homepage behind the loader.
    const timeoutId = window.setTimeout(finish, 8000);
    recompute();

    return () => {
      disposed = true;
      cleanups.forEach((cleanup) => cleanup());
      window.clearTimeout(timeoutId);
    };
  }, []);

  // Hold scroll until the loader clears so the first scroll can't scrub
  // into an unbuffered frame. Desktop only — see the ready-effect guard
  // above for why mobile never needs this (MobileOilHero owns its own lock).
  useEffect(() => {
    if (ready || !window.matchMedia("(min-width: 768px)").matches) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [ready]);

  useEffect(() => {
    if (!window.matchMedia("(min-width: 768px)").matches) return;

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
    let viewportHeight = window.innerHeight;
    let lastUpdateAt = 0;

    const update = (timestamp: number) => {
      rafRef.current = null;
      if (!active) return;

      // High-refresh-rate displays fire rAF up to 144 times a second;
      // scroll-derived content has no perceptual reason to update faster
      // than ~60fps, only double the compositing cost. Skip this tick and
      // re-check next frame rather than doing the full update.
      if (timestamp - lastUpdateAt < FRAME_BUDGET_MS) {
        scheduleUpdate();
        return;
      }
      lastUpdateAt = timestamp;

      const rect = container.getBoundingClientRect();
      const scrollable = rect.height - viewportHeight;
      const progress =
        scrollable > 0 ? clamp(-rect.top / scrollable, 0, 1) : 0;

      renderProgress(progress);
    };

    const scheduleUpdate = () => {
      if (active && rafRef.current === null) {
        rafRef.current = requestAnimationFrame(update);
      }
    };

    const refreshViewport = () => {
      viewportHeight = window.innerHeight;
      scheduleUpdate();
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          active = true;
          void idle?.play().catch(() => {
            // Leave the video paused if the browser declines autoplay.
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
    window.addEventListener("resize", refreshViewport);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", refreshViewport);
      idle?.pause();
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [renderProgress]);

  const renderScene = (scene: StoryScene) => (
    <CinematicScene
      key={scene.id}
      scene={scene}
      copy={t.cinematic[scene.id]}
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

  return (
    <section
      ref={containerRef}
      aria-label={
        locale === "fr"
          ? "Voyage cinématographique de Zuruny"
          : "Zuruny cinematic journey"
      }
      className="relative isolate hidden h-[var(--stage-height)] overflow-clip bg-ground motion-reduce:h-[100svh] md:block"
      style={{
        ["--stage-height" as string]: `${SCENES.length * 100}svh`,
      }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {SCENES.map(renderScene)}

        <CinematicBrand motionRef={brandRef} />
        <CinematicEndCta locale={locale} containerRef={endCtaRef} />
      </div>

      <CinematicLoader ready={ready} fillRef={loaderFillRef} locale={locale} />
    </section>
  );
}
