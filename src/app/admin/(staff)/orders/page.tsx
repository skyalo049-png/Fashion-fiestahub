import Link from "next/link";

import Badge from "@/components/ui/Badge";
import { ORDER_STATUS_LABEL } from "@/lib/admin";
import { listOrders } from "@/lib/admin-orders";
import { formatKes, formatWhen } from "@/lib/format";
import { ORDER_STATUS_TONE } from "@/lib/order-status";

export const metadata = { title: "Orders" };

/**
 * The orders queue.
 *
 * This is the screen /admin redirects to and the one the not-found page points
 * back at, so it is the difference between a dashboard and a 404 loop.
 *
 * Ordering of the filter tabs is the workflow, not the alphabet:
 *
 *   needs payment check  → the customer has paid and is waiting on us. This is
 *                          the only tab where being slow costs a sale.
 *   needs delivery quote → the customer cannot pay until we name a fee.
 *
 * Those two sit before "All" deliberately. A queue sorted by convenience puts
 * the work that matters last, and the whole reason this screen exists is that
 * money is sitting in an M-Pesa inbox waiting to be matched to an order.
 */

/** The tabs, in workflow order, with the statuses that are always shown. */
const TAB_ORDER = [
  "awaiting_payment_verification",
  "awaiting_delivery_quote",
  "awaiting_payment",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

/** Always rendered even at zero: a tab that vanishes looks like a bug. */
const ALWAYS_SHOWN = new Set([
  "awaiting_payment_verification",
  "awaiting_delivery_quote",
]);

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const active = status && status !== "all" ? status : "all";

  const { orders, counts } = await listOrders(active);
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);

  const tabs = [
    { key: "all", label: "All", count: total },
    ...TAB_ORDER.map((key) => ({
      key,
      label: ORDER_STATUS_LABEL[key] ?? key.replaceAll("_", " "),
      count: counts[key] ?? 0,
    })).filter((t) => t.count > 0 || ALWAYS_SHOWN.has(t.key)),
  ];

  return (
    <div>
      <header className="border-b border-border-subtle pb-6">
        <p className="font-body text-[10px] uppercase tracking-[0.4em] text-accent">
          Staff
        </p>
        <h1 className="mt-2 font-display text-3xl text-text-primary">Orders</h1>
        <p className="mt-2 max-w-prose font-body text-sm text-text-primary/50">
          Verify the M-Pesa code before you mark an order paid — that is the step
          that takes the money out of the shelf.
        </p>
      </header>

      <nav
        aria-label="Filter by status"
        className="mt-6 flex flex-wrap gap-2 border-b border-border-subtle pb-6"
      >
        {tabs.map((tab) => {
          const isActive = active === tab.key;
          return (
            <Link
              key={tab.key}
              href={tab.key === "all" ? "/admin/orders" : `/admin/orders?status=${tab.key}`}
              aria-current={isActive ? "page" : undefined}
              className={[
                "border px-3 py-2 font-body text-[11px] uppercase tracking-[0.2em] transition-colors",
                isActive
                  ? "border-accent bg-accent text-text-inverse"
                  : "border-border-default text-text-primary/60 hover:border-border-strong hover:text-text-primary",
              ].join(" ")}
            >
              {tab.label}
              <span className={isActive ? "ml-2 text-text-inverse/60" : "ml-2 text-text-primary/40"}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </nav>

      {orders.length === 0 ? (
        <div className="mt-16 border border-dashed border-border-default px-6 py-16 text-center">
          <p className="font-display text-xl text-text-primary/80">Nothing in this queue</p>
          <p className="mx-auto mt-3 max-w-sm font-body text-sm text-text-primary/40">
            {active === "all"
              ? "No orders yet. They appear here the moment a customer checks out."
              : `No orders are ${(ORDER_STATUS_LABEL[active] ?? active).toLowerCase()} right now.`}
          </p>
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-border-subtle border border-border-subtle">
          {orders.map((order) => (
            <li key={order.orderNumber}>
              <Link
                href={`/admin/orders/${order.orderNumber}`}
                className="grid grid-cols-1 gap-3 px-5 py-5 transition-colors hover:bg-text-primary/[0.03] sm:grid-cols-[1fr_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-sm text-text-primary">
                      {order.orderNumber}
                    </span>
                    <Badge tone={ORDER_STATUS_TONE[order.status] ?? "neutral"}>
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </Badge>
                    {order.mpesaCode ? (
                      <span className="font-mono text-[11px] text-accent/80">
                        {order.mpesaCode}
                      </span>
                    ) : null}
                  </div>

                  <p className="mt-2 truncate font-body text-sm text-text-primary/70">
                    {order.fullName}
                    {order.city ? (
                      <span className="text-text-primary/40"> · {order.city}</span>
                    ) : null}
                  </p>

                  <p className="mt-1 font-body text-xs text-text-primary/40">
                    {order.phone}
                    <span className="text-text-primary/25"> · </span>
                    {order.itemCount} item{order.itemCount === 1 ? "" : "s"}
                    <span className="text-text-primary/25"> · </span>
                    {formatWhen(order.createdAt)}
                  </p>
                </div>

                <div className="text-left sm:text-right">
                  <p className="font-body text-base text-text-primary">
                    {order.totalKes !== null
                      ? formatKes(order.totalKes)
                      : order.deliveryFeeKes === null
                        ? formatKes(order.subtotalKes)
                        : "—"}
                  </p>
                  {order.deliveryFeeKes === null ? (
                    <p className="mt-1 font-body text-[10px] uppercase tracking-[0.2em] text-accent/70">
                      No delivery fee yet
                    </p>
                  ) : null}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
