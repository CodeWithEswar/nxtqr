"use client";

import * as React from "react";
import { ShieldIcon } from "@nxtqr/icons";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useFailureAnalysis } from "../hooks/use-failure-analysis";

export interface FailureSummaryBadgeProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function FailureSummaryBadge({
  className,
  isOpen,
  onToggle,
}: FailureSummaryBadgeProps) {
  const { report, isAnalyzing } = useFailureAnalysis();
  const spofCount = report.metrics.spofCount;
  const sharedCount = report.metrics.sharedDependencyRisksCount;

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={onToggle}
      className={cn(
        "h-7 px-2 text-[11px] font-mono rounded-md gap-1.5 border transition-colors shadow-level-1",
        isOpen
          ? "bg-surface-04 border-border-strong text-foreground shadow-level-3 font-semibold"
          : "bg-surface-02 border-border-default text-text-muted hover:text-foreground hover:bg-surface-03",
        className
      )}
      title="Toggle Single Point of Failure (SPOF) Analysis Panel"
    >
      <ShieldIcon className={cn("w-3.5 h-3.5", isAnalyzing && "animate-pulse")} />
      <span className="hidden xl:inline">Resiliency</span>

      <Badge
        variant="outline"
        className={cn(
          "text-[9px] font-mono h-4 px-1 rounded border-border-default",
          spofCount > 0
            ? "text-rose-400 bg-rose-950/20 border-rose-900/60"
            : sharedCount > 0
              ? "text-amber-400 bg-amber-950/20 border-amber-900/60"
              : "text-emerald-400 bg-emerald-950/20"
        )}
      >
        {spofCount > 0 ? `${spofCount} SPOF` : sharedCount > 0 ? `${sharedCount} Shared` : "0 SPOF"}
      </Badge>
    </Button>
  );
}

