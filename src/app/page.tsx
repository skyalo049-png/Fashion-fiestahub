import { site } from "@/lib/site";

/**
 * Placeholder shell. Its only job is to prove the theme, fonts and metadata
 * are wired correctly — the real storefront is ported in the UI phase, after
 * the schema is live.
 */
export default function Home() {
  return (
    <main className="min-h-screen flex items-center">
      <div className="mx-auto max-w-3xl px-6 py-24">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-champagne">
          {site.city}, {site.country}
        </p>

        <h1 className="font-display text-5xl sm:text-6xl font-semibold mt-6 leading-tight text-pearl">
          Celebrate the <em className="text-champagne">African</em> woman in you
        </h1>

        <p className="font-body font-light text-base sm:text-lg mt-6 leading-relaxed text-pearl/60 max-w-xl">
          {site.description}
        </p>

        <div className="mt-12 h-px bg-gradient-to-r from-champagne to-transparent" />

        {/* Static class names on purpose: Tailwind only sees literal strings. */}
        <div className="mt-8 flex flex-wrap gap-3">
          {[
            ["champagne", "bg-champagne"],
            ["champagne-light", "bg-champagne-light"],
            ["champagne-dark", "bg-champagne-dark"],
            ["obsidian", "bg-obsidian"],
            ["charcoal", "bg-charcoal"],
            ["charcoal-2", "bg-charcoal-2"],
            ["mist", "bg-mist"],
            ["pearl", "bg-pearl"],
          ].map(([token, className]) => (
            <span
              key={token}
              className={`${className} border border-pearl/10 w-16 h-16`}
              title={token}
            />
          ))}
        </div>

        <p className="mt-10 font-body text-xs tracking-widest uppercase text-pearl/30">
          Shell online · schema next
        </p>

        <p className="mt-4 font-body text-xs tracking-widest uppercase text-pearl/30">
          M-Pesa accepted · Nairobi delivery · Nationwide shipping
        </p>
      </div>
    </main>
  );
}