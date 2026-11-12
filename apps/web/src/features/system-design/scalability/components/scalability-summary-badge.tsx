"use client";

import * as React from "react";
import { LayersIcon } from "@nxtqr/icons";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useScalabilityRecommendations } from "../hooks/use-scalability-recommendations";

export interface ScalabilitySummaryBadgeProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function ScalabilitySummaryBadge({
  className,
  isOpen,
  onToggle,
}: ScalabilitySummaryBadgeProps) {
  const { report, isEvaluating } = useScalabilityRecommendations();
  const applicableCount = report.summary.applicableCount;
  const conditionalCount = report.summary.conditionalCount;
  const totalRecommendations = report.summary.totalRecommendations;

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
      title="Toggle Scalability Recommendations & What-If Planner"
    >
      <LayersIcon className={cn("w-3.5 h-3.5", isEvaluating && "animate-pulse")} />
      <span className="hidden xl:inline">Scalability</span>

      <Badge
        variant="outline"
        className={cn(
          "text-[9px] font-mono h-4 px-1 rounded border-border-default",
          applicableCount > 0
            ? "text-sky-400 bg-sky-950/20 border-sky-900/60"
            : conditionalCount > 0
              ? "text-amber-400 bg-amber-950/20 border-amber-900/60"
              : totalRecommendations > 0
                ? "text-text-muted bg-surface-03"
                : "text-emerald-400 bg-emerald-950/20"
        )}
      >
        {applicableCount > 0
          ? `${applicableCount} Recs`
          : conditionalCount > 0
            ? `${conditionalCount} Cond`
            : "Optimized"}
      </Badge>
    </Button>
  );
}
