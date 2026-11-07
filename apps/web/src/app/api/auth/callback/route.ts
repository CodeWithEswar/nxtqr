import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@nxtqr/database/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next") || "/";

  if (code) {
    const supabase = createServerClient({
      get: (name) => request.cookies.get(name),
      set: (name, value, options) => {
        request.cookies.set({ name, value, ...options });
      },
      remove: (name, options) => {
        request.cookies.set({ name, value: "", ...options });
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, request.url));
    }
  }

  // Return to login with error if exchange failed
  return NextResponse.redirect(new URL("/login?error=auth_exchange_failed", request.url));
}
