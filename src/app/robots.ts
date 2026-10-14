import type { MetadataRoute } from "next";
import { site, absoluteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Admin is staff-only. RLS is the real boundary; this just keeps it
      // out of the index.
      disallow: ["/admin", "/api/"],
    },
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.url,
  };
}