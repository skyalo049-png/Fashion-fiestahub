"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { type ProductActionResult } from "@/lib/action-state";
import { explainAdmin } from "@/lib/admin";
import { createSessionSupabase } from "@/lib/supabase/session";

/**
 * Staff writes against the catalogue.
 *
 * The variant grid is NOT here. save_product_variants() owns it, because the
 * grid has to be atomic and this file cannot make fifteen separate calls
 * atomic. What lives here is everything that is one row: the product itself,
 * its merchandising copy, and its photos.
 *
 * SKU prefix is validated but not generated. It is the one field a human must
 * supply that the database cannot infer, and it is permanent in practice —
 * changing it later orphans every SKU already printed on a label or quoted to a
 * customer, so the form asks for it once, at creation, rather than offering it
 * as an editable field.
 */

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

/**
 * A URL-safe slug from a title.
 *
 * Tuned for this shop's product names ('Ankara Wrap Dress' ->
 * ankara-wrap-dress). An ampersand becomes 'and' rather than being encoded,
 * because a slug containing %26 is a support question waiting to happen.
 */
function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

/**
 * The SKU stem, normalised to the seeded convention.
 *
 * FFH-AWD. Accepts what a person types ('ffh-awd', 'FFH AWD', 'AWD') and
 * returns the canonical form, adding the FFH- prefix when it is missing rather
 * than rejecting the input.
 */
function normaliseSkuPrefix(raw: string): string | null {
  const cleaned = raw.toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!cleaned) return null;
  const withPrefix = cleaned.startsWith("FFH-") ? cleaned : `FFH-${cleaned}`;
  // FFH-AWD is the longest sensible stem: three characters for the product.
  return withPrefix.length <= 8 ? withPrefix : null;
}

export async function createProduct(
  _prev: ProductActionResult,
  formData: FormData,
): Promise<ProductActionResult> {
  const title = field(formData, "title");
  const slugInput = field(formData, "slug");
  const skuPrefix = normaliseSkuPrefix(field(formData, "sku_prefix"));
  const status = field(formData, "status") === "active" ? "active" : "draft";

  if (!title) return { status: "error", message: "Give the product a title." };

  if (!skuPrefix) {
    return {
      status: "error",
      message:
        "SKU prefix looks wrong. Use three letters for the product, like FFH-AWD.",
    };
  }

  const slug = slugify(slugInput || title);
  if (!slug) {
    return { status: "error", message: "Could not make a URL from that title." };
  }

  const supabase = await createSessionSupabase();

  // A duplicate slug means the product already exists and should be edited,
  // which is a different next action than a bad field — so it is reported as
  // itself rather than as a generic failure.
  const { data: existing } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) {
    return {
      status: "error",
      message: `The URL '${slug}' is already taken. Edit that product, or pick a different title.`,
    };
  }

  const { data, error } = await supabase
    .from("products")
    .insert({
      title,
      slug,
      status,
      sku_prefix: skuPrefix,
      description: field(formData, "description") || null,
      fabric: field(formData, "fabric") || null,
      care: field(formData, "care") || null,
      fit_notes: field(formData, "fit_notes") || null,
    })
    .select("slug")
    .single();

  if (error || !data) {
    return { status: "error", message: explainAdmin(error) };
  }

  revalidatePath("/admin/products");
  revalidatePath("/");

  // Straight to the product: a product with no variants cannot be sold, so
  // creating one is not the end of the task — the grid is.
  redirect(`/admin/products/${data.slug}`);
}

