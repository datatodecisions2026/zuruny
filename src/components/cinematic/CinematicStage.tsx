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

function frameSrc(base: string, index: number): string {
  return `${base}/f${String(index).padStart(3, "0")}.webp`;
}

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

/**
 * A pinned, scroll-scrubbed sequence of films. The scene ranges in
 * homepageStory.ts overlap briefly, which gives each transition its crossfade.
 */
export function CinematicStage({ locale }: { locale: Locale }) {
  const containerRef = useRef<HTMLElement>(null);
  const layerRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const videoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const frameImgRefs = useRef<Record<string, HTMLImageElement | null>>({});
  const textRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const endCtaRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const loaderFillRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const easedProgressRef = useRef<Record<string, number>>({});
  // Scenes with mobileFrames render no <source> on mobile (see
  // CinematicScene) so nothing downloads there; this flag is what tells
  // renderProgress and the loader effect which path a scene actually took.
  const isDesktopRef = useRef(true);
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
      const frameImg = frameImgRefs.current[scene.id];
      const copy = textRefs.current[scene.id];

      if (layer) {
        layer.style.opacity = String(opacity);
        layer.style.pointerEvents = opacity > 0.5 ? "auto" : "none";
      }

      if (scene.loop && video) {
        // Cross-fading a live, still-decoding video against the next
        // scene glitches on some mobile GPUs — the video decode surface
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

      if (!scene.loop && scene.mobileFrames && !isDesktopRef.current) {
        if (frameImg) {
          // No easing here on purpose: unlike a video seek, a frame swap's
          // cost doesn't depend on how far it jumps, only on how many swaps
          // happen — so easing through every intermediate frame between the
          // last position and this one is pure extra decode work for no
          // benefit. Jump straight to whatever frame the scroll maps to.
          const rawLocal = scenePlaybackProgress(scene, progress);
          const { base, count } = scene.mobileFrames;
          const frameIndex = Math.min(
            count,
            Math.max(1, Math.round(rawLocal * (count - 1)) + 1),
          );
          if (frameImg.dataset.frame !== String(frameIndex)) {
            frameImg.dataset.frame = String(frameIndex);
            frameImg.src = frameSrc(base, frameIndex);
          }
        }
      } else if (
        video &&
        !scene.loop &&
        video.readyState >= HTMLMediaElement.HAVE_METADATA &&
        // A seek already in flight has a decoder working on it; queuing
        // another on top makes weak hardware fall behind and stutter
        // through a backlog. Skip this tick — the next rAF re-reads the
        // live scroll position, so it always resumes at the current
        // target instead of working through stale ones.
        !video.seeking
      ) {
        const rawLocal = scenePlaybackProgress(scene, progress);
        const easedLocal = easeLocalProgress(
          easedProgressRef.current,
          scene.id,
          rawLocal,
        );

        const target = easedLocal * video.duration;
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

  // iOS Safari only repaints a seeked frame on a video that has played at
  // least once; scrubbing currentTime on a never-played video just freezes
  // on frame 0. Nudge each video awake so later scroll-driven seeks render.
  // The same pass tracks how loaded every scene is — buffered ranges for
  // video, decoded count for frame sequences — so the loading screen can
  // hold until everything is actually usable, instead of a scroll that
  // stutters fetching data (or frames) it doesn't have yet.
  useEffect(() => {
    isDesktopRef.current = window.matchMedia("(min-width: 768px)").matches;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const minVisibleMs = reducedMotion ? 0 : 900;
    const shownAt = Date.now();
    let settled = false;
    let disposed = false;

    // The 8s fallback below may still fire after this runs; `settled`
    // makes that a no-op rather than needing to cancel it here.
    const finish = () => {
      if (settled) return;
      settled = true;
      const wait = Math.max(0, minVisibleMs - (Date.now() - shownAt));
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

    // Each scene contributes one 0..1 "how loaded is it" fraction,
    // whichever path it actually took.
    const fractions = new Map<string, number>();
    const cleanups: Array<() => void> = [];

    const recompute = () => {
      if (disposed) return;
      const values = [...fractions.values()];
      const fill = loaderFillRef.current;
      if (fill && values.length > 0) {
        const avg = values.reduce((a, b) => a + b, 0) / values.length;
        fill.style.transform = `scaleX(${avg})`;
      }
      if (values.length > 0 && values.every((v) => v >= 1)) finish();
    };

    SCENES.forEach((scene) => {
      if (scene.mobileFrames && !isDesktopRef.current) {
        const { base, count } = scene.mobileFrames;
        fractions.set(scene.id, 0);
        let loaded = 0;

        const frameImg = frameImgRefs.current[scene.id];
        if (frameImg) frameImg.src = frameSrc(base, 1);

        const settle = () => {
          if (disposed) return;
          loaded += 1;
          fractions.set(scene.id, loaded / count);
          recompute();
        };

        for (let i = 1; i <= count; i++) {
          const preload = new Image();
          preload.src = frameSrc(base, i);
          // decode() resolves only once the bitmap is actually rasterized,
          // not just downloaded — onload alone doesn't guarantee that. The
          // decode cache it populates is keyed by URL, so the visible <img>
          // reusing this same src at scroll time hits that cache instead of
          // decoding cold, which is what was showing as a black flash.
          preload.decode().then(settle, settle);
        }
        return;
      }

      const video = videoRefs.current[scene.id];
      if (!video) return;
      fractions.set(scene.id, 0);

      // Scenes converted to frames on mobile render no static <source> at
      // all (see CinematicScene), so on desktop there's nothing for the
      // browser to have discovered on its own — wire it up here instead.
      if (scene.mobileFrames && !video.src) {
        video.src = scene.desktopSrc;
        video.load();
      }

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
  // into an unbuffered frame.
  useEffect(() => {
    if (ready) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [ready]);

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
    // Mobile browsers change window.innerHeight as their address bar
    // collapses or reappears mid-scroll, and that fires a `resize` event
    // too. Recomputing progress against a live innerHeight would jump the
    // scene right as that happens — exactly while someone is scrolling.
    // Cache the height and only refresh it on a resize that isn't just
    // chrome sliding away.
    const coarsePointer = window.matchMedia(
      "(hover: none) and (pointer: coarse)",
    ).matches;
    let viewportHeight = window.innerHeight;
    let laidOutWidth = window.innerWidth;

    const update = () => {
      rafRef.current = null;
      if (!active) return;

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
      laidOutWidth = window.innerWidth;
      scheduleUpdate();
    };

    const onResize = () => {
      if (coarsePointer && window.innerWidth === laidOutWidth) return;
      refreshViewport();
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
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", refreshViewport);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", scheduleUpdate);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("orientationchange", refreshViewport);
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
              onFrameImgRef={(element) => {
                frameImgRefs.current[scene.id] = element;
              }}
              onTextRef={(element) => {
                textRefs.current[scene.id] = element;
              }}
            />
          );
        })}

        <CinematicBrand motionRef={brandRef} />
        <CinematicEndCta locale={locale} containerRef={endCtaRef} />
      </div>

      <CinematicLoader ready={ready} fillRef={loaderFillRef} locale={locale} />
    </section>
  );
}
