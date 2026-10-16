import Link from "next/link";

/**
 * A not-found inside the staff area.
 *
 * Without this, notFound() on an order number falls through to the storefront's
 * 404, which offers "back to the shop" — the wrong destination for someone who
 * is working. This one offers the queue.
 */
export default function AdminNotFound() {
  return (
    <div className="py-20 text-center">
      <p className="font-body text-[10px] uppercase tracking-[0.3em] text-champagne">
        Staff area
      </p>
      <h1 className="mt-3 font-display text-2xl text-pearl">
        That is not here
      </h1>
      <p className="mt-3 font-body text-sm font-light text-pearl/50">
        The order or product you asked for does not exist, or is not yours to
        see.
      </p>
      <Link
        href="/admin/orders"
        className="mt-6 inline-block font-body text-[11px] uppercase tracking-[0.25em] text-champagne underline underline-offset-4"
      >
        Back to orders
      </Link>
    </div>
  );
}