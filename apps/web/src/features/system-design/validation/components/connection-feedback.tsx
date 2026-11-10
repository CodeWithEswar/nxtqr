"use client";

import * as React from "react";
import Link from "next/link";
import { AlertCircleIcon, AlertTriangleIcon, CloseIcon, BookOpenIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import type { ConnectionValidationResult } from "@nxtqr/architecture-validation";

export interface ConnectionFeedbackProps {
  result: ConnectionValidationResult | null;
  onClose: () => void;
  className?: string;
}

export function ConnectionFeedback({ result, onClose, className }: ConnectionFeedbackProps) {
  if (!result || result.findings.length === 0) return null;

  const primaryFinding = result.findings[0];
  const isError = result.decision === "rejected";
  const isRequiresConfig = result.decision === "requires-configuration";

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "absolute bottom-4 left-1/2 -translate-x-1/2 z-40 max-w-md w-[calc(100%-2rem)] p-3 rounded-md border shadow-level-2 select-none animate-in fade-in-0 slide-in-from-bottom-2 duration-150",
        isError
          ? "bg-surface-02 border-rose-900/50 text-foreground"
          : isRequiresConfig
            ? "bg-surface-02 border-amber-900/50 text-foreground"
            : "bg-surface-02 border-border-strong text-foreground",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-2 min-w-0">
          {isError ? (
            <AlertCircleIcon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" strokeWidth={1.5} />
          ) : (
            <AlertTriangleIcon className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" strokeWidth={1.5} />
          )}

          <div className="min-w-0">
            <h5 className="font-sans text-xs font-semibold text-foreground mb-0.5 truncate">
              {primaryFinding.title}
            </h5>
            <p className="font-sans text-xs text-text-secondary leading-relaxed">
              {primaryFinding.message}
            </p>

            {primaryFinding.documentationPath && (
              <div className="mt-2 pt-1 border-t border-border-subtle">
                <Link
                  href={primaryFinding.documentationPath}
                  target="_blank"
                  className="inline-flex items-center gap-1 font-mono text-[10px] text-text-muted hover:text-foreground transition-colors"
                >
                  <BookOpenIcon className="w-3 h-3" />
                  <span>Learn more in documentation</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors shrink-0"
          title="Dismiss notification"
        >
          <CloseIcon className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
