"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import { saveVariants } from "@/app/admin/variant-actions";
import {
  INITIAL_VARIANT_ACTION,
  type VariantActionResult,
} from "@/lib/action-state";
import type { AdminVariant } from "@/lib/admin-products";
import { CONTROL_BASE } from "@/components/ui/Field";

/**
 * The colour x size grid.
 *
 * This is the screen the restock actually happens on: rows are sizes, columns
 * are colours, and the number in a cell is how many are on the shelf. Typing a
 * number into an empty cell creates that variant; clearing a cell to blank
 * retires it.
 *
 * The axes are folded here rather than imported from `axesOf()` in
 * admin-products.ts. That module is server-only — it carries the read path the
 * service role goes through — and importing it from a client component would
 * drag the whole thing across the boundary. The fold is six lines; duplicating
 * it is cheaper than the alternative.
 *
 * The grid is submitted as one JSON blob because `save_product_variants()`
 * takes the grid in a single call and applies it in one transaction. Fifteen
 * round trips would leave a half-restocked product behind any failure, and a
 * half-restocked product is worse than an unsaved one.
 */

/** The internal value for "this product has no size" / "no colour". */
const NONE = "";

/** How an empty axis value is shown to a human. */
const NONE_LABEL = "—";

type Cell = { stock: string; price: string };

function cellKey(size: string, color: string): string {
  // NUL is the one byte that cannot appear in a size or colour someone types,
  // so it is a safe separator where a hyphen or pipe would not be.
  return `${size}\u0000${color}`;
}

function label(value: string): string {
  return value === NONE ? NONE_LABEL : value;
}

/** The distinct sizes and colours, in the order getProduct already sorted. */
function axes(variants: AdminVariant[]): { sizes: string[]; colors: string[] } {
  const sizes: string[] = [];
  const colors: string[] = [];
  let hasSizeless = false;
  let hasColourless = false;

  for (const v of variants) {
    const size = v.size ?? NONE;
    const color = v.color ?? NONE;
    if (size === NONE) hasSizeless = true;
    else if (!sizes.includes(size)) sizes.push(size);
    if (color === NONE) hasColourless = true;
    else if (!colors.includes(color)) colors.push(color);
  }

  // "No size" sorts to the front: it is the unusual case, and burying it in
  // the middle of a size run reads as a data error.
  if (hasSizeless) sizes.unshift(NONE);
  if (hasColourless) colors.unshift(NONE);

  return { sizes, colors };
}

/** Existing variants as grid state. Blank stock means the row is not stocked. */
function seed(variants: AdminVariant[]): Record<string, Cell> {
  const cells: Record<string, Cell> = {};
  for (const v of variants) {
    cells[cellKey(v.size ?? NONE, v.color ?? NONE)] = {
      stock: String(v.stockQty),
      price: v.priceKes > 0 ? String(v.priceKes) : "",
    };
  }
  return cells;
}

function Submit({ pending }: { pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-champagne bg-champagne px-5 py-3 font-body text-[11px] uppercase tracking-[0.25em] text-obsidian transition-colors hover:bg-champagne-light disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save the grid"}
    </button>
  );
}

function Feedback({ state }: { state: VariantActionResult }) {
  if (state.status === "idle") return null;
  const ok = state.status === "ok";
  return (
    <p
      role="status"
      className={[
        "border-l-2 px-3 py-2 font-body text-xs",
        ok
          ? "border-emerald-400/60 bg-emerald-400/5 text-emerald-200/90"
          : "border-red-400/50 bg-red-400/5 text-red-200/90",
      ].join(" ")}
    >
      {state.message}
    </p>
  );
}

