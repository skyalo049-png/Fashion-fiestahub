import Link from "next/link";
import { notFound } from "next/navigation";

import { PhotoManager } from "@/components/admin/PhotoManager";
import {
  DeleteProductForm,
  EditProductForm,
} from "@/components/admin/ProductForm";
import { VariantGrid } from "@/components/admin/VariantGrid";
import { getProduct } from "@/lib/admin-products";

export const metadata = { title: "Product" };

/**
 * One product, in the three pieces it is edited in.
 *
 * The split is not cosmetic. The product row, the variant grid and the photos
 * are three separate database operations with three separate failure modes, and
 * one form covering all of them would mean a rejected photo discarding a price
 * edit that had already been typed and not yet saved.
 *
 * The grid comes first because it is the thing that gets touched every week —
 * a restock is a number in a cell, while the copy above it changes once. A
 * screen ordered by how often it is used puts the daily work above the fold.
 */

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);

  // A missing product and a product we may not see are the same answer to the
  // person asking: not found.
  if (!product) notFound();

  const totalStock = product.variants.reduce((sum, v) => sum + v.stockQty, 0);

  return (
    <div>
      <Link
        href="/admin/products"
        className="font-body text-[11px] uppercase tracking-[0.2em] text-pearl/40 transition-colors hover:text-champagne"
      >
        ← Products
      </Link>

      <header className="mt-6 flex flex-wrap items-start justify-between gap-4 border-b border-pearl/10 pb-6">
        <div className="min-w-0">
          <h1 className="font-display text-3xl text-pearl">{product.title}</h1>
          <p className="mt-2 font-mono text-[11px] text-pearl/35">
            /product/{product.slug}
            {product.skuPrefix ? (
              <span className="text-pearl/25"> · {product.skuPrefix}</span>
            ) : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <span className="font-body text-xs text-pearl/40">
            {totalStock} in stock
          </span>
          <Link
            href={`/product/${product.slug}`}
            className="border border-pearl/20 px-4 py-2 font-body text-[11px] uppercase tracking-[0.2em] text-pearl/60 transition-colors hover:border-pearl/40 hover:text-pearl"
          >
            View on site
          </Link>
        </div>
      </header>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_380px]">
        {/* ---------------- left: the daily work ---------------- */}
        <div className="space-y-10">
          <section>
            <h2 className="border-b border-pearl/10 pb-3 font-body text-[10px] uppercase tracking-[0.25em] text-champagne">
              Sizes, colours and stock
            </h2>
            <div className="mt-6">
              <VariantGrid
                productId={product.id}
                slug={product.slug}
                variants={product.variants}
                skuPrefix={product.skuPrefix}
              />
            </div>
          </section>

          <section>
            <h2 className="border-b border-pearl/10 pb-3 font-body text-[10px] uppercase tracking-[0.25em] text-champagne">
              Photos
            </h2>
            <div className="mt-6">
              <PhotoManager
                productId={product.id}
                slug={product.slug}
                images={product.images}
              />
            </div>
          </section>
        </div>

        {/* ---------------- right: the copy ---------------- */}
        <div className="space-y-10">
          <section>
            <h2 className="border-b border-pearl/10 pb-3 font-body text-[10px] uppercase tracking-[0.25em] text-champagne">
              Details
            </h2>
            <div className="mt-6">
              <EditProductForm
                product={{
                  slug: product.slug,
                  title: product.title,
                  description: product.description ?? "",
                  fabric: product.fabric ?? "",
                  care: product.care ?? "",
                  fitNotes: product.fitNotes ?? "",
                  status: product.status,
                  skuPrefix: product.skuPrefix,
                }}
              />
            </div>
          </section>

          <section className="border-t border-pearl/10 pt-8">
            <h2 className="font-body text-[10px] uppercase tracking-[0.25em] text-pearl/40">
              Danger
            </h2>
            <div className="mt-4">
              <DeleteProductForm slug={product.slug} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}