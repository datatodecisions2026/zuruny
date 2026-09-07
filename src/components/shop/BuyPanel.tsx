"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";
import { money } from "@/lib/money";
import type { Product } from "@/lib/catalog";

/**
 * Variant picker plus add-to-cart. A variant with no price set is
 * never offered for sale — it would take money against a $0.00 line — so it
 * falls back to an enquiry instead.
 */
export function BuyPanel({ product }: { product: Product }) {
  const { add } = useCart();
  const firstSellable =
    product.variants.find((v) => v.available && v.priceCents > 0) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstSellable.id);

  const variant =
    product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const multi =
    product.variants.length > 1 || product.variants[0].title !== "Default Title";

  const sellable = variant.available && variant.priceCents > 0;

  return (
    <div>
      <p className="u-display text-2xl text-char">
        {variant.priceCents > 0 ? money(variant.priceCents) : "Price not set"}
      </p>

      {multi ? (
        <fieldset className="mt-6">
          <legend className="u-spec text-char-soft">Size</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {product.variants.map((v) => {
              const selected = v.id === variantId;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVariantId(v.id)}
                  aria-pressed={selected}
                  className={`border px-5 py-2.5 text-sm tracking-[0.1em] transition-colors ${
                    selected
                      ? "border-oxblood bg-oxblood text-paper"
                      : "border-bronze/30 text-char/80 hover:border-bronze/70 hover:text-char"
                  } ${!v.available ? "line-through opacity-45" : ""}`}
                >
                  {v.title}
                </button>
              );
            })}
          </div>
        </fieldset>
      ) : null}

      <div className="mt-8">
        {sellable ? (
          <button
            type="button"
            onClick={() =>
              add({
                variantId: variant.id,
                handle: product.handle,
                name: product.name,
                variantTitle: variant.title,
                price: variant.priceCents,
                image: product.images[0],
              })
            }
            className="w-full border border-bronze/60 bg-oxblood px-8 py-4 text-sm tracking-[0.14em] text-paper transition-colors hover:bg-oxblood-deep sm:w-auto"
          >
            Add to cart
          </button>
        ) : (
          <div>
            <p className="u-measure text-char/75">
              {!variant.available
                  ? "Sold out in this size."
                  : "This one has no price set in the shop yet, so we can't take payment for it."}
            </p>
            <a
              href={`mailto:hello@zuruny.co?subject=${encodeURIComponent(
                `${product.name} — ${variant.title === "Default Title" ? "enquiry" : variant.title}`,
              )}`}
              className="mt-5 inline-block border border-bronze/50 px-7 py-3.5 text-sm tracking-[0.14em] text-bronze transition-colors hover:bg-oxblood hover:text-paper"
            >
              {"Ask about this one"}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default BuyPanel;
