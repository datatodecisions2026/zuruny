import type { Metadata } from "next";
import { getAdminOrigins, getOriginProductChoices } from "@/lib/origins";
import { AdminOrigins } from "@/components/AdminOrigins";

export const metadata: Metadata = { title: "Map — Admin", robots: { index: false } };

/** The auth check lives in admin/layout.tsx — this page only runs once it has passed. */
export default async function AdminMapPage() {
  const [origins, products] = await Promise.all([getAdminOrigins(), getOriginProductChoices()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="admin-display text-3xl text-foreground">Map pins</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Each pin is a point on the shop&apos;s 3D relief map. Map X and Map Y (both 0–1) are what
          actually place the pin — find them by trial: change one, save, and check the shop page.
          Latitude and longitude are only ever shown as text.
        </p>
      </div>
      <AdminOrigins origins={origins} products={products} />
    </div>
  );
}
