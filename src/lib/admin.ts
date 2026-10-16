import "server-only";

import { createSessionSupabase } from "@/lib/supabase/session";

export type WhoAmI = {
  user_id: string | null;
  email: string | null;
  is_staff: boolean;
  role: string | null;
};

/**
 * Calls the database's own whoami() rather than reading the JWT locally.
 *
 * The whole point is that staff membership is decided in ONE place — the
 * `staff` table, via is_staff() — and this asks that place. A layout that
 * inspected `user.email.endsWith("@theshop.com")` would be a second, weaker
 * definition of "staff" that drifts from the one the RLS policies enforce.
 *
 * A failure here (network, missing function on an un-migrated database) is
 * reported as "not staff", never as staff. Fail closed.
 */
export async function whoami(): Promise<WhoAmI> {
  const supabase = await createSessionSupabase();

  const { data, error } = await supabase.rpc("whoami");

  if (error || !data) {
    return { user_id: null, email: null, is_staff: false, role: null };
  }

  return data as unknown as WhoAmI;
}

/** PostgREST raises our functions' errors as message strings like `not_staff`. */
export function explainAdmin(error: unknown): string {
  const raw =
    typeof error === "object" && error !== null && "message" in error
      ? String((error as { message: unknown }).message)
      : String(error ?? "");

  const code = raw.split(":").slice(-1)[0];

  if (raw.includes("not_staff")) return "You are not signed in as staff.";
  if (raw.includes("not_found")) return "That order no longer exists.";
  if (raw.includes("invalid_fee")) return "Enter a delivery fee of 0 or more.";
  if (raw.includes("invalid_stock")) return "Stock cannot be negative.";
  if (raw.includes("wrong_status"))
    return `That is not allowed while the order is ${code}.`;
  if (raw.includes("invalid_reason")) return "Pick restock or adjustment.";
  if (raw.includes("invalid_status"))
    return `${code} is not a status an order can be in.`;
  if (raw.includes("invalid_transition"))
    return `An order cannot go straight to ${code}.`;
  if (raw.includes("invalid_cells"))
    return "The grid arrived in a shape the database did not expect. Reload and try again.";
  if (raw.includes("invalid_price"))
    return "Enter a whole-shilling price, 0 or more.";
  if (raw.includes("invalid_quantity"))
    return "Stock cannot be negative.";
  if (raw.includes("missing_sku_prefix"))
    return "This product has no SKU prefix, so it cannot generate SKUs. Set one before filling the grid.";
  if (raw.includes("sku_collision"))
    return `Every SKU this grid wants is already taken under ${code}. Rename a colour, or shorten the prefix.`;
  if (raw.includes("product_in_use"))
    return "That product is on a live order and cannot be deleted. Archive it instead.";

  return "That did not work. Try again, or check the database log.";
}

export const ORDER_STATUS_LABEL: Record<string, string> = {
  awaiting_delivery_quote: "Needs a delivery quote",
  awaiting_payment: "Awaiting payment",
  awaiting_payment_verification: "Needs payment check",
  paid: "Paid",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const STATUS_TONE: Record<string, string> = {
  awaiting_delivery_quote: "text-champagne border-champagne/40",
  awaiting_payment_verification: "text-champagne border-champagne/40",
  awaiting_payment: "text-pearl/70 border-pearl/20",
  paid: "text-emerald-300 border-emerald-400/40",
  processing: "text-pearl/70 border-pearl/20",
  shipped: "text-pearl/70 border-pearl/20",
  delivered: "text-pearl/50 border-pearl/15",
  cancelled: "text-red-300/80 border-red-400/30",
};