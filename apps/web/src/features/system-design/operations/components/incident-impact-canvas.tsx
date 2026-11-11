"use client";

/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Incident Impact Canvas & Blast Radius Visualizer
 */

import React from "react";
import type { IncidentScenario, IncidentImpact, CriticalJourney } from "@nxtqr/architecture-intelligence";
import { AlertCircleIcon, ChevronRightIcon, LayersIcon } from "@nxtqr/icons";

interface IncidentImpactCanvasProps {
  scenario: IncidentScenario;
  impact?: IncidentImpact;
  journeys: CriticalJourney[];
}

export function IncidentImpactCanvas({
  scenario,
  impact,
  journeys,
}: IncidentImpactCanvasProps) {
  const blastScore = impact?.blastRadiusScore ?? 50;
  const isHighBlast = blastScore >= 60;

  const impactedJourneys = journeys.filter((j) => impact?.impactedJourneyIds.includes(j.id));

  return (
    <div className="space-y-6">
      {/* Blast Radius Header Card */}
      <div className="p-5 rounded-md bg-[#080808] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#858585]">{scenario.id}</span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                scenario.severity === "SEV1"
                  ? "bg-[#1f1010] border border-[#4a1c1c] text-[#ef4444]"
                  : "bg-[#1a1408] border border-[#423010] text-[#FFAA00]"
              }`}
            >
              {scenario.severity}
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#FFFFFF]">{scenario.title}</h2>
          <p className="text-xs text-[#858585] max-w-2xl leading-relaxed">{scenario.expectedFailureMode}</p>
        </div>

        {/* Blast Radius Score Meter */}
        <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#202020] flex items-center gap-4 shrink-0">
          <div>
            <div className="text-[10px] uppercase font-mono text-[#858585]">Blast Radius Score</div>
            <div className={`text-2xl font-mono font-bold ${isHighBlast ? "text-[#ef4444]" : "text-[#FFAA00]"}`}>
              {blastScore} <span className="text-xs text-[#858585] font-normal">/ 100</span>
            </div>
          </div>
          <div className="h-10 w-px bg-[#262626]" />
          <div>
            <div className="text-[10px] uppercase font-mono text-[#858585]">Critical Journeys</div>
            <div className="text-sm font-mono font-bold text-[#FFFFFF]">
              {impactedJourneys.length} Disrupted
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column: Direct vs Propagated Failures & Critical Journeys */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct Failed vs Propagated Assets */}
        <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <div>
              <div className="text-xs uppercase font-mono text-[#858585]">Component Blast Radius</div>
              <h3 className="text-sm font-bold text-[#FFFFFF]">Affected Infrastructure & Workloads</h3>
            </div>
            <span className="text-xs font-mono text-[#858585]">
              {(impact?.directFailedComponentIds.length ?? 0) + (impact?.propagatedComponentIds.length ?? 0)} assets
            </span>
          </div>

          {/* Direct Failures */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-[#ef4444] uppercase tracking-wider flex items-center gap-1.5">
              <AlertCircleIcon size={14} />
              Direct Root Failure (Fault Origin)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {impact?.directFailedComponentIds.map((cid) => (
                <div
                  key={cid}
                  className="p-2.5 rounded-md bg-[#170a0a] border border-[#401818] text-xs font-mono text-[#FFFFFF] flex items-center justify-between"
                >
                  <span className="font-semibold">{cid}</span>
                  <span className="text-[10px] text-[#ef4444]">FAILED</span>
                </div>
              ))}
            </div>
          </div>

          {/* Propagated Failures */}
          <div className="space-y-2 pt-2">
            <div className="text-xs font-semibold text-[#FFAA00] uppercase tracking-wider flex items-center gap-1.5">
              <LayersIcon size={14} />
              Propagated Downstream Degradation
            </div>
            {impact && impact.propagatedComponentIds.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {impact.propagatedComponentIds.map((cid) => (
                  <div
                    key={cid}
                    className="p-2.5 rounded-md bg-[#141008] border border-[#3b2a14] text-xs font-mono text-[#FFFFFF] flex items-center justify-between"
                  >
                    <span>{cid}</span>
                    <span className="text-[10px] text-[#FFAA00]">DEGRADED</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#858585] italic">No cascading propagation detected beyond direct fault.</p>
            )}
          </div>
        </div>

        {/* Disrupted Critical User Journeys */}
        <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
            <div>
              <div className="text-xs uppercase font-mono text-[#858585]">Business Continuity Impact</div>
              <h3 className="text-sm font-bold text-[#FFFFFF]">Impacted User Journeys</h3>
            </div>
            <span className="text-xs font-mono text-[#858585]">
              {impactedJourneys.length} of {journeys.length}
            </span>
          </div>

          <div className="space-y-2.5">
            {impactedJourneys.map((j) => (
              <div
                key={j.id}
                className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-[#FFFFFF]">{j.title}</span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-[#141414] border border-[#333333] text-[#ef4444]">
                    PRIORITY {j.recoveryPriority}
                  </span>
                </div>
                <p className="text-xs text-[#858585]">{j.description}</p>
                <div className="flex items-center justify-between text-[11px] font-mono text-[#858585] pt-1 border-t border-[#1A1A1A]">
                  <span>Max Allowed Downtime: {j.maxAllowedDowntimeSeconds}s</span>
                  <span>Entry: {j.entryPointComponentId}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Causal Propagation Sequence */}
      {impact && impact.propagationPath.length > 0 && (
        <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
            Causal Failure Propagation Trajectory
          </h4>

          <div className="space-y-1.5">
            {impact.propagationPath.map((step, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs font-mono"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[#ef4444] font-semibold">{step.fromComponentId}</span>
                  <ChevronRightIcon size={14} className="text-[#666666]" />
                  <span className="text-[#FFAA00] font-semibold">{step.toComponentId}</span>
                </div>
                <span className="text-[11px] text-[#858585]">{step.reason}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
