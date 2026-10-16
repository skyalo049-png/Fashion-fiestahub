"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/app/admin/product-actions";
import {
  INITIAL_PRODUCT_ACTION,
  type ProductActionResult,
} from "@/lib/action-state";

/**
 * The product's own row: title, URL, copy, status.
 *
 * The variant grid and the photos are separate components on purpose. They are
 * separate database operations with separate failure modes, and folding all
 * three into one form would mean a bad photo silently discarding a price edit
 * that had already been typed.
 *
 * `sku_prefix` appears on the create form and is absent from the edit form,
 * which is the same decision the action file makes: it is permanent once SKUs
 * have been printed.
 */

function field(formData: FormData, name: string): string {
  return String(formData.get(name) ?? "").trim();
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const inputClass =
  "mt-2 w-full border border-pearl/20 bg-transparent px-4 py-3 font-body text-sm text-pearl placeholder:text-pearl/25 focus:border-champagne focus:outline-none";

const labelClass =
  "font-body text-[10px] uppercase tracking-[0.25em] text-pearl/50";

function Submit({ children, pendingLabel }: { children: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full border border-champagne bg-champagne px-5 py-3 font-body text-[11px] uppercase tracking-[0.25em] text-obsidian transition-colors hover:bg-champagne-light disabled:opacity-60 sm:w-auto"
    >
      {pending ? pendingLabel : children}
    </button>
  );
}

function Feedback({ state }: { state: ProductActionResult }) {
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

export type ProductFormValues = {
  slug: string;
  title: string;
  description: string;
  fabric: string;
  care: string;
  fitNotes: string;
  status: string;
  skuPrefix: string | null;
};

export function CreateProductForm() {
  const [state, action] = useActionState(createProduct, INITIAL_PRODUCT_ACTION);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  // The slug follows the title until the operator edits it directly. After
  // that it is theirs: silently rewriting a URL someone chose is how a product
  // link that was already shared stops working.
  const effectiveSlug = slugTouched ? slug : slugify(title);

  return (
    <form action={action} className="space-y-6">
      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ankara Wrap Dress"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="slug" className={labelClass}>
          Web address
        </label>
        <input
          id="slug"
          name="slug"
          value={effectiveSlug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(e.target.value);
          }}
          placeholder="ankara-wrap-dress"
          className={`${inputClass} font-mono text-xs`}
        />
        <p className="mt-2 font-body text-[11px] text-pearl/35">
          {effectiveSlug
            ? `/product/${effectiveSlug}`
            : "Filled in from the title."}
        </p>
      </div>

      <div>
        <label htmlFor="sku_prefix" className={labelClass}>
          SKU prefix
        </label>
        <input
          id="sku_prefix"
          name="sku_prefix"
          placeholder="FFH-AWD"
          className={`${inputClass} font-mono text-xs`}
        />
        <p className="mt-2 font-body text-[11px] text-pearl/35">
          Three letters for this product. Every size and colour gets a SKU built
          from it, and it cannot be changed later.
        </p>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          placeholder="What it is, how it falls, what it is lined with."
          className={inputClass}
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="fabric" className={labelClass}>
            Fabric
          </label>
          <input id="fabric" name="fabric" className={inputClass} />
        </div>
        <div>
          <label htmlFor="care" className={labelClass}>
            Care
          </label>
          <input id="care" name="care" className={inputClass} />
        </div>
        <div>
          <label htmlFor="fit_notes" className={labelClass}>
            Fit
          </label>
          <input id="fit_notes" name="fit_notes" className={inputClass} />
        </div>
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          Visibility
        </label>
        <select id="status" name="status" defaultValue="draft" className={inputClass}>
          <option value="draft">Draft — hidden from the shop</option>
          <option value="active">Active — on sale</option>
        </select>
      </div>

      <Feedback state={state} />

      <Submit pendingLabel="Creating…">Create and set up sizes</Submit>
    </form>
  );
}

export function EditProductForm({ product }: { product: ProductFormValues }) {
  const [state, action] = useActionState(updateProduct, INITIAL_PRODUCT_ACTION);

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="slug" value={product.slug} />

      <div>
        <label htmlFor="title" className={labelClass}>
          Title
        </label>
        <input
          id="title"
          name="title"
          defaultValue={product.title}
          className={inputClass}
        />
      </div>

      <div>
        <span className={labelClass}>Web address</span>
        <p className="mt-2 font-mono text-xs text-pearl/45">/product/{product.slug}</p>
        <p className="mt-2 font-body text-[11px] text-pearl/35">
          {product.skuPrefix ? (
            <>
              SKUs are built from <span className="font-mono">{product.skuPrefix}</span>.
              Neither of these can be changed once the product exists.
            </>
          ) : (
            "Not editable once the product exists."
          )}
        </p>
      </div>

      <div>
        <label htmlFor="description" className={labelClass}>
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={8}
          defaultValue={product.description}
          className={inputClass}
        />
        <p className="mt-2 font-body text-[11px] text-pearl/35">
          Blank lines separate paragraphs.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div>
          <label htmlFor="fabric" className={labelClass}>
            Fabric
          </label>
          <input id="fabric" name="fabric" defaultValue={product.fabric} className={inputClass} />
        </div>
        <div>
          <label htmlFor="care" className={labelClass}>
            Care
          </label>
          <input id="care" name="care" defaultValue={product.care} className={inputClass} />
        </div>
        <div>
          <label htmlFor="fit_notes" className={labelClass}>
            Fit
          </label>
          <input
            id="fit_notes"
            name="fit_notes"
            defaultValue={product.fitNotes}
            className={inputClass}
          />
        </div>
      </div>

      <div>
        <label htmlFor="status" className={labelClass}>
          Visibility
        </label>
        <select id="status" name="status" defaultValue={product.status} className={inputClass}>
          <option value="draft">Draft — hidden from the shop</option>
          <option value="active">Active — on sale</option>
          <option value="archived">Archived — retired, keeps its history</option>
        </select>
      </div>

      <Feedback state={state} />

      <div className="flex flex-wrap items-center gap-4">
        <Submit pendingLabel="Saving…">Save changes</Submit>
        <Link
          href={`/product/${product.slug}`}
          className="font-body text-[11px] uppercase tracking-[0.25em] text-pearl/40 underline underline-offset-4 transition-colors hover:text-pearl"
        >
          View on site
        </Link>
      </div>
    </form>
  );
}

