"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  advanceStatus,
  quoteDelivery,
  verifyPayment,
} from "@/app/admin/order-actions";
import { INITIAL_ACTION, type ActionResult } from "@/lib/action-state";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";

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

  return (
    <Button
      type="submit"
      variant={tone === "danger" ? "danger" : "primary"}
      disabled={pending}
      className="w-full"
    >
      {pending ? pendingLabel : children}
    </Button>
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

        <Field
          label="Delivery fee (KSh)"
          name="fee_kes"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          required
          defaultValue={currentFee ?? ""}
        />

        <Field
          label="Note to customer (optional)"
          name="note"
          as="textarea"
          rows={2}
          placeholder="e.g. 350 to Nakuru, sent by Easy Coach tomorrow"
          className="mt-4"
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

        <Field
          label="Reason (optional, shown to customer)"
          name="reason"
        />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Button type="submit" name="approve" value="true">
            Approve payment
          </Button>
          <Button type="submit" name="approve" value="false" variant="danger">
            Reject
          </Button>
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

        <Field
          label="Move to"
          name="status"
          as="select"
          defaultValue={options[0]}
        >
          {options.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </Field>

        <Field
          label="Note (optional, shown to customer)"
          name="note"
          placeholder="e.g. handed to the courier"
          className="mt-4"
        />

        <div className="mt-5">
          <Submit pendingLabel="Updating…">Update status</Submit>
        </div>
        <Feedback state={state} />
      </form>
    </Card>
  );
}