import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ShopGrid } from "@/components/ShopGrid";
import { KineticHeading } from "@/components/KineticHeading";
import { liveProducts, isBuyable, SHIPS_TO } from "@/lib/catalog";
import { getDict, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return {
    title: t.shop.title,
    description: t.shop.sub(
      liveProducts.length,
      liveProducts.filter(isBuyable).length,
    ),
  };
}

export default async function ShopPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = getDict(locale);
  const inStock = liveProducts.filter(isBuyable).length;

  return (
    <main
      id="main"
      className="px-[var(--gutter)] pb-[clamp(4rem,10vh,8rem)] pt-52 sm:pt-44 lg:pt-40"
    >
      <header className="mb-14">
        <KineticHeading
          as="h1"
          text={t.shop.title}
          className="u-display text-[length:var(--step-4)] text-cream"
        />
        <p className="m-intro-item u-measure mt-6 text-[length:var(--step-1)] leading-relaxed text-[var(--text-muted)]">
          {t.shop.sub(liveProducts.length, inStock)}
        </p>
        <p className="m-intro-item u-mono mt-6 text-[var(--text-faint)]">
          {t.shop.meta(SHIPS_TO.length)}
        </p>
      </header>

      <ShopGrid products={liveProducts} />
    </main>
  );
}
