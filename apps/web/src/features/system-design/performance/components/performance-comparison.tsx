"use client";

import * as React from "react";
import type {
  BenchmarkComparisonResult,
  BenchmarkRun,
  ModelCalibrationProposal,
} from "@nxtqr/architecture-intelligence";
import { AlertTriangleIcon, LayersIcon } from "@nxtqr/icons";

export interface PerformanceComparisonProps {
  runs: BenchmarkRun[];
  baselineRun: BenchmarkRun;
  candidateRun: BenchmarkRun;
  comparisonResult?: BenchmarkComparisonResult;
  calibrationProposals: ModelCalibrationProposal[];
  onSelectBaseline: (runId: string) => void;
  onSelectCandidate: (runId: string) => void;
}

export function PerformanceComparison({
  runs,
  baselineRun,
  candidateRun,
  comparisonResult,
  calibrationProposals,
  onSelectBaseline,
  onSelectCandidate,
}: PerformanceComparisonProps) {
  const baseSum = baselineRun.overallSummary;
  const candSum = candidateRun.overallSummary;

  const metrics = [
    { name: "P95 Latency", base: `${baseSum.p95LatencyMs.toFixed(1)} ms`, cand: `${candSum.p95LatencyMs.toFixed(1)} ms`, delta: candSum.p95LatencyMs - baseSum.p95LatencyMs, unit: "ms", isLatency: true },
    { name: "P99 Latency (Tail)", base: `${baseSum.p99LatencyMs.toFixed(1)} ms`, cand: `${candSum.p99LatencyMs.toFixed(1)} ms`, delta: candSum.p99LatencyMs - baseSum.p99LatencyMs, unit: "ms", isLatency: true },
    { name: "P50 Latency (Median)", base: `${baseSum.p50LatencyMs.toFixed(1)} ms`, cand: `${candSum.p50LatencyMs.toFixed(1)} ms`, delta: candSum.p50LatencyMs - baseSum.p50LatencyMs, unit: "ms", isLatency: true },
    { name: "Achieved Throughput", base: `${baseSum.achievedRps.toFixed(1)} RPS`, cand: `${candSum.achievedRps.toFixed(1)} RPS`, delta: candSum.achievedRps - baseSum.achievedRps, unit: "RPS", isThroughput: true },
    { name: "Error Rate", base: `${baseSum.errorRatePct.toFixed(2)} %`, cand: `${candSum.errorRatePct.toFixed(2)} %`, delta: candSum.errorRatePct - baseSum.errorRatePct, unit: "%", isError: true },
  ];

  return (
    <div className="flex flex-col gap-3 select-none text-xs">
      {/* 1. Selector Bar */}
      <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#262626] flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-1">
          <span className="font-mono text-[10px] text-[#858585] uppercase w-20">Baseline Run:</span>
          <select
            value={baselineRun.id}
            onChange={(e) => onSelectBaseline(e.target.value)}
            className="flex-1 bg-[#141414] border border-[#262626] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#404040]"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                Run #{r.runNumber} ({r.overallSummary.achievedRps.toFixed(0)} RPS, P95: {r.overallSummary.p95LatencyMs.toFixed(0)}ms)
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1">
          <span className="font-mono text-[10px] text-[#858585] uppercase w-24">Candidate Run:</span>
          <select
            value={candidateRun.id}
            onChange={(e) => onSelectCandidate(e.target.value)}
            className="flex-1 bg-[#141414] border border-[#262626] rounded-md px-2 py-1 text-xs text-white focus:outline-none focus:border-[#404040]"
          >
            {runs.map((r) => (
              <option key={r.id} value={r.id}>
                Run #{r.runNumber} ({r.overallSummary.achievedRps.toFixed(0)} RPS, P95: {r.overallSummary.p95LatencyMs.toFixed(0)}ms)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Side-by-Side Comparison Table */}
      <div className="rounded-md bg-[#0D0D0D] border border-[#202020] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#202020] bg-[#141414] font-mono text-[10px] uppercase text-[#858585]">
              <th className="p-2.5">Performance Metric</th>
              <th className="p-2.5 text-center">Baseline (Run #{baselineRun.runNumber})</th>
              <th className="p-2.5 text-center">Candidate (Run #{candidateRun.runNumber})</th>
              <th className="p-2.5 text-right">Delta</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1A1A1A] font-mono text-xs">
            {metrics.map((m) => {
              const isWorse = m.isLatency ? m.delta > 10 : m.isError ? m.delta > 0.1 : m.delta < -10;
              const isBetter = m.isLatency ? m.delta < -10 : m.isError ? m.delta < -0.1 : m.delta > 10;
              const deltaPrefix = m.delta > 0 ? "+" : "";

              return (
                <tr key={m.name} className="hover:bg-[#141414]/50 transition-colors">
                  <td className="p-2.5 text-white font-medium">{m.name}</td>
                  <td className="p-2.5 text-center text-[#B5B5B5]">{m.base}</td>
                  <td className="p-2.5 text-center text-white font-medium">{m.cand}</td>
                  <td className="p-2.5 text-right">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded-md text-[11px] font-mono ${
                        isWorse
                          ? "bg-red-950/40 text-red-400 border border-red-900/40"
                          : isBetter
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-900/40"
                          : "text-[#858585]"
                      }`}
                    >
                      {deltaPrefix}{m.delta.toFixed(1)} {m.unit}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 3. Detected Regressions */}
      {comparisonResult && comparisonResult.regressions.length > 0 && (
        <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
          <div className="flex items-center gap-2">
            <AlertTriangleIcon className="w-4 h-4 text-red-400" />
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Statistically Detected Regressions ({comparisonResult.regressions.length})
            </span>
          </div>

          <div className="space-y-1.5">
            {comparisonResult.regressions.map((reg, i) => (
              <div
                key={i}
                className="p-2.5 rounded-md bg-[#141414] border border-[#262626] flex items-start justify-between gap-3"
              >
                <div className="space-y-0.5 flex-1">
                  <span className="font-medium text-white">{reg.metric.toUpperCase().replace(/_/g, " ")}</span>
                  <p className="text-[11px] text-[#B5B5B5]">{reg.explanation}</p>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-md font-mono text-[10px] uppercase border ${
                    reg.severity === "critical"
                      ? "bg-red-950/50 text-red-400 border-red-900"
                      : "bg-amber-950/50 text-amber-400 border-amber-900"
                  }`}
                >
                  {reg.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Model Calibration Proposals */}
      {calibrationProposals.length > 0 && (
        <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-white" />
            <span className="font-mono text-xs font-bold text-white uppercase tracking-wider">
              Architecture Model Calibration Proposals ({calibrationProposals.length})
            </span>
          </div>

          <p className="text-[11px] text-[#858585]">
            Empirical benchmark measurements diverge from modeled architecture assumptions. Apply calibrations to align capacity planning and simulation engines with reality.
          </p>

          <div className="space-y-2">
            {calibrationProposals.map((cp, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-md bg-[#141414] border border-[#262626] space-y-1"
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-white">{cp.componentLabel}</span>
                  <span className="font-mono text-[10px] text-[#858585]">
                    Param: <code>{cp.parameterName}</code>
                  </span>
                </div>
                <div className="flex items-center gap-3 font-mono text-[10px]">
                  <span className="text-[#858585]">Modeled: {cp.modeledValue}</span>
                  <span>&rarr;</span>
                  <span className="text-[#858585]">Measured: {cp.measuredValue}</span>
                  <span>&rarr;</span>
                  <span className="text-emerald-400 font-bold">
                    Calibrate: {cp.recommendedCalibration}
                  </span>
                </div>
                <p className="text-[10px] text-[#666666]">{cp.justification}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
