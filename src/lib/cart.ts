"use client";

/**
 * The cart, client-side and localStorage-backed.
 *
 * Deliberately NOT a server cart. There is no cart table, no cart id, no
 * session cookie — the cart is a list of variant ids and quantities in the
 * browser until checkout, at which point create_order validates every line
 * against live stock and re-reads every price. Nothing the browser holds is
 * trusted, so there is nothing to keep in sync server-side.
 *
 * Prices are cached on the line for display only. create_order ignores them.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartLine = {
  variantId: string;
  productSlug: string;
  title: string;
  size: string | null;
  color: string | null;
  sku: string;
  /** Display only. The order total is computed in Postgres, never here. */
  priceKes: number;
  qty: number;
  imageUrl: string | null;
};

type CartState = {
  lines: CartLine[];
  /** Drives the drawer. Separate from the drawer's own local open state so a
   *  component can open it from anywhere without prop drilling. */
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (variantId: string, qty: number) => void;
  remove: (variantId: string) => void;
  clear: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      isOpen: false,

      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      add: (line, qty = 1) =>
        set((state) => {
          const existing = state.lines.find(
            (l) => l.variantId === line.variantId,
          );

          // Adding the same variant twice increments rather than appending a
          // duplicate row — two identical lines in the drawer is a bug the
          // customer has to fix by hand.
          if (existing) {
            return {
              isOpen: true,
              lines: state.lines.map((l) =>
                l.variantId === line.variantId
                  ? { ...l, qty: l.qty + qty }
                  : l,
              ),
            };
          }

          return { isOpen: true, lines: [...state.lines, { ...line, qty }] };
        }),

      setQty: (variantId, qty) =>
        set((state) => ({
          lines:
            qty <= 0
              ? state.lines.filter((l) => l.variantId !== variantId)
              : state.lines.map((l) =>
                  l.variantId === variantId ? { ...l, qty } : l,
                ),
        })),

      remove: (variantId) =>
        set((state) => ({
          lines: state.lines.filter((l) => l.variantId !== variantId),
        })),

      clear: () => set({ lines: [] }),
    }),
    {
      name: "ffh-cart",
      // isOpen is transient UI state: persisting it means returning to the
      // site with the drawer already thrown open over the homepage.
      partialize: (state) => ({ lines: state.lines }),
    },
  ),
);

/** Item count for the header badge. Sums quantities, not lines. */
export const cartCount = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.qty, 0);

/**
 * Subtotal for display. Named `estimate` on purpose: the authoritative figure
 * is computed in create_order from live variant prices, and this can be stale
 * if a price changed while the cart sat in localStorage.
 */
export const cartSubtotal = (lines: CartLine[]) =>
  lines.reduce((sum, l) => sum + l.priceKes * l.qty, 0);