"use client";

import * as React from "react";
import { Button } from "@nxtqr/ui";
import { GoogleIcon, SpinnerIcon } from "@nxtqr/icons";
import type { AuthFlowState } from "../schemas/auth.schema";

export interface GoogleSignInButtonProps {
  state: AuthFlowState;
  onClick: () => void;
  className?: string;
  disabled?: boolean;
}

export function GoogleSignInButton({
  state,
  onClick,
  className = "",
  disabled = false,
}: GoogleSignInButtonProps) {
  const isBusy =
    state === "preparing" ||
    state === "popup_open" ||
    state === "verifying_session" ||
    state === "success";

  const getLabel = () => {
    switch (state) {
      case "preparing":
        return "Preparing sign-in...";
      case "popup_open":
        return "Waiting for Google...";
      case "verifying_session":
        return "Finishing sign-in...";
      case "success":
        return "Redirecting...";
      default:
        return "Continue with Google";
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      disabled={disabled || isBusy}
      aria-busy={isBusy}
      aria-label="Continue with Google"
      className={`relative w-full h-10 px-4 rounded-md font-sans text-xs font-medium tracking-tight
        bg-surface-02 hover:bg-surface-03 active:bg-surface-01
        text-foreground border-border-default hover:border-border-hover active:border-border-strong
        shadow-level-1 active:shadow-level-3 transition-[background-color,border-color,box-shadow]
        focus-visible:ring-1 focus-visible:ring-border-strong focus-visible:ring-offset-0 focus-visible:outline-none
        ${className}`}
    >
      <div className="flex items-center justify-center gap-2.5 w-full">
        {isBusy ? (
          <SpinnerIcon className="h-4 w-4 animate-spin text-text-muted shrink-0" />
        ) : (
          <GoogleIcon className="h-4 w-4 text-foreground shrink-0" />
        )}
        <span className="truncate">{getLabel()}</span>
      </div>
    </Button>
  );
}

