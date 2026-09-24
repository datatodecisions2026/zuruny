import type { Product, ProductImage, SpecItem } from "@/lib/catalog";

type ArchiveAssets = {
  dedication: ProductImage;
  product?: ProductImage;
  place?: ProductImage;
  portrait?: ProductImage;
  details?: ProductImage[];
};

const asset = (src: string, w: number, h: number, alt: string): ProductImage => ({
  src: `/names/${src}`, w, h, alt,
});

// These are supplied artworks, not evidence of a photograph's geographic origin.
// Dedication facsimiles remain optional references; catalogue memories are the HTML text.
export const chapterAssets: Record<string, ArchiveAssets> = {
  georges: {
    dedication: asset("georges/GEORGES.webp", 1024, 1536, "Georges dedication artwork"),
    product: asset("georges/ChatGPT Image 15 sept. 2026 aĚ 14_11_39.webp", 1214, 1295, "Georges carob molasses jar on burgundy"),
    place: asset("georges/32c78a6de85250d3f40e723703ea3571.webp", 736, 918, "Olive branches above a dry stone wall"),
    details: [asset("georges/ChatGPT Image Sep 5, 2026 at 11_17_34 PM.webp", 1536, 1024, "Fruit and ceramics in a stone window")],
  },
  fayez: {
    dedication: asset("fayez/fayez.webp", 1024, 1536, "Fayez dedication artwork"),
    product: asset("fayez/ChatGPT Image 15 sept. 2026 à 14_13_42.webp", 1215, 1295, "Fayez grape molasses jar on burgundy"),
  },
  malvina: {
    dedication: asset("malvina/MAL texte.webp", 1024, 1536, "Malvina dedication artwork"),
    product: asset("malvina/e917d200-0f39-4a88-825b-0d5fee820b08.webp", 1086, 1448, "Malvina olive oil tins on black"),
    portrait: asset("malvina/6bbc5b43-fe66-4742-b166-40d74124dfbd.webp", 1023, 1537, "Malvina tin beside a family photograph and olive branch"),
    details: [asset("malvina/7b47904a-af4e-4f47-a0b6-f3e4e20f4fde.webp", 1023, 1537, "Malvina tin with a family photograph and carafe")],
  },
  "em-ramiz": {
    dedication: asset("em-ramiz/em ramiz.webp", 1024, 1536, "Em Ramiz dedication artwork, in honor of Alice"),
  },
  najibe: {
    dedication: asset("najibe/najibe.webp", 1024, 1536, "Najibe dedication artwork"),
    product: asset("najibe/najibe 2.webp", 1537, 1023, "A single Najibe olive oil tin on black"),
    place: asset("najibe/55999dca-9b48-48ef-b01d-9eca2c16e12b copy.webp", 1448, 1086, "A figure among olive trees in golden light"),
    portrait: asset("najibe/NAJIBE 1.webp", 1054, 1492, "Najibe portrait in a Lebanese postage stamp design"),
  },
};

const chapterRegistry = [
  { slug: "georges", handle: "georges-br-carob-molasses" },
  { slug: "fayez", handle: "fayez-for-caroub-molasse" },
  { slug: "malvina", handle: "malvina" },
  { slug: "em-ramiz", handle: "em-ramiz" },
  { slug: "najibe", handle: "najibe", archive: true },
];

export type NameChapter = {
  slug: string;
  number: number;
  product: Product;
  productHandle?: string;
  assets: ArchiveAssets;
};

export function buildChapters(live: Product[], archive: Product[]): NameChapter[] {
  return chapterRegistry.flatMap((entry) => {
    const published = live.find((p) => p.handle === entry.handle && p.status === "active");
    // Explicit editorial permission for Najibe does not publish any draft in the shop.
    const product = published ?? (entry.archive ? archive.find((p) => p.handle === entry.handle) : undefined);
    if (!product) return [];
    return [{ slug: entry.slug, number: 0, product, productHandle: published?.handle, assets: chapterAssets[entry.slug] }];
  }).map((chapter, index) => ({ ...chapter, number: index + 1 }));
}

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
