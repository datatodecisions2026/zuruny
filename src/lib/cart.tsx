"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  products,
  formatUSD,
  type Product,
  type Variant,
} from "@/lib/catalog";

/**
 * Cart state.
 *
 * Only identity and quantity are persisted — never prices. Money is resolved
 * from the catalogue on every render, so a stale basket in someone's browser
 * can never quote a price we no longer charge, and a product that has since
 * been unpublished or unpriced drops out instead of becoming purchasable.
 */

const STORAGE_KEY = "zuruny.cart.v1";

export type CartLine = {
  handle: string;
  variantLabel: string | null;
  qty: number;
};

/** A line joined back to live catalogue data. */
export type ResolvedLine = {
  key: string;
  product: Product;
  variant: Variant;
  qty: number;
  unitPriceCents: number;
  lineTotalCents: number;
  /** Quantity was clamped because stock fell below what was in the basket. */
  clamped: boolean;
};

export function lineKey(handle: string, variantLabel: string | null): string {
  return `${handle}::${variantLabel ?? ""}`;
}

type Action =
  | { type: "hydrate"; lines: CartLine[] }
  | { type: "add"; handle: string; variantLabel: string | null; qty: number }
  | { type: "setQty"; key: string; qty: number }
  | { type: "remove"; key: string }
  | { type: "clear" };

/**
 * `ready` lives in the reducer rather than its own useState so that reading
 * localStorage on mount is a single dispatch. Two separate state setters in
 * one effect cause a cascading render, which React's lint rules flag.
 */
type State = { lines: CartLine[]; ready: boolean };

function reducer(state: State, action: Action): State {
  return { lines: linesReducer(state.lines, action), ready: state.ready || action.type === "hydrate" };
}

function linesReducer(state: CartLine[], action: Action): CartLine[] {
  switch (action.type) {
    case "hydrate":
      return action.lines;

    case "add": {
      const key = lineKey(action.handle, action.variantLabel);
      const existing = state.find(
        (l) => lineKey(l.handle, l.variantLabel) === key,
      );
      if (existing) {
        return state.map((l) =>
          lineKey(l.handle, l.variantLabel) === key
            ? { ...l, qty: l.qty + action.qty }
            : l,
        );
      }
      return [
        ...state,
        {
          handle: action.handle,
          variantLabel: action.variantLabel,
          qty: action.qty,
        },
      ];
    }

    case "setQty":
      if (action.qty <= 0) {
        return state.filter((l) => lineKey(l.handle, l.variantLabel) !== action.key);
      }
      return state.map((l) =>
        lineKey(l.handle, l.variantLabel) === action.key
          ? { ...l, qty: action.qty }
          : l,
      );

    case "remove":
      return state.filter((l) => lineKey(l.handle, l.variantLabel) !== action.key);

    case "clear":
      return [];
  }
}

type CartContextValue = {
  lines: ResolvedLine[];
  count: number;
  subtotalCents: number;
  /** False until localStorage has been read, so SSR and first paint agree. */
  ready: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  add: (handle: string, variantLabel: string | null, qty?: number) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [{ lines: rawLines, ready }, dispatch] = useReducer(reducer, {
    lines: [],
    ready: false,
  });
  const [isOpen, setIsOpen] = useState(false);

  // Read once on mount. Rendering the server markup first and hydrating the
  // basket afterwards avoids a hydration mismatch on the cart count.
  useEffect(() => {
    let restored: CartLine[] = [];
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const parsed: unknown = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        restored = parsed.flatMap((l): CartLine[] => {
          if (
            l &&
            typeof l === "object" &&
            typeof (l as CartLine).handle === "string" &&
            typeof (l as CartLine).qty === "number" &&
            (l as CartLine).qty > 0
          ) {
            const line = l as CartLine;
            return [
              {
                handle: line.handle,
                variantLabel:
                  typeof line.variantLabel === "string"
                    ? line.variantLabel
                    : null,
                qty: Math.floor(line.qty),
              },
            ];
          }
          return [];
        });
      }
    } catch {
      /* Private mode, blocked storage, corrupt JSON — start with an empty basket. */
    }
    // One dispatch, whatever happened: it both restores and marks us ready.
    dispatch({ type: "hydrate", lines: restored });
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rawLines));
    } catch {
      /* Storage full or blocked — the basket still works for this session. */
    }
  }, [rawLines, ready]);

  // Join to the catalogue. Anything unsellable is dropped rather than shown
  // at a price we cannot honour.
  const lines = useMemo<ResolvedLine[]>(() => {
    return rawLines.flatMap((line): ResolvedLine[] => {
      const product = products.find(
        (p) => p.handle === line.handle && p.status === "active",
      );
      if (!product) return [];

      const variant = product.variants.find(
        (v) => v.label === line.variantLabel,
      );
      if (!variant || variant.priceCents === null || !variant.available) {
        return [];
      }

      const qty = Math.max(1, Math.min(line.qty, variant.stock));
      if (variant.stock <= 0) return [];

      return [
        {
          key: lineKey(product.handle, variant.label),
          product,
          variant,
          qty,
          unitPriceCents: variant.priceCents,
          lineTotalCents: variant.priceCents * qty,
          clamped: qty !== line.qty,
        },
      ];
    });
  }, [rawLines]);

  const count = useMemo(
    () => lines.reduce((sum, l) => sum + l.qty, 0),
    [lines],
  );

  const subtotalCents = useMemo(
    () => lines.reduce((sum, l) => sum + l.lineTotalCents, 0),
    [lines],
  );

  const add = useCallback(
    (handle: string, variantLabel: string | null, qty = 1) => {
      dispatch({ type: "add", handle, variantLabel, qty });
      setIsOpen(true);
    },
    [],
  );

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count,
      subtotalCents,
      ready,
      isOpen,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      add,
      setQty: (key, qty) => dispatch({ type: "setQty", key, qty }),
      remove: (key) => dispatch({ type: "remove", key }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [lines, count, subtotalCents, ready, isOpen, add],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}

/** The order, as plain text, for the email hand-off. */
export function orderSummary(
  lines: ResolvedLine[],
  subtotalCents: number,
): string {
  const rows = lines.map((l) => {
    const name = l.variant.label
      ? `${l.product.name} (${l.variant.label})`
      : l.product.name;
    return `${l.qty} x ${name} — ${formatUSD(l.lineTotalCents)}`;
  });
  return [
    "I would like to order:",
    "",
    ...rows,
    "",
    `Subtotal: ${formatUSD(subtotalCents)}`,
    "",
    "Shipping address:",
    "",
  ].join("\n");
}
