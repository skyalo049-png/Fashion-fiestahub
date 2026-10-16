/**
 * The shape of a server action's result, and the value it starts in.
 *
 * These live outside the action files on purpose. A module marked "use server"
 * may export async functions and nothing else; a `const` of any kind in one is
 * a build error — "A 'use server' file can only export async functions, found
 * object" — and that error only appears in `next build`, not in `next dev`.
 *
 * What that buys is worth stating: an action module is now purely callable
 * surface, and everything a client component needs in order to describe the
 * result's shape comes from here instead.
 *
 * The four result types are aliases of one union rather than four copies of
 * it. They were already structurally identical, and four identical unions in
 * four files is four places to update when a fourth status is added.
 */

export type ActionResult =
  | { status: "idle" }
  | { status: "ok"; message: string }
  | { status: "error"; message: string };

export const INITIAL_ACTION: ActionResult = { status: "idle" };

/** Products: create, update, photo upload, photo delete, delete. */
export type ProductActionResult = ActionResult;

export const INITIAL_PRODUCT_ACTION: ProductActionResult = { status: "idle" };

/** The variant grid. One save, one result. */
export type VariantActionResult = ActionResult;

export const INITIAL_VARIANT_ACTION: VariantActionResult = { status: "idle" };

/**
 * Sign-in has no success branch: a successful sign-in redirects, so the only
 * two states a form can actually render are "untouched" and "failed".
 */
export type LoginState = { status: "idle" } | { status: "error"; message: string };

export const INITIAL_LOGIN: LoginState = { status: "idle" };
