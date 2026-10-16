import Link from "next/link";
import { notFound } from "next/navigation";

import {
  AdvanceStatusForm,
  QuoteDeliveryForm,
  VerifyPaymentForm,
} from "@/components/admin/OrderActions";
import { ORDER_STATUS_LABEL, STATUS_TONE } from "@/lib/admin";
import { getOrderDetail } from "@/lib/admin-orders";
import { formatKes, formatWhen } from "@/lib/format";

export const metadata = { title: "Order" };

/**
 * One order, and the three things staff do to it.
 *
 * The forms are ordered by what the order is waiting on, not by what the
 * database allows: a quote form on an order that already has a fee is a way to
 * change a number the customer has already been told, and it should not be the
 * first thing on the screen. So the card matching the current status comes
 * first, and the rest follow.
 *
 * The events list at the bottom is not decoration. It is the only place a
 * disagreement about "I sent the money on Tuesday" can be settled, and it is
 * written by the database functions themselves, so it cannot be missing an
 * entry that a UI forgot to record.
 */

const EVENT_LABEL: Record<string, string> = {
  order_created: "Order placed",
  delivery_quoted: "Delivery quoted",
  payment_submitted: "Customer submitted a code",
  payment_verified: "Payment confirmed",
  payment_rejected: "Payment rejected",
  status_changed: "Status changed",
  cancelled: "Cancelled",
};

