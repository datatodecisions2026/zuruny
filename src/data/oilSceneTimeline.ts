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

/**
 * Copy chapters over the sky, as [enter, exit] progress. Copy side alternates.
 * The first waits for the hero's curtain to be mostly lifted (HomeStage: the
 * lift ends at 0.18).
 */
export const CHAPTERS = [
  { from: 0.1, to: 0.24, side: "left" },
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
  { at: 0.46, pose: [0.1, 1.06, -0.2, 0.15, -1.2, 0.1] },
  // Comes to the front for its chapter over the top of the receding hero.
  { at: 0.5, pose: [0.11, 1.22, -0.08, 0.12, -0.7, 0.06] },
  { at: 0.54, pose: [0.07, 0.99, 0.03, 0.04, -0.1, -0.05] },
  { at: 0.64, pose: [0.07, 0.985, 0.03, 0, 0.15, 0.03] },
  // Swaps places with the hero by arcing up and over behind it, not through it.
  { at: 0.68, pose: [-0.03, 1.26, -0.16, 0.1, 0.35, 0.08] },
  { at: 0.72, pose: [-0.14, 1.0, -0.12, 0.08, 0.5, 0.12] },
  { at: DROP, pose: [-0.14, 0.99, -0.12, 0.04, 0.3, 0.05] },
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

/**
 * How much of their keyframed sideways spread the jars keep on a screen of
 * this aspect: narrow screens pull them toward the middle; the still life
 * gets a little more room than the sky so the plate and clay jar stay in frame.
 */
export function jarSpread(aspect: number, progress: number): number {
  const landing = smoothstep((progress - DROP) / (LANDED - DROP));
  const sky = clamp(aspect / 1.5, 0.3, 1);
  return sky + (clamp(aspect / 1.5, 0.55, 1) - sky) * landing;
}

/** A keyframed pose with its x scaled by the screen's spread. */
export function spreadPose(pose: Pose, spread: number): Pose {
  return [pose[0] * spread, pose[1], pose[2], pose[3], pose[4], pose[5]];
}

// Jar body, from jar.glb / jar_2.glb: 4.25 cm radius glass, 9.5 cm to the lid
// top, origin at the bottom centre.
export const JAR_RADIUS = 0.0428;
export const JAR_HEIGHT = 0.095;
// Air kept between the two jars' glass.
const JAR_AIR = 0.006;

type Vec = [number, number, number];

/** Top of the jar's axis: (0, JAR_HEIGHT, 0) turned by the pose's XYZ Euler (three's default order). */
function jarTop([x, y, z, rx, ry, rz]: Pose): Vec {
  // Rz, then Ry, then Rx applied to (0, h, 0): three's XYZ order is R = Rx·Ry·Rz.
  const a = -JAR_HEIGHT * Math.sin(rz);
  const b = JAR_HEIGHT * Math.cos(rz);
  const c1 = a * Math.cos(ry);
  const c3 = -a * Math.sin(ry);
  return [x + c1, y + b * Math.cos(rx) - c3 * Math.sin(rx), z + b * Math.sin(rx) + c3 * Math.cos(rx)];
}

const sub = (p: Vec, q: Vec): Vec => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const dot = (p: Vec, q: Vec) => p[0] * q[0] + p[1] * q[1] + p[2] * q[2];
const along = (p: Vec, d: Vec, t: number): Vec => [p[0] + d[0] * t, p[1] + d[1] * t, p[2] + d[2] * t];

/** Closest points between segments p1–q1 and p2–q2 (Ericson, Real-Time Collision Detection 5.1.9). */
function closestPoints(p1: Vec, q1: Vec, p2: Vec, q2: Vec): [Vec, Vec] {
  const d1 = sub(q1, p1);
  const d2 = sub(q2, p2);
  const r = sub(p1, p2);
  const a = dot(d1, d1);
  const e = dot(d2, d2);
  const f = dot(d2, r);
  const c = dot(d1, r);
  const b = dot(d1, d2);
  const denom = a * e - b * b;
  let s = denom > 1e-12 ? clamp((b * f - c * e) / denom, 0, 1) : 0;
  let t = (b * s + f) / e;
  if (t < 0) {
    t = 0;
    s = clamp(-c / a, 0, 1);
  } else if (t > 1) {
    t = 1;
    s = clamp((b - c) / a, 0, 1);
  }
  return [along(p1, d1, s), along(p2, d2, t)];
}

/** Distance between the two jars' axes; the glass touches below 2 × JAR_RADIUS. */
export function jarAxisGap(hero: Pose, companion: Pose): number {
  const base = (p: Pose): Vec => [p[0], p[1], p[2]];
  const [h, c] = closestPoints(base(hero), jarTop(hero), base(companion), jarTop(companion));
  return Math.hypot(...sub(c, h));
}

/**
 * The keyframed paths don't know about each other (and narrow screens squeeze
 * them closer), so the companion is slid straight away from the hero whenever
 * their axes come within two radii plus some air. A jar sits inside the
 * rounded shape around its axis, so keeping those apart keeps the glass apart,
 * at any tilt or height. The hero keeps its framing.
 */
export function keepApart(hero: Pose, companion: Pose): Pose {
  const min = 2 * JAR_RADIUS + JAR_AIR;
  const base = (p: Pose): Vec => [p[0], p[1], p[2]];
  let moved = companion;
  // Sideways only, so it never sinks into the table or bobs; each pass clears
  // what the last left (the closest points shift as it moves).
  for (let pass = 0; pass < 8; pass++) {
    const [h, c] = closestPoints(base(hero), jarTop(hero), base(moved), jarTop(moved));
    const gap = Math.hypot(...sub(c, h));
    if (gap >= min - 1e-9) break;
    let dx = c[0] - h[0];
    let dz = c[2] - h[2];
    let flat = Math.hypot(dx, dz);
    // Axes meet straight on (or one above the other): step aside along x.
    if (flat < 1e-6) [dx, dz, flat] = [1, 0, 1];
    const push = min - gap + 1e-4;
    moved = [moved[0] + (dx / flat) * push, moved[1], moved[2] + (dz / flat) * push, moved[3], moved[4], moved[5]];
  }
  return moved;
}
