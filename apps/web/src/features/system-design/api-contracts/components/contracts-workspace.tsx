"use client";

/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Master Studio API Contracts Workspace Shell
 */

import React, { useState } from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { APIContract, ServiceInterface, ConsumerDependency } from "@nxtqr/architecture-intelligence";
import { useArchitectureContracts } from "../hooks/use-architecture-contracts";
import { ContractExplorer } from "./contract-explorer";
import { ContractDetail } from "./contract-detail";
import { OperationInspector } from "./operation-inspector";
import { SchemaInspector } from "./schema-inspector";
import { ContractImportModal } from "./contract-import-modal";
import { LayersIcon, AlertTriangleIcon } from "@nxtqr/icons";

export interface ContractsWorkspaceProps {
  projectId?: string;
  architectureId?: string;
  nodes?: BaseNode[];
  edges?: BaseEdge[];
  initialContracts?: APIContract[];
  initialInterfaces?: ServiceInterface[];
  initialDependencies?: ConsumerDependency[];
}

export function ContractsWorkspace(props: ContractsWorkspaceProps) {
  const {
    contracts,
    dependencies,
    selectedContractId,
    selectedContract,
    activeRevision,
    candidateRevision,
    diffCandidateRevisionId,
    selectedOperationId,
    selectedOperation,
    selectedSchemaName,
    selectedSchema,
    protocolFilter,
    lifecycleFilter,
    searchQuery,
    filteredContracts,
    semanticDiff,
    consumerImpactReport,
    migrationPlan,
    coverageReport,
    driftFindings,
    isImportModalOpen,
    setSelectedContractId,
    setSelectedOperationId,
    setSelectedSchemaName,
    setProtocolFilter,
    setLifecycleFilter,
    setSearchQuery,
    setIsImportModalOpen,
    setDiffCandidateRevisionId,
    importContract,
  } = useArchitectureContracts(props);

  const [inspectorMode, setInspectorMode] = useState<"operation" | "schema">("operation");

  return (
    <div className="flex flex-col h-full w-full bg-[#000000] text-[#FFFFFF] select-none overflow-hidden">
      {/* Top Studio Control Bar */}
      <header className="h-11 px-4 bg-[#080808] border-b border-[#262626] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <LayersIcon className="w-4 h-4 text-[#FFFFFF]" />
            <h1 className="text-xs font-semibold uppercase tracking-wider text-[#FFFFFF]">
              API Contracts & Service Interfaces
            </h1>
          </div>
          <span className="text-[#404040]">•</span>
          <div className="flex items-center gap-2 text-xs text-[#858585]">
            <span>Coverage:</span>
            <span className="font-mono text-[#FFFFFF]">
              {Math.round(coverageReport.coveragePercentage)}%
            </span>
            <span className="text-[10px] text-[#666666]">
              ({coverageReport.servicesWithContracts} / {coverageReport.totalServices} services)
            </span>
          </div>
        </div>

        {/* Right Status Badges */}
        <div className="flex items-center gap-3">
          {semanticDiff && semanticDiff.findings.filter((f) => f.classification === "breaking").length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-[#1F1414] text-[#FFFFFF] border border-[#404040]">
              <AlertTriangleIcon className="w-3.5 h-3.5 text-[#FFFFFF]" />
              <span className="font-medium">
                {semanticDiff.findings.filter((f) => f.classification === "breaking").length} Breaking Changes Pending
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-[#858585]">
            <span className="px-2 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[10px] font-mono">
              Strict 5-Tier Segregation
            </span>
          </div>
        </div>
      </header>

      {/* Main 3-Pane Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Contract Explorer */}
        <ContractExplorer
          contracts={filteredContracts}
          selectedContractId={selectedContractId}
          protocolFilter={protocolFilter}
          lifecycleFilter={lifecycleFilter}
          searchQuery={searchQuery}
          onSelectContract={(id) => {
            setSelectedContractId(id);
            const found = contracts.find((c) => c.id === id);
            const activeRev =
              found?.revisions.find((r) => r.id === found.currentRevisionId) ||
              found?.revisions[0];
            if (activeRev && activeRev.operations.length > 0) {
              setSelectedOperationId(activeRev.operations[0].operationId);
              setInspectorMode("operation");
            }
          }}
          onProtocolFilterChange={setProtocolFilter}
          onLifecycleFilterChange={setLifecycleFilter}
          onSearchChange={setSearchQuery}
          onOpenImportModal={() => setIsImportModalOpen(true)}
        />

        {/* Center: Contract Detail & Visualizer */}
        <ContractDetail
          contract={selectedContract}
          activeRevision={activeRevision}
          candidateRevision={candidateRevision}
          diffCandidateRevisionId={diffCandidateRevisionId}
          selectedOperationId={selectedOperationId}
          selectedSchemaName={selectedSchemaName}
          semanticDiff={semanticDiff}
          consumerImpactReport={consumerImpactReport}
          migrationPlan={migrationPlan}
          driftFindings={driftFindings}
          dependencies={dependencies}
          onSelectOperation={(id) => {
            setSelectedOperationId(id);
            setInspectorMode("operation");
          }}
          onSelectSchema={(name) => {
            setSelectedSchemaName(name);
            setInspectorMode("schema");
          }}
          onSelectCandidateRevision={setDiffCandidateRevisionId}
        />

        {/* Right: Inspector Pane (Operation or Schema) */}
        {inspectorMode === "operation" ? (
          <OperationInspector
            operation={selectedOperation}
            revision={activeRevision}
            dependencies={dependencies}
            onClose={() => setSelectedOperationId(null)}
            onSelectSchema={(schemaName) => {
              setSelectedSchemaName(schemaName);
              setInspectorMode("schema");
            }}
          />
        ) : (
          <SchemaInspector
            schema={selectedSchema}
            onClose={() => {
              setSelectedSchemaName(null);
              setInspectorMode("operation");
            }}
            onSelectPropertySchema={(nested) => {
              setSelectedSchemaName(nested.name || nested.id);
            }}
          />
        )}
      </div>

      {/* Modal: Contract Import */}
      <ContractImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={(params) => {
          importContract(params);
        }}
      />
    </div>
  );
}

