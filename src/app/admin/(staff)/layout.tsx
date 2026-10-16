import type { Metadata } from "next";
import Link from "next/link";

import { whoami } from "@/lib/admin";
// `(staff)` is a route group: it does not appear in the URL, but it IS a real
// directory on disk. From inside it, auth-actions.ts sits one level up, beside
// login/ — not next to this file.
import { signOut } from "../auth-actions";

export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

/**
 * The gate that matters is in the database — every staff function checks
 * is_staff() itself, and RLS covers the tables. This layout exists so that a
 * signed-in-but-not-staff person sees a sentence explaining that, rather than
 * a dashboard of empty tables that reads as "the shop has no orders".
 *
 * That distinction is not cosmetic. An empty result and a forbidden result
 * look identical, and confusing the two has already wasted time on this
 * project once.
 *
 * It lives in the `(staff)` route group rather than directly under /admin for
 * one reason: /admin/login is also under /admin, and a layout at that level
 * would wrap the login page too — so a signed-out visitor would be told "not
 * authorised" by the very screen whose job is to sign them in. The group keeps
 * the URLs at /admin/orders while the gate covers only what is behind it.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await whoami();

  if (!me.is_staff) {
    return (
      <main className="flex min-h-screen items-center justify-center px-5">
        <div className="max-w-md text-center">
          <p className="font-body text-[10px] uppercase tracking-[0.3em] text-champagne">
            Staff area
          </p>
          <h1 className="mt-3 font-display text-2xl text-pearl">
            Not authorised
          </h1>
          <p className="mt-3 font-body text-sm font-light leading-relaxed text-pearl/50">
            {me.user_id
              ? "You are signed in, but this account is not on the staff list."
              : "You are not signed in."}
          </p>
          <form action={signOut} className="mt-6">
            <button
              type="submit"
              className="font-body text-[11px] uppercase tracking-[0.25em] text-champagne underline underline-offset-4"
            >
              Sign out
            </button>
          </form>
        </div>
      </main>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-pearl/10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-baseline gap-6">
            <Link
              href="/admin/orders"
              className="font-display text-lg text-pearl"
            >
              Fashion Fiesta Hub
            </Link>
            <span className="font-body text-[10px] uppercase tracking-[0.3em] text-champagne">
              Staff
            </span>
          </div>
          <nav className="flex items-center gap-6">
            <Link
              href="/admin/orders"
              className="font-body text-xs uppercase tracking-[0.2em] text-pearl/60 transition-colors hover:text-pearl"
            >
              Orders
            </Link>
            <Link
              href="/admin/products"
              className="font-body text-xs uppercase tracking-[0.2em] text-pearl/60 transition-colors hover:text-pearl"
            >
              Products
            </Link>
            <Link
              href="/admin/inventory"
              className="font-body text-xs uppercase tracking-[0.2em] text-pearl/60 transition-colors hover:text-pearl"
            >
              Inventory
            </Link>
            <Link
              href="/admin/clients"
              className="font-body text-xs uppercase tracking-[0.2em] text-pearl/60 transition-colors hover:text-pearl"
            >
              Clients
            </Link>
            <Link
              href="/"
              className="font-body text-xs uppercase tracking-[0.2em] text-pearl/40 transition-colors hover:text-pearl"
            >
              View site
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="font-body text-xs uppercase tracking-[0.2em] text-pearl/40 transition-colors hover:text-pearl"
              >
                Sign out
              </button>
            </form>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">{children}</main>
    </div>
  );
}