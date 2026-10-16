import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * The /admin gate.
 *
 * What this is: routing convenience. It keeps a signed-out visitor from
 * landing on a dashboard shell that renders nothing and looks broken, and it
 * keeps the session token fresh.
 *
 * What this is NOT: the security boundary. Every staff function in the
 * database re-checks `is_staff()` inside itself, and every staff table is
 * covered by RLS. If this file were deleted entirely, an anonymous caller
 * would still get `not_staff` from Postgres on every write and an empty result
 * on every read. The boundary is the database; this is the doorbell.
 *
 * That ordering matters. A middleware-only gate is the classic way to ship an
 * admin panel that is one `matcher` typo away from being public.
 */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser(), not getSession(). getSession() reads the cookie and believes it;
  // getUser() asks the auth server, which is the only version that can tell a
  // real user from a forged cookie.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname, search } = request.nextUrl;
  const isLogin = pathname === "/admin/login";

  if (!user && !isLogin) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/admin/login";
    redirect.search = "";
    // `next` so a bookmarked deep link survives the detour through login.
    redirect.searchParams.set("next", pathname + search);
    return NextResponse.redirect(redirect);
  }

  if (user && isLogin) {
    const redirect = request.nextUrl.clone();
    redirect.pathname = "/admin";
    redirect.search = "";
    return NextResponse.redirect(redirect);
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};