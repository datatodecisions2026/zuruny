import type { SpecItem } from "@/lib/catalog";
import type { NameChapter } from "@/lib/chapters";

// The chapter list itself, and each chapter's book images, now live in the
// database — see src/lib/chapters.ts (getChapters) and the admin's Names
// page. What stays here is layout: turning a chapter's memory text and spec
// into pages.

export type JournalPageData = {
  kind: "dedication" | "story" | "origin" | "product" | "reflection";
  text?: string;
  facts?: SpecItem[];
  continuation?: boolean;
};

/** Keep every character of the founder's writing; split only at spaces. */
export function splitMemory(memory: string, limit = 80): string[] {
  if (!memory) return [];
  const words = memory.split(" ");
  const parts: string[] = [];
  while (words.length) {
    let end = Math.min(limit, words.length);
    if (end < words.length) {
      const sentenceEnd = words.slice(Math.floor(limit / 2), end).findLastIndex((word) => /[.!?][”"']?$/.test(word));
      if (sentenceEnd >= 0) end = Math.floor(limit / 2) + sentenceEnd + 1;
    }
    parts.push(words.splice(0, end).join(" "));
  }
  return parts;
}

export function journalPages(chapter: NameChapter): JournalPageData[] {
  const pages: JournalPageData[] = [
    { kind: "dedication" },
    ...splitMemory(chapter.product.memory ?? "").map((text, i) => ({ kind: "story" as const, text, continuation: i > 0 })),
  ];
  for (let i = 0; i < chapter.product.spec.length; i += 4) {
    pages.push({ kind: "origin", facts: chapter.product.spec.slice(i, i + 4), continuation: i > 0 });
  }
  pages.push({ kind: "product" });
  if (pages.length % 2) pages.push({ kind: "reflection" });
  return pages;
}

// One unit per leaf/spread: a reading hold followed by a turn. Index seeks use these too.
export const JOURNAL_TURN = { hold: 0.62, duration: 0.38 } as const;
export function journalStops(count: number): number[] {
  return Array.from({ length: count }, (_, index) => index);
}
