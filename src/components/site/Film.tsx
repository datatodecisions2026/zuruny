"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Seconds of fade at each end of the loop. */
const SEAM = 0.5;

/**
 * The Em Ramiz film, on a loop.
 *
 * The shot pushes in from three tins to a tight gold mark, so cutting straight
 * back to the wide shot snaps hard. Each pass is dipped to black across the
 * last and first half-second, which turns the seam into a dissolve.
 *
 * It only runs while it is on screen, since a looping video that plays the
 * whole way down the page is wasted battery.
 */
export function Film() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<number | null>(null);
  const [started, setStarted] = useState(false);
  const [muted, setMuted] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    setReducedMotion(
      window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );
  }, []);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().then(
      () => setStarted(true),
      () => setStarted(false),
    );
  }, []);

  // Dip to black across the loop seam.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;

    const tick = () => {
      const d = video.duration;
      if (d && Number.isFinite(d)) {
        const t = video.currentTime;
        const edge = Math.min(t, d - t);
        video.style.opacity = String(
          Math.max(0, Math.min(1, edge / SEAM)),
        );
      }
      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      video.style.opacity = "1";
    };
  }, [reducedMotion]);

  // Play while visible, pause when it scrolls away.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || reducedMotion) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.play().then(
            () => setStarted(true),
            () => setStarted(false),
          );
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(video);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const toggleSound = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !muted;
    video.muted = next;
    setMuted(next);
    if (!next && video.paused) play();
  };

  return (
    <section aria-labelledby="film-caption" className="relative py-4">
      <div className="relative w-full overflow-hidden bg-black">
        <video
          ref={videoRef}
          className="block h-auto w-full"
          poster="/film/em-ramiz-poster.jpg"
          preload="metadata"
          muted
          loop={!reducedMotion}
          playsInline
        >
          <source src="/film/em-ramiz.webm" type="video/webm" />
          <source src="/film/em-ramiz.mp4" type="video/mp4" />
        </video>

        {/* Covers autoplay refusal, and reduced motion, where nothing moves
            until it is asked for. */}
        {!started && (
          <button
            type="button"
            onClick={play}
            className="absolute inset-0 flex items-center justify-center bg-char/25 text-sm tracking-[0.14em] text-paper transition-colors duration-300 hover:bg-char/10"
          >
            <span className="border border-gold/60 bg-char/70 px-6 py-3 text-gold">
              Play the film
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={toggleSound}
          aria-pressed={!muted}
          className="absolute bottom-5 right-5 flex min-h-11 items-center border border-gold/50 bg-char/70 px-4 text-xs tracking-[0.14em] text-gold transition-colors duration-300 hover:bg-char hover:text-paper"
        >
          {muted ? "Sound on" : "Sound off"}
        </button>
      </div>

      <p
        id="film-caption"
        className="mx-auto mt-5 max-w-6xl px-6 text-sm text-char-soft sm:px-10"
      >
        Em Ramiz — 250 ml, 1 L and 3 L, pressed in Aabra above Sidon.
      </p>
    </section>
  );
}

export default Film;
