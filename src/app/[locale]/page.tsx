import { notFound } from "next/navigation";
import { CinematicStage } from "@/components/cinematic/CinematicStage";
import { Ledger } from "@/components/Ledger";
import { isLocale } from "@/lib/i18n";
import { getLiveProducts, getNamedProducts } from "@/lib/products";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [live, named] = await Promise.all([
    getLiveProducts(),
    getNamedProducts(),
  ]);

  return (
    <main id="main">
      <CinematicStage locale={locale} />
      <Ledger locale={locale} live={live} named={named} />
    </main>
  );
}
