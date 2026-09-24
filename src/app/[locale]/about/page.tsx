import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { KineticHeading } from "@/components/KineticHeading";
import { getDict, isLocale } from "@/lib/i18n";
import { CompanyFilm } from "@/components/about/CompanyFilm";
import { PotteryBackground } from "@/components/about/PotteryBackground";
import { aboutFilmCopy } from "@/components/about/copy";
import styles from "@/components/about/about.module.css";

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
  const copy = aboutFilmCopy[locale];

  return (
    <main id="main">
      <section className={styles.hero} aria-labelledby="about-title">
        <PotteryBackground copy={copy} />
        <div className={styles.heroGrid}>
          <div className={styles.intro}>
            <p className="m-intro-item u-mono text-ochre">{t.about.kicker}</p>
            <div id="about-title">
              <KineticHeading
                as="h1"
                text={t.about.title}
                className="u-display mt-4 text-[length:var(--step-4)] text-cream"
              />
            </div>
            <div className={styles.invitation}>
              <p className="u-mono text-ochre">{copy.eyebrow}</p>
              <h2 className="u-display">{copy.title}</h2>
              <p className={styles.description}>{copy.description}</p>
              <p className={styles.prompt}>{copy.invitation}</p>
            </div>
          </div>
          <CompanyFilm copy={copy} />
        </div>
      </section>

      <div className={styles.stories}>
        {t.about.sections.map((section, i) => (
          <section
            key={section.title}
            style={{ ["--i" as string]: i }}
            className={`m-rise ${styles.story}`}
          >
            <span className={`u-mono ${styles.storyNumber}`} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
            <h2 className="u-display text-[length:var(--step-2)] text-cream">
              {section.title}
            </h2>
            <p className="u-measure mt-5 leading-relaxed text-[var(--text-muted)]">
              {section.body}
            </p>
          </section>
        ))}
      </div>

      <p className={`m-rise u-display text-[length:var(--step-2)] text-cream ${styles.closing}`}>
        {t.about.closing}
      </p>
    </main>
  );
}
