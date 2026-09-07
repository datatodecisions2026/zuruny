"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useCart } from "./CartProvider";
import { money } from "@/lib/money";

export function CartDrawer() {
  const { lines, open, setOpen, setQty, remove, subtotal, count } = useCart();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed right-[7.5rem] top-4 z-[45] flex min-h-11 items-center border border-bronze/50 bg-paper/85 px-4 text-xs tracking-[0.14em] text-bronze backdrop-blur transition-colors hover:bg-oxblood hover:text-paper sm:right-[8.5rem] sm:top-6"
      >
        Cart{count > 0 ? ` · ${count}` : ""}
      </button>

      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-50 bg-char/45 transition-opacity duration-300 ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      <aside
        aria-label="Cart"
        aria-hidden={!open}
        className={`fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-bronze/25 bg-paper-deep transition-transform duration-400 ease-out ${
          open ? "translate-x-0" : "pointer-events-none translate-x-full"
        }`}
      >
        <header className="flex items-center justify-between border-b border-bronze/20 px-6 py-5">
          <h2 className="u-display text-lg text-char">Your cart</h2>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="-mr-2 flex min-h-11 items-center px-2 text-sm tracking-[0.14em] text-char-soft transition-colors hover:text-char"
          >
            Close
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {lines.length === 0 ? (
            <div className="pt-10">
              <p className="text-char/75">Nothing in the cart yet.</p>
              <Link
                href="/shop"
                onClick={() => setOpen(false)}
                className="mt-4 inline-block text-sm tracking-[0.14em] text-bronze underline decoration-bronze/40 underline-offset-8 hover:text-char"
              >
                See everything we make
              </Link>
            </div>
          ) : (
            <ul className="space-y-6">
              {lines.map((l) => (
                <li key={l.variantId} className="flex gap-4">
                  <div className="relative h-24 w-20 shrink-0 overflow-hidden border border-bronze/20 bg-paper-deep">
                    {l.image ? (
                      <Image
                        src={l.image}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="u-display text-char">{l.name}</p>
                    {l.variantTitle !== "Default Title" ? (
                      <p className="u-spec mt-1 text-char-soft">{l.variantTitle}</p>
                    ) : null}
                    <p className="u-spec mt-1 text-bronze/90">{money(l.price)}</p>

                    <div className="mt-3 flex items-center gap-3">
                      <div className="flex items-center border border-bronze/30">
                        <button
                          type="button"
                          aria-label={`Fewer ${l.name}`}
                          onClick={() => setQty(l.variantId, l.qty - 1)}
                          className="px-3 py-1 text-char-soft transition-colors hover:text-char"
                        >
                          −
                        </button>
                        <span className="u-spec min-w-8 text-center text-char">
                          {l.qty}
                        </span>
                        <button
                          type="button"
                          aria-label={`More ${l.name}`}
                          onClick={() => setQty(l.variantId, l.qty + 1)}
                          className="px-3 py-1 text-char-soft transition-colors hover:text-char"
                        >
                          +
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(l.variantId)}
                        className="text-xs tracking-[0.12em] text-char-soft underline decoration-bronze/30 underline-offset-4 transition-colors hover:text-char"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {lines.length > 0 ? (
          <footer className="border-t border-bronze/20 px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-char-soft">Subtotal</span>
              <span className="u-display text-xl text-char">{money(subtotal)}</span>
            </div>
            {/* Checkout arrives with the payment provider. Until then the cart
                is real but cannot be paid for, so this says so plainly rather
                than leading somewhere broken. */}
            <button
              type="button"
              disabled
              className="mt-5 block w-full cursor-not-allowed border border-bronze/30 bg-paper px-6 py-4 text-center text-sm tracking-[0.14em] text-char-soft"
            >
              Checkout not open yet
            </button>
            <p className="u-spec mt-3 text-center text-char-soft">
              Payments are being set up. Email hello@zuruny.co to order in the
              meantime.
            </p>
          </footer>
        ) : null}
      </aside>
    </>
  );
}

export default CartDrawer;
