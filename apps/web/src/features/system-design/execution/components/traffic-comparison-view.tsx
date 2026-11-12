"use client";

import * as React from "react";
import {
  ActivityIcon,
  CloseIcon,
} from "@nxtqr/icons";
import { Button, Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";

export interface TrafficComparisonViewProps {
  onClose?: () => void;
}

export function TrafficComparisonView({ onClose }: TrafficComparisonViewProps) {
  const trafficComparison = useExecutionStore((s) => s.trafficComparison);
  const toggleTrafficComparison = useExecutionStore((s) => s.toggleTrafficComparison);

  if (!trafficComparison) {
    return null;
  }

  const {
    baselineSummary,
    testSummary,
    throughputDeltaRps,
    p95LatencyDeltaMs,
    failedRequestsDelta,
    queueDepthDelta,
    utilizationDeltaPercent,
    summary,
  } = trafficComparison;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="traffic-comparison-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-none p-4 select-none"
    >
      <div className="w-full max-w-3xl bg-surface-02 border border-border-default rounded-md shadow-level-2 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-surface-01 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-text-secondary" />
            <h3 id="traffic-comparison-title" className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
              Traffic Performance Comparison: Baseline vs Scaled Run
            </h3>
            <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-text-secondary">
              Delta Analysis
            </Badge>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleTrafficComparison(false))}
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
              Empirical System Finding
            </span>
            <p className="text-xs font-mono text-foreground leading-relaxed">
              {summary}
            </p>
          </div>

          {/* Key Delta KPI Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
            {/* Throughput Delta */}
            <div className="p-3 rounded-md bg-surface-01 border border-border-subtle">
              <span className="text-[10px] font-mono uppercase text-text-muted block">Throughput Delta</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={cn(
                  "text-lg font-mono font-bold",
                  throughputDeltaRps >= 0 ? "text-foreground" : "text-text-secondary"
                )}>
                  {throughputDeltaRps >= 0 ? `+${throughputDeltaRps}` : throughputDeltaRps}
                </span>
                <span className="text-[10px] font-mono text-text-muted">req/s</span>
              </div>
            </div>

            {/* P95 Latency Delta */}
            <div className="p-3 rounded-md bg-surface-01 border border-border-subtle">
              <span className="text-[10px] font-mono uppercase text-text-muted block">P95 Latency Delta</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={cn(
                  "text-lg font-mono font-bold",
                  p95LatencyDeltaMs <= 0 ? "text-foreground font-bold" : "text-text-secondary"
                )}>
                  {p95LatencyDeltaMs >= 0 ? `+${p95LatencyDeltaMs}` : p95LatencyDeltaMs}
                </span>
                <span className="text-[10px] font-mono text-text-muted">ms</span>
              </div>
            </div>

            {/* Queue Depth Delta */}
            <div className="p-3 rounded-md bg-surface-01 border border-border-subtle">
              <span className="text-[10px] font-mono uppercase text-text-muted block">Queue Depth Delta</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-mono font-bold text-foreground">
                  {queueDepthDelta >= 0 ? `+${queueDepthDelta}` : queueDepthDelta}
                </span>
                <span className="text-[10px] font-mono text-text-muted">queued</span>
              </div>
            </div>

            {/* Worker Utilization Delta */}
            <div className="p-3 rounded-md bg-surface-01 border border-border-subtle">
              <span className="text-[10px] font-mono uppercase text-text-muted block">Worker Utilization</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-lg font-mono font-bold text-foreground">
                  {utilizationDeltaPercent >= 0 ? `+${utilizationDeltaPercent}` : utilizationDeltaPercent}%
                </span>
              </div>
            </div>

            {/* Failures Delta */}
            <div className="p-3 rounded-md bg-surface-01 border border-border-subtle">
              <span className="text-[10px] font-mono uppercase text-text-muted block">Failures Delta</span>
              <div className="mt-1 flex items-baseline gap-1">
                <span className={cn(
                  "text-lg font-mono font-bold",
                  failedRequestsDelta <= 0 ? "text-foreground" : "text-text-secondary"
                )}>
                  {failedRequestsDelta >= 0 ? `+${failedRequestsDelta}` : failedRequestsDelta}
                </span>
                <span className="text-[10px] font-mono text-text-muted">drops</span>
              </div>
            </div>
          </div>

          {/* Side-by-Side Detailed Breakdown */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            {/* Baseline Column */}
            <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle">
                <span className="text-xs font-mono font-semibold text-foreground">
                  Baseline (Single Instance)
                </span>
                <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-text-muted">
                  Control
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Average Throughput:</span>
                  <span className="text-foreground">{baselineSummary.averageThroughputRps} req/s</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">P50 Latency:</span>
                  <span className="text-foreground">{baselineSummary.overallP50LatencyMs}ms</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">P95 Latency:</span>
                  <span className="text-foreground">{baselineSummary.overallP95LatencyMs}ms</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">P99 Latency:</span>
                  <span className="text-foreground">{baselineSummary.overallP99LatencyMs}ms</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Peak Queue Depth:</span>
                  <span className="text-foreground">{baselineSummary.peakQueueDepth}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Worker Occupancy:</span>
                  <span className="text-foreground">{baselineSummary.averageUtilizationPercent}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Failures / Drops:</span>
                  <span className="text-foreground">{baselineSummary.failedRequests}</span>
                </div>
              </div>
            </div>

            {/* Test Run Column */}
            <div className="p-3 rounded-md bg-surface-01 border border-border-default space-y-2">
              <div className="flex items-center justify-between pb-1.5 border-b border-border-subtle">
                <span className="text-xs font-mono font-semibold text-foreground">
                  Simulated Scenario
                </span>
                <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-foreground font-semibold">
                  Test Run
                </Badge>
              </div>

              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Average Throughput:</span>
                  <span className="text-foreground">{testSummary.averageThroughputRps} req/s</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">P50 Latency:</span>
                  <span className="text-foreground">{testSummary.overallP50LatencyMs}ms</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">P95 Latency:</span>
                  <span className="text-foreground">{testSummary.overallP95LatencyMs}ms</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">P99 Latency:</span>
                  <span className="text-foreground">{testSummary.overallP99LatencyMs}ms</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Peak Queue Depth:</span>
                  <span className="text-foreground">{testSummary.peakQueueDepth}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border-subtle">
                  <span className="text-text-muted">Worker Occupancy:</span>
                  <span className="text-foreground">{testSummary.averageUtilizationPercent}%</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-text-muted">Failures / Drops:</span>
                  <span className="text-foreground">{testSummary.failedRequests}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-surface-01 border-t border-border-subtle flex items-center justify-end shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleTrafficComparison(false))}
            className="h-8 text-xs font-mono border border-border-default hover:bg-surface-03"
          >
            Close Comparison
          </Button>
        </div>
      </div>
    </div>
  );
}
