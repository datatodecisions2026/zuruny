"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { usePreferences } from "@/lib/preferences";
import { startCheckout } from "@/lib/checkout-actions";
import { localePath } from "@/lib/i18n";

/**
 * The buy button.
 *
 * It sends the basket as handles, variants and quantities only. The server
 * re-reads every price, applies the detected delivery region and hands the
 * total to Paystack, so the amount charged is never a number this component
 * could have influenced.
 */
export function CheckoutButton({
  paymentLive,
  signedIn,
  mailto,
}: {
  paymentLive: boolean;
  signedIn: boolean;
  mailto: string;
}) {
  const { lines } = useCart();
  const { locale, t } = usePreferences();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // Card payment is not switched on: say so, and keep the email route open
  // rather than showing a button that cannot take money.
  if (!paymentLive) {
    return (
      <div>
        <p className="text-[length:var(--step--1)] leading-relaxed text-[var(--text-muted)]">
          {t.order.notLive}
        </p>
        <a
          href={mailto}
          className="u-mono mt-6 block bg-cream px-7 py-4 text-center text-ground transition-colors duration-300 hover:bg-ochre"
        >
          {t.cart.sendOrder}
        </a>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div>
        <p className="text-[length:var(--step--1)] leading-relaxed text-[var(--text-muted)]">
          {t.order.signInWhy}
        </p>
        <Link
          href={localePath(locale, "/account")}
          className="u-mono mt-6 block bg-cream px-7 py-4 text-center text-ground transition-colors duration-300 hover:bg-ochre"
        >
          {t.order.signInToOrder}
        </Link>
      </div>
    );
  }

  const onPay = () => {
    setError(null);
    start(async () => {
      const result = await startCheckout({
        lines: lines.map((l) => ({
          handle: l.product.handle,
          variantLabel: l.variant.label,
          qty: l.qty,
        })),
        locale,
        shipping: {},
      });

      if (result.ok) {
        // Hosted checkout lives on Paystack's domain.
        window.location.href = result.redirectTo;
        return;
      }

      setError(
        result.error === "unavailable" ? t.order.unavailable : t.order.failed,
      );
    });
  };

  return (
    <div>
      <button
        type="button"
        onClick={onPay}
        disabled={pending || lines.length === 0}
        className="u-mono w-full bg-cream px-7 py-4 text-ground transition-colors duration-300 hover:bg-ochre disabled:opacity-50"
      >
        {pending ? t.order.checkingOut : t.order.checkout}
      </button>

      {error && (
        <p role="alert" className="u-mono mt-4 text-ochre">
          {error}
        </p>
      )}
    </div>
  );
}
