"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { brandExitMotion, endCtaMotion, clamp } from "@/data/homepageStory";
import { getDict, type Locale } from "@/lib/i18n";
import { CinematicEndCta } from "@/components/cinematic/CinematicOverlays";
import { CinematicBrand } from "@/components/cinematic/CinematicBrand";
import { CinematicLoader } from "@/components/cinematic/CinematicLoader";

// Background-removed pour → drop → landing sequence, keyed out of the same
// footage as the desktop oil scene (see public/hero_frames/oilPour). Unlike
// the old mobile tree scenes, this one owns the entire mobile stage instead
// of a slice of it.
const FRAME_BASE = "/hero_frames/oilPour";
const FRAME_COUNT = 90;

function frameSrc(index: number): string {
  return `${FRAME_BASE}/f${String(index).padStart(3, "0")}.webp`;
}

function smoothstep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

/** Eyebrow/title/body fade in early, hold, then clear well before the CTA reveal. */
function copyMotion(progress: number) {
  const enter = smoothstep((progress - 0.05) / 0.11);
  const exit = 1 - smoothstep((progress - 0.42) / 0.13);
  return { opacity: enter * exit, y: (1 - enter) * 28 };
}

// Fades the studio backdrop's residual vignette (the color-key can't fully
// clear near-black corners without eating the translucent glass) without
// touching the 90 source frames themselves.
const FRAME_MASK =
  "radial-gradient(ellipse 72% 80% at 50% 46%, #000 55%, transparent 92%)";

/**
 * Mobile-only hero: a single pinned oil-pour sequence, background removed,
 * scrubbed by GSAP/ScrollTrigger across the whole stage instead of sharing
 * scroll room with the tree scenes (see CinematicStage for desktop).
 */
export function MobileOilHero({ locale }: { locale: Locale }) {
  const sectionRef = useRef<HTMLElement>(null);
  const frameImgRef = useRef<HTMLImageElement>(null);
  const frameBoxRef = useRef<HTMLDivElement>(null);
  const copyRef = useRef<HTMLDivElement>(null);
  const brandRef = useRef<HTMLDivElement>(null);
  const endCtaRef = useRef<HTMLDivElement>(null);
  const loaderFillRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const t = getDict(locale);
  const copy = t.cinematic.oilDrop;

  const renderProgress = useCallback((progress: number) => {
    const frameImg = frameImgRef.current;
    if (frameImg) {
      const index = Math.min(
        FRAME_COUNT,
        Math.max(1, Math.round(progress * (FRAME_COUNT - 1)) + 1),
      );
      if (frameImg.dataset.frame !== String(index)) {
        frameImg.dataset.frame = String(index);
        frameImg.src = frameSrc(index);
      }
    }

    const box = frameBoxRef.current;
    if (box) {
      box.style.transform = `translate3d(0, ${(progress - 0.5) * -36}px, 0) scale(${1 + progress * 0.05})`;
    }

    const brand = brandRef.current;
    if (brand) {
      const motion = brandExitMotion(progress);
      brand.style.opacity = String(motion.opacity);
      brand.style.transform = `translate3d(0, ${motion.y}px, 0) scale(${motion.scale})`;
    }

    const copyEl = copyRef.current;
    if (copyEl) {
      const motion = copyMotion(progress);
      copyEl.style.opacity = String(motion.opacity);
      copyEl.style.transform = `translate3d(0, ${motion.y}px, 0)`;
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

  // Preload + decode every frame before releasing scroll — same reasoning
  // as the desktop stage: scrubbing into an undecoded frame is a black flash.
  useEffect(() => {
    if (window.matchMedia("(min-width: 768px)").matches) {
      const timeoutId = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(timeoutId);
    }

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reducedMotion) {
      const timeoutId = window.setTimeout(() => setReady(true), 0);
      return () => window.clearTimeout(timeoutId);
    }

    let disposed = false;
    let loaded = 0;

    const settle = () => {
      if (disposed) return;
      loaded += 1;
      const fill = loaderFillRef.current;
      if (fill) fill.style.transform = `scaleX(${loaded / FRAME_COUNT})`;
      if (loaded >= FRAME_COUNT) setReady(true);
    };

    for (let i = 1; i <= FRAME_COUNT; i++) {
      const preload = new Image();
      preload.src = frameSrc(i);
      preload.decode().then(settle, settle);
    }

    // A flaky connection should not strand the homepage behind the loader.
    const timeoutId = window.setTimeout(() => setReady(true), 8000);
    return () => {
      disposed = true;
      window.clearTimeout(timeoutId);
    };
  }, []);

  // Hold scroll until frames are decoded. Desktop's CinematicStage owns its
  // own lock and bails out on mobile, so the two never fight over
  // document.body.style.overflow.
  useEffect(() => {
    if (ready || !window.matchMedia("(max-width: 767px)").matches) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [ready]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || !window.matchMedia("(max-width: 767px)").matches) return;

    let disposed = false;
    let cleanup = () => {};

    async function start() {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed || !section) return;
      gsap.registerPlugin(ScrollTrigger);

      if (
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        renderProgress(1);
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

      const trigger = ScrollTrigger.create({
        trigger: section,
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
        onUpdate: (self) => renderProgress(self.progress),
      });
      // scrub only calls onUpdate on the next scroll — paint frame 1 now so
      // there's something other than an empty <img> before that happens.
      renderProgress(trigger.progress);
      cleanup = () => trigger.kill();
    }

    start().catch(() => {});
    return () => {
      disposed = true;
      cleanup();
    };
  }, [renderProgress]);

  return (
    <section
      ref={sectionRef}
      aria-label={
        locale === "fr" ? "L'essence de Zuruny" : "The essence of Zuruny"
      }
      className="relative isolate block h-[300svh] overflow-clip bg-ground motion-reduce:h-[100svh] md:hidden"
    >
      <div className="sticky top-0 flex h-[100svh] flex-col items-center justify-center gap-8 overflow-hidden px-[var(--gutter)]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_120%_70%_at_50%_38%,rgba(140,39,59,0.35)_0%,transparent_70%)]"
        />

        <CinematicBrand motionRef={brandRef} />

        <div ref={frameBoxRef} className="relative w-full max-w-sm will-change-transform">
          <div className="relative aspect-[520/480] w-full">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              ref={frameImgRef}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full object-contain"
              style={{ maskImage: FRAME_MASK, WebkitMaskImage: FRAME_MASK }}
              decoding="sync"
            />
          </div>
        </div>

        <div
          ref={copyRef}
          className="relative z-10 max-w-[30ch] text-center will-change-transform"
          style={{ opacity: 0 }}
        >
          <p className="u-mono mb-3 text-ochre">{copy.eyebrow}</p>
          <h2 className="u-display text-[length:var(--step-3)] text-cream">
            {copy.title}
          </h2>
          <p className="u-measure mt-3 text-[length:var(--step-0)] text-[var(--text-muted)]">
            {copy.body}
          </p>
        </div>

        <CinematicEndCta locale={locale} containerRef={endCtaRef} />
      </div>

      <CinematicLoader ready={ready} fillRef={loaderFillRef} locale={locale} />
    </section>
  );
}
