import type { Product } from "@/lib/catalogue";

const kes = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  maximumFractionDigits: 0,
});

export function formatKes(amount: number) {
  return kes.format(amount).replace("KES", "KSh");
}

export default function ProductCard({ product }: { product: Product }) {
  const soldOut = product.totalAvailable <= 0;

  // Distinct colours across variants, for the swatch row. Null-colour variants
  // (a one-size item) contribute nothing rather than an empty chip.
  const colours = [
    ...new Set(
      product.variants
        .map((v) => v.color)
        .filter((c): c is string => Boolean(c)),
    ),
  ];

  const sizes = [
    ...new Set(
      product.variants
        .filter((v) => v.availableQty > 0)
        .map((v) => v.size)
        .filter((s): s is string => Boolean(s)),
    ),
  ];

  return (
    <article className="group flex flex-col bg-charcoal border border-pearl/8 hover:border-champagne/40 transition-colors duration-300">
      <div className="relative aspect-[4/5] overflow-hidden bg-obsidian">
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
      </div>

      <div className="flex flex-col gap-3 p-5">
        <h2 className="font-display text-lg leading-snug text-pearl">
          {product.title}
        </h2>

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
                className="font-body text-[10px] tracking-wider uppercase px-2 py-1 border border-champagne/20 text-champagne/70"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
