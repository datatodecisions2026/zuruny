import assert from "node:assert/strict";
import test from "node:test";
import {
  CAMERA_KEYS,
  CHAPTERS,
  COMPANION_KEYS,
  HERO_KEYS,
  LANDED,
  activeChapter,
  chapterOpacity,
  poseAt,
  warmth,
} from "../src/data/oilSceneTimeline.ts";

test("poses hold at the ends and land exactly on their keys", () => {
  for (const keys of [HERO_KEYS, COMPANION_KEYS, CAMERA_KEYS]) {
    assert.deepEqual(poseAt(keys, -1), keys[0].pose);
    assert.deepEqual(poseAt(keys, 2), keys.at(-1).pose);
    for (const k of keys) assert.deepEqual([...poseAt(keys, k.at)], [...k.pose]);
    for (let i = 1; i < keys.length; i++) assert.ok(keys[i].at > keys[i - 1].at, "keys in order");
  }
});

test("both jars stand on the table once landed", () => {
  assert.equal(poseAt(HERO_KEYS, LANDED)[1], 0);
  assert.equal(poseAt(COMPANION_KEYS, LANDED)[1], 0);
});

test("one chapter at a time, fully shown mid-chapter, then the still life", () => {
  CHAPTERS.forEach((c, i) => {
    const mid = (c.from + c.to) / 2;
    assert.equal(chapterOpacity(mid, i), 1);
    assert.equal(activeChapter(mid), i);
    CHAPTERS.forEach((_, j) => j !== i && assert.equal(chapterOpacity(mid, j), 0));
  });
  assert.equal(activeChapter(0), -1);
  assert.equal(activeChapter(1), CHAPTERS.length);
});

test("the sky only warms after the last chapter", () => {
  assert.equal(warmth(CHAPTERS.at(-1).to), 0);
  assert.equal(warmth(1), 1);
});

test("the CTA waits for both jars to land", async () => {
  const { ctaReveal } = await import("../src/data/oilSceneTimeline.ts");
  assert.equal(ctaReveal(LANDED - 0.03), 0);
  assert.equal(ctaReveal(1), 1);
});
