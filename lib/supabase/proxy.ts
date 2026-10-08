import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refreshes the Supabase session (rotating the access token when it's close
 * to expiry) and writes the new cookies to both the request and the response,
 * so Server Components further down see the fresh token.
 */



export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  // update supabase session
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // Don't run code between createServerClient and getClaims(): getClaims()
  // triggers the refresh, and it verifies the JWT signature.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  // Signed-out visitors may browse everything (the studio shows them what
  // they can do); the API itself refuses their requests. Signed-in users skip
  // the home landing page and the login page and go straight to the studio,
  // so the landing pages stay static for everyone else.
  const { pathname } = request.nextUrl;
  if (signedIn && (pathname === "/" || pathname === "/login")) {
    const url = request.nextUrl.clone();
    url.pathname = "/generate";
    url.search = "";
    return redirectWithCookies(url, response);
  }

  return response;
}

// Keep any refreshed session cookies when redirecting.
function redirectWithCookies(url: URL, from: NextResponse) {
  const redirect = NextResponse.redirect(url);
  from.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
  return redirect;
}
