/**
 * Catalogue reads for the storefront.
 *
 * Stock comes from the `variant_availability` view, not from
 * product_variants.stock_qty. The view subtracts units held by unexpired
 * orders, so `available_qty` is what a customer can actually buy. Reading
 * stock_qty directly would oversell reserved units — the exact bug this
 * rebuild exists to prevent.
 */
import { existsSync } from "node:fs";
import { join } from "node:path";

import { createServerSupabase } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

/**
 * The columns the storefront actually selects from the view. Narrower than
 * Database[...]["Row"] on purpose: PostgREST returns only what the select
 * string names, and typing it against the full row would be a lie that only
 * shows up when someone reads a column the query never asked for.
 */
type AvailabilityRow = Pick<
  Database["public"]["Views"]["variant_availability"]["Row"],
  "sku" | "size" | "color" | "price_kes" | "available_qty"
>;

export type Variant = {
  sku: string;
  size: string | null;
  color: string | null;
  priceKes: number;
  availableQty: number;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  imageUrl: string | null;
  imageAlt: string;
  variants: Variant[];
  fromPriceKes: number;
  totalAvailable: number;
};

/**
 * Whether a referenced image actually ships with the app.
 *
 * The seed rows point at /images/*.jpg that are not in public/ yet, because
 * the real shoot has not happened. Rendering <img> for a missing file gives a
 * broken-image icon on every card; returning null lets the card fall back to a
 * branded panel instead. The moment the files land in public/images, cards show
 * photos with no code change.
 */
function resolveImage(url: string | null): string | null {
  if (!url) return null;
  if (/^https?:\/\//.test(url)) return url;
  return existsSync(join(process.cwd(), "public", url)) ? url : null;
}

function toVariant(row: AvailabilityRow): Variant {
  return {
    sku: row.sku ?? "",
    size: row.size,
    color: row.color,
    // price_kes is `integer not null` on the base table; the view widens it to
    // nullable because views are introspected loosely. Default, don't assert.
    priceKes: row.price_kes ?? 0,
    availableQty: row.available_qty ?? 0,
  };
}

export async function getActiveProducts(): Promise<Product[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      slug,
      title,
      description,
      product_images ( url, alt, position ),
      variant_availability ( sku, size, color, price_kes, available_qty )
    `,
    )
    .eq("status", "active")
    .order("title")
    .order("position", { referencedTable: "product_images" });

  if (error) {
    throw new Error(`Catalogue query failed: ${error.message}`);
  }

  return (data ?? []).map((row) => {
    const variants = (row.variant_availability ?? []).map(toVariant);

    // position 0 is the card image. The query orders images, but order is not
    // guaranteed on a nested resource without an explicit sort, so pick
    // deliberately rather than trusting array position.
    const images = [...(row.product_images ?? [])].sort(
      (a, b) => a.position - b.position,
    );
    const card = images[0] ?? null;

    const prices = variants.map((v) => v.priceKes).filter((p) => p > 0);

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description,
      imageUrl: resolveImage(card?.url ?? null),
      imageAlt: card?.alt ?? row.title,
      variants,
      fromPriceKes: prices.length ? Math.min(...prices) : 0,
      totalAvailable: variants.reduce((sum, v) => sum + v.availableQty, 0),
    };
  });
}
