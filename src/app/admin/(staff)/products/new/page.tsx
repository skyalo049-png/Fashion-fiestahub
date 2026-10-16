import Link from "next/link";

import { CreateProductForm } from "@/components/admin/ProductForm";

export const metadata = { title: "New product" };

/**
 * Creating a product, on a page of its own rather than in a modal.
 *
 * A static `new` segment wins over `[slug]`, so this route is reached without
 * the detail page ever trying to look up a product called "new". That matters:
 * the detail page treats a miss as `notFound()`, which is right for a bad slug
 * and wrong for a create button.
 *
 * Sizes and colours are not asked for here. A product with no variants cannot
 * be sold, so the grid is the first thing on the screen after saving — filling
 * it in during creation would mean holding a half-built grid in client state
 * while the product row does not yet exist to attach it to.
 */
export default function NewProductPage() {
  return (
    <div className="max-w-2xl">
      <Link
        href="/admin/products"
        className="font-body text-[11px] uppercase tracking-[0.2em] text-pearl/40 transition-colors hover:text-champagne"
      >
        ← Products
      </Link>

      <header className="mt-6 border-b border-pearl/10 pb-6">
        <h1 className="font-display text-3xl text-pearl">New product</h1>
        <p className="mt-2 max-w-prose font-body text-sm text-pearl/50">
          Save the product first, then add its sizes, colours and photos on the
          next screen.
        </p>
      </header>

      <div className="mt-8">
        <CreateProductForm />
      </div>
    </div>
  );
}