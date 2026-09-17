"use client";

import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { usePreferences } from "@/lib/preferences";
import { type Product, type ProductKind } from "@/lib/catalog";

type Filter = "all" | ProductKind | "molasses";

function matches(product: Product, filter: Filter): boolean {
  if (filter === "all") return true;
  if (filter === "molasses") {
    return (
      product.kind === "carob-molasses" || product.kind === "grape-molasses"
    );
  }
  return product.kind === filter;
}

export function ShopGrid({ products }: { products: Product[] }) {
  const { locale, region, t } = usePreferences();
  const [filter, setFilter] = useState<Filter>("all");

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: t.shop.everything },
    { id: "olive-oil", label: t.shop.oliveOil },
    { id: "molasses", label: t.shop.molasses },
    { id: "carafe", label: t.shop.carafes },
    { id: "coaster", label: t.shop.cedar },
  ];

  const shown = useMemo(
    () => products.filter((p) => matches(p, filter)),
    [products, filter],
  );

  const counts = useMemo(() => {
    const map = new Map<Filter, number>();
    for (const f of ["all", "olive-oil", "molasses", "carafe", "coaster"] as Filter[]) {
      map.set(f, products.filter((p) => matches(p, f)).length);
    }
    return map;
  }, [products]);

  return (
    <>
      <div
        role="group"
        aria-label={t.shop.filterLabel}
        className="m-cascade flex flex-wrap gap-3 border-y border-[var(--rule)] py-6"
      >
        {filters.map((f, i) => {
          const active = filter === f.id;
          const n = counts.get(f.id) ?? 0;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              aria-pressed={active}
              disabled={n === 0}
              style={{ ["--i" as string]: i }}
              className={`u-mono border px-5 py-3 transition-[color,border-color,transform] duration-300 ease-[var(--ease-out-soft)] hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 ${
                active
                  ? "border-ochre text-ochre"
                  : "border-[var(--rule-strong)] text-[var(--text-muted)] hover:border-cream hover:text-cream"
              }`}
            >
              {f.label}
              <span className="ml-2 text-[var(--text-faint)]">{n}</span>
            </button>
          );
        })}
      </div>

      {/* `key` on the list forces a remount when the filter changes, so the
          entry animation replays for the new set instead of the cards
          silently swapping underneath. */}
      <ul
        key={filter}
        className="m-cascade mt-16 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5"
      >
        {shown.map((product, i) => (
          <li key={product.handle} style={{ ["--i" as string]: i }}>
            <ProductCard product={product} locale={locale} region={region} />
          </li>
        ))}
      </ul>

      <p className="u-mono mt-16 text-[var(--text-faint)]" aria-live="polite">
        {t.shop.showing(shown.length, products.length)}
      </p>
    </>
  );
}
