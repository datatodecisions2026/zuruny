"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import type { AnimationItem } from "lottie-web";
import { KineticHeading } from "@/components/KineticHeading";
import { getDict, type Locale } from "@/lib/i18n";

const FADE_MS = 900;

/**
 * The curtain in front of the cinematic hero. Holds until CinematicStage
 * reports the film sequence is buffered, so the first scroll never scrubs
 * into a frame that hasn't downloaded yet.
 */
export function CinematicLoader({
  ready,
  fillRef,
  locale,
}: {
  ready: boolean;
  fillRef: RefObject<HTMLDivElement | null>;
  locale: Locale;
}) {
  const markRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(false);
  const t = getDict(locale).cinematic.loading;

  useEffect(() => {
    const container = markRef.current;
    if (!container) return;

    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let animation: AnimationItem | undefined;
    let disposed = false;

    void import("lottie-web")
      .then(({ default: lottie }) => {
        if (disposed) return;
        animation = lottie.loadAnimation({
          container,
          renderer: "svg",
          path: "/brand/Scene.json",
          loop: !motion.matches,
          autoplay: !motion.matches,
          rendererSettings: {
            // Same crop as CinematicBrand: the export's artboard is far
            // wider than the lockup at its centre.
            viewBoxSize: "440 180 400 400",
            preserveAspectRatio: "xMidYMid meet",
          },
        });
        if (motion.matches) {
          animation.addEventListener("DOMLoaded", () => {
            animation?.goToAndStop(animation.totalFrames - 1, true);
          });
        }
      })
      .catch(() => {
        // The static wordmark behind it still reads fine on its own.
      });

    return () => {
      disposed = true;
      animation?.destroy();
    };
  }, []);

  // Stay mounted through the fade so it doesn't cut, then unmount so a
  // looping SVG animation isn't running invisibly for the rest of the visit.
  useEffect(() => {
    if (!ready) return;
    const timeout = window.setTimeout(() => setHidden(true), FADE_MS);
    return () => window.clearTimeout(timeout);
  }, [ready]);

  if (hidden) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-hidden={ready}
      className="fixed inset-0 z-50 grid place-items-center bg-ground px-[var(--gutter)] text-center transition-opacity duration-[900ms] ease-[var(--ease-out-soft)] motion-reduce:transition-none"
      style={{
        opacity: ready ? 0 : 1,
        pointerEvents: ready ? "none" : "auto",
      }}
    >
      <div className="u-sprig absolute inset-0 -z-10" />

      <div className="m-intro relative flex flex-col items-center gap-7">
        <p className="u-mono text-ochre" style={{ ["--i" as string]: 0 }}>
          {t.eyebrow}
        </p>

        <div
          ref={markRef}
          aria-hidden="true"
          className="aspect-square w-[clamp(6rem,16vw,9rem)] drop-shadow-[0_3px_12px_rgba(0,0,0,0.72)]"
          style={{ ["--i" as string]: 1 }}
        />

        <div style={{ ["--i" as string]: 2 }}>
          <KineticHeading
            as="p"
            text={t.title}
            className="u-display text-[length:var(--step-2)] text-cream"
          />
        </div>

        <p
          className="u-measure max-w-[28ch] text-[length:var(--step-0)] text-[var(--text-muted)]"
          style={{ ["--i" as string]: 3 }}
        >
          {t.sub}
        </p>

        <div
          className="h-px w-40 overflow-hidden bg-[var(--rule)]"
          style={{ ["--i" as string]: 4 }}
        >
          <div
            ref={fillRef}
            className="h-full w-full origin-left bg-ochre"
            style={{ transform: "scaleX(0)" }}
          />
        </div>

        <p
          aria-hidden="true"
          className="u-mono text-[length:var(--step-1)] text-[var(--text-faint)]"
          style={{ ["--i" as string]: 5 }}
        >
          <span className="m-loader-dot" style={{ ["--i" as string]: 0 }}>
            ·
          </span>
          <span className="m-loader-dot" style={{ ["--i" as string]: 1 }}>
            ·
          </span>
          <span className="m-loader-dot" style={{ ["--i" as string]: 2 }}>
            ·
          </span>
        </p>
      </div>
    </div>
  );
}
