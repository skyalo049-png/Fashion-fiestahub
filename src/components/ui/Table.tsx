import type { ReactNode } from "react";

/**
 * The record table — a heading row, a rule under it, rows split by hairlines.
 *
 * Two admin screens list exactly this way, and both had been written out by
 * hand: inventory (eight columns) and clients (six). They had arrived at the
 * same numbers independently, which is the good case for extraction — pulling
 * the string out cannot change either screen. The reason to do it anyway is
 * the third table. It gets the spacing for free instead of being eyeballed
 * against two others, and the two hairline rules that make the list readable
 * stop being something each screen remembers.
 *
 * Deliberately not here:
 *
 * - The variant matrix in `VariantGrid`. Every cell is ruled on all four sides
 *   because the cell *is* the content, and the first column is sticky. A
 *   primitive serving both would grow a flag per difference and end up hiding
 *   the two real shapes rather than sharing one.
 * - The size chart on the product page. Same reason, milder: it is a grid of
 *   measurements read as a block, not a list of records read row by row.
 * - The prose tables in `delivery` and `size-guide`. Those are written markup
 *   in an article styled by `PolicyShell`, with no per-cell classes at all.
 *
 * Cells drop their right padding on the last column (`last:pr-0`) so a row's
 * final cell can sit flush against the table edge without every caller
 * overriding the base.
 */

const TH =
  "pb-3 pr-4 last:pr-0 font-body text-[10px] uppercase tracking-[0.2em] text-text-primary/40";

const TD = "py-3 pr-4 last:pr-0";

function cx(...parts: (string | undefined)[]) {
  return parts.filter(Boolean).join(" ").replace(/\s+/g, " ").trim();
}

/** The scroll container and the `<table>` itself. Pass margins in `className`. */
export default function Table({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("overflow-x-auto", className)}>
      <table className="w-full min-w-[720px] border-collapse text-left">
        {children}
      </table>
    </div>
  );
}

/**
 * The heading row. Keyed by index, not by label: a column may be intentionally
 * unlabelled (inventory's last column holds the stock pill), and two empty
 * headings would collide on a label key.
 */
export function TableHead({ headings }: { headings: string[] }) {
  return (
    <thead>
      <tr className="border-b border-border-subtle">
        {headings.map((heading, i) => (
          <th key={i} className={TH}>
            {heading}
          </th>
        ))}
      </tr>
    </thead>
  );
}

export function TableBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-border-subtle">{children}</tbody>;
}

export function TableRow({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <tr className={cx("text-text-primary/70", className)}>{children}</tr>;
}

export function TableCell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <td className={cx(TD, className)}>{children}</td>;
}