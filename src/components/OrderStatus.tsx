"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef, useState } from "react";

import {
  submitPaymentProof,
  type OrderStatus,
  type ProofState,
} from "@/app/order/actions";
import Button, { buttonClass } from "@/components/ui/Button";
import Field from "@/components/ui/Field";
import { formatKes } from "@/lib/format";
import { formatKePhone, payments, whatsappLink } from "@/lib/site";

/**
 * The order status screen — the page the customer keeps coming back to.
 *
 * It does three things, in order of urgency: says what state the order is in,
 * tells them what to do next, and gives them a way to reach a human. The M-Pesa
 * panel only appears when there is actually money to send, because a payment
 * number shown next to an order that is already paid is how someone pays twice.
 */

type Props = {
  orderNumber: string;
  phone: string;
  status: OrderStatus;
  subtotalKes: number;
  deliveryFeeKes: number | null;
  totalKes: number | null;
  createdAt: string;
  items: {
    title: string;
    size: string | null;
    color: string | null;
    unitPriceKes: number;
    qty: number;
    lineTotalKes: number;
  }[];
};

const STATUS_COPY: Record<OrderStatus, { label: string; next: string }> = {
  awaiting_delivery_quote: {
    label: "Waiting on a delivery quote",
    next: "Send us your order number on WhatsApp and we will reply with the delivery fee for your address. Your items are held until then.",
  },
  awaiting_payment: {
    label: "Ready to pay",
    next: "Your delivery fee is confirmed. Pay the total below by M-Pesa, then enter the confirmation code.",
  },
  awaiting_payment_verification: {
    label: "Checking your payment",
    next: "We have your M-Pesa code and are confirming it. This is usually quick during business hours.",
  },
  paid: {
    label: "Paid",
    next: "Payment confirmed. We are getting your order ready.",
  },
  processing: {
    label: "Being prepared",
    next: "Your order is being packed for delivery.",
  },
  shipped: {
    label: "On its way",
    next: "Your order has left us and is on its way to you.",
  },
  delivered: {
    label: "Delivered",
    next: "Delivered. Thank you for shopping with us.",
  },
  cancelled: {
    label: "Cancelled",
    next: "This order was cancelled and any held items released. Place a new order, or message us if this is unexpected.",
  },
};

const BADGE: Record<OrderStatus, string> = {
  awaiting_delivery_quote: "border-champagne/40 text-champagne",
  awaiting_payment: "border-champagne/40 text-champagne",
  awaiting_payment_verification: "border-pearl/25 text-pearl/70",
  paid: "border-emerald-400/40 text-emerald-300",
  processing: "border-emerald-400/40 text-emerald-300",
  shipped: "border-emerald-400/40 text-emerald-300",
  delivered: "border-emerald-400/40 text-emerald-300",
  cancelled: "border-red-400/40 text-red-300",
};

