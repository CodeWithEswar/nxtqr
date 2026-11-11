"use client";

/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Evolution Workspace: Master Studio Shell
 */

import React, { useState } from "react";
import { useArchitectureEvolution } from "../hooks/use-architecture-evolution";
import { SourceTargetComparator } from "./source-target-comparator";
import { MigrationWavePlanner } from "./migration-wave-planner";
import { DependencyDagViewer } from "./dependency-dag-viewer";
import { CutoverRollbackInspector } from "./cutover-rollback-inspector";
import { IntermediateTimelineViewer } from "./intermediate-timeline-viewer";
import { MigrationRiskMatrix } from "./migration-risk-matrix";
import {
  LayersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
} from "@nxtqr/icons";

export function EvolutionWorkspace() {
  const [activeTab, setActiveTab] = useState<
    "overview" | "comparison" | "waves" | "dag" | "cutover" | "timeline" | "risks"
  >("overview");

  const {
    scenarios,
    activeScenario,
    allStrategies,
    effectiveStrategyId,
    analysisResult,
    activeWaveNumber,
    selectedTaskId,
    simulationScenario,
    switchScenario,
    setActiveWaveNumber,
    setSelectedTaskId,
    triggerSimulation,
  } = useArchitectureEvolution();

  const summary = analysisResult.summary;
  const project = analysisResult.project;
  const activeStrategy = allStrategies.find((s) => s.id === effectiveStrategyId) || allStrategies[0];

  const tabs = [
    { id: "overview", label: "Overview & Strategy" },
    { id: "comparison", label: "Source vs Target" },
    { id: "waves", label: "Waves & Tasks" },
    { id: "dag", label: "Dependency DAG" },
    { id: "cutover", label: "Cutover & Rollback" },
    { id: "timeline", label: "Intermediate States" },
    { id: "risks", label: "Risk Matrix" },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] text-[#FFFFFF] select-none">
      {/* Top Studio Control Bar */}
      <header className="h-14 border-b border-[#262626] bg-[#080808] px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayersIcon size={18} className="text-[#FFFFFF]" />
            <span className="font-bold text-sm tracking-tight text-[#FFFFFF]">ARCHITECTURE EVOLUTION</span>
          </div>

          <div className="h-4 w-px bg-[#262626]" />

          {/* Scenario Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#858585] font-mono">Scenario:</span>
            <select
              value={activeScenario.id}
              onChange={(e) => switchScenario(e.target.value)}
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

        {/* What-If Simulation Bar */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#858585] font-mono">What-If:</span>
          <button
            onClick={() => triggerSimulation(null)}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
              simulationScenario === null
                ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF] font-semibold"
                : "bg-[#0D0D0D] border-[#202020] text-[#858585] hover:text-[#FFFFFF]"
            }`}
          >
            Baseline Plan
          </button>
          <button
            onClick={() => triggerSimulation("failed_canary_gate")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
              simulationScenario === "failed_canary_gate"
                ? "bg-[#1f1010] border-[#4a1c1c] text-[#ef4444] font-semibold"
                : "bg-[#0D0D0D] border-[#202020] text-[#858585] hover:text-[#ef4444]"
            }`}
          >
            Canary Fails
          </button>
          <button
            onClick={() => triggerSimulation("cutover_abort_rollback")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
              simulationScenario === "cutover_abort_rollback"
                ? "bg-[#1f1010] border-[#4a1c1c] text-[#FFAA00] font-semibold"
                : "bg-[#0D0D0D] border-[#202020] text-[#858585] hover:text-[#FFAA00]"
            }`}
          >
            Cutover Abort
          </button>
          <button
            onClick={() => triggerSimulation("cdc_sync_lag_spike")}
            className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all border ${
              simulationScenario === "cdc_sync_lag_spike"
                ? "bg-[#1f1010] border-[#4a1c1c] text-[#FFAA00] font-semibold"
                : "bg-[#0D0D0D] border-[#202020] text-[#858585] hover:text-[#FFAA00]"
            }`}
          >
            CDC Lag Spike
          </button>
        </div>
      </header>

      {/* KPI Summary Banner */}
      <div className="bg-[#080808] border-b border-[#262626] px-4 py-3">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Strategy</div>
            <div className="text-xs font-bold text-[#FFFFFF] mt-0.5 truncate">{activeStrategy.name}</div>
            <div className="text-[10px] text-[#858585] font-mono mt-0.5 uppercase">
              Complexity: {activeStrategy.complexity}
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Waves / Tasks</div>
            <div className="text-base font-bold font-mono text-[#FFFFFF] mt-0.5">
              {summary.totalWavesCount} <span className="text-[#858585] text-xs font-normal">waves</span> / {summary.totalTasksCount} <span className="text-[#858585] text-xs font-normal">tasks</span>
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Critical Path</div>
            <div className="text-base font-bold font-mono text-[#FFFFFF] mt-0.5">
              {analysisResult.roadmap.estimatedTotalHours} <span className="text-[#858585] text-xs font-normal">hours</span>
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Point of No Return</div>
            <div className="text-base font-bold font-mono text-[#ef4444] mt-0.5">
              Wave 5 <span className="text-[#858585] text-xs font-normal">(Irreversible)</span>
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Verification Gates</div>
            <div className="text-base font-bold font-mono text-[#22c55e] mt-0.5">
              {summary.passedGatesCount} <span className="text-[#858585] text-xs font-normal">Passed</span> · {summary.failedGatesCount} <span className="text-[#ef4444] text-xs font-normal">Fail</span>
            </div>
          </div>
          <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
            <div className="text-[10px] uppercase font-mono text-[#858585]">Migration Risks</div>
            <div className="text-base font-bold font-mono text-[#FFAA00] mt-0.5">
              {summary.criticalRisksCount} <span className="text-[#ef4444] text-xs font-normal">Crit</span> · {summary.highRisksCount} <span className="text-[#FFAA00] text-xs font-normal">High</span>
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
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

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Strategy Profile Card */}
            <div className="p-5 rounded-md bg-[#080808] border border-[#262626] space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-3 border-b border-[#262626]">
                <div>
                  <div className="text-xs uppercase font-mono text-[#858585]">Selected Migration Strategy</div>
                  <h2 className="text-lg font-bold text-[#FFFFFF] mt-0.5">{activeStrategy.name}</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#141414] border border-[#333333] text-[#FFFFFF]">
                    ID: {activeStrategy.id}
                  </span>
                  <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-[#141414] border border-[#333333] text-[#22c55e]">
                    Recommended Strategy
                  </span>
                </div>
              </div>

              <p className="text-sm text-[#B5B5B5] leading-relaxed">{activeStrategy.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
                  <div className="text-xs font-semibold text-[#22c55e] uppercase tracking-wider">
                    Key Advantages
                  </div>
                  <ul className="space-y-1 text-xs text-[#B5B5B5]">
                    {activeStrategy.tradeOffs.advantages.map((adv, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <CheckCircleIcon size={14} className="text-[#22c55e] shrink-0 mt-0.5" />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
                  <div className="text-xs font-semibold text-[#FFAA00] uppercase tracking-wider">
                    Architectural Trade-offs
                  </div>
                  <ul className="space-y-1 text-xs text-[#B5B5B5]">
                    {activeStrategy.tradeOffs.disadvantages.map((dis, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <AlertCircleIcon size={14} className="text-[#FFAA00] shrink-0 mt-0.5" />
                        <span>{dis}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Evolution Roadmap Milestones */}
            <div className="p-5 rounded-md bg-[#080808] border border-[#262626] space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#858585]">
                Architecture Evolution Roadmap ({analysisResult.roadmap.totalWaves} Waves)
              </h3>

              <div className="space-y-2.5">
                {project.waves.map((w) => (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-md bg-[#0D0D0D] border border-[#202020] flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-md bg-[#141414] border border-[#262626] flex items-center justify-center font-mono font-bold text-xs text-[#FFFFFF]">
                        {w.waveNumber}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[#FFFFFF]">{w.title}</div>
                        <div className="text-xs text-[#858585]">{w.objective}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs font-mono">
                      <span className="text-[#858585]">{w.taskIds.length} tasks</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] ${
                          w.status === "completed"
                            ? "bg-[#141414] text-[#22c55e] border border-[#262626]"
                            : "bg-[#141414] text-[#FFFFFF] border border-[#333333]"
                        }`}
                      >
                        {w.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "comparison" && (
          <SourceTargetComparator
            sourceSnapshot={activeScenario.sourceSnapshot}
            targetSnapshot={activeScenario.targetSnapshot}
          />
        )}

        {activeTab === "waves" && (
          <MigrationWavePlanner
            waves={project.waves}
            tasks={project.tasks}
            gates={project.gates}
            activeWaveNumber={activeWaveNumber}
            selectedTaskId={selectedTaskId}
            onSelectWave={setActiveWaveNumber}
            onSelectTask={setSelectedTaskId}
          />
        )}

        {activeTab === "dag" && (
          <DependencyDagViewer
            tasks={project.tasks}
            dependencies={project.dependencies}
            roadmap={analysisResult.roadmap}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
          />
        )}

        {activeTab === "cutover" && (
          <CutoverRollbackInspector
            cutoverPlans={project.cutoverPlans}
            rollbackPlans={project.rollbackPlans}
            waves={project.waves}
          />
        )}

        {activeTab === "timeline" && (
          <IntermediateTimelineViewer
            intermediateStates={project.intermediateStates}
            activeWaveNumber={activeWaveNumber}
            onSelectWave={setActiveWaveNumber}
          />
        )}

        {activeTab === "risks" && (
          <MigrationRiskMatrix risks={project.risks} />
        )}
      </main>
    </div>
  );
}

