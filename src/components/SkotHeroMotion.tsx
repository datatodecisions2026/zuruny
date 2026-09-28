"use client";

import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";

const INTRO_TIMEOUT_MS = 4000;
// Length of the rotate → idle dissolve, in seconds.
const BLEND_S = 1;
// Phones fill the screen with the portrait cut. Desktop follows Figma, which
// frames the film at ~120% of the artboard pinned to its bottom edge, nudged
// 2% right of Figma's -9.88% so the film's bottom-right watermark falls
// off-screen (the portrait cut has none).
const FILM_CLASS =
  "pointer-events-none absolute inset-0 size-full object-cover md:inset-auto md:-left-[7.88%] md:-top-[9.88%] md:size-[119.76%] md:max-w-none md:object-bottom";

/**
 * The moving parts of SkotHero: the tree films (a one-off rotate that
 * dissolves into an endless idle loop, game-lobby style), and the Zuruny
 * Lottie mark that plays small over a dark curtain, then grows into the
 * slot the template's "SKOTHYA" title occupied as the curtain lifts.
 */
export function SkotHeroMotion() {
  const rotateRef = useRef<HTMLVideoElement>(null);
  const idleRef = useRef<HTMLVideoElement>(null);
  const markRef = useRef<HTMLDivElement>(null);
  const [lottieReady, setLottieReady] = useState(false);
  const [done, setDone] = useState(false);
  const [idleShowing, setIdleShowing] = useState(false);

  // Load both films behind the curtain so they're buffered when it lifts.
  useEffect(() => {
    const cut = window.matchMedia("(min-width: 768px)").matches ? "" : "-mobile";
    const rotate = rotateRef.current;
    const idle = idleRef.current;
    if (!rotate || !idle) return;
    // React doesn't reflect the `muted` prop onto the element, and autoplay
    // policies reject play() on anything not muted.
    rotate.muted = idle.muted = true;
    rotate.poster = `/skot/tree-rotate${cut}-poster.webp`;
    rotate.src = `/skot/tree-rotate${cut}.mp4`;
    idle.src = `/skot/tree-idle-loop${cut}.mp4`;
  }, []);

  // Once the curtain lifts: play the rotate once, then dissolve it into the
  // idle loop. The idle file has its own seam baked in (its last second
  // crossfades into its first), so plain `loop` wraps with no visible jump.
  useEffect(() => {
    if (!done) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const rotate = rotateRef.current;
    const idle = idleRef.current;
    if (!rotate || !idle || !rotate.src) return;

    let raf = 0;
    const handOff = () => {
      cancelAnimationFrame(raf);
      void idle.play().catch(() => {});
      setIdleShowing(true);
    };
    const watch = () => {
      if (rotate.duration - rotate.currentTime <= BLEND_S) handOff();
      else raf = requestAnimationFrame(watch);
    };
    rotate.addEventListener("ended", handOff, { once: true });
    void rotate
      .play()
      .then(() => {
        raf = requestAnimationFrame(watch);
      })
      .catch(handOff); // Autoplay declined: go straight to the lobby loop.

    return () => {
      cancelAnimationFrame(raf);
      rotate.removeEventListener("ended", handOff);
    };
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
        className={`${FILM_CLASS} -z-20`}
      />
      <video
        ref={rotateRef}
        playsInline
        preload="auto"
        aria-hidden="true"
        className={`${FILM_CLASS} -z-10 transition-opacity duration-1000 ease-in-out`}
        style={{ opacity: idleShowing ? 0 : 1 }}
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
