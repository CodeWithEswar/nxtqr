"use client";

import * as React from "react";
import { Alert, AlertDescription, AlertTitle, Button } from "@nxtqr/ui";
import { AlertCircleIcon, ExternalLinkIcon, RefreshIcon } from "@nxtqr/icons";
import type { AuthFlowState } from "../schemas/auth.schema";
import type { UserFacingError } from "../lib/auth-errors";

export interface AuthStatusProps {
  state: AuthFlowState;
  error: UserFacingError | null;
  onRetry: () => void;
  onRedirectFallback: () => void;
}

export function AuthStatus({
  state,
  error,
  onRetry,
  onRedirectFallback,
}: AuthStatusProps) {
  if (state === "idle") {
    return null;
  }

  // Active status notices
  if (state === "popup_open") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-md border border-border-default bg-surface-02 p-3 text-center space-y-1"
      >
        <p className="text-xs font-medium text-foreground">
          Complete sign-in in the Google window
        </p>
        <p className="text-[11px] text-text-muted">
          Keep this tab open while authenticating.
        </p>
      </div>
    );
  }

  if (state === "verifying_session") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-md border border-border-default bg-surface-02 p-3 text-center space-y-1"
      >
        <p className="text-xs font-medium text-foreground">Finishing sign-in...</p>
        <p className="text-[11px] text-text-muted">
          Establishing authenticated session and provisioning workspace.
        </p>
      </div>
    );
  }

  if (state === "cancelled") {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-md border border-border-subtle bg-surface-01 p-2.5 text-center"
      >
        <p className="text-xs text-text-muted">Sign-in was cancelled.</p>
      </div>
    );
  }

  // Popup blocked by browser
  if (state === "blocked" || error?.code === "AUTH_POPUP_BLOCKED") {
    return (
      <Alert
        variant="default"
        className="border-border-default bg-surface-02 text-foreground rounded-md p-3.5 space-y-2"
      >
        <div className="flex items-start gap-2.5">
          <AlertCircleIcon className="h-4 w-4 text-text-muted shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0 flex-1">
            <AlertTitle className="text-xs font-semibold text-foreground">
              Popup Blocked by Browser
            </AlertTitle>
            <AlertDescription className="text-[11px] text-text-muted leading-relaxed">
              Your browser blocked the Google authentication popup. You can continue using full-page redirect.
            </AlertDescription>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRedirectFallback}
            className="h-7 px-2.5 text-[11px] rounded-md border-border-default hover:border-border-hover bg-surface-03 text-foreground gap-1.5"
          >
            <ExternalLinkIcon className="h-3 w-3" />
            <span>Continue via Redirect</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onRetry}
            className="h-7 px-2 text-[11px] text-text-muted hover:text-foreground"
          >
            Retry Popup
          </Button>
        </div>
      </Alert>
    );
  }

  // General errors
  if (error || state === "failed" || state === "timeout") {
    const title = error?.title || "Authentication Notice";
    const message = error?.message || "An unexpected error occurred during sign-in. Please try again.";

    return (
      <Alert
        variant="destructive"
        className="border-border-default bg-surface-02 text-foreground rounded-md p-3.5 space-y-2"
      >
        <div className="flex items-start gap-2.5">
          <AlertCircleIcon className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1 min-w-0 flex-1">
            <AlertTitle className="text-xs font-semibold text-foreground">{title}</AlertTitle>
            <AlertDescription className="text-[11px] text-text-muted leading-relaxed">
              {message}
            </AlertDescription>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onRetry}
            className="h-7 px-2.5 text-[11px] rounded-md border-border-default hover:border-border-hover bg-surface-03 text-foreground gap-1.5"
          >
            <RefreshIcon className="h-3 w-3" />
            <span>{error?.retryActionTitle || "Try Again"}</span>
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onRedirectFallback}
            className="h-7 px-2 text-[11px] text-text-muted hover:text-foreground"
          >
            Use Full-Page Sign-In
          </Button>
        </div>
      </Alert>
    );
  }

  return null;
}

