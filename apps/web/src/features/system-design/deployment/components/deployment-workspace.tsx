"use client";

/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Master Studio Workspace Component
 */

import React, { useState } from "react";
import type { BaseNode } from "@nxtqr/graph-schema";
import { useArchitectureDeployment } from "../hooks/use-architecture-deployment";
import { InfrastructureCatalog } from "./infrastructure-catalog";
import { TopologyCanvas } from "./topology-canvas";
import { ResourceInspector } from "./resource-inspector";
import { MappingEditor } from "./mapping-editor";
import { NetworkInspector } from "./network-inspector";
import { DriftInspector } from "./drift-inspector";
import { ImportPreviewModal } from "./import-preview-modal";
import {
  LayersIcon,
  ActivityIcon,
} from "@nxtqr/icons";

interface DeploymentWorkspaceProps {
  projectId?: string;
  architectureId?: string;
  logicalNodes?: BaseNode[];
}

export function DeploymentWorkspace({
  projectId = "default-project",
  architectureId = "arch-main",
  logicalNodes = [],
}: DeploymentWorkspaceProps) {
  const {
    environments,
    activeEnvId,
    setActiveEnvironment,
    viewMode,
    setViewMode,
    topology,
    selectedResourceId,
    setSelectedResourceId,
    probeSourceId,
    probeTargetId,
    networkPathResult,
    evaluatePath,
    validationFindings,
    failureDomains,
    reliabilityMetrics,
    driftFindings,
    runAssessment,
    addResource,
    removeResource,
    addMapping,
    removeMapping,
    isImportModalOpen,
    setIsImportModalOpen,
    importIaC,
  } = useArchitectureDeployment({ projectId, architectureId, logicalNodes });

  // Tab selections
  const [leftTab, setLeftTab] = useState<"catalog" | "mappings">("catalog");
  const [rightTab, setRightTab] = useState<"inspector" | "network" | "drift" | "assessment">(
    "inspector"
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#000000] text-[#FFFFFF] select-none overflow-hidden">
      {/* Top Studio Toolbar */}
      <header className="flex items-center justify-between px-4 py-2 bg-[#080808] border-b border-[#262626] shrink-0">
        {/* Left: Environment Selector & Title */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayersIcon size={16} className="text-[#FFFFFF]" />
            <span className="text-xs font-bold tracking-tight text-[#FFFFFF]">DEPLOYMENT TOPOLOGY</span>
          </div>

          <div className="h-4 w-[1px] bg-[#262626]" />

          {/* Environment dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-mono text-[#858585]">Environment:</span>
            <select
              value={activeEnvId}
              onChange={(e) => setActiveEnvironment(e.target.value)}
              className="bg-[#0D0D0D] border border-[#262626] focus:border-[#404040] rounded-md px-2 py-1 text-xs font-mono text-[#FFFFFF] outline-none"
            >
              {environments.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center: View Mode Switcher */}
        <div className="flex items-center gap-1 p-1 rounded-md bg-[#0D0D0D] border border-[#202020]">
          {(
            [
              { id: "deployment", label: "Topology" },
              { id: "logical", label: "Logical Map" },
              { id: "network", label: "Network Paths" },
              { id: "regions", label: "Failure Domains" },
            ] as const
          ).map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setViewMode(m.id);
                if (m.id === "logical") setLeftTab("mappings");
                if (m.id === "network") setRightTab("network");
                if (m.id === "regions") setRightTab("assessment");
              }}
              className={`px-2.5 py-1 text-xs font-mono rounded-md border transition-colors ${
                viewMode === m.id
                  ? "bg-[#1A1A1A] border-[#404040] text-[#FFFFFF]"
                  : "bg-transparent border-transparent text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* Right: Actions & Telemetry Summary */}
        <div className="flex items-center gap-2">
          {reliabilityMetrics && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#0D0D0D] border border-[#262626] text-xs font-mono">
              <span className="text-[#858585]">Multi-AZ:</span>
              <span className="text-[#FFFFFF] font-bold">
                {reliabilityMetrics.multiAzRedundancyScore}%
              </span>
            </div>
          )}

          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#141414] border border-[#262626] hover:border-[#404040] text-xs font-mono text-[#FFFFFF] transition-colors"
          >
            <LayersIcon size={13} />
            <span>Import IaC</span>
          </button>

          <button
            onClick={() => {
              runAssessment();
              setRightTab("assessment");
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#333333] hover:border-[#404040] text-xs font-mono text-[#FFFFFF] transition-colors"
          >
            <ActivityIcon size={13} />
            <span>Assess Topology</span>
          </button>
        </div>
      </header>

      {/* Main 3-Pane Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left Pane: Catalog & Mapping Tabs */}
        <aside className="w-72 shrink-0 flex flex-col bg-[#080808] border-r border-[#262626]">
          {/* Tab Selector */}
          <div className="flex border-b border-[#202020] bg-[#0D0D0D]">
            <button
              onClick={() => setLeftTab("catalog")}
              className={`flex-1 py-2 text-xs font-mono font-medium transition-colors border-b-2 ${
                leftTab === "catalog"
                  ? "border-[#404040] text-[#FFFFFF] bg-[#080808]"
                  : "border-transparent text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              Infra Catalog
            </button>
            <button
              onClick={() => setLeftTab("mappings")}
              className={`flex-1 py-2 text-xs font-mono font-medium transition-colors border-b-2 ${
                leftTab === "mappings"
                  ? "border-[#404040] text-[#FFFFFF] bg-[#080808]"
                  : "border-transparent text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              Logical Mappings
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {leftTab === "catalog" ? (
              <InfrastructureCatalog
                onAddResource={(type, label) =>
                  addResource({
                    name: `${label} (${topology.resources.length + 1})`,
                    type,
                  })
                }
              />
            ) : (
              <MappingEditor
                logicalNodes={logicalNodes}
                topology={topology}
                onAddMapping={addMapping}
                onRemoveMapping={removeMapping}
              />
            )}
          </div>
        </aside>

        {/* Center Pane: Hierarchical Topology Canvas */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#000000] relative">
          <TopologyCanvas
            topology={topology}
            selectedResourceId={selectedResourceId}
            onSelectResource={(id) => {
              setSelectedResourceId(id);
              if (id) setRightTab("inspector");
            }}
            probeSourceId={probeSourceId}
            probeTargetId={probeTargetId}
            viewMode={viewMode}
          />
        </main>

        {/* Right Pane: Inspectors & Assessments */}
        <aside className="w-80 shrink-0 flex flex-col bg-[#080808] border-l border-[#262626]">
          {/* Tab Selector */}
          <div className="flex border-b border-[#202020] bg-[#0D0D0D]">
            <button
              onClick={() => setRightTab("inspector")}
              className={`flex-1 py-2 text-xs font-mono font-medium transition-colors border-b-2 ${
                rightTab === "inspector"
                  ? "border-[#404040] text-[#FFFFFF] bg-[#080808]"
                  : "border-transparent text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              Inspector
            </button>
            <button
              onClick={() => setRightTab("network")}
              className={`flex-1 py-2 text-xs font-mono font-medium transition-colors border-b-2 ${
                rightTab === "network"
                  ? "border-[#404040] text-[#FFFFFF] bg-[#080808]"
                  : "border-transparent text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              Probe
            </button>
            <button
              onClick={() => setRightTab("drift")}
              className={`flex-1 py-2 text-xs font-mono font-medium transition-colors border-b-2 ${
                rightTab === "drift"
                  ? "border-[#404040] text-[#FFFFFF] bg-[#080808]"
                  : "border-transparent text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              Drift
            </button>
            <button
              onClick={() => setRightTab("assessment")}
              className={`flex-1 py-2 text-xs font-mono font-medium transition-colors border-b-2 ${
                rightTab === "assessment"
                  ? "border-[#404040] text-[#FFFFFF] bg-[#080808]"
                  : "border-transparent text-[#858585] hover:text-[#FFFFFF]"
              }`}
            >
              Health
            </button>
          </div>

          <div className="flex-1 min-h-0 overflow-hidden">
            {rightTab === "inspector" && (
              <ResourceInspector
                topology={topology}
                selectedResourceId={selectedResourceId}
                onRemoveResource={removeResource}
                onSetProbeSource={(id) => {
                  evaluatePath(id, probeTargetId || "");
                  setRightTab("network");
                }}
                onSetProbeTarget={(id) => {
                  evaluatePath(probeSourceId || "", id);
                  setRightTab("network");
                }}
              />
            )}

            {rightTab === "network" && (
              <NetworkInspector
                topology={topology}
                probeSourceId={probeSourceId}
                probeTargetId={probeTargetId}
                networkPathResult={networkPathResult}
                onEvaluatePath={evaluatePath}
              />
            )}

            {rightTab === "drift" && <DriftInspector findings={driftFindings} />}

            {rightTab === "assessment" && (
              <div className="flex flex-col h-full bg-[#080808] p-3 space-y-4 overflow-y-auto">
                <div className="border-b border-[#262626] pb-3">
                  <span className="text-[10px] font-mono uppercase text-[#858585] tracking-wider block">
                    Resilience & Architecture Health
                  </span>
                  <h3 className="text-sm font-semibold text-[#FFFFFF] mt-1">
                    Failure Domains & Multi-AZ
                  </h3>
                </div>

                {/* Score Cards */}
                {reliabilityMetrics && (
                  <div className="grid grid-cols-2 gap-2 text-center text-xs font-mono">
                    <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
                      <span className="text-[#858585] text-[10px] block">Multi-AZ Redundancy</span>
                      <span className="text-base font-bold text-[#FFFFFF]">
                        {reliabilityMetrics.multiAzRedundancyScore}%
                      </span>
                    </div>
                    <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020]">
                      <span className="text-[#858585] text-[10px] block">Overall Reliability</span>
                      <span className="text-base font-bold text-[#FFFFFF]">
                        {reliabilityMetrics.overallScore}%
                      </span>
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {reliabilityMetrics?.recommendations && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-[#858585] uppercase tracking-wider block">
                      Reliability Action Items
                    </span>
                    <ul className="text-xs text-[#B5B5B5] space-y-1.5">
                      {reliabilityMetrics.recommendations.map((rec, i) => (
                        <li key={i} className="p-2 rounded-md bg-[#0D0D0D] border border-[#202020]">
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Failure Domains List */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-semibold text-[#858585] uppercase tracking-wider block">
                    Identified Failure Domains ({failureDomains.length})
                  </span>
                  {failureDomains.map((fd) => (
                    <div
                      key={fd.domainId}
                      className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-[#FFFFFF]">{fd.name}</span>
                        <span
                          className={`text-[10px] font-mono uppercase px-1.5 py-0.5 rounded border ${
                            fd.riskLevel === "critical" || fd.riskLevel === "high"
                              ? "text-[#FFFFFF] bg-[#1A1A1A] border-[#404040]"
                              : "text-[#B5B5B5] bg-[#141414] border-[#262626]"
                          }`}
                        >
                          {fd.riskLevel}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#858585] leading-relaxed">{fd.description}</p>
                    </div>
                  ))}
                  {failureDomains.length === 0 && (
                    <div className="text-[11px] font-mono text-[#666666] py-3 text-center border border-dashed border-[#202020] rounded-md">
                      Click &ldquo;Assess Topology&rdquo; to analyze failure domains and blast radius.
                    </div>
                  )}
                </div>

                {/* Validation Findings */}
                {validationFindings.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-[#858585] uppercase tracking-wider block">
                      Topology Validation Issues ({validationFindings.length})
                    </span>
                    {validationFindings.map((vf) => (
                      <div
                        key={vf.id}
                        className="p-2 rounded-md bg-[#0D0D0D] border border-[#333333] text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-[#FFFFFF]">{vf.title}</span>
                          <span className="text-[10px] font-mono uppercase px-1 rounded bg-[#1A1A1A] text-[#B5B5B5]">
                            {vf.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#858585]">{vf.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* IaC Import Modal */}
      <ImportPreviewModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        environmentId={activeEnvId}
        onConfirmImport={importIaC}
      />
    </div>
  );
}

