import Image from "next/image";
import Link from "next/link";
import type { JournalPageData, NameChapter } from "@/data/namesJournal";
import { journalCopy } from "@/data/namesJournalCopy";
import type { ProductImage } from "@/lib/catalog";
import { descriptionFor, specFor } from "@/lib/catalog.fr";
import { getDict, localePath, type Locale } from "@/lib/i18n";
import styles from "./journal.module.css";

export function Emblem() {
  return <span className={styles.emblem} aria-hidden="true" />;
}

export function Ornament({ variant = "divider" }: { variant?: "divider" | "olive 1" | "olive 2" }) {
  return <Image className={variant === "divider" ? styles.divider : styles.botanical} src={`/names/journal/${variant}.webp`} alt="" width={variant === "divider" ? 734 : 730} height={variant === "divider" ? 273 : 450} sizes="(min-width: 1024px) 240px, 180px" />;
}

function Photo({ image, caption, small = false }: { image: ProductImage; caption: string; small?: boolean }) {
  return (
    <figure className={`${styles.figure} ${small ? styles.smallFigure : ""}`}>
      <div className={styles.photo}>
        <Image src={image.src} alt={image.alt} width={image.w} height={image.h} sizes="(min-width: 1024px) 36vw, 88vw" />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}

export function JournalPage({ chapter, page, number, locale }: {
  chapter: NameChapter; page: JournalPageData; number: number; locale: Locale;
}) {
  const copy = journalCopy[locale];
  const t = getDict(locale);
  const { product, assets } = chapter;
  const index = String(chapter.number).padStart(2, "0");
  const heading = `${chapter.slug}-${number}`;
  const photo = assets.product ?? product.images[0];
  return (
    <section className={styles.leaf} data-leaf data-chapter={chapter.slug} data-kind={page.kind} aria-labelledby={heading}>
      <div className={styles.leafFront}>
        <div className={styles.runningHead}><span>Zuruny</span><span>{copy.chapter} {index}</span></div>
        <div className={`${styles.pageContent} ${styles[page.kind]}`}>
          {page.kind === "dedication" && <>
            <p className={styles.label}>{copy.chapter} <span className={styles.chapterNumeral}>{index}</span></p>
            <h2 id={heading} tabIndex={-1}>{product.name}</h2>
            <Ornament />
            {product.namedAfterFrom && <p className={styles.roots}><span>{copy.personFrom}</span>{product.namedAfterFrom}</p>}
            {assets.portrait ? <Photo image={assets.portrait} caption={copy.archive} small /> :
              <p className={styles.dedicationQuote} lang="en">“{product.pullQuote}”</p>}
            <p className={styles.label}>{t.kinds[product.kind]}</p>
          </>}
          {page.kind === "story" && <>
            <h3 id={heading} className={styles.label}>{page.continuation ? copy.continued : copy.memory}</h3>
            <blockquote lang="en" className={styles.memory}>{page.text}</blockquote>
            {page.continuation ? <>
              <a className={styles.artworkLink} href={assets.dedication.src}>{copy.original} <span aria-hidden="true">↗</span></a>
              {locale === "fr" && <p className={styles.languageNote}>{t.names.inHerWords}</p>}
            </> : <span className={styles.storyRule} aria-hidden="true" />}
          </>}
          {page.kind === "origin" && <>
            <p className={styles.label}>{copy.record}</p>
            <h3 id={heading}>{page.continuation ? t.kinds[product.kind] : copy.origin}</h3>
            {!page.continuation && <p className={styles.description}>{descriptionFor(product, locale)}</p>}
            <dl className={styles.fieldNotes}>
              {specFor({ ...product, spec: page.facts ?? [] }, locale).map((fact) => <div key={fact.label}><dt>{fact.label}</dt><dd>{fact.value}</dd></div>)}
            </dl>
            {page.continuation && (assets.place || assets.details?.[0]) && <Photo image={(assets.place ?? assets.details![0])} caption={copy.photo} small />}
          </>}
          {page.kind === "product" && <>
            <p className={styles.label}>{copy.collection}</p>
            <h3 id={heading}>{product.name}</h3>
            {photo && <Photo image={photo} caption={t.kinds[product.kind]} />}
            {chapter.productHandle ? <Link className={styles.productLink} href={localePath(locale, `/products/${chapter.productHandle}`)}>{copy.view} {product.name} <span aria-hidden="true">↗</span></Link> : <p className={styles.label}>{t.product.notYetReleased}</p>}
          </>}
          {page.kind === "reflection" && <>
            <h3 id={heading} className={styles.label}>{copy.archive}</h3>
            {assets.place || assets.details?.[0] ? <Photo image={(assets.details?.[0] ?? assets.place!)} caption={copy.photo} /> : <Ornament variant={chapter.number % 2 ? "olive 1" : "olive 2"} />}
            {product.pullQuote && <blockquote className={styles.reflectionQuote} lang="en">“{product.pullQuote}”</blockquote>}
          </>}
        </div>
        <div className={styles.folio}><span>{product.name}</span><span>{String(number).padStart(2, "0")}</span></div>
      </div>
      <div className={styles.leafBack} aria-hidden="true"><Emblem /></div>
    </section>
  );
}
