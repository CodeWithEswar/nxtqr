"use client";

import React from "react";
import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  ServiceHealthIndicator,
  ObservedVsModeledComparison,
} from "@nxtqr/architecture-intelligence";
import { MetricCharts } from "./metric-charts";
import {
  CheckIcon,
  AlertTriangleIcon,
  AlertCircleIcon,
  HelpCircleIcon,
  ActivityIcon,
  CpuIcon,
  CalendarIcon,
  ShieldIcon,
} from "@nxtqr/icons";

export interface ServiceHealthInspectorProps {
  selectedNode?: BaseNode;
  health?: ServiceHealthIndicator;
  comparison?: ObservedVsModeledComparison;
  className?: string;
}

export function ServiceHealthInspector({
  selectedNode,
  health,
  comparison,
  className = "",
}: ServiceHealthInspectorProps) {
  if (!selectedNode) {
    return (
      <div className={`p-6 text-center text-[#858585] text-xs font-mono bg-[#080808] border border-[#262626] rounded-md ${className}`}>
        Select an architecture component in the diagram to inspect real-time observability telemetry.
      </div>
    );
  }

  const label = (selectedNode.data?.label as string) || selectedNode.id;
  const state = health?.state || "unknown";
  const freshness = health?.freshnessStatus || "missing";

  const getStateBadge = () => {
    switch (state) {
      case "healthy":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono uppercase bg-emerald-950/40 border border-emerald-900/40 text-emerald-400 font-semibold">
            <CheckIcon className="w-3.5 h-3.5" />
            Healthy
          </span>
        );
      case "degraded":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono uppercase bg-amber-950/40 border border-amber-900/40 text-amber-400 font-semibold">
            <AlertTriangleIcon className="w-3.5 h-3.5" />
            Degraded
          </span>
        );
      case "critical":
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono uppercase bg-red-950/40 border border-red-900/40 text-red-400 font-semibold">
            <AlertCircleIcon className="w-3.5 h-3.5" />
            Critical
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono uppercase bg-[#141414] border border-[#262626] text-[#858585] font-semibold">
            <HelpCircleIcon className="w-3.5 h-3.5" />
            Unknown
          </span>
        );
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#080808] text-white text-xs select-none overflow-y-auto p-3 space-y-4 ${className}`}>
      {/* 1. Header Card */}
      <div className="p-3 bg-[#0D0D0D] border border-[#262626] rounded-md">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="font-bold text-sm text-white">{label}</h3>
            <div className="text-[11px] font-mono text-[#858585]">
              nodeId: <span className="text-[#B5B5B5]">{selectedNode.id}</span> | type:{" "}
              <span className="text-[#B5B5B5]">{selectedNode.type}</span>
            </div>
          </div>
          {getStateBadge()}
        </div>

        <div className="flex items-center justify-between text-[11px] font-mono pt-2 border-t border-[#1A1A1A]">
          <span className="text-[#858585]">Data Freshness:</span>
          <span
            className={
              freshness === "fresh"
                ? "text-emerald-400"
                : freshness === "stale"
                ? "text-amber-400"
                : "text-red-400"
            }
          >
            {freshness.toUpperCase()}
            {health?.latestSampleTimestampMs
              ? ` (${Math.round((Date.now() - health.latestSampleTimestampMs) / 1000)}s ago)`
              : " (No stream)"}
          </span>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2.5 bg-[#0D0D0D] border border-[#262626] rounded-md">
          <div className="text-[10px] font-mono text-[#858585] flex items-center gap-1 mb-1">
            <ActivityIcon className="w-3 h-3 text-white" />
            Throughput (RPS)
          </div>
          <div className="text-base font-bold font-mono text-white">
            {health?.metrics.rps !== undefined ? `${health.metrics.rps} req/s` : "—"}
          </div>
        </div>

        <div className="p-2.5 bg-[#0D0D0D] border border-[#262626] rounded-md">
          <div className="text-[10px] font-mono text-[#858585] flex items-center gap-1 mb-1">
            <CalendarIcon className="w-3 h-3 text-amber-400" />
            Latency (P95)
          </div>
          <div className="text-base font-bold font-mono text-white">
            {health?.metrics.p95LatencyMs !== undefined
              ? `${health.metrics.p95LatencyMs} ms`
              : "—"}
          </div>
        </div>

        <div className="p-2.5 bg-[#0D0D0D] border border-[#262626] rounded-md">
          <div className="text-[10px] font-mono text-[#858585] flex items-center gap-1 mb-1">
            <AlertCircleIcon className="w-3 h-3 text-red-400" />
            Error Rate
          </div>
          <div
            className={`text-base font-bold font-mono ${
              (health?.metrics.errorRatePct || 0) >= 5 ? "text-red-400" : "text-white"
            }`}
          >
            {health?.metrics.errorRatePct !== undefined
              ? `${health.metrics.errorRatePct.toFixed(2)}%`
              : "—"}
          </div>
        </div>

        <div className="p-2.5 bg-[#0D0D0D] border border-[#262626] rounded-md">
          <div className="text-[10px] font-mono text-[#858585] flex items-center gap-1 mb-1">
            <CpuIcon className="w-3 h-3 text-blue-400" />
            CPU Saturation
          </div>
          <div
            className={`text-base font-bold font-mono ${
              (health?.metrics.cpuSaturationPct || 0) >= 80 ? "text-amber-400" : "text-white"
            }`}
          >
            {health?.metrics.cpuSaturationPct !== undefined
              ? `${health.metrics.cpuSaturationPct}%`
              : "—"}
          </div>
        </div>
      </div>

      {/* 3. Real-Time Telemetry Sparkline Charts */}
      <MetricCharts health={health} componentLabel={label} />

      {/* 4. Active Diagnostic Reasons / Issues */}
      {health && health.reasons.length > 0 && (
        <div className="p-3 bg-[#0D0D0D] border border-[#262626] rounded-md">
          <h4 className="font-semibold text-xs text-white mb-2 flex items-center gap-1.5">
            <ShieldIcon className="w-3.5 h-3.5 text-white" />
            Health Evaluation Evidence
          </h4>
          <ul className="space-y-1.5 text-[11px] text-[#B5B5B5]">
            {health.reasons.map((r, i) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-[#666666] mt-0.5">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 5. Observed vs Modeled Calibration Delta */}
      {comparison && (
        <div className="p-3 bg-[#0D0D0D] border border-[#262626] rounded-md space-y-2">
          <h4 className="font-semibold text-xs text-white flex items-center justify-between">
            <span>Observed vs Modeled Delta</span>
            <span className="text-[10px] font-mono text-[#858585]">Model Calibration</span>
          </h4>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
            <div className="p-2 bg-[#141414] rounded-md">
              <div className="text-[#858585] text-[10px]">Throughput Delta</div>
              <div className="text-white font-bold">
                {comparison.observedRps ?? "—"} vs {comparison.modeledRps ?? "—"} RPS
              </div>
              {comparison.rpsDeltaPct !== undefined && (
                <div
                  className={`text-[10px] ${
                    Math.abs(comparison.rpsDeltaPct) > 25 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {comparison.rpsDeltaPct > 0 ? "+" : ""}
                  {comparison.rpsDeltaPct}% divergence
                </div>
              )}
            </div>

            <div className="p-2 bg-[#141414] rounded-md">
              <div className="text-[#858585] text-[10px]">Latency P95 Delta</div>
              <div className="text-white font-bold">
                {comparison.observedLatencyP95Ms ?? "—"} vs {comparison.modeledLatencyP95Ms ?? "—"} ms
              </div>
              {comparison.latencyDeltaPct !== undefined && (
                <div
                  className={`text-[10px] ${
                    Math.abs(comparison.latencyDeltaPct) > 25 ? "text-amber-400" : "text-emerald-400"
                  }`}
                >
                  {comparison.latencyDeltaPct > 0 ? "+" : ""}
                  {comparison.latencyDeltaPct}% divergence
                </div>
              )}
            </div>
          </div>

          {comparison.calibrationSuggestions.length > 0 && (
            <div className="pt-2 border-t border-[#1A1A1A] text-[11px] text-amber-400">
              {comparison.calibrationSuggestions.map((s, i) => (
                <div key={i} className="flex items-start gap-1">
                  <span>↳</span>
                  <span>{s}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
