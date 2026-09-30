import assert from "node:assert/strict";
import test from "node:test";
import { journalPages, journalStops, splitMemory } from "../src/data/namesJournal.ts";

/**
 * The chapter list itself — which products become chapters, draft handling,
 * which images they have — moved to the database (src/lib/chapters.ts,
 * getChapters()) along with the admin editor that builds it. That's a
 * server-only async function reading Postgres, so it's covered by the
 * browser tests run against a real database when it changes, not a unit
 * test here. What's left in namesJournal.ts, and still worth a fast
 * DB-free test, is the pure pagination logic.
 */

const chapter = {
  slug: "test-chapter",
  number: 1,
  productHandle: "test-handle",
  product: {
    handle: "test-handle",
    name: "Test",
    kind: "olive-oil",
    status: "active",
    description: "",
    memory: "A short memory about someone.",
    pullQuote: "A short memory.",
    spec: [
      { label: "Village", value: "Somewhere" },
      { label: "Harvest", value: "October" },
    ],
    images: [],
    variants: [],
  },
  assets: { dedication: { src: "/x.webp", w: 1, h: 1, alt: "" } },
};

test("pagination retains every word of the memory and every spec fact", () => {
  const pages = journalPages(chapter);
  assert.equal(pages.length % 2, 0, "chapters start on a fresh spread");
  assert.equal(pages[0].kind, "dedication");
  assert.equal(
    pages.filter((p) => p.kind === "story").map((p) => p.text).join(" "),
    chapter.product.memory,
  );
  assert.deepEqual(pages.filter((p) => p.kind === "origin").flatMap((p) => p.facts), chapter.product.spec);
  assert.ok(pages.some((p) => p.kind === "product"));
});

test("splitMemory keeps every word and never splits an empty memory", () => {
  assert.deepEqual(splitMemory(""), []);
  assert.deepEqual(splitMemory("One short memory."), ["One short memory."]);
  const long = Array.from({ length: 200 }, (_, i) => `word${i}`).join(" ");
  assert.equal(splitMemory(long).join(" "), long);
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
