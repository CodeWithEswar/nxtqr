"use client";

import * as React from "react";
import { ShieldIcon } from "@nxtqr/icons";
import { Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";

export interface FaultInspectorProps {
  selectedNodeId?: string | null;
}

export function FaultInspector({ selectedNodeId }: FaultInspectorProps) {
  const playbackState = useExecutionStore((s) => s.playbackState);
  const activeFailureScenario = useExecutionStore((s) => s.activeFailureScenario);
  const runtimeState = playbackState.currentFrame?.runtimeState;

  if (!activeFailureScenario) {
    return (
      <div className="p-3 text-center text-xs font-mono text-text-muted">
        No active failure scenario. Select a Resilience Preset to simulate faults.
      </div>
    );
  }

  const componentHealth = runtimeState?.componentHealth || {};
  const circuitBreakers = runtimeState?.circuitBreakers || {};
  const activeFaultIds = runtimeState?.activeFaultIds || [];

  const targetHealth = selectedNodeId ? componentHealth[selectedNodeId] || "healthy" : "healthy";
  const targetCb = selectedNodeId ? circuitBreakers[selectedNodeId] : undefined;

  return (
    <div className="space-y-3 p-3 bg-surface-01 border border-border-default rounded-md select-none">
      {/* Scenario Header */}
      <div className="flex items-center justify-between pb-2 border-b border-border-subtle">
        <div className="flex items-center gap-1.5">
          <ShieldIcon className="w-3.5 h-3.5 text-text-secondary" />
          <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
            Resilience State
          </span>
        </div>
        <Badge variant="outline" className="text-[9px] font-mono border-border-default text-text-secondary">
          {activeFailureScenario.name}
        </Badge>
      </div>

      {/* Target Node Health Status */}
      {selectedNodeId && (
        <div className="p-2 bg-surface-02 border border-border-default rounded-md space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono text-text-muted uppercase">Selected Target Health</span>
            <span
              className={cn(
                "px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-bold",
                targetHealth === "unavailable"
                  ? "bg-red-950 text-red-300 border border-red-800"
                  : targetHealth === "degraded"
                  ? "bg-amber-950 text-amber-300 border border-amber-800"
                  : "bg-emerald-950 text-emerald-300 border border-emerald-800"
              )}
            >
              {targetHealth}
            </span>
          </div>

          {targetCb && (
            <div className="pt-1.5 border-t border-border-subtle flex items-center justify-between text-[10px] font-mono">
              <span className="text-text-muted">Circuit Breaker:</span>
              <span
                className={cn(
                  "font-bold uppercase",
                  targetCb.state === "open"
                    ? "text-red-400"
                    : targetCb.state === "half-open"
                    ? "text-amber-400"
                    : "text-emerald-400"
                )}
              >
                [{targetCb.state.toUpperCase()}] Trips: {targetCb.tripCount}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Active Injected Faults */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase text-text-muted font-semibold tracking-wider block">
          Injected Faults ({activeFailureScenario.faults.length})
        </span>

        <div className="space-y-1">
          {activeFailureScenario.faults.map((fault) => {
            const isCurrentlyActive = activeFaultIds.includes(fault.id);
            return (
              <div
                key={fault.id}
                className={cn(
                  "p-2 rounded border text-xs font-mono transition-colors flex items-center justify-between",
                  isCurrentlyActive
                    ? "bg-surface-03 border-border-strong text-foreground"
                    : "bg-surface-02/60 border-border-subtle text-text-muted"
                )}
              >
                <div className="space-y-0.5">
                  <div className="font-medium text-[11px]">{fault.name}</div>
                  <div className="text-[9px] text-text-muted">
                    Target: {fault.target.targetLabel || fault.target.targetId} ({fault.type})
                  </div>
                </div>

                <Badge
                  variant="outline"
                  className={cn(
                    "text-[8px] font-mono",
                    isCurrentlyActive
                      ? "border-amber-700 text-amber-300 bg-amber-950/40"
                      : "border-border-default text-text-disabled"
                  )}
                >
                  {isCurrentlyActive ? "ACTIVE" : "STANDBY"}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
