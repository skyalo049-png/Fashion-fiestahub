import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

/*
 * The one text control. Before this existed the identical input string was
 * pasted into eight places — checkout (twice), the admin login (twice), the
 * photo manager, the product form, the variant grid (twice) — and had already
 * drifted into four spellings: two border opacities, `bg-transparent` vs
 * `bg-surface-base`, and `focus:outline-none` in some and not others.
 *
 * It reads semantic tokens only, so it renders correctly on the obsidian brand
 * ground and the pearl commerce ground without knowing which one it is in.
 * That is the property that stops this file being forked per surface later.
 *
 * min-h-11 is the 44px touch floor. It is a min-height rather than more
 * padding so it still holds when the label wraps to two lines or the font
 * falls back to a system stack with different metrics.
 *
 * Input, textarea and select share the same control string because they are
 * the same control to a customer: one labelled box you type or pick in. The
 * admin forms needed all three, and three near-identical strings would have
 * drifted apart within a month the way the first eight did.
 */
export const CONTROL_BASE =
  "block w-full min-h-11 border border-border-subtle bg-surface-base px-4 py-3 font-body text-sm text-text-primary transition-colors placeholder:text-text-muted focus:border-accent";

/*
 * The wrapper adds the gap between label and control. It is separate from
 * CONTROL_BASE because two callers have no label above them — the variant grid
 * puts its controls inside table cells and names them with aria-label instead,
 * and the photo picker is a file input. Those import the base and bring their
 * own spacing, which keeps them on the same border, background and 44px floor
 * as everything else rather than drifting into a fourth spelling.
 */
const CONTROL = `mt-2 ${CONTROL_BASE}`;

export const LABEL =
  "block font-body text-[11px] uppercase tracking-[0.2em] text-text-muted";

const NOTE = "mt-1.5 font-body text-[11px] font-light leading-relaxed";

type BaseProps = {
  /** Visible label. Doubles as the accessible name. */
  label: string;
  /** Used for the control's id, its name, and to derive the hint/error ids. */
  name: string;
  /** Persistent guidance below the control. Replaced by `error` when set. */
  hint?: ReactNode;
  /** Validation message. Sets aria-invalid and announces via role="alert". */
  error?: string;
  /** Wrapper class, for layout spacing only — never for restyling the control. */
  className?: string;
  /** Extra classes for the control itself, e.g. `font-mono text-xs`. */
  controlClassName?: string;
};

export type FieldProps = BaseProps &
  (
    | ({ as?: "input" } & Omit<
        InputHTMLAttributes<HTMLInputElement>,
        "id" | "name" | "className"
      >)
    | ({ as: "textarea" } & Omit<
        TextareaHTMLAttributes<HTMLTextAreaElement>,
        "id" | "name" | "className"
      >)
    | ({ as: "select" } & Omit<
        SelectHTMLAttributes<HTMLSelectElement>,
        "id" | "name" | "className"
      >)
  );

export default function Field({
  label,
  name,
  hint,
  error,
  className,
  controlClassName,
  as = "input",
  ...rest
}: FieldProps) {
  const hintId = hint ? `${name}-hint` : undefined;
  const errorId = error ? `${name}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  const controlClass = `${CONTROL}${
    error ? " border-red-500/60" : ""
  }${controlClassName ? ` ${controlClassName}` : ""}`;

  const shared = {
    id: name,
    name,
    "aria-invalid": error ? (true as const) : undefined,
    "aria-describedby": describedBy,
    className: controlClass,
  };

  return (
    <div className={className}>
      <label htmlFor={name} className={LABEL}>
        {label}
      </label>
      {as === "textarea" ? (
        <textarea
          {...shared}
          {...(rest as TextareaHTMLAttributes<HTMLTextAreaElement>)}
        />
      ) : as === "select" ? (
        <select
          {...shared}
          {...(rest as SelectHTMLAttributes<HTMLSelectElement>)}
        />
      ) : (
        <input
          {...shared}
          {...(rest as InputHTMLAttributes<HTMLInputElement>)}
        />
      )}
      {error ? (
        <p id={errorId} role="alert" className={`${NOTE} text-red-400`}>
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className={`${NOTE} text-text-muted`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
