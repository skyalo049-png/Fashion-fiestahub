import type { Metadata } from "next";
import { notFound } from "next/navigation";

import ProductDetail from "@/components/ProductDetail";
import { getActiveProductSlugs, getProductBySlug } from "@/lib/catalogue";
import { formatKes } from "@/lib/format";
import { site, absoluteUrl } from "@/lib/site";

/**
 * The PDP.
 *
 * A server component that fetches once and hands the whole product to a client
 * component, because variant selection is interactive and the alternative —
 * shipping the sizes and prices down as props and re-fetching on every choice —
 * buys nothing. The product is one row plus its variants; it is small.
 *
 * getProductBySlug returns null for a missing slug AND for an inactive product,
 * deliberately. A draft the owner has not published and a URL a customer
 * mistyped are the same thing from the outside, and both are a 404 rather than
 * a 500 or a "coming soon" page that leaks an unpublished product's existence.
 */

// Matches the PLP. A price or a stock change should not need a redeploy, and
// 60 seconds is short enough that a sell-out shows up while the shopper is
// still on the page.
export const revalidate = 60;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const slugs = await getActiveProductSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    // The page itself calls notFound(); this only keeps the metadata honest
    // for the moment before that happens.
    return { title: "Not found" };
  }

  const description =
    product.description ??
    `${product.title} from ${site.name}. ${site.tagline}.`;

  return {
    title: product.title,
    description,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: product.title,
      description,
      url: absoluteUrl(`/product/${product.slug}`),
      locale: site.locale,
      // Only when there is a real photograph. A letter tile is not an image a
      // customer should see in a WhatsApp preview, and Next omits the tag
      // entirely when this is undefined.
      images: product.imageUrl ? [{ url: product.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description,
    },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) notFound();

  // Structured data. Google uses this for the price and availability line in a
  // shopping result, and it costs one script tag. `fromPriceKes` is the lowest
  // live variant price, which is what the card shows and therefore what the
  // listing must agree with — a mismatch here is a Merchant Center warning.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description ?? undefined,
    image: product.images.map((image) => absoluteUrl(image.url)),
    brand: { "@type": "Brand", name: site.name },
    ...(product.fromPriceKes > 0
      ? {
          offers: {
            "@type": "AggregateOffer",
            priceCurrency: "KES",
            lowPrice: product.fromPriceKes,
            offerCount: product.variants.length,
            availability:
              product.totalAvailable > 0
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
          },
        }
      : {}),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // The payload is built here from typed values, not interpolated from
        // user input, so there is nothing in it that can close the tag early.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetail product={product} />
      {/* Read by nobody, rendered for the crawler: keeps the price in the HTML
          even when the client component has not hydrated. */}
      <p className="sr-only">
        {product.title} — {formatKes(product.fromPriceKes)}
      </p>
    </>
  );
}