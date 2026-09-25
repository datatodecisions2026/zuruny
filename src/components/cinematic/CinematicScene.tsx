import type { StoryScene } from "@/data/homepageStory";

type CinematicCopy = {
  eyebrow: string;
  title: string;
  body: string;
};

export function CinematicScene({
  scene,
  copy,
  onLayerRef,
  onVideoRef,
  onFrameImgRef,
  onTextRef,
}: {
  scene: StoryScene;
  copy: CinematicCopy;
  onLayerRef: (element: HTMLDivElement | null) => void;
  onVideoRef: (element: HTMLVideoElement | null) => void;
  onFrameImgRef: (element: HTMLImageElement | null) => void;
  onTextRef: (element: HTMLDivElement | null) => void;
}) {
  return (
    <div
      data-scene-id={scene.id}
      ref={onLayerRef}
      className="absolute inset-0 transition-none"
      style={{ opacity: scene.id === "idle" ? 1 : 0 }}
    >
      <video
        ref={onVideoRef}
        aria-hidden="true"
        className={
          scene.mobileFrames
            ? "hidden size-full object-cover md:block"
            : "size-full object-cover"
        }
        muted
        loop={scene.loop}
        playsInline
        preload={scene.mobileFrames ? "none" : "auto"}
      >
        {/* Scenes with a mobile frame sequence get no static source at
            all — the browser would otherwise have no reason not to fetch
            this desktop file on a phone. CinematicStage wires .src in
            imperatively once it's confirmed we're actually on desktop. */}
        {!scene.mobileFrames && (
          <>
            {scene.mobileSrc && (
              <source
                media="(max-width: 767px)"
                src={scene.mobileSrc}
                type="video/mp4"
              />
            )}
            <source src={scene.desktopSrc} type="video/mp4" />
          </>
        )}
      </video>

      {scene.mobileFrames && (
        // CinematicStage mutates .src imperatively at scroll rate; next/image's
        // own pipeline (srcset, blur-up, lazy load) would fight that, not help it.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          ref={onFrameImgRef}
          alt=""
          aria-hidden="true"
          className="size-full object-cover md:hidden"
          // Frames are pre-decoded during preload (see CinematicStage), so
          // there's nothing expensive left for an async decode to defer —
          // "sync" just tells the browser to paint the swap immediately
          // rather than holding it for a later task.
          decoding="sync"
        />
      )}

      {(copy.eyebrow || copy.title || copy.body) && (
        <div
          ref={onTextRef}
          className="absolute inset-x-0 bottom-0 px-[var(--gutter)] pb-[clamp(4rem,12vh,9rem)]"
          style={{ opacity: 0 }}
        >
          <div
            className={
              scene.side === "right"
                ? "relative isolate ml-auto max-w-[28ch] text-right drop-shadow-[0_2px_8px_rgba(0,0,0,0.82)]"
                : "relative isolate max-w-[32ch] drop-shadow-[0_2px_8px_rgba(0,0,0,0.82)]"
            }
          >
            <span
              aria-hidden="true"
              className="pointer-events-none absolute -inset-x-10 -inset-y-8 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(11,9,8,0.58)_0%,rgba(11,9,8,0.22)_48%,transparent_76%)]"
            />
            {copy.eyebrow && (
              <p
                data-parallax-depth="0.55"
                className="u-mono mb-4 text-ochre will-change-transform"
              >
                {copy.eyebrow}
              </p>
            )}
            {copy.title && (
              <h2
                data-parallax-depth="1"
                className="u-display text-[length:var(--step-3)] text-cream will-change-transform"
              >
                {copy.title}
              </h2>
            )}
            {copy.body && (
              <p
                data-parallax-depth="0.35"
                className="u-measure mt-4 text-[length:var(--step-0)] leading-relaxed text-[var(--text-muted)] will-change-transform"
              >
                {copy.body}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
