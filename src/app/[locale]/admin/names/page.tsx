import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminChapters, getChapterCandidates } from "@/lib/chapters";
import { getDict, isLocale } from "@/lib/i18n";
import { AdminNames } from "@/components/AdminNames";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: `Names — ${getDict(locale).admin.title}`, robots: { index: false } };
}

/** The auth check lives in admin/layout.tsx — this page only runs once it has passed. */
export default async function AdminNamesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [chapters, candidates] = await Promise.all([getAdminChapters(), getChapterCandidates()]);

  return (
    <section>
      <h2 className="u-display mb-3 text-[length:var(--step-2)] text-cream">The Names</h2>
      <p className="u-measure mb-8 text-[var(--text-muted)]">
        Each name here becomes a chapter of the page-flip book at /names. The story text is the
        product&apos;s own &ldquo;Their story&rdquo; field — set that first, on the Products page —
        this page only adds the chapter and its images.
      </p>
      <AdminNames chapters={chapters} candidates={candidates} />
    </section>
  );
}
