"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { AnimationItem } from "lottie-web";

export function CinematicBrand({ motionRef }: {
  motionRef: RefObject<HTMLDivElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: AnimationItem | undefined;
    let disposed = false;
    const finish = () => {
      if (motion.matches && animation?.isLoaded) {
        animation.goToAndStop(animation.totalFrames - 1, true);
      }
    };

    // Import in the browser: Lottie's renderer needs the DOM.
    void import("lottie-web").then(({ default: lottie }) => {
      if (disposed) return;
      animation = lottie.loadAnimation({
        container,
        renderer: "svg",
        path: "/brand/Scene.json",
        loop: false,
        autoplay: false,
        rendererSettings: {
          // The export has a 1280 × 720 artboard around the central lockup.
          viewBoxSize: "440 180 400 400",
          preserveAspectRatio: "xMidYMid meet",
        },
      });
      animation.addEventListener("DOMLoaded", () => {
        if (disposed || !animation) return;
        if (motion.matches) finish();
        else animation.play();
        setReady(true);
      });
      animation.addEventListener("data_failed", () => setReady(false));
    }).catch(() => {
      // Keep the static lockup if the player cannot load.
    });
    motion.addEventListener("change", finish);

    return () => {
      disposed = true;
      motion.removeEventListener("change", finish);
      animation?.destroy();
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 z-10 grid place-items-center px-[var(--gutter)] text-center">
      <h1 className="sr-only">Zuruny</h1>
      <div
        ref={motionRef}
        data-brand-motion
        aria-hidden="true"
        className="relative aspect-square w-[clamp(12rem,26vw,22rem)] max-w-full drop-shadow-[0_3px_12px_rgba(0,0,0,0.72)] transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none"
      >
        {/* CSS background keeps the same artwork visible before JS or on failure. */}
        <div
          className="absolute inset-0 bg-contain bg-center bg-no-repeat"
          style={{
            backgroundImage: "url(/brand/scene-static.svg)",
            visibility: ready ? "hidden" : "visible",
          }}
        />
        <div ref={containerRef} className="absolute inset-0" style={{ opacity: ready ? 1 : 0 }} />
      </div>
    </div>
  );
}
