"use client";

/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Network Path Inspector
 */

import React, { useState } from "react";
import type {
  DeploymentTopology,
  NetworkPathEvaluationResult,
} from "@nxtqr/architecture-intelligence";
import { ShieldIcon, ChevronRightIcon } from "@nxtqr/icons";

interface NetworkInspectorProps {
  topology: DeploymentTopology;
  probeSourceId: string | null;
  probeTargetId: string | null;
  networkPathResult: NetworkPathEvaluationResult | null;
  onEvaluatePath: (sourceId: string, targetId: string) => void;
}

export function NetworkInspector({
  topology,
  probeSourceId,
  probeTargetId,
  networkPathResult,
  onEvaluatePath,
}: NetworkInspectorProps) {
  const [sourceId, setSourceId] = useState<string>(probeSourceId || "");
  const [targetId, setTargetId] = useState<string>(probeTargetId || "");

  const handleTest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sourceId || !targetId) return;
    onEvaluatePath(sourceId, targetId);
  };

  const statusColor =
    networkPathResult?.status === "allowed"
      ? "text-[#FFFFFF] bg-[#141414] border-[#333333]"
      : networkPathResult?.status === "denied"
      ? "text-[#B5B5B5] bg-[#141414] border-[#404040]"
      : "text-[#858585] bg-[#0D0D0D] border-[#202020]";

  return (
    <div className="flex flex-col h-full bg-[#080808] p-3 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[#262626] pb-3">
        <span className="text-[10px] font-mono uppercase text-[#858585] tracking-wider block">
          Network Isolation & Routing
        </span>
        <h3 className="text-sm font-semibold text-[#FFFFFF] mt-1">Path Reachability Inspector</h3>
      </div>

      {/* Form */}
      <form onSubmit={handleTest} className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase text-[#858585]">Source Resource</label>
          <select
            value={sourceId}
            onChange={(e) => setSourceId(e.target.value)}
            className="w-full bg-[#000000] border border-[#262626] focus:border-[#404040] rounded-md px-2 py-1.5 text-xs text-[#FFFFFF] outline-none"
          >
            <option value="">Select source resource...</option>
            {topology.resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.type})
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[10px] font-mono uppercase text-[#858585]">Target Resource</label>
          <select
            value={targetId}
            onChange={(e) => setTargetId(e.target.value)}
            className="w-full bg-[#000000] border border-[#262626] focus:border-[#404040] rounded-md px-2 py-1.5 text-xs text-[#FFFFFF] outline-none"
          >
            <option value="">Select target resource...</option>
            {topology.resources.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.type})
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={!sourceId || !targetId || sourceId === targetId}
          className="w-full mt-2 py-1.5 px-3 rounded-md bg-[#1A1A1A] border border-[#333333] hover:border-[#404040] disabled:opacity-40 text-xs font-mono text-[#FFFFFF] transition-colors"
        >
          Evaluate Network Path
        </button>
      </form>

      {/* Evaluation Results */}
      {networkPathResult && (
        <div className="space-y-3">
          <div className={`p-3 rounded-md border ${statusColor} space-y-1.5`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold uppercase tracking-wider">
                Status: {networkPathResult.status}
              </span>
              <ShieldIcon size={14} />
            </div>

            {/* Resolved Path */}
            {networkPathResult.path.length > 0 && (
              <div className="pt-2 border-t border-[#202020]">
                <span className="text-[10px] font-mono uppercase text-[#858585] block mb-1">
                  Resolved Route Path
                </span>
                <div className="flex items-center gap-1.5 flex-wrap text-xs font-mono">
                  {networkPathResult.path.map((segment, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-1.5 py-0.5 rounded bg-[#000000] border border-[#262626] text-[#FFFFFF]">
                        {segment}
                      </span>
                      {idx < networkPathResult.path.length - 1 && (
                        <ChevronRightIcon size={10} className="text-[#666666]" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* Reasons */}
            <div className="pt-2 border-t border-[#202020]">
              <span className="text-[10px] font-mono uppercase text-[#858585] block mb-1">
                Evaluation Findings
              </span>
              <ul className="text-xs text-[#B5B5B5] space-y-1 list-disc list-inside">
                {networkPathResult.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {!networkPathResult && (
        <div className="text-[11px] font-mono text-[#666666] p-4 text-center border border-dashed border-[#202020] rounded-md">
          Select source and target resources to check if firewall rules, routing tables, and subnets allow traffic.
        </div>
      )}
    </div>
  );
}

