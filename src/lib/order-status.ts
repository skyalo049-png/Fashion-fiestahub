import type { BadgeTone } from "@/components/ui/Badge";

/**
 * Which tone each order status wears.
 *
 * This map lives here rather than in `lib/admin.ts` because that module is
 * `server-only` and the customer status screen is a client component. It used
 * to be written twice — once in the staff queue, once in `OrderStatus.tsx` —
 * and the two disagreed: `processing` wore the customer-facing emerald while
 * the staff queue called the same order neutral. A status cannot say two things
 * at once, so both screens read this one map.
 *
 * A tone, not a colour: the obsidian and pearl scopes step each one
 * differently, and a badge whose whole job is to be read cannot have its
 * contrast decided by a call site.
 */
export const ORDER_STATUS_TONE: Record<string, BadgeTone> = {
  awaiting_delivery_quote: "accent",
  awaiting_payment_verification: "accent",
  awaiting_payment: "neutral",
  paid: "success",
  processing: "neutral",
  shipped: "neutral",
  delivered: "muted",
  cancelled: "danger",
};