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
  "variant_id" | "sku" | "size" | "color" | "price_kes" | "available_qty"
>;

/**
 * One selectable variant. `id` is carried because checkout posts variant ids
 * to create_order — the SKU is the human-readable handle, the id is the key.
 */
export type Variant = {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  priceKes: number;
  availableQty: number;
};

export type ProductImage = {
  url: string;
  alt: string;
};

/**
 * A row of the size chart, as stored in products.size_chart (jsonb). Kept
 * loose: merchandising copy is hand-written, and a missing bust column on a
 * one-size wrapper is normal rather than an error.
 */
export type SizeChartRow = {
  size: string;
  bust: string | null;
  waist: string | null;
  hips: string | null;
  length: string | null;
};

export type Product = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  fabric: string | null;
  care: string | null;
  fitNotes: string | null;
  sizeChart: SizeChartRow[];
  images: ProductImage[];
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

function toVariant(row: AvailabilityRow): Variant | null {
  // A variant with no id cannot be posted to create_order, so it is not
  // sellable. Dropping it is better than rendering a size that fails at
  // checkout. The view always supplies one; this is a type guard, not a filter
  // that is expected to fire.
  if (!row.variant_id) return null;

  return {
    id: row.variant_id,
    sku: row.sku ?? "",
    size: row.size,
    color: row.color,
    // price_kes is `integer not null` on the base table; the view widens it to
    // nullable because views are introspected loosely. Default, don't assert.
    priceKes: row.price_kes ?? 0,
    availableQty: row.available_qty ?? 0,
  };
}

/**
 * products.size_chart is jsonb, so Postgres guarantees it is valid JSON and
 * nothing more. Anything that is not an array of objects carrying a `size` is
 * discarded rather than rendered as `[object Object]` on the PDP.
 */
function parseSizeChart(value: unknown): SizeChartRow[] {
  if (!Array.isArray(value)) return [];

  const rows: SizeChartRow[] = [];
  for (const raw of value) {
    if (!raw || typeof raw !== "object") continue;
    const record = raw as Record<string, unknown>;
    const size = typeof record.size === "string" ? record.size.trim() : "";
    if (!size) continue;

    const cell = (key: string) => {
      const v = record[key];
      return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
    };

    rows.push({
      size,
      bust: cell("bust"),
      waist: cell("waist"),
      hips: cell("hips"),
      length: cell("length"),
    });
  }
  return rows;
}

const PRODUCT_SELECT = `
  id,
  slug,
  title,
  description,
  fabric,
  care,
  fit_notes,
  size_chart,
  product_images ( url, alt, position ),
  variant_availability ( variant_id, sku, size, color, price_kes, available_qty )
`;

/**
 * The shape the select string above actually returns. Written out rather than
 * inferred so the mapper below is checked against a stated contract — if a
 * column is renamed in a migration, this is where the build breaks, not in a
 * component three files away.
 */
type ProductRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  fabric: string | null;
  care: string | null;
  fit_notes: string | null;
  size_chart: unknown;
  product_images: { url: string; alt: string | null; position: number }[] | null;
  variant_availability: AvailabilityRow[] | null;
};

function toProduct(row: ProductRow): Product {
  const variants = (row.variant_availability ?? [])
    .map(toVariant)
    .filter((v): v is Variant => v !== null);

  // position 0 is the card image. The query orders images, but order is not
  // guaranteed on a nested resource without an explicit sort, so pick
  // deliberately rather than trusting array position.
  const images = [...(row.product_images ?? [])].sort(
    (a, b) => a.position - b.position,
  );

  // A missing file resolves to null and is dropped from the gallery, so the
  // PDP does not show a broken frame alongside the ones that did ship.
  const resolved: ProductImage[] = [];
  for (const image of images) {
    const url = resolveImage(image.url);
    if (url) resolved.push({ url, alt: image.alt ?? row.title });
  }

  const card = resolved[0] ?? null;
  const prices = variants.map((v) => v.priceKes).filter((p) => p > 0);

  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    fabric: row.fabric,
    care: row.care,
    fitNotes: row.fit_notes,
    sizeChart: parseSizeChart(row.size_chart),
    images: resolved,
    imageUrl: card?.url ?? null,
    imageAlt: card?.alt ?? row.title,
    variants,
    fromPriceKes: prices.length ? Math.min(...prices) : 0,
    totalAvailable: variants.reduce((sum, v) => sum + v.availableQty, 0),
  };
}

export async function getActiveProducts(): Promise<Product[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("status", "active")
    .order("title")
    .order("position", { referencedTable: "product_images" });

  if (error) {
    throw new Error(`Catalogue query failed: ${error.message}`);
  }

  return ((data ?? []) as unknown as ProductRow[]).map(toProduct);
}

/**
 * One product for the PDP, by slug.
 *
 * Returns null rather than throwing when the slug does not exist or the
 * product is not active: a draft product and a typo'd URL are the same thing
 * to a visitor, and both should be a 404 rather than a 500.
 */
export async function getProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("status", "active")
    .order("position", { referencedTable: "product_images" })
    .maybeSingle();

  if (error) {
    throw new Error(`Product query failed: ${error.message}`);
  }
  if (!data) return null;

  return toProduct(data as unknown as ProductRow);
}

/**
 * Slugs only, for the sitemap. Cheaper than pulling full products to build a
 * list of URLs, and it runs at build time.
 */
export async function getActiveProductSlugs(): Promise<string[]> {
  const supabase = createServerSupabase();

  const { data, error } = await supabase
    .from("products")
    .select("slug")
    .eq("status", "active")
    .order("slug");

  if (error) {
    throw new Error(`Slug query failed: ${error.message}`);
  }

  return (data ?? []).map((row) => row.slug);
}