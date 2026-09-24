import Image from "next/image";
import Link from "next/link";
import type { LebanonOrigin } from "@/data/lebanon-origins";
import type { Product } from "@/lib/catalog";
import { localePath, type Locale } from "@/lib/i18n";
import { originCopy } from "./copy";
import styles from "./origins.module.css";

export function OriginPanel({ origin, product, locale, onView }: {
  origin?: LebanonOrigin; product?: Product; locale: Locale; onView: (handle: string) => void;
}) {
  const copy = originCopy[locale];
  const photo = product?.images[0];
  return <aside className={styles.panel} aria-label={copy.list}>
    <div aria-live="polite" aria-atomic="true">
      {origin ? <div key={origin.id} className={styles.panelContent}>
        <p className={styles.label}>{origin.region}</p>
        <h3>{origin.name}</h3>
        <p className={styles.productName}>{product?.name ?? origin.product}</p>
        <p className={styles.coordinates} aria-label={copy.coordinates}>{origin.lat.toFixed(4)}° N &nbsp; {origin.lng.toFixed(4)}° E</p>
        <div className={styles.story}>
          {(photo || origin.image) && <div className={styles.photo}><Image
            src={photo?.src ?? origin.image!} alt={photo?.alt ?? origin.product}
            fill sizes="(min-width: 1024px) 120px, 96px"
            className={photo ? styles.productPhoto : styles.originPhoto}
          /></div>}
          <p lang={locale === "fr" && !product?.descriptionFr ? "en" : undefined}>
            {product ? (locale === "fr" ? product.descriptionFr ?? product.description : product.description) : origin.note}
          </p>
        </div>
        {product && <dl className={styles.facts}>{product.spec.filter((fact) => ["Variety", "Harvest", "Altitude", "Made from"].includes(fact.label)).map((fact) =>
          <div key={fact.label}><dt>{locale === "fr" ? fact.labelFr ?? fact.label : fact.label}</dt><dd>{locale === "fr" ? fact.valueFr ?? fact.value : fact.value}</dd></div>
        )}</dl>}
      </div> : <div className={styles.empty}>
        <span aria-hidden="true" className={styles.emptyMark}>✳</span>
        <h3>{copy.choose}</h3><p>{copy.hint}</p>
      </div>}
    </div>
    {origin && (product ? <div className={styles.actions}>
      <a href={origin.href} className={styles.view} onClick={(event) => { event.preventDefault(); onView(product.handle); }}>
        {product.kind === "olive-oil" ? copy.oil : copy.product}<span aria-hidden="true">↓</span>
      </a>
      <Link className={styles.details} href={localePath(locale, `/products/${product.handle}`)}>{copy.details} <span aria-hidden="true">↗</span></Link>
    </div> : <p className={styles.unlisted}>{copy.unlisted}</p>)}
  </aside>;
}
