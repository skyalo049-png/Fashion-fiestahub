import ProductCard from "@/components/ProductCard";
import { getActiveProducts } from "@/lib/catalogue";
import { site } from "@/lib/site";

/**
 * The storefront grid, read live from Postgres.
 *
 * This is a server component: the query runs on the server with the anon key,
 * so RLS is enforced and no Supabase credential reaches the browser. It also
 * means the anon key is never inlined into the client bundle — the specific
 * defect in the old app, where a VITE_-prefixed key shipped to every visitor.
 */
export const revalidate = 60;

export default async function Home() {
  const products = await getActiveProducts();

  return (
    <main className="min-h-screen">
      <header className="mx-auto max-w-6xl px-6 pt-16 pb-12">
        <p className="font-body text-xs tracking-[0.3em] uppercase text-champagne">
          {site.city}, {site.country}
        </p>

        <h1 className="font-display text-4xl sm:text-5xl font-semibold mt-5 leading-tight text-pearl max-w-2xl">
          {site.tagline}
        </h1>

        <p className="font-body font-light text-base mt-5 leading-relaxed text-pearl/55 max-w-xl">
          {site.description}
        </p>

        <div className="mt-10 h-px bg-gradient-to-r from-champagne to-transparent" />
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="font-body text-xs tracking-[0.3em] uppercase text-pearl/45">
            The collection
          </h2>
          <span className="font-body text-xs tracking-widest uppercase text-pearl/30">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
          </span>
        </div>

        {products.length === 0 ? (
          <p className="font-body text-sm text-pearl/45">
            Nothing is published yet. Add a product and set its status to
            &ldquo;active&rdquo; in the admin dashboard.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <footer className="mx-auto max-w-6xl px-6 pb-20">
        <div className="border-t border-pearl/8 pt-8 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="font-body text-xs tracking-widest uppercase text-pearl/35">
            M-Pesa accepted · Nairobi delivery · Nationwide shipping
          </p>
          <p className="font-body text-xs tracking-widest uppercase text-pearl/25">
            Delivery quoted per order
          </p>
        </div>
      </footer>
    </main>
  );
}