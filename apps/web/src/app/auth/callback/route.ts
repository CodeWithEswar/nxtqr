import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@nxtqr/database/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const rawNext = requestUrl.searchParams.get("next") || "/workspace";
  const isPopup = requestUrl.searchParams.get("popup") === "true";
  const attemptId = requestUrl.searchParams.get("attemptId") || "";
  const providerError = requestUrl.searchParams.get("error_description") || requestUrl.searchParams.get("error");

  // Open redirect guard: validate destination path
  const safeNext = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/workspace";

  if (providerError) {
    if (isPopup) {
      return new NextResponse(
        `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authentication Notice · NXTQR Studio</title>
</head>
<body style="background:#000000;color:#ffffff;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;padding:24px;text-align:center;">
  <div style="max-width:320px;">
    <p style="font-size:13px;color:#858585;margin-bottom:12px;">Authentication was cancelled or failed.</p>
    <button onclick="window.close()" style="background:#141414;color:#ffffff;border:1px solid #262626;padding:6px 14px;border-radius:6px;font-size:12px;cursor:pointer;">Close Window</button>
  </div>
  <script>
    setTimeout(function() { window.close(); }, 1200);
  </script>
</body>
</html>`,
        {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        },
      );
    }
    return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(providerError)}`, request.url));
  }

  if (code) {
    // Forward-compatible cookie adapter pattern
    let response = isPopup
      ? new NextResponse(
          `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authentication Succeeded · NXTQR Studio</title>
</head>
<body style="background:#000000;color:#ffffff;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <p style="font-size:12px;color:#858585;letter-spacing:0.02em;">Completing secure session...</p>
  <script>
    (function() {
      try {
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(
            { type: 'NXTQR_AUTH_SUCCESS', attemptId: '${attemptId}' },
            window.location.origin
          );
        }
      } catch (e) {
        // Fallback if cross-window communication is restricted
      }
      setTimeout(function() {
        try { window.close(); } catch(e) {}
      }, 350);
    })();
  </script>
</body>
</html>`,
          {
            headers: { "Content-Type": "text/html; charset=utf-8" },
          },
        )
      : NextResponse.redirect(new URL(safeNext, request.url));

    const supabase = createServerClient({
      get: (name) => request.cookies.get(name),
      set: (name, value, options) => {
        response.cookies.set({ name, value, ...options });
      },
      remove: (name, options) => {
        response.cookies.set({ name, value: "", ...options });
      },
    });

    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return response;
    }
  }

  // Fallback for failed code exchange
  if (isPopup) {
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Authentication Failed</title></head>
<body style="background:#000;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;">
  <p style="font-size:12px;color:#858585;">Session exchange failed. You can close this window and try again.</p>
  <script>setTimeout(function() { window.close(); }, 2000);</script>
</body>
</html>`,
      { headers: { "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  return NextResponse.redirect(new URL("/login?error=auth_exchange_failed", request.url));
}

