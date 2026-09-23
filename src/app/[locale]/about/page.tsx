import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KineticHeading } from "@/components/KineticHeading";
import { getDict, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: getDict(locale).about.title };
}

export default async function AboutPage({
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
      <p className="m-intro-item u-mono text-ochre">{t.about.kicker}</p>
      <KineticHeading
        as="h1"
        text={t.about.title}
        className="u-display mt-4 text-[length:var(--step-4)] text-cream"
      />

      <div className="mt-16 flex flex-col gap-16">
        {t.about.sections.map((section, i) => (
          <section
            key={section.title}
            style={{ ["--i" as string]: i }}
            className="m-rise max-w-[46rem] border-t border-[var(--rule)] pt-10"
          >
            <h2 className="u-display text-[length:var(--step-2)] text-cream">
              {section.title}
            </h2>
            <p className="u-measure mt-5 leading-relaxed text-[var(--text-muted)]">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <p className="m-rise u-display mt-16 max-w-[46rem] text-[length:var(--step-2)] text-cream">
        {t.about.closing}
      </p>
    </main>
  );
}
