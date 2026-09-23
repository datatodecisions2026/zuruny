import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDict, isLocale } from "@/lib/i18n";

/**
 * The brief names three artisans and nothing else about them — no craft, no
 * photograph, no bio. Rather than invent any of that, each entry is honest
 * about the gap, the same way the catalogue marks an unpriced product as
 * "price to come" instead of guessing a number.
 */
const ARTISAN_NAMES = [
  "Jihad Samia",
  "Christopher Ghoussoub",
  "Omar Gabriel",
] as const;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDict(locale).artisans.title };
}

export default async function ArtisansPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = getDict(locale);

  return (
    <main
      id="main"
      className="min-h-[70svh] px-[var(--gutter)] pb-[clamp(4rem,10vh,8rem)] pt-52 sm:pt-44 lg:pt-40"
    >
      <h1 className="m-intro-item u-display text-[length:var(--step-4)] text-cream">
        {t.artisans.title}
      </h1>
      <p className="m-intro-item u-measure mt-6 text-[length:var(--step-1)] leading-relaxed text-[var(--text-muted)]">
        {t.artisans.sub}
      </p>

      <ul className="m-seq mt-16 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
        {ARTISAN_NAMES.map((name, i) => (
          <li
            key={name}
            style={{ ["--i" as string]: i }}
            className="border-t border-[var(--rule)] pt-6"
          >
            <p className="u-display text-[length:var(--step-2)] text-cream">
              {name}
            </p>
            <p className="u-mono mt-2 text-[var(--text-faint)]">
              {t.artisans.bioComingSoon}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
