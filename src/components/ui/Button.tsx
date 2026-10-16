import type { ButtonHTMLAttributes } from "react";

/**
 * The button, and the class string behind it.
 *
 * Before this file the same champagne CTA was written out by hand in four
 * different paddings (`px-5 py-3`, `px-6 py-3`, `px-6 py-3.5`, `px-6 py-4`) and
 * three disabled opacities (`-40`, `-50`, `-60`), which is what drift looks like
 * from the inside: every copy was locally reasonable, and the set was not.
 *
 * Every variant reads semantic tokens, never the palette. That is what lets the
 * same button render as champagne-on-obsidian in the brand scope and
 * champagne-ink-on-pearl in the commerce scope without a single call site
 * knowing which theme it is standing in.
 *
 * `min-h-11` is the 44px touch floor, expressed as a minimum rather than as
 * extra padding: padding stops guaranteeing 44px the moment a label wraps or a
 * fallback font lands with taller metrics, and a minimum does not.
 *
 * No `"use client"`. This component holds no state and no handlers of its own;
 * it renders in a server component and inside a client one. `type` still
 * defaults to `"button"` — a button that submits the form it happens to sit
 * inside, because nobody said otherwise, is a silent data bug, and the fix
 * belongs here rather than in twenty call sites remembering.
 */

const BASE =
  "inline-flex items-center justify-center gap-2 font-body uppercase transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const SIZES = {
  sm: "min-h-11 px-3.5 text-[10px] tracking-[0.2em]",
  md: "min-h-11 px-5 text-[11px] tracking-[0.25em]",
  lg: "min-h-12 px-6 text-xs tracking-[0.25em]",
} as const;

const VARIANTS = {
  primary:
    "border border-accent bg-accent text-accent-ink hover:bg-accent-hover",
  secondary:
    "border border-border-default text-text-muted hover:border-border-strong hover:text-text-primary",
  outline:
    "border border-accent/40 text-accent hover:bg-accent hover:text-accent-ink",
  danger: "border border-red-400/50 text-red-200/90 hover:bg-red-400/10",
  ghost: "text-text-muted hover:text-text-primary",
  dangerGhost: "text-red-300/60 underline underline-offset-4 hover:text-red-300",
  link: "text-accent underline underline-offset-4 hover:text-accent-hover",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;
export type ButtonSize = keyof typeof SIZES;

/** Build a button's class string for a non-`<button>` element, e.g. `next/link`. */
export function buttonClass(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  extra?: string,
): string {
  return [BASE, SIZES[size], VARIANTS[variant], extra]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export default function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={buttonClass(variant, size, className)}
      {...rest}
    />
  );
}

/**
 * A square 44px icon button. Colour is deliberately the caller's: the same box
 * is a muted close affordance on a drawer and a red delete on an admin row, and
 * baking either one in would just move the copy-paste.
 */
export function IconButton({
  className,
  type = "button",
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={[
        "inline-flex h-11 w-11 shrink-0 items-center justify-center transition-colors disabled:cursor-not-allowed disabled:opacity-60",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...rest}
    />
  );
}