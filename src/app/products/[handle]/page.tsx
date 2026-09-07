export const revalidate = 300;
import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProduct, getProducts } from "@/lib/catalog";
import BuyPanel from "@/components/shop/BuyPanel";
import TopBar from "@/components/site/TopBar";
import { Quatrefoil } from "@/components/site/Quatrefoil";

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({
  params,
}: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) return { title: "Not found — Zuruny" };
  return {
    title: `${product.name} — Zuruny`,
    description:
      product.description ??
      product.note ??
      `${product.name}, ${product.kind.toLowerCase()} from Zuruny.`,
  };
}

export default async function ProductPage({
  params,
}: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await getProduct(handle);
  if (!product) notFound();

  return (
    <>
      <TopBar />
    <main className="px-6 pb-24 pt-28 sm:px-10 lg:px-16">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/shop"
          className="text-sm tracking-[0.14em] text-char-soft underline decoration-bronze/30 underline-offset-8 transition-colors hover:text-char"
        >
          All products
        </Link>

        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,6fr)_minmax(0,5fr)] lg:gap-16">
          <div className="space-y-4">
            {product.images.length ? (
              product.images.map((src, i) => (
                <div
                  key={src}
                  className="relative aspect-[4/5] w-full overflow-hidden border border-bronze/20 bg-paper-deep"
                >
                  <Image
                    src={src}
                    alt={`${product.name}, view ${i + 1}`}
                    fill
                    priority={i === 0}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    className="object-cover"
                  />
                </div>
              ))
            ) : (
              <div className="flex aspect-[4/5] w-full items-center justify-center border border-bronze/20 bg-paper-deep">
                <Quatrefoil className="h-32 w-32 text-bronze/40" />
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-28 lg:self-start">
            <p className="u-spec text-bronze/80">{product.kind}</p>
            <h1 className="u-display mt-2 text-[clamp(2.25rem,5vw,3.5rem)] text-char">
              {product.name}
            </h1>

            <div className="u-rule my-7" />

            <BuyPanel product={product} />

            {product.description ? (
              <p className="u-measure mt-10 text-char/80">{product.description}</p>
            ) : null}
            {product.note ? (
              <p className="u-measure mt-10 text-char/80">{product.note}</p>
            ) : null}

            {product.spec?.length ? (
              <dl className="u-spec mt-8 border border-bronze/25 bg-paper-deep px-4 py-3 text-char/80">
                {product.spec.map((row) => (
                  <div
                    key={row.label}
                    className="flex justify-between gap-4 border-b border-bronze/15 py-1 last:border-0"
                  >
                    <dt className="text-char-soft">{row.label}</dt>
                    <dd className="text-right text-char">{row.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>

        {product.story ? (
          <section className="mt-24 border-t border-bronze/20 pt-12">
            <h2 className="u-display text-lg text-bronze">
              Why it carries this name
            </h2>
            <blockquote className="u-measure mt-6 text-lg leading-[1.85] text-char/85">
              {product.story}
            </blockquote>
          </section>
        ) : null}
      </div>
    </main>
    </>
  );
}
