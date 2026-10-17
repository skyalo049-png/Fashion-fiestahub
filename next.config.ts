import type { NextConfig } from "next";

/**
 * Remote images.
 *
 * Product photographs live in the `product-images` bucket on Supabase Storage,
 * and their public URLs are absolute: `https://<project>.supabase.co/storage/
 * v1/object/public/product-images/...`. The optimizer refuses to fetch a host
 * it has not been told about, so both hosts have to be listed here — the local
 * stack on 127.0.0.1:54321 for development, and the hosted project for
 * production. Listing only one means the shop renders broken cards in the
 * other environment, which is exactly the kind of failure that survives to
 * production because it never happens on the machine it was written on.
 *
 * The seed rows also carry `/images/*.jpg` relative paths. Those never resolve
 * (see `resolveImage` in `src/lib/catalogue.ts`) and the card falls back to a
 * branded panel, so no local pattern is needed for them.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "54321",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "vikwakgswzvsynlaxhik.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
};

export default nextConfig;