import { createBrowserClient } from "@nxtqr/database/client";
import { AppError, logAuthEvent } from "../lib/auth-errors";
import type { UserProfile } from "@nxtqr/validation";

let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function getBrowserAuthClient() {
  if (typeof window === "undefined") {
    return createBrowserClient();
  }
  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient();
  }
  return browserClientInstance;
}

export interface PrepareOAuthResult {
  url: string;
  attemptId: string;
}

export async function prepareGoogleOAuth(
  mode: "popup" | "redirect" = "popup",
  nextPath = "/workspace",
): Promise<PrepareOAuthResult> {
  const supabase = getBrowserAuthClient();
  const attemptId = crypto.randomUUID();

  const origin = typeof window !== "undefined" ? window.location.origin : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
  
  // Safe validation of next path (prevent open redirects)
  const safeNext = nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/workspace";
  
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", safeNext);
  callbackUrl.searchParams.set("attemptId", attemptId);
  if (mode === "popup") {
    callbackUrl.searchParams.set("popup", "true");
  }

  logAuthEvent("OAuth", "Initiating Google OAuth flow", { mode, safeNext, attemptId });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: callbackUrl.toString(),
      skipBrowserRedirect: true, // We handle the navigation or popup manually
      queryParams: {
        access_type: "offline",
        prompt: "select_account",
      },
    },
  });

  if (error || !data?.url) {
    logAuthEvent("OAuth", "Failed to retrieve provider OAuth URL", { error: error?.message });
    throw new AppError("AUTH_PROVIDER_ERROR", error?.message || "Failed to initialize Google sign-in.");
  }

  return {
    url: data.url,
    attemptId,
  };
}

export async function verifyCurrentSession(): Promise<UserProfile | null> {
  const supabase = getBrowserAuthClient();

  try {
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return null;
    }

    const user = session.user;

    // Idempotent client-side profile check/provision
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) {
      // Provision profile if missing
      const displayName =
        (user.user_metadata?.full_name as string | undefined) ||
        (user.user_metadata?.display_name as string | undefined) ||
        (user.user_metadata?.name as string | undefined) ||
        user.email?.split("@")[0] ||
        "Engineer";

      const avatarUrl =
        (user.user_metadata?.avatar_url as string | undefined) ||
        (user.user_metadata?.picture as string | undefined) ||
        null;

      const { data: createdProfile } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          email: user.email || "",
          display_name: displayName,
          avatar_url: avatarUrl,
        })
        .select()
        .single();

      if (createdProfile) {
        return {
          id: createdProfile.id,
          email: createdProfile.email,
          displayName: createdProfile.display_name,
          avatarUrl: createdProfile.avatar_url,
          createdAt: createdProfile.created_at,
          updatedAt: createdProfile.updated_at,
        };
      }
    }

    return {
      id: profile ? profile.id : user.id,
      email: (profile?.email || user.email) ?? "",
      displayName: profile?.display_name || user.email?.split("@")[0] || "Engineer",
      avatarUrl: profile?.avatar_url || (user.user_metadata?.avatar_url as string) || null,
      createdAt: profile?.created_at || new Date().toISOString(),
      updatedAt: profile?.updated_at || new Date().toISOString(),
    };
  } catch (err) {
    logAuthEvent("Session", "Error verifying active session", { error: err });
    return null;
  }
}

export async function signOutUser(): Promise<void> {
  const supabase = getBrowserAuthClient();
  logAuthEvent("Session", "Signing out user");
  await supabase.auth.signOut();
}

