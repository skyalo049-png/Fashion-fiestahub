import "server-only";

import { createSessionSupabase } from "@/lib/supabase/session";

/**
 * Staff-side catalogue reads.
 *
 * Deliberately separate from `catalogue.ts`, which reads the
 * variant_availability view and only ever sees active products.
 *
 * The difference that matters: a draft product is invisible to the storefront
 * and must still be editable here, and the dashboard needs stock_qty — the
 * physical count — where the storefront needs available_qty, the count minus
 * reservations. One is the shelf, the other is the shelf minus what is already
 * promised to somebody.
 */

export type AdminVariant = {
  id: string;
  sku: string;
  size: string | null;
  color: string | null;
  priceKes: number;
  stockQty: number;
  isActive: boolean;
};

export type AdminProductImage = {
  id: string;
  url: string;
  alt: string | null;
  position: number;
};

export type AdminProduct = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  status: string;
  skuPrefix: string | null;
  fabric: string | null;
  care: string | null;
  fitNotes: string | null;
  /** Kept as the raw jsonb value; the form edits it as text. */
  sizeChart: unknown;
  variants: AdminVariant[];
  images: AdminProductImage[];
};

export type AdminProductRow = {
  id: string;
  slug: string;
  title: string;
  status: string;
  skuPrefix: string | null;
  variantCount: number;
  totalStock: number;
  fromPriceKes: number | null;
};

const num = (v: unknown): number => {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
};

const strOrNull = (v: unknown): string | null =>
  typeof v === "string" && v !== "" ? v : null;

const str = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;

/**
 * Every product, whatever its status, with a rolled-up variant count, total
 * physical stock and lowest price.
 *
 * Aggregated in TypeScript from one nested select rather than done in SQL: at
 * this catalogue's size the extra round trips a separate count query would cost
 * are worse than the fold, and the fold is the version that stays correct when
 * someone later adds a filter.
 */
export async function listProducts(): Promise<AdminProductRow[]> {
  const supabase = await createSessionSupabase();

  const { data, error } = await supabase
    .from("products")
    .select("id,slug,title,status,sku_prefix,product_variants(price_kes,stock_qty)")
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((row) => {
    const variants = Array.isArray(row.product_variants)
      ? row.product_variants
      : [];

    const prices = variants
      .map((v) => num(v.price_kes))
      .filter((p) => p > 0);

    return {
      id: String(row.id),
      slug: str(row.slug),
      title: str(row.title),
      status: str(row.status),
      skuPrefix: strOrNull(row.sku_prefix),
      variantCount: variants.length,
      totalStock: variants.reduce((sum, v) => sum + num(v.stock_qty), 0),
      fromPriceKes: prices.length ? Math.min(...prices) : null,
    };
  });
}

export async function getProduct(slug: string): Promise<AdminProduct | null> {
  const supabase = await createSessionSupabase();

  const { data, error } = await supabase
    .from("products")
    // One literal, not concatenated. Supabase's generated types parse this
    // string to work out the shape of the result, and a concatenation is not a
    // literal to the compiler — it degrades the whole row to GenericStringError
    // and takes every field access down with it.
    .select(
      "id,slug,title,description,status,sku_prefix,fabric,care,fit_notes,size_chart,product_variants(id,sku,size,color,price_kes,stock_qty,is_active),product_images(id,url,alt,position)",
    )
    .eq("slug", slug)
    .maybeSingle();

  if (error || !data) return null;

  const variants = (Array.isArray(data.product_variants) ? data.product_variants : [])
    .map((v) => ({
      id: String(v.id),
      sku: str(v.sku),
      size: strOrNull(v.size),
      color: strOrNull(v.color),
      priceKes: num(v.price_kes),
      stockQty: num(v.stock_qty),
      isActive: v.is_active !== false,
    }))
    // Sizes read small to large, colours alphabetically within a size. Stable
    // ordering matters more here than in the storefront: two staff members
    // looking at the same product should see the same grid.
    .sort((a, b) => {
      const size = (a.size ?? "").localeCompare(b.size ?? "");
      if (size !== 0) return size;
      return (a.color ?? "").localeCompare(b.color ?? "");
    });

  const images = (Array.isArray(data.product_images) ? data.product_images : [])
    .map((i) => ({
      id: String(i.id),
      url: str(i.url),
      alt: strOrNull(i.alt),
      position: num(i.position),
    }))
    .sort((a, b) => a.position - b.position);

  return {
    id: String(data.id),
    slug: str(data.slug),
    title: str(data.title),
    description: strOrNull(data.description),
    status: str(data.status),
    skuPrefix: strOrNull(data.sku_prefix),
    fabric: strOrNull(data.fabric),
    care: strOrNull(data.care),
    fitNotes: strOrNull(data.fit_notes),
    sizeChart: data.size_chart,
    variants,
    images,
  };
}

/**
 * The distinct sizes and colours across a product's variants, used to seed the
 * grid's rows and columns.
 *
 * Order is the sort order getProduct already established, so the grid opens in
 * the same arrangement the variant table shows.
 */
export function axesOf(variants: AdminVariant[]): {
  sizes: string[];
  colors: string[];
} {
  const sizes: string[] = [];
  const colors: string[] = [];

  for (const v of variants) {
    const size = v.size ?? "";
    const color = v.color ?? "";
    if (size && !sizes.includes(size)) sizes.push(size);
    if (color && !colors.includes(color)) colors.push(color);
  }

  return { sizes, colors };
}
