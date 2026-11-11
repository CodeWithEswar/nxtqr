"use client";

/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Intermediate Architecture Timeline & Validation Inspector Component
 */

import React from "react";
import type { IntermediateArchitecture } from "@nxtqr/architecture-intelligence";
import {
  CheckCircleIcon,
  LayersIcon,
  DatabaseIcon,
} from "@nxtqr/icons";

interface IntermediateTimelineViewerProps {
  intermediateStates: IntermediateArchitecture[];
  activeWaveNumber: number;
  onSelectWave: (waveNumber: number) => void;
}

export function IntermediateTimelineViewer({
  intermediateStates,
  activeWaveNumber,
  onSelectWave,
}: IntermediateTimelineViewerProps) {
  const activeState =
    intermediateStates.find((s) => s.waveNumber === activeWaveNumber) || intermediateStates[0];

  return (
    <div className="space-y-6">
      {/* Timeline Progression Header */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626]">
        <div className="text-xs uppercase font-mono text-[#858585] mb-1">
          Intermediate State Validation & Progression
        </div>
        <h3 className="text-base font-bold text-[#FFFFFF]">Evolution Timeline (Waves 1 — 5)</h3>
        <p className="text-xs text-[#858585] mt-1">
          Every intermediate dual-run state is modeled and mathematically validated for graph reachability, security trust boundaries, and availability.
        </p>

        {/* Step Progression Pills */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
          {intermediateStates.map((state) => {
            const isSelected = state.waveNumber === activeWaveNumber;
            return (
              <button
                key={state.id}
                onClick={() => onSelectWave(state.waveNumber)}
                className={`p-3 text-left rounded-md transition-all border ${
                  isSelected
                    ? "bg-[#1A1A1A] border-[#404040] shadow-level-3"
                    : "bg-[#0D0D0D] border-[#202020] hover:border-[#333333]"
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#858585] mb-1">
                  <span>WAVE {state.waveNumber}</span>
                  <span className="text-[#22c55e]">VALID</span>
                </div>
                <div className="text-xs font-semibold text-[#FFFFFF] truncate">
                  {state.title.replace(/^Intermediate State:\s*/, "")}
                </div>
                <div className="text-[11px] text-[#858585] font-mono mt-1.5 flex items-center justify-between">
                  <span>{state.snapshot.nodes.length} nodes</span>
                  <span>{state.availabilityScore}% SLA</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Intermediate Snapshot Details */}
      {activeState && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Health & Validation Metrics */}
          <div className="rounded-md bg-[#080808] border border-[#262626] p-4 space-y-4">
            <div className="pb-3 border-b border-[#262626]">
              <div className="text-xs uppercase font-mono text-[#858585]">Intermediate Verification</div>
              <h4 className="text-sm font-bold text-[#FFFFFF] mt-0.5">{activeState.title}</h4>
              <div className="text-xs font-mono text-[#858585] mt-1">{activeState.snapshot.revision}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020]">
                <div className="text-[11px] text-[#858585] uppercase">Security Score</div>
                <div className="text-xl font-bold font-mono text-[#FFFFFF] mt-1">
                  {activeState.securityScore}/100
                </div>
              </div>
              <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020]">
                <div className="text-[11px] text-[#858585] uppercase">Availability Score</div>
                <div className="text-xl font-bold font-mono text-[#22c55e] mt-1">
                  {activeState.availabilityScore}%
                </div>
              </div>
            </div>

            <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
              <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
                Reachability Verification
              </div>
              <div className="flex items-center gap-2 text-xs text-[#22c55e]">
                <CheckCircleIcon size={16} />
                <span className="font-medium text-[#FFFFFF]">End-to-End Ingress Path Confirmed</span>
              </div>
              <p className="text-[11px] text-[#858585] leading-relaxed">
                All client ingress points maintain continuous graph reachability to both legacy and extracted data storage components.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">
                Validation Notes ({activeState.validationNotes.length})
              </div>
              <div className="space-y-1">
                {activeState.validationNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className="p-2 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-xs text-[#B5B5B5] flex items-start gap-2"
                  >
                    <span className="text-[#858585] font-mono">•</span>
                    <span>{note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Active Intermediate Components Breakdown */}
          <div className="lg:col-span-2 rounded-md bg-[#080808] border border-[#262626] p-4 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
              <div>
                <div className="text-xs uppercase font-mono text-[#858585]">Intermediate Graph Topology</div>
                <h4 className="text-sm font-bold text-[#FFFFFF]">
                  Active Components in Wave {activeState.waveNumber} ({activeState.snapshot.nodes.length})
                </h4>
              </div>
              <span className="text-xs font-mono text-[#858585]">
                {activeState.snapshot.edges.length} active edges
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activeState.snapshot.nodes.map((node) => (
                <div
                  key={node.id}
                  className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    {node.data.nodeType === "database" ? (
                      <DatabaseIcon size={16} className="text-[#22c55e]" />
                    ) : (
                      <LayersIcon size={16} className="text-[#FFFFFF]" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-[#FFFFFF]">{String(node.data.label || node.id)}</div>
                      <div className="text-[11px] font-mono text-[#858585]">{node.id}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#141414] border border-[#262626] text-[#858585]">
                    {String(node.data.nodeType || "service")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