export async function updateProduct(
  _prev: ProductActionResult,
  formData: FormData,
): Promise<ProductActionResult> {
  const slug = field(formData, "slug");
  if (!slug) return { status: "error", message: "Missing product." };

  const title = field(formData, "title");
  if (!title) return { status: "error", message: "Give the product a title." };

  // Compared with !== rather than a list + .includes(): TypeScript does not
  // narrow a string from Array.includes, so the version that reads better here
  // is the one that keeps `status` the enum the database column actually is.
  const status = field(formData, "status");
  if (status !== "draft" && status !== "active" && status !== "archived") {
    return { status: "error", message: "Pick a valid status." };
  }

  const supabase = await createSessionSupabase();

  // sku_prefix is deliberately absent: it is set at creation and not editable
  // here, because changing it silently orphans every SKU already generated.
  const { error } = await supabase
    .from("products")
    .update({
      title,
      status,
      description: field(formData, "description") || null,
      fabric: field(formData, "fabric") || null,
      care: field(formData, "care") || null,
      fit_notes: field(formData, "fit_notes") || null,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug);

  if (error) return { status: "error", message: explainAdmin(error) };

  revalidatePath(`/admin/products/${slug}`);
  revalidatePath("/admin/products");
  revalidatePath(`/product/${slug}`);
  revalidatePath("/");

  return { status: "ok", message: "Saved." };
}

/**
 * Upload one photo and attach it to the product.
 *
 * The path is derived from the product id and a timestamp rather than the
 * uploaded filename: two phones both produce IMG_0421.jpg, and the second
 * upload would silently overwrite the first.
 */
export async function uploadProductPhoto(
  _prev: ProductActionResult,
  formData: FormData,
): Promise<ProductActionResult> {
  const productId = field(formData, "product_id");
  const slug = field(formData, "slug");
  const alt = field(formData, "alt");

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Choose a photo first." };
  }

  if (!productId || !slug) {
    return { status: "error", message: "Missing product." };
  }

  // Checked here as well as by the bucket policy. The bucket rejects it either
  // way; catching it here means the operator sees a sentence instead of a
  // storage error code.
  if (!file.type.startsWith("image/")) {
    return { status: "error", message: "That file is not an image." };
  }

  if (file.size > 5 * 1024 * 1024) {
    return {
      status: "error",
      message: "That image is over 5 MB. Resize it and try again.",
    };
  }

  const supabase = await createSessionSupabase();

  const ext = (file.name.split(".").pop() ?? "jpg")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  const path = `${productId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("product-images")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return {
      status: "error",
      message: uploadError.message.includes("row-level security")
        ? "You are not allowed to upload photos."
        : "The upload failed. Try again.",
    };
  }

  const { data: pub } = supabase.storage.from("product-images").getPublicUrl(path);

  // Position is one past the current highest, so a new photo lands at the end
  // of the gallery rather than jumping to the front.
  const { data: last } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: insertError } = await supabase.from("product_images").insert({
    product_id: productId,
    url: pub.publicUrl,
    alt: alt || null,
    position: (last?.position ?? -1) + 1,
  });

  if (insertError) {
    // The bytes are already in the bucket and would be orphaned. Removing them
    // is the honest cleanup: a row-less object is invisible and costs storage
    // forever, and the operator has no way to see it exists.
    await supabase.storage.from("product-images").remove([path]);
    return { status: "error", message: explainAdmin(insertError) };
  }

  revalidatePath(`/admin/products/${slug}`);
  revalidatePath(`/product/${slug}`);
  revalidatePath("/");

  return { status: "ok", message: "Photo added." };
}

export async function deleteProductPhoto(
  _prev: ProductActionResult,
  formData: FormData,
): Promise<ProductActionResult> {
  const imageId = field(formData, "image_id");
  const slug = field(formData, "slug");
  const url = field(formData, "url");

  if (!imageId || !slug) {
    return { status: "error", message: "Missing photo." };
  }

  const supabase = await createSessionSupabase();

  const { error } = await supabase.from("product_images").delete().eq("id", imageId);
  if (error) return { status: "error", message: explainAdmin(error) };

  // Only Storage URLs are removable from here. A /images/... path is a file in
  // the repo, and deleting the row is all this can honestly do — pretending to
  // delete a checked-in file would be a lie.
  const match = url.match(/\/storage\/v1\/object\/public\/product-images\/(.+)$/);
  if (match) {
    await supabase.storage.from("product-images").remove([decodeURIComponent(match[1])]);
  }

  revalidatePath(`/admin/products/${slug}`);
  revalidatePath(`/product/${slug}`);
  revalidatePath("/");

  return { status: "ok", message: "Photo removed." };
}

/**
 * Deleting a product.
 *
 * Order history survives this by construction: order_items carries
 * title_snapshot / sku_snapshot / unit_price_kes and its variant_id is
 * ON DELETE SET NULL, so the line the customer bought stays readable after the
 * variant it came from is gone. That is the same rule that makes editing a
 * price safe, and it is why this can be a delete at all.
 *
 * The photos are removed from Storage as well as from the table. The rows would
 * cascade on their own; the bytes would not, and an orphaned object is
 * invisible, costs storage forever, and nobody can find it to clean up.
 */
export async function deleteProduct(
  _prev: ProductActionResult,
  formData: FormData,
): Promise<ProductActionResult> {
  const slug = field(formData, "slug");
  const confirm = field(formData, "confirm");

  if (!slug) return { status: "error", message: "Missing product." };

  // Typed by hand. A destructive button that is one stray tap away from working
  // is a button that eventually works by accident.
  if (confirm !== slug) {
    return {
      status: "error",
      message: `Type the URL name exactly — ${slug} — to confirm.`,
    };
  }

  const supabase = await createSessionSupabase();

  const { data: product } = await supabase
    .from("products")
    .select("id,product_images(url)")
    .eq("slug", slug)
    .maybeSingle();

  if (!product) return { status: "error", message: "That product no longer exists." };

  const { error } = await supabase.from("products").delete().eq("id", product.id);
  if (error) return { status: "error", message: explainAdmin(error) };

  const images = Array.isArray(product.product_images) ? product.product_images : [];
  const paths = images
    .map((i) => String(i.url ?? ""))
    .map((url) => url.match(/\/storage\/v1\/object\/public\/product-images\/(.+)$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => decodeURIComponent(m[1]));

  if (paths.length) {
    // Best effort, and after the row is gone. A storage failure here leaves an
    // invisible orphan, which is strictly better than refusing the delete the
    // operator asked for because the bucket was briefly unhappy.
    await supabase.storage.from("product-images").remove(paths);
  }

  revalidatePath("/admin/products");
  revalidatePath("/");
  revalidatePath("/sitemap.xml");

  redirect("/admin/products");
}