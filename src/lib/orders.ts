import { cookies } from "next/headers";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Order reads and the credential that protects them.
 *
 * Every read here goes through lookup_order, which requires the phone AND the
 * order number. There is no function in this file that can fetch an order from
 * an order number alone — that is deliberate, and it is the entire reason the
 * order number is unguessable. Both halves are needed because either half alone
 * is weak: the number is printed on every confirmation and forwarded in
 * WhatsApp, and Kenyan mobile numbers are enumerable.
 */

export type OrderStatus = Database["public"]["Enums"]["order_status"];

export type OrderItem = {
  title: string;
  sku: string | null;
  size: string | null;
  color: string | null;
  unitPriceKes: number;
  qty: number;
  lineTotalKes: number;
};

export type OrderEvent = { type: string; createdAt: string };

export type Order = {
  orderNumber: string;
  status: OrderStatus;
  subtotalKes: number;
  deliveryFeeKes: number | null;
  totalKes: number | null;
  createdAt: string;
  reservationExpiresAt: string;
  items: OrderItem[];
  events: OrderEvent[];
};

/** The one status where the customer still owes money. */
export function isPayable(status: OrderStatus): boolean {
  return status === "awaiting_payment";
}

// ---------------------------------------------------------------------------
// The order credential cookie
// ---------------------------------------------------------------------------

const ORDER_COOKIE_PREFIX = "ffh_order_";

/**
 * The phone is the second half of the order credential, so it is kept in an
 * httpOnly cookie rather than the URL. A query string ends up in browser
 * history, in server logs, and in the Referer header sent to every third party
 * the page touches — and this page links out to WhatsApp, so there is a third
 * party. A cookie with the same protections as a session token does not leak
 * that way.
 *
 * Scoped per order number so a customer with two orders open can read both
 * without one clobbering the other. It is not a session and it authorises
 * nothing except reading the one order it names.
 *
 * This is set from a server action at checkout, not from a route handler, so it
 * carries no server action ID and is not a CSRF vector: submit_payment_proof
 * still requires both the number and the phone, and this cookie only ever
 * supplies the second half of a pair the customer already knows.
 */
export function orderCookieName(orderNumber: string): string {
  return `${ORDER_COOKIE_PREFIX}${orderNumber.toUpperCase()}`;
}

export const ORDER_COOKIE_MAX_AGE = 60 * 60 * 24 * 14;

export async function rememberOrderPhone(orderNumber: string, phone: string) {
  const jar = await cookies();
  jar.set(orderCookieName(orderNumber), phone, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ORDER_COOKIE_MAX_AGE,
  });
}

export async function recallOrderPhone(
  orderNumber: string,
): Promise<string | null> {
  const jar = await cookies();
  return jar.get(orderCookieName(orderNumber))?.value ?? null;
}

// ---------------------------------------------------------------------------
// lookup_order
// ---------------------------------------------------------------------------

export type LookupResult =
  | { ok: true; order: Order }
  | { ok: false; reason: "not_found" | "rate_limited" | "error" };

/**
 * Fetch one order, given both halves of the credential.
 *
 * lookup_order returns SQL NULL rather than raising when the pair does not
 * match — so a wrong phone and a wrong order number are indistinguishable from
 * out here, which is the point. The only exception it raises is rate_limited.
 */
export async function lookupOrder(
  phone: string,
  orderNumber: string,
): Promise<LookupResult> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase.rpc("lookup_order", {
    p_phone: phone,
    p_order_number: orderNumber,
  });

  if (error) {
    return {
      ok: false,
      reason: /rate_limited/i.test(error.message) ? "rate_limited" : "error",
    };
  }

  if (!data) return { ok: false, reason: "not_found" };

  return { ok: true, order: parseOrder(data) };
}

// ---------------------------------------------------------------------------
// jsonb -> typed
// ---------------------------------------------------------------------------

/**
 * lookup_order returns jsonb, so nothing about its shape is guaranteed by the
 * type system. These read defensively rather than casting: a missing field
 * becomes a blank or a zero and the page still renders, which is better than
 * `undefined` reaching a formatter and throwing on a page a customer reaches
 * straight after paying.
 */
function num(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function parseOrder(raw: unknown): Order {
  const o = (raw ?? {}) as Record<string, unknown>;
  const items = Array.isArray(o.items) ? o.items : [];

  return {
    orderNumber: str(o.order_number) ?? "",
    status: (str(o.status) ?? "awaiting_delivery_quote") as OrderStatus,
    subtotalKes: num(o.subtotal_kes) ?? 0,
    deliveryFeeKes: num(o.delivery_fee_kes),
    totalKes: num(o.total_kes),
    createdAt: str(o.created_at) ?? "",
    reservationExpiresAt: str(o.reservation_expires_at) ?? "",
    items: items.map((entry) => {
      const i = (entry ?? {}) as Record<string, unknown>;
      return {
        title: str(i.title) ?? "",
        sku: str(i.sku),
        size: str(i.size),
        color: str(i.color),
        unitPriceKes: num(i.unit_price_kes) ?? 0,
        qty: num(i.qty) ?? 0,
        lineTotalKes: num(i.line_total_kes) ?? 0,
      };
    }),
    // Only customer-visible events come back from the function, so there is no
    // staff-only wording to filter here.
    events: (Array.isArray(o.events) ? o.events : []).map((entry) => {
      const e = (entry ?? {}) as Record<string, unknown>;
      return { type: str(e.type) ?? "", createdAt: str(e.created_at) ?? "" };
    }),
  };
}