export function VariantGrid({
  productId,
  slug,
  variants,
  skuPrefix,
}: {
  productId: string;
  slug: string;
  variants: AdminVariant[];
  skuPrefix: string | null;
}) {
  const [state, action] = useActionState(saveVariants, INITIAL_VARIANT_ACTION);

  const [sizes, setSizes] = useState<string[]>(() => {
    const { sizes: found } = axes(variants);
    // A product with no variants yet still needs something to type into. S/M/L
    // plus one unlabelled column is the shape most of this catalogue takes, and
    // any row left blank simply creates nothing — so guessing costs nothing and
    // saves the operator three "add size" taps on every new dress.
    return found.length ? found : ["S", "M", "L"];
  });

  const [colors, setColors] = useState<string[]>(() => {
    const { colors: found } = axes(variants);
    return found.length ? found : [NONE];
  });

  const [cells, setCells] = useState<Record<string, Cell>>(() => seed(variants));

  const [defaultPrice, setDefaultPrice] = useState<string>(() => {
    const priced = variants.filter((v) => v.priceKes > 0);
    return priced.length ? String(priced[0].priceKes) : "";
  });

  const [note, setNote] = useState("");
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");

  function setCell(size: string, color: string, patch: Partial<Cell>) {
    setCells((prev) => {
      const key = cellKey(size, color);
      const current = prev[key] ?? { stock: "", price: "" };
      return { ...prev, [key]: { ...current, ...patch } };
    });
  }

  function addSize() {
    const value = newSize.trim();
    if (!value || sizes.includes(value)) return;
    setSizes((prev) => [...prev, value]);
    setNewSize("");
  }

  function addColor() {
    const value = newColor.trim();
    if (!value || colors.includes(value)) return;
    setColors((prev) => [...prev, value]);
    setNewColor("");
  }

  function removeSize(value: string) {
    setSizes((prev) => prev.filter((s) => s !== value));
    setCells((prev) => {
      const next = { ...prev };
      for (const color of colors) delete next[cellKey(value, color)];
      return next;
    });
  }

  function removeColor(value: string) {
    setColors((prev) => prev.filter((c) => c !== value));
    setCells((prev) => {
      const next = { ...prev };
      for (const size of sizes) delete next[cellKey(size, value)];
      return next;
    });
  }

  // Blanking every per-cell price hands them back to the default. Cheaper than
  // retyping one price into fifteen cells when a fabric costs the shop more.
  function useDefaultEverywhere() {
    setCells((prev) => {
      const next: Record<string, Cell> = {};
      for (const [key, cell] of Object.entries(prev)) {
        next[key] = { ...cell, price: "" };
      }
      return next;
    });
  }

  // What actually goes to the database: only cells with a number in them. A
  // blank cell is not "zero in stock", it is "this combination does not
  // exist", and the function retires anything it does not receive.
  const payload: Array<{
    size: string;
    color: string;
    stock: string;
    price: string | null;
  }> = [];

  for (const size of sizes) {
    for (const color of colors) {
      const cell = cells[cellKey(size, color)];
      if (!cell) continue;
      const stock = cell.stock.trim();
      if (stock === "") continue;
      const price = cell.price.trim();
      payload.push({ size, color, stock, price: price === "" ? null : price });
    }
  }

  const stocked = payload.length;

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="cells" value={JSON.stringify(payload)} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <p className="max-w-prose font-body text-sm text-pearl/50">
          Type a number into a cell to stock it. A blank cell means that
          combination does not exist. Clearing a cell to blank retires it —
          past orders keep their own copy of the name and price.
        </p>
        <button
          type="button"
          onClick={useDefaultEverywhere}
          className="font-body text-[11px] uppercase tracking-[0.25em] text-pearl/40 underline underline-offset-4 transition-colors hover:text-pearl"
        >
          Use the default price in every cell
        </button>
      </div>

      <div className="overflow-x-auto border border-pearl/10">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-[120px] border-b border-r border-pearl/10 bg-obsidian px-4 py-3 text-left font-body text-[10px] uppercase tracking-[0.25em] text-pearl/40">
                Size \\ Colour
              </th>
              {colors.map((color) => (
                <th
                  key={color}
                  className="min-w-[150px] border-b border-r border-pearl/10 px-4 py-3 text-left"
                >
                  <span className="font-body text-[11px] uppercase tracking-[0.2em] text-pearl/80">
                    {label(color)}
                  </span>
                  {colors.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeColor(color)}
                      aria-label={`Remove colour ${label(color)}`}
                      className="ml-3 font-body text-[10px] text-pearl/30 transition-colors hover:text-red-300"
                    >
                      ×
                    </button>
                  ) : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sizes.map((size) => (
              <tr key={size}>
                <th
                  scope="row"
                  className="sticky left-0 z-10 border-b border-r border-pearl/10 bg-obsidian px-4 py-3 text-left"
                >
                  <span className="font-body text-[11px] uppercase tracking-[0.2em] text-pearl/80">
                    {label(size)}
                  </span>
                  {sizes.length > 1 ? (
                    <button
                      type="button"
                      onClick={() => removeSize(size)}
                      aria-label={`Remove size ${label(size)}`}
                      className="ml-3 font-body text-[10px] text-pearl/30 transition-colors hover:text-red-300"
                    >
                      ×
                    </button>
                  ) : null}
                </th>

                {colors.map((color) => {
                  const cell = cells[cellKey(size, color)] ?? {
                    stock: "",
                    price: "",
                  };
                  const sku =
                    skuPrefix && size && color
                      ? `${skuPrefix}-${size}-${color}`.toUpperCase()
                      : null;
                  return (
                    <td
                      key={color}
                      className="border-b border-r border-pearl/10 px-4 py-3 align-top"
                    >
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cell.stock}
                        onChange={(e) =>
                          setCell(size, color, {
                            stock: e.target.value.replace(/[^0-9]/g, ""),
                          })
                        }
                        placeholder="—"
                        aria-label={`Stock for ${label(size)} ${label(color)}`}
                        className={`${CONTROL_BASE} font-mono`}
                      />
                      <input
                        type="text"
                        inputMode="numeric"
                        value={cell.price}
                        onChange={(e) =>
                          setCell(size, color, {
                            price: e.target.value.replace(/[^0-9]/g, ""),
                          })
                        }
                        placeholder={defaultPrice ? `${defaultPrice}` : "price"}
                        aria-label={`Price for ${label(size)} ${label(color)}`}
                        className={`${CONTROL_BASE} mt-2 font-mono`}
                      />
                      {sku ? (
                        <p className="mt-2 truncate font-mono text-[10px] text-pearl/25">
                          {sku}
                        </p>
                      ) : null}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-end gap-6">
        <div>
          <label
            htmlFor="new_size"
            className="font-body text-[10px] uppercase tracking-[0.25em] text-pearl/50"
          >
            Add a size
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="new_size"
              value={newSize}
              onChange={(e) => setNewSize(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addSize();
                }
              }}
              placeholder="XL"
              className={`${CONTROL_BASE} w-28 uppercase`}
            />
            <button
              type="button"
              onClick={addSize}
              className="border border-pearl/20 px-4 py-2 font-body text-[11px] uppercase tracking-[0.2em] text-pearl/60 transition-colors hover:border-pearl/40 hover:text-pearl"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="new_color"
            className="font-body text-[10px] uppercase tracking-[0.25em] text-pearl/50"
          >
            Add a colour
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="new_color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addColor();
                }
              }}
              placeholder="Indigo"
              className={`${CONTROL_BASE} w-40`}
            />
            <button
              type="button"
              onClick={addColor}
              className="border border-pearl/20 px-4 py-2 font-body text-[11px] uppercase tracking-[0.2em] text-pearl/60 transition-colors hover:border-pearl/40 hover:text-pearl"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 border-t border-pearl/10 pt-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="default_price"
            className="font-body text-[10px] uppercase tracking-[0.25em] text-pearl/50"
          >
            Default price (KSh)
          </label>
          <input
            id="default_price"
            name="default_price"
            inputMode="numeric"
            value={defaultPrice}
            onChange={(e) =>
              setDefaultPrice(e.target.value.replace(/[^0-9]/g, ""))
            }
            className={`${CONTROL_BASE} mt-2 font-mono`}
          />
          <p className="mt-2 font-body text-[11px] text-pearl/35">
            Used for any cell with no price of its own. Changing it does not
            touch sizes that already have their own.
          </p>
        </div>

        <div>
          <label
            htmlFor="note"
            className="font-body text-[10px] uppercase tracking-[0.25em] text-pearl/50"
          >
            Note for the stock ledger
          </label>
          <input
            id="note"
            name="note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. restock from the October delivery"
            className={`${CONTROL_BASE} mt-2`}
          />
          <p className="mt-2 font-body text-[11px] text-pearl/35">
            Recorded against every stock change this save makes, so a later
            discrepancy has an explanation.
          </p>
        </div>
      </div>

      <Feedback state={state} />

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton />
        <p className="font-body text-[11px] text-pearl/35">
          {stocked === 0
            ? "No cells filled in yet."
            : `${stocked} combination${stocked === 1 ? "" : "s"} will be stocked.`}
        </p>
      </div>
    </form>
  );
}

/** Split out so useFormStatus can see the pending state of the form above it. */
function SubmitButton() {
  const { pending } = useFormStatus();
  return <Submit pending={pending} />;
}
