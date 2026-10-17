import type { Metadata } from "next";

import LoginForm from "@/components/admin/LoginForm";

export const metadata: Metadata = {
  title: "Staff sign in",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center px-5 py-16">
      <div className="w-full max-w-sm">
        <p className="font-body text-[10px] uppercase tracking-[0.3em] text-accent">
          Fashion Fiesta Hub
        </p>
        <h1 className="mt-3 font-display text-3xl text-text-primary">Staff sign in</h1>
        <p className="mt-3 font-body text-sm font-light leading-relaxed text-text-primary/50">
          This area is for shop staff. Customers never need an account — orders
          are placed without one.
        </p>

        <LoginForm next={next ?? "/admin"} />
      </div>
    </main>
  );
}