/**
 * The session-aware Supabase client. Server-only.
 *
 * This is deliberately a SECOND client, not a change to `server.ts`.
 *
 * `server.ts` uses `persistSession: false` and no cookies, which is what lets
 * the catalogue be statically rendered. The moment a client reads cookies the
 * route it is called from opts out of static rendering — so folding sessions
 * into `server.ts` would quietly turn every product page dynamic and cost the
 * `revalidate = 60` the PLP depends on.
 *
 * Two clients, two jobs:
 *   - server.ts  → anon, no cookies, static catalogue reads.
 *   - session.ts → carries the signed-in user's JWT so `auth.uid()` is set and
 *                  the staff RLS policies can actually match.
 *
 * The key is still the publishable/anon key. The USER's identity rides in the
 * cookie and is attached by @supabase/ssr; the key is not the credential.
 */
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import type { Database } from "./database.types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!url || !anonKey) {
  throw new Error(
    "NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.",
  );
}

export async function createSessionSupabase() {
  const cookieStore = await cookies();

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Thrown when called from a Server Component, where cookies are
          // read-only. That is expected and harmless: middleware refreshes the
          // token and writes the rotated cookie on the way through, so the
          // write attempted here is a duplicate rather than the only chance.
        }
      },
    },
  });
}