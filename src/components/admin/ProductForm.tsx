"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";

import {
  createProduct,
  deleteProduct,
  updateProduct,
} from "@/app/admin/product-actions";
import Button from "@/components/ui/Button";
import Field from "@/components/ui/Field";
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

function Submit({ children, pendingLabel }: { children: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full sm:w-auto">
      {pending ? pendingLabel : children}
    </Button>
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
      <Field
        label="Title"
        name="title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Ankara Wrap Dress"
      />

      <Field
        label="Web address"
        name="slug"
        value={effectiveSlug}
        onChange={(e) => {
          setSlugTouched(true);
          setSlug(e.target.value);
        }}
        placeholder="ankara-wrap-dress"
        controlClassName="font-mono text-xs"
        hint={
          effectiveSlug
            ? `/product/${effectiveSlug}`
            : "Filled in from the title."
        }
      />

      <Field
        label="SKU prefix"
        name="sku_prefix"
        placeholder="FFH-AWD"
        controlClassName="font-mono text-xs"
        hint="Three letters for this product. Every size and colour gets a SKU built from it, and it cannot be changed later."
      />

      <Field
        as="textarea"
        label="Description"
        name="description"
        rows={6}
        placeholder="What it is, how it falls, what it is lined with."
      />

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Fabric" name="fabric" />
        <Field label="Care" name="care" />
        <Field label="Fit" name="fit_notes" />
      </div>

      <Field as="select" label="Visibility" name="status" defaultValue="draft">
        <option value="draft">Draft — hidden from the shop</option>
        <option value="active">Active — on sale</option>
      </Field>

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

      <Field label="Title" name="title" defaultValue={product.title} />

      <div>
        <span className="block font-body text-[11px] uppercase tracking-[0.2em] text-text-muted">
          Web address
        </span>
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

      <Field
        as="textarea"
        label="Description"
        name="description"
        rows={8}
        defaultValue={product.description}
        hint="Blank lines separate paragraphs."
      />

      <div className="grid gap-6 sm:grid-cols-3">
        <Field label="Fabric" name="fabric" defaultValue={product.fabric} />
        <Field label="Care" name="care" defaultValue={product.care} />
        <Field label="Fit" name="fit_notes" defaultValue={product.fitNotes} />
      </div>

      <Field as="select" label="Visibility" name="status" defaultValue={product.status}>
        <option value="draft">Draft — hidden from the shop</option>
        <option value="active">Active — on sale</option>
        <option value="archived">Archived — retired, keeps its history</option>
      </Field>

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
      <Button variant="dangerGhost" onClick={() => setOpen(true)}>
        Delete this product
      </Button>
    );
  }

  return (
    <form action={action} className="space-y-4 border border-red-400/30 p-5">
      <input type="hidden" name="slug" value={slug} />
      <p className="font-body text-sm text-pearl/70">
        This removes the product, its sizes and its photos. Past orders keep
        their own copy of the name and price, so order history is unaffected.
      </p>
      <Field
        label={`Type ${slug} to confirm`}
        name="confirm"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        autoComplete="off"
        controlClassName="font-mono text-xs"
      />
      <Feedback state={state} />
      <div className="flex flex-wrap gap-4">
        <Button type="submit" variant="danger" disabled={typed !== slug}>
          Delete permanently
        </Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

export { field, slugify };