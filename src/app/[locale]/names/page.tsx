import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NamesJournal } from "@/components/names/NamesJournal";
import { buildChapters } from "@/data/namesJournal";
import { journalCopy } from "@/data/namesJournalCopy";
import { products as archive } from "@/lib/catalog";
import { getDict, isLocale } from "@/lib/i18n";
import { getLiveProducts } from "@/lib/products";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const t = getDict(locale);
  return { title: t.names.title, description: journalCopy[locale].intro };
}

export default async function NamesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const chapters = buildChapters(await getLiveProducts(), archive);

  return (
    <main id="main">
      <NamesJournal chapters={chapters} locale={locale} />
    </main>
  );
}
