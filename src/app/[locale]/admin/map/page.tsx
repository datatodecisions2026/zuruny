import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminOrigins, getOriginProductChoices } from "@/lib/origins";
import { getDict, isLocale } from "@/lib/i18n";
import { AdminOrigins } from "@/components/AdminOrigins";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return { title: `Map — ${getDict(locale).admin.title}`, robots: { index: false } };
}

/** The auth check lives in admin/layout.tsx — this page only runs once it has passed. */
export default async function AdminMapPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const [origins, products] = await Promise.all([getAdminOrigins(), getOriginProductChoices()]);

  return (
    <section>
      <h2 className="u-display mb-3 text-[length:var(--step-2)] text-cream">Map pins</h2>
      <p className="u-measure mb-8 text-[var(--text-muted)]">
        Each pin is a point on the shop&apos;s 3D relief map. Map X and Map Y (both 0–1) are what
        actually place the pin — find them by trial: change one, save, and check the shop page.
        Latitude and longitude are only ever shown as text.
      </p>
      <AdminOrigins origins={origins} products={products} />
    </section>
  );
}
