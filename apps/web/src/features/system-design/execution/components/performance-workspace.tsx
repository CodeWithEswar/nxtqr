"use client";

import * as React from "react";
import {
  ActivityIcon,
  CpuIcon,
  CloseIcon,
  RefreshIcon,
} from "@nxtqr/icons";
import { Button, Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";
import type { PerformanceSample, PerformanceSummary } from "@nxtqr/architecture-execution";

export interface PerformanceWorkspaceProps {
  onClose?: () => void;
}

export function PerformanceWorkspace({ onClose }: PerformanceWorkspaceProps) {
  const isTrafficWorkspaceOpen = useExecutionStore((s) => s.isTrafficWorkspaceOpen);
  const toggleTrafficWorkspace = useExecutionStore((s) => s.toggleTrafficWorkspace);
  const toggleTrafficScenarioDialog = useExecutionStore((s) => s.toggleTrafficScenarioDialog);
  const toggleTrafficComparison = useExecutionStore((s) => s.toggleTrafficComparison);
  const activeTrafficScenario = useExecutionStore((s) => s.activeTrafficScenario);
  const trace = useExecutionStore((s) => s.trace);
  const playbackState = useExecutionStore((s) => s.playbackState);

  if (!isTrafficWorkspaceOpen) {
    return null;
  }

  const currentFrame = playbackState.currentFrame;
  const currentSample: PerformanceSample | undefined =
    currentFrame?.runtimeState?.trafficCurrentSample ||
    (trace?.performanceSamples && trace.performanceSamples.length > 0
      ? trace.performanceSamples[trace.performanceSamples.length - 1]
      : undefined);

  const summary: PerformanceSummary | undefined =
    trace?.performanceSummary ||
    currentFrame?.runtimeState?.trafficSummary;

  const samples: PerformanceSample[] = trace?.performanceSamples || [];

  const sampleUtils = currentSample ? Object.values(currentSample.componentUtilizations) : [];
  const currentAvgUtil =
    sampleUtils.length > 0
      ? Math.round(sampleUtils.reduce((a, b) => a + b, 0) / sampleUtils.length)
      : summary?.averageUtilizationPercent || 0;

  return (
    <div
      role="region"
      aria-label="Performance & Live Traffic Workspace"
      className="fixed bottom-0 left-0 right-0 z-40 bg-surface-01 border-t border-border-default shadow-level-3 flex flex-col max-h-[460px] h-[460px] select-none transition-transform"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-02 border-b border-border-subtle shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-1 rounded-md bg-surface-03 border border-border-default text-text-secondary">
            <ActivityIcon className="w-3.5 h-3.5" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
                Performance Workspace · Live Traffic & Capacity Modeling
              </span>
              <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-text-secondary">
                {activeTrafficScenario ? activeTrafficScenario.name : "Deterministic Virtual Engine"}
              </Badge>
              {summary && summary.bottlenecks.length > 0 && (
                <Badge variant="outline" className="text-[9px] font-mono border-border-strong text-text-secondary">
                  {summary.bottlenecks.length} Saturated
                </Badge>
              )}
            </div>
            <div className="text-[10px] font-mono text-text-muted">
              {activeTrafficScenario?.mode === "closed_loop"
                ? `Closed-loop virtual users (${activeTrafficScenario.virtualUsers?.userCount || 50} users, ${activeTrafficScenario.virtualUsers?.thinkTimeMs || 500}ms think time)`
                : `Open-loop traffic (${activeTrafficScenario?.workload.type || "constant"} profile)`}
              {" · "}
              Virtual Clock: {currentFrame ? `${currentFrame.virtualTimeMs}ms` : "0ms"} / {activeTrafficScenario ? `${activeTrafficScenario.durationMs}ms` : "0ms"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleTrafficComparison(true)}
            className="h-7 text-[11px] font-mono border border-border-default hover:bg-surface-03 text-text-secondary hover:text-foreground"
          >
            Compare Baseline
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleTrafficScenarioDialog(true)}
            className="h-7 text-[11px] font-mono border border-border-default hover:bg-surface-03 text-text-secondary hover:text-foreground"
          >
            <RefreshIcon className="w-3 h-3 mr-1.5" />
            Configure Scenario
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleTrafficWorkspace(false))}
            className="h-7 w-7 p-0 text-text-muted hover:text-foreground rounded-md"
            title="Close Performance Workspace"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-12 gap-3 bg-surface-01">
        {/* KPI Row: 12 Cols */}
        <div className="col-span-12 grid grid-cols-2 md:grid-cols-6 gap-2">
          {/* Card 1: Incoming vs Completed RPS */}
          <div className="p-2.5 rounded-md bg-surface-02 border border-border-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-text-muted font-medium">Throughput</span>
            <div className="mt-1">
              <span className="text-lg font-mono font-bold text-foreground">
                {currentSample ? currentSample.completedRps : 0}
              </span>
              <span className="text-[10px] font-mono text-text-muted ml-1">req/s</span>
            </div>
            <div className="text-[10px] font-mono text-text-muted mt-1 flex justify-between">
              <span>Arrival: {currentSample ? currentSample.incomingRps : 0}</span>
              <span>Peak: {summary ? summary.peakThroughputRps : 0}</span>
            </div>
          </div>

          {/* Card 2: Latency P95 */}
          <div className="p-2.5 rounded-md bg-surface-02 border border-border-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-text-muted font-medium">P95 Latency</span>
            <div className="mt-1">
              <span className="text-lg font-mono font-bold text-foreground">
                {currentSample ? currentSample.p95LatencyMs : summary ? summary.overallP95LatencyMs : 0}
              </span>
              <span className="text-[10px] font-mono text-text-muted ml-1">ms</span>
            </div>
            <div className="text-[10px] font-mono text-text-muted mt-1 flex justify-between">
              <span>P50: {currentSample ? currentSample.p50LatencyMs : 0}ms</span>
              <span>P99: {currentSample ? currentSample.p99LatencyMs : 0}ms</span>
            </div>
          </div>

          {/* Card 3: Worker Utilization */}
          <div className="p-2.5 rounded-md bg-surface-02 border border-border-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-text-muted font-medium">Utilization Demand</span>
            <div className="mt-1">
              <span className="text-lg font-mono font-bold text-foreground">
                {currentAvgUtil}%
              </span>
            </div>
            <div className="text-[10px] font-mono text-text-muted mt-1 flex justify-between">
              <span>Avg: {summary ? summary.averageUtilizationPercent : 0}%</span>
              <span>Status: {currentAvgUtil >= 85 ? "Saturated" : "Optimal"}</span>
            </div>
          </div>

          {/* Card 4: Queue Depth */}
          <div className="p-2.5 rounded-md bg-surface-02 border border-border-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-text-muted font-medium">Queue Depth</span>
            <div className="mt-1">
              <span className="text-lg font-mono font-bold text-foreground">
                {currentSample ? currentSample.totalQueueDepth : 0}
              </span>
              <span className="text-[10px] font-mono text-text-muted ml-1">queued</span>
            </div>
            <div className="text-[10px] font-mono text-text-muted mt-1 flex justify-between">
              <span>Peak: {summary ? summary.peakQueueDepth : 0}</span>
              <span>Rejected: {summary ? summary.rejectedRequests : 0}</span>
            </div>
          </div>

          {/* Card 5: In-Flight Concurrency */}
          <div className="p-2.5 rounded-md bg-surface-02 border border-border-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-text-muted font-medium">In-Flight Requests</span>
            <div className="mt-1">
              <span className="text-lg font-mono font-bold text-foreground">
                {currentSample ? currentSample.activeInFlight : 0}
              </span>
              <span className="text-[10px] font-mono text-text-muted ml-1">active</span>
            </div>
            <div className="text-[10px] font-mono text-text-muted mt-1 flex justify-between">
              <span>Success: {summary ? summary.successfulRequests : 0}</span>
              <span>Total: {summary ? summary.totalRequests : 0}</span>
            </div>
          </div>

          {/* Card 6: Autoscaling Events */}
          <div className="p-2.5 rounded-md bg-surface-02 border border-border-subtle flex flex-col justify-between">
            <span className="text-[10px] font-mono uppercase text-text-muted font-medium">Scale Actions</span>
            <div className="mt-1">
              <span className="text-lg font-mono font-bold text-foreground">
                {summary ? summary.scalingEventsCount : 0}
              </span>
              <span className="text-[10px] font-mono text-text-muted ml-1">actions</span>
            </div>
            <div className="text-[10px] font-mono text-text-muted mt-1">
              <span>Instances: {Object.values(currentSample?.componentInstanceCounts || {}).reduce((a, b) => a + b, 0)}</span>
            </div>
          </div>
        </div>

        {/* Charts & Breakdown: 8 Cols Left (Charts), 4 Cols Right (Bottlenecks & Instances) */}
        <div className="col-span-12 lg:col-span-8 space-y-3">
          {/* Chart 1: Real-Time Throughput */}
          <div className="p-3 rounded-md bg-surface-02 border border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ActivityIcon className="w-3.5 h-3.5 text-text-secondary" />
                <span className="text-xs font-mono font-medium text-foreground">
                  Throughput Dynamics (Arrival vs Completed RPS)
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-foreground inline-block" /> Completed
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-0.5 bg-text-muted border-b border-dashed border-text-muted inline-block" /> Arrival
                </span>
              </div>
            </div>

            {/* SVG Throughput Chart */}
            <div className="w-full h-24">
              <ThroughputSvgChart samples={samples} currentVirtualTimeMs={currentFrame?.virtualTimeMs || 0} />
            </div>
          </div>

          {/* Chart 2: Latency Percentile Bands */}
          <div className="p-3 rounded-md bg-surface-02 border border-border-subtle">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CpuIcon className="w-3.5 h-3.5 text-text-secondary" />
                <span className="text-xs font-mono font-medium text-foreground">
                  Latency Percentile Distribution (P50, P90, P95, P99)
                </span>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted">
                <span>P50: {currentSample?.p50LatencyMs || 0}ms</span>
                <span>P95: {currentSample?.p95LatencyMs || 0}ms</span>
                <span>P99: {currentSample?.p99LatencyMs || 0}ms</span>
              </div>
            </div>

            {/* SVG Latency Chart */}
            <div className="w-full h-24">
              <LatencySvgChart samples={samples} currentVirtualTimeMs={currentFrame?.virtualTimeMs || 0} />
            </div>
          </div>
        </div>

        {/* Right Panel: Bottlenecks & Worker Allocations */}
        <div className="col-span-12 lg:col-span-4 space-y-3">
          {/* Bottleneck Evidence Panel */}
          <div className="p-3 rounded-md bg-surface-02 border border-border-subtle h-full flex flex-col">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-border-subtle">
              <div className="flex items-center gap-1.5">
                <ActivityIcon className="w-3.5 h-3.5 text-text-secondary" />
                <span className="text-xs font-mono font-semibold text-foreground">
                  Bottlenecks & Empirical Evidence
                </span>
              </div>
              <span className="text-[10px] font-mono text-text-muted">
                {summary ? `${summary.bottlenecks.length} Detected` : "0"}
              </span>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {summary && summary.bottlenecks.length > 0 ? (
                summary.bottlenecks.map((b, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-md bg-surface-03 border border-border-default space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-semibold text-foreground">
                        {b.nodeLabel}
                      </span>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-mono uppercase px-1.5 py-0 border-border-strong",
                          b.severity === "critical" ? "text-foreground font-bold" : "text-text-secondary"
                        )}
                      >
                        {b.severity}
                      </Badge>
                    </div>

                    <p className="text-[11px] font-mono text-text-secondary leading-snug">
                      {b.reason}
                    </p>

                    <div className="grid grid-cols-3 gap-1 pt-1 text-[9px] font-mono text-text-muted border-t border-border-subtle">
                      <div>Util: <span className="text-text-secondary font-semibold">{b.utilizationPercent}%</span></div>
                      <div>Queue: <span className="text-text-secondary font-semibold">{b.queueDepth}</span></div>
                      <div>Wait: <span className="text-text-secondary font-semibold">{b.waitingTimeMs}ms</span></div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-32 flex flex-col items-center justify-center text-center p-3 text-text-muted space-y-1">
                  <span className="text-xs font-mono font-semibold text-foreground">
                    No Bottlenecks Detected
                  </span>
                  <span className="text-[10px] font-mono leading-relaxed">
                    Worker concurrency and queue depths are operating well within modeled service limits.
                  </span>
                </div>
              )}
            </div>

            {/* Component Occupancy breakdown */}
            {currentSample && Object.keys(currentSample.componentUtilizations).length > 0 && (
              <div className="pt-2 border-t border-border-subtle space-y-1.5 mt-2">
                <span className="text-[10px] font-mono uppercase text-text-muted font-semibold block">
                  Component Worker Occupancy
                </span>
                <div className="space-y-1">
                  {Object.entries(currentSample.componentUtilizations).map(([nodeId, util]) => (
                    <div key={nodeId} className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-text-secondary truncate max-w-[140px]">{nodeId}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-surface-04 rounded-md overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-md",
                              util >= 85 ? "bg-foreground" : "bg-text-secondary"
                            )}
                            style={{ width: `${Math.min(100, util)}%` }}
                          />
                        </div>
                        <span className="text-text-muted w-8 text-right">{util}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------------
// SVG Charts Helper Components
// ----------------------------------------------------------------------------

function ThroughputSvgChart({
  samples,
  currentVirtualTimeMs,
}: {
  samples: PerformanceSample[];
  currentVirtualTimeMs: number;
}) {
  if (samples.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted text-[11px] font-mono">
        Waiting for simulation workload samples...
      </div>
    );
  }

  const width = 600;
  const height = 90;
  const padTop = 10;
  const padBottom = 16;
  const padLeft = 8;
  const padRight = 8;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const maxVal = Math.max(10, ...samples.map((s) => Math.max(s.incomingRps, s.completedRps, s.failedRps)));

  const completedPoints = samples.map((s, idx) => {
    const x = padLeft + (idx / Math.max(1, samples.length - 1)) * innerW;
    const y = padTop + innerH - (s.completedRps / maxVal) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const incomingPoints = samples.map((s, idx) => {
    const x = padLeft + (idx / Math.max(1, samples.length - 1)) * innerW;
    const y = padTop + innerH - (s.incomingRps / maxVal) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  // Calculate cursor x
  const maxTime = Math.max(1, samples[samples.length - 1].atMs);
  const cursorX = padLeft + Math.min(1, Math.max(0, currentVirtualTimeMs / maxTime)) * innerW;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible select-none">
      {/* Grid Lines */}
      <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} stroke="#1A1A1A" strokeWidth="1" />
      <line x1={padLeft} y1={padTop + innerH / 2} x2={width - padRight} y2={padTop + innerH / 2} stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" />
      <line x1={padLeft} y1={padTop + innerH} x2={width - padRight} y2={padTop + innerH} stroke="#262626" strokeWidth="1" />

      {/* Incoming RPS Line (dashed) */}
      <polyline
        fill="none"
        stroke="#858585"
        strokeWidth="1.5"
        strokeDasharray="4 3"
        points={incomingPoints.join(" ")}
      />

      {/* Completed RPS Line (solid) */}
      <polyline
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        points={completedPoints.join(" ")}
      />

      {/* Playhead Vertical Cursor */}
      <line
        x1={cursorX}
        y1={padTop}
        x2={cursorX}
        y2={padTop + innerH}
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
    </svg>
  );
}

function LatencySvgChart({
  samples,
  currentVirtualTimeMs,
}: {
  samples: PerformanceSample[];
  currentVirtualTimeMs: number;
}) {
  if (samples.length === 0) {
    return (
      <div className="h-full flex items-center justify-center text-text-muted text-[11px] font-mono">
        Waiting for latency samples...
      </div>
    );
  }

  const width = 600;
  const height = 90;
  const padTop = 10;
  const padBottom = 16;
  const padLeft = 8;
  const padRight = 8;

  const innerW = width - padLeft - padRight;
  const innerH = height - padTop - padBottom;

  const maxVal = Math.max(20, ...samples.map((s) => Math.max(s.p99LatencyMs, s.p95LatencyMs, s.p50LatencyMs)));

  const p95Points = samples.map((s, idx) => {
    const x = padLeft + (idx / Math.max(1, samples.length - 1)) * innerW;
    const y = padTop + innerH - (s.p95LatencyMs / maxVal) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const p50Points = samples.map((s, idx) => {
    const x = padLeft + (idx / Math.max(1, samples.length - 1)) * innerW;
    const y = padTop + innerH - (s.p50LatencyMs / maxVal) * innerH;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const maxTime = Math.max(1, samples[samples.length - 1].atMs);
  const cursorX = padLeft + Math.min(1, Math.max(0, currentVirtualTimeMs / maxTime)) * innerW;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible select-none">
      <line x1={padLeft} y1={padTop} x2={width - padRight} y2={padTop} stroke="#1A1A1A" strokeWidth="1" />
      <line x1={padLeft} y1={padTop + innerH / 2} x2={width - padRight} y2={padTop + innerH / 2} stroke="#1A1A1A" strokeWidth="1" strokeDasharray="3 3" />
      <line x1={padLeft} y1={padTop + innerH} x2={width - padRight} y2={padTop + innerH} stroke="#262626" strokeWidth="1" />

      {/* P95 Latency Line */}
      <polyline
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="1.5"
        points={p95Points.join(" ")}
      />

      {/* P50 Latency Line */}
      <polyline
        fill="none"
        stroke="#858585"
        strokeWidth="1.5"
        strokeDasharray="3 2"
        points={p50Points.join(" ")}
      />

      {/* Playhead Cursor */}
      <line
        x1={cursorX}
        y1={padTop}
        x2={cursorX}
        y2={padTop + innerH}
        stroke="#FFFFFF"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
    </svg>
  );
}