/** A one-line summary of an event's payload, or null when there is nothing. */
function eventDetail(payload: Record<string, unknown> | null): string | null {
  if (!payload) return null;

  const parts: string[] = [];
  const from = payload.from;
  const to = payload.to;
  const note = payload.note;
  const reason = payload.reason;
  const code = payload.mpesa_code ?? payload.mpesa;

  if (typeof from === "string" && typeof to === "string") {
    parts.push(`${from.replaceAll("_", " ")} → ${to.replaceAll("_", " ")}`);
  }
  if (typeof code === "string" && code) parts.push(code);
  if (typeof note === "string" && note) parts.push(note);
  if (typeof reason === "string" && reason) parts.push(reason);

  return parts.length ? parts.join(" · ") : null;
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number } = await params;
  const order = await getOrderDetail(number);

  // A wrong order number and an order that is not ours to see are the same
  // answer to the person asking: not found.
  if (!order) notFound();

  const needsQuote = order.deliveryFeeKes === null;
  const needsVerification = order.status === "awaiting_payment_verification";

  const whatsapp = order.customer.phone
    ? `https://wa.me/${order.customer.phone.replace(/[^0-9]/g, "")}`
    : null;

  return (
    <div>
      <Link
        href="/admin/orders"
        className="font-body text-[11px] uppercase tracking-[0.2em] text-pearl/40 transition-colors hover:text-champagne"
      >
        ← Orders
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4 border-b border-pearl/10 pb-6">
        <div>
          <p className="font-mono text-lg text-pearl">{order.orderNumber}</p>
          <p className="mt-1 font-body text-xs text-pearl/40">
            Placed {formatWhen(order.createdAt)}
          </p>
        </div>
        <span
          className={[
            "border px-3 py-1 font-body text-[10px] uppercase tracking-[0.2em]",
            STATUS_TONE[order.status] ?? "border-pearl/20 text-pearl/60",
          ].join(" ")}
        >
          {ORDER_STATUS_LABEL[order.status] ?? order.status}
        </span>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* ---------------- left: what was ordered ---------------- */}
        <div className="space-y-8">
          <section className="border border-pearl/10">
            <h2 className="border-b border-pearl/10 px-5 py-4 font-body text-[10px] uppercase tracking-[0.25em] text-champagne">
              Items
            </h2>
            <ul className="divide-y divide-pearl/10">
              {order.items.map((item, i) => (
                <li
                  key={`${item.sku}-${i}`}
                  className="flex flex-wrap items-start justify-between gap-3 px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="font-body text-sm text-pearl">{item.title}</p>
                    <p className="mt-1 font-mono text-[11px] text-pearl/40">
                      {item.sku}
                      {item.size ? ` · ${item.size}` : ""}
                      {item.color ? ` · ${item.color}` : ""}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-body text-sm text-pearl">
                      {formatKes(item.lineTotalKes)}
                    </p>
                    <p className="mt-1 font-body text-[11px] text-pearl/40">
                      {item.qty} × {formatKes(item.unitPriceKes)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <dl className="space-y-2 border-t border-pearl/10 px-5 py-4 font-body text-sm">
              <div className="flex justify-between text-pearl/60">
                <dt>Subtotal</dt>
                <dd>{formatKes(order.subtotalKes)}</dd>
              </div>
              <div className="flex justify-between text-pearl/60">
                <dt>Delivery</dt>
                <dd>
                  {order.deliveryFeeKes === null
                    ? "Not quoted yet"
                    : formatKes(order.deliveryFeeKes)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-pearl/10 pt-2 text-pearl">
                <dt className="font-body text-[11px] uppercase tracking-[0.2em]">
                  Total
                </dt>
                <dd>
                  {order.totalKes === null
                    ? "—"
                    : formatKes(order.totalKes)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="border border-pearl/10">
            <h2 className="border-b border-pearl/10 px-5 py-4 font-body text-[10px] uppercase tracking-[0.25em] text-champagne">
              Customer
            </h2>
            <div className="space-y-3 px-5 py-4 font-body text-sm">
              <p className="text-pearl">{order.customer.fullName}</p>
              <p className="text-pearl/60">{order.customer.phone}</p>
              {order.customer.email ? (
                <p className="text-pearl/60">{order.customer.email}</p>
              ) : null}
              {order.customer.city ? (
                <p className="text-pearl/60">Deliver to {order.customer.city}</p>
              ) : null}
              {order.notes ? (
                <p className="border-l-2 border-pearl/15 pl-3 text-pearl/50">
                  {order.notes}
                </p>
              ) : null}

              {whatsapp ? (
                <a
                  href={whatsapp}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block border border-champagne/50 px-4 py-2 font-body text-[11px] uppercase tracking-[0.2em] text-champagne transition-colors hover:bg-champagne/10"
                >
                  Message on WhatsApp
                </a>
              ) : null}
            </div>
          </section>

          <section className="border border-pearl/10">
            <h2 className="border-b border-pearl/10 px-5 py-4 font-body text-[10px] uppercase tracking-[0.25em] text-champagne">
              History
            </h2>
            {order.events.length === 0 ? (
              <p className="px-5 py-4 font-body text-sm text-pearl/40">
                Nothing recorded yet.
              </p>
            ) : (
              <ul className="divide-y divide-pearl/10">
                {order.events.map((event, i) => {
                  const detail = eventDetail(event.payload);
                  return (
                    <li key={i} className="px-5 py-4">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-body text-sm text-pearl/80">
                          {EVENT_LABEL[event.type] ?? event.type}
                        </p>
                        <p className="font-body text-[11px] text-pearl/35">
                          {formatWhen(event.createdAt)}
                        </p>
                      </div>
                      {detail ? (
                        <p className="mt-1 font-body text-xs text-pearl/45">
                          {detail}
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>

        {/* ---------------- right: what to do about it ---------------- */}
        <div className="space-y-5">
          {needsVerification ? (
            <section className="border border-champagne/40 p-6">
              <h2 className="font-body text-[10px] uppercase tracking-[0.25em] text-champagne">
                Payment claimed
              </h2>
              <dl className="mt-4 space-y-2 font-body text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-pearl/50">M-Pesa code</dt>
                  <dd className="font-mono text-pearl">
                    {order.mpesaCode ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-pearl/50">Paid from</dt>
                  <dd className="font-mono text-pearl/80">
                    {order.paymentPhone ?? "—"}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-pearl/50">Submitted</dt>
                  <dd className="text-pearl/80">
                    {formatWhen(order.paymentSubmittedAt)}
                  </dd>
                </div>
              </dl>
              <p className="mt-4 font-body text-xs text-pearl/45">
                Match that code against the M-Pesa message before approving.
                Approving is what takes the stock off the shelf.
              </p>
            </section>
          ) : null}

          {needsQuote || !needsVerification ? (
            <QuoteDeliveryForm
              orderNumber={order.orderNumber}
              currentFee={order.deliveryFeeKes}
            />
          ) : null}

          {needsVerification ? (
            <VerifyPaymentForm
              orderNumber={order.orderNumber}
              mpesaCode={order.mpesaCode}
              paymentPhone={order.paymentPhone}
            />
          ) : null}

          <AdvanceStatusForm
            orderNumber={order.orderNumber}
            status={order.status}
          />
        </div>
      </div>
    </div>
  );
}