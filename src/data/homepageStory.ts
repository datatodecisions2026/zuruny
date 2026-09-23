/**
 * Cinematic homepage story configuration.
 *
 * Each scene owns its desktop/mobile sources and scroll range.
 * The CinematicStage iterates this list and drives playback/opacity from it.
 */

export interface StoryScene {
  id: "idle" | "intro" | "canopy" | "oilDrop";
  /** Scroll progress at which this scene starts becoming active. 0-1. */
  scrollStart: number;
  /** Scroll progress at which this scene reaches full opacity. 0-1. */
  scrollEnd: number;
  side?: "left" | "right";
  desktopSrc: string;
  mobileSrc: string;
  /** Prefers to preload this asset. Idle = true. */
  preload: boolean;
  /** Muted looping idle video vs scroll-driven scene. */
  loop: boolean;
}

export const SCENES: StoryScene[] = [
  {
    id: "idle",
    scrollStart: 0,
    scrollEnd: 0.06,
    preload: true,
    loop: true,
    desktopSrc: "/hero_scenes/tree_idle_seamless.mp4",
    mobileSrc: "/hero_scenes/tree_idle_mobile_seamless.mp4",
  },
  {
    id: "intro",
    scrollStart: 0.04,
    scrollEnd: 0.33,
    side: "left",
    preload: false,
    loop: false,
    desktopSrc: "/hero_scenes/tree_intro_new.mp4",
    mobileSrc: "/hero_scenes/tree_intro_mobile_new.mp4",
  },
  {
    id: "canopy",
    scrollStart: 0.3,
    scrollEnd: 0.57,
    side: "right",
    preload: false,
    loop: false,
    desktopSrc: "/hero_scenes/tree_canopy_new.mp4",
    mobileSrc: "/hero_scenes/tree_canopy_mobile_new.mp4",
  },
  {
    id: "oilDrop",
    scrollStart: 0.55,
    scrollEnd: 0.84,
    side: "left",
    preload: false,
    loop: false,
    desktopSrc: "/hero_scenes/oil_drop_new.mp4",
    mobileSrc: "/hero_scenes/oil_drop_mobile_new.mp4",
  },
];

/** Clamp helper. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function smoothstep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Crossfade a scene only across the overlap encoded in the scene ranges.
 * Outside those short overlaps the active scene stays fully opaque.
 */
export function sceneOpacity(
  scenes: readonly StoryScene[],
  index: number,
  progress: number,
): number {
  const scene = scenes[index];
  if (!scene) return 0;

  const previous = scenes[index - 1];
  if (previous && progress <= scene.scrollStart) return 0;
  if (previous && progress < previous.scrollEnd) {
    const overlap = previous.scrollEnd - scene.scrollStart;
    return overlap > 0
      ? smoothstep((progress - scene.scrollStart) / overlap)
      : 1;
  }

  const next = scenes[index + 1];
  if (next && progress >= scene.scrollEnd) return 0;
  if (next && progress > next.scrollStart) {
    const overlap = scene.scrollEnd - next.scrollStart;
    return overlap > 0
      ? 1 - smoothstep((progress - next.scrollStart) / overlap)
      : 0;
  }

  return 1;
}

export function scenePlaybackProgress(
  scene: StoryScene,
  progress: number,
): number {
  const duration = scene.scrollEnd - scene.scrollStart;
  if (duration <= 0) return 0;
  return clamp((progress - scene.scrollStart) / duration, 0, 1);
}

export interface CopyMotion {
  opacity: number;
  x: number;
  y: number;
}

/**
 * Editorial copy motion for a scene. The entrance follows the side of the
 * composition, then settles before drifting upward and easing away.
 */
export function sceneCopyMotion(
  scene: StoryScene,
  progress: number,
): CopyMotion {
  if (scene.loop) return { opacity: 1, x: 0, y: 0 };

  const localProgress = scenePlaybackProgress(scene, progress);
  const entrance = smoothstep(localProgress / 0.24);
  const departure = 1 - smoothstep((localProgress - 0.76) / 0.24);
  const entranceOffset = entrance === 1 ? 0 : (1 - entrance) * 32;
  const direction = scene.side === "right" ? 1 : -1;

  return {
    opacity: entrance * departure,
    x: entranceOffset === 0 ? 0 : direction * entranceOffset,
    y: (1 - entrance) * 52 - localProgress * 22,
  };
}

/** Give the lockup its own departure, spanning roughly 40% of a viewport. */
export function brandExitMotion(progress: number) {
  const departure = smoothstep((progress - 0.005) / 0.125);
  return {
    opacity: 1 - departure,
    y: departure === 0 ? 0 : -32 * departure,
    scale: 1 - 0.06 * departure,
  };
}

export interface EndCtaMotion {
  opacity: number;
  y: number;
}

/** Reveal the final actions only after the oil-scene narrative has cleared. */
export function endCtaMotion(progress: number): EndCtaMotion {
  const reveal = smoothstep((progress - 0.84) / 0.08);

  return {
    opacity: reveal,
    y: (1 - reveal) * 24,
  };
}
