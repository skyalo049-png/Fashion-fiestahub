import Link from "next/link";

import Badge, { type BadgeTone } from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { listProducts } from "@/lib/admin-products";
import { formatKes } from "@/lib/format";

export const metadata = { title: "Products" };

/**
 * The catalogue, as staff see it.
 *
 * One row per product, with the two numbers that decide whether it is worth
 * opening: how many sizes and colours exist, and how many units are on the
 * shelf. A product at zero stock is flagged rather than hidden, because a
 * sold-out bestseller is a restock decision, not a reason to make the product
 * disappear from the screen.
 */

/**
 * A tone, not a class string. The old map pinned Tailwind colour steps, which
 * meant this page and `lib/admin.ts` could quietly disagree about what
 * "active" looks like — and they did. Both now name the tone and the token
 * sheet decides the hue.
 */
const STATUS_TONE: Record<string, BadgeTone> = {
  active: "success",
  draft: "accent",
  archived: "muted",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Active",
  draft: "Draft",
  archived: "Archived",
};

export default async function ProductsPage() {
  const products = await listProducts();

  return (
    <div>
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-pearl/10 pb-6">
        <div>
          <p className="font-body text-[10px] uppercase tracking-[0.4em] text-champagne">
            Staff
          </p>
          <h1 className="mt-2 font-display text-3xl text-pearl">Products</h1>
          <p className="mt-2 max-w-prose font-body text-sm text-pearl/50">
            Prices and stock are edited here. A saved change is live on the shop
            the moment the page is refreshed.
          </p>
        </div>

        <Link
          href="/admin/products/new"
          className={buttonClass("primary")}
        >
          New product
        </Link>
      </header>

      {products.length === 0 ? (
        <div className="mt-16 border border-dashed border-pearl/15 px-6 py-16 text-center">
          <p className="font-display text-xl text-pearl/80">No products yet</p>
          <p className="mx-auto mt-3 max-w-sm font-body text-sm text-pearl/40">
            Create one, then fill in its sizes and colours. A product with no
            sizes cannot be sold, so the grid is the next step after saving.
          </p>
          <Link
            href="/admin/products/new"
            className={buttonClass("outline", "md", "mt-6")}
          >
            New product
          </Link>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-pearl/10 border border-pearl/10">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                href={`/admin/products/${product.slug}`}
                className="grid grid-cols-1 gap-3 px-5 py-5 transition-colors hover:bg-pearl/[0.03] sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-body text-base text-pearl">
                      {product.title}
                    </span>
                    <Badge tone={STATUS_TONE[product.status] ?? "neutral"}>
                      {STATUS_LABEL[product.status] ?? product.status}
                    </Badge>
                    {product.totalStock === 0 ? (
                      <Badge tone="danger">Out of stock</Badge>
                    ) : null}
                  </div>

                  <p className="mt-2 font-mono text-[11px] text-pearl/35">
                    /product/{product.slug}
                    {product.skuPrefix ? (
                      <span className="text-pearl/25">
                        {" "}
                        · {product.skuPrefix}
                      </span>
                    ) : null}
                  </p>

                  <p className="mt-1 font-body text-xs text-pearl/40">
                    {product.variantCount === 0
                      ? "No sizes yet"
                      : `${product.variantCount} size${product.variantCount === 1 ? "" : "s"} and colour${product.variantCount === 1 ? "" : "s"}`}
                    <span className="text-pearl/25"> · </span>
                    {product.totalStock} in stock
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-body text-base text-pearl">
                    {product.fromPriceKes === null
                      ? "—"
                      : `from ${formatKes(product.fromPriceKes)}`}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
