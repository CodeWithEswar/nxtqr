"use client";

import * as React from "react";
import { ActivityIcon } from "@nxtqr/icons";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useArchitectureHealth } from "../hooks/use-architecture-health";

export interface HealthSummaryBadgeProps {
  className?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function HealthSummaryBadge({
  className,
  isOpen,
  onToggle,
}: HealthSummaryBadgeProps) {
  const { report, isAssessing } = useArchitectureHealth();
  const score = report.overallScore;
  const grade = report.overallGrade;

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
      title="Toggle Architecture Health Analysis Panel"
    >
      <ActivityIcon className={cn("w-3.5 h-3.5", isAssessing && "animate-pulse")} />
      <span className="hidden sm:inline">Health</span>

      <Badge
        variant="outline"
        className={cn(
          "text-[9px] font-mono h-4 px-1 rounded border-border-default",
          score !== null && score >= 80
            ? "text-emerald-400 bg-emerald-950/20"
            : score !== null && score >= 60
              ? "text-amber-400 bg-amber-950/20"
              : score !== null
                ? "text-rose-400 bg-rose-950/20"
                : "text-text-disabled bg-surface-01"
        )}
      >
        {score !== null ? `${grade} · ${score}` : "N/A"}
      </Badge>
    </Button>
  );
}

