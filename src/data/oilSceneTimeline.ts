/**
 * Scroll timeline for the mobile 3D oil scene (see OilScene.tsx). Every value
 * is a pure function of scroll progress 0–1, so scrubbing backwards replays
 * the scene exactly in reverse. One drop leaves the jar early and the camera
 * follows it down the whole page (room for story copy) into the glass.
 */

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

function smoothstep(value: number): number {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

/** Jar starts barely tipped and reaches its full Blender pour pose. 0–1 of that pose. */
export function jarTilt(progress: number): number {
  return 0.25 + 0.75 * smoothstep(progress / 0.08);
}

const SWELL_START = 0.02;
export const RELEASE = 0.12;
export const LAND = 0.86;

/**
 * The drop: swells and stretches at the lip, lets go at RELEASE, then falls
 * the rest of the page. `fall` 0 = at the lip, 1 = at the oil surface.
 * `stretch` 0–1 is how far it has drawn out into a long teardrop.
 */
export function dropState(progress: number) {
  const grow = smoothstep((progress - SWELL_START) / (RELEASE - SWELL_START));
  const t = clamp((progress - RELEASE) / (LAND - RELEASE), 0, 1);
  // Mostly steady so the camera can ride along; a little gravity toward the end.
  const fall = 0.7 * t + 0.3 * t * t;
  return { visible: grow > 0 && progress < LAND, grow, fall, stretch: grow };
}

/** Once the drop lets go the jar lifts out of frame. 0 → 1. */
export function jarExit(progress: number): number {
  return smoothstep((progress - RELEASE) / 0.15);
}

/** The crown blooms where the drop meets the oil. */
export function splashGrow(progress: number): number {
  return smoothstep((progress - LAND) / 0.06);
}

/** Camera settles from following the drop onto the frontal still life. */
export function cameraSettle(progress: number): number {
  return smoothstep((progress - 0.78) / 0.17);
}

/** Camera dollies back from the lip close-up. */
export function cameraPullback(progress: number): number {
  return smoothstep((progress - 0.05) / 0.85);
}

const BOUNCE_SPAN = 0.08;

/**
 * A falling olive or sprig, scheduled to pass the drop's camera: at progress
 * `crossAt` it is `crossHeight` above its resting spot (the camera's height
 * then), falling at `speed` per unit of progress. `height` is how far above
 * rest it is, `drift` 0→1 carries it from its fall lane to its resting spot,
 * and `bounce` is 0–1 of the first bounce and decays to rest.
 */
export function itemFall(progress: number, crossAt: number, crossHeight: number, speed: number) {
  const landAt = crossAt + crossHeight / speed;
  const drift = smoothstep((progress - crossAt) / (landAt - crossAt));
  if (progress < landAt) {
    const height = crossHeight - speed * (progress - crossAt);
    return { height, drift, bounce: 0, spin: height };
  }
  const u = clamp((progress - landAt) / BOUNCE_SPAN, 0, 1);
  return { height: 0, drift, bounce: Math.abs(Math.sin(3 * Math.PI * u)) * (1 - u) ** 2, spin: 0 };
}