/**
 * Deleting a product.
 *
 * Behind a typed confirmation rather than a browser `confirm()`, and the
 * confirmation is the slug itself: a destructive control that a stray tap can
 * fire is one that eventually fires by accident.
 */
export function DeleteProductForm({ slug }: { slug: string }) {
  const [state, action] = useActionState(deleteProduct, INITIAL_PRODUCT_ACTION);
  const [typed, setTyped] = useState("");
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="font-body text-[11px] uppercase tracking-[0.25em] text-red-300/60 underline underline-offset-4 transition-colors hover:text-red-300"
      >
        Delete this product
      </button>
    );
  }

  return (
    <form action={action} className="space-y-4 border border-red-400/30 p-5">
      <input type="hidden" name="slug" value={slug} />
      <p className="font-body text-sm text-pearl/70">
        This removes the product, its sizes and its photos. Past orders keep
        their own copy of the name and price, so order history is unaffected.
      </p>
      <div>
        <label htmlFor="confirm" className={labelClass}>
          Type <span className="font-mono text-pearl/70">{slug}</span> to confirm
        </label>
        <input
          id="confirm"
          name="confirm"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          className={`${inputClass} font-mono text-xs`}
        />
      </div>
      <Feedback state={state} />
      <div className="flex flex-wrap gap-4">
        <button
          type="submit"
          disabled={typed !== slug}
          className="border border-red-400/50 px-5 py-3 font-body text-[11px] uppercase tracking-[0.25em] text-red-200/90 transition-colors hover:bg-red-400/10 disabled:opacity-40"
        >
          Delete permanently
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-body text-[11px] uppercase tracking-[0.25em] text-pearl/40 transition-colors hover:text-pearl"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export { field, slugify };