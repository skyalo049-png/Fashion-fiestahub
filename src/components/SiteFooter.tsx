import Link from "next/link";

import { policies } from "@/lib/policies";
import { site } from "@/lib/site";

/**
 * The site footer.
 *
 * It lives in the root layout rather than in each page, because the policy
 * pages are the part of this shop a customer looks for at the worst moment —
 * a parcel that has not arrived, a dress that does not fit. Those links must be
 * on every page, including the product page they were reading when the doubt
 * set in, not only on the homepage they have already scrolled past.
 */
export default function SiteFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-5 pb-20 sm:px-8">
      <div className="border-t border-pearl/8 pt-8">
        <nav aria-label="Shop policies">
          <ul className="flex flex-wrap gap-x-6 gap-y-2">
            {policies.map((policy) => (
              <li key={policy.href}>
                <Link
                  href={policy.href}
                  className="font-body text-[11px] uppercase tracking-[0.2em] text-pearl/45 transition-colors hover:text-champagne"
                >
                  {policy.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-body text-[11px] uppercase tracking-[0.2em] text-pearl/30">
            M-Pesa accepted · {site.city} delivery · Nationwide shipping
          </p>
          <p className="font-body text-[11px] uppercase tracking-[0.2em] text-pearl/25">
            Delivery quoted per order
          </p>
        </div>
      </div>
    </footer>
  );
}