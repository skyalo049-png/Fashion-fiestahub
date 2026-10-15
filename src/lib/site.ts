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
 * They are read from the environment rather than hard-coded because the till
 * and the WhatsApp line belong to the owner, not to this repo, and the repo
 * is public. An unset value is not an error: `whatsappLink` returns null and
 * every caller drops the link rather than rendering a dead `wa.me/` href, and
 * the payment panel falls back to "message us for the till number".
 */
export const payments = {
  mpesaTill: process.env.NEXT_PUBLIC_MPESA_TILL ?? "",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
} as const;

/**
 * A wa.me click-to-chat link, or null when no number is configured.
 *
 * The number is stripped to digits because wa.me rejects the `+` and the
 * spaces people naturally paste. A Kenyan number stored as `+254 712 345 678`
 * becomes `254712345678`, which is the form the API expects.
 */
export function whatsappLink(message: string): string | null {
  const digits = payments.whatsapp.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}