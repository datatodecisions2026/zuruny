"use client";

import { useEffect, useRef } from "react";

const FADE = 0.6; // seconds of dip at each end of the loop

/**
 * The 8-second brand film — a slow push-in from three Em Ramiz tins to the
 * gold emblem.
 *
 * IMAGES.txt asks for three specific behaviours, all of them implemented here:
 *   1. Dip to black across the loop seam. Cutting straight from the tight
 *      logo back to the wide shot snaps hard.
 *   2. Serve both files and mute for autoplay.
 *   3. Pause it when it scrolls out of view.
 *
 * The dip is driven by rAF rather than `timeupdate`, which only fires about
 * four times a second and would make the fade visibly step.
 */
export function Film() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");

    const tick = () => {
      const { currentTime, duration } = video;
      if (duration) {
        const inFade = Math.min(currentTime / FADE, 1);
        const outFade = Math.min((duration - currentTime) / FADE, 1);
        video.style.opacity = String(
          Math.max(0, Math.min(inFade, outFade)).toFixed(3),
        );
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    const start = () => {
      if (frameRef.current === undefined) frameRef.current = requestAnimationFrame(tick);
    };
    const stop = () => {
      if (frameRef.current !== undefined) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = undefined;
      }
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !reduced.matches) {
          void video.play().catch(() => {
            /* Autoplay refused — the poster frame stands in. */
          });
          start();
        } else {
          video.pause();
          stop();
        }
      },
      { threshold: 0.25 },
    );

    observer.observe(video);

    return () => {
      observer.disconnect();
      stop();
    };
  }, []);

  return (
    <section
      aria-label="Zuruny brand film"
      className="relative isolate overflow-hidden border-t border-[var(--rule)] bg-black"
    >
      <div className="relative aspect-video max-h-[80svh] w-full">
        <video
          ref={videoRef}
          className="size-full object-cover"
          poster="/film/em-ramiz-poster.jpg"
          muted
          loop
          playsInline
          preload="metadata"
        >
          <source src="/film/em-ramiz.webm" type="video/webm" />
          <source src="/film/em-ramiz.mp4" type="video/mp4" />
        </video>

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ground/70 via-transparent to-transparent" />

        <p className="u-mono absolute bottom-6 left-[var(--gutter)] text-cream/60">
          Em Ramiz &middot; Aabra, South Lebanon
        </p>
      </div>
    </section>
  );
}
