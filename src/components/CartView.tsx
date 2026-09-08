"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, orderSummary } from "@/lib/cart";
import { formatUSD, SHIPS_TO } from "@/lib/catalog";

export function CartView() {
  const { lines, count, subtotalCents, setQty, remove, clear, ready } =
    useCart();

  const mailto = `mailto:hello@zuruny.co?subject=${encodeURIComponent(
    "Order request",
  )}&body=${encodeURIComponent(orderSummary(lines, subtotalCents))}`;

  return (
    <main
      id="main"
      className="min-h-[70svh] px-[var(--gutter)] pb-[clamp(4rem,10vh,8rem)] pt-36"
    >
      <h1 className="m-intro-item u-display text-[length:var(--step-3)] text-cream">
        Your basket
      </h1>

      {!ready ? (
        <p className="u-mono mt-8 text-[var(--text-faint)]">Loading…</p>
      ) : lines.length === 0 ? (
        <div className="mt-12">
          <p className="u-measure text-[length:var(--step-1)] text-[var(--text-muted)]">
            Nothing in it yet.
          </p>
          <Link
            href="/shop"
            className="u-mono mt-8 inline-block bg-cream px-7 py-4 text-ground transition-colors duration-300 hover:bg-ochre"
          >
            Browse the shop
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
                    href={`/products/${line.product.handle}`}
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
                          href={`/products/${line.product.handle}`}
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
                          {formatUSD(line.unitPriceCents)} each
                        </p>
                        {line.clamped && (
                          <p className="u-mono mt-2 text-ochre">
                            Reduced to {line.qty} — stock changed
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
                          aria-label={`Decrease quantity of ${line.product.name}`}
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
                          aria-label={`Increase quantity of ${line.product.name}`}
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
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="border border-[var(--rule)] p-7">
              <h2 className="u-mono text-[var(--text-muted)]">Summary</h2>

              <div className="mt-6 flex items-baseline justify-between">
                <span className="text-[var(--text-muted)]">
                  {count} {count === 1 ? "item" : "items"}
                </span>
                <span className="u-display text-[length:var(--step-2)] text-cream">
                  {formatUSD(subtotalCents)}
                </span>
              </div>

              <p className="u-mono mt-2 text-[var(--text-faint)]">
                Shipping quoted by email
              </p>

              {/* The honest bit. There is no payment provider wired up, so the
                  order is handed to a person rather than to a checkout that
                  would dead-end at the last step. */}
              <div className="mt-7 border-t border-[var(--rule)] pt-6">
                <p className="text-[length:var(--step--1)] leading-relaxed text-[var(--text-muted)]">
                  Card payment is not live yet. Send this basket to us and we
                  will reply with a shipping quote for your country and a way to
                  pay.
                </p>
                <a
                  href={mailto}
                  className="u-mono mt-6 block bg-cream px-7 py-4 text-center text-ground transition-colors duration-300 hover:bg-ochre"
                >
                  Send this order
                </a>
                <button
                  type="button"
                  onClick={clear}
                  className="u-mono mt-4 w-full py-2 text-[var(--text-faint)] underline-offset-4 transition-colors duration-300 hover:text-cream hover:underline"
                >
                  Empty basket
                </button>
              </div>
            </div>

            <p className="u-mono mt-6 text-[var(--text-faint)]">
              We ship to {SHIPS_TO.length} countries
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
