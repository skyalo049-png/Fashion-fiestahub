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