"use client";

import * as React from "react";
import type {
  CapacityPlanningFinding,
  ComponentCapacityEvaluation,
} from "@nxtqr/architecture-intelligence";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { ActivityIcon, SlidersIcon } from "@nxtqr/icons";

export interface SaturationTimelineProps {
  findings: CapacityPlanningFinding[];
  componentEvaluations: Record<string, ComponentCapacityEvaluation>;
  onSelectNode?: (nodeId: string) => void;
  onWhatIfScale?: (nodeId: string, recommendedInstances: number) => void;
  className?: string;
}

export function SaturationTimeline({
  findings,
  componentEvaluations,
  onSelectNode,
  onWhatIfScale,
  className,
}: SaturationTimelineProps) {
  // Group findings by forecast interval index
  const intervalGroups = React.useMemo(() => {
    const map = new Map<number, { label: string; items: CapacityPlanningFinding[] }>();

    findings.forEach((finding) => {
      const idx = finding.forecastIntervalIndex;
      if (!map.has(idx)) {
        map.set(idx, { label: finding.forecastIntervalLabel, items: [] });
      }
      map.get(idx)!.items.push(finding);
    });

    return Array.from(map.entries()).sort(([a], [b]) => a - b);
  }, [findings]);

  if (findings.length === 0) {
    return (
      <div className="p-5 text-center font-mono text-xs text-text-muted bg-surface-02 border border-border-default rounded-md">
        <div className="w-8 h-8 mx-auto mb-2 rounded-md bg-surface-03 flex items-center justify-center text-emerald-400">
          <ActivityIcon size={16} />
        </div>
        All components maintain sufficient headroom throughout the projected forecast horizon.
      </div>
    );
  }

  return (
    <div className={cn("space-y-3 select-none", className)}>
      <div className="flex items-center justify-between text-xs font-mono text-text-muted pb-1 border-b border-border-subtle">
        <span>Saturation Milestones ({findings.length} components)</span>
        <span>Order of Exhaustion</span>
      </div>

      <div className="space-y-4">
        {intervalGroups.map(([intervalIndex, group]) => (
          <div key={intervalIndex} className="relative pl-6 before:content-[''] before:absolute before:left-2 before:top-3 before:bottom-0 before:w-px before:bg-border-default">
            {/* Interval Marker */}
            <div className="absolute left-0 top-1 w-4 h-4 rounded-md bg-surface-04 border border-border-strong flex items-center justify-center text-[9px] font-mono font-bold text-text-secondary">
              {intervalIndex === 0 ? "0" : intervalIndex}
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-foreground">
                  {group.label}
                </span>
                <Badge variant="outline" className="text-[10px] bg-surface-02 text-text-muted border-border-default">
                  {group.items.length} {group.items.length === 1 ? "component" : "components"}
                </Badge>
              </div>

              {group.items.map((finding) => {
                const evalItem = componentEvaluations[finding.affectedNodeId];
                const recInstances = evalItem?.recommendedInstancesCount;
                const curInstances = evalItem?.instancesCount || 1;

                return (
                  <div
                    key={finding.id}
                    className="p-3 bg-surface-02 hover:bg-surface-03 border border-border-default hover:border-border-hover rounded-md transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div
                        className="cursor-pointer flex-1"
                        onClick={() => onSelectNode?.(finding.affectedNodeId)}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {finding.title}
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] uppercase font-mono tracking-wider",
                              finding.severity === "critical"
                                ? "bg-rose-950/20 text-rose-400 border-rose-900/50"
                                : "bg-amber-950/20 text-amber-400 border-amber-900/50"
                            )}
                          >
                            {finding.severity}
                          </Badge>
                        </div>
                        <p className="text-xs text-text-muted leading-relaxed">
                          {finding.explanation}
                        </p>
                      </div>

                      {recInstances && recInstances > curInstances && onWhatIfScale && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onWhatIfScale(finding.affectedNodeId, recInstances)}
                          className="h-7 text-xs font-mono bg-surface-03 hover:bg-surface-04 border-border-default hover:border-border-strong text-text-secondary hover:text-foreground shrink-0 rounded-md"
                        >
                          <SlidersIcon size={12} className="mr-1.5" />
                          Scale ({curInstances} → {recInstances})
                        </Button>
                      )}
                    </div>

                    {evalItem && (
                      <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center justify-between font-mono text-[11px] text-text-muted">
                        <span>
                          Demand at Saturation: <strong className="text-foreground">{Math.round(evalItem.currentDemandRps)} RPS</strong>
                        </span>
                        <span>
                          Declared Capacity: <strong className="text-text-secondary">{evalItem.declaredCapacityRps || "—"} RPS</strong>
                        </span>
                        <span>
                          Horizon Utilization:{" "}
                          <strong className={cn(
                            (evalItem.utilizationAtHorizonRatio || 0) >= 1.0 ? "text-rose-400" : "text-amber-400"
                          )}>
                            {Math.round((evalItem.utilizationAtHorizonRatio || 0) * 100)}%
                          </strong>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
