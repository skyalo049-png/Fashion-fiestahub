/**
 * Server-side Supabase client.
 *
 * Uses the ANON key on purpose. The storefront must go through RLS, not around
 * it — if these policies were wrong, the page should fail, not silently render
 * data a visitor has no right to see. The service-role key is never used here.
 *
 * No session, no cookies: the catalogue is public and the cart is client-side,
 * so there is nothing to persist. When customer auth arrives this is the one
 * file that changes (swap to @supabase/ssr's createServerClient with cookies);
 * every call site keeps working because they all go through this function.
 */
import { createClient } from "@supabase/supabase-js";

import type { Database } from "./database.types";

export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase env vars missing. Copy .env.example to .env.local and fill " +
        "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createClient<Database>(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
