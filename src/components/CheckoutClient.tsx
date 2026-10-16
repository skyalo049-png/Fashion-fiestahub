"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useRef, useState } from "react";

import { placeOrder, type CheckoutState } from "@/app/checkout/actions";
import Button, { buttonClass } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { cartSubtotal, useCart } from "@/lib/cart";
import { formatKes } from "@/lib/format";

/**
 * Checkout.
 *
 * One page, no account, no steps. The cart lines are read from localStorage and
 * posted as variant ids and quantities — the prices rendered here are for the
 * customer's benefit and are not sent. create_order reads the live price from
 * the database, so a stale localStorage total cannot become an order total.
 *
 * There is no delivery-zone selector and no fee shown, because the fee is
 * quoted by hand per order. The customer is told that plainly here and on the
 * confirmation screen rather than being surprised by it later, and the order
 * lands in awaiting_delivery_quote for staff to pick up.
 *
 * The address is deliberately one field. A six-field Kenyan address form asks a
 * shopper to type the same town name three times to satisfy a schema, which is
 * friction for no gain when a human is quoting the delivery anyway. Town or
 * city is required; everything a rider actually needs — estate, building, gate
 * code, landmark, which sacco — goes in the notes, and the notes reach staff on
 * the order.
 */

const INITIAL: CheckoutState = { status: "idle" };

/**
 * A datalist, not a select, and a hint rather than a constraint. Delivery in
 * Kenya is priced by town, and these are the ones this shop quotes most often —
 * but a customer in a town that is not on the list must still be able to check
 * out. Free text with suggestions is the right shape for that; a <select> with
 * a missing option is a customer who cannot buy.
 */
const TOWNS = [
  "Nairobi",
  "Nakuru",
  "Mombasa",
  "Kisumu",
  "Thika",
  "Nyeri",
  "Eldoret",
  "Machakos",
  "Kajiado",
  "Kericho",
  "Naivasha",
  "Malindi",
];

export default function CheckoutClient() {
  const router = useRouter();
  const lines = useCart((s) => s.lines);
  const clear = useCart((s) => s.clear);

  // localStorage is not available during the server render, so the first
  // client render must match the server's empty output before it can read the
  // real cart. Without this the page throws a hydration mismatch on every
  // visit with a non-empty bag.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [state, formAction, pending] = useActionState(placeOrder, INITIAL);
  const cleared = useRef(false);

  useEffect(() => {
    if (state.status !== "done") return;
    // Once. React may run this effect twice in development, and clearing is
    // idempotent but navigating twice would add a duplicate history entry.
    if (cleared.current) return;
    cleared.current = true;
    clear();
    router.replace(`/order/${state.orderNumber}`);
  }, [state, clear, router]);

  const subtotal = useMemo(() => cartSubtotal(lines), [lines]);
  const items = useMemo(
    () => lines.map((line) => ({ variant_id: line.variantId, qty: line.qty })),
    [lines],
  );

  if (!mounted) {
    return (
      <p className="font-body text-sm text-text-primary/40" aria-live="polite">
        Loading your bag…
      </p>
    );
  }

  if (lines.length === 0 && state.status !== "done") {
    return (
      <div className="border border-border-subtle bg-surface-raised px-6 py-14 text-center">
        <p className="font-display text-xl text-text-primary">Your bag is empty</p>
        <p className="mt-2 font-body text-sm font-light text-text-primary/50">
          There is nothing to check out yet.
        </p>
        <Link
          href="/"
          className={buttonClass("outline", "md", "mt-7")}
        >
          Browse the collection
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="grid gap-10 lg:grid-cols-[1fr_360px]">
      {/* The whole cart, as ids and quantities. Prices are not sent because
          create_order will not read them. */}
      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="space-y-10">
        <Section title="Your details">
          <Field
            label="Full name"
            name="full_name"
            autoComplete="name"
            required
          />
          <Field
            label="Phone number"
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            placeholder="07XX XXX XXX"
            hint="We use this to reach you about delivery, and to find your order later."
            required
          />
          <Field
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            hint="Optional. Only used if you would rather we email you."
          />
        </Section>

        <Section title="Delivery">
          <Field
            label="Town or city"
            name="city"
            list="ffh-towns"
            autoComplete="address-level2"
            placeholder="Nakuru"
            hint="Delivery is quoted per order — we confirm the fee on WhatsApp before you pay."
            required
          />
          <datalist id="ffh-towns">
            {TOWNS.map((town) => (
              <option key={town} value={town} />
            ))}
          </datalist>
          <Field
            label="Delivery notes"
            name="notes"
            as="textarea"
            rows={3}
            placeholder="Estate, gate code, a landmark, the best time to call…"
          />
        </Section>
      </div>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border border-border-subtle bg-surface-raised">
          <h2 className="border-b border-border-subtle px-5 py-4 font-body text-[11px] uppercase tracking-[0.25em] text-text-primary/60">
            Your bag
          </h2>

          <ul className="divide-y divide-border-subtle">
            {lines.map((line) => (
              <li key={line.variantId} className="flex gap-3 px-5 py-4">
                <div className="h-16 w-13 shrink-0 overflow-hidden bg-surface-base">
                  {line.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={line.imageUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center font-display text-lg text-accent/40">
                      {line.title.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-body text-sm text-text-primary">
                    {line.title}
                  </p>
                  <p className="mt-0.5 font-body text-[11px] uppercase tracking-wider text-text-primary/40">
                    {[line.color, line.size].filter(Boolean).join(" · ") ||
                      line.sku}
                  </p>
                  <p className="mt-1 font-body text-[11px] text-text-primary/40">
                    Qty {line.qty}
                  </p>
                </div>
                <p className="shrink-0 font-body text-sm tabular-nums text-text-primary">
                  {formatKes(line.priceKes * line.qty)}
                </p>
              </li>
            ))}
          </ul>

          <div className="border-t border-border-subtle px-5 py-4">
            <div className="flex items-baseline justify-between">
              <span className="font-body text-xs uppercase tracking-[0.2em] text-text-primary/60">
                Subtotal
              </span>
              <span className="font-body text-lg tabular-nums text-text-primary">
                {formatKes(subtotal)}
              </span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="font-body text-xs uppercase tracking-[0.2em] text-text-primary/60">
                Delivery
              </span>
              <span className="font-body text-xs text-text-primary/45">
                Quoted per order
              </span>
            </div>
            <p className="mt-3 font-body text-[11px] font-light leading-relaxed text-text-primary/40">
              We do not guess at delivery. Once we see your address we send the
              exact fee on WhatsApp, and you pay the subtotal plus that fee in
              one M-Pesa payment.
            </p>
          </div>
        </div>

        {state.status === "error" && (
          <p
            role="alert"
            className="mt-5 border border-red-500/30 bg-red-500/5 px-4 py-3 font-body text-xs leading-relaxed text-red-300"
          >
            {state.message}
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={pending || state.status === "done"}
          className="mt-5 w-full disabled:cursor-wait"
        >
          {pending || state.status === "done"
            ? "Placing your order…"
            : "Place order"}
        </Button>

        <p className="mt-3 text-center font-body text-[11px] font-light text-text-primary/35">
          You will get an order number immediately. Nothing is charged yet.
        </p>
      </aside>
    </form>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="mb-5 font-body text-[11px] uppercase tracking-[0.25em] text-text-primary/60">
        {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

