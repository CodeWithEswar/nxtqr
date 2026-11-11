"use client";

/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Architecture Drift Inspector
 */

import React from "react";
import type { DriftFinding } from "@nxtqr/architecture-intelligence";
import { AlertCircleIcon } from "@nxtqr/icons";

interface DriftInspectorProps {
  findings: DriftFinding[];
}

export function DriftInspector({ findings }: DriftInspectorProps) {
  const getSeverityStyle = (severity: string) => {
    switch (severity) {
      case "critical":
      case "high":
        return "text-[#FFFFFF] bg-[#1A1A1A] border-[#404040]";
      case "medium":
        return "text-[#B5B5B5] bg-[#141414] border-[#333333]";
      default:
        return "text-[#858585] bg-[#0D0D0D] border-[#202020]";
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] p-3 space-y-3 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[#262626] pb-3">
        <span className="text-[10px] font-mono uppercase text-[#858585] tracking-wider block">
          Inventory Reconciliation
        </span>
        <div className="flex items-center justify-between mt-1">
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Architecture Drift</h3>
          <span className="text-xs font-mono text-[#858585]">{findings.length} findings</span>
        </div>
      </div>

      {/* Findings List */}
      <div className="space-y-2">
        {findings.map((f) => (
          <div
            key={f.id}
            className={`p-2.5 rounded-md border ${getSeverityStyle(f.severity)} space-y-1.5`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <AlertCircleIcon size={13} className="shrink-0 text-[#B5B5B5]" />
                <span className="text-xs font-medium text-[#FFFFFF]">{f.title}</span>
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded border border-[#333333]">
                {f.severity}
              </span>
            </div>

            <p className="text-xs text-[#858585] leading-relaxed">{f.description}</p>

            {(f.plannedValue !== undefined || f.actualValue !== undefined) && (
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 border-t border-[#202020]">
                <div>
                  <span className="text-[#666666] block">Planned:</span>
                  <span className="text-[#B5B5B5]">{String(f.plannedValue ?? "None")}</span>
                </div>
                <div>
                  <span className="text-[#666666] block">Actual / Observed:</span>
                  <span className="text-[#FFFFFF]">{String(f.actualValue ?? "None")}</span>
                </div>
              </div>
            )}
          </div>
        ))}

        {findings.length === 0 && (
          <div className="text-[11px] font-mono text-[#666666] py-6 text-center border border-dashed border-[#202020] rounded-md">
            No architecture drift detected. Planned topology aligns with cloud inventory.
          </div>
        )}
      </div>
    </div>
  );
}

