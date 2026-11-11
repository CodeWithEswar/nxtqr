"use client";

/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Operational Readiness 8-Dimension Assessment & Findings Register Component
 */

import React from "react";
import type {
  ReadinessAssessment,
  OperationalDriftResult,
  OperationalFinding,
} from "@nxtqr/architecture-intelligence";
import { AlertCircleIcon, ShieldIcon } from "@nxtqr/icons";

interface OperationalReadinessViewProps {
  readiness: ReadinessAssessment;
  drift: OperationalDriftResult;
  findings: OperationalFinding[];
}

export function OperationalReadinessView({
  readiness,
  drift,
  findings,
}: OperationalReadinessViewProps) {
  const isReady = readiness.status === "ready";
  const criticalFindings = findings.filter((f) => f.severity === "critical");
  const highFindings = findings.filter((f) => f.severity === "high");

  return (
    <div className="space-y-6">
      {/* Readiness Overview Scorecard */}
      <div className="p-5 rounded-md bg-[#080808] border border-[#262626] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase font-mono text-[#858585]">
            Operational Readiness Assessment · v{readiness.evaluatorVersion}
          </div>
          <h2 className="text-xl font-bold text-[#FFFFFF] mt-0.5">8-Dimension Architecture Readiness Score</h2>
          <p className="text-xs text-[#858585] mt-1 max-w-2xl leading-relaxed">
            Deterministic evaluation of ownership, detection, runbooks, DR strategy, backup freshness, failover redundancy, verified drill evidence, and exercise cadence.
          </p>
        </div>

        <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#202020] text-center shrink-0 min-w-[160px]">
          <div className="text-[10px] font-mono uppercase text-[#858585]">Overall Status</div>
          <div
            className={`text-2xl font-mono font-bold mt-0.5 ${
              isReady ? "text-[#22c55e]" : "text-[#FFAA00]"
            }`}
          >
            {readiness.status.toUpperCase()}
          </div>
          <div className="text-xs font-mono text-[#FFFFFF] font-semibold mt-1">
            {readiness.overallScorePercent}% score
          </div>
        </div>
      </div>

      {/* 8-Dimension Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {readiness.dimensionScores.map((dim) => {
          const isDimReady = dim.status === "ready";
          return (
            <div
              key={dim.dimension}
              className="p-3.5 rounded-md bg-[#080808] border border-[#262626] space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono text-[#858585] uppercase">
                    {dim.dimension.replace("_", " ")}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono ${
                      isDimReady
                        ? "bg-[#141414] text-[#22c55e] border border-[#262626]"
                        : "bg-[#1f1010] text-[#ef4444] border border-[#401818]"
                    }`}
                  >
                    {dim.status.toUpperCase()}
                  </span>
                </div>
                <div className="text-lg font-bold font-mono text-[#FFFFFF] mt-1">
                  {dim.coveragePercent}%
                </div>
              </div>

              <div className="text-[11px] text-[#858585] leading-relaxed pt-2 border-t border-[#1A1A1A]">
                {dim.notes[0]}
              </div>
            </div>
          );
        })}
      </div>

      {/* Operational Drift Alert if Drift Detected */}
      {drift.hasDrift && (
        <div className="p-4 rounded-md bg-[#170e08] border border-[#3d2410] text-xs text-[#FFAA00] space-y-2">
          <div className="font-bold flex items-center gap-1.5 text-sm">
            <AlertCircleIcon size={16} />
            Operational Architecture Drift Detected ({drift.driftItems.length} items)
          </div>
          <p className="text-[#fde68a] text-[11px] leading-relaxed">
            The active architecture graph has evolved since operational baseline creation. Unmapped services ({drift.unmappedServicesCount}) or stale runbooks ({drift.staleRunbooksCount}) require synchronization.
          </p>

          <div className="space-y-1 pt-1">
            {drift.driftItems.slice(0, 3).map((item) => (
              <div key={item.id} className="p-2 rounded-md bg-[#1f140a] border border-[#4a2e14] text-[11px] flex items-center justify-between">
                <span>{item.description}</span>
                <span className="text-[10px] font-mono text-[#FFAA00] uppercase">{item.severity}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prioritized Findings Register */}
      <div className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
          <div>
            <div className="text-xs uppercase font-mono text-[#858585]">Remediation Register</div>
            <h3 className="text-sm font-bold text-[#FFFFFF]">Prioritized Operational Findings ({findings.length})</h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#ef4444]">{criticalFindings.length} Critical</span>
            <span className="text-[#666666]">·</span>
            <span className="text-[#FFAA00]">{highFindings.length} High</span>
          </div>
        </div>

        <div className="space-y-2.5">
          {findings.map((f) => {
            const isCrit = f.severity === "critical";
            return (
              <div
                key={f.id}
                className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2 text-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[#858585] text-[11px]">{f.id}</span>
                      <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#141414] border border-[#262626] text-[#B5B5B5]">
                        {f.category}
                      </span>
                    </div>
                    <h4 className="text-sm font-semibold text-[#FFFFFF] pt-0.5 leading-snug">{f.title}</h4>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono ${
                      isCrit
                        ? "bg-[#1f1010] border border-[#4a1c1c] text-[#ef4444]"
                        : "bg-[#1a1408] border border-[#423010] text-[#FFAA00]"
                    }`}
                  >
                    {f.severity.toUpperCase()}
                  </span>
                </div>

                <p className="text-xs text-[#858585] leading-relaxed">{f.description}</p>

                <div className="p-2.5 rounded-md bg-[#141414] border border-[#262626] text-[11px] text-[#22c55e] flex items-start gap-1.5 leading-relaxed">
                  <ShieldIcon size={14} className="shrink-0 mt-0.5" />
                  <span>
                    <strong className="text-[#FFFFFF]">Remediation: </strong>
                    {f.remediationRecommendation}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
