import type { MetadataRoute } from "next";

import { getActiveProductSlugs } from "@/lib/catalogue";
import { absoluteUrl } from "@/lib/site";

/**
 * Only public storefront routes belong here. /admin is deliberately excluded
 * (it is staff-only and disallowed in robots.ts), and so is everything under
 * /order — an order page is personal and must never be crawled.
 *
 * Product URLs are generated from the database rather than hand-listed, so a
 * product the owner publishes at midnight is in the sitemap by morning with no
 * deploy. This runs at build time; the `revalidate` on the product pages does
 * not apply here, which is fine for a sitemap.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: absoluteUrl("/"),
      lastModified: now,
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  try {
    const slugs = await getActiveProductSlugs();

    return [
      ...staticRoutes,
      ...slugs.map((slug) => ({
        url: absoluteUrl(`/product/${slug}`),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
      })),
    ];
  } catch {
    // A database blip must not break the build or serve a sitemap that 500s.
    // The homepage entry is still true and still useful.
    return staticRoutes;
  }
}