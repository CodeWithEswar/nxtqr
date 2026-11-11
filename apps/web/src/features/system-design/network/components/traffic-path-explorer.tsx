"use client";

/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Traffic Path Traversal & Latency Budget Explorer
 */

import React from "react";
import type {
  NetworkPath,
  TrafficScenario,
  NetworkFinding,
} from "@nxtqr/architecture-intelligence";
import {
  ActivityIcon,
  AlertTriangleIcon,
  LockIcon,
  ChevronRightIcon,
} from "@nxtqr/icons";

export interface TrafficPathExplorerProps {
  paths: NetworkPath[];
  scenarios: TrafficScenario[];
  selectedPath: NetworkPath | null;
  findings: NetworkFinding[];
  onSelectPath: (pathId: string) => void;
}

export function TrafficPathExplorer({
  paths,
  scenarios,
  selectedPath,
  findings: _findings,
  onSelectPath,
}: TrafficPathExplorerProps) {
  if (!selectedPath && paths.length > 0) {
    selectedPath = paths[0];
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#262626]">
        <div>
          <h2 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-[#858585]" />
            Traffic Path Traversal & Latency Budgets
          </h2>
          <p className="text-xs text-[#858585] mt-0.5">
            Trace hop-by-hop packet traversal from public clients to backends, calculating latency budgets and TLS boundaries.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {paths.map((p) => {
            const sc = scenarios.find((s) => `path-${s.id}` === p.id || s.id === p.id);
            const isSelected = selectedPath?.id === p.id;

            return (
              <button
                key={p.id}
                onClick={() => onSelectPath(p.id)}
                className={`px-2.5 py-1 text-xs rounded-md font-mono transition-colors border ${
                  isSelected
                    ? "bg-[#1A1A1A] text-[#FFFFFF] border-[#404040]"
                    : "bg-[#0D0D0D] text-[#858585] border-[#262626] hover:text-[#B5B5B5]"
                }`}
              >
                {sc?.name || p.id} ({p.totalModeledLatencyMs}ms)
              </button>
            );
          })}
        </div>
      </div>

      {selectedPath ? (
        <div className="space-y-6">
          {/* Path KPI Overview Card */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-3 bg-[#080808] border border-[#262626] rounded-md space-y-1">
              <span className="text-[10px] text-[#858585] font-mono uppercase">
                Modeled Round-Trip Latency
              </span>
              <div className="text-xl font-bold font-mono text-[#FFFFFF]">
                {selectedPath.totalModeledLatencyMs}ms
              </div>
            </div>
            <div className="p-3 bg-[#080808] border border-[#262626] rounded-md space-y-1">
              <span className="text-[10px] text-[#858585] font-mono uppercase">
                Hop Count
              </span>
              <div className="text-xl font-bold font-mono text-[#FFFFFF]">
                {selectedPath.hops.length} Hops
              </div>
            </div>
            <div className="p-3 bg-[#080808] border border-[#262626] rounded-md space-y-1">
              <span className="text-[10px] text-[#858585] font-mono uppercase">
                Plaintext Exposure
              </span>
              <div
                className={`text-sm font-bold font-mono mt-1 ${
                  selectedPath.hasPlaintextHop ? "text-[#FF4D4D]" : "text-[#4ADE80]"
                }`}
              >
                {selectedPath.hasPlaintextHop ? "Plaintext Detected" : "Fully Encrypted"}
              </div>
            </div>
            <div className="p-3 bg-[#080808] border border-[#262626] rounded-md space-y-1">
              <span className="text-[10px] text-[#858585] font-mono uppercase">
                Reachability Status
              </span>
              <div
                className={`text-sm font-bold font-mono mt-1 ${
                  selectedPath.isReachable ? "text-[#4ADE80]" : "text-[#FF4D4D]"
                }`}
              >
                {selectedPath.isReachable ? "Target Reachable" : "Unreachable"}
              </div>
            </div>
          </div>

          {/* Unreachable Reason Alert if applicable */}
          {!selectedPath.isReachable && selectedPath.unreachableReason && (
            <div className="p-3 bg-[#1A0A0A] border border-[#551A1A] rounded-md text-xs text-[#FF4D4D] flex items-center gap-2 font-mono">
              <AlertTriangleIcon className="w-4 h-4 shrink-0" />
              <span>Routing Broken: {selectedPath.unreachableReason}</span>
            </div>
          )}

          {/* Cross Region Penalty Alert */}
          {selectedPath.hasCrossRegionHop && (
            <div className="p-3 bg-[#1A1408] border border-[#553300] rounded-md text-xs text-[#FFAA00] flex items-center gap-2">
              <AlertTriangleIcon className="w-4 h-4 shrink-0" />
              <span>
                Cross-region network transit detected (+65ms latency penalty). Requests cross continent/ocean boundaries to reach upstream backends.
              </span>
            </div>
          )}

          {/* Hop Timeline View */}
          <div className="bg-[#080808] border border-[#262626] rounded-md p-4 space-y-4">
            <h3 className="text-xs font-semibold text-[#B5B5B5] uppercase tracking-wider font-mono">
              Hop-by-Hop Network Traversal Timeline
            </h3>

            <div className="space-y-3">
              {selectedPath.hops.map((hop, idx) => {
                const isLast = idx === selectedPath!.hops.length - 1;

                return (
                  <div key={hop.hopIndex} className="relative flex items-start gap-4">
                    {/* Hop Index Circle */}
                    <div className="w-7 h-7 rounded-md bg-[#141414] border border-[#333333] flex items-center justify-center text-xs font-mono font-bold text-[#FFFFFF] shrink-0 z-10">
                      {hop.hopIndex}
                    </div>

                    {/* Timeline Line */}
                    {!isLast && (
                      <div className="absolute left-3.5 top-7 w-[1px] h-8 bg-[#262626]" />
                    )}

                    {/* Hop Card */}
                    <div className="flex-1 p-3 bg-[#0D0D0D] border border-[#202020] rounded-md space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-[#FFFFFF]">
                            {hop.resourceName}
                          </span>
                          <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#141414] text-[#858585] border border-[#262626]">
                            {hop.resourceType.replace("_", " ")}
                          </span>
                        </div>
                        <span className="text-xs font-mono font-bold text-[#B5B5B5]">
                          +{hop.latencyBudgetMs?.modeled}ms
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                        {/* Protocol */}
                        <span className="px-1.5 py-0.5 rounded bg-[#141414] text-[#B5B5B5] border border-[#262626]">
                          {hop.protocol.toUpperCase()}
                        </span>

                        {/* TLS State */}
                        <span
                          className={`px-1.5 py-0.5 rounded border flex items-center gap-1 ${
                            hop.tlsState === "plaintext"
                              ? "bg-[#1A0A0A] text-[#FF4D4D] border-[#551A1A]"
                              : "bg-[#0D1A10] text-[#4ADE80] border-[#165525]"
                          }`}
                        >
                          <LockIcon className="w-2.5 h-2.5" />
                          {hop.tlsState.toUpperCase()}
                        </span>

                        {/* Boundary Crossing */}
                        {hop.crossesBoundary && (
                          <span className="px-1.5 py-0.5 rounded bg-[#141414] text-[#858585] border border-[#262626] flex items-center gap-1">
                            {hop.sourceBoundaryName || "Source"}
                            <ChevronRightIcon className="w-3 h-3 text-[#666666]" />
                            {hop.targetBoundaryName || "Destination"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center border border-[#262626] rounded-md bg-[#080808] text-xs text-[#858585]">
          No traffic paths evaluated in this topology.
        </div>
      )}
    </div>
  );
}
