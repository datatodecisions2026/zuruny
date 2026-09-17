"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { usePreferences } from "@/lib/preferences";
import { localePath } from "@/lib/i18n";
import { formatUSD } from "@/lib/catalog";

export function CartDrawer() {
  const { isOpen, closeCart, lines, count, subtotalCents } = useCart();
  const { locale, t } = usePreferences();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close on Escape, and stop the page behind from scrolling while open.
  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeCart();
    };
    document.addEventListener("keydown", onKey);

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, closeCart]);

  return (
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 ${isOpen ? "" : "pointer-events-none"}`}
    >
      <button
        type="button"
        tabIndex={isOpen ? 0 : -1}
        aria-label={t.cart.closeBasket}
        onClick={closeCart}
        className={`absolute inset-0 bg-black/70 transition-opacity duration-500 ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal={isOpen}
        aria-label={t.nav.basket}
        tabIndex={-1}
        className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-[var(--rule)] bg-ground transition-transform duration-500 ease-[var(--ease-out-soft)] ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-[var(--rule)] px-6 py-5">
          <h2 className="u-mono text-cream">
            {t.nav.basket}{count > 0 ? ` (${count})` : ""}
          </h2>
          <button
            type="button"
            onClick={closeCart}
            className="u-mono text-[var(--text-muted)] transition-colors duration-300 hover:text-cream"
          >
            {t.cart.close}
          </button>
        </header>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
            <span
              aria-hidden
              className="u-emblem size-12 text-[var(--text-faint)]"
              style={{ ["--emblem-src" as string]: "url(/brand/emblem.png)" }}
            />
            <p className="text-[var(--text-muted)]">{t.cart.emptyDrawer}</p>
            <Link
              href={localePath(locale, "/shop")}
              onClick={closeCart}
              className="u-mono border border-[var(--rule-strong)] px-6 py-3 text-cream transition-colors duration-300 hover:border-ochre hover:text-ochre"
            >
              {t.cart.browseShop}
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-[var(--rule)] overflow-y-auto px-6">
              {lines.map((line) => (
                <CartRow key={line.key} line={line} />
              ))}
            </ul>

            <footer className="border-t border-[var(--rule)] px-6 py-6">
              <div className="flex items-baseline justify-between">
                <span className="u-mono text-[var(--text-muted)]">{t.cart.subtotal}</span>
                <span className="u-display text-[length:var(--step-2)] text-cream">
                  {formatUSD(subtotalCents)}
                </span>
              </div>
              <p className="u-mono mt-2 text-[var(--text-faint)]">
                {t.cart.shippingCalculated}
              </p>
              <Link
                href={localePath(locale, "/cart")}
                onClick={closeCart}
                className="u-mono mt-6 block bg-cream px-7 py-4 text-center text-ground transition-colors duration-300 hover:bg-ochre"
              >
                {t.cart.reviewOrder}
              </Link>
            </footer>
          </>
        )}
      </div>
    </div>
  );
}

function CartRow({
  line,
}: {
  line: ReturnType<typeof useCart>["lines"][number];
}) {
  const { setQty, remove } = useCart();
  const { locale, t } = usePreferences();
  const image = line.product.images[0];

  return (
    <li className="flex gap-4 py-5">
      <div className="relative size-20 shrink-0 overflow-hidden bg-ground-2">
        {image ? (
          <Image
            src={image.src}
            alt={image.alt}
            fill
            sizes="80px"
            className="object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="u-emblem absolute inset-0 m-auto size-8 text-oxblood"
            style={{ ["--emblem-src" as string]: "url(/brand/emblem.png)" }}
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div>
            <Link
              href={localePath(locale, `/products/${line.product.handle}`)}
              className="u-display text-[length:var(--step-1)] text-cream transition-colors duration-300 hover:text-ochre"
            >
              {line.product.name}
            </Link>
            {line.variant.label && (
              <p className="u-mono mt-1 text-[var(--text-faint)]">
                {line.variant.label}
              </p>
            )}
          </div>
          <p className="u-mono shrink-0 text-cream">
            {formatUSD(line.lineTotalCents)}
          </p>
        </div>

        {line.clamped && (
          <p className="u-mono mt-2 text-ochre">
            {t.cart.reducedTo(line.qty)}
          </p>
        )}

        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-stretch border border-[var(--rule)]">
            <button
              type="button"
              aria-label={t.product.decrease(line.product.name)}
              onClick={() => setQty(line.key, line.qty - 1)}
              className="px-3 py-1 text-cream transition-colors hover:text-ochre"
            >
              &minus;
            </button>
            <span className="u-mono grid w-8 place-items-center text-cream">
              {line.qty}
            </span>
            <button
              type="button"
              aria-label={t.product.increase(line.product.name)}
              onClick={() => setQty(line.key, line.qty + 1)}
              disabled={line.qty >= line.variant.stock}
              className="px-3 py-1 text-cream transition-colors hover:text-ochre disabled:text-[var(--text-faint)]"
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
}
