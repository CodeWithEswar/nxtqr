"use client";

/**
 * NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
 * Master Studio Shell: Operations Workspace
 */

import React, { useState } from "react";
import { useArchitectureOperations } from "../hooks/use-architecture-operations";
import { IncidentScenarioExplorer } from "./incident-scenario-explorer";
import { IncidentImpactCanvas } from "./incident-impact-canvas";
import { RunbookLibrary } from "./runbook-library";
import { RecoveryDependencyGraph } from "./recovery-dependency-graph";
import { RecoveryObjectivesInspector } from "./recovery-objectives-inspector";
import { TabletopExerciseWorkspace } from "./tabletop-exercise-workspace";
import { OperationalReadinessView } from "./operational-readiness-view";
import { LayersIcon } from "@nxtqr/icons";

export function OperationsWorkspace() {
  const [activeTab, setActiveTab] = useState<
    "readiness" | "scenarios" | "impact" | "runbooks" | "dr_dag" | "objectives" | "tabletop"
  >("readiness");

  const {
    scenarios,
    activeArchitecture,
    setActiveScenarioId,
    allStandardScenarios,
    selectedIncidentScenario,
    handleSelectScenario,
    analysisResult,
    selectedRunbook,
    setSelectedRunbookId,
    activeExercise,
    setActiveExercise,
    simulationPreset,
    setSimulationPreset,
  } = useArchitectureOperations();

  const summary = analysisResult.summary;
  const project = analysisResult.project;
  const activeImpact = analysisResult.impactAnalyses.find(
    (ia) => ia.scenarioId === selectedIncidentScenario.id
  );

  const tabs = [
    { id: "readiness", label: "Readiness Scorecard" },
    { id: "scenarios", label: "Incident Scenarios" },
    { id: "impact", label: "Blast Radius Canvas" },
    { id: "runbooks", label: "Runbook Library" },
    { id: "dr_dag", label: "Recovery Dependency DAG" },
    { id: "objectives", label: "RTO/RPO & Backups" },
    { id: "tabletop", label: "Tabletop Exercises" },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] text-[#FFFFFF] select-none">
      {/* Studio Top Bar */}
      <header className="h-14 border-b border-[#262626] bg-[#080808] px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayersIcon size={18} className="text-[#FFFFFF]" />
            <span className="font-bold text-sm tracking-tight text-[#FFFFFF]">OPERATIONAL READINESS & DR</span>
          </div>

          <div className="h-4 w-px bg-[#262626]" />

          {/* Architecture Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#858585] font-mono">Topology:</span>
            <select
              value={activeArchitecture.id}
              onChange={(e) => setActiveScenarioId(e.target.value)}
              className="bg-[#0D0D0D] border border-[#262626] rounded-md text-xs px-2.5 py-1 text-[#FFFFFF] focus:outline-none focus:border-[#404040]"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* What-If Operational Simulation Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#858585] font-mono">What-If:</span>
          <button
            onClick={() => setSimulationPreset(null)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
              simulationPreset === null
                ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF] font-semibold"
                : "bg-[#0D0D0D] border-[#202020] text-[#858585] hover:text-[#FFFFFF]"
            }`}
          >
            Baseline Operational Plan
          </button>
          <button
            onClick={() => setSimulationPreset("missing_backup_restore")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
              simulationPreset === "missing_backup_restore"
                ? "bg-[#1f1010] border-[#4a1c1c] text-[#ef4444] font-semibold"
                : "bg-[#0D0D0D] border-[#202020] text-[#858585] hover:text-[#ef4444]"
            }`}
          >
            Untested Restore
          </button>
          <button
            onClick={() => setSimulationPreset("recovery_cycle_deadlock")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
              simulationPreset === "recovery_cycle_deadlock"
                ? "bg-[#1f1010] border-[#4a1c1c] text-[#ef4444] font-semibold"
                : "bg-[#0D0D0D] border-[#202020] text-[#858585] hover:text-[#ef4444]"
            }`}
          >
            Recovery DAG Cycle
          </button>
          <button
            onClick={() => setSimulationPreset("unverified_rto_breach")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
              simulationPreset === "unverified_rto_breach"
                ? "bg-[#1a1408] border-[#423010] text-[#FFAA00] font-semibold"
                : "bg-[#0D0D0D] border-[#202020] text-[#858585] hover:text-[#FFAA00]"
            }`}
          >
            RTO Target Breach
          </button>
        </div>
      </header>

      {/* KPI Header Bar */}
      <div className="bg-[#080808] border-b border-[#262626] px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Overall Readiness</div>
            <div
              className={`text-sm font-bold font-mono mt-0.5 ${
                summary.overallReadinessStatus === "ready" ? "text-[#22c55e]" : "text-[#FFAA00]"
              }`}
            >
              {summary.overallReadinessStatus.toUpperCase()} ({analysisResult.readiness.overallScorePercent}%)
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Tier 1 Runbooks</div>
            <div className="text-base font-bold font-mono text-[#FFFFFF] mt-0.5">
              {summary.tier1CoveragePercent}% <span className="text-[#858585] text-xs font-normal">coverage</span>
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">DR Critical Path</div>
            <div className="text-base font-bold font-mono text-[#FFFFFF] mt-0.5">
              {analysisResult.recoveryPlan.criticalPathSeconds}s <span className="text-[#858585] text-xs font-normal">window</span>
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Recovery Objectives</div>
            <div className="text-base font-bold font-mono text-[#22c55e] mt-0.5">
              {summary.verifiedObjectivesCount} <span className="text-[#858585] text-xs font-normal">Verified</span> · {summary.unverifiedObjectivesCount} <span className="text-[#FFAA00] text-xs font-normal">Unverified</span>
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Failure Scenarios</div>
            <div className="text-base font-bold font-mono text-[#FFFFFF] mt-0.5">
              {summary.totalScenariosCount} <span className="text-[#858585] text-xs font-normal">scenarios</span>
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Operational Findings</div>
            <div className="text-base font-bold font-mono text-[#ef4444] mt-0.5">
              {summary.criticalFindingsCount} <span className="text-xs font-normal">Crit</span> · {summary.highFindingsCount} <span className="text-[#FFAA00] text-xs font-normal">High</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-[#1A1A1A] overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all border whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF] shadow-level-3 font-semibold"
                  : "bg-transparent border-transparent text-[#858585] hover:text-[#FFFFFF] hover:border-[#262626]"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Pane */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === "readiness" && (
          <OperationalReadinessView
            readiness={analysisResult.readiness}
            drift={analysisResult.drift}
            findings={analysisResult.readiness.findings}
          />
        )}

        {activeTab === "scenarios" && (
          <IncidentScenarioExplorer
            scenarios={allStandardScenarios}
            selectedScenarioId={selectedIncidentScenario.id}
            onSelectScenario={handleSelectScenario}
            impactAnalyses={analysisResult.impactAnalyses}
          />
        )}

        {activeTab === "impact" && (
          <IncidentImpactCanvas
            scenario={selectedIncidentScenario}
            impact={activeImpact}
            journeys={project.journeys}
          />
        )}

        {activeTab === "runbooks" && (
          <RunbookLibrary
            runbooks={project.runbooks}
            selectedRunbookId={selectedRunbook.id}
            onSelectRunbook={setSelectedRunbookId}
            coverageItems={analysisResult.runbookCoverage}
            tier1CoveragePercent={summary.tier1CoveragePercent}
          />
        )}

        {activeTab === "dr_dag" && (
          <RecoveryDependencyGraph
            recoveryPlan={analysisResult.recoveryPlan}
            dependencies={project.dependencies}
          />
        )}

        {activeTab === "objectives" && (
          <RecoveryObjectivesInspector
            objectives={project.objectives}
            backups={project.backupCapabilities}
            failovers={project.failoverProcedures}
          />
        )}

        {activeTab === "tabletop" && (
          <TabletopExerciseWorkspace
            exercise={activeExercise}
            onUpdateExercise={setActiveExercise}
          />
        )}
      </main>
    </div>
  );
}

