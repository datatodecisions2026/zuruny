import Image from "next/image";
import Link from "next/link";
import {
  fromPriceCents,
  isBuyable,
  unbuyableReason,
  formatUSD,
  KIND_LABEL,
  type Product,
} from "@/lib/catalog";

/**
 * One product, as a card. No hooks, so it works in a server tree and inside
 * the client-side shop filter alike.
 */
export function ProductCard({ product }: { product: Product }) {
  const [front, back] = product.images;
  const price = fromPriceCents(product);
  const buyable = isBuyable(product);
  const reason = unbuyableReason(product);

  return (
    <article className="group m-tilt h-full">
      <Link
        href={`/products/${product.handle}`}
        className="flex h-full flex-col"
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-ground-2">
          {front ? (
            <>
              <Image
                src={front.src}
                alt={front.alt}
                fill
                sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
                className="object-cover transition-[transform,opacity] duration-[900ms] ease-[var(--ease-out-soft)] group-hover:scale-110 motion-safe:group-hover:opacity-0 motion-safe:group-focus-within:opacity-0"
              />
              {back && (
                <Image
                  src={back.src}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(min-width: 1024px) 30vw, (min-width: 640px) 46vw, 100vw"
                  className="scale-110 object-cover opacity-0 transition-[transform,opacity] duration-[900ms] ease-[var(--ease-out-soft)] motion-safe:group-hover:scale-100 motion-safe:group-hover:opacity-100 motion-safe:group-focus-within:scale-100 motion-safe:group-focus-within:opacity-100"
                />
              )}
            </>
          ) : (
            /* No photograph exists. Rather than a grey box, the pull quote
               carries the card — the brand has more of that than anything. */
            <div className="u-damask relative flex h-full flex-col justify-between overflow-hidden bg-oxblood p-6">
              <span
                aria-hidden
                className="u-emblem size-8 text-ochre/60 transition-transform duration-[1200ms] ease-[var(--ease-out-soft)] group-hover:rotate-180"
                style={{ ["--emblem-src" as string]: "url(/brand/emblem.png)" }}
              />
              {product.pullQuote && (
                <p className="u-display text-[length:var(--step-1)] text-cream">
                  &ldquo;{product.pullQuote}&rdquo;
                </p>
              )}
              <span className="u-mono text-cream/50">
                Photography in progress
              </span>
            </div>
          )}

          {!buyable && (
            <span className="u-mono absolute left-4 top-4 bg-ground/85 px-3 py-1.5 text-ochre">
              {reason === "no-price" ? "Not yet released" : "Sold out"}
            </span>
          )}
        </div>

        <div className="mt-5 flex items-baseline justify-between gap-4">
          <h3 className="u-display text-[length:var(--step-2)] text-cream transition-colors duration-300 group-hover:text-ochre">
            {product.name}
          </h3>
          <p className="u-mono shrink-0 text-cream">
            {price === null ? (
              <span className="text-[var(--text-faint)]">&mdash;</span>
            ) : (
              formatUSD(price)
            )}
          </p>
        </div>

        <p className="u-mono mt-2 text-[var(--text-faint)]">
          {KIND_LABEL[product.kind]}
        </p>

        {product.pullQuote && product.images.length > 0 && (
          <p className="u-display mt-4 text-[length:var(--step-0)] leading-snug text-ochre/80">
            &ldquo;{product.pullQuote}&rdquo;
          </p>
        )}
      </Link>
    </article>
  );
}
