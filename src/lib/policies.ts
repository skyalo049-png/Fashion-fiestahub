/**
 * The policy pages, in one place.
 *
 * Both the site footer and each policy page's own cross-link nav read this
 * list, so adding a document is one entry rather than three edits that drift
 * out of step with each other.
 */
export type Policy = {
  href: string;
  label: string;
  summary: string;
};

export const policies: Policy[] = [
  {
    href: "/delivery",
    label: "Delivery",
    summary: "How your order reaches you, and how the fee is set.",
  },
  {
    href: "/returns",
    label: "Returns",
    summary: "Seven days, unworn, tags still on.",
  },
  {
    href: "/size-guide",
    label: "Size guide",
    summary: "How to measure, and what our sizes mean.",
  },
  {
    href: "/privacy",
    label: "Privacy",
    summary: "What we hold about you, why, and how to have it removed.",
  },
  {
    href: "/terms",
    label: "Terms",
    summary: "The agreement between you and this shop.",
  },
];

/**
 * Shown on every policy page. Bump this whenever the text under it changes —
 * a policy page with no date on it is a page nobody can tell is stale.
 */
export const POLICY_UPDATED = "16 October 2026";