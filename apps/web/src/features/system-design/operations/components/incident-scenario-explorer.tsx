"use client";

/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Incident Scenario Explorer Component
 */

import React, { useState } from "react";
import type { IncidentScenario, IncidentImpact } from "@nxtqr/architecture-intelligence";
import { ChevronRightIcon, SearchIcon } from "@nxtqr/icons";

interface IncidentScenarioExplorerProps {
  scenarios: IncidentScenario[];
  selectedScenarioId: string;
  onSelectScenario: (scenarioId: string) => void;
  impactAnalyses: IncidentImpact[];
}

export function IncidentScenarioExplorer({
  scenarios,
  selectedScenarioId,
  onSelectScenario,
  impactAnalyses,
}: IncidentScenarioExplorerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");

  const categories = [
    { id: "all", label: "All Categories" },
    { id: "database_outage", label: "Database Outages" },
    { id: "api_gateway_failure", label: "Gateway Failures" },
    { id: "authentication_outage", label: "Auth Outages" },
    { id: "queue_backlog", label: "Queue Backlogs" },
    { id: "storage_exhaustion", label: "Storage Issues" },
    { id: "regional_outage", label: "Regional Outages" },
  ];

  const severities = [
    { id: "all", label: "All Severities" },
    { id: "SEV1", label: "SEV1" },
    { id: "SEV2", label: "SEV2" },
    { id: "SEV3", label: "SEV3" },
    { id: "SEV4", label: "SEV4" },
  ];

  const filteredScenarios = scenarios.filter((sc) => {
    const matchesSearch =
      sc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sc.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || sc.category === categoryFilter;
    const matchesSeverity = severityFilter === "all" || sc.severity === severityFilter;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-md bg-[#080808] border border-[#262626]">
        <div className="relative flex-1">
          <SearchIcon size={14} className="absolute left-3 top-2.5 text-[#858585]" />
          <input
            type="text"
            placeholder="Search incident scenarios, failure modes, components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-[#0D0D0D] border border-[#262626] text-xs text-[#FFFFFF] placeholder-[#666666] focus:outline-none focus:border-[#404040]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#0D0D0D] border border-[#262626] rounded-md text-xs px-2.5 py-1.5 text-[#FFFFFF] focus:outline-none focus:border-[#404040]"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="bg-[#0D0D0D] border border-[#262626] rounded-md text-xs px-2.5 py-1.5 text-[#FFFFFF] focus:outline-none focus:border-[#404040]"
          >
            {severities.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredScenarios.map((sc) => {
          const isSelected = sc.id === selectedScenarioId;
          const impact = impactAnalyses.find((ia) => ia.scenarioId === sc.id);
          const isSev1 = sc.severity === "SEV1";

          return (
            <button
              key={sc.id}
              onClick={() => onSelectScenario(sc.id)}
              className={`p-4 text-left rounded-md transition-all border flex flex-col justify-between gap-3 ${
                isSelected
                  ? "bg-[#1A1A1A] border-[#404040] shadow-level-3"
                  : "bg-[#080808] border-[#262626] hover:border-[#333333] hover:bg-[#0D0D0D]"
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-mono text-[#858585]">{sc.id}</span>
                    <span className="px-1.5 py-0.2 rounded-md text-[10px] font-mono bg-[#141414] border border-[#262626] text-[#B5B5B5]">
                      {sc.category}
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold ${
                      isSev1
                        ? "bg-[#1f1010] border border-[#4a1c1c] text-[#ef4444]"
                        : "bg-[#1a1408] border border-[#423010] text-[#FFAA00]"
                    }`}
                  >
                    {sc.severity}
                  </span>
                </div>

                <h3 className="text-sm font-semibold text-[#FFFFFF] leading-snug">{sc.title}</h3>
                <p className="text-xs text-[#858585] line-clamp-2 leading-relaxed">{sc.description}</p>
              </div>

              {/* Bottom Metrics */}
              <div className="pt-2 border-t border-[#1A1A1A] flex items-center justify-between text-xs font-mono text-[#858585]">
                <div className="flex items-center gap-2">
                  <span className="text-[#666666]">Blast Radius:</span>
                  <span
                    className={`font-bold ${
                      (impact?.blastRadiusScore ?? 50) >= 60 ? "text-[#ef4444]" : "text-[#FFAA00]"
                    }`}
                  >
                    {impact?.blastRadiusScore ?? 50}/100
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span>{sc.affectedComponentIds.length} assets</span>
                  <ChevronRightIcon size={14} className="text-[#666666]" />
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
