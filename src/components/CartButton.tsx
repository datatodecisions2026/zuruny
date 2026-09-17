"use client";

import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";
import { usePreferences } from "@/lib/preferences";

export function CartButton() {
  const { count, openCart, ready } = useCart();
  const { t } = usePreferences();
  const [bump, setBump] = useState(false);
  const previous = useRef(0);

  // Kick the badge whenever the count grows, so adding something is felt
  // even when the drawer is already open.
  useEffect(() => {
    if (ready && count > previous.current) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 600);
      return () => clearTimeout(t);
    }
    previous.current = count;
  }, [count, ready]);

  useEffect(() => {
    previous.current = count;
  }, [count]);

  return (
    <button
      type="button"
      onClick={openCart}
      className="u-mono group relative border border-[var(--rule-strong)] px-4 py-2 text-cream transition-colors duration-300 hover:border-ochre hover:text-ochre"
    >
      {t.nav.basket}
      <span
        aria-hidden
        className={`ml-2 inline-block tabular-nums transition-transform duration-300 ${
          bump ? "scale-150 text-ochre" : "scale-100"
        }`}
      >
        {ready ? count : 0}
      </span>
      <span className="sr-only">
        {ready ? t.nav.itemsInBasket(count) : t.nav.basket}
      </span>
    </button>
  );
}