export default function OrderStatusView(props: Props) {
  const {
    orderNumber,
    phone,
    status,
    subtotalKes,
    deliveryFeeKes,
    totalKes,
    items,
    createdAt,
  } = props;

  const copy = STATUS_COPY[status];
  const payable = status === "awaiting_payment";

  const wa = whatsappLink(
    `Hi Fashion Fiesta Hub, I would like to follow up on order ${orderNumber}.`,
  );

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-8">
        <section className="border border-pearl/10 bg-charcoal p-6 sm:p-8">
          <span
            className={`inline-block border px-3 py-1 font-body text-[10px] uppercase tracking-[0.25em] ${BADGE[status]}`}
          >
            {copy.label}
          </span>
          <h2 className="mt-4 font-display text-2xl text-pearl sm:text-3xl">
            Order {orderNumber}
          </h2>
          <p className="mt-3 font-body text-sm font-light leading-relaxed text-pearl/60">
            {copy.next}
          </p>

          {wa && (
            <a
              href={wa}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClass("primary", "md", "mt-6")}
            >
              Message us on WhatsApp
            </a>
          )}

          {!wa && payable && (
            <p className="mt-6 border border-pearl/10 px-4 py-3 font-body text-xs leading-relaxed text-pearl/50">
              Send the M-Pesa code below once you have paid. If you need the
              number, message or call us — we have not published it on the site
              yet.
            </p>
          )}
        </section>

        {payable && (
          <PayPanel
            orderNumber={orderNumber}
            phone={phone}
            total={totalKes ?? subtotalKes}
          />
        )}

        <section>
          <h3 className="mb-4 font-body text-[11px] uppercase tracking-[0.25em] text-pearl/50">
            What is in this order
          </h3>
          <ul className="divide-y divide-pearl/8 border border-pearl/10">
            {items.map((item, index) => (
              <li
                key={`${item.title}-${index}`}
                className="flex items-start gap-4 px-5 py-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-body text-sm text-pearl">{item.title}</p>
                  <p className="mt-0.5 font-body text-[11px] uppercase tracking-wider text-pearl/40">
                    {[item.color, item.size].filter(Boolean).join(" · ") || "—"}
                  </p>
                  <p className="mt-1 font-body text-[11px] text-pearl/40">
                    {item.qty} × {formatKes(item.unitPriceKes)}
                  </p>
                </div>
                <p className="shrink-0 font-body text-sm tabular-nums text-pearl">
                  {formatKes(item.lineTotalKes)}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="border border-pearl/10 bg-charcoal">
          <h3 className="border-b border-pearl/10 px-5 py-4 font-body text-[11px] uppercase tracking-[0.25em] text-pearl/60">
            Summary
          </h3>
          <dl className="space-y-3 px-5 py-5 font-body text-sm">
            <Row label="Subtotal" value={formatKes(subtotalKes)} />
            <Row
              label="Delivery"
              value={
                deliveryFeeKes === null
                  ? "Quoted per order"
                  : formatKes(deliveryFeeKes)
              }
              muted={deliveryFeeKes === null}
            />
            <div className="border-t border-pearl/10 pt-3">
              <Row
                label={totalKes === null ? "Total so far" : "Total"}
                value={formatKes(totalKes ?? subtotalKes)}
                strong
              />
            </div>
          </dl>
          {deliveryFeeKes === null && (
            <p className="border-t border-pearl/10 px-5 py-3 font-body text-[11px] font-light leading-relaxed text-pearl/40">
              This is the items only. The delivery fee is added once we have
              quoted it.
            </p>
          )}
        </div>

        <div className="border border-pearl/10 px-5 py-4">
          <p className="font-body text-[11px] uppercase tracking-[0.2em] text-pearl/45">
            Placed
          </p>
          <p className="mt-1 font-body text-sm text-pearl/70">
            {formatDate(createdAt)}
          </p>
          <p className="mt-4 font-body text-[11px] uppercase tracking-[0.2em] text-pearl/45">
            Contact
          </p>
          <p className="mt-1 font-body text-sm text-pearl/70">
            {maskPhone(phone)}
          </p>
        </div>

        <Link
          href="/"
          className={buttonClass("secondary", "md")}
        >
          Continue shopping
        </Link>
      </aside>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: string;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt
        className={`text-[11px] uppercase tracking-[0.2em] ${
          strong ? "text-pearl/70" : "text-pearl/50"
        }`}
      >
        {label}
      </dt>
      <dd
        className={`tabular-nums ${
          strong
            ? "text-lg text-pearl"
            : muted
              ? "text-xs text-pearl/45"
              : "text-pearl"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function PayPanel({
  orderNumber,
  phone,
  total,
}: {
  orderNumber: string;
  phone: string;
  total: number;
}) {
  const router = useRouter();

  // The generic is explicit because inferring it from the initial value would
  // narrow the state to `{ status: "idle" }` and make every later comparison a
  // type error.
  const [state, formAction, pending] = useActionState<ProofState, FormData>(
    submitPaymentProof,
    { status: "idle" },
  );

  const refreshed = useRef(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (state.status !== "ok" || refreshed.current) return;
    refreshed.current = true;
    // Re-render the server component so the badge and the copy move to
    // awaiting_payment_verification without the customer reloading.
    router.refresh();
  }, [state, router]);

  return (
    <section className="border border-champagne/30 bg-champagne/5 p-6 sm:p-8">
      <h3 className="font-body text-[11px] uppercase tracking-[0.25em] text-champagne">
        Pay {formatKes(total)}
      </h3>

      <ol className="mt-5 space-y-4 font-body text-sm font-light leading-relaxed text-pearl/70">
        <li className="flex gap-3">
          <span className="font-body text-[11px] tabular-nums text-champagne/70">
            01
          </span>
          <span>
            Open M-Pesa, choose{" "}
            <strong className="font-normal text-pearl">Send Money</strong>, and
            send{" "}
            <strong className="font-normal text-pearl">
              {formatKes(total)}
            </strong>{" "}
            to{" "}
            {payments.mpesaNumber ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(payments.mpesaNumber).then(
                      () => setCopied(true),
                      () => setCopied(false),
                    );
                  }}
                  className="font-body text-pearl underline decoration-champagne/50 underline-offset-4 transition-colors hover:text-champagne"
                >
                  {formatKePhone(payments.mpesaNumber)}
                </button>
                {copied && (
                  <span className="ml-2 font-body text-[10px] uppercase tracking-widest text-champagne">
                    copied
                  </span>
                )}
              </>
            ) : (
              <span className="text-pearl/50">
                the number we send you on WhatsApp
              </span>
            )}
            .
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-body text-[11px] tabular-nums text-champagne/70">
            02
          </span>
          <span>
            Copy the M-Pesa confirmation code from the message Safaricom sends
            you. It is ten characters.
          </span>
        </li>
        <li className="flex gap-3">
          <span className="font-body text-[11px] tabular-nums text-champagne/70">
            03
          </span>
          <span>Paste it below.</span>
        </li>
      </ol>

      <form action={formAction} className="mt-7 space-y-4">
        <input type="hidden" name="order_number" value={orderNumber} />
        <input type="hidden" name="phone" value={phone} />

        <Field
          label="M-Pesa confirmation code"
          name="mpesa_code"
          required
          autoComplete="off"
          autoCapitalize="characters"
          spellCheck={false}
          placeholder="SJL4K2M9QP"
          controlClassName="text-base uppercase tracking-[0.15em] placeholder:tracking-normal"
        />

        <Field
          label="Number you paid from"
          name="payment_phone"
          type="tel"
          inputMode="tel"
          placeholder="Only if it is different from above"
        />

        {state.status === "error" && (
          <p
            role="alert"
            className="border border-red-500/30 bg-red-500/5 px-4 py-3 font-body text-xs leading-relaxed text-red-300"
          >
            {state.message}
          </p>
        )}

        {state.status === "ok" && (
          <p
            role="status"
            className="border border-emerald-400/30 bg-emerald-400/5 px-4 py-3 font-body text-xs leading-relaxed text-emerald-300"
          >
            Thank you — we have your code and will confirm it shortly.
          </p>
        )}

        <Button
          type="submit"
          size="lg"
          disabled={pending || state.status === "ok"}
          className="w-full disabled:cursor-wait"
        >
          {pending ? "Sending…" : "I have paid"}
        </Button>

        <p className="font-body text-[11px] font-light leading-relaxed text-pearl/40">
          We check every code against our M-Pesa statement by hand before your
          order is marked paid. If anything looks wrong we will message you.
        </p>
      </form>
    </section>
  );
}

function formatDate(value: string): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-KE", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** 254712345678 -> 0712 345 678, so the customer recognises their own number. */
function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254") && digits.length === 12) {
    const local = `0${digits.slice(3)}`;
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return phone;
}