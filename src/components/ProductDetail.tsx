"use client";

import { useState } from "react";

import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { useCart } from "@/lib/cart";
import type { Product, SizeChartRow, Variant } from "@/lib/catalogue";
import { formatKes } from "@/lib/format";

/**
 * The product page's interactive half.
 *
 * Variant selection is a matrix, not two independent lists: a size is only
 * offered in a colour it actually exists in, and vice versa. The alternative —
 * letting someone pick M and Navy separately and only discovering at checkout
 * that M/Navy was never made — is the failure this layout exists to prevent.
 *
 * Out-of-stock options are rendered and disabled, never removed. "M — sold out"
 * tells a shopper their size exists and is gone; a missing "M" tells them the
 * dress was never cut in it, which is a different and wrong message.
 */
export default function ProductDetail({ product }: { product: Product }) {
  const add = useCart((s) => s.add);

  const sizes = unique(
    product.variants.map((v) => v.size).filter((s): s is string => Boolean(s)),
  );
  const colours = unique(
    product.variants
      .map((v) => v.color)
      .filter((c): c is string => Boolean(c)),
  );

  const hasSizes = sizes.length > 0;
  const hasColours = colours.length > 0;

  // A product with one variant has nothing to choose. Skipping the pickers
  // entirely is both less to read on a phone and one fewer tap to a paid order.
  const singleVariant = product.variants.length === 1 ? product.variants[0] : null;

  const [size, setSize] = useState<string | null>(
    singleVariant ? singleVariant.size : firstAvailableSize(product.variants, sizes),
  );
  const [colour, setColour] = useState<string | null>(
    singleVariant ? singleVariant.color : firstAvailableColour(product.variants, colours),
  );
  const [activeImage, setActiveImage] = useState(0);

  const selected = resolve(product.variants, hasSizes ? size : null, hasColours ? colour : null);
  const selectedAvailable = (selected?.availableQty ?? 0) > 0;

  const displayPrice = selected?.priceKes ?? product.fromPriceKes;
  const gallery = product.images;
  const main = gallery[activeImage] ?? null;

  function addToBag() {
    if (!selected || selected.availableQty <= 0) return;
    add({
      variantId: selected.id,
      productSlug: product.slug,
      title: product.title,
      size: selected.size,
      color: selected.color,
      sku: selected.sku,
      priceKes: selected.priceKes,
      imageUrl: product.imageUrl,
    });
  }

  /** Whether a size can be bought in the colour currently selected. */
  function sizeInStock(candidate: string): boolean {
    return product.variants.some(
      (v) =>
        v.size === candidate &&
        v.availableQty > 0 &&
        (!hasColours || v.color === colour || colour === null),
    );
  }

  /** Whether a colour can be bought in the size currently selected. */
  function colourInStock(candidate: string): boolean {
    return product.variants.some(
      (v) =>
        v.color === candidate &&
        v.availableQty > 0 &&
        (!hasSizes || v.size === size || size === null),
    );
  }

  const soldOut = product.totalAvailable <= 0;

  return (
    <div className="mx-auto max-w-6xl px-6 pt-10 pb-28 lg:pb-16">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2 lg:gap-16">
        {/* ---------------------------------------------------------------- */}
        {/* Gallery                                                          */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col gap-4">
          <div className="relative aspect-[4/5] overflow-hidden bg-surface-raised">
            {main ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={main.url}
                alt={main.alt}
                width={800}
                height={1000}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-surface-raised to-surface-base">
                <span className="font-display text-6xl text-accent/25">
                  {product.title.charAt(0)}
                </span>
              </div>
            )}

            {soldOut && (
              <Badge
                tone="neutral"
                size="md"
                className="absolute top-4 left-4 bg-overlay-scrim"
              >
                Sold out
              </Badge>
            )}
          </div>

          {gallery.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {gallery.map((image, index) => (
                <button
                  key={`${image.url}-${index}`}
                  type="button"
                  onClick={() => setActiveImage(index)}
                  aria-label={`Show image ${index + 1} of ${gallery.length}`}
                  aria-current={index === activeImage}
                  className={`relative h-20 w-16 shrink-0 overflow-hidden border transition-colors ${
                    index === activeImage
                      ? "border-accent"
                      : "border-border-subtle hover:border-border-default"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={image.url}
                    alt={image.alt}
                    width={160}
                    height={200}
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ---------------------------------------------------------------- */}
        {/* Buy column                                                       */}
        {/* ---------------------------------------------------------------- */}
        <div className="flex flex-col">
          <h1 className="font-display text-3xl leading-tight text-text-primary sm:text-4xl">
            {product.title}
          </h1>

          <p className="mt-4 font-body text-2xl tabular-nums text-accent">
            {displayPrice > 0 ? formatKes(displayPrice) : "Price on request"}
          </p>

          {product.description && (
            <p className="mt-5 font-body text-sm font-light leading-relaxed text-text-primary/55">
              {product.description}
            </p>
          )}

          {!singleVariant && hasColours && (
            <fieldset className="mt-8">
              <legend className="font-body text-[11px] uppercase tracking-[0.25em] text-text-primary/45">
                Colour
                {colour && <span className="ml-2 text-text-primary/70">{colour}</span>}
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {colours.map((c) => {
                  const available = colourInStock(c);
                  const isActive = c === colour;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColour(c)}
                      disabled={!available}
                      aria-pressed={isActive}
                      className={`border px-4 py-2 font-body text-xs uppercase tracking-wider transition-colors ${
                        isActive
                          ? "border-accent bg-accent/10 text-accent"
                          : available
                            ? "border-border-default text-text-primary/65 hover:border-border-strong hover:text-text-primary"
                            : "cursor-not-allowed border-border-subtle text-text-primary/25 line-through"
                      }`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          {!singleVariant && hasSizes && (
            <fieldset className="mt-7">
              <legend className="font-body text-[11px] uppercase tracking-[0.25em] text-text-primary/45">
                Size
                {size && <span className="ml-2 text-text-primary/70">{size}</span>}
              </legend>
              <div className="mt-3 flex flex-wrap gap-2">
                {sizes.map((s) => {
                  const available = sizeInStock(s);
                  const isActive = s === size;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSize(s)}
                      disabled={!available}
                      aria-pressed={isActive}
                      className={`min-w-12 border px-3.5 py-2 font-body text-xs uppercase tracking-wider transition-colors ${
                        isActive
                          ? "border-accent bg-accent/10 text-accent"
                          : available
                            ? "border-border-default text-text-primary/65 hover:border-border-strong hover:text-text-primary"
                            : "cursor-not-allowed border-border-subtle text-text-primary/25 line-through"
                      }`}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              {sizes.some((s) => !sizeInStock(s)) && (
                <p className="mt-2.5 font-body text-[11px] font-light text-text-primary/35">
                  Struck-through sizes are sold out
                  {hasColours && colour ? ` in ${colour}` : ""}.
                </p>
              )}
            </fieldset>
          )}

          {/* Desktop CTA. The mobile equivalent is the sticky bar below. */}
          <div className="mt-9 hidden lg:block">
            <Button
              onClick={addToBag}
              disabled={!selectedAvailable}
              size="lg"
              variant={selectedAvailable ? "primary" : "secondary"}
              className="w-full tracking-[0.3em]"
            >
              {selectedAvailable
                ? "Add to bag"
                : soldOut
                  ? "Sold out"
                  : "Select an available size"}
            </Button>

            <p className="mt-3 font-body text-[11px] font-light text-text-primary/40">
              Delivery is quoted per order — we confirm it on WhatsApp before
              you pay.
            </p>
          </div>

          {/* ------------------------------------------------------------ */}
          {/* Merchandising detail                                          */}
          {/* ------------------------------------------------------------ */}
          <Merchandising product={product} />
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Sticky buy bar — phones only.                                       */}
      {/* ------------------------------------------------------------------ */}
      {/* The brief's "Add to Bag CTA is always visible" applies most literally
          here: on a phone the buy control must never be a scroll away. */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border-subtle bg-overlay-scrim backdrop-blur lg:hidden">
        <div className="flex items-center gap-4 px-5 py-3.5">
          <div className="min-w-0 flex-1">
            <p className="font-body text-sm tabular-nums text-accent">
              {displayPrice > 0 ? formatKes(displayPrice) : "Price on request"}
            </p>
            <p className="truncate font-body text-[10px] uppercase tracking-[0.15em] text-text-primary/40">
              {[colour, size].filter(Boolean).join(" · ") ||
                (soldOut ? "Sold out" : product.title)}
            </p>
          </div>

          <Button
            onClick={addToBag}
            disabled={!selectedAvailable}
            variant={selectedAvailable ? "primary" : "secondary"}
            className="shrink-0"
          >
            {selectedAvailable ? "Add to bag" : "Sold out"}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Merchandising blocks                                                        */
/* -------------------------------------------------------------------------- */

function Merchandising({ product }: { product: Product }) {
  const chart = product.sizeChart;
  const hasDetail = product.fabric || product.care || product.fitNotes;

  if (!hasDetail && chart.length === 0) return null;

  return (
    <div className="mt-12 border-t border-border-subtle pt-8">
      <dl className="flex flex-col gap-5">
        {product.fabric && <Detail term="Fabric">{product.fabric}</Detail>}
        {product.fitNotes && <Detail term="Fit">{product.fitNotes}</Detail>}
        {product.care && <Detail term="Care">{product.care}</Detail>}
      </dl>

      {chart.length > 0 && <SizeChart rows={chart} />}
    </div>
  );
}

function Detail({
  term,
  children,
}: {
  term: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid grid-cols-[80px_1fr] gap-4 sm:grid-cols-[110px_1fr]">
      <dt className="font-body text-[10px] uppercase tracking-[0.2em] text-text-primary/35">
        {term}
      </dt>
      <dd className="font-body text-sm font-light leading-relaxed text-text-primary/60">
        {children}
      </dd>
    </div>
  );
}

/**
 * Measurements in centimetres. Columns with nothing in them are dropped rather
 * than rendered as a stripe of em-dashes — a one-size wrapper has no bust row
 * to fill, and an empty column reads as missing data instead of not applicable.
 */
function SizeChart({ rows }: { rows: SizeChartRow[] }) {
  const allColumns: { key: keyof Omit<SizeChartRow, "size">; label: string }[] =
    [
      { key: "bust", label: "Bust" },
      { key: "waist", label: "Waist" },
      { key: "hips", label: "Hips" },
      { key: "length", label: "Length" },
    ];

  const columns = allColumns.filter((c) => rows.some((r) => r[c.key]));

  return (
    <div className="mt-9">
      <h2 className="font-body text-[10px] uppercase tracking-[0.2em] text-text-primary/35">
        Size chart (cm)
      </h2>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-border-subtle">
              <th className="py-2.5 pr-4 font-body text-[10px] uppercase tracking-[0.15em] text-text-primary/45">
                Size
              </th>
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="py-2.5 pr-4 font-body text-[10px] uppercase tracking-[0.15em] text-text-primary/45"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.size} className="border-b border-border-subtle">
                <td className="py-2.5 pr-4 font-body text-sm text-text-primary/75">
                  {row.size}
                </td>
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className="py-2.5 pr-4 font-body text-sm tabular-nums text-text-primary/55"
                  >
                    {row[c.key] ?? "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Variant resolution                                                          */
/* -------------------------------------------------------------------------- */

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

function resolve(
  variants: Variant[],
  size: string | null,
  colour: string | null,
): Variant | null {
  return (
    variants.find(
      (v) =>
        (size === null || v.size === size) &&
        (colour === null || v.color === colour),
    ) ?? null
  );
}

/**
 * Default to something buyable. Landing on the page with "M — sold out"
 * pre-selected and the CTA dead is a worse first impression than landing on
 * the one size that can actually ship today.
 */
function firstAvailableSize(variants: Variant[], sizes: string[]): string | null {
  if (sizes.length === 0) return null;
  return (
    sizes.find((s) => variants.some((v) => v.size === s && v.availableQty > 0)) ??
    sizes[0]
  );
}

function firstAvailableColour(
  variants: Variant[],
  colours: string[],
): string | null {
  if (colours.length === 0) return null;
  return (
    colours.find((c) =>
      variants.some((v) => v.color === c && v.availableQty > 0),
    ) ?? colours[0]
  );
}