import Image from "next/image";
import Link from "next/link";
import { KineticHeading } from "@/components/KineticHeading";
import {
  fromPriceCents,
  isBuyable,
  unbuyableReason,
  formatUSD,
  type Product,
} from "@/lib/catalog";
import { getDict, localePath, type Locale } from "@/lib/i18n";
import { descriptionFor, specFor } from "@/lib/catalog.fr";
import { maybePriceForRegion, type Region } from "@/lib/region";

/**
 * The spine of the site.
 *
 * The rejected build had story sections and product sections. But every named
 * jar *is* a person, so this refuses the split: one entry per name, carrying
 * the memory and the price in the same object. Commerce and story stop
 * competing for the scroll.
 *
 * Each entry is one screen. Nothing pins, nothing hijacks.
 */
export function RollCall({
  locale,
  region,
  products,
}: {
  locale: Locale;
  region: Region;
  products: Product[];
}) {
  const t = getDict(locale);

  return (
    <section id="names" className="scroll-mt-24">
      <header className="px-[var(--gutter)] pb-16 pt-8">
        <h2 className="m-rise u-display text-[length:var(--step-3)] text-cream">
          {t.names.title}
        </h2>
        <p className="m-rise u-measure mt-5 text-[var(--text-muted)]">
          {t.names.sub}
        </p>
      </header>

      <ol>
        {products.map((product, i) => (
          <li key={product.handle}>
            <NameEntry
              product={product}
              index={i}
              flip={i % 2 === 1}
              locale={locale}
              region={region}
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

function NameEntry({
  product,
  index,
  flip,
  locale,
  region,
}: {
  product: Product;
  index: number;
  flip: boolean;
  locale: Locale;
  region: Region;
}) {
  const t = getDict(locale);
  const price = maybePriceForRegion(fromPriceCents(product), region);
  const buyable = isBuyable(product);
  const reason = unbuyableReason(product);

  return (
    <article className="border-t border-[var(--rule)] px-[var(--gutter)] py-[clamp(4rem,10vh,8rem)]">
      <div className="mb-10 flex items-baseline gap-5">
        <span className="u-mono text-[var(--text-faint)]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="u-mono text-[var(--text-muted)]">
          {t.kinds[product.kind]}
        </span>
      </div>

      <div
        className={`grid items-stretch gap-x-[clamp(2rem,6vw,6rem)] gap-y-12 lg:grid-cols-2 ${
          flip ? "lg:[&>*:first-child]:order-2" : ""
        }`}
      >
        <Media product={product} locale={locale} />

        <div>
          <KineticHeading
            as="h3"
            mode="scroll"
            text={product.name}
            className="u-display text-[length:var(--step-4)] text-cream"
          />

          {product.namedAfterFrom && (
            <p className="m-rise u-mono mt-4 text-ochre">
              {t.names.from(product.namedAfterFrom)}
            </p>
          )}

          {product.memory && (
            <div className="m-rise mt-10 border-l border-[var(--rule-strong)] pl-6">
              <blockquote className="u-memory u-measure" lang="en">
                {product.memory}
              </blockquote>
              {/* Her words, not ours. Flagged when the rest of the page is
                  French so the switch of language is explained, not jarring. */}
              {locale !== "en" && (
                <p className="u-mono mt-4 text-[var(--text-faint)]">
                  {t.names.inHerWords}
                </p>
              )}
            </div>
          )}

          <p className="m-rise u-measure mt-10 text-[var(--text-muted)]">
            {descriptionFor(product, locale)}
          </p>

          {product.spec.length > 0 && (
            <dl className="m-rise mt-10 grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2">
              {specFor(product, locale).map((s) => (
                <div key={s.label} className="bg-ground px-5 py-4">
                  <dt className="u-mono text-[var(--text-faint)]">{s.label}</dt>
                  <dd className="mt-1 text-cream">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <Buy
            price={price}
            buyable={buyable}
            reason={reason}
            handle={product.handle}
            name={product.name}
            locale={locale}
          />
        </div>
      </div>
    </article>
  );
}

function Media({ product, locale }: { product: Product; locale: Locale }) {
  const t = getDict(locale);
  const [hero] = product.images;

  /* An honest empty state. The brief forbids substituting stock or unrelated
     photography, so the gap is filled with the thing this brand actually has
     more of than anyone else: the writing. Oxblood panel, damask at 7% (the
     one contained block it is fit for), the pull quote set large. */
  if (!hero) {
    return (
      <figure className="relative isolate flex h-full min-h-[26rem] flex-col justify-between overflow-hidden bg-oxblood p-8 lg:min-h-[34rem] lg:p-12">
        <div className="u-damask absolute inset-0 -z-10" aria-hidden />

        <span
          aria-hidden
          className="u-emblem block size-10 text-ochre/70"
          style={{ ["--emblem-src" as string]: "url(/brand/emblem.png)" }}
        />

        {product.pullQuote && (
          <blockquote className="m-rise u-display text-[length:var(--step-2)] text-cream">
            &ldquo;{product.pullQuote}&rdquo;
          </blockquote>
        )}

        <figcaption className="u-mono text-cream/55">
          {t.product.photographyInProgress}
        </figcaption>
      </figure>
    );
  }

  return (
    <figure className="m-wipe m-slide self-start" style={{ ["--from-x" as string]: "-3rem" }}>
      <div className="relative aspect-[4/5] overflow-hidden bg-ground-2">
        <Image
          src={hero.src}
          alt={hero.alt}
          fill
          sizes="(min-width: 1024px) 46vw, 100vw"
          className="m-zoom object-cover"
          style={{ ["--drift" as string]: "6%" }}
        />
      </div>

      {product.pullQuote && (
        <figcaption className="u-display mt-6 text-[length:var(--step-1)] text-ochre">
          &ldquo;{product.pullQuote}&rdquo;
        </figcaption>
      )}
    </figure>
  );
}

/**
 * The roll call sells by sending people to the product page, where the real
 * basket lives. It never offers to take money it cannot take: a product with
 * no price, or none in stock, says so instead of showing a buy action.
 */
function Buy({
  price,
  buyable,
  reason,
  handle,
  name,
  locale,
}: {
  price: number | null;
  buyable: boolean;
  reason: ReturnType<typeof unbuyableReason>;
  handle: string;
  name: string;
  locale: Locale;
}) {
  const t = getDict(locale);

  return (
    <div className="m-rise mt-12 flex flex-wrap items-center gap-x-8 gap-y-4 border-t border-[var(--rule)] pt-8">
      <p className="u-display text-[length:var(--step-2)] text-cream">
        {price === null ? (
          <span className="text-[var(--text-faint)]">{t.product.priceToCome}</span>
        ) : (
          formatUSD(price)
        )}
      </p>

      {buyable ? (
        <Link
          href={localePath(locale, `/products/${handle}`)}
          className="group u-mono inline-flex items-center gap-3 bg-cream px-7 py-4 text-ground transition-colors duration-300 hover:bg-ochre"
        >
          {t.product.buy(name)}
          <span
            aria-hidden
            className="transition-transform duration-300 ease-[var(--ease-out-soft)] group-hover:translate-x-1"
          >
            &rarr;
          </span>
        </Link>
      ) : (
        <Link
          href={localePath(locale, `/products/${handle}`)}
          className="u-mono border border-[var(--rule-strong)] px-7 py-4 text-[var(--text-muted)] transition-colors duration-300 hover:border-ochre hover:text-ochre"
        >
          {reason === "no-price" ? t.product.notYetReleased : t.product.outOfStock}
        </Link>
      )}
    </div>
  );
}
