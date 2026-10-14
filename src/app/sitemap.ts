import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site";

/**
 * Only public storefront routes belong here. /admin is deliberately excluded
 * (it is staff-only and disallowed in robots.ts).
 *
 * Product and collection URLs get appended in the UI phase, once the schema
 * is live and slugs are queryable.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/"),
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];
}