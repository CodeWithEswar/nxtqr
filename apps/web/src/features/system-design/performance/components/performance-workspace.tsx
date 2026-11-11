"use client";

import * as React from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { useArchitecturePerformance } from "../hooks/use-architecture-performance";
import { WorkloadProfileEditor } from "./workload-profile-editor";
import { TargetProfileEditor } from "./target-profile-editor";
import { TestPlanPreview } from "./test-plan-preview";
import { PerformanceCharts } from "./performance-charts";
import { PerformanceCanvasOverlay } from "./performance-canvas-overlay";
import { PerformanceComparison } from "./performance-comparison";
import { PerformanceFindings } from "./performance-findings";
import { K6ExportModal } from "./k6-export-modal";
import { BenchmarkImportModal } from "./benchmark-import-modal";
import {
  ActivityIcon,
  PlayIcon,
  ArchiveIcon,
  CheckIcon,
} from "@nxtqr/icons";

export interface PerformanceWorkspaceProps {
  nodes: BaseNode[];
  edges: BaseEdge[];
  architectureId: string;
  projectId: string;
}

export function PerformanceWorkspace({
  nodes,
  edges,
  architectureId,
  projectId,
}: PerformanceWorkspaceProps) {
  const perf = useArchitecturePerformance({
    nodes,
    edges,
    architectureId,
    projectId,
  });

  const [activeTab, setActiveTab] = React.useState<"overview" | "comparison" | "findings">("overview");
  const [isExportOpen, setIsExportOpen] = React.useState(false);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | undefined>();
  const [stressLevel, setStressLevel] = React.useState<number>(1.0);

  return (
    <div className="flex flex-col h-full w-full bg-[#000000] text-white select-none overflow-hidden">
      {/* 1. Global Header & Control Toolbar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-[#080808] border-b border-[#262626]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ActivityIcon className="w-4 h-4 text-white" />
            <h1 className="text-xs font-bold font-mono tracking-tight text-white uppercase">
              Load Testing &amp; Benchmarking Planner
            </h1>
          </div>

          <span className="px-2 py-0.5 rounded-md bg-[#141414] border border-[#262626] font-mono text-[10px] text-[#858585]">
            {perf.workloadProfile.modelType === "closed_loop" ? "Closed-Loop (VUs)" : "Open-Loop (Arrival Rate)"}
          </span>

          <span className="px-2 py-0.5 rounded-md bg-[#141414] border border-[#262626] font-mono text-[10px] text-emerald-400 flex items-center gap-1">
            <CheckIcon className="w-2.5 h-2.5" />
            {perf.definition.environment.name}
          </span>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Target Host Input */}
          <div className="hidden lg:flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#0D0D0D] border border-[#262626]">
            <span className="text-[10px] font-mono text-[#666666]">Host:</span>
            <input
              type="text"
              value={perf.targetHost}
              onChange={(e) => perf.setTargetHost(e.target.value)}
              className="bg-transparent font-mono text-[11px] text-[#B5B5B5] focus:outline-none w-52"
            />
          </div>

          {/* Stress Multiplier */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-[#0D0D0D] border border-[#262626]">
            <span className="text-[10px] font-mono text-[#666666]">Load:</span>
            <select
              value={stressLevel}
              onChange={(e) => setStressLevel(parseFloat(e.target.value))}
              className="bg-transparent font-mono text-[11px] text-white focus:outline-none"
            >
              <option value="0.5">50% Nominal</option>
              <option value="1.0">100% Peak</option>
              <option value="1.5">150% Stress</option>
              <option value="2.0">200% Spike</option>
            </select>
          </div>

          {/* Run Simulation */}
          <button
            type="button"
            onClick={() => perf.runSimulatedBenchmark(stressLevel)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#262626] hover:bg-[#333333] border border-[#404040] text-xs font-mono font-medium text-white transition-colors shadow-level-1"
          >
            <PlayIcon className="w-3.5 h-3.5 text-white" />
            Run Benchmark
          </button>

          {/* Export k6 */}
          <button
            type="button"
            onClick={() => setIsExportOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-xs font-mono text-[#B5B5B5] hover:text-white transition-colors"
          >
            <ArchiveIcon className="w-3.5 h-3.5" />
            Export k6
          </button>

          {/* Import JSON */}
          <button
            type="button"
            onClick={() => setIsImportOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] text-xs font-mono text-[#B5B5B5] hover:text-white transition-colors"
          >
            <ArchiveIcon className="w-3.5 h-3.5" />
            Import Result
          </button>
        </div>
      </header>

      {/* 2. Main Studio 3-Pane Body */}
      <div className="flex-1 flex min-h-0">
        {/* Left Pane: Workload Profile & Targets */}
        <aside className="w-80 lg:w-96 flex flex-col shrink-0 border-r border-[#262626] bg-[#080808]">
          <div className="flex-1 min-h-0 flex flex-col">
            <WorkloadProfileEditor
              profile={perf.workloadProfile}
              operations={perf.operations}
              onModelTypeChange={perf.setModelType}
              onUpdateStage={perf.updateStage}
              onAddStage={perf.addStage}
              onRemoveStage={perf.removeStage}
              onUpdateOperation={perf.updateOperation}
              onAddOperation={perf.addOperation}
              onRemoveOperation={perf.removeOperation}
            />
          </div>
          <div className="h-56 shrink-0 border-t border-[#262626] overflow-y-auto custom-scrollbar">
            <TargetProfileEditor
              targets={perf.targets}
              evaluations={perf.activeRun.targetEvaluations}
              onAddTarget={perf.addTarget}
              onRemoveTarget={perf.removeTarget}
            />
          </div>
        </aside>

        {/* Center & Right Body */}
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {/* Top Sub-Navigation Tabs */}
          <div className="flex items-center justify-between border-b border-[#262626] pb-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1 rounded-md text-xs font-medium font-mono transition-colors border ${
                  activeTab === "overview"
                    ? "bg-[#262626] text-white border-[#404040]"
                    : "bg-[#0D0D0D] text-[#858585] border-[#202020] hover:text-white"
                }`}
              >
                Benchmark Analytics &amp; Plan
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("comparison")}
                className={`px-3 py-1 rounded-md text-xs font-medium font-mono transition-colors border ${
                  activeTab === "comparison"
                    ? "bg-[#262626] text-white border-[#404040]"
                    : "bg-[#0D0D0D] text-[#858585] border-[#202020] hover:text-white"
                }`}
              >
                Regression &amp; Comparison ({perf.runs.length} runs)
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("findings")}
                className={`px-3 py-1 rounded-md text-xs font-medium font-mono transition-colors border ${
                  activeTab === "findings"
                    ? "bg-[#262626] text-white border-[#404040]"
                    : "bg-[#0D0D0D] text-[#858585] border-[#202020] hover:text-white"
                }`}
              >
                Findings ({perf.findings.length})
              </button>
            </div>

            {/* Run Selector */}
            <div className="flex items-center gap-2 font-mono text-[11px] text-[#858585]">
              <span>Active Run:</span>
              <select
                value={perf.activeRunId}
                onChange={(e) => perf.setActiveRunId(e.target.value)}
                className="bg-[#141414] border border-[#262626] rounded-md px-2 py-0.5 text-white focus:outline-none"
              >
                {perf.runs.map((r) => (
                  <option key={r.id} value={r.id}>
                    Run #{r.runNumber} ({r.overallSummary.achievedRps.toFixed(0)} RPS, {r.overallSummary.p95LatencyMs.toFixed(0)}ms)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tab 1: Overview */}
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Planned Timeline Curve */}
              <TestPlanPreview profile={perf.workloadProfile} />

              {/* Empirical Benchmark Run Metrics & Histogram */}
              <PerformanceCharts run={perf.activeRun} />

              {/* Architecture Node Benchmark Attribution */}
              <PerformanceCanvasOverlay
                nodes={nodes}
                activeRun={perf.activeRun}
                bottleneckValidations={perf.bottleneckValidations}
                selectedComponentId={selectedNodeId}
                onSelectComponent={setSelectedNodeId}
              />
            </div>
          )}

          {/* Tab 2: Comparison & Regressions */}
          {activeTab === "comparison" && (
            <PerformanceComparison
              runs={perf.runs}
              baselineRun={perf.baselineRun}
              candidateRun={perf.candidateRun}
              comparisonResult={perf.comparisonResult}
              calibrationProposals={perf.calibrationProposals}
              onSelectBaseline={perf.setBaselineRunId}
              onSelectCandidate={perf.setCandidateRunId}
            />
          )}

          {/* Tab 3: Findings */}
          {activeTab === "findings" && (
            <PerformanceFindings findings={perf.findings} />
          )}
        </main>
      </div>

      {/* 3. Export Modal */}
      <K6ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        scriptContent={perf.exportK6Script()}
        definition={perf.definition}
      />

      {/* 4. Import Modal */}
      <BenchmarkImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImport={perf.importK6Json}
      />
    </div>
  );
}
