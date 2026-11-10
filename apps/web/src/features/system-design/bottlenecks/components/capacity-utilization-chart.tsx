"use client";

import * as React from "react";
import { Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import type { NodeUtilization } from "@nxtqr/architecture-intelligence";

export interface CapacityUtilizationChartProps {
  utilizations: Record<string, NodeUtilization>;
  onSelectNode?: (nodeId: string) => void;
  selectedNodeId?: string | null;
}

export function CapacityUtilizationChart({
  utilizations,
  onSelectNode,
  selectedNodeId,
}: CapacityUtilizationChartProps) {
  const items = React.useMemo(() => {
    return Object.values(utilizations).sort((a, b) => {
      const ratioA = a.utilizationRatio ?? 0;
      const ratioB = b.utilizationRatio ?? 0;
      return ratioB - ratioA; // highest utilization first
    });
  }, [utilizations]);

  if (items.length === 0) {
    return (
      <div className="p-4 text-center font-mono text-xs text-text-muted bg-surface-02 border border-border-default rounded-md">
        No component utilization metrics available for the current topology.
      </div>
    );
  }

  return (
    <div className="space-y-2 select-none">
      {items.map((item) => {
        const ratio = item.utilizationRatio ?? 0;
        const percentage = Math.round(ratio * 100);
        const barWidth = Math.min(100, Math.max(2, percentage));
        const isSelected = selectedNodeId === item.nodeId;

        const isExceeding = ratio > 1.0;
        const isNearSat = ratio >= 0.9 && ratio <= 1.0;
        const isApproaching = ratio >= 0.7 && ratio < 0.9;

        const barColor = isExceeding
          ? "bg-rose-500"
          : isNearSat
            ? "bg-amber-500"
            : isApproaching
              ? "bg-amber-400/80"
              : "bg-emerald-500/80";

        const badgeClass = isExceeding
          ? "border-rose-900/60 text-rose-400 bg-rose-950/20"
          : isNearSat
            ? "border-amber-900/60 text-amber-400 bg-amber-950/20"
            : isApproaching
              ? "border-amber-900/40 text-amber-300 bg-amber-950/10"
              : "border-border-default text-emerald-400 bg-emerald-950/20";

        return (
          <div
            key={item.nodeId}
            role="button"
            tabIndex={0}
            onClick={() => onSelectNode?.(item.nodeId)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelectNode?.(item.nodeId);
              }
            }}
            className={cn(
              "p-2 rounded-md border text-left transition-colors cursor-pointer space-y-1.5",
              isSelected
                ? "border-border-strong bg-surface-03 shadow-level-2"
                : "border-border-default bg-surface-02 hover:border-border-hover hover:bg-surface-03"
            )}
          >
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-semibold text-foreground truncate max-w-[160px]">
                {item.nodeId}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="text-[10px] text-text-muted">
                  {item.demandRps.toLocaleString()} / {item.declaredCapacityRps?.toLocaleString() ?? "—"} req/s
                </span>
                <Badge variant="outline" className={cn("text-[9px] font-mono h-4 px-1 rounded uppercase", badgeClass)}>
                  {ratio ? `${percentage}%` : "N/A"}
                </Badge>
              </div>
            </div>

            {/* Utilization Bar */}
            <div className="h-2 w-full rounded-full bg-surface-01 border border-border-subtle overflow-hidden relative">
              <div
                className={cn("h-full transition-all duration-300 rounded-full", barColor)}
                style={{ width: `${barWidth}%` }}
              />
            </div>

            {/* Concurrency & Bandwidth details */}
            <div className="flex items-center justify-between font-mono text-[9px] text-text-disabled">
              <span>Concurrency: {item.concurrencyDemand ?? 0} active</span>
              <span>Bandwidth: {item.bandwidthDemandMbps ?? 0} Mbps</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

