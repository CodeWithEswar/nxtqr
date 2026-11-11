"use client";

import * as React from "react";
import type { ScenarioComparisonPoint } from "@nxtqr/architecture-intelligence";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { CheckIcon } from "@nxtqr/icons";

export interface ScenarioComparisonViewProps {
  comparisonMatrix: ScenarioComparisonPoint[];
  activeScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  className?: string;
}

export function ScenarioComparisonView({
  comparisonMatrix,
  activeScenarioId,
  onSelectScenario,
  className,
}: ScenarioComparisonViewProps) {
  if (!comparisonMatrix || comparisonMatrix.length === 0) {
    return (
      <div className="p-4 text-center font-mono text-xs text-text-muted bg-surface-02 border border-border-default rounded-md">
        No comparison scenarios available.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 select-none", className)}>
      <div className="flex items-center justify-between text-xs font-mono text-text-muted pb-1 border-b border-border-subtle">
        <span>Growth Scenario Comparison Matrix</span>
        <span>Side-by-Side Tradeoffs</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {comparisonMatrix.map((point) => {
          const isActive = point.scenarioId === activeScenarioId;
          const hasSaturation = point.saturatedComponentsCount > 0;

          return (
            <div
              key={point.scenarioId}
              className={cn(
                "p-3.5 rounded-md border text-left transition-all relative flex flex-col justify-between",
                isActive
                  ? "bg-surface-03 border-border-strong shadow-level-3"
                  : "bg-surface-02 hover:bg-surface-03 border-border-default hover:border-border-hover"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold text-foreground block">
                      {point.scenarioName}
                    </span>
                    <span className="font-mono text-[10px] text-text-muted">
                      ID: {point.scenarioId}
                    </span>
                  </div>

                  {isActive ? (
                    <Badge variant="outline" className="text-[10px] bg-surface-04 text-foreground border-border-strong">
                      <CheckIcon size={10} className="mr-1" /> Active
                    </Badge>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onSelectScenario(point.scenarioId)}
                      className="h-6 text-[10px] font-mono px-2 bg-surface-01 hover:bg-surface-04 border border-border-subtle rounded-md text-text-secondary hover:text-foreground"
                    >
                      Select
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 font-mono text-xs pt-2 border-t border-border-subtle mb-3">
                  <div>
                    <span className="text-text-muted block text-[10px]">Peak Demand at Horizon</span>
                    <span className="font-bold text-foreground">
                      {point.finalDemandRps.toLocaleString()} RPS
                    </span>
                  </div>

                  <div>
                    <span className="text-text-muted block text-[10px]">Earliest Saturation</span>
                    <span className={cn(
                      "font-bold",
                      hasSaturation ? "text-rose-400" : "text-emerald-400"
                    )}>
                      {point.earliestSaturationLabel}
                    </span>
                  </div>

                  <div>
                    <span className="text-text-muted block text-[10px]">Saturated Components</span>
                    <span className={cn(
                      "font-semibold",
                      hasSaturation ? "text-rose-400" : "text-text-secondary"
                    )}>
                      {point.saturatedComponentsCount}
                    </span>
                  </div>

                  <div>
                    <span className="text-text-muted block text-[10px]">Instance Additions</span>
                    <span className="font-semibold text-text-secondary">
                      +{point.totalRecommendedInstances} replicas
                    </span>
                  </div>
                </div>
              </div>

              {/* Status footer pill */}
              <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[10px] font-mono text-text-muted">
                <span>Scaling Requirement:</span>
                <span className="text-text-secondary font-medium">
                  {point.totalRecommendedInstances > 0 ? `+${point.totalRecommendedInstances} instances needed` : "Current capacity sufficient"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
