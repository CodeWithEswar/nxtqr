"use client";

import * as React from "react";
import { CheckCircleIcon, AlertCircleIcon, AlertTriangleIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import { useArchitectureValidation } from "../hooks/use-architecture-validation";

export interface ValidationSummaryBadgeProps {
  isOpen: boolean;
  onToggle: () => void;
  className?: string;
}

export function ValidationSummaryBadge({
  isOpen,
  onToggle,
  className,
}: ValidationSummaryBadgeProps) {
  const { summary } = useArchitectureValidation();

  const hasErrors = summary.errors > 0;
  const hasWarnings = summary.warnings > 0;

  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "h-7 px-2 font-mono text-[11px] rounded-md flex items-center gap-1.5 border transition-all duration-150 select-none shadow-level-1 cursor-pointer",
        isOpen
          ? "bg-surface-04 border-border-strong text-foreground shadow-level-3 font-semibold"
          : "bg-surface-02 border-border-default text-text-muted hover:text-foreground hover:bg-surface-03",
        className,
      )}
      title="Toggle Architecture Validation Panel"
    >
      {hasErrors ? (
        <AlertCircleIcon className="w-3.5 h-3.5 text-rose-500 shrink-0" strokeWidth={1.5} />
      ) : hasWarnings ? (
        <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-500 shrink-0" strokeWidth={1.5} />
      ) : (
        <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" strokeWidth={1.5} />
      )}

      <span className="hidden xl:inline">Validation</span>

      {(hasErrors || hasWarnings) && (
        <span
          className={cn(
            "ml-0.5 px-1 rounded text-[9px] font-bold font-mono",
            hasErrors ? "bg-rose-950/60 text-rose-400" : "bg-amber-950/60 text-amber-400",
          )}
        >
          {hasErrors ? summary.errors : summary.warnings}
        </span>
      )}
    </button>
  );
}
