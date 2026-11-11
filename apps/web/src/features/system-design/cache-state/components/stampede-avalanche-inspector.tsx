"use client";

/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Cache Stampede, Avalanche & Capacity Saturation Inspector
 */

import React from "react";
import type {
  DistributedStateTopology,
  CacheStampedeEvaluation,
  CacheCapacityEvaluation,
} from "@nxtqr/architecture-intelligence";
import {
  ActivityIcon,
  CheckCircleIcon,
} from "@nxtqr/icons";

export interface StampedeAvalancheInspectorProps {
  topology: DistributedStateTopology;
  stampedeEvaluations: CacheStampedeEvaluation[];
  capacityEvaluations: CacheCapacityEvaluation[];
  simulatedIncomingRps: number;
  onIncomingRpsChange: (rps: number) => void;
}

export function StampedeAvalancheInspector({
  topology,
  stampedeEvaluations,
  capacityEvaluations,
  simulatedIncomingRps,
  onIncomingRpsChange,
}: StampedeAvalancheInspectorProps) {
  const layerMap = new Map(topology.cacheLayers.map((l) => [l.id, l]));

  return (
    <div className="flex-1 flex flex-col bg-[#000000] text-[#FFFFFF] overflow-y-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#262626] pb-3">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-[#858585]" />
            Cache Stampede, Avalanche & Saturation Analysis
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Deterministic evaluations of dog-piling query surges, synchronized expiration cascades, and working-set memory exhaustion.
          </p>
        </div>

        {/* Interactive Query Spike Slider */}
        <div className="flex items-center gap-3 bg-[#080808] border border-[#262626] px-3 py-1.5 rounded-md">
          <span className="text-[11px] font-mono text-[#858585]">Simulated Surge:</span>
          <input
            type="range"
            min={500}
            max={25000}
            step={500}
            value={simulatedIncomingRps}
            onChange={(e) => onIncomingRpsChange(Number(e.target.value))}
            className="w-28 accent-[#FFFFFF] cursor-pointer"
          />
          <span className="text-xs font-mono text-[#FFFFFF] w-16 text-right">
            {simulatedIncomingRps.toLocaleString()} RPS
          </span>
        </div>
      </div>

      {/* Stampede & Avalanche Evaluations by Layer */}
      <div className="space-y-4">
        {stampedeEvaluations.map((evalItem) => {
          const layer = layerMap.get(evalItem.layerId);
          const capEval = capacityEvaluations.find((c) => c.layerId === evalItem.layerId);
          if (!layer) return null;

          return (
            <div
              key={evalItem.layerId}
              className={`p-4 rounded-md border bg-[#080808] space-y-4 ${
                evalItem.isStampedeRisk ? "border-[#404040]" : "border-[#262626]"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#FFFFFF] font-mono">
                      {layer.name}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-[#141414] text-[#858585] border border-[#262626]">
                      Tier {layer.tierOrder} • {layer.technology}
                    </span>
                  </div>
                  <p className="text-xs text-[#858585] font-mono mt-0.5">{evalItem.explanation}</p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono text-[#858585] block">
                    Peak Load Multiplier
                  </span>
                  <span
                    className={`text-lg font-bold font-mono ${
                      evalItem.isStampedeRisk ? "text-[#FFFFFF]" : "text-[#B5B5B5]"
                    }`}
                  >
                    {evalItem.peakBackendLoadMultiplier.toFixed(1)}x
                  </span>
                </div>
              </div>

              {/* Defense Metric Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs font-mono">
                {/* Single-Flight Coalescing */}
                <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-between">
                  <span className="text-[#858585]">Single-Flight Coalesce</span>
                  {layer.requestCoalescingEnabled ? (
                    <span className="text-[#FFFFFF] flex items-center gap-1">
                      <CheckCircleIcon className="w-3.5 h-3.5 text-[#B5B5B5]" />
                      Active
                    </span>
                  ) : (
                    <span className="text-[#FFFFFF] bg-[#1A1A1A] px-1.5 py-0.5 rounded-md border border-[#404040]">
                      Stampede Hazard
                    </span>
                  )}
                </div>

                {/* Avalanche Jitter */}
                <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-between">
                  <span className="text-[#858585]">TTL Avalanche Jitter</span>
                  {layer.ttlConfig.jitterPercentage >= 10 ? (
                    <span className="text-[#FFFFFF]">{layer.ttlConfig.jitterPercentage}% Randomized</span>
                  ) : (
                    <span className="text-[#FFFFFF] bg-[#1A1A1A] px-1.5 py-0.5 rounded-md border border-[#404040]">
                      {layer.ttlConfig.jitterPercentage}% (Synchronized)
                    </span>
                  )}
                </div>

                {/* Penetration Guard */}
                <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-between">
                  <span className="text-[#858585]">Negative Caching</span>
                  {layer.negativeCachingEnabled ? (
                    <span className="text-[#FFFFFF]">Protected ({layer.negativeCacheTtlSeconds ?? 60}s)</span>
                  ) : (
                    <span className="text-[#FFFFFF] bg-[#1A1A1A] px-1.5 py-0.5 rounded-md border border-[#404040]">
                      Penetration Risk
                    </span>
                  )}
                </div>
              </div>

              {/* Working-Set Capacity & Saturation Gauge */}
              {capEval && (
                <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#858585]">Working-Set Memory Saturation</span>
                    <span className="text-[#FFFFFF]">
                      {capEval.projectedWorkingSetMb} MB / {capEval.allocatedMemoryMb} MB (
                      {(capEval.saturationRatio * 100).toFixed(0)}%)
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#141414] rounded-md h-2 border border-[#262626] overflow-hidden">
                    <div
                      className={`h-full rounded-md transition-all ${
                        capEval.isCapacityExhausted ? "bg-[#FFFFFF]" : "bg-[#858585]"
                      }`}
                      style={{ width: `${Math.min(capEval.saturationRatio * 100, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-mono text-[#858585]">
                    <span>Policy: {layer.evictionPolicy.toUpperCase()}</span>
                    <span>
                      Status:{" "}
                      {capEval.isCapacityExhausted ? (
                        <strong className="text-[#FFFFFF]">
                          {layer.evictionPolicy === "no_eviction"
                            ? "CRITICAL: OOM Rejection Risk"
                            : "Eviction Thrashing Risk"}
                        </strong>
                      ) : (
                        "Within Capacity Limits"
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
