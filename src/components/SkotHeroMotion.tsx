"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";

const INTRO_TIMEOUT_MS = 4000;
// Phones fill the screen with the portrait cut. Desktop follows Figma, which
// frames the film at ~120% of the artboard pinned to its bottom edge, nudged
// 2% right of Figma's -9.88% so the film's bottom-right watermark falls
// off-screen (the portrait cut has none).
export const FILM_CLASS =
  "pointer-events-none absolute inset-0 size-full object-cover md:inset-auto md:-left-[7.88%] md:-top-[9.88%] md:size-[119.76%] md:max-w-none md:object-bottom";

/**
 * The moving parts of SkotHero: the idle tree loop (game-lobby style; the
 * rotation is saved for HomeStage's scroll bridge), and the Zuruny
 * Lottie mark that plays small over a dark curtain, then grows into the
 * slot the template's "SKOTHYA" title occupied as the curtain lifts.
 */
export function SkotHeroMotion() {
  const idleRef = useRef<HTMLVideoElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const [lottieReady, setLottieReady] = useState(false);
  const [done, setDone] = useState(false);

  // Load the loop behind the curtain so it's buffered when it lifts.
  useEffect(() => {
    const cut = window.matchMedia("(min-width: 768px)").matches ? "" : "-mobile";
    const idle = idleRef.current;
    if (!idle) return;
    // React doesn't reflect the `muted` prop onto the element, and autoplay
    // policies reject play() on anything not muted.
    idle.muted = true;
    idle.poster = `/skot/tree-idle${cut}-poster.webp`;
    idle.src = `/skot/tree-idle-loop${cut}.mp4`;
  }, []);

  // The loop starts as the curtain lifts. Its seam is baked into the file
  // (the last second crossfades into the first), so plain `loop` wraps with
  // no visible jump.
  useEffect(() => {
    if (!done || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    void idleRef.current?.play().catch(() => {
      // Autoplay declined: the poster stays.
    });
  }, [done]);

  useEffect(() => {
    const container = markRef.current;
    if (!container) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let animation: AnimationItem | undefined;
    let disposed = false;
    const finish = () => {
      if (!disposed) setDone(true);
    };
    // A slow or failed Lottie load must not strand the curtain.
    const timeout = window.setTimeout(finish, INTRO_TIMEOUT_MS);

    void import("lottie-web")
      .then(({ default: lottie }) => {
        if (disposed) return;
        animation = lottie.loadAnimation({
          container,
          renderer: "svg",
          path: "/brand/Scene.json",
          loop: false,
          autoplay: false,
          rendererSettings: {
            // The lockup sits at the centre of
            // a 1280 × 720 artboard.
            viewBoxSize: "440 180 400 400",
            preserveAspectRatio: "xMidYMid meet",
          },
        });
        animation.addEventListener("DOMLoaded", () => {
          if (disposed || !animation) return;
          setLottieReady(true);
          if (reduced) {
            animation.goToAndStop(animation.totalFrames - 1, true);
            finish();
          } else {
            animation.play();
          }
        });
        animation.addEventListener("complete", finish);
        animation.addEventListener("data_failed", finish);
      })
      .catch(finish);

    return () => {
      disposed = true;
      window.clearTimeout(timeout);
      animation?.destroy();
    };
  }, []);

  return (
    <>
      <video
        ref={idleRef}
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className={`${FILM_CLASS} -z-10`}
      />

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 bg-ground transition-opacity duration-[900ms] ease-out motion-reduce:transition-none"
        style={{ opacity: done ? 0 : 1 }}
      />

      {/* Phones: top third. Desktop: the artboard's title slot (440u square,
          centred, top at 141u of the bottom-anchored 810u artboard). */}
      <div className="pointer-events-none absolute left-1/2 top-[15svh] z-30 size-[min(70vw,38svh)] -translate-x-1/2 md:top-[calc(100svh-var(--u)*669)] md:size-[calc(var(--u)*440)]">
        <div
          aria-hidden="true"
          className="absolute inset-0 drop-shadow-[0_3px_12px_rgba(0,0,0,0.72)] transition-transform duration-[1200ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
          style={{ transform: done ? "none" : "scale(0.4)" }}
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
    </>
  );
}
