import type { Metadata } from "next";
import { ShopGrid } from "@/components/ShopGrid";
import { KineticHeading } from "@/components/KineticHeading";
import { liveProducts, isBuyable, SHIPS_TO } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Shop",
  description:
    "Every Zuruny product: single-origin Lebanese olive oil, carob and grape molasses, ceramic carafes and Lebanese cedar. Shipped from Beirut to 29 countries.",
};

export default function ShopPage() {
  const inStock = liveProducts.filter(isBuyable).length;

  return (
    <main id="main" className="px-[var(--gutter)] pb-[clamp(4rem,10vh,8rem)] pt-36">
      <header className="mb-14">
        <KineticHeading
          as="h1"
          text="The shop"
          className="u-display text-[length:var(--step-4)] text-cream"
        />
        <p className="m-intro-item u-measure mt-6 text-[length:var(--step-1)] leading-relaxed text-[var(--text-muted)]">
          {liveProducts.length} things, {inStock} of them ready to ship today.
          The rest are between harvests, and they are marked as such rather
          than quietly hidden.
        </p>
        <p className="m-intro-item u-mono mt-6 text-[var(--text-faint)]">
          Prices in USD &middot; ships to {SHIPS_TO.length} countries
        </p>
      </header>

      <ShopGrid products={liveProducts} />
    </main>
  );
}
