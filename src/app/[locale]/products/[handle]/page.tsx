import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductCard } from "@/components/ProductCard";
import { AddToCart } from "@/components/AddToCart";
import { KineticHeading } from "@/components/KineticHeading";
import { liveProducts, fromPriceCents, formatUSD, SHIPS_TO } from "@/lib/catalog";
import { descriptionFor, specFor } from "@/lib/catalog.fr";
import { getDict, isLocale, localePath, LOCALES } from "@/lib/i18n";
import { REGION_COOKIE, isRegion, maybePriceForRegion, type Region } from "@/lib/region";

/** Only active products get a page. Drafts 404 rather than leaking. */
export function generateStaticParams() {
  return LOCALES.flatMap((locale) =>
    liveProducts.map((p) => ({ locale, handle: p.handle })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}): Promise<Metadata> {
  const { locale, handle } = await params;
  const product = liveProducts.find((p) => p.handle === handle);
  if (!product || !isLocale(locale)) return { title: "Not found" };

  return {
    title: product.name,
    description: descriptionFor(product, locale),
    openGraph: {
      title: `${product.name} · Zuruny`,
      description: product.pullQuote ?? descriptionFor(product, locale),
      images: product.images.length ? [product.images[0].src] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ locale: string; handle: string }>;
}) {
  const { locale, handle } = await params;
  if (!isLocale(locale)) notFound();

  const product = liveProducts.find((p) => p.handle === handle);
  if (!product) notFound();

  const t = getDict(locale);
  const cookieRegion = (await cookies()).get(REGION_COOKIE)?.value;
  const region: Region = isRegion(cookieRegion) ? cookieRegion : "INTL";

  const price = maybePriceForRegion(fromPriceCents(product), region);
  const spec = specFor(product, locale);
  const related = liveProducts
    .filter((p) => p.handle !== product.handle)
    .slice(0, 4);

  return (
    <main id="main" className="pt-48 sm:pt-40 lg:pt-36">
      <nav
        aria-label={t.a11y.breadcrumb}
        className="u-mono px-[var(--gutter)] py-6 text-[var(--text-faint)]"
      >
        <Link
          href={localePath(locale, "/shop")}
          className="transition-colors hover:text-cream"
        >
          {t.nav.shop}
        </Link>
        <span aria-hidden className="mx-3">
          /
        </span>
        <span className="text-[var(--text-muted)]">{t.kinds[product.kind]}</span>
      </nav>

      <div className="grid gap-x-[clamp(2rem,6vw,6rem)] gap-y-14 px-[var(--gutter)] lg:grid-cols-2">
        <div className="m-intro-item lg:sticky lg:top-36 lg:self-start">
          <ProductGallery product={product} />
        </div>

        <div>
          <p className="m-intro-item u-mono text-ochre">
            {t.kinds[product.kind]}
            {product.namedAfterFrom &&
              ` · ${t.names.from(product.namedAfterFrom).toLowerCase()}`}
          </p>

          <KineticHeading
            as="h1"
            text={product.name}
            className="u-display mt-4 text-[length:var(--step-4)] text-cream"
          />

          <p className="m-intro-item u-display mt-6 text-[length:var(--step-2)] text-cream">
            {price === null ? (
              <span className="text-[var(--text-faint)]">
                {t.product.priceToCome}
              </span>
            ) : (
              formatUSD(price)
            )}
          </p>

          <p className="m-intro-item u-measure mt-8 leading-relaxed text-[var(--text-muted)]">
            {descriptionFor(product, locale)}
          </p>

          <div className="m-intro-item mt-12">
            <AddToCart product={product} />
          </div>

          {spec.length > 0 && (
            <dl className="m-rise mt-14 grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2">
              {spec.map((s) => (
                <div key={s.label} className="bg-ground px-5 py-4">
                  <dt className="u-mono text-[var(--text-faint)]">{s.label}</dt>
                  <dd className="mt-1 text-cream">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <p className="m-rise u-mono mt-8 text-[var(--text-faint)]">
            {t.product.shipsFrom(SHIPS_TO.length)}
          </p>
        </div>
      </div>

      {product.memory && (
        <section className="mt-[clamp(5rem,12vh,9rem)] border-t border-[var(--rule)] px-[var(--gutter)] py-[clamp(4rem,10vh,7rem)]">
          <p className="m-rise u-mono text-ochre">{t.names.whyThisName}</p>
          {/* The founder's own words. Set large, never trimmed, never
              translated by us. */}
          <blockquote
            lang="en"
            className="m-rise u-memory mt-8 max-w-[46rem] text-[length:var(--step-2)]"
          >
            {product.memory}
          </blockquote>
          {locale !== "en" && (
            <p className="m-rise u-mono mt-6 text-[var(--text-faint)]">
              {t.names.inHerWords}
            </p>
          )}
          {product.namedAfterFrom && (
            <p className="m-rise u-mono mt-8 text-[var(--text-muted)]">
              {product.name} &middot;{" "}
              {t.names.from(product.namedAfterFrom).toLowerCase()}
            </p>
          )}
        </section>
      )}

      <section className="border-t border-[var(--rule)] px-[var(--gutter)] py-[clamp(4rem,10vh,7rem)]">
        <h2 className="m-rise u-display text-[length:var(--step-3)] text-cream">
          {t.product.theRestOfIt}
        </h2>
        <ul className="m-seq mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4">
          {related.map((p, i) => (
            <li key={p.handle} style={{ ["--i" as string]: i }}>
              <ProductCard product={p} locale={locale} region={region} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
