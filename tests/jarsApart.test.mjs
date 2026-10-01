import assert from "node:assert/strict";
import test from "node:test";
import { Euler, Matrix4, Quaternion, Vector3 } from "three";
import {
  COMPANION_KEYS,
  HERO_KEYS,
  JAR_HEIGHT,
  JAR_RADIUS,
  jarAxisGap,
  jarSpread,
  keepApart,
  poseAt,
  spreadPose,
} from "../src/data/oilSceneTimeline.ts";

// Narrow phone → ultrawide.
const ASPECTS = [0.42, 0.46, 0.6, 0.75, 1, 1.33, 1.78, 2.4];
const STEPS = 2000;

/** Both jars exactly as OilScene places them at this scroll position. */
function posed(p, aspect) {
  const spread = jarSpread(aspect, p);
  const hero = spreadPose(poseAt(HERO_KEYS, p), spread);
  return { hero, companion: keepApart(hero, spreadPose(poseAt(COMPANION_KEYS, p), spread)) };
}

/** three's own world matrix for a pose (independent of the solver's rotation math). */
function matrix([x, y, z, rx, ry, rz]) {
  return new Matrix4().compose(new Vector3(x, y, z), new Quaternion().setFromEuler(new Euler(rx, ry, rz)), new Vector3(1, 1, 1));
}

// Points over a jar's whole body (sides, both caps, axis), in its own frame.
const BODY = [];
for (let h = 0; h <= 12; h++) {
  const y = (h / 12) * JAR_HEIGHT;
  BODY.push(new Vector3(0, y, 0));
  for (let a = 0; a < 32; a++) {
    for (const r of [JAR_RADIUS, JAR_RADIUS * 0.5]) {
      BODY.push(new Vector3(Math.cos((a / 32) * 2 * Math.PI) * r, y, Math.sin((a / 32) * 2 * Math.PI) * r));
    }
  }
}

/** Does any point of jar `a` fall inside jar `b`? */
function intrudes(a, b) {
  const toB = matrix(b).invert().multiply(matrix(a));
  const v = new Vector3();
  return BODY.some((pt) => {
    v.copy(pt).applyMatrix4(toB);
    return v.y >= 0 && v.y <= JAR_HEIGHT && Math.hypot(v.x, v.z) < JAR_RADIUS;
  });
}

test("the two jars never pass through each other, on any screen, at any scroll position", () => {
  const hits = [];
  for (const aspect of ASPECTS) {
    for (let i = 0; i <= STEPS; i++) {
      const p = i / STEPS;
      const { hero, companion } = posed(p, aspect);
      if (intrudes(companion, hero) || intrudes(hero, companion)) hits.push(`aspect ${aspect} at ${p.toFixed(4)}`);
    }
  }
  assert.deepEqual(hits.slice(0, 10), [], `${hits.length} overlapping poses`);
});

test("the solver keeps the axes two radii apart plus air everywhere", () => {
  let closest = Infinity;
  for (const aspect of ASPECTS) {
    for (let i = 0; i <= STEPS; i++) {
      const { hero, companion } = posed(i / STEPS, aspect);
      closest = Math.min(closest, jarAxisGap(hero, companion));
    }
  }
  assert.ok(closest >= 2 * JAR_RADIUS, `closest axes ${closest.toFixed(4)} m`);
});

test("the overlap check catches jars inside each other, and the solver clears them", () => {
  const hero = [0, 1, 0, 0.1, 0.4, -0.08];
  // Georges 3 cm off Fayez, tilted the other way: well inside it.
  const inside = [0.03, 1.02, 0.01, -0.12, -0.6, 0.1];
  assert.ok(intrudes(inside, hero) || intrudes(hero, inside));
  const cleared = keepApart(hero, inside);
  assert.ok(!intrudes(cleared, hero) && !intrudes(hero, cleared));
  assert.equal(cleared[1], inside[1], "pushed sideways only");
});
