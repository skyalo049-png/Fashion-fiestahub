"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  advanceStatus,
  quoteDelivery,
  verifyPayment,
} from "@/app/admin/order-actions";
import { INITIAL_ACTION, type ActionResult } from "@/lib/action-state";

/**
 * The three staff actions on an order, each rendered only when it is legal for
 * the order's current status.
 *
 * The database refuses an illegal transition regardless — set_order_status
 * raises `invalid_transition` — so hiding the button is about not offering a
 * control that is guaranteed to fail, not about enforcement. If someone
 * un-hides one, the error still comes back and renders.
 */

function Submit({
  children,
  pendingLabel,
  tone = "primary",
}: {
  children: React.ReactNode;
  pendingLabel: string;
  tone?: "primary" | "danger";
}) {
  const { pending } = useFormStatus();
  const classes =
    tone === "danger"
      ? "border-red-400/40 text-red-300/90 hover:bg-red-400/10"
      : "bg-champagne text-obsidian hover:bg-champagne-light";

  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-full border px-5 py-3 font-body text-[11px] uppercase tracking-[0.25em] transition-colors disabled:opacity-60 ${
        tone === "danger" ? classes : `border-transparent ${classes}`
      }`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

function Feedback({ state }: { state: ActionResult }) {
  if (state.status === "idle") return null;
  const ok = state.status === "ok";
  return (
    <p
      role="status"
      className={`mt-3 border-l-2 px-3 py-2 font-body text-xs ${
        ok
          ? "border-emerald-400/60 bg-emerald-400/5 text-emerald-200/90"
          : "border-red-400/60 bg-red-400/5 text-red-300/90"
      }`}
    >
      {state.message}
    </p>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border border-pearl/10 p-6">
      <h2 className="font-body text-[10px] uppercase tracking-[0.25em] text-champagne">
        {title}
      </h2>
      <div className="mt-5">{children}</div>
    </section>
  );
}

export function QuoteDeliveryForm({
  orderNumber,
  currentFee,
}: {
  orderNumber: string;
  currentFee: number | null;
}) {
  const [state, action] = useActionState<ActionResult, FormData>(
    quoteDelivery,
    INITIAL_ACTION,
  );

  return (
    <Card title={currentFee === null ? "Quote delivery" : "Re-quote delivery"}>
      <form action={action}>
        <input type="hidden" name="order_number" value={orderNumber} />

        <label
          htmlFor="fee_kes"
          className="block font-body text-[11px] uppercase tracking-[0.2em] text-pearl/50"
        >
          Delivery fee (KSh)
        </label>
        <input
          id="fee_kes"
          name="fee_kes"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          required
          defaultValue={currentFee ?? ""}
          className="mt-2 w-full border border-pearl/15 bg-obsidian px-4 py-3 font-body text-sm text-pearl outline-none transition-colors focus:border-champagne"
        />

        <label
          htmlFor="quote_note"
          className="mt-4 block font-body text-[11px] uppercase tracking-[0.2em] text-pearl/50"
        >
          Note to customer (optional)
        </label>
        <textarea
          id="quote_note"
          name="note"
          rows={2}
          placeholder="e.g. 350 to Nakuru, sent by Easy Coach tomorrow"
          className="mt-2 w-full border border-pearl/15 bg-obsidian px-4 py-3 font-body text-sm text-pearl outline-none transition-colors placeholder:text-pearl/25 focus:border-champagne"
        />

        <div className="mt-5">
          <Submit pendingLabel="Saving…">
            {currentFee === null ? "Send quote" : "Update quote"}
          </Submit>
        </div>
        <Feedback state={state} />
      </form>
    </Card>
  );
}

export function VerifyPaymentForm({
  orderNumber,
  mpesaCode,
  paymentPhone,
}: {
  orderNumber: string;
  mpesaCode: string | null;
  paymentPhone: string | null;
}) {
  const [state, action] = useActionState<ActionResult, FormData>(
    verifyPayment,
    INITIAL_ACTION,
  );

  return (
    <Card title="Verify payment">
      <dl className="mb-5 space-y-2">
        <div className="flex justify-between gap-4">
          <dt className="font-body text-[11px] uppercase tracking-[0.15em] text-pearl/40">
            M-Pesa code
          </dt>
          <dd className="font-body text-sm tracking-wider text-pearl">
            {mpesaCode ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="font-body text-[11px] uppercase tracking-[0.15em] text-pearl/40">
            Paid from
          </dt>
          <dd className="font-body text-sm text-pearl/80">{paymentPhone ?? "—"}</dd>
        </div>
      </dl>

      <p className="mb-5 font-body text-[11px] font-light leading-relaxed text-pearl/40">
        Check the code against the M-Pesa statement before approving. Approving
        is what decrements stock and writes the sale to the ledger — it cannot be
        done twice.
      </p>

      <form action={action}>
        <input type="hidden" name="order_number" value={orderNumber} />

        <label
          htmlFor="verify_reason"
          className="block font-body text-[11px] uppercase tracking-[0.2em] text-pearl/50"
        >
          Reason (optional, shown to customer)
        </label>
        <input
          id="verify_reason"
          name="reason"
          className="mt-2 w-full border border-pearl/15 bg-obsidian px-4 py-3 font-body text-sm text-pearl outline-none transition-colors focus:border-champagne"
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <button
            type="submit"
            name="approve"
            value="true"
            className="border border-transparent bg-champagne px-5 py-3 font-body text-[11px] uppercase tracking-[0.25em] text-obsidian transition-colors hover:bg-champagne-light"
          >
            Approve payment
          </button>
          <button
            type="submit"
            name="approve"
            value="false"
            className="border border-red-400/40 px-5 py-3 font-body text-[11px] uppercase tracking-[0.25em] text-red-300/90 transition-colors hover:bg-red-400/10"
          >
            Reject
          </button>
        </div>
        <Feedback state={state} />
      </form>
    </Card>
  );
}

/**
 * Statuses an order can be moved to from where it is.
 *
 * `paid` is absent from every list on purpose: only verify_payment sets it, and
 * set_order_status refuses it outright. An order reaches `paid` through a
 * confirmed M-Pesa code, never through a dropdown.
 */
const NEXT_STATUSES: Record<string, string[]> = {
  paid: ["processing", "shipped", "delivered", "cancelled"],
  processing: ["shipped", "delivered", "cancelled"],
  shipped: ["delivered", "cancelled"],
  delivered: [],
  cancelled: [],
  awaiting_delivery_quote: ["cancelled"],
  awaiting_payment: ["cancelled"],
  awaiting_payment_verification: ["cancelled"],
};

export function AdvanceStatusForm({
  orderNumber,
  status,
}: {
  orderNumber: string;
  status: string;
}) {
  const [state, action] = useActionState<ActionResult, FormData>(
    advanceStatus,
    INITIAL_ACTION,
  );

  const options = NEXT_STATUSES[status] ?? [];
  if (options.length === 0) return null;

  return (
    <Card title="Advance order">
      <form action={action}>
        <input type="hidden" name="order_number" value={orderNumber} />

        <label
          htmlFor="next_status"
          className="block font-body text-[11px] uppercase tracking-[0.2em] text-pearl/50"
        >
          Move to
        </label>
        <select
          id="next_status"
          name="status"
          defaultValue={options[0]}
          className="mt-2 w-full border border-pearl/15 bg-obsidian px-4 py-3 font-body text-sm text-pearl outline-none transition-colors focus:border-champagne"
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>

        <label
          htmlFor="status_note"
          className="mt-4 block font-body text-[11px] uppercase tracking-[0.2em] text-pearl/50"
        >
          Note (optional, shown to customer)
        </label>
        <input
          id="status_note"
          name="note"
          placeholder="e.g. handed to the courier"
          className="mt-2 w-full border border-pearl/15 bg-obsidian px-4 py-3 font-body text-sm text-pearl outline-none transition-colors placeholder:text-pearl/25 focus:border-champagne"
        />

        <div className="mt-5">
          <Submit pendingLabel="Updating…">Update status</Submit>
        </div>
        <Feedback state={state} />
      </form>
    </Card>
  );
}