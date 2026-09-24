import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { products } from "../src/lib/catalog.ts";
import { buildChapters, chapterAssets, journalPages, journalStops, splitMemory } from "../src/data/namesJournal.ts";

const live = products.filter((product) => product.status === "active");

test("the requested archive order preserves product kinds and separates family and production origins", () => {
  const chapters = buildChapters(live, products);
  assert.deepEqual(chapters.map((c) => c.slug), ["georges", "fayez", "malvina", "em-ramiz", "najibe"]);
  assert.equal(chapters[0].product.kind, "carob-molasses");
  assert.equal(chapters[1].product.kind, "grape-molasses");
  assert.equal(chapters[2].product.namedAfterFrom, "Achrafieh");
  assert.equal(chapters[2].product.spec[0].value, "Deir Mimas, South Lebanon");
});

test("live catalogue edits win; archive-only chapters never gain a purchase link", () => {
  const edited = live.map((p) => p.name === "Georges" ? { ...p, memory: "A revised memory." } : p);
  const chapters = buildChapters(edited, products);
  assert.equal(chapters[0].product.memory, "A revised memory.");
  assert.equal(chapters[0].productHandle, "georges-br-carob-molasses");
  assert.equal(chapters.at(-1).productHandle, undefined);
  assert.equal(products.find((p) => p.handle === "najibe").status, "draft");
  const withdrawn = buildChapters(live.filter((p) => p.name !== "Georges"), products);
  assert.equal(withdrawn.some((c) => c.slug === "georges"), false);
});

test("pagination retains every word of every memory and every origin fact", () => {
  for (const chapter of buildChapters(live, products)) {
    const pages = journalPages(chapter);
    assert.equal(pages.length % 2, 0, "chapters start on a fresh spread");
    assert.equal(pages.filter((p) => p.kind === "story").map((p) => p.text).join(" "), chapter.product.memory);
    assert.deepEqual(pages.filter((p) => p.kind === "origin").flatMap((p) => p.facts), chapter.product.spec);
    assert.equal(pages[0].kind, "dedication");
    assert.ok(pages.some((p) => p.kind === "product"));
  }
  assert.deepEqual(splitMemory(""), []);
  assert.deepEqual(splitMemory("One short memory."), ["One short memory."]);
});

test("every mapped asset exists, including Unicode filenames", () => {
  for (const assets of Object.values(chapterAssets)) {
    for (const asset of Object.values(assets).flat()) {
      if (asset) assert.ok(existsSync(`public${asset.src}`), asset.src);
    }
  }
});

test("chapter seek positions use the same stops as the reversible master timeline", () => {
  for (const count of [3, 12, 32]) {
    const stops = journalStops(count);
    assert.equal(stops.length, count);
    assert.equal(stops[0], 0);
    assert.equal(stops.at(-1), count - 1);
    assert.deepEqual([...stops].reverse().reverse(), stops);
    assert.ok(stops.every((s, i) => i === 0 || s > stops[i - 1]));
  }
});
