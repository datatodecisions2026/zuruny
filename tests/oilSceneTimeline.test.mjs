import assert from "node:assert/strict";
import test from "node:test";
import {
  LAND,
  RELEASE,
  dropState,
  itemFall,
  jarExit,
  jarTilt,
  splashGrow,
} from "../src/data/oilSceneTimeline.ts";

test("the drop swells at the lip, lets go early, and falls until it lands", () => {
  assert.equal(dropState(0).visible, false);
  assert.equal(dropState(RELEASE).fall, 0);
  let last = 0;
  for (let p = RELEASE; p < LAND; p += 0.01) {
    const { visible, fall } = dropState(p);
    assert.ok(visible && fall >= last);
    last = fall;
  }
  assert.equal(dropState(LAND).visible, false);
  assert.equal(dropState(LAND - 1e-9).fall.toFixed(6), "1.000000");
});

test("the jar leaves once the drop does, and the splash waits for the landing", () => {
  assert.equal(jarTilt(1), 1);
  assert.equal(jarExit(RELEASE), 0);
  assert.equal(jarExit(0.5), 1);
  assert.equal(splashGrow(LAND - 0.01), 0);
  assert.equal(splashGrow(1), 1);
});

test("falling items cross the camera on cue, land, bounce, then rest", () => {
  // Crosses at 0.5 while 0.3 above rest, falling 1.5/unit → lands at 0.7.
  assert.equal(itemFall(0.5, 0.5, 0.3, 1.5).height, 0.3);
  assert.ok(itemFall(0.2, 0.5, 0.3, 1.5).height > 0.3);
  assert.equal(itemFall(0.7, 0.5, 0.3, 1.5).height, 0);
  assert.equal(itemFall(0.7, 0.5, 0.3, 1.5).drift, 1);
  assert.ok(itemFall(0.72, 0.5, 0.3, 1.5).bounce > 0);
  assert.equal(itemFall(1, 0.5, 0.3, 1.5).bounce, 0);
});
