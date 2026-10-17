"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { buttonClass } from "@/components/ui/Button";
import { cartSubtotal, useCart } from "@/lib/cart";
import { formatKes } from "@/lib/format";

/**
 * The bag.
 *
 * A dialog, not a page: the customer is never navigated away from what they
 * were looking at. Escape closes, the backdrop closes, and focus moves into
 * the panel so a keyboard or screen-reader user is not left behind it.
 *
 * The subtotal shown is an estimate — it is the price cached in localStorage
 * when the item was added. create_order re-reads every price from
 * product_variants and that figure is the one that becomes the order.
 */
export default function CartDrawer() {
  const { lines, isOpen, close, setQty, remove } = useCart();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);

    // Stop the page behind the drawer scrolling on touch devices, which
    // otherwise scrolls the wrong thing while the drawer is open.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [isOpen, close]);

  if (!isOpen) return null;

  const subtotal = cartSubtotal(lines);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Close bag"
        onClick={close}
        className="absolute inset-0 bg-overlay-scrim backdrop-blur-sm"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping bag"
        tabIndex={-1}
        className="relative flex h-full w-full max-w-md flex-col border-l border-border-subtle bg-surface-raised outline-none"
      >
        <div className="flex items-center justify-between border-b border-border-subtle px-6 py-5">
          <h2 className="font-body text-xs uppercase tracking-[0.3em] text-text-primary/60">
            Your bag
          </h2>
          <button
            type="button"
            onClick={close}
            className="font-body text-xs uppercase tracking-[0.2em] text-text-primary/45 transition-colors hover:text-accent"
          >
            Close
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="font-body text-sm font-light text-text-primary/50">
              Nothing in the bag yet.
            </p>
            <Link
              href="/"
              onClick={close}
              className="font-body text-xs uppercase tracking-[0.2em] text-accent underline-offset-4 hover:underline"
            >
              Browse the collection
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-border-subtle overflow-y-auto">
              {lines.map((line) => (
                <li key={line.variantId} className="flex gap-4 px-6 py-5">
                  <div className="h-24 w-20 shrink-0 overflow-hidden bg-surface-base">
                    {line.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.imageUrl}
                        alt={line.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-raised to-surface-base">
                        <span className="font-display text-2xl text-accent/25">
                          {line.title.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-2">
                    <div>
                      <Link
                        href={`/product/${line.productSlug}`}
                        onClick={close}
                        className="font-display text-sm leading-snug text-text-primary hover:text-accent"
                      >
                        {line.title}
                      </Link>
                      <p className="mt-1 font-body text-[10px] uppercase tracking-[0.15em] text-text-primary/40">
                        {[line.color, line.size].filter(Boolean).join(" · ") ||
                          line.sku}
                      </p>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center border border-border-default">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          onClick={() => setQty(line.variantId, line.qty - 1)}
                          className="inline-flex h-11 w-11 items-center justify-center font-body text-sm text-text-primary/70 transition-colors hover:text-accent"
                        >
                          −
                        </button>
                        <span className="min-w-6 text-center font-body text-sm tabular-nums text-text-primary">
                          {line.qty}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          onClick={() => setQty(line.variantId, line.qty + 1)}
                          className="inline-flex h-11 w-11 items-center justify-center font-body text-sm text-text-primary/70 transition-colors hover:text-accent"
                        >
                          +
                        </button>
                      </div>

                      <span className="font-body text-sm tabular-nums text-accent">
                        {formatKes(line.priceKes * line.qty)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => remove(line.variantId)}
                      className="self-start font-body text-[10px] uppercase tracking-[0.15em] text-text-primary/35 underline-offset-4 hover:text-text-primary/70 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>

            <div className="border-t border-border-subtle px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="font-body text-xs uppercase tracking-[0.2em] text-text-primary/50">
                  Subtotal
                </span>
                <span className="font-body text-lg tabular-nums text-text-primary">
                  {formatKes(subtotal)}
                </span>
              </div>

              {/* Set the expectation here rather than surprising them on the
                  confirmation screen. The order genuinely has no total yet. */}
              <p className="mt-2 font-body text-[11px] font-light leading-relaxed text-text-primary/40">
                Delivery is quoted per order. We confirm it on WhatsApp before
                you pay.
              </p>

              <Link
                href="/checkout"
                onClick={close}
                className={buttonClass("primary", "lg", "mt-5 w-full")}
              >
                Checkout
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}