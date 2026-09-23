import assert from "node:assert/strict";
import test from "node:test";
import {
  SCENES,
  endCtaMotion,
  sceneCopyMotion,
  sceneOpacity,
  scenePlaybackProgress,
} from "../src/data/homepageStory.ts";
import { primaryNavigation } from "../src/lib/i18n.ts";

test("adjacent scenes crossfade only inside their configured overlap", () => {
  const idle = sceneOpacity(SCENES, 0, 0.05);
  const intro = sceneOpacity(SCENES, 1, 0.05);

  assert.ok(Math.abs(idle - 0.5) < Number.EPSILON * 4);
  assert.ok(Math.abs(intro - 0.5) < Number.EPSILON * 4);
  assert.ok(Math.abs(idle + intro - 1) < Number.EPSILON * 4);
});

test("a scene remains fully visible between its entrance and exit overlaps", () => {
  assert.equal(sceneOpacity(SCENES, 1, 0.2), 1);
  assert.equal(sceneOpacity(SCENES, 0, 0.2), 0);
  assert.equal(sceneOpacity(SCENES, 2, 0.2), 0);
});

test("the final scene remains visible after its playback range", () => {
  assert.equal(sceneOpacity(SCENES, SCENES.length - 1, 1), 1);
});

test("playback progress is clamped to the scene range", () => {
  const intro = SCENES[1];

  assert.equal(scenePlaybackProgress(intro, 0), 0);
  assert.equal(scenePlaybackProgress(intro, intro.scrollEnd), 1);
  assert.equal(scenePlaybackProgress(intro, 1), 1);
});

test("copy enters from the side of its composition", () => {
  const intro = sceneCopyMotion(SCENES[1], SCENES[1].scrollStart);
  const canopy = sceneCopyMotion(SCENES[2], SCENES[2].scrollStart);

  assert.deepEqual(intro, { opacity: 0, x: -32, y: 52 });
  assert.deepEqual(canopy, { opacity: 0, x: 32, y: 52 });
});

test("copy settles at full opacity then drifts upward with scroll", () => {
  const intro = SCENES[1];
  const midpoint = (intro.scrollStart + intro.scrollEnd) / 2;
  const motion = sceneCopyMotion(intro, midpoint);

  assert.equal(motion.opacity, 1);
  assert.equal(motion.x, 0);
  assert.ok(motion.y < 0);
  assert.ok(motion.y > -22);
});

test("copy eases away at the end instead of popping out", () => {
  const intro = SCENES[1];
  const motion = sceneCopyMotion(intro, intro.scrollEnd);

  assert.deepEqual(motion, { opacity: 0, x: 0, y: -22 });
});

test("looping scenes keep their copy static", () => {
  assert.deepEqual(sceneCopyMotion(SCENES[0], 0.5), {
    opacity: 1,
    x: 0,
    y: 0,
  });
});

test("every primary navigation item targets its own page", () => {
  assert.deepEqual(
    primaryNavigation("en").map(({ href }) => href),
    ["/shop", "/names", "/artisans", "/about", "/shipping"],
  );
  assert.deepEqual(
    primaryNavigation("fr").map(({ href }) => href),
    ["/fr/shop", "/fr/names", "/fr/artisans", "/fr/about", "/fr/shipping"],
  );
  assert.ok(primaryNavigation("en").every(({ href }) => !href.includes("#")));
});

test("the final calls to action ease in after the story copy clears", () => {
  assert.deepEqual(endCtaMotion(0.84), { opacity: 0, y: 24 });
  assert.deepEqual(endCtaMotion(0.92), { opacity: 1, y: 0 });

  const transition = endCtaMotion(0.88);
  assert.ok(transition.opacity > 0 && transition.opacity < 1);
  assert.ok(transition.y > 0 && transition.y < 24);
});

test("idle scenes use the seamless desktop and mobile films", () => {
  const idle = SCENES[0];
  assert.equal(idle.desktopSrc, "/hero_scenes/tree_idle_seamless.mp4");
  assert.equal(idle.mobileSrc, "/hero_scenes/tree_idle_mobile_seamless.mp4");
});
