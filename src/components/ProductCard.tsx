import Image from "next/image";
import Link from "next/link";
import {
  fromPriceCents,
  isBuyable,
  unbuyableReason,
  formatUSD,
  type Product,
} from "@/lib/catalog";
import { getDict, localePath, type Locale } from "@/lib/i18n";
import { maybePriceForRegion, type Region } from "@/lib/region";

/**
 * One product, as a card. No hooks, so it works in a server tree and inside
 * the client-side shop filter alike.
 */
export function ProductCard({
  product,
  locale,
  region,
}: {
  product: Product;
  locale: Locale;
  region: Region;
}) {
  const t = getDict(locale);
  const [front, back] = product.images;
  const price = maybePriceForRegion(fromPriceCents(product), region);
  const buyable = isBuyable(product);
  const reason = unbuyableReason(product);

  return (
    <article className="group m-tilt h-full">
      <Link
        href={localePath(locale, `/products/${product.handle}`)}
        className="flex h-full flex-col"
      >
        <div className="relative aspect-[2/3] overflow-hidden bg-ground-2">
          {front ? (
            <>
              <Image
                src={front.src}
                alt={front.alt}
                fill
                sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 46vw, 100vw"
                className="object-cover transition-[transform,opacity] duration-[900ms] ease-[var(--ease-out-soft)] group-hover:scale-110 motion-safe:group-hover:opacity-0 motion-safe:group-focus-within:opacity-0"
              />
              {back && (
                <Image
                  src={back.src}
                  alt=""
                  aria-hidden
                  fill
                  sizes="(min-width: 1280px) 20vw, (min-width: 1024px) 25vw, (min-width: 640px) 46vw, 100vw"
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
                <p className="u-display text-[length:var(--step-0)] text-cream">
                  &ldquo;{product.pullQuote}&rdquo;
                </p>
              )}
              <span className="u-mono text-cream/50">
                {t.product.photographyInProgress}
              </span>
            </div>
          )}

          {!buyable && (
            <span className="u-mono absolute left-3 top-3 bg-ground/85 px-2.5 py-1.5 text-ochre">
              {reason === "no-price"
                ? t.product.notYetReleased
                : t.product.soldOut}
            </span>
          )}
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3">
          <h3 className="u-display text-[length:var(--step-1)] text-cream transition-colors duration-300 group-hover:text-ochre">
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
          {t.kinds[product.kind]}
        </p>
      </Link>
    </article>
  );
}
