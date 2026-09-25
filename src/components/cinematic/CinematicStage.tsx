"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
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
// requestAnimationFrame fires at the display's native refresh rate — up to
// 144Hz on some phones — but scroll-derived content (a video seek, a frame
// swap) has no perceptual benefit from updating faster than ~60fps, only
// twice the compositing cost. Cap the scroll-update loop here regardless
// of platform.
const FRAME_BUDGET_MS = 1000 / 60;
// If mobile frame preload+decode takes longer than this, the device is
// likely too limited to composite four simultaneously cross-fading layers
// smoothly — fall back to one scene mounted at a time with a hard cut
// instead of a blend. A capable device on a normal connection clears
// preload well under this; tune if real-world testing says otherwise.
// This alone isn't sufficient: decode is often offloaded to a separate
// thread/process and can stay fast even when the GPU can't keep up with
// compositing, which is the actual bottleneck — see probeCompositingMs.
const SIMPLIFIED_THRESHOLD_MS = 3500;
// Same idea, for the compositing probe below: a healthy device clears 24
// frames of four-layer alpha-blending in well under a second (~400ms at
// 60fps). A device that can't is a direct, load-bearing signal — this is
// the actual shape of work the hero does, not a proxy for it.
const COMPOSITING_THRESHOLD_MS = 900;

/**
 * Direct signal for GPU compositing headroom: stacks a few translucent
 * full-viewport layers — the same shape of work as the hero's own
 * crossfade — and times how long the browser actually takes to composite
 * a short burst of opacity changes across them. Runs invisibly (opacity
 * ~0, negative z-index) alongside preload, so it costs nothing extra on a
 * capable device.
 */
function probeCompositingMs(frameCount = 24): Promise<number> {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    host.style.cssText =
      "position:fixed;inset:0;z-index:-1;opacity:0.01;pointer-events:none;";
    const layers = Array.from({ length: 4 }, (_, i) => {
      const layer = document.createElement("div");
      layer.style.cssText = `position:absolute;inset:0;background:linear-gradient(${i * 45}deg,#4f0d0f,#12100e);`;
      host.appendChild(layer);
      return layer;
    });
    document.body.appendChild(host);

    const start = performance.now();
    let frame = 0;
    const tick = () => {
      layers.forEach((layer, i) => {
        layer.style.opacity = String((Math.sin(frame / 3 + i) + 1) / 2);
      });
      frame += 1;
      if (frame < frameCount) {
        requestAnimationFrame(tick);
        return;
      }
      const elapsed = performance.now() - start;
      host.remove();
      resolve(elapsed);
    };
    requestAnimationFrame(tick);
  });
}

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

/** Which scene is "active" under a hard-cut policy — no overlap, no blend. */
function hardCutSceneIndex(progress: number): number {
  for (let i = 0; i < SCENES.length; i++) {
    const next = SCENES[i + 1];
    if (!next) return i;
    const cutover = (SCENES[i].scrollEnd + next.scrollStart) / 2;
    if (progress < cutover) return i;
  }
  return SCENES.length - 1;
}

/** Drives a single scene's video seek or frame swap. Shared by the full
 * crossfade path (one call per scene) and the simplified hard-cut path
 * (one call for whichever scene is currently mounted). */
