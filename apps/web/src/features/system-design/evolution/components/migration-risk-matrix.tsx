"use client";

/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Migration Risk Registry & Blast Radius Matrix Component
 */

import React, { useState } from "react";
import type { MigrationRisk } from "@nxtqr/architecture-intelligence";
import { ShieldIcon } from "@nxtqr/icons";

interface MigrationRiskMatrixProps {
  risks: MigrationRisk[];
}

export function MigrationRiskMatrix({ risks }: MigrationRiskMatrixProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const criticalCount = risks.filter((r) => r.severity === "critical").length;
  const highCount = risks.filter((r) => r.severity === "high").length;
  const mediumCount = risks.filter((r) => r.severity === "medium").length;
  const mitigatedCount = risks.filter((r) => r.status === "mitigated" || r.status === "accepted").length;

  const filteredRisks =
    selectedCategory === "all"
      ? risks
      : risks.filter((r) => r.category === selectedCategory);

  const categories = [
    { id: "all", label: "All Risks" },
    { id: "dual_write_inconsistency", label: "Dual-Write Hazards" },
    { id: "latency_spike", label: "Latency Spikes" },
    { id: "contract_breakage", label: "Contract Breakage" },
    { id: "service_disruption", label: "Service Disruption" },
    { id: "rollback_failure", label: "Rollback Failures" },
    { id: "security_exposure", label: "Security Boundaries" },
  ];

  return (
    <div className="space-y-6">
      {/* Risk Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#262626]">
          <div className="text-xs uppercase tracking-wider text-[#858585] mb-1">Critical Risks</div>
          <div className="text-2xl font-bold font-mono text-[#ef4444]">{criticalCount}</div>
          <div className="text-xs text-[#858585] mt-1">Requires immediate mitigation</div>
        </div>
        <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#262626]">
          <div className="text-xs uppercase tracking-wider text-[#858585] mb-1">High Risks</div>
          <div className="text-2xl font-bold font-mono text-[#FFAA00]">{highCount}</div>
          <div className="text-xs text-[#858585] mt-1">Monitored during cutover</div>
        </div>
        <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#262626]">
          <div className="text-xs uppercase tracking-wider text-[#858585] mb-1">Medium Risks</div>
          <div className="text-2xl font-bold font-mono text-[#FFFFFF]">{mediumCount}</div>
          <div className="text-xs text-[#858585] mt-1">SLO thresholds established</div>
        </div>
        <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#262626]">
          <div className="text-xs uppercase tracking-wider text-[#858585] mb-1">Mitigated / Accepted</div>
          <div className="text-2xl font-bold font-mono text-[#22c55e]">{mitigatedCount} / {risks.length}</div>
          <div className="text-xs text-[#858585] mt-1">Blast radius bounded</div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex flex-wrap items-center gap-2">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border ${
              selectedCategory === c.id
                ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF] shadow-level-3"
                : "bg-[#0D0D0D] border-[#202020] text-[#858585] hover:text-[#FFFFFF] hover:border-[#333333]"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Risk Cards Matrix */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRisks.map((risk) => {
          const isCritical = risk.severity === "critical";
          const isHigh = risk.severity === "high";

          return (
            <div
              key={risk.id}
              className="p-4 rounded-md bg-[#080808] border border-[#262626] space-y-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-[#858585]">{risk.id}</span>
                    <span className="text-xs font-mono bg-[#141414] px-1.5 py-0.2 rounded-md border border-[#202020] text-[#B5B5B5]">
                      {risk.category}
                    </span>
                  </div>
                  <h4 className="text-sm font-semibold text-[#FFFFFF] leading-snug pt-1">
                    {risk.failureMode}
                  </h4>
                </div>
                <span
                  className={`shrink-0 px-2 py-0.5 rounded-md text-[10px] font-mono ${
                    isCritical
                      ? "bg-[#1f1010] border border-[#4a1c1c] text-[#ef4444]"
                      : isHigh
                      ? "bg-[#1a1408] border border-[#423010] text-[#FFAA00]"
                      : "bg-[#141414] border border-[#262626] text-[#858585]"
                  }`}
                >
                  {risk.severity.toUpperCase()}
                </span>
              </div>

              {/* Mitigation Plan */}
              <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1">
                <div className="text-[11px] font-semibold text-[#858585] uppercase tracking-wider flex items-center gap-1">
                  <ShieldIcon size={12} className="text-[#22c55e]" />
                  Mitigation Action
                </div>
                <p className="text-xs text-[#B5B5B5] leading-relaxed">{risk.mitigationPlan}</p>
              </div>

              {/* Blast Radius & Component Impact */}
              <div className="flex items-center justify-between text-xs text-[#858585] pt-1 border-t border-[#1A1A1A]">
                <div className="truncate max-w-xs">
                  <span className="font-mono text-[#666666]">Impacted: </span>
                  <span className="font-mono text-[#B5B5B5]">{risk.affectedComponentIds.join(", ")}</span>
                </div>
                <span className="font-mono text-[11px] text-[#858585] shrink-0">
                  Owner: {risk.owner}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

