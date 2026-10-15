/**
 * Single source of truth for brand + canonical origin.
 * Everything user-facing (metadata, OG, sitemap, robots) reads from here.
 */
export const site = {
  name: "Fashion Fiesta Hub",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  title: "Fashion Fiesta Hub — Ladies Fashion in Nairobi, Kenya",
  description:
    "Ladies fashion for the bold, vibrant Kenyan woman. M-Pesa accepted, Nairobi delivery, nationwide shipping.",
  tagline: "Celebrate the African woman in you",
  locale: "en_KE",
  city: "Nairobi",
  country: "Kenya",
} as const;

export const absoluteUrl = (path = "/") =>
  new URL(path, site.url).toString();

/**
 * Where the money actually goes.
 *
 * Both values are shown to customers, so both are NEXT_PUBLIC_ on purpose —
 * there is no secret here, and a build-time constant beats a database round
 * trip on a page someone reaches while standing in a queue.
 *
 * They are read from the environment rather than hard-coded because the
 * payment number and the WhatsApp line belong to the owner, not to this repo,
 * and the repo is public. An unset value is not an error: `whatsappLink`
 * returns null and every caller drops the link rather than rendering a dead
 * `wa.me/` href, and the payment panel falls back to "we send you the number
 * on WhatsApp".
 *
 * `mpesaNumber` is a PERSONAL number, not a Buy Goods till. The distinction is
 * not cosmetic: a till is paid through "Buy Goods and Services" and a personal
 * number through "Send Money", and a customer told "till" who picks the first
 * of those will not find this number. OrderStatus says Send Money for that
 * reason — do not "tidy" it back to till.
 */
export const payments = {
  mpesaNumber: process.env.NEXT_PUBLIC_MPESA_NUMBER ?? "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
} as const;

/**
 * `0798638605`, `+254 798 638 605` and `254798638605` are the same number.
 *
 * wa.me accepts only the last form, so a leading zero — which is how a Kenyan
 * writes their own number, and therefore exactly what gets pasted into the
 * environment variable — has to be converted rather than passed through. A
 * `wa.me/0798638605` href is not a build error; it is a link that silently
 * opens nothing.
 */
export function normaliseKePhone(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  return digits;
}

/**
 * `254798638605` or `0798638605` -> `0798 638 605`.
 *
 * The display form is the local one, because that is the form the customer
 * types into their own phone. The stored form is whatever the owner pasted.
 */
export function formatKePhone(value: string): string {
  const digits = normaliseKePhone(value);
  if (digits.length !== 12 || !digits.startsWith("254")) return value;
  const local = `0${digits.slice(3)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
}

/**
 * A wa.me click-to-chat link, or null when no number is configured.
 *
 * The number is stripped to digits because wa.me rejects the `+` and the
 * spaces people naturally paste.
 */
export function whatsappLink(message: string): string | null {
  const digits = normaliseKePhone(payments.whatsapp);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}