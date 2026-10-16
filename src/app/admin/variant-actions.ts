"use server";

import { revalidatePath } from "next/cache";

import { type VariantActionResult } from "@/lib/action-state";
import { explainAdmin } from "@/lib/admin";
import { createSessionSupabase } from "@/lib/supabase/session";

/**
 * Saving the variant grid.
 *
 * The grid is one call, not fifteen. save_product_variants() takes the whole
 * grid as jsonb and does the inserts, the updates, the retirements and the
 * stock movements in one transaction, so a save either lands completely or not
 * at all. This file's whole job is to turn the form into that jsonb and to
 * refuse to send anything the database would reject for a boring reason.
 *
 * Note what is NOT here: any check of who may call it. save_product_variants()
 * raises not_staff itself, and that is the only version of the check that
 * survives somebody talking to PostgREST with curl.
 */

type Cell = { size: string; color: string; stock: number; price: number | null };

/** Same shape as `Cell`, before validation. */
function readCells(raw: string): Cell[] | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  if (!Array.isArray(parsed)) return null;

  const cells: Cell[] = [];

  for (const entry of parsed) {
    if (!entry || typeof entry !== "object") return null;
    const c = entry as Record<string, unknown>;

    const size = typeof c.size === "string" ? c.size.trim() : "";
    const color = typeof c.color === "string" ? c.color.trim() : "";

    // The grid sends stock as a string straight from the input, and omits a
    // blank cell entirely. Anything still arriving here must be a number.
    const stockRaw = typeof c.stock === "string" ? c.stock.trim() : c.stock;
    if (stockRaw === "" || stockRaw === null || stockRaw === undefined) continue;

    const stock = Number(stockRaw);
    if (!Number.isInteger(stock) || stock < 0) return null;

    const priceRaw = c.price;
    const price =
      priceRaw === null || priceRaw === undefined || priceRaw === ""
        ? null
        : Number(priceRaw);
    if (price !== null && (!Number.isInteger(price) || price < 0)) return null;

    cells.push({ size, color, stock, price });
  }

  return cells;
}

export async function saveVariants(
  _prev: VariantActionResult,
  formData: FormData,
): Promise<VariantActionResult> {
  const productId = String(formData.get("product_id") ?? "").trim();
  const slug = String(formData.get("slug") ?? "").trim();
  const note = String(formData.get("note") ?? "").trim();
  const priceRaw = String(formData.get("default_price") ?? "").trim();

  if (!productId || !slug) {
    return { status: "error", message: "Missing product." };
  }

  const cells = readCells(String(formData.get("cells") ?? "[]"));
  if (!cells) {
    return {
      status: "error",
      message: "The grid did not arrive intact. Reload the page and fill it again.",
    };
  }

  // Number("") is 0, which would silently price every variant at nothing.
  const defaultPrice = Number(priceRaw === "" ? NaN : priceRaw);
  if (!Number.isInteger(defaultPrice) || defaultPrice < 0) {
    return {
      status: "error",
      message: "Enter a whole-shilling default price, 0 or more.",
    };
  }

  const supabase = await createSessionSupabase();

  const { data, error } = await supabase.rpc("save_product_variants", {
    p_product_id: productId,
    p_cells: cells,
    p_default_price: defaultPrice,
    p_note: note || undefined,
  });

  if (error) return { status: "error", message: explainAdmin(error) };

  const result = (data ?? {}) as Record<string, unknown>;
  const count = (key: string): number => {
    const n = Number(result[key] ?? 0);
    return Number.isFinite(n) ? n : 0;
  };

  // The storefront's copy of this product is cached. Without these the operator
  // saves a price, opens the shop in a second tab and sees the old one — which
  // is exactly the "is this thing real?" doubt this phase exists to kill.
  revalidatePath(`/admin/products/${slug}`);
  revalidatePath("/admin/products");
  revalidatePath("/admin/inventory");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/");

  const parts = [
    `${count("created")} added`,
    `${count("updated")} kept`,
    `${count("retired")} hidden`,
    `${count("restocked")} stock change${count("restocked") === 1 ? "" : "s"}`,
  ];

  return { status: "ok", message: `Saved. ${parts.join(", ")}.` };
}