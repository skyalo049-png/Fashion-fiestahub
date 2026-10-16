"use server";

import { revalidatePath } from "next/cache";

import { type ActionResult } from "@/lib/action-state";
import { explainAdmin } from "@/lib/admin";
import { createSessionSupabase } from "@/lib/supabase/session";

/**
 * Staff writes against an order.
 *
 * Every one of these is a thin wrapper over a security-definer function that
 * re-checks is_staff() itself. That is deliberate: this file validates the
 * SHAPE of the input (is the fee a non-negative whole number?) and nothing
 * else. It never decides who may call it, because a check here would be a
 * second, weaker copy of the one in the database, and the database's is the
 * only one that survives someone talking to PostgREST directly.
 */

function fail(error: unknown): ActionResult {
  return { status: "error", message: explainAdmin(error) };
}

/**
 * Quote a delivery fee.
 *
 * This is the step that has been missing since checkout was built. create_order
 * parks an order at awaiting_delivery_quote with delivery_fee_kes NULL and the
 * total unset; this is what turns it into something payable.
 */
export async function quoteDelivery(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const orderNumber = String(formData.get("order_number") ?? "").trim();
  const feeRaw = String(formData.get("fee_kes") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!orderNumber) return { status: "error", message: "Missing order number." };

  // Number("") is 0, which would silently quote free delivery on an empty box.
  if (feeRaw === "") {
    return { status: "error", message: "Enter the delivery fee." };
  }

  const fee = Number(feeRaw);
  if (!Number.isInteger(fee) || fee < 0) {
    return {
      status: "error",
      message: "Enter a whole number of shillings, 0 or more.",
    };
  }

  const supabase = await createSessionSupabase();
  const { error } = await supabase.rpc("quote_delivery", {
    p_order_number: orderNumber,
    p_fee_kes: fee,
    p_note: note || undefined,
  });

  if (error) return fail(error);

  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/admin/orders");
  return {
    status: "ok",
    message: `Quoted at KSh ${fee}. The customer can now pay and submit the code.`,
  };
}

/**
 * Approve or reject the M-Pesa code the customer submitted.
 *
 * The only way an order reaches `paid`, and the only thing that decrements
 * stock_qty and writes a `sale` ledger row. Rejecting returns the order to
 * awaiting_payment so the customer can try again with the right code.
 */
export async function verifyPayment(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const orderNumber = String(formData.get("order_number") ?? "").trim();
  const approve = String(formData.get("approve") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();

  if (!orderNumber) return { status: "error", message: "Missing order number." };

  const supabase = await createSessionSupabase();
  const { error } = await supabase.rpc("verify_payment", {
    p_order_number: orderNumber,
    p_approve: approve,
    p_reason: reason || undefined,
  });

  if (error) return fail(error);

  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/admin/orders");

  return {
    status: "ok",
    message: approve
      ? "Payment confirmed. Stock has been decremented and the sale recorded."
      : "Payment rejected. The order is back with the customer.",
  };
}

/**
 * Advance an order after payment: processing -> shipped -> delivered, or
 * cancel it.
 *
 * set_order_status() refuses to set `paid` — only verify_payment may do that —
 * so this cannot be used to mark an order paid without a confirmed code.
 */
export async function advanceStatus(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const orderNumber = String(formData.get("order_number") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();

  if (!orderNumber) return { status: "error", message: "Missing order number." };
  if (!status) return { status: "error", message: "Pick a status." };

  const supabase = await createSessionSupabase();
  const { error } = await supabase.rpc("set_order_status", {
    p_order_number: orderNumber,
    p_status: status,
    p_note: note || undefined,
  });

  if (error) return fail(error);

  revalidatePath(`/admin/orders/${orderNumber}`);
  revalidatePath("/admin/orders");
  return { status: "ok", message: `Order moved to ${status.replaceAll("_", " ")}.` };
}
