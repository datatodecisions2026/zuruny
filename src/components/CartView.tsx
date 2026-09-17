"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, orderSummary } from "@/lib/cart";
import { usePreferences } from "@/lib/preferences";
import { localePath } from "@/lib/i18n";
import { CheckoutButton } from "@/components/CheckoutButton";
import { formatUSD, SHIPS_TO } from "@/lib/catalog";

export function CartView({
  paymentLive,
  signedIn,
}: {
  paymentLive: boolean;
  signedIn: boolean;
}) {
  const { lines, count, subtotalCents, setQty, remove, clear, ready } =
    useCart();
  const { locale, region, t } = usePreferences();

  const regionName = region === "LB" ? t.region.lebanon : t.region.international;
  const mailto = `mailto:hello@zuruny.co?subject=${encodeURIComponent(
    t.cart.orderSubject,
  )}&body=${encodeURIComponent(
    orderSummary(lines, subtotalCents, {
      intro: t.cart.orderIntro,
      subtotal: t.cart.orderSubtotal,
      address: t.cart.orderAddress,
      region: t.cart.orderRegion,
    }, regionName),
  )}`;

  return (
    <main
      id="main"
      className="min-h-[70svh] px-[var(--gutter)] pb-[clamp(4rem,10vh,8rem)] pt-52 sm:pt-44 lg:pt-36"
    >
      <h1 className="m-intro-item u-display text-[length:var(--step-3)] text-cream">
        {t.cart.title}
      </h1>

      {!ready ? (
        <p className="u-mono mt-8 text-[var(--text-faint)]">{t.cart.loading}</p>
      ) : lines.length === 0 ? (
        <div className="mt-12">
          <p className="u-measure text-[length:var(--step-1)] text-[var(--text-muted)]">
            {t.cart.empty}
          </p>
          <Link
            href={localePath(locale, "/shop")}
            className="u-mono mt-8 inline-block bg-cream px-7 py-4 text-ground transition-colors duration-300 hover:bg-ochre"
          >
            {t.cart.browseShop}
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-x-[clamp(2rem,6vw,5rem)] gap-y-12 lg:grid-cols-[1fr_22rem]">
          <ul className="divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
            {lines.map((line) => {
              const image = line.product.images[0];
              return (
                <li key={line.key} className="m-rise flex gap-6 py-7">
                  <Link
                    href={localePath(locale, `/products/${line.product.handle}`)}
                    className="relative size-28 shrink-0 overflow-hidden bg-ground-2 sm:size-36"
                  >
                    {image ? (
                      <Image
                        src={image.src}
                        alt={image.alt}
                        fill
                        sizes="144px"
                        className="object-cover transition-transform duration-700 hover:scale-110"
                      />
                    ) : (
                      <span
                        aria-hidden
                        className="u-emblem absolute inset-0 m-auto size-10 text-oxblood"
                        style={{
                          ["--emblem-src" as string]: "url(/brand/emblem.png)",
                        }}
                      />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <Link
                          href={localePath(locale, `/products/${line.product.handle}`)}
                          className="u-display text-[length:var(--step-2)] text-cream transition-colors duration-300 hover:text-ochre"
                        >
                          {line.product.name}
                        </Link>
                        {line.variant.label && (
                          <p className="u-mono mt-1 text-[var(--text-faint)]">
                            {line.variant.label}
                          </p>
                        )}
                        <p className="u-mono mt-1 text-[var(--text-muted)]">
                          {t.cart.each(formatUSD(line.unitPriceCents))}
                        </p>
                        {line.clamped && (
                          <p className="u-mono mt-2 text-ochre">
                            {t.cart.reducedTo(line.qty)}
                          </p>
                        )}
                      </div>
                      <p className="u-display shrink-0 text-[length:var(--step-1)] text-cream">
                        {formatUSD(line.lineTotalCents)}
                      </p>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="flex items-stretch border border-[var(--rule-strong)]">
                        <button
                          type="button"
                          aria-label={t.product.decrease(line.product.name)}
                          onClick={() => setQty(line.key, line.qty - 1)}
                          className="px-4 py-2 text-cream transition-colors hover:text-ochre"
                        >
                          &minus;
                        </button>
                        <span className="u-mono grid w-10 place-items-center text-cream">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          aria-label={t.product.increase(line.product.name)}
                          onClick={() => setQty(line.key, line.qty + 1)}
                          disabled={line.qty >= line.variant.stock}
                          className="px-4 py-2 text-cream transition-colors hover:text-ochre disabled:text-[var(--text-faint)]"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(line.key)}
                        className="u-mono text-[var(--text-faint)] underline-offset-4 transition-colors duration-300 hover:text-cream hover:underline"
                      >
                        {t.cart.remove}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-[var(--rule)] p-7">
              <h2 className="u-mono text-[var(--text-muted)]">{t.cart.summary}</h2>

              <div className="mt-6 flex items-baseline justify-between">
                <span className="text-[var(--text-muted)]">
                  {count} {count === 1 ? t.cart.item : t.cart.items}
                </span>
                <span className="u-display text-[length:var(--step-2)] text-cream">
                  {formatUSD(subtotalCents)}
                </span>
              </div>

              <p className="u-mono mt-2 text-[var(--text-faint)]">
                {t.cart.shippingByEmail}
              </p>

              {/* The honest bit. There is no payment provider wired up, so the
                  order is handed to a person rather than to a checkout that
                  would dead-end at the last step. */}
              <div className="mt-7 border-t border-[var(--rule)] pt-6">
                <CheckoutButton
                  paymentLive={paymentLive}
                  signedIn={signedIn}
                  mailto={mailto}
                />
                <button
                  type="button"
                  onClick={clear}
                  className="u-mono mt-4 w-full py-2 text-[var(--text-faint)] underline-offset-4 transition-colors duration-300 hover:text-cream hover:underline"
                >
                  {t.cart.emptyBasket}
                </button>
              </div>
            </div>

            <p className="u-mono mt-6 text-[var(--text-faint)]">
              {t.cart.shipTo(SHIPS_TO.length)}
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
