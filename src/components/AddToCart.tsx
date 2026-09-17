"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";
import { usePreferences } from "@/lib/preferences";
import { priceForRegion } from "@/lib/region";
import {
  formatUSD,
  isBuyable,
  unbuyableReason,
  type Product,
  type Variant,
} from "@/lib/catalog";

/** A variant can only be sold when it has a price, is available, and is in stock. */
function sellable(v: Variant): boolean {
  return v.priceCents !== null && v.available && v.stock > 0;
}

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const { region, t } = usePreferences();

  const firstSellable = product.variants.find(sellable);
  const [selected, setSelected] = useState<Variant>(
    firstSellable ?? product.variants[0],
  );
  const [qty, setQty] = useState(1);

  const buyable = isBuyable(product);
  const reason = unbuyableReason(product);
  const hasChoices = product.variants.length > 1;

  // Nothing about this product can be sold today. Say which, plainly.
  if (!buyable) {
    return (
      <div className="border-t border-[var(--rule)] pt-8">
        <p className="u-display text-[length:var(--step-2)] text-[var(--text-faint)]">
          {reason === "no-price" ? t.product.priceToCome : t.product.outOfStock}
        </p>
        <p className="u-measure mt-3 text-[length:var(--step--1)] leading-relaxed text-[var(--text-muted)]">
          {reason === "no-price"
            ? t.product.notYetBody
            : t.product.outOfStockBody}
        </p>
        <a
          href={`mailto:hello@zuruny.co?subject=${encodeURIComponent(
            `${product.name} — ${t.product.tellMeWhenBack}`,
          )}`}
          className="u-mono mt-6 inline-block border border-[var(--rule-strong)] px-7 py-4 text-cream transition-colors duration-300 hover:border-ochre hover:text-ochre"
        >
          {t.product.tellMeWhenBack}
        </a>
      </div>
    );
  }

  const maxQty = Math.min(selected.stock, 12);
  const canAdd = sellable(selected);
  const lowStock = selected.stock > 0 && selected.stock <= 5;
  const unit =
    selected.priceCents === null
      ? null
      : priceForRegion(selected.priceCents, region);

  return (
    <div className="border-t border-[var(--rule)] pt-8">
      {hasChoices && (
        <fieldset className="mb-8">
          <legend className="u-mono mb-4 text-[var(--text-muted)]">
            {t.product.size}
          </legend>
          <div className="flex flex-wrap gap-3">
            {product.variants.map((v) => {
              const ok = sellable(v);
              const active = v.label === selected.label;
              return (
                <button
                  key={v.label ?? "default"}
                  type="button"
                  disabled={!ok}
                  aria-pressed={active}
                  onClick={() => {
                    setSelected(v);
                    setQty(1);
                  }}
                  className={`u-mono border px-5 py-3 transition-colors duration-300 ${
                    active
                      ? "border-ochre text-ochre"
                      : "border-[var(--rule-strong)] text-cream hover:border-cream"
                  } ${!ok ? "cursor-not-allowed border-[var(--rule)] text-[var(--text-faint)] line-through hover:border-[var(--rule)]" : ""}`}
                >
                  {v.label ?? t.product.oneSize}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          {/* Labelled "Total", not "Price": the number tracks quantity, and the
              unit price is already stated above the fold. */}
          <p className="u-mono text-[var(--text-muted)]">{t.product.total}</p>
          <p className="u-display mt-1 text-[length:var(--step-2)] text-cream">
            {unit === null ? "—" : formatUSD(unit * qty)}
          </p>
        </div>

        <div>
          <label
            className="u-mono mb-2 block text-[var(--text-muted)]"
            htmlFor={`qty-${product.handle}`}
          >
            {t.product.quantity}
          </label>
          <div className="flex items-stretch border border-[var(--rule-strong)]">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              aria-label={t.product.decrease(product.name)}
              className="px-4 py-3 text-cream transition-colors duration-200 hover:text-ochre disabled:text-[var(--text-faint)]"
            >
              &minus;
            </button>
            <output
              id={`qty-${product.handle}`}
              className="u-mono grid w-12 place-items-center text-cream"
            >
              {qty}
            </output>
            <button
              type="button"
              onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
              disabled={qty >= maxQty}
              aria-label={t.product.increase(product.name)}
              className="px-4 py-3 text-cream transition-colors duration-200 hover:text-ochre disabled:text-[var(--text-faint)]"
            >
              +
            </button>
          </div>
        </div>
      </div>

      <button
        type="button"
        disabled={!canAdd}
        onClick={() => add(product.handle, selected.label, qty)}
        className="u-mono mt-8 w-full bg-cream px-7 py-5 text-ground transition-colors duration-300 hover:bg-ochre disabled:cursor-not-allowed disabled:bg-[var(--rule)] disabled:text-[var(--text-faint)]"
      >
        {t.product.addToBasket}
      </button>

      {lowStock && (
        <p className="u-mono mt-4 text-ochre">
          {t.product.onlyNLeft(selected.stock)}
        </p>
      )}
    </div>
  );
}
