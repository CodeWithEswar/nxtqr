"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import type { AuthFlowState } from "../schemas/auth.schema";
import { openAuthPopup, type PopupController } from "../lib/popup-window";
import { prepareGoogleOAuth, verifyCurrentSession, getBrowserAuthClient } from "../services/auth-service";
import { AppError, formatAuthError, type UserFacingError, logAuthEvent } from "../lib/auth-errors";

export interface UseGoogleAuthReturn {
  state: AuthFlowState;
  error: UserFacingError | null;
  isLoading: boolean;
  signInWithGooglePopup: (nextPath?: string) => Promise<void>;
  signInWithGoogleRedirect: (nextPath?: string) => Promise<void>;
  reset: () => void;
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = React.useState<AuthFlowState>("idle");
  const [error, setError] = React.useState<UserFacingError | null>(null);

  const activePopupRef = React.useRef<PopupController | null>(null);
  const nextTarget = searchParams.get("next") || "/workspace";

  // Check if an initial error was passed in URL (e.g. from failed callback)
  React.useEffect(() => {
    const urlError = searchParams.get("error");
    if (urlError) {
      const formatted = formatAuthError(new AppError("AUTH_PROVIDER_ERROR", urlError));
      setError(formatted);
      setState("failed");
    }
  }, [searchParams]);

  // Clean up any open popups on unmount
  React.useEffect(() => {
    return () => {
      if (activePopupRef.current) {
        activePopupRef.current.close();
      }
    };
  }, []);

  const reset = React.useCallback(() => {
    if (activePopupRef.current) {
      activePopupRef.current.close();
      activePopupRef.current = null;
    }
    setState("idle");
    setError(null);
  }, []);

  const handleAuthSuccess = React.useCallback(async (destination: string) => {
    setState("verifying_session");
    logAuthEvent("State", "Verifying session after popup signal");
    toast.loading("Verifying Session...", {
      id: "auth-toast",
      description: "Validating credentials and provisioning workspace.",
    });

    try {
      const profile = await verifyCurrentSession();
      if (!profile) {
        throw new AppError("AUTH_SESSION_EXPIRED", "Session verification returned no active user.");
      }

      setState("success");
      logAuthEvent("State", "Authentication fully verified, navigating", { destination });
      toast.success("Authentication Successful", {
        id: "auth-toast",
        description: "Welcome to NXTQR Studio. Redirecting...",
      });
      router.push(destination);
      router.refresh();
    } catch (err) {
      const formatted = formatAuthError(err);
      setError(formatted);
      setState("failed");
      toast.error(formatted.title, {
        id: "auth-toast",
        description: formatted.message,
      });
    }
  }, [router]);

  const signInWithGooglePopup = React.useCallback(async (nextPath?: string) => {
    // Duplicate submission locking
    if (state === "preparing" || state === "popup_open" || state === "verifying_session" || state === "success") {
      logAuthEvent("State", "Prevented concurrent sign-in invocation", { currentState: state });
      return;
    }

    const destination = nextPath || nextTarget;
    setError(null);
    setState("preparing");
    toast.loading("Connecting to Google...", {
      id: "auth-toast",
      description: "Opening secure sign-in window.",
    });

    try {
      const { url, attemptId } = await prepareGoogleOAuth("popup", destination);

      setState("popup_open");
      toast.loading("Google Sign-In Active", {
        id: "auth-toast",
        description: "Complete authentication in the Google window.",
      });

      activePopupRef.current = openAuthPopup({
        url,
        attemptId,
        onSuccess: () => {
          activePopupRef.current = null;
          handleAuthSuccess(destination);
        },
        onCancelled: () => {
          activePopupRef.current = null;
          logAuthEvent("State", "Popup cancelled by user");
          setState("cancelled");
          toast.dismiss("auth-toast");
          toast.info("Sign-In Cancelled", {
            description: "Google authentication window was closed.",
          });
          // Smooth return to idle after brief moment
          setTimeout(() => {
            setState((prev) => (prev === "cancelled" ? "idle" : prev));
          }, 1500);
        },
        onError: (appErr) => {
          activePopupRef.current = null;
          logAuthEvent("State", "Popup error occurred", { code: appErr.code });
          const formatted = formatAuthError(appErr);
          if (appErr.code === "AUTH_POPUP_BLOCKED") {
            setState("blocked");
          } else if (appErr.code === "AUTH_TIMEOUT") {
            setState("timeout");
          } else {
            setState("failed");
          }
          setError(formatted);
          toast.error(formatted.title, {
            id: "auth-toast",
            description: formatted.message,
          });
        },
      });
    } catch (err) {
      logAuthEvent("State", "Failed during OAuth preparation", { error: err });
      const formatted = formatAuthError(err);
      setError(formatted);
      setState(formatted.code === "AUTH_POPUP_BLOCKED" ? "blocked" : "failed");
      toast.error(formatted.title, {
        id: "auth-toast",
        description: formatted.message,
      });
    }
  }, [state, nextTarget, handleAuthSuccess]);

  const signInWithGoogleRedirect = React.useCallback(async (nextPath?: string) => {
    const destination = nextPath || nextTarget;
    setError(null);
    setState("preparing");
    toast.loading("Redirecting to Google...", {
      id: "auth-toast",
      description: "Navigating to Google OAuth gateway.",
    });

    try {
      const supabase = getBrowserAuthClient();
      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const callbackUrl = new URL("/auth/callback", origin);
      callbackUrl.searchParams.set("next", destination);

      const { error: redirectError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: callbackUrl.toString(),
          queryParams: {
            access_type: "offline",
            prompt: "select_account",
          },
        },
      });

      if (redirectError) {
        throw new AppError("AUTH_PROVIDER_ERROR", redirectError.message);
      }
    } catch (err) {
      const formatted = formatAuthError(err);
      setError(formatted);
      setState("failed");
      toast.error(formatted.title, {
        id: "auth-toast",
        description: formatted.message,
      });
    }
  }, [nextTarget]);

  const isLoading = state === "preparing" || state === "popup_open" || state === "verifying_session" || state === "success";

  return {
    state,
    error,
    isLoading,
    signInWithGooglePopup,
    signInWithGoogleRedirect,
    reset,
  };
}

