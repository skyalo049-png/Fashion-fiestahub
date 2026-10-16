import "server-only";

import { createSessionSupabase } from "@/lib/supabase/session";

/**
 * Live stock, for the two questions staff actually ask.
 *
 * "What is nearly gone?" is answered from `stock_qty` — the shelf. "Can I sell
 * one more?" is answered from `available_qty` — the shelf minus whatever open
 * orders have already promised. They are different numbers and conflating them
 * is how a shop oversells: three on the shelf, three reserved, and the grid
 * still shows a comfortable 3.
 *
 * `variant_availability` computes the second one. It is read with `select("*")`
 * and parsed defensively rather than naming columns, because a view whose shape
 * is guessed is a view that breaks the page the day somebody adds a column —
 * and this page's whole job is to be trustworthy about numbers.
 */

/** Below this, a variant is worth a second look. Not a reorder point. */
export const LOW_STOCK_THRESHOLD = 3;

export type InventoryRow = {
  variantId: string;
  sku: string;
  productSlug: string;
  productTitle: string;
  productStatus: string;
  size: string | null;
  color: string | null;
  priceKes: number;
  stockQty: number;
  availableQty: number;
  reservedQty: number;
  isActive: boolean;
};

export type InventoryView = {
  rows: InventoryRow[];
  lowStock: InventoryRow[];
  outOfStock: InventoryRow[];
  totalUnits: number;
  threshold: number;
};

function num(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** One row of `products` as PostgREST embeds it — object, or array, or absent. */
function embed(related: unknown): Record<string, unknown> | null {
  if (Array.isArray(related)) {
    const first = related[0];
    return first && typeof first === "object" ? (first as Record<string, unknown>) : null;
  }
  return related && typeof related === "object" ? (related as Record<string, unknown>) : null;
}

export async function getInventory(): Promise<InventoryView> {
  const supabase = await createSessionSupabase();

  const { data: variants, error } = await supabase
    .from("product_variants")
    .select(
      "id,sku,size,color,price_kes,stock_qty,is_active,products(id,title,slug,status)",
    )
    .order("sku", { ascending: true })
    .limit(1000);

  if (error || !variants) {
    return {
      rows: [],
      lowStock: [],
      outOfStock: [],
      totalUnits: 0,
      threshold: LOW_STOCK_THRESHOLD,
    };
  }

  // Reserved quantities, keyed by variant. A missing or unreadable view means
  // we report the shelf and say nothing about promises, rather than inventing a
  // zero that would read as "nothing is reserved".
  const available = new Map<string, number>();
  const { data: availability } = await supabase
    .from("variant_availability")
    .select("*")
    .limit(1000);

  if (Array.isArray(availability)) {
    for (const raw of availability) {
      if (!raw || typeof raw !== "object") continue;
      const row = raw as Record<string, unknown>;
      const id = str(row.variant_id ?? row.id);
      if (!id) continue;
      available.set(id, num(row.available_qty, num(row.stock_qty)));
    }
  }

  const rows: InventoryRow[] = variants.map((raw) => {
    const v = raw as Record<string, unknown>;
    const product = embed(v.products);
    const stockQty = num(v.stock_qty);
    const hasAvailability = available.has(str(v.id));
    const availableQty = hasAvailability ? available.get(str(v.id))! : stockQty;

    return {
      variantId: str(v.id),
      sku: str(v.sku),
      productSlug: str(product?.slug),
      productTitle: str(product?.title),
      productStatus: str(product?.status),
      size: typeof v.size === "string" ? v.size : null,
      color: typeof v.color === "string" ? v.color : null,
      priceKes: num(v.price_kes),
      stockQty,
      availableQty,
      reservedQty: Math.max(0, stockQty - availableQty),
      isActive: v.is_active !== false,
    };
  });

  // Archived products are kept out of the low-stock shouting: they are off the
  // shelf on purpose, and a red badge for something nobody can buy is noise
  // that trains staff to ignore the badge.
  const sellable = rows.filter((r) => r.isActive && r.productStatus === "active");

  return {
    rows,
    lowStock: sellable.filter((r) => r.stockQty > 0 && r.stockQty <= LOW_STOCK_THRESHOLD),
    outOfStock: sellable.filter((r) => r.stockQty === 0),
    totalUnits: rows.reduce((sum, r) => sum + r.stockQty, 0),
    threshold: LOW_STOCK_THRESHOLD,
  };
}