function driveSceneScrub(
  scene: StoryScene,
  progress: number,
  isDesktop: boolean,
  video: HTMLVideoElement | null,
  frameImg: HTMLImageElement | null,
  easedProgress: Record<string, number>,
): void {
  if (scene.loop) return;

  if (scene.mobileFrames && !isDesktop) {
    if (!frameImg) return;
    // No easing here on purpose: unlike a video seek, a frame swap's cost
    // doesn't depend on how far it jumps, only on how many swaps happen —
    // so easing through every intermediate frame is pure extra decode
    // work for no benefit. Jump straight to whatever frame the scroll
    // position maps to.
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
    return;
  }

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
  // Decided once, after preload, from how long that actually took (see the
  // loader effect). simplifiedRef is what renderProgress reads every tick;
  // the state pair is only for the render-time choice of JSX below.
  const simplifiedRef = useRef(false);
  const [simplified, setSimplified] = useState(false);
  const activeSceneIndexRef = useRef(0);
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [ready, setReady] = useState(false);
  const t = getDict(locale);

  const renderProgress = useCallback((progress: number) => {
    const brand = brandRef.current;
    if (brand) {
      const motion = brandExitMotion(progress);
      brand.style.opacity = String(motion.opacity);
      brand.style.transform = `translate3d(0, ${motion.y}px, 0) scale(${motion.scale})`;
    }

    if (simplifiedRef.current) {
      // Hard-cut mode: exactly one scene is ever mounted (see the JSX
      // below), so there's no opacity/crossfade math and no other scene's
      // refs to touch — just figure out which one should be showing and
      // drive its own scrub.
      const idx = hardCutSceneIndex(progress);
      if (idx !== activeSceneIndexRef.current) {
        activeSceneIndexRef.current = idx;
        setActiveSceneIndex(idx);
      }

      const scene = SCENES[idx];
      const layer = layerRefs.current[scene.id];
      if (layer) {
        layer.style.opacity = "1";
        layer.style.pointerEvents = "auto";
      }

      const video = videoRefs.current[scene.id];
      if (scene.loop && video && video.paused) {
        void video.play().catch(() => {});
      }

      driveSceneScrub(
        scene,
        progress,
        isDesktopRef.current,
        video,
        frameImgRefs.current[scene.id],
        easedProgressRef.current,
      );
      driveSceneCopy(scene, progress, textRefs.current[scene.id]);
    } else {
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

        driveSceneScrub(
          scene,
          progress,
          isDesktopRef.current,
          video,
          frameImgRefs.current[scene.id],
          easedProgressRef.current,
        );
        driveSceneCopy(scene, progress, textRefs.current[scene.id]);
      });
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

    // Reduced-motion users never scroll-scrub (see the third effect below
    // — it renders progress 0 once and stops), so crossfade-vs-hard-cut is
    // moot for them; skip paying for the probe. Same for desktop, which
    // isn't the target of either signal.
    const compositingProbe =
      isDesktopRef.current || reducedMotion
        ? Promise.resolve(0)
        : probeCompositingMs();

    // The 8s fallback below may still fire after this runs; `settled`
    // makes that a no-op rather than needing to cancel it here.
    const finish = () => {
      if (settled) return;
      settled = true;
      const elapsed = Date.now() - shownAt;

      void compositingProbe.then((compositingMs) => {
        // Two independent signals, either one is sufficient: real
        // preload+decode time (network- or decode-bound) and the
        // compositing probe (GPU-bound — the actual bottleneck this phone
        // has). Static properties like core count or RAM don't capture
        // this either: this phone's 8 cores and 8GB RAM read as "fine"
        // while its 2-shader-core GPU is anything but.
        if (
          !isDesktopRef.current &&
          (elapsed > SIMPLIFIED_THRESHOLD_MS ||
            compositingMs > COMPOSITING_THRESHOLD_MS)
        ) {
          simplifiedRef.current = true;
          setSimplified(true);
        }

        const wait = Math.max(0, minVisibleMs - elapsed);
        window.setTimeout(() => {
          if (!disposed) setReady(true);
        }, wait);
      });
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
      // Divide by SCENES.length, not values.length/fractions.size — this
      // runs mid-loop too (checkBuffered fires synchronously for video
      // scenes), when the map may only hold entries for scenes visited so
      // far. Dividing by however many happen to be in the map yet is what
      // let the average read 100% — and completion below trivially pass —
      // after just the FIRST scene, before the other three had even
      // started their own preload.
      if (fill) {
        const total = values.reduce((a, b) => a + b, 0);
        fill.style.transform = `scaleX(${total / SCENES.length})`;
      }
      if (fractions.size === SCENES.length && values.every((v) => v >= 1)) {
        finish();
      }
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

  // A hard cut mounts a fresh scene whose layer starts at its JSX default
  // opacity (0 for anything but idle) until the next scroll tick corrects
  // it. Set it before paint so switching scenes never flashes invisible
  // for a frame.
  useLayoutEffect(() => {
    if (!simplified) return;
    const layer = layerRefs.current[SCENES[activeSceneIndex].id];
    if (layer) layer.style.opacity = "1";
  }, [simplified, activeSceneIndex]);

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
    let lastUpdateAt = 0;

    const update = (timestamp: number) => {
      rafRef.current = null;
      if (!active) return;

      // High-refresh-rate phones fire rAF up to 144 times a second; scroll-
      // derived content has no perceptual reason to update faster than
      // ~60fps, only double the compositing cost. Skip this tick and
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
      onFrameImgRef={(element) => {
        frameImgRefs.current[scene.id] = element;
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
      className="relative isolate h-[var(--stage-height)] overflow-clip bg-ground motion-reduce:h-[100svh]"
      style={{
        ["--stage-height" as string]: `${SCENES.length * 100}svh`,
      }}
    >
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        {simplified
          ? renderScene(SCENES[activeSceneIndex])
          : SCENES.map(renderScene)}

        <CinematicBrand motionRef={brandRef} />
        <CinematicEndCta locale={locale} containerRef={endCtaRef} />
      </div>

      <CinematicLoader ready={ready} fillRef={loaderFillRef} locale={locale} />
    </section>
  );
}
