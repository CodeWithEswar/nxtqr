"use client";

import * as React from "react";
import { ShieldIcon } from "@nxtqr/icons";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useSecurityAnalysis } from "../hooks/use-security-analysis";

export interface SecuritySummaryBadgeProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function SecuritySummaryBadge({
  className,
  isOpen,
  onToggle,
}: SecuritySummaryBadgeProps) {
  const { report, isAnalyzing } = useSecurityAnalysis();
  const criticalCount = report.summary.criticalCount;
  const highCount = report.summary.highCount;
  const totalFindings = report.summary.totalFindings;

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
      title="Toggle Security Architecture Analysis Panel"
    >
      <ShieldIcon className={cn("w-3.5 h-3.5", isAnalyzing && "animate-pulse")} />
      <span className="hidden sm:inline">Security</span>

      <Badge
        variant="outline"
        className={cn(
          "text-[9px] font-mono h-4 px-1 rounded border-border-default",
          criticalCount > 0
            ? "text-rose-400 bg-rose-950/20 border-rose-900/60"
            : highCount > 0
              ? "text-amber-400 bg-amber-950/20 border-amber-900/60"
              : totalFindings > 0
                ? "text-text-muted bg-surface-03"
                : "text-emerald-400 bg-emerald-950/20"
        )}
      >
        {criticalCount > 0
          ? `${criticalCount} Crit`
          : highCount > 0
            ? `${highCount} High`
            : totalFindings > 0
              ? `${totalFindings} Items`
              : "Clean"}
      </Badge>
    </Button>
  );
}
