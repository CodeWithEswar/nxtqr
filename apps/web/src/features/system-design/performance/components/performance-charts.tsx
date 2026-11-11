"use client";

import * as React from "react";
import type { BenchmarkRun } from "@nxtqr/architecture-intelligence";
import { ActivityIcon, SlidersIcon, AlertTriangleIcon, CheckIcon } from "@nxtqr/icons";

export interface PerformanceChartsProps {
  run: BenchmarkRun;
}

export function PerformanceCharts({ run }: PerformanceChartsProps) {
  const sum = run.overallSummary;

  // Latency breakdown data
  const percentiles = [
    { label: "Min", val: sum.minLatencyMs, color: "#666666" },
    { label: "P50", val: sum.p50LatencyMs, color: "#B5B5B5" },
    { label: "P90", val: sum.p90LatencyMs, color: "#FFFFFF" },
    { label: "P95", val: sum.p95LatencyMs, color: "#FFAA00" },
    { label: "P99", val: sum.p99LatencyMs, color: "#FF4D4D" },
    { label: "Max", val: sum.maxLatencyMs, color: "#858585" },
  ];

  const maxPercentileVal = Math.max(10, ...percentiles.map((p) => p.val));

  return (
    <div className="flex flex-col gap-3 select-none text-xs">
      {/* 1. Metric Cards Header Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1">
          <div className="flex items-center justify-between text-[#858585]">
            <span className="font-mono text-[10px] uppercase">Achieved Throughput</span>
            <ActivityIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold text-white">
              {sum.achievedRps.toFixed(1)}
            </span>
            <span className="font-mono text-[11px] text-[#858585]">RPS</span>
          </div>
          <p className="font-mono text-[10px] text-[#666666]">
            Offered: {sum.offeredRps.toFixed(1)} RPS
          </p>
        </div>

        <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1">
          <div className="flex items-center justify-between text-[#858585]">
            <span className="font-mono text-[10px] uppercase">P95 Latency SLA</span>
            <SlidersIcon className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold text-white">
              {sum.p95LatencyMs.toFixed(1)}
            </span>
            <span className="font-mono text-[11px] text-[#858585]">ms</span>
          </div>
          <p className="font-mono text-[10px] text-[#666666]">
            P50: {sum.p50LatencyMs.toFixed(1)}ms | P99: {sum.p99LatencyMs.toFixed(1)}ms
          </p>
        </div>

        <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1">
          <div className="flex items-center justify-between text-[#858585]">
            <span className="font-mono text-[10px] uppercase">Error Rate</span>
            {sum.errorRatePct > 0.5 ? (
              <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <CheckIcon className="w-3.5 h-3.5 text-emerald-400" />
            )}
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold text-white">
              {sum.errorRatePct.toFixed(2)}
            </span>
            <span className="font-mono text-[11px] text-[#858585]">%</span>
          </div>
          <p className="font-mono text-[10px] text-[#666666]">
            {sum.failedRequests} of {sum.totalRequests.toLocaleString()} failed
          </p>
        </div>

        <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1">
          <div className="flex items-center justify-between text-[#858585]">
            <span className="font-mono text-[10px] uppercase">Data Quality Score</span>
            <span className="font-mono text-[10px] uppercase text-emerald-400">
              {run.dataQuality.status}
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-xl font-bold text-white">
              {run.dataQuality.qualityScore}
            </span>
            <span className="font-mono text-[11px] text-[#858585]">/ 100</span>
          </div>
          <p className="font-mono text-[10px] text-[#666666]">
            {run.dataQuality.hasWarmupBias ? "Warmup skew detected" : "Robust steady state"}
          </p>
        </div>
      </div>

      {/* 2. Latency Distribution Histogram Bars */}
      <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-3">
        <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
          <span className="font-mono text-[10px] uppercase tracking-wider text-[#858585]">
            Empirical Latency Percentile Distribution (ms)
          </span>
          <span className="font-mono text-[10px] text-[#666666]">
            Strict Histogram Math (No Percentile Averaging)
          </span>
        </div>

        <div className="space-y-2">
          {percentiles.map((pt) => {
            const barPct = Math.min(100, (pt.val / maxPercentileVal) * 100);
            return (
              <div key={pt.label} className="space-y-1">
                <div className="flex items-center justify-between font-mono text-[11px]">
                  <span className="text-[#858585] w-12">{pt.label}</span>
                  <div className="flex-1 mx-3 h-2 rounded bg-[#141414] overflow-hidden">
                    <div
                      className="h-full rounded bg-[#404040]"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span className="text-white font-medium w-16 text-right">
                    {pt.val.toFixed(1)} ms
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Dropped Iterations & Capacity Notice */}
      {sum.droppedIterations > 0 && (
        <div className="p-3 rounded-md bg-amber-950/20 border border-amber-900/40 text-amber-300 flex items-start gap-2.5">
          <AlertTriangleIcon className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
          <div className="space-y-0.5">
            <span className="font-medium text-xs">
              Open-Loop Dropped Iterations ({sum.droppedIterations} dropped / {sum.droppedIterationsPct.toFixed(1)}%)
            </span>
            <p className="text-[11px] text-amber-300/80 leading-relaxed">
              Target arrival rate exceeded generator concurrency ceiling or downstream processing capacity. Backpressure caused dropped arrivals.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
