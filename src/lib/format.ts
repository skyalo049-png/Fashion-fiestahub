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