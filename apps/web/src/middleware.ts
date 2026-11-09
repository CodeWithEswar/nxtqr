import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@nxtqr/database/server";
import { isProtectedRoute, validateSafeRedirect } from "./lib/routing/route-policy";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return response;
  }

  const supabase = createServerClient(
    {
      get: (name) => request.cookies.get(name),
      set: (name, value, options) => {
        request.cookies.set({ name, value, ...options });
        response.cookies.set({ name, value, ...options });
      },
      remove: (name) => {
        request.cookies.delete(name);
        response.cookies.delete(name);
      },
    },
    supabaseUrl,
    supabaseKey,
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

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
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
