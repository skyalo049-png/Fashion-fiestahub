"use client";

import Link from "next/link";

import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/catalogue";
import { formatKes } from "@/lib/format";

/**
 * Grid card.
 *
 * A client component because the buy button writes to the cart. The card image
 * and copy could render on the server, but splitting one card into a server
 * shell plus a client island buys nothing at this size.
 *
 * The CTA is always present — there is no hover-revealed overlay anywhere in
 * this file, and there must not be one added later. On a phone there is no
 * hover state at all, so an opacity-0 button is a button that does not exist
 * for the majority of this shop's traffic.
 */
export default function ProductCard({ product }: { product: Product }) {
  const add = useCart((s) => s.add);

  const soldOut = product.totalAvailable <= 0;
  const inStock = product.variants.filter((v) => v.availableQty > 0);

  // Distinct colours across variants, for the swatch row. Null-colour variants
  // (a one-size item) contribute nothing rather than an empty chip.
  const colours = [
    ...new Set(
      product.variants
        .map((v) => v.color)
        .filter((c): c is string => Boolean(c)),
    ),
  ];

  // Sizes are listed whether or not they are in stock, so a shopper can see
  // their size exists and is simply gone — "M sold out" is useful information,
  // a missing "M" reads as though the dress was never made in it.
  const sizes = [
    ...new Set(
      product.variants
        .map((v) => v.size)
        .filter((s): s is string => Boolean(s)),
    ),
  ];

  const soldOutSizes = new Set(
    product.variants
      .filter((v) => v.availableQty <= 0)
      .map((v) => v.size)
      .filter((s): s is string => Boolean(s)),
  );

  // One size and one colour means there is no choice to make, so the card can
  // complete the add in one tap. Anything else has to go to the PDP: silently
  // picking a size for someone is how you ship a dress that does not fit.
  const singleVariant = inStock.length === 1 ? inStock[0] : null;

  function addSingle() {
    if (!singleVariant) return;
    add({
      variantId: singleVariant.id,
      productSlug: product.slug,
      title: product.title,
      size: singleVariant.size,
      color: singleVariant.color,
      sku: singleVariant.sku,
      priceKes: singleVariant.priceKes,
      imageUrl: product.imageUrl,
    });
  }

  return (
    <article className="group flex flex-col bg-charcoal border border-pearl/8 hover:border-champagne/40 transition-colors duration-300">
      <Link
        href={`/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-obsidian"
        aria-label={`View ${product.title}`}
      >
        {product.imageUrl ? (
          // Local files under public/, so a plain img avoids the optimizer
          // needing a remote-pattern config. Swap to next/image when the real
          // shoot lands and sizes are known.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={product.imageUrl}
            alt={product.imageAlt}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-charcoal-2 to-obsidian">
            <span className="font-display text-4xl text-champagne/25">
              {product.title.charAt(0)}
            </span>
          </div>
        )}

        {soldOut && (
          <span className="absolute top-3 left-3 bg-obsidian/90 border border-pearl/15 px-2.5 py-1 font-body text-[10px] tracking-[0.2em] uppercase text-pearl/70">
            Sold out
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <Link href={`/product/${product.slug}`} className="group/title">
          <h2 className="font-display text-lg leading-snug text-pearl group-hover/title:text-champagne transition-colors">
            {product.title}
          </h2>
        </Link>

        {product.description && (
          <p className="font-body text-sm font-light leading-relaxed text-pearl/50 line-clamp-2">
            {product.description}
          </p>
        )}

        <div className="mt-1 flex items-baseline justify-between gap-3">
          <span className="font-body text-champagne">
            {product.fromPriceKes > 0
              ? formatKes(product.fromPriceKes)
              : "Price on request"}
          </span>
          <span className="font-body text-[11px] tracking-widest uppercase text-pearl/35">
            {soldOut ? "—" : `${product.totalAvailable} in stock`}
          </span>
        </div>

        {(colours.length > 0 || sizes.length > 0) && (
          <div className="mt-2 flex flex-wrap gap-1.5 border-t border-pearl/8 pt-3">
            {colours.map((c) => (
              <span
                key={c}
                className="font-body text-[10px] tracking-wider uppercase px-2 py-1 border border-pearl/12 text-pearl/55"
              >
                {c}
              </span>
            ))}
            {sizes.map((s) => (
              <span
                key={s}
                className={
                  soldOutSizes.has(s) && inStock.length === 0
                    ? "font-body text-[10px] tracking-wider uppercase px-2 py-1 border border-pearl/10 text-pearl/25 line-through"
                    : "font-body text-[10px] tracking-wider uppercase px-2 py-1 border border-champagne/20 text-champagne/70"
                }
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Pushed to the bottom so every card in a row has its CTA on the same
            line regardless of how long the title or description ran. */}
        <div className="mt-auto pt-4">
          {soldOut ? (
            <span className="block w-full border border-pearl/10 px-5 py-3 text-center font-body text-[11px] uppercase tracking-[0.25em] text-pearl/30">
              Sold out
            </span>
          ) : singleVariant ? (
            <button
              type="button"
              onClick={addSingle}
              className="block w-full bg-champagne px-5 py-3 text-center font-body text-[11px] uppercase tracking-[0.25em] text-obsidian transition-colors hover:bg-champagne-light"
            >
              Add to bag
            </button>
          ) : (
            <Link
              href={`/product/${product.slug}`}
              className="block w-full border border-champagne/40 px-5 py-3 text-center font-body text-[11px] uppercase tracking-[0.25em] text-champagne transition-colors hover:bg-champagne hover:text-obsidian"
            >
              Select size
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}