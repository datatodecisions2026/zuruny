import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Reach } from "@/components/Reach";
import { getDict, isLocale } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return { title: t.nav.shipping, description: t.reach.sub };
}

export default async function ShippingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <main id="main">
      <Reach locale={locale} standalone />
    </main>
  );
}
