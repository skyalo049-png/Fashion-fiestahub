import type { Metadata } from "next";

import CheckoutClient from "@/components/CheckoutClient";

/**
 * Checkout.
 *
 * A server component that renders a client component and nothing else. The
 * cart lives in localStorage, so the form cannot be server-rendered with real
 * contents; the page shell is static and the bag fills in on hydration.
 *
 * `noindex` is set here rather than in robots.ts because a robots.txt Disallow
 * prevents crawling, not indexing — a disallowed URL that is linked from
 * anywhere can still be indexed without its content being read. The meta tag
 * is the directive that actually works.
 */
export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order. Pay by M-Pesa; delivery quoted per order.",
  robots: { index: false, follow: true },
};

export default function CheckoutPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 pb-24 pt-12 sm:px-8">
      <header className="mb-10">
        <p className="font-body text-[10px] uppercase tracking-[0.3em] text-champagne">
          Checkout
        </p>
        <h1 className="mt-3 font-display text-3xl text-pearl sm:text-4xl">
          Almost yours
        </h1>
        <p className="mt-3 max-w-xl font-body text-sm font-light leading-relaxed text-pearl/50">
          No account needed. We hold your items while we confirm delivery, then
          you pay by M-Pesa.
        </p>
      </header>

      <CheckoutClient />
    </main>
  );
}