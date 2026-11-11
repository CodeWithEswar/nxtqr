"use client";

/**
 * NXTQR — Phase 05.3.28: Architecture Testing, Verification & Readiness Gates Intelligence Engine
 * Master Studio Shell: Verification Workspace
 */

import React, { useState } from "react";
import { useArchitectureVerification } from "../hooks/use-architecture-verification";
import { TestExecutionPanel } from "./test-execution-panel";
import { TestRegistryView } from "./test-registry-view";
import { VisualAssertionBuilder } from "./visual-assertion-builder";
import { TestSuiteExplorer } from "./test-suite-explorer";
import { TestResultInspector } from "./test-result-inspector";
import { TraceabilityMatrixView } from "./traceability-matrix-view";
import { CoverageExplorerView } from "./coverage-explorer-view";
import { RegressionComparisonView } from "./regression-comparison-view";
import { ReadinessGateManager } from "./readiness-gate-manager";
import { LayersIcon } from "@nxtqr/icons";

export function VerificationWorkspace() {
  const [activeTab, setActiveTab] = useState<
    "registry" | "assertion" | "suites" | "results" | "traceability" | "coverage" | "regressions" | "gates"
  >("gates");

  const {
    scenarios,
    activeArchitecture,
    setActiveScenarioId,
    allSuites,
    allTests,
    allGates,
    selectedSuiteId,
    setSelectedSuiteId,
    selectedTestId,
    setSelectedTestId,
    selectedTest,
    simulationPreset,
    setSimulationPreset,
    analysisResult,
    exceptions,
    handleAddException,
  } = useArchitectureVerification();

  const tabs = [
    { id: "gates", label: "Readiness Gates" },
    { id: "results", label: "Test Results (4-State)" },
    { id: "registry", label: "Test Registry" },
    { id: "assertion", label: "Rule Builder" },
    { id: "suites", label: "Test Suites" },
    { id: "traceability", label: "Traceability Matrix" },
    { id: "coverage", label: "Coverage Meters" },
    { id: "regressions", label: "Regression Diff" },
  ] as const;

  return (
    <div className="flex flex-col min-h-screen bg-[#000000] text-[#FFFFFF] select-none">
      {/* Studio Top Bar */}
      <header className="h-14 border-b border-[#262626] bg-[#080808] px-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayersIcon size={18} className="text-[#FFFFFF]" />
            <span className="font-bold text-sm tracking-tight text-[#FFFFFF]">
              ARCHITECTURE VERIFICATION & GATES
            </span>
          </div>

          <div className="h-4 w-px bg-[#262626]" />

          {/* Architecture Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#858585] font-mono">Topology:</span>
            <select
              value={activeArchitecture.id}
              onChange={(e) => setActiveScenarioId(e.target.value)}
              className="bg-[#0D0D0D] border border-[#262626] text-xs font-mono text-[#FFFFFF] rounded-md px-2.5 py-1 focus:outline-none focus:border-[#404040]"
            >
              {scenarios.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Simulation / What-If Presets */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-[#858585] font-mono hidden sm:inline">What-If:</span>
          <select
            value={simulationPreset || "none"}
            onChange={(e) =>
              setSimulationPreset(e.target.value === "none" ? null : e.target.value)
            }
            className="bg-[#0D0D0D] border border-[#262626] text-xs font-mono text-[#FFAA00] rounded-md px-2.5 py-1 focus:outline-none focus:border-[#404040]"
          >
            <option value="none">Baseline State (Compliant)</option>
            <option value="break_security_auth">Simulate: Disabled Gateway Auth</option>
            <option value="remove_backup_evidence">Simulate: Missing DB Backup Evidence</option>
            <option value="expire_evidence">Simulate: Expired Stale Metrics (48h)</option>
            <option value="candidate_regression">Simulate: Candidate Regression Diff</option>
          </select>
        </div>
      </header>

      {/* Main Studio Body */}
      <main className="flex-1 p-4 md:p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Test Execution Summary */}
        <TestExecutionPanel
          summary={analysisResult.run.summary}
          evaluatorVersion={analysisResult.run.evaluatorVersion}
          onRerun={() => {}}
        />

        {/* Studio Navigation Tabs */}
        <div className="border-b border-[#262626] flex items-center gap-2 overflow-x-auto pb-1">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-2 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                  isActive
                    ? "bg-[#1A1A1A] text-[#FFFFFF] border border-[#404040] shadow-level-3 font-semibold"
                    : "text-[#858585] hover:text-[#FFFFFF] hover:bg-[#0D0D0D]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Active Tab Panel */}
        {activeTab === "gates" && (
          <ReadinessGateManager
            gates={allGates}
            gateEvaluations={analysisResult.gateEvaluations}
            exceptions={exceptions}
            onAddException={handleAddException}
          />
        )}

        {activeTab === "results" && (
          <TestResultInspector
            results={analysisResult.run.results}
            tests={allTests}
            selectedTestId={selectedTestId}
            onSelectTest={setSelectedTestId}
          />
        )}

        {activeTab === "registry" && (
          <TestRegistryView
            tests={allTests}
            selectedTestId={selectedTestId}
            onSelectTest={setSelectedTestId}
          />
        )}

        {activeTab === "assertion" && <VisualAssertionBuilder test={selectedTest} />}

        {activeTab === "suites" && (
          <TestSuiteExplorer
            suites={allSuites}
            allTests={allTests}
            selectedSuiteId={selectedSuiteId}
            onSelectSuite={setSelectedSuiteId}
          />
        )}

        {activeTab === "traceability" && (
          <TraceabilityMatrixView traceability={analysisResult.traceability} />
        )}

        {activeTab === "coverage" && (
          <CoverageExplorerView coverage={analysisResult.coverage} />
        )}

        {activeTab === "regressions" && (
          <RegressionComparisonView regressions={analysisResult.regressions} />
        )}
      </main>
    </div>
  );
}

