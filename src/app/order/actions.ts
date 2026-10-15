"use server";

import { revalidatePath } from "next/cache";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * The customer's half of the M-Pesa flow.
 *
 * The code typed here is a CLAIM, never a verification. submit_payment_proof
 * records it, checks its shape, rate limits the attempt and moves the order to
 * awaiting_payment_verification — that is all. Verification is verify_payment,
 * which is staff-only and compares the code against the actual M-Pesa
 * statement. Nothing reachable from this file can mark an order paid.
 *
 * The order number and phone arrive as hidden form fields rather than being
 * read from a session. A customer checking out has no account and no session,
 * and inventing one for this would be a larger surface than it is worth. The
 * database demands both halves match, so a forged form still cannot touch an
 * order it does not already hold the credentials for.
 */

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export type ProofState =
  | { status: "idle" }
  | { status: "ok" }
  | { status: "error"; message: string };

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function submitPaymentProof(
  _prev: ProofState,
  formData: FormData,
): Promise<ProofState> {
  const orderNumber = field(formData, "order_number");
  const phone = field(formData, "phone");
  const mpesaCode = field(formData, "mpesa_code");
  const paymentPhone = field(formData, "payment_phone");

  if (!orderNumber || !phone) {
    return {
      status: "error",
      message: "We lost track of this order. Reload the page and try again.",
    };
  }

  if (!mpesaCode) {
    return {
      status: "error",
      message: "Enter the M-Pesa confirmation code from the Safaricom message.",
    };
  }

  const supabase = createServerSupabase();

  const { error } = await supabase.rpc("submit_payment_proof", {
    p_order_number: orderNumber,
    p_phone: phone,
    p_mpesa_code: mpesaCode,
    // Only when the money came from elsewhere. An empty string means "the same
    // as the order phone", which the function handles by defaulting.
    p_payment_phone: paymentPhone || undefined,
  });

  if (!error) {
    // The status page is server-rendered, so the badge and the instruction
    // copy need re-rendering for the new status. The client also calls
    // router.refresh(); this covers the no-JS path.
    revalidatePath(`/order/${orderNumber}`);
    return { status: "ok" };
  }

  const message = error.message;

  if (/rate_limited/i.test(message)) {
    return {
      status: "error",
      message:
        "Too many attempts from this connection. Wait fifteen minutes and try again.",
    };
  }

  if (/invalid_code_format/i.test(message)) {
    return {
      status: "error",
      message:
        "That does not look like an M-Pesa code. They are ten characters, letters and numbers — for example SJL4K2M9QP.",
    };
  }

  if (/not_found/i.test(message)) {
    // Deliberately does not say which half was wrong. The function returns the
    // same NULL for a bad phone and a bad order number, and this message must
    // not undo that by guessing.
    return {
      status: "error",
      message:
        "We could not match that order number and phone number. Check both against your confirmation.",
    };
  }

  if (/wrong_status/i.test(message)) {
    const actual = message.split(":")[1]?.trim();

    if (actual === "awaiting_payment_verification") {
      return {
        status: "error",
        message:
          "We already have a code for this order and are checking it. Message us on WhatsApp if it is taking long.",
      };
    }

    return {
      status: "error",
      message:
        "This order is not waiting for payment right now. Reload the page to see its current status.",
    };
  }

  return {
    status: "error",
    message:
      "We could not record that just now. Please try again, or message us on WhatsApp.",
  };
}