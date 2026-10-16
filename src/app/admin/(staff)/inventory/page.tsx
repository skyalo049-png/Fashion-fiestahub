import Link from "next/link";

import Badge from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import { getInventory, type InventoryRow } from "@/lib/admin-inventory";
import { formatKes } from "@/lib/format";

export const metadata = { title: "Inventory" };

/**
 * Live stock, split by the question being asked.
 *
 * "What is nearly gone?" and "can I sell one more?" are answered by different
 * numbers — the shelf and the shelf minus promises — and a screen that shows
 * only one of them is a screen that lets a shop oversell. The reserved column
 * exists for exactly that reason: three on the shelf with three reserved looks
 * like comfortable stock until you can see the reservation.
 */

function StockPill({ qty, threshold }: { qty: number; threshold: number }) {
  if (qty === 0) return <Badge tone="danger">Out</Badge>;
  if (qty <= threshold) return <Badge tone="accent">Low</Badge>;
  return <Badge tone="neutral">Ok</Badge>;
}

function variantName(row: InventoryRow): string {
  const parts = [row.size, row.color].filter((p): p is string => Boolean(p));
  return parts.length ? parts.join(" · ") : "One size";
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | string;
  tone?: string;
}) {
  return (
    <div className="border border-pearl/10 px-5 py-4">
      <p className="font-body text-[10px] uppercase tracking-[0.25em] text-pearl/40">
        {label}
      </p>
      <p
        className={[
          "mt-2 font-display text-2xl",
          tone ?? "text-pearl",
        ].join(" ")}
      >
        {value}
      </p>
    </div>
  );
}

export default async function InventoryPage() {
  const inventory = await getInventory();
  const { lowStock, outOfStock, totalUnits, threshold, rows } = inventory;

  return (
    <div>
      <header className="border-b border-pearl/10 pb-6">
        <p className="font-body text-[10px] uppercase tracking-[0.4em] text-champagne">
          Staff
        </p>
        <h1 className="mt-2 font-display text-3xl text-pearl">Inventory</h1>
        <p className="mt-2 max-w-prose font-body text-sm text-pearl/50">
          Stock is edited on the product itself — this page only reads it. A
          number here changes the moment a restock is saved or an order is
          confirmed.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat
          label={`Low stock (≤ ${threshold})`}
          value={lowStock.length}
          tone={lowStock.length ? "text-champagne" : "text-pearl"}
        />
        <Stat
          label="Out of stock"
          value={outOfStock.length}
          tone={outOfStock.length ? "text-red-300/90" : "text-pearl"}
        />
        <Stat label="Units on the shelf" value={totalUnits} />
      </div>

      {rows.length === 0 ? (
        <div className="mt-16 border border-dashed border-pearl/15 px-6 py-16 text-center">
          <p className="font-display text-xl text-pearl/80">Nothing in stock</p>
          <p className="mx-auto mt-3 max-w-sm font-body text-sm text-pearl/40">
            There are no sizes yet. Create a product, then fill in its grid of
            sizes and colours.
          </p>
          <Link
            href="/admin/products"
            className={buttonClass("outline", "md", "mt-6")}
          >
            Go to products
          </Link>
        </div>
      ) : (
        <>
          {(lowStock.length > 0 || outOfStock.length > 0) && (
            <section className="mt-12">
              <h2 className="border-b border-pearl/10 pb-3 font-body text-[10px] uppercase tracking-[0.25em] text-champagne">
                Needs a restock
              </h2>
              <ul className="mt-4 divide-y divide-pearl/10 border border-pearl/10">
                {[...outOfStock, ...lowStock].map((row) => (
                  <li
                    key={row.variantId}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${row.productSlug}`}
                        className="font-body text-sm text-pearl transition-colors hover:text-champagne"
                      >
                        {row.productTitle}
                      </Link>
                      <p className="mt-1 font-body text-xs text-pearl/40">
                        {variantName(row)}
                        <span className="text-pearl/25"> · </span>
                        <span className="font-mono text-[11px]">
                          {row.sku}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-body text-xs text-pearl/40">
                        {row.availableQty} sellable
                      </span>
                      <StockPill qty={row.stockQty} threshold={threshold} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="mt-12">
            <h2 className="border-b border-pearl/10 pb-3 font-body text-[10px] uppercase tracking-[0.25em] text-champagne">
              Everything ({rows.length})
            </h2>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] border-collapse text-left">
                <thead>
                  <tr className="border-b border-pearl/10">
                    {[
                      "Product",
                      "Variant",
                      "SKU",
                      "Price",
                      "Shelf",
                      "Reserved",
                      "Sellable",
                      "",
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="pb-3 pr-4 font-body text-[10px] uppercase tracking-[0.2em] text-pearl/40"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-pearl/10">
                  {rows.map((row) => (
                    <tr key={row.variantId} className="text-pearl/70">
                      <td className="py-3 pr-4">
                        <Link
                          href={`/admin/products/${row.productSlug}`}
                          className="font-body text-sm text-pearl transition-colors hover:text-champagne"
                        >
                          {row.productTitle}
                        </Link>
                        {row.productStatus !== "active" ? (
                          <span className="ml-2 font-body text-[10px] uppercase tracking-[0.2em] text-pearl/30">
                            {row.productStatus}
                          </span>
                        ) : null}
                      </td>
                      <td className="py-3 pr-4 font-body text-xs">
                        {variantName(row)}
                      </td>
                      <td className="py-3 pr-4 font-mono text-[11px] text-pearl/40">
                        {row.sku}
                      </td>
                      <td className="py-3 pr-4 font-body text-xs">
                        {formatKes(row.priceKes)}
                      </td>
                      <td className="py-3 pr-4 font-body text-xs">
                        {row.stockQty}
                      </td>
                      <td className="py-3 pr-4 font-body text-xs">
                        {row.reservedQty > 0 ? (
                          <span className="text-champagne">
                            {row.reservedQty}
                          </span>
                        ) : (
                          <span className="text-pearl/30">—</span>
                        )}
                      </td>
                      <td className="py-3 pr-4 font-body text-xs text-pearl">
                        {row.availableQty}
                      </td>
                      <td className="py-3">
                        <StockPill qty={row.stockQty} threshold={threshold} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}