import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Hero } from "@/components/Hero";
import { Ledger } from "@/components/Ledger";
import { NameMarquee } from "@/components/NameMarquee";
import { RollCall } from "@/components/RollCall";
import { Film } from "@/components/Film";
import { Objects } from "@/components/Objects";
import { Reach } from "@/components/Reach";
import { isLocale } from "@/lib/i18n";
import {
  getLiveProducts,
  getNamedProducts,
  getObjectProducts,
} from "@/lib/products";
import { REGION_HEADER, isRegion, type Region } from "@/lib/region";

/**
 * Seven sections, each about one screen. The order is deliberate:
 * the pour sells, the figures ground it, the names carry it, the film
 * breathes, the objects convert, the reach closes.
 */
export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const headerRegion = (await headers()).get(REGION_HEADER);
  const region: Region = isRegion(headerRegion) ? headerRegion : "INTL";

  const [live, named, objects] = await Promise.all([
    getLiveProducts(),
    getNamedProducts(),
    getObjectProducts(),
  ]);

  return (
    <main id="main">
      <Hero locale={locale} />
      <Ledger locale={locale} live={live} named={named} />
      <NameMarquee names={named.map((p) => p.name)} />
      <RollCall locale={locale} region={region} products={named} />
      <Film />
      <Objects locale={locale} region={region} products={objects} />
      <Reach locale={locale} />
    </main>
  );
}
