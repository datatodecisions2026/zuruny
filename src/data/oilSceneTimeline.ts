/**
 * Scroll timeline for the 3D jar scene (see OilScene.tsx). Every value is a
 * pure function of scroll progress 0–1, so scrubbing backwards replays the
 * scene exactly in reverse. Two jars fall through a cream sky of clouds, each
 * on its own path, across four copy chapters, then drop onto the table where
 * the sky warms to burgundy for the still life.
 *
 * World units are meters: the table is y = 0, the sky band sits around y = 1.
 */

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

export function smoothstep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

/** x, y, z, rotX, rotY, rotZ */
export type Pose = readonly [number, number, number, number, number, number];
export type Key = { at: number; pose: Pose };

/** Pose at `progress`, eased between the two keys around it and held past the ends. */
export function poseAt(keys: readonly Key[], progress: number): Pose {
  if (progress <= keys[0].at) return keys[0].pose;
  for (let i = 1; i < keys.length; i++) {
    const b = keys[i];
    if (progress > b.at) continue;
    if (progress === b.at) return b.pose;
    const a = keys[i - 1];
    const t = smoothstep((progress - a.at) / (b.at - a.at));
    return a.pose.map((v, j) => v + (b.pose[j] - v) * t) as unknown as Pose;
  }
  return keys[keys.length - 1].pose;
}

/** Copy chapters over the sky, as [enter, exit] progress. Copy side alternates. */
export const CHAPTERS = [
  { from: 0.04, to: 0.22, side: "left" },
  { from: 0.26, to: 0.44, side: "right" },
  { from: 0.48, to: 0.64, side: "left" },
  { from: 0.68, to: 0.8, side: "right" },
] as const;

const CHAPTER_FADE = 0.035;

/** 0–1 visibility of chapter `i`'s copy. */
export function chapterOpacity(progress: number, i: number): number {
  const c = CHAPTERS[i];
  return smoothstep((progress - c.from) / CHAPTER_FADE) * (1 - smoothstep((progress - (c.to - CHAPTER_FADE)) / CHAPTER_FADE));
}

/** Index of the chapter being read, for the nav; -1 before the first, 4 = the still life. */
export function activeChapter(progress: number): number {
  if (progress >= LANDED) return CHAPTERS.length;
  let active = -1;
  CHAPTERS.forEach((c, i) => {
    if (progress >= c.from - CHAPTER_FADE) active = i;
  });
  return active;
}

// The drop: both jars leave the sky at DROP and are standing on the table by LANDED.
export const DROP = 0.8;
export const LANDED = 0.92;

/** Fayez (jar.glb), the hero: near, slow, turns its label through each chapter. */
export const HERO_KEYS: readonly Key[] = [
  { at: 0, pose: [0, 1.3, 0, 0.35, -2.6, 0.3] },
  { at: 0.12, pose: [0.07, 1.0, 0, 0.06, -0.9, -0.08] },
  { at: 0.22, pose: [0.07, 0.99, 0, 0.02, -0.25, 0.04] },
  { at: 0.3, pose: [-0.07, 0.98, 0.02, 0, 0.3, -0.03] },
  { at: 0.44, pose: [-0.07, 0.97, 0.02, 0, 0.08, 0] },
  { at: 0.52, pose: [-0.12, 1.02, -0.22, 0.1, -0.6, 0.12] },
  { at: 0.64, pose: [-0.13, 1.03, -0.25, 0.14, -1.4, 0.15] },
  { at: 0.72, pose: [-0.05, 0.99, 0, -0.05, 0.25, -0.1] },
  { at: DROP, pose: [-0.05, 0.98, 0, 0, 0.1, 0] },
  { at: 0.9, pose: [0, 0, 0, 0, -0.12, 0] },
  { at: 1, pose: [0, 0, 0, 0, -0.15, 0] },
];

/** Georges (jar_2.glb), the companion: farther back, quicker, lands first. */
export const COMPANION_KEYS: readonly Key[] = [
  { at: 0, pose: [-0.2, 1.55, -0.35, -0.4, 1.8, -0.4] },
  { at: 0.16, pose: [-0.16, 1.12, -0.4, -0.2, 0.9, -0.25] },
  { at: 0.3, pose: [0.17, 1.1, -0.45, 0.2, -0.6, 0.2] },
  { at: 0.46, pose: [0.1, 1.0, -0.2, 0.15, -1.2, 0.1] },
  { at: 0.54, pose: [0.07, 0.99, 0.03, 0.04, -0.1, -0.05] },
  { at: 0.64, pose: [0.07, 0.985, 0.03, 0, 0.15, 0.03] },
  { at: 0.72, pose: [-0.14, 1.0, -0.06, 0.08, 0.5, 0.12] },
  { at: DROP, pose: [-0.14, 0.99, -0.06, 0.04, 0.3, 0.05] },
  { at: 0.87, pose: [0.095, 0, -0.07, 0, 0.3, 0] },
  { at: 1, pose: [0.095, 0, -0.07, 0, 0.28, 0] },
];

/** Camera: x, y, distance (z), lookY. Rides the sky, then follows the jars down, a beat behind. */
export const CAMERA_KEYS: readonly Key[] = [
  { at: 0, pose: [0, 1.03, 0.42, 1.03, 0, 0] },
  { at: DROP, pose: [0, 1.02, 0.42, 1.02, 0, 0] },
  { at: LANDED, pose: [0, 0.07, 0.34, 0.045, 0, 0] },
  { at: 1, pose: [0, 0.065, 0.32, 0.045, 0, 0] },
];

/** Shop/Names CTA: only once both jars stand on the table. */
export function ctaReveal(progress: number): number {
  return smoothstep((progress - 0.9) / 0.07);
}

/** 0 = cream sky, 1 = burgundy studio. */
export function warmth(progress: number): number {
  return smoothstep((progress - 0.82) / 0.1);
}
