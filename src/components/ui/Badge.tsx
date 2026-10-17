import type { HTMLAttributes } from "react";

/**
 * The badge, and the class string behind it.
 *
 * A status chip had been written out by hand in six places: the order status
 * pill, the two admin status maps (`STATUS_TONE` in `lib/admin.ts` and its twin
 * in the products page), the stock pill, the out-of-stock flag, and the
 * sold-out sticker on the product gallery. They disagreed — the customer-facing
 * "checking your payment" chip was a muted grey while the staff-facing one for
 * the same status was champagne — because nobody was looking at both at once.
 *
 * Tones, not colours. A tone names what the badge *means* (success, danger,
 * accent) and each scope in `globals.css` decides which step of which hue that
 * is. emerald-300 on obsidian is a legible "paid"; the same class on the pearl
 * ground measures about 1.4:1 and disappears. Since a badge's entire job is to
 * be read, that difference cannot live in a call site.
 *
 * No `"use client"` — this is a span with no state, and it renders on the
 * server inside `OrderStatusView` and inside the admin tables alike.
 */

const BASE =
  "inline-block border font-body uppercase whitespace-nowrap align-middle";

const SIZES = {
  /** Admin rows and dense tables. */
  sm: "px-2 py-0.5 text-[10px] tracking-[0.2em]",
  /** The customer-facing status pill — the one element allowed to breathe. */
  md: "px-3 py-1 text-[10px] tracking-[0.25em]",
} as const;

const TONES = {
  /** No judgement: a neutral state, "archived", "one size". */
  neutral: "border-tone-neutral-border text-tone-neutral",
  /** Deliberately quieter than neutral — a de-emphasised state. */
  muted: "border-tone-neutral-border text-tone-muted",
  /** Wants attention: a draft, a reservation, a quote owed. */
  accent: "border-tone-accent-border text-tone-accent",
  /** Done, paid, in stock, on its way. */
  success: "border-tone-success-border text-tone-success",
  /** Stopped, cancelled, out of stock. */
  danger: "border-tone-danger-border text-tone-danger",
} as const;

export type BadgeTone = keyof typeof TONES;
export type BadgeSize = keyof typeof SIZES;

/** Build a badge's class string for an element that is not a `<span>`. */
export function badgeClass(
  tone: BadgeTone = "neutral",
  size: BadgeSize = "sm",
  extra?: string,
): string {
  return [BASE, SIZES[size], TONES[tone], extra]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  size?: BadgeSize;
};

export default function Badge({
  tone = "neutral",
  size = "sm",
  className,
  ...rest
}: BadgeProps) {
  return <span className={badgeClass(tone, size, className)} {...rest} />;
}