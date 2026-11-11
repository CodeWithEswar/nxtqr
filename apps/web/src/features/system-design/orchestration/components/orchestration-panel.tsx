"use client";

/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Orchestration Docked Panel & Executive Metrics Strip
 */

import React from "react";
import type {
  UnifiedArchitectureAssessment,
  ExecutionPlan,
} from "@nxtqr/architecture-intelligence";
import type { OrchestrationTab } from "../hooks/use-architecture-orchestration";
import { PlayIcon, RefreshIcon, LayersIcon } from "@nxtqr/icons";

interface OrchestrationPanelProps {
  assessment: UnifiedArchitectureAssessment | null;
  plan: ExecutionPlan | null;
  isOrchestrating: boolean;
  activeTab: OrchestrationTab;
  onTabChange: (tab: OrchestrationTab) => void;
  onRunOrchestration: () => void;
  onCancelOrchestration: () => void;
}

export function OrchestrationPanel({
  assessment,
  plan,
  isOrchestrating,
  activeTab,
  onTabChange,
  onRunOrchestration,
  onCancelOrchestration,
}: OrchestrationPanelProps) {
  const tabs: Array<{ id: OrchestrationTab; label: string; count?: number }> = [
    { id: "overview", label: "Overview" },
    { id: "waves", label: "Waves & DAG", count: plan?.waves.length },
    { id: "findings", label: "Findings", count: assessment?.totalFindingsCount },
    { id: "correlations", label: "Correlations", count: assessment?.correlationGroups.length },
    { id: "contradictions", label: "Contradictions", count: assessment?.contradictions.length },
    { id: "recommendations", label: "Recommendations", count: assessment?.recommendations.length },
    { id: "analyzers", label: "Analyzers", count: assessment?.analyzersRun },
  ];

  return (
    <div className="flex flex-col gap-4 border-b border-[#262626] bg-[#080808] p-4">
      {/* Top Action Bar & Metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-md border border-[#262626] bg-[#141414]">
            <LayersIcon className="h-5 w-5 text-[#FFFFFF]" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#FFFFFF]">Architecture Intelligence Orchestration</h2>
            <p className="text-xs text-[#858585]">Unified 11-Discipline Analysis, Dependency DAG & Correlation</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isOrchestrating ? (
            <button
              onClick={onCancelOrchestration}
              className="flex items-center gap-2 rounded-md border border-[#404040] bg-[#1A1A1A] px-3 py-1.5 text-xs font-medium text-[#FFFFFF] hover:bg-[#262626] transition-colors"
            >
              <RefreshIcon className="h-3.5 w-3.5 animate-spin" />
              <span>Cancel Run</span>
            </button>
          ) : (
            <button
              onClick={onRunOrchestration}
              className="flex items-center gap-2 rounded-md border border-[#333333] bg-[#FFFFFF] px-4 py-1.5 text-xs font-semibold text-[#000000] hover:bg-[#E5E5E5] transition-colors"
            >
              <PlayIcon className="h-3.5 w-3.5 fill-current" />
              <span>Run Unified Orchestration</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Metrics Strip */}
      {assessment && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6 border-y border-[#1A1A1A] py-3">
          <div className="flex flex-col">
            <span className="text-[11px] text-[#858585]">Health Score</span>
            <span
              className={`text-lg font-bold font-mono ${
                (assessment.healthScore ?? 100) >= 80
                  ? "text-[#22c55e]"
                  : (assessment.healthScore ?? 100) >= 50
                  ? "text-[#f59e0b]"
                  : "text-[#ef4444]"
              }`}
            >
              {assessment.healthScore !== undefined ? `${assessment.healthScore}/100` : "—"}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-[#858585]">Completeness</span>
            <span className="text-xs font-semibold uppercase tracking-wider font-mono text-[#FFFFFF] mt-1">
              {assessment.completenessStatus}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-[#858585]">Analyzers Executed</span>
            <span className="text-lg font-bold font-mono text-[#FFFFFF]">
              {assessment.analyzersCompleted} <span className="text-xs font-normal text-[#858585]">/ {assessment.analyzersRun}</span>
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-[#858585]">Total Findings</span>
            <span className="text-lg font-bold font-mono text-[#FFFFFF]">
              {assessment.totalFindingsCount}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-[#858585]">Critical Risks</span>
            <span
              className={`text-lg font-bold font-mono ${
                assessment.criticalFindingsCount > 0 ? "text-[#ef4444]" : "text-[#B5B5B5]"
              }`}
            >
              {assessment.criticalFindingsCount}
            </span>
          </div>

          <div className="flex flex-col">
            <span className="text-[11px] text-[#858585]">Duration</span>
            <span className="text-lg font-bold font-mono text-[#B5B5B5]">
              {assessment.executionDurationMs}ms
            </span>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pt-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors shrink-0 ${
                isActive
                  ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]"
                  : "text-[#858585] hover:bg-[#141414] hover:text-[#FFFFFF]"
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.2 text-[10px] font-mono ${
                    isActive ? "bg-[#262626] text-[#FFFFFF]" : "bg-[#141414] text-[#666666]"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
