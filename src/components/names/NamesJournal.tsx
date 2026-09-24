import Link from "next/link";
import { journalPages, type NameChapter } from "@/data/namesJournal";
import { journalCopy } from "@/data/namesJournalCopy";
import { getDict, localePath, type Locale } from "@/lib/i18n";
import { JournalExperience } from "./JournalExperience";
import { Emblem, JournalPage, Ornament } from "./JournalPage";
import styles from "./journal.module.css";

export function NamesJournal({ chapters, locale }: { chapters: NameChapter[]; locale: Locale }) {
  const copy = journalCopy[locale];
  const t = getDict(locale);
  let folio = 0;
  return <>
    <header className={styles.intro}>
      <p className={styles.label}><span className={styles.introDash} />{copy.eyebrow} <span>— {String(chapters.length).padStart(2, "0")}</span></p>
      <div className={styles.introRow}>
        <h1>{t.names.title}<span className={styles.titlePeriod}>.</span></h1>
        <p>{copy.intro}</p>
      </div>
      <div className={styles.introFoot}><span>Zuruny · {t.footer.location}</span><a href="#journal-cover">{copy.open} <span aria-hidden="true">↓</span></a></div>
    </header>
    <JournalExperience chapters={chapters.map((c) => ({ slug: c.slug, name: c.product.name, number: c.number }))} locale={locale}>
      <div className={styles.book} data-book>
        <div className={`${styles.spread} ${styles.coverSpread}`} data-spread id="journal-cover">
          <div className={styles.coverSpace} data-desktop-only aria-hidden="true" />
          <section className={`${styles.leaf} ${styles.cover}`} data-leaf data-kind="cover" aria-label={t.names.title}>
            <div className={styles.leafFront}>
              <div className={styles.coverFrame}><Emblem /><span className={styles.label}>Zuruny</span><h2>{t.names.title}</h2><span className={styles.coverRule} /><p>{copy.subtitle}</p><span className={styles.coverBottom}>Beyrouth · Liban</span></div>
            </div>
            <div className={styles.leafBack} aria-hidden="true"><Emblem /></div>
          </section>
        </div>
        {chapters.flatMap((chapter) => {
          const pages = journalPages(chapter);
          return Array.from({ length: pages.length / 2 }, (_, i) => (
            <div className={styles.spread} data-spread data-chapter={chapter.slug} id={i === 0 ? chapter.slug : undefined} key={`${chapter.slug}-${i}`}>
              {pages.slice(i * 2, i * 2 + 2).map((page, side) => <JournalPage chapter={chapter} page={page} number={++folio} locale={locale} key={side} />)}
            </div>
          ));
        })}
        <div className={`${styles.spread} ${styles.closingSpread}`} data-spread>
          <section className={styles.leaf} data-leaf data-kind="closing">
            <div className={styles.leafFront}><div className={styles.closingArt}><Ornament variant="olive 2" /><p className={styles.label}>Zuruny · {copy.eyebrow}</p></div></div>
            <div className={styles.leafBack} aria-hidden="true"><Emblem /></div>
          </section>
          <section className={styles.leaf} data-leaf data-kind="closing">
            <div className={styles.leafFront}><div className={styles.closingPage}><Emblem /><p className={styles.label}>{copy.end}</p><h2>{copy.closing}</h2><Ornament /><Link className={styles.productLink} href={localePath(locale, "/shop")}>{copy.shop} <span aria-hidden="true">↗</span></Link><Link className={styles.artworkLink} href={localePath(locale, "/about")}>{copy.about}</Link></div></div>
            <div className={styles.leafBack} aria-hidden="true"><Emblem /></div>
          </section>
        </div>
      </div>
    </JournalExperience>
    <section id="journal-end" className={styles.continuation} tabIndex={-1}>
      <p className={styles.label}>{copy.end}</p><h2>{copy.closing}</h2>
      <Link href={localePath(locale, "/shop")}>{copy.shop} <span aria-hidden="true">↗</span></Link>
    </section>
  </>;
}
