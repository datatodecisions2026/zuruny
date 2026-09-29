import type { Metadata } from "next";
import { getAdminChapters, getChapterCandidates } from "@/lib/chapters";
import { AdminNames } from "@/components/AdminNames";

export const metadata: Metadata = { title: "Names — Admin", robots: { index: false } };

/** The auth check lives in admin/layout.tsx — this page only runs once it has passed. */
export default async function AdminNamesPage() {
  const [chapters, candidates] = await Promise.all([getAdminChapters(), getChapterCandidates()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-display text-3xl text-foreground">The Names</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each name here becomes a chapter of the page-flip book at /names. The story text is the
          product&apos;s own &ldquo;Their story&rdquo; field — set that first, on the Products page —
          this page only adds the chapter and its images.
        </p>
      </div>
      <AdminNames chapters={chapters} candidates={candidates} />
    </div>
  );
}
