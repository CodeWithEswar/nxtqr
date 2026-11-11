"use client";

/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Complete Unified Orchestration Workspace Component
 */

import React from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { useArchitectureOrchestration } from "../hooks/use-architecture-orchestration";
import { OrchestrationPanel } from "./orchestration-panel";
import { ExecutionDagView } from "./execution-dag-view";
import { UnifiedFindingsView } from "./unified-findings-view";
import { CorrelationInspectorView } from "./correlation-inspector-view";
import { ContradictionInspectorView } from "./contradiction-inspector-view";
import { AnalyzerExplorerView } from "./analyzer-explorer-view";
import { ShieldIcon, AlertCircleIcon, ActivityIcon, LayersIcon } from "@nxtqr/icons";

interface OrchestrationWorkspaceProps {
  nodes: BaseNode[];
  edges: BaseEdge[];
  projectId?: string;
  architectureId?: string;
  onSelectComponent?: (componentId: string) => void;
}

export function OrchestrationWorkspace({
  nodes,
  edges,
  projectId = "default-project",
  architectureId = "default-arch",
  onSelectComponent,
}: OrchestrationWorkspaceProps) {
  const {
    assessment,
    plan,
    isOrchestrating,
    error,
    activeTab,
    selectedAnalyzerId,
    registeredAnalyzers,
    runOrchestration,
    cancelOrchestration,
    setActiveTab,
    setSelectedAnalyzerId,
  } = useArchitectureOrchestration({
    nodes,
    edges,
    projectId,
    architectureId,
  });

  return (
    <div className="flex h-full flex-col bg-[#000000] text-[#FFFFFF]">
      <OrchestrationPanel
        assessment={assessment}
        plan={plan}
        isOrchestrating={isOrchestrating}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRunOrchestration={() => runOrchestration()}
        onCancelOrchestration={cancelOrchestration}
      />

      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-md border border-[#4d1f1f] bg-[#2d0f0f] p-4 text-xs text-[#ef4444]">
            <AlertCircleIcon className="h-4 w-4 shrink-0" />
            <span>Orchestration Error: {error}</span>
          </div>
        )}

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {!assessment ? (
              <div className="flex flex-col items-center justify-center rounded-md border border-[#262626] bg-[#080808] p-16 text-center">
                <LayersIcon className="h-10 w-10 text-[#666666] mb-3" />
                <h3 className="text-base font-medium text-[#FFFFFF]">Architecture Intelligence Orchestrator</h3>
                <p className="text-xs text-[#858585] mt-1 max-w-md">
                  Coordinate all 11 architecture intelligence engines into one dependency-aware execution DAG.
                  Click &ldquo;Run Unified Orchestration&rdquo; above to analyze.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Executive Cards */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-md border border-[#262626] bg-[#0D0D0D] p-4">
                    <div className="flex items-center gap-2 mb-2 text-[#858585]">
                      <ShieldIcon className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Health Evaluation</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#FFFFFF]">
                      {assessment.healthScore}/100
                    </div>
                    <p className="text-xs text-[#858585] mt-1">
                      Computed across structural validation, security, availability, and performance.
                    </p>
                  </div>

                  <div className="rounded-md border border-[#262626] bg-[#0D0D0D] p-4">
                    <div className="flex items-center gap-2 mb-2 text-[#858585]">
                      <ActivityIcon className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Compound Risks</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#FFFFFF]">
                      {assessment.correlationGroups.length}
                    </div>
                    <p className="text-xs text-[#858585] mt-1">
                      Architectural components exhibiting overlapping multi-discipline vulnerabilities.
                    </p>
                  </div>

                  <div className="rounded-md border border-[#262626] bg-[#0D0D0D] p-4">
                    <div className="flex items-center gap-2 mb-2 text-[#858585]">
                      <AlertCircleIcon className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wider">Contradictions</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#FFFFFF]">
                      {assessment.contradictions.length}
                    </div>
                    <p className="text-xs text-[#858585] mt-1">
                      Mutually inconsistent assumptions or empirical verification gaps detected.
                    </p>
                  </div>
                </div>

                {/* Top Unified Recommendations */}
                {assessment.recommendations.length > 0 && (
                  <div className="rounded-md border border-[#262626] bg-[#0D0D0D] p-5">
                    <h4 className="text-sm font-semibold text-[#FFFFFF] mb-3">
                      Prioritized Unified Recommendations
                    </h4>
                    <div className="space-y-3">
                      {assessment.recommendations.slice(0, 4).map((rec) => (
                        <div
                          key={rec.id}
                          className="rounded-md border border-[#1A1A1A] bg-[#080808] p-3 text-xs"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <span className="font-semibold text-[#FFFFFF]">{rec.title}</span>
                            <span
                              className={`rounded px-1.5 py-0.2 font-mono text-[9px] uppercase font-bold ${
                                rec.severity === "critical"
                                  ? "text-[#ef4444] bg-[#2d0f0f]"
                                  : rec.severity === "high"
                                  ? "text-[#f59e0b] bg-[#261d0f]"
                                  : "text-[#B5B5B5] bg-[#141414]"
                              }`}
                            >
                              {rec.severity}
                            </span>
                          </div>
                          <p className="text-[#B5B5B5] mb-2">{rec.description}</p>
                          <div className="text-[11px] text-[#858585]">
                            <strong>Steps:</strong> {rec.remediationSteps.join("; ")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Waves & DAG */}
        {activeTab === "waves" && (
          <ExecutionDagView
            plan={plan}
            runs={assessment?.analyzerRuns}
            onSelectAnalyzer={(id) => {
              setSelectedAnalyzerId(id);
              setActiveTab("analyzers");
            }}
          />
        )}

        {/* Tab 3: Findings */}
        {activeTab === "findings" && (
          <UnifiedFindingsView
            findings={assessment?.findings || []}
            onSelectComponent={onSelectComponent}
          />
        )}

        {/* Tab 4: Correlations */}
        {activeTab === "correlations" && (
          <CorrelationInspectorView
            groups={assessment?.correlationGroups || []}
            onSelectComponent={onSelectComponent}
          />
        )}

        {/* Tab 5: Contradictions */}
        {activeTab === "contradictions" && (
          <ContradictionInspectorView
            contradictions={assessment?.contradictions || []}
            onSelectComponent={onSelectComponent}
          />
        )}

        {/* Tab 6: Recommendations */}
        {activeTab === "recommendations" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#262626] pb-3">
              <h3 className="text-sm font-semibold text-[#FFFFFF]">Unified Architecture Recommendations</h3>
              <span className="rounded-md bg-[#141414] px-2 py-0.5 text-xs text-[#B5B5B5] border border-[#262626]">
                {assessment?.recommendations.length || 0} Consolidated Actions
              </span>
            </div>

            <div className="space-y-3">
              {(assessment?.recommendations || []).map((rec) => (
                <div
                  key={rec.id}
                  className="rounded-md border border-[#262626] bg-[#0D0D0D] p-4 text-xs hover:border-[#333333] transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[10px] uppercase font-bold ${
                            rec.severity === "critical"
                              ? "text-[#ef4444] bg-[#2d0f0f] border border-[#4d1f1f]"
                              : rec.severity === "high"
                              ? "text-[#f59e0b] bg-[#261d0f] border border-[#473215]"
                              : "text-[#B5B5B5] bg-[#141414] border border-[#262626]"
                          }`}
                        >
                          {rec.severity}
                        </span>
                        <span className="font-mono text-xs text-[#858585]">Effort: {rec.effort}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#FFFFFF]">{rec.title}</h4>
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {rec.affectedComponentIds.map((cid) => (
                        <button
                          key={cid}
                          onClick={() => onSelectComponent?.(cid)}
                          className="rounded bg-[#141414] px-1.5 py-0.5 font-mono text-[10px] text-[#B5B5B5] border border-[#262626] hover:border-[#404040]"
                        >
                          {cid}
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-[#B5B5B5] mb-3">{rec.description}</p>

                  <div className="rounded-md bg-[#080808] p-3 border border-[#1A1A1A]">
                    <div className="text-[11px] font-semibold text-[#858585] mb-1.5 uppercase tracking-wider">
                      Remediation Sequence
                    </div>
                    <ul className="space-y-1">
                      {rec.remediationSteps.map((step, sIdx) => (
                        <li key={sIdx} className="flex items-start gap-2 text-xs text-[#B5B5B5]">
                          <span className="text-[#858585]">{sIdx + 1}.</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 7: Analyzers */}
        {activeTab === "analyzers" && (
          <AnalyzerExplorerView
            analyzers={registeredAnalyzers}
            runs={assessment?.analyzerRuns}
            selectedAnalyzerId={selectedAnalyzerId}
            onSelectAnalyzer={setSelectedAnalyzerId}
          />
        )}
      </div>
    </div>
  );
}
