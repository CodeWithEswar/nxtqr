"use client";

import * as React from "react";
import {
  CloseIcon,
  ShieldIcon,
} from "@nxtqr/icons";
import { Button, Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";

export interface ScenarioComparisonViewProps {
  onClose?: () => void;
}

export function ScenarioComparisonView({ onClose }: ScenarioComparisonViewProps) {
  const scenarioComparison = useExecutionStore((s) => s.scenarioComparison);
  const toggleScenarioComparison = useExecutionStore((s) => s.toggleScenarioComparison);

  if (!scenarioComparison) {
    return null;
  }

  const {
    baselineMetrics,
    failureMetrics,
    availabilityDiffPercent,
    latencyDiffMs,
    additionalFailuresCount,
    additionalRetriesCount,
    divergentSpans,
    summary,
  } = scenarioComparison;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="scenario-comparison-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-none p-4 select-none"
    >
      <div className="w-full max-w-3xl bg-surface-02 border border-border-default rounded-md shadow-level-2 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-01 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <ShieldIcon className="w-4 h-4 text-text-secondary" />
            <h3 id="scenario-comparison-title" className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
              Resilience Comparison: Baseline vs Injected Fault Run
            </h3>
            <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-text-secondary">
              Delta Analysis
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleScenarioComparison(false))}
            className="h-6 w-6 p-0 text-text-muted hover:text-foreground rounded"
            title="Close"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Content Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1">
          {/* Executive Summary */}
          <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-1.5">
            <span className="text-[10px] font-mono uppercase text-text-muted font-semibold tracking-wider block">
              Resilience Assessment Summary
            </span>
            <p className="text-xs text-foreground font-sans leading-relaxed">
              {summary}
            </p>
          </div>

          {/* Metric Comparison Cards */}
          <div className="grid grid-cols-4 gap-2">
            <div className="p-3 bg-surface-01 border border-border-default rounded-md space-y-1">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                Availability
              </span>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-sm font-semibold text-foreground">
                  {failureMetrics.availabilityPercent}%
                </span>
                <span className="text-[10px] text-text-muted">
                  (Base: {baselineMetrics.availabilityPercent}%)
                </span>
              </div>
              <div className="flex items-center justify-between text-[10px] font-mono">
                <span className={cn("font-semibold", availabilityDiffPercent < 0 ? "text-amber-400" : "text-emerald-400")}>
                  {availabilityDiffPercent >= 0 ? "+0%" : `${availabilityDiffPercent}%`}
                </span>
                {additionalFailuresCount > 0 && (
                  <span className="text-red-400">+{additionalFailuresCount} failed</span>
                )}
              </div>
            </div>

            <div className="p-3 bg-surface-01 border border-border-default rounded-md space-y-1">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                Latency Delta
              </span>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-sm font-semibold text-foreground">
                  +{Math.max(0, latencyDiffMs)}ms
                </span>
              </div>
              <div className="text-[10px] font-mono text-text-muted">
                Critical path expansion
              </div>
            </div>

            <div className="p-3 bg-surface-01 border border-border-default rounded-md space-y-1">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                Retries Triggered
              </span>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-sm font-semibold text-foreground">
                  {failureMetrics.retryAttempts}
                </span>
                <span className="text-[10px] text-text-muted">
                  (+{additionalRetriesCount})
                </span>
              </div>
              <div className="text-[10px] font-mono text-text-secondary">
                Exponential backoff
              </div>
            </div>

            <div className="p-3 bg-surface-01 border border-border-default rounded-md space-y-1">
              <span className="text-[10px] font-mono text-text-muted uppercase tracking-wider block">
                Circuit Trips / Failover
              </span>
              <div className="flex items-baseline gap-1.5 font-mono">
                <span className="text-sm font-semibold text-foreground">
                  {failureMetrics.circuitTrips + failureMetrics.failoverAttempts}
                </span>
              </div>
              <div className="text-[10px] font-mono text-text-secondary">
                {failureMetrics.failoverAttempts > 0 ? "Rerouted to standby" : "Breaker enforced"}
              </div>
            </div>
          </div>

          {/* Divergent Spans Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-foreground">
                Divergent Execution Spans ({divergentSpans.length})
              </span>
              <span className="text-[10px] font-mono text-text-muted">
                Operations impacted by faults
              </span>
            </div>

            <div className="border border-border-default rounded-md overflow-hidden bg-surface-01">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-surface-02 border-b border-border-subtle text-[10px] text-text-muted uppercase">
                  <tr>
                    <th className="p-2">Component</th>
                    <th className="p-2">Operation</th>
                    <th className="p-2">Base Latency</th>
                    <th className="p-2">Fault Latency</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Divergence Explanation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-subtle text-[11px]">
                  {divergentSpans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-3 text-center text-text-muted font-sans">
                        No divergent spans detected. The system absorbed all faults identically to baseline.
                      </td>
                    </tr>
                  ) : (
                    divergentSpans.map((span) => (
                      <tr key={span.spanId} className="hover:bg-surface-03/50 transition-colors">
                        <td className="p-2 font-medium text-foreground">{span.componentId}</td>
                        <td className="p-2 text-text-secondary">{span.name}</td>
                        <td className="p-2 text-text-muted">{span.baselineDurationMs}ms</td>
                        <td className="p-2 text-foreground font-semibold">{span.failureDurationMs}ms</td>
                        <td className="p-2">
                          <span
                            className={cn(
                              "px-1.5 py-0.5 rounded text-[9px] font-mono uppercase font-semibold",
                              span.failureStatus === "error"
                                ? "bg-red-950 text-red-300 border border-red-800"
                                : "bg-surface-03 text-foreground border border-border-strong"
                            )}
                          >
                            {span.failureStatus}
                          </span>
                        </td>
                        <td className="p-2 text-text-secondary text-[10px]">{span.divergenceReason}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-4 py-3 bg-surface-01 border-t border-border-subtle shrink-0">
          <Button
            variant="default"
            size="sm"
            onClick={onClose || (() => toggleScenarioComparison(false))}
            className="h-7 px-3 text-xs font-mono rounded-md bg-foreground text-background hover:bg-neutral-200"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
