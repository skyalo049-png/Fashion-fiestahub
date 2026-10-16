"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { cartCount, useCart } from "@/lib/cart";
import { site } from "@/lib/site";
import Button from "@/components/ui/Button";

/**
 * Header with the bag button.
 *
 * A client component because the count lives in localStorage. `mounted` is not
 * decoration: the server renders zero items and the browser may render three,
 * and React will not patch that difference without either a mount flag or a
 * suppression warning. The badge appears after hydration, which is correct —
 * claiming "0" and then flipping to "3" is the same flash either way.
 */
export default function SiteHeader() {
  const lines = useCart((s) => s.lines);
  const open = useCart((s) => s.open);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const count = mounted ? cartCount(lines) : 0;

  return (
    <header className="sticky top-0 z-40 border-b border-pearl/8 bg-obsidian/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="group">
          <span className="font-display text-base tracking-wide text-pearl group-hover:text-champagne transition-colors">
            {site.name}
          </span>
          <span className="ml-3 hidden font-body text-[10px] uppercase tracking-[0.25em] text-pearl/35 sm:inline">
            {site.city}
          </span>
        </Link>

        <Button
          variant="secondary"
          size="sm"
          onClick={open}
          aria-label={`Open bag, ${count} ${count === 1 ? "item" : "items"}`}
          className="gap-2"
        >
          Bag
          <span className="tabular-nums text-accent">{count}</span>
        </Button>
      </div>
    </header>
  );
}