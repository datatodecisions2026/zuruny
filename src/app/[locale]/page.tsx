import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { Hero } from "@/components/Hero";
import { Ledger } from "@/components/Ledger";
import { NameMarquee } from "@/components/NameMarquee";
import { RollCall } from "@/components/RollCall";
import { Film } from "@/components/Film";
import { Objects } from "@/components/Objects";
import { Reach } from "@/components/Reach";
import { isLocale } from "@/lib/i18n";
import { REGION_COOKIE, isRegion, type Region } from "@/lib/region";

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

  const cookieRegion = (await cookies()).get(REGION_COOKIE)?.value;
  const region: Region = isRegion(cookieRegion) ? cookieRegion : "INTL";

  return (
    <main id="main">
      <Hero locale={locale} />
      <Ledger locale={locale} />
      <NameMarquee />
      <RollCall locale={locale} region={region} />
      <Film />
      <Objects locale={locale} region={region} />
      <Reach locale={locale} />
    </main>
  );
}
