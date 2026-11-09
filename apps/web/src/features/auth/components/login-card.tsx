"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Card, CardHeader, CardContent, CardFooter } from "@nxtqr/ui";
import { LogoMark } from "@nxtqr/branding";
import { GoogleSignInButton } from "./google-sign-in-button";
import { AuthStatus } from "./auth-status";
import { useGoogleAuth } from "../hooks/use-google-auth";

export interface LoginCardProps {
  nextTarget?: string;
}

export function LoginCard({ nextTarget = "/workspace" }: LoginCardProps) {
  const {
    state,
    error,
    isLoading,
    signInWithGooglePopup,
    signInWithGoogleRedirect,
    reset,
  } = useGoogleAuth();

  const handlePopupClick = () => {
    signInWithGooglePopup(nextTarget);
  };

  const handleRedirectClick = () => {
    signInWithGoogleRedirect(nextTarget);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="w-full max-w-[400px] relative z-10 mx-auto px-4"
    >
      <Card className="rounded-md border border-border-default bg-surface-01 shadow-level-2 overflow-hidden">
        <CardHeader className="pt-8 pb-5 px-6 sm:px-8 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-02 border border-border-default text-foreground shadow-level-1">
              <LogoMark size={28} />
            </div>
          </div>

          <div className="space-y-1.5">
            <h1 className="font-sans text-lg font-semibold tracking-tight text-foreground">
              Welcome to NXTQR
            </h1>
            <p className="font-sans text-xs text-text-muted leading-relaxed">
              Sign in to continue to your engineering workspace.
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 pb-6 space-y-4">
          <GoogleSignInButton
            state={state}
            onClick={handlePopupClick}
            disabled={isLoading}
          />

          <AuthStatus
            state={state}
            error={error}
            onRetry={reset}
            onRedirectFallback={handleRedirectClick}
          />
        </CardContent>

        <CardFooter className="pt-3 pb-6 px-4 sm:px-6 border-t border-border-subtle flex flex-col items-center justify-center text-center gap-2 select-none">
          <p className="font-sans text-[11px] text-text-muted leading-relaxed max-w-[320px]">
            By continuing, you agree to the{" "}
            <Link
              href="/terms"
              className="text-text-secondary hover:text-foreground transition-colors underline underline-offset-4"
            >
              Terms of Service
            </Link>{" "}
            and acknowledge the{" "}
            <Link
              href="/privacy"
              className="text-text-secondary hover:text-foreground transition-colors underline underline-offset-4"
            >
              Privacy Policy
            </Link>
            .
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[10px] text-text-muted font-mono">
            <Link
              href="/docs"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Documentation
            </Link>
            <span className="text-text-disabled" aria-hidden="true">·</span>
            <Link
              href="/verify"
              className="hover:text-foreground transition-colors underline-offset-4 hover:underline"
            >
              Diagnostics
            </Link>
          </div>
        </CardFooter>
      </Card>
    </motion.div>
  );
}

