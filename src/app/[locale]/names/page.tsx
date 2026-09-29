import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NamesJournal } from "@/components/names/NamesJournal";
import { journalCopy } from "@/data/namesJournalCopy";
import { getChapters } from "@/lib/chapters";
import { getDict, isLocale } from "@/lib/i18n";

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

  const chapters = await getChapters();

  return (
    <main id="main">
      <NamesJournal chapters={chapters} locale={locale} />
    </main>
  );
}
