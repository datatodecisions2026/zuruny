"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";

// The films play at their original framing and quality: no zoom or offset
// (the old one pushed the watermark off-screen), just cover-fit to the screen.
export const FILM_CLASS = "pointer-events-none absolute inset-0 size-full object-cover";

/** Fired on window once the loader lifts; HomeStage waits for it to fetch the 3D scene. */
export const HERO_READY = "zuruny:hero-ready";

// Longest the loader holds before starting with whatever has arrived.
const LOAD_TIMEOUT_MS = 15000;
// The cards glide in this long before the rotation ends.
const CARDS_LEAD_S = 2.5;
// The rotation ends on a different shot from the idle loop's, so its last
// moments dissolve into the loop.
const CROSSFADE_S = 1.2;
// The rotation plays on every page load (reload, new tab, link from outside);
// moving around the site and back to home without reloading opens on the
// loop. Module state lives exactly as long as the loaded page.
let introPlayed = false;

type Phase = "loading" | "intro" | "idle";

function films() {
  const phone = !window.matchMedia("(min-width: 768px)").matches;
  return phone
    ? { rotate: "/hero_scenes/tree_rotate_mobile.mp4", idle: "/hero_scenes/tree_idle_loop_mobile.mp4" }
    : { rotate: "/hero_scenes/tree_rotate.mp4", idle: "/hero_scenes/tree_idle_loop.mp4" };
}

/** Resolves once the video can play through, or has failed (so the loader never strands). */
function playable(video: HTMLVideoElement) {
  return new Promise<void>((resolve) => {
    if (video.readyState >= HTMLMediaElement.HAVE_ENOUGH_DATA) return resolve();
    video.addEventListener("canplaythrough", () => resolve(), { once: true });
    video.addEventListener("error", () => resolve(), { once: true });
  });
}

/** Share of a video buffered from the start, 0–1. */
function buffered(video: HTMLVideoElement) {
  if (!Number.isFinite(video.duration) || video.buffered.length === 0) return 0;
  return video.buffered.end(0) / video.duration;
}

/**
 * The moving parts of SkotHero. A loader holds the screen (and the scroll)
 * until both films have downloaded; then the tree rotation plays with the
 * Zuruny Lottie mark, the cards glide in near its end, and it dissolves into
 * the idle loop. Scrolling back up only ever finds the loop.
 */
