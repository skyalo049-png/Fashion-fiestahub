import Link from "next/link";

import { policies, POLICY_UPDATED } from "@/lib/policies";

/**
 * The shell every policy page sits in: a title, the date the text last
 * changed, and the cross-links.
 *
 * The prose styling lives here as descendant variants rather than as one
 * component per tag, so the pages themselves read as plain HTML. A legal
 * document is easier to check against a printed copy when the source is not
 * buried in wrapper components, and it keeps these pages easy to hand to a
 * lawyer to edit.
 */
export default function PolicyShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 pb-24 pt-12 sm:px-8">
      <header className="border-b border-border-subtle pb-8">
        <h1 className="font-display text-3xl leading-tight text-text-primary sm:text-4xl">
          {title}
        </h1>
        <p className="mt-4 font-body text-sm font-light leading-relaxed text-text-primary/55">
          {intro}
        </p>
        <p className="mt-5 font-body text-[11px] uppercase tracking-[0.2em] text-text-primary/30">
          Last updated {POLICY_UPDATED}
        </p>
      </header>

      <div
        className={[
          "mt-10 flex flex-col gap-5",
          "font-body text-sm font-light leading-relaxed text-text-primary/65",
          "[&_h2]:mt-7 [&_h2]:font-body [&_h2]:text-[11px] [&_h2]:uppercase [&_h2]:tracking-[0.25em] [&_h2]:text-text-primary/60",
          "[&_h3]:mt-3 [&_h3]:font-display [&_h3]:text-base [&_h3]:text-text-primary/85",
          "[&_ul]:flex [&_ul]:list-disc [&_ul]:flex-col [&_ul]:gap-2 [&_ul]:pl-5 [&_ul]:marker:text-accent/60",
          "[&_ol]:flex [&_ol]:list-decimal [&_ol]:flex-col [&_ol]:gap-2 [&_ol]:pl-5 [&_ol]:marker:text-accent/60",
          "[&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4 [&_a]:decoration-accent/30 hover:[&_a]:decoration-accent",
          "[&_strong]:font-normal [&_strong]:text-text-primary",
          "[&_table]:w-full [&_table]:border-collapse [&_table]:text-left",
          "[&_th]:border-b [&_th]:border-border-subtle [&_th]:py-2.5 [&_th]:pr-4 [&_th]:text-[10px] [&_th]:uppercase [&_th]:tracking-[0.15em] [&_th]:text-text-primary/45",
          "[&_td]:border-b [&_td]:border-border-subtle [&_td]:py-2.5 [&_td]:pr-4 [&_td]:tabular-nums [&_td]:text-text-primary/55",
        ].join(" ")}
      >
        {children}
      </div>

      <nav className="mt-16 border-t border-border-subtle pt-8">
        <h2 className="font-body text-[11px] uppercase tracking-[0.25em] text-text-primary/45">
          The rest of the fine print
        </h2>
        <ul className="mt-4 grid gap-3 sm:grid-cols-2">
          {policies.map((policy) => (
            <li key={policy.href}>
              <Link
                href={policy.href}
                className="block border border-border-subtle px-4 py-3 transition-colors hover:border-accent/50"
              >
                <span className="font-body text-xs uppercase tracking-[0.2em] text-accent">
                  {policy.label}
                </span>
                <span className="mt-1 block font-body text-[11px] font-light text-text-primary/45">
                  {policy.summary}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}