/**
 * Money formatting, in one place.
 *
 * Was duplicated inside ProductCard. The PDP, the drawer, checkout and the
 * order page all render prices, and four copies of this is how you end up
 * with KSh 8,800 on one screen and KES 8800.00 on the next.
 */
const kes = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

export function formatKes(amount: number): string {
  return kes.format(amount).replace("KES", "KSh");
}

/**
 * A timestamp for a staff screen, or an em dash.
 *
 * Timestamps come out of PostgREST as ISO strings and out of our own parsers as
 * "" when the field was missing. Both are handled here rather than at each call
 * site, so no screen has to remember that a null payment_verified_at is normal
 * and an Invalid Date is not something to render at someone.
 */
const when = new Intl.DateTimeFormat("en-KE", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

export function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? "—" : when.format(date);
}