export function SkotHeroMotion({ loading }: { loading: { eyebrow: string; title: string; sub: string } }) {
  const rotateRef = useRef<HTMLVideoElement>(null);
  const idleRef = useRef<HTMLVideoElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<AnimationItem | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [cardsEarly, setCards] = useState(false);
  // The loop always has its cards; the rotation brings them in near its end.
  const cards = cardsEarly || phase === "idle";
  const [lottieReady, setLottieReady] = useState(false);

  // Load both films behind the loader, holding the scroll until they're in.
  useEffect(() => {
    const rotate = rotateRef.current;
    const idle = idleRef.current;
    if (!rotate || !idle) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const skipIntro = reduced || introPlayed;
    const src = films();
    // React doesn't reflect `muted` onto the element, and autoplay policies
    // reject play() on anything not muted.
    idle.muted = rotate.muted = true;
    idle.src = src.idle;
    const waiting = [idle];
    if (!skipIntro) {
      rotate.src = src.rotate;
      waiting.push(rotate);
    }

    const root = document.documentElement;
    const overflow = root.style.overflow;
    root.style.overflow = "hidden";
    const meter = window.setInterval(() => {
      const share = waiting.reduce((sum, v) => sum + buffered(v), 0) / waiting.length;
      if (barRef.current) barRef.current.style.transform = `scaleX(${share})`;
    }, 200);

    let finished = false;
    const finish = () => {
      if (finished) return;
      finished = true;
      window.clearInterval(meter);
      window.clearTimeout(timeout);
      root.style.overflow = overflow;
      setPhase(skipIntro ? "idle" : "intro");
      window.dispatchEvent(new Event(HERO_READY));
    };
    const timeout = window.setTimeout(finish, LOAD_TIMEOUT_MS);
    void Promise.all(waiting.map(playable)).then(finish);

    return () => {
      finished = true;
      window.clearInterval(meter);
      window.clearTimeout(timeout);
      root.style.overflow = overflow;
    };
  }, []);

  // The rotation: cards near its end, then it dissolves into the loop.
  useEffect(() => {
    const rotate = rotateRef.current;
    const idle = idleRef.current;
    if (!rotate || !idle) return;
    if (phase === "idle") {
      if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        void idle.play().catch(() => {});
      }
      return;
    }
    if (phase !== "intro") return;

    introPlayed = true;
    animationRef.current?.play();
    const onTime = () => {
      const left = rotate.duration - rotate.currentTime;
      if (left <= CARDS_LEAD_S) setCards(true);
      if (left <= CROSSFADE_S) setPhase("idle");
    };
    rotate.addEventListener("timeupdate", onTime);
    rotate.addEventListener("ended", onTime);
    // Autoplay declined: skip straight to the loop.
    void rotate.play().catch(() => setPhase("idle"));
    return () => {
      rotate.removeEventListener("timeupdate", onTime);
      rotate.removeEventListener("ended", onTime);
    };
  }, [phase]);

  // SkotHero's cards glide in off this attribute on its root.
  useEffect(() => {
    rotateRef.current?.parentElement?.toggleAttribute("data-cards", cards);
  }, [cards]);

  // Zuruny mark: loads behind the loader, plays as the rotation starts.
  useEffect(() => {
    const container = markRef.current;
    if (!container) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let disposed = false;

    void import("lottie-web")
      .then(({ default: lottie }) => {
        if (disposed) return;
        const animation = lottie.loadAnimation({
          container,
          renderer: "svg",
          path: "/brand/Scene.json",
          loop: false,
          autoplay: false,
          rendererSettings: {
            // The lockup sits at the centre of a 1280 × 720 artboard.
            viewBoxSize: "440 180 400 400",
            preserveAspectRatio: "xMidYMid meet",
          },
        });
        animationRef.current = animation;
        animation.addEventListener("DOMLoaded", () => {
          if (disposed) return;
          setLottieReady(true);
          // Returning visits and reduced motion show the finished lockup.
          if (reduced || introPlayed) animation.goToAndStop(animation.totalFrames - 1, true);
        });
      })
      .catch(() => {});

    return () => {
      disposed = true;
      animationRef.current?.destroy();
      animationRef.current = null;
    };
  }, []);

  const loaded = phase !== "loading";

  return (
    <>
      <video ref={idleRef} loop playsInline preload="auto" aria-hidden="true" className={`${FILM_CLASS} -z-20`} />
      <video
        ref={rotateRef}
        playsInline
        preload="auto"
        aria-hidden="true"
        className={`${FILM_CLASS} -z-10 transition-opacity ease-in-out motion-reduce:transition-none`}
        style={{ opacity: phase === "idle" ? 0 : 1, transitionDuration: `${CROSSFADE_S}s` }}
      />

      {/* Phones: top third. Desktop: the artboard's title slot (440u square,
          centred, top at 141u of the bottom-anchored 810u artboard). */}
      <div className="pointer-events-none absolute left-1/2 top-[15svh] z-30 size-[min(70vw,38svh)] -translate-x-1/2 md:top-[calc(100svh-var(--u)*669)] md:size-[calc(var(--u)*440)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 drop-shadow-[0_3px_12px_rgba(0,0,0,0.72)] transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: loaded ? "none" : "scale(0.4)" }}
        >
          {/* Static lockup shows before JS and if the player fails. */}
          <div
            className="absolute inset-0 bg-contain bg-center bg-no-repeat"
            style={{
              backgroundImage: "url(/brand/scene-static.svg)",
              visibility: lottieReady ? "hidden" : "visible",
            }}
          />
          <div ref={markRef} className="absolute inset-0" />
        </div>
      </div>

      <div
        role="status"
        aria-live="polite"
        className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-4 bg-[#020201] px-8 text-center transition-opacity duration-[900ms] ease-out motion-reduce:transition-none"
        style={{ opacity: loaded ? 0 : 1, pointerEvents: loaded ? "none" : "auto" }}
      >
        {!loaded && (
          <>
            <p className="u-mono text-ochre">{loading.eyebrow}</p>
            <p className="u-display text-[length:var(--step-3)] text-cream">{loading.title}</p>
            <p className="max-w-[32ch] text-[length:var(--step-0)] text-cream/60">{loading.sub}</p>
            <div aria-hidden="true" className="mt-4 h-px w-40 overflow-hidden bg-cream/15">
              <div ref={barRef} className="h-full origin-left bg-ochre transition-transform duration-200" style={{ transform: "scaleX(0)" }} />
            </div>
          </>
        )}
      </div>
    </>
  );
}
