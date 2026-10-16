"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";

import {
  deleteProductPhoto,
  uploadProductPhoto,
} from "@/app/admin/product-actions";
import {
  INITIAL_PRODUCT_ACTION,
  type ProductActionResult,
} from "@/lib/action-state";
import type { AdminProductImage } from "@/lib/admin-products";

/**
 * A product's photos.
 *
 * Upload and delete are two separate forms rather than one, because they are
 * two separate database operations: a delete removes an image row, an upload
 * creates one. Merging them would mean one button that sometimes uploads and
 * sometimes deletes depending on a hidden field, which is the kind of control
 * that eventually deletes the wrong thing.
 *
 * The first image is the one the storefront shows on the product card, and
 * that is stated on the screen rather than left for someone to infer from the
 * position number.
 */

function Submit({ children, pendingLabel }: { children: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="border border-champagne bg-champagne px-5 py-3 font-body text-[11px] uppercase tracking-[0.25em] text-obsidian transition-colors hover:bg-champagne-light disabled:opacity-60"
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

const inputClass =
  "mt-2 w-full border border-pearl/20 bg-transparent px-4 py-3 font-body text-sm text-pearl placeholder:text-pearl/25 focus:border-champagne focus:outline-none";

const labelClass =
  "font-body text-[10px] uppercase tracking-[0.25em] text-pearl/50";

function UploadForm({ productId, slug }: { productId: string; slug: string }) {
  const [state, action] = useActionState(uploadProductPhoto, INITIAL_PRODUCT_ACTION);

  return (
    <form action={action} className="space-y-5 border border-pearl/10 p-5">
      <input type="hidden" name="product_id" value={productId} />
      <input type="hidden" name="slug" value={slug} />

      <div>
        <label htmlFor="photo" className={labelClass}>
          Photo
        </label>
        <input
          id="photo"
          name="photo"
          type="file"
          accept="image/*"
          className="mt-2 w-full font-body text-sm text-pearl/70 file:mr-4 file:border file:border-pearl/20 file:bg-transparent file:px-4 file:py-2 file:font-body file:text-[11px] file:uppercase file:tracking-[0.2em] file:text-pearl/60 hover:file:border-pearl/40"
        />
        <p className="mt-2 font-body text-[11px] text-pearl/35">
          JPG or PNG, up to 5 MB. Portrait shots around 1200 x 1600 look right
          in the product page.
        </p>
      </div>

      <div>
        <label htmlFor="alt" className={labelClass}>
          Description for screen readers
        </label>
        <input
          id="alt"
          name="alt"
          placeholder="Ankara wrap dress in indigo, worn belted"
          className={inputClass}
        />
        <p className="mt-2 font-body text-[11px] text-pearl/35">
          Worth writing. It is what a blind customer hears, and it is what the
          search engines index.
        </p>
      </div>

      <Feedback state={state} />
      <Submit pendingLabel="Uploading…">Add photo</Submit>
    </form>
  );
}

function DeleteButton({ imageId, slug, url }: { imageId: string; slug: string; url: string }) {
  const [state, action] = useActionState(deleteProductPhoto, INITIAL_PRODUCT_ACTION);

  return (
    <form action={action} className="absolute right-2 top-2">
      <input type="hidden" name="image_id" value={imageId} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="url" value={url} />
      <RemoveButton />
      {state.status === "error" ? (
        <p className="mt-2 max-w-[180px] bg-obsidian/90 px-2 py-1 font-body text-[10px] text-red-200/90">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      aria-label="Remove this photo"
      className="flex h-8 w-8 items-center justify-center border border-pearl/30 bg-obsidian/80 font-body text-sm text-pearl/70 transition-colors hover:border-red-400/60 hover:text-red-300 disabled:opacity-50"
    >
      {pending ? "…" : "×"}
    </button>
  );
}

export function PhotoManager({
  productId,
  slug,
  images,
}: {
  productId: string;
  slug: string;
  images: AdminProductImage[];
}) {
  return (
    <div className="space-y-6">
      {images.length === 0 ? (
        <p className="border border-dashed border-pearl/15 px-5 py-10 text-center font-body text-sm text-pearl/40">
          No photos yet. A product with no photo shows an empty frame in the
          shop.
        </p>
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {images.map((image, index) => (
            <li key={image.id} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.url}
                alt={image.alt ?? ""}
                className="aspect-[3/4] w-full border border-pearl/10 object-cover"
              />
              {index === 0 ? (
                <span className="absolute left-2 top-2 border border-champagne/60 bg-obsidian/80 px-2 py-0.5 font-body text-[9px] uppercase tracking-[0.2em] text-champagne">
                  Main
                </span>
              ) : null}
              <DeleteButton imageId={image.id} slug={slug} url={image.url} />
              {image.alt ? (
                <p className="mt-2 font-body text-[11px] text-pearl/40">
                  {image.alt}
                </p>
              ) : (
                <p className="mt-2 font-body text-[11px] text-pearl/25">
                  No description
                </p>
              )}
            </li>
          ))}
        </ul>
      )}

      <UploadForm productId={productId} slug={slug} />
    </div>
  );
}
