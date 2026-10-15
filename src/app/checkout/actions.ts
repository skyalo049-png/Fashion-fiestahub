"use server";

import { rememberOrderPhone } from "@/lib/orders";
import { createServerSupabase } from "@/lib/supabase/server";

/**
 * The only way an order is created from the storefront.
 *
 * The client posts variant ids and quantities. It does not post prices, a
 * subtotal, a delivery fee or a total — create_order reads the live price from
 * product_variants and computes the subtotal itself. Anything money-shaped in
 * the form body below is ignored, so tampering with it achieves nothing. This
 * is not a validation layer in front of the database; the database is the
 * authority and this function is just a messenger.
 */

export type CheckoutState =
  | { status: "idle" }
  | { status: "error"; message: string }
  | { status: "done"; orderNumber: string };

type ItemPayload = { variant_id: string; qty: number };

/**
 * Turns a Postgres error into something a customer standing in a queue can act
 * on. The raw messages are structured for the app, not for a person, so the
 * mapping is explicit and anything unrecognised falls through to a sentence
 * that at least tells them the order did not go through.
 */
function explain(message: string): string {
  if (/invalid_phone/i.test(message)) {
    return "That phone number does not look like a Kenyan mobile number. Use the form 07XX XXX XXX.";
  }
  if (/cart_empty/i.test(message)) {
    return "Your bag is empty. Add something before checking out.";
  }
  if (/invalid_quantity/i.test(message)) {
    return "One of the quantities in your bag is not valid. Please reopen the bag and try again.";
  }
  if (/insufficient_stock/i.test(message)) {
    const sku = message.split(":")[1]?.trim();
    return sku
      ? `Someone else bought the last of ${sku} while you were checking out. Remove it from your bag and try again.`
      : "Someone else bought the last of an item in your bag. Please review the bag and try again.";
  }
  if (/variant_unavailable/i.test(message)) {
    return "An item in your bag is no longer available. Please review the bag and try again.";
  }
  return "We could not place your order just now. Please try again, or message us on WhatsApp.";
}

function readItems(formData: FormData): ItemPayload[] {
  const raw = formData.get("items");
  if (typeof raw !== "string" || raw.trim() === "") return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];

  const items: ItemPayload[] = [];
  for (const entry of parsed) {
    if (typeof entry !== "object" || entry === null) continue;
    const candidate = entry as Record<string, unknown>;
    const variantId = candidate.variant_id;
    const qty = candidate.qty;
    if (typeof variantId !== "string" || variantId === "") continue;
    if (typeof qty !== "number" || !Number.isInteger(qty) || qty <= 0) continue;
    items.push({ variant_id: variantId, qty });
  }
  return items;
}

function field(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function placeOrder(
  _prev: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const items = readItems(formData);
  if (items.length === 0) {
    return { status: "error", message: "Your bag is empty. Add something before checking out." };
  }

  const fullName = field(formData, "full_name");
  const phone = field(formData, "phone");

  if (!fullName) {
    return { status: "error", message: "Please enter your name so we know who to ask for." };
  }
  if (!phone) {
    return { status: "error", message: "Please enter a phone number so we can reach you about delivery." };
  }
  if (!field(formData, "city")) {
    return {
      status: "error",
      message: "Please tell us the town or city we are delivering to.",
    };
  }

  const supabase = createServerSupabase();

  const { data, error } = await supabase.rpc("create_order", {
    p_phone: phone,
    p_full_name: fullName,
    p_email: field(formData, "email"),
    // Only the town. create_order reads line1/line2/area/county if they are
    // present and stores '' when they are not, so the addresses row stays
    // valid and the columns stay available for when a real address form is
    // worth the taps. The rest of what a rider needs arrives in p_notes.
    p_address: {
      city: field(formData, "city"),
    },
    p_items: items,
    p_notes: field(formData, "notes") || undefined,
  });

  if (error) {
    return { status: "error", message: explain(error.message) };
  }

  const result = (data ?? {}) as Record<string, unknown>;
  const orderNumber =
    typeof result.order_number === "string" ? result.order_number : "";

  if (!orderNumber) {
    return {
      status: "error",
      message:
        "Your order may have gone through, but we could not read the confirmation. Message us on WhatsApp before trying again so you do not order twice.",
    };
  }

  // Half of the credential for /order/[number]. Without it the customer would
  // have to retype the phone number to see the order they just placed, which
  // is exactly the moment they are most likely to give up.
  await rememberOrderPhone(orderNumber, phone);

  return { status: "done", orderNumber };
}