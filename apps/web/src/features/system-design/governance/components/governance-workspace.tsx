"use client";

/**
 * NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
 * Master Architecture Governance Studio Workspace
 */

import React from "react";
import {
  useArchitectureGovernance,
  type UseArchitectureGovernanceProps,
  type GovernanceTab,
} from "../hooks/use-architecture-governance";
import { GovernanceExplorer } from "./governance-explorer";
import { PolicyEvaluationInspector } from "./policy-evaluation-inspector";
import { VisualRuleBuilder } from "./visual-rule-builder";
import { EvidenceExplorer } from "./evidence-explorer";
import { ExceptionReviewView } from "./exception-review-view";
import { GovernanceDriftView } from "./governance-drift-view";
import { FrameworkMappingView } from "./framework-mapping-view";
import {
  ShieldIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  HelpCircleIcon,
  CalendarIcon,
  LayersIcon,
  BookOpenIcon,
  CpuIcon,
  PlayIcon,
} from "@nxtqr/icons";

export function GovernanceWorkspace(props: UseArchitectureGovernanceProps) {
  const {
    topology,
    activeTab,
    setActiveTab,
    selectedPolicyId,
    setSelectedPolicyId,
    selectedPolicy,
    selectedBundleId,
    setSelectedBundleId,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    severityFilter,
    setSeverityFilter,
    analysisResult,
    addException,
    revokeException,
    addEvidence,
    runSimulation,
    simulationResult,
  } = useArchitectureGovernance(props);

  const s = analysisResult.summary;

  return (
    <div className="flex flex-col h-full w-full bg-[#000000] text-white overflow-hidden select-none font-sans">
      {/* Top Governance KPI Summary Bar */}
      <header className="p-3 bg-[#080808] border-b border-[#262626] flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldIcon size={18} className="text-white" />
            <h1 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
              Architecture Governance & Policy-as-Code
            </h1>
          </div>

          {s.hasBlockingViolations ? (
            <span className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#ef4444] bg-[#0D0D0D] border border-[#262626] px-2.5 py-0.5 rounded-md">
              <AlertCircleIcon size={14} /> BLOCKING VIOLATIONS DETECTED
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-mono font-medium text-[#22c55e] bg-[#0D0D0D] border border-[#262626] px-2.5 py-0.5 rounded-md">
              <CheckCircleIcon size={14} /> RELEASE READINESS GATE CLEAR
            </span>
          )}
        </div>

        {/* Metrics Pill Grid */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <div className="px-2.5 py-1 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center gap-1.5">
            <span className="text-[#858585]">EVALUATED:</span>
            <span className="text-white font-bold">{s.evaluatedRulesCount}</span>
          </div>

          <div className="px-2.5 py-1 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center gap-1.5 text-[#22c55e]">
            <CheckCircleIcon size={12} />
            <span>{s.passedCount} PASS</span>
          </div>

          <div className="px-2.5 py-1 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center gap-1.5 text-[#ef4444]">
            <AlertCircleIcon size={12} />
            <span>{s.failedCount} FAIL</span>
          </div>

          <div className="px-2.5 py-1 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center gap-1.5 text-[#eab308]">
            <HelpCircleIcon size={12} />
            <span>{s.unknownCount} NO PROOF</span>
          </div>

          <div className="px-2.5 py-1 bg-[#0D0D0D] border border-[#202020] rounded-md flex items-center gap-1.5 text-[#B5B5B5]">
            <CalendarIcon size={12} />
            <span>{s.activeExceptionsCount} WAIVERS</span>
          </div>
        </div>
      </header>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between bg-[#080808] border-b border-[#262626] px-3 py-1.5 shrink-0">
        <div className="flex items-center gap-1">
          {[
            { id: "overview", label: "Overview & Inspector", icon: ShieldIcon },
            { id: "policies", label: "Rule AST", icon: LayersIcon },
            { id: "evidence", label: "Evidence Proof", icon: ShieldIcon },
            { id: "exceptions", label: "Exceptions & Waivers", icon: CalendarIcon },
            { id: "drift", label: "Baseline & Drift", icon: AlertCircleIcon },
            { id: "frameworks", label: "Frameworks", icon: BookOpenIcon },
            { id: "simulation", label: "What-If Simulation", icon: CpuIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as GovernanceTab)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  isActive
                    ? "bg-[#1A1A1A] text-white border border-[#333333]"
                    : "text-[#858585] hover:text-white hover:bg-[#0D0D0D] border border-transparent"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Explorer Sidebar */}
        <aside className="w-80 shrink-0 border-r border-[#262626] h-full">
          <GovernanceExplorer
            bundles={topology.bundles}
            policies={topology.policies}
            evaluations={analysisResult.evaluations}
            selectedPolicyId={selectedPolicyId}
            onSelectPolicy={setSelectedPolicyId}
            selectedBundleId={selectedBundleId}
            onSelectBundle={setSelectedBundleId}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            severityFilter={severityFilter}
            onSeverityFilterChange={setSeverityFilter}
          />
        </aside>

        {/* Center / Right Content Panel */}
        <section className="flex-1 h-full overflow-hidden">
          {activeTab === "overview" && selectedPolicy && (
            <PolicyEvaluationInspector
              policy={selectedPolicy}
              evaluations={analysisResult.evaluations}
              evidence={topology.evidence}
              exceptions={topology.exceptions}
              onRequestException={() => {
                setActiveTab("exceptions");
              }}
            />
          )}

          {activeTab === "policies" && selectedPolicy && (
            <div className="p-4 h-full overflow-y-auto space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#262626]">
                <h2 className="text-sm font-bold text-white">
                  Declarative Rule AST: {selectedPolicy.title}
                </h2>
                <span className="text-xs font-mono text-[#858585]">
                  Policy ID: {selectedPolicy.id}
                </span>
              </div>
              <VisualRuleBuilder rule={selectedPolicy.rule} />
            </div>
          )}

          {activeTab === "evidence" && (
            <EvidenceExplorer
              evidence={topology.evidence}
              onAddEvidence={addEvidence}
            />
          )}

          {activeTab === "exceptions" && (
            <ExceptionReviewView
              exceptions={topology.exceptions}
              onAddException={addException}
              onRevokeException={revokeException}
            />
          )}

          {activeTab === "drift" && (
            <GovernanceDriftView
              drift={analysisResult.drift}
              baselines={topology.baselines}
            />
          )}

          {activeTab === "frameworks" && (
            <FrameworkMappingView policies={topology.policies} />
          )}

          {activeTab === "simulation" && (
            <div className="p-4 h-full overflow-y-auto space-y-4">
              <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <CpuIcon size={16} /> Non-Destructive What-If Policy Simulator
                  </h3>
                  <button
                    onClick={() => {
                      runSimulation({
                        candidateGraphDiff: {
                          modifiedAttributes: {
                            "svc-legacy-billing": { hasMtlsEnabled: true, hasCircuitBreaker: true },
                          },
                        },
                      });
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium text-white bg-[#1A1A1A] hover:bg-[#262626] border border-[#333333] rounded-md transition-colors"
                  >
                    <PlayIcon size={14} /> Run Proposed Remediation Simulation
                  </button>
                </div>
                <p className="text-xs text-[#858585]">
                  Simulates applying internal strict mTLS and circuit breakers to legacy billing service to evaluate net compliance impact.
                </p>
              </div>

              {simulationResult && (
                <div className="p-4 bg-[#080808] border border-[#262626] rounded-md space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase text-[#858585]">Net Compliance Impact</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md border ${
                        simulationResult.netComplianceImpact === "improved"
                          ? "text-[#22c55e] border-[#262626] bg-[#0D0D0D]"
                          : "text-[#B5B5B5] border-[#262626] bg-[#0D0D0D]"
                      }`}
                    >
                      {simulationResult.netComplianceImpact.toUpperCase()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-[#0D0D0D] border border-[#202020] rounded-md">
                      <span className="text-[#858585] block">RESOLVED VIOLATIONS</span>
                      <span className="text-white font-bold">{simulationResult.resolvedViolationsCount}</span>
                    </div>
                    <div className="p-2 bg-[#0D0D0D] border border-[#202020] rounded-md">
                      <span className="text-[#858585] block">NEW VIOLATIONS</span>
                      <span className="text-white font-bold">{simulationResult.newViolationsCount}</span>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-[#666666]">Simulation Log</span>
                    <div className="p-2 bg-[#000000] border border-[#1A1A1A] rounded-md text-[11px] text-[#B5B5B5] space-y-1">
                      {simulationResult.details.map((d, i) => (
                        <div key={i}>{d}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
