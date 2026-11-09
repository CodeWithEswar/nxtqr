"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@nxtqr/ui";
import { GoogleSignInButton } from "@/features/auth/components/google-sign-in-button";
import { useGoogleAuth } from "@/features/auth/hooks/use-google-auth";
import { ErrorVisual } from "./error-visual";

export interface SessionExpiredDialogProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  nextPath?: string;
}

export function SessionExpiredDialog({
  open,
  onOpenChange,
  nextPath = "/workspace",
}: SessionExpiredDialogProps) {
  const { state, signInWithGooglePopup } = useGoogleAuth();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-surface-01 border-border-default rounded-md text-foreground select-none">
        <DialogHeader className="text-center space-y-3">
          <ErrorVisual variant="restricted" />

          <DialogTitle className="text-lg font-bold font-sans text-foreground">
            Session Expired
          </DialogTitle>

          <DialogDescription className="text-xs text-text-muted leading-relaxed">
            Your authenticated session has ended. Sign in to restore your session and resume your workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4 flex flex-col items-center">
          <GoogleSignInButton
            state={state}
            onClick={() => signInWithGooglePopup(nextPath)}
            className="w-full"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
