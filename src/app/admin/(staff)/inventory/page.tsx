import Link from "next/link";

import Badge from "@/components/ui/Badge";
import { buttonClass } from "@/components/ui/Button";
import Table, {
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@/components/ui/Table";
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
    <div className="border border-border-subtle px-5 py-4">
      <p className="font-body text-[10px] uppercase tracking-[0.25em] text-text-primary/40">
        {label}
      </p>
      <p
        className={[
          "mt-2 font-display text-2xl",
          tone ?? "text-text-primary",
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
      <header className="border-b border-border-subtle pb-6">
        <p className="font-body text-[10px] uppercase tracking-[0.4em] text-accent">
          Staff
        </p>
        <h1 className="mt-2 font-display text-3xl text-text-primary">Inventory</h1>
        <p className="mt-2 max-w-prose font-body text-sm text-text-primary/50">
          Stock is edited on the product itself — this page only reads it. A
          number here changes the moment a restock is saved or an order is
          confirmed.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <Stat
          label={`Low stock (≤ ${threshold})`}
          value={lowStock.length}
          tone={lowStock.length ? "text-accent" : "text-text-primary"}
        />
        <Stat
          label="Out of stock"
          value={outOfStock.length}
          tone={outOfStock.length ? "text-red-300/90" : "text-text-primary"}
        />
        <Stat label="Units on the shelf" value={totalUnits} />
      </div>

      {rows.length === 0 ? (
        <div className="mt-16 border border-dashed border-border-default px-6 py-16 text-center">
          <p className="font-display text-xl text-text-primary/80">Nothing in stock</p>
          <p className="mx-auto mt-3 max-w-sm font-body text-sm text-text-primary/40">
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
              <h2 className="border-b border-border-subtle pb-3 font-body text-[10px] uppercase tracking-[0.25em] text-accent">
                Needs a restock
              </h2>
              <ul className="mt-4 divide-y divide-border-subtle border border-border-subtle">
                {[...outOfStock, ...lowStock].map((row) => (
                  <li
                    key={row.variantId}
                    className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"
                  >
                    <div className="min-w-0">
                      <Link
                        href={`/admin/products/${row.productSlug}`}
                        className="font-body text-sm text-text-primary transition-colors hover:text-accent"
                      >
                        {row.productTitle}
                      </Link>
                      <p className="mt-1 font-body text-xs text-text-primary/40">
                        {variantName(row)}
                        <span className="text-text-primary/25"> · </span>
                        <span className="font-mono text-[11px]">
                          {row.sku}
                        </span>
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-body text-xs text-text-primary/40">
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
            <h2 className="border-b border-border-subtle pb-3 font-body text-[10px] uppercase tracking-[0.25em] text-accent">
              Everything ({rows.length})
            </h2>

            <Table className="mt-4">
              <TableHead
                headings={[
                  "Product",
                  "Variant",
                  "SKU",
                  "Price",
                  "Shelf",
                  "Reserved",
                  "Sellable",
                  "",
                ]}
              />
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.variantId}>
                    <TableCell>
                      <Link
                        href={`/admin/products/${row.productSlug}`}
                        className="font-body text-sm text-text-primary transition-colors hover:text-accent"
                      >
                        {row.productTitle}
                      </Link>
                      {row.productStatus !== "active" ? (
                        <span className="ml-2 font-body text-[10px] uppercase tracking-[0.2em] text-text-primary/30">
                          {row.productStatus}
                        </span>
                      ) : null}
                    </TableCell>
                    <TableCell className="font-body text-xs">
                      {variantName(row)}
                    </TableCell>
                    <TableCell className="font-mono text-[11px] text-text-primary/40">
                      {row.sku}
                    </TableCell>
                    <TableCell className="font-body text-xs">
                      {formatKes(row.priceKes)}
                    </TableCell>
                    <TableCell className="font-body text-xs">
                      {row.stockQty}
                    </TableCell>
                    <TableCell className="font-body text-xs">
                      {row.reservedQty > 0 ? (
                        <span className="text-accent">{row.reservedQty}</span>
                      ) : (
                        <span className="text-text-primary/30">—</span>
                      )}
                    </TableCell>
                    <TableCell className="font-body text-xs text-text-primary">
                      {row.availableQty}
                    </TableCell>
                    <TableCell>
                      <StockPill qty={row.stockQty} threshold={threshold} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </section>
        </>
      )}
    </div>
  );
}