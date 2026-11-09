import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@nxtqr/database/server";
import { isProtectedRoute, validateSafeRedirect } from "./lib/routing/route-policy";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Fast bailout: Immediately bypass static files, Next.js internals, and assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Clean up any empty or zero-length cookies to prevent header size ballooning (HTTP 431)
  for (const cookie of request.cookies.getAll()) {
    if (!cookie.value || cookie.value === "deleted" || cookie.value === '""') {
      response.cookies.delete(cookie.name);
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(
    {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set({ name, value, ...options }),
        );
      },
    },
    supabaseUrl,
    supabaseKey,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Layer 1: Edge & Route Interception for protected studio routes
  if (isProtectedRoute(pathname)) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      const safeNext = validateSafeRedirect(pathname + request.nextUrl.search, "/workspace");
      loginUrl.searchParams.set("next", safeNext);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Redirect authenticated user away from login page
  if (pathname === "/login" && user) {
    const rawNext = request.nextUrl.searchParams.get("next");
    const safeNext = validateSafeRedirect(rawNext, "/workspace");
    return NextResponse.redirect(new URL(safeNext, request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/workspace/:path*",
    "/projects/:path*",
    "/settings/:path*",
    "/visualizers/:path*",
    "/login",
  ],
};
