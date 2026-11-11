"use client";

import React from "react";
import type {
  TopologyDriftFinding,
  ObservabilityFinding,
} from "@nxtqr/architecture-intelligence";
import { AlertTriangleIcon, AlertCircleIcon, ShieldIcon, CheckIcon } from "@nxtqr/icons";

export interface ObservabilityFindingsProps {
  driftFindings: TopologyDriftFinding[];
  unifiedFindings: ObservabilityFinding[];
  onSelectComponent?: (componentId: string) => void;
  className?: string;
}

export function ObservabilityFindings({
  driftFindings,
  unifiedFindings,
  onSelectComponent,
  className = "",
}: ObservabilityFindingsProps) {
  const getSeverityPill = (severity: string) => {
    switch (severity) {
      case "critical":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-red-950/40 border border-red-900/40 text-red-400 font-semibold">
            Critical
          </span>
        );
      case "high":
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-amber-950/40 border border-amber-900/40 text-amber-400 font-semibold">
            High
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#141414] border border-[#262626] text-[#858585]">
            Low
          </span>
        );
    }
  };

  return (
    <div className={`flex flex-col h-full bg-[#080808] text-white text-xs select-none overflow-y-auto p-3 space-y-4 ${className}`}>
      {/* 1. Topology Drift Findings */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
            <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-400" />
            Topology Drift Intelligence ({driftFindings.length})
          </h4>
        </div>

        <div className="space-y-2">
          {driftFindings.map((finding) => (
            <div
              key={finding.id}
              onClick={() => {
                if (finding.sourceComponentId && onSelectComponent) {
                  onSelectComponent(finding.sourceComponentId);
                }
              }}
              className="p-3 bg-[#0D0D0D] border border-[#262626] hover:border-[#333333] rounded-md space-y-1.5 cursor-pointer transition-colors"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-white">{finding.title}</span>
                {getSeverityPill(finding.severity)}
              </div>

              <p className="text-[11px] text-[#B5B5B5]">{finding.explanation}</p>

              <div className="p-1.5 bg-[#141414] rounded-md font-mono text-[10px] text-amber-400">
                Evidence: {finding.evidence}
              </div>

              <div className="text-[11px] text-[#858585] flex items-center gap-1 pt-1 border-t border-[#1A1A1A]">
                <span className="text-white font-medium">Recommendation:</span>
                <span>{finding.suggestedAction}</span>
              </div>
            </div>
          ))}

          {driftFindings.length === 0 && (
            <div className="p-4 text-center border border-dashed border-[#262626] rounded-md text-[#858585] text-xs">
              <CheckIcon className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
              Zero topology drift detected. Monitored calls align with architecture model.
            </div>
          )}
        </div>
      </div>

      {/* 2. Unified Observability Health Findings */}
      {unifiedFindings.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-xs text-white flex items-center gap-1.5">
              <ShieldIcon className="w-3.5 h-3.5 text-white" />
              Runtime Degradation Findings ({unifiedFindings.length})
            </h4>
          </div>

          <div className="space-y-2">
            {unifiedFindings.map((finding) => (
              <div
                key={finding.id}
                onClick={() => {
                  if (onSelectComponent) onSelectComponent(finding.componentId);
                }}
                className="p-3 bg-[#0D0D0D] border border-[#262626] hover:border-[#333333] rounded-md space-y-1.5 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <AlertCircleIcon className="w-3.5 h-3.5 text-red-400" />
                    <span className="font-semibold text-white">{finding.title}</span>
                  </div>
                  {getSeverityPill(finding.severity)}
                </div>

                <p className="text-[11px] text-[#B5B5B5]">{finding.description}</p>

                <div className="p-1.5 bg-[#141414] rounded-md font-mono text-[10px] text-[#858585]">
                  {finding.evidence}
                </div>

                <div className="text-[11px] text-[#858585]">
                  <span className="text-white font-medium">Action:</span> {finding.recommendation}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
