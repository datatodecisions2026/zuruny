import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { NameMarquee } from "@/components/NameMarquee";
import { RollCall } from "@/components/RollCall";
import { getDict, isLocale } from "@/lib/i18n";
import { getNamedProducts } from "@/lib/products";
import { REGION_HEADER, isRegion, type Region } from "@/lib/region";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return { title: t.names.title, description: t.names.sub };
}

export default async function NamesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const t = getDict(locale);
  const headerRegion = (await headers()).get(REGION_HEADER);
  const region: Region = isRegion(headerRegion) ? headerRegion : "INTL";
  const named = await getNamedProducts();

  return (
    <main id="main" className="pt-52 sm:pt-44 lg:pt-40">
      <header className="px-[var(--gutter)] pb-16">
        <h1 className="m-intro-item u-display text-[length:var(--step-4)] text-cream">
          {t.names.title}
        </h1>
        <p className="m-intro-item u-measure mt-6 text-[length:var(--step-1)] leading-relaxed text-[var(--text-muted)]">
          {t.names.sub}
        </p>
      </header>

      <NameMarquee names={named.map((product) => product.name)} label={t.names.title} />
      <RollCall
        locale={locale}
        region={region}
        products={named}
        showHeader={false}
      />
    </main>
  );
}
