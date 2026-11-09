"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Button } from "@nxtqr/ui";
import { ChevronLeftIcon, RefreshIcon } from "@nxtqr/icons";
import { ErrorVisual } from "./error-visual";
import { cn } from "@nxtqr/utils";

export interface ErrorLayoutProps {
  code?: string | number;
  title: string;
  description: string;
  primaryActionLabel?: string;
  primaryActionHref?: string;
  onPrimaryAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  visualVariant?: "not-found" | "error" | "restricted" | "service-unavailable";
  digest?: string;
  children?: React.ReactNode;
  className?: string;
}

export function ErrorLayout({
  code,
  title,
  description,
  primaryActionLabel = "Return to Workspace",
  primaryActionHref = "/workspace",
  onPrimaryAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  visualVariant = "not-found",
  digest,
  children,
  className,
}: ErrorLayoutProps) {
  const shouldReduceMotion = useReducedMotion();

  const containerVariants = {
    hidden: { opacity: 0, y: shouldReduceMotion ? 0 : 8 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" as const },
    },
  };

  return (
    <div
      className={cn(
        "min-h-[75vh] w-full flex flex-col items-center justify-center p-4 sm:p-6 select-none bg-background text-foreground",
        className
      )}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md flex flex-col items-center text-center space-y-5"
      >
        {/* Technical Graph Visual */}
        <ErrorVisual variant={visualVariant} />

        {/* Status / Code Badge */}
        {code && (
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-text-muted px-2.5 py-0.5 rounded-md border border-border-default bg-surface-01">
            HTTP {code}
          </span>
        )}

        {/* Heading & Description */}
        <div className="space-y-2">
          <h1 className="font-sans text-xl sm:text-2xl font-bold text-foreground tracking-tight">
            {title}
          </h1>
          <p className="font-sans text-sm text-text-muted leading-relaxed max-w-sm mx-auto">
            {description}
          </p>
        </div>

        {/* Optional Error Correlation Digest (Masked for production security) */}
        {digest && (
          <div className="px-3 py-1.5 rounded-md bg-surface-01 border border-border-subtle font-mono text-[11px] text-text-muted select-text">
            <span>Correlation ID: </span>
            <span className="text-foreground">{digest}</span>
          </div>
        )}

        {children}

        {/* Primary & Secondary Recovery Actions */}
        <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
          {onPrimaryAction ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onPrimaryAction}
              className="h-8 px-3.5 text-xs font-mono font-medium rounded-md border-border-default bg-surface-02 hover:bg-surface-03 hover:border-border-hover text-foreground shadow-level-1 active:shadow-level-3 gap-1.5"
            >
              <RefreshIcon className="h-3 w-3" />
              <span>{primaryActionLabel}</span>
            </Button>
          ) : primaryActionHref ? (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="h-8 px-3.5 text-xs font-mono font-medium rounded-md border-border-default bg-surface-02 hover:bg-surface-03 hover:border-border-hover text-foreground shadow-level-1 active:shadow-level-3 gap-1.5"
            >
              <Link href={primaryActionHref}>
                <span>{primaryActionLabel}</span>
              </Link>
            </Button>
          ) : null}

          {onSecondaryAction ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSecondaryAction}
              className="h-8 px-3 text-xs font-mono rounded-md text-text-muted hover:text-foreground gap-1.5"
            >
              <ChevronLeftIcon className="h-3.5 w-3.5" />
              <span>{secondaryActionLabel}</span>
            </Button>
          ) : secondaryActionHref && secondaryActionLabel ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs font-mono rounded-md text-text-muted hover:text-foreground gap-1.5"
            >
              <Link href={secondaryActionHref}>
                <span>{secondaryActionLabel}</span>
              </Link>
            </Button>
          ) : null}
        </div>
      </motion.div>
    </div>
  );
}
