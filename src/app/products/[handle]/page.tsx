import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductCard } from "@/components/ProductCard";
import { AddToCart } from "@/components/AddToCart";
import { KineticHeading } from "@/components/KineticHeading";
import {
  liveProducts,
  fromPriceCents,
  formatUSD,
  KIND_LABEL,
  SHIPS_TO,
} from "@/lib/catalog";

/** Only active products get a page. Drafts 404 rather than leaking. */
export function generateStaticParams() {
  return liveProducts.map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = liveProducts.find((p) => p.handle === handle);
  if (!product) return { title: "Not found" };

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      title: `${product.name} · Zuruny`,
      description: product.pullQuote ?? product.description,
      images: product.images.length ? [product.images[0].src] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = liveProducts.find((p) => p.handle === handle);
  if (!product) notFound();

  const price = fromPriceCents(product);
  const related = liveProducts
    .filter((p) => p.handle !== product.handle)
    .slice(0, 3);

  return (
    <main id="main" className="pt-28">
      <nav
        aria-label="Breadcrumb"
        className="u-mono px-[var(--gutter)] py-6 text-[var(--text-faint)]"
      >
        <Link href="/shop" className="transition-colors hover:text-cream">
          Shop
        </Link>
        <span aria-hidden className="mx-3">
          /
        </span>
        <span className="text-[var(--text-muted)]">
          {KIND_LABEL[product.kind]}
        </span>
      </nav>

      <div className="grid gap-x-[clamp(2rem,6vw,6rem)] gap-y-14 px-[var(--gutter)] lg:grid-cols-2">
        <div className="m-intro-item lg:sticky lg:top-28 lg:self-start">
          <ProductGallery product={product} />
        </div>

        <div>
          <p className="m-intro-item u-mono text-ochre">
            {KIND_LABEL[product.kind]}
            {product.namedAfterFrom && ` · from ${product.namedAfterFrom}`}
          </p>

          <KineticHeading
            as="h1"
            text={product.name}
            className="u-display mt-4 text-[length:var(--step-4)] text-cream"
          />

          <p className="m-intro-item u-display mt-6 text-[length:var(--step-2)] text-cream">
            {price === null ? (
              <span className="text-[var(--text-faint)]">Price to come</span>
            ) : (
              formatUSD(price)
            )}
          </p>

          <p className="m-intro-item u-measure mt-8 leading-relaxed text-[var(--text-muted)]">
            {product.description}
          </p>

          <div className="m-intro-item mt-12">
            <AddToCart product={product} />
          </div>

          {product.spec.length > 0 && (
            <dl className="m-rise mt-14 grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2">
              {product.spec.map((s) => (
                <div key={s.label} className="bg-ground px-5 py-4">
                  <dt className="u-mono text-[var(--text-faint)]">{s.label}</dt>
                  <dd className="mt-1 text-cream">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          <p className="m-rise u-mono mt-8 text-[var(--text-faint)]">
            Ships from Beirut to {SHIPS_TO.length} countries
          </p>
        </div>
      </div>

      {product.memory && (
        <section className="mt-[clamp(5rem,12vh,9rem)] border-t border-[var(--rule)] px-[var(--gutter)] py-[clamp(4rem,10vh,7rem)]">
          <p className="m-rise u-mono text-ochre">
            Why it carries this name
          </p>
          {/* The founder's own words. Set large, never trimmed. */}
          <blockquote className="m-rise u-memory mt-8 max-w-[46rem] text-[length:var(--step-2)]">
            {product.memory}
          </blockquote>
          {product.namedAfterFrom && (
            <p className="m-rise u-mono mt-8 text-[var(--text-muted)]">
              {product.name} &middot; from {product.namedAfterFrom}
            </p>
          )}
        </section>
      )}

      <section className="border-t border-[var(--rule)] px-[var(--gutter)] py-[clamp(4rem,10vh,7rem)]">
        <h2 className="m-rise u-display text-[length:var(--step-3)] text-cream">
          The rest of it
        </h2>
        <ul className="m-seq mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {related.map((p, i) => (
            <li key={p.handle} style={{ ["--i" as string]: i }}>
              <ProductCard product={p} />
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
