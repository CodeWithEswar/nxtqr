"use client";

/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Contract Detail Component
 */

import React, { useState } from "react";
import type {
  APIContract,
  ContractRevision,
  SemanticContractDiff,
  ConsumerImpactReport,
  MigrationPlan,
  ContractDriftFinding,
  ConsumerDependency,
} from "@nxtqr/architecture-intelligence";
import {
  LayersIcon,
  TerminalIcon,
  DatabaseIcon,
  RefreshIcon,
  ShieldIcon,
  AlertTriangleIcon,
  ActivityIcon,
} from "@nxtqr/icons";
import { CompatibilityDiffView } from "./compatibility-diff-view";
import { ConsumerDependencyView } from "./consumer-dependency-view";
import { MigrationPlanView } from "./migration-plan-view";

export type ContractTab =
  | "operations"
  | "schemas"
  | "diff"
  | "dependencies"
  | "migration"
  | "drift";

interface ContractDetailProps {
  contract: APIContract | null;
  activeRevision: ContractRevision | null;
  candidateRevision: ContractRevision | null;
  diffCandidateRevisionId: string | null;
  selectedOperationId: string | null;
  selectedSchemaName: string | null;
  semanticDiff: SemanticContractDiff | null;
  consumerImpactReport: ConsumerImpactReport | null;
  migrationPlan: MigrationPlan | null;
  driftFindings: ContractDriftFinding[];
  dependencies: ConsumerDependency[];
  onSelectOperation: (id: string) => void;
  onSelectSchema: (name: string) => void;
  onSelectCandidateRevision: (revId: string) => void;
}

export function ContractDetail({
  contract,
  activeRevision,
  candidateRevision,
  diffCandidateRevisionId,
  selectedOperationId,
  selectedSchemaName,
  semanticDiff,
  consumerImpactReport,
  migrationPlan,
  driftFindings,
  dependencies,
  onSelectOperation,
  onSelectSchema,
  onSelectCandidateRevision,
}: ContractDetailProps) {
  const [activeTab, setActiveTab] = useState<ContractTab>("operations");

  if (!contract || !activeRevision) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 bg-[#000000] text-center text-[#858585] select-none">
        <LayersIcon className="w-10 h-10 mb-2 text-[#404040]" />
        <h3 className="text-sm font-semibold text-[#FFFFFF] mb-1">No Contract Selected</h3>
        <p className="text-xs max-w-sm">
          Select an API contract from the explorer on the left or import a new specification document.
        </p>
      </div>
    );
  }

  const operations = activeRevision.operations || [];
  const schemas = activeRevision.schemas || {};
  const schemaList = Object.entries(schemas);
  const breakingCount = semanticDiff?.findings.filter((f) => f.classification === "breaking").length || 0;

  const getMethodBadgeClass = (method?: string) => {
    switch (method?.toUpperCase()) {
      case "GET":
        return "bg-[#141414] text-[#B5B5B5] border-[#262626]";
      case "POST":
        return "bg-[#1A1A1A] text-[#FFFFFF] border-[#333333]";
      case "PUT":
      case "PATCH":
        return "bg-[#141414] text-[#B5B5B5] border-[#262626]";
      case "DELETE":
        return "bg-[#1A1A1A] text-[#B5B5B5] border-[#333333]";
      default:
        return "bg-[#141414] text-[#858585] border-[#202020]";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] overflow-hidden select-none">
      {/* Contract Top Header */}
      <div className="p-4 border-b border-[#262626] bg-[#080808] flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h2 className="text-base font-semibold text-[#FFFFFF] tracking-tight">
              {contract.name}
            </h2>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626] uppercase">
              {contract.protocol}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-md bg-[#141414] text-[#FFFFFF] border border-[#333333] uppercase">
              {contract.exposure}
            </span>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#0D0D0D] text-[#858585] border border-[#202020]">
              v{activeRevision.versionLabel}
            </span>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#858585] font-mono">
            <span>Provider: <strong className="text-[#FFFFFF]">{contract.providerServiceId}</strong></span>
            <span>•</span>
            <span>Format: {contract.specificationFormat}</span>
            <span>•</span>
            <span>Revision: {activeRevision.id}</span>
          </div>
        </div>

        {/* Breaking Changes Indicator Quick Button */}
        {breakingCount > 0 && (
          <button
            onClick={() => setActiveTab("diff")}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#1F1414] text-[#FFFFFF] border border-[#404040] hover:bg-[#261818] transition-colors text-xs font-medium"
          >
            <AlertTriangleIcon className="w-3.5 h-3.5 text-[#FFFFFF]" />
            <span>{breakingCount} Breaking Changes</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="px-4 border-b border-[#262626] bg-[#080808] flex items-center gap-1 overflow-x-auto no-scrollbar">
        {[
          { id: "operations", label: `Operations (${operations.length})`, icon: TerminalIcon },
          { id: "schemas", label: `Data Schemas (${schemaList.length})`, icon: DatabaseIcon },
          {
            id: "diff",
            label: `Diff & Compatibility ${semanticDiff ? `(${semanticDiff.findings.length})` : ""}`,
            icon: RefreshIcon,
          },
          {
            id: "dependencies",
            label: `Consumers (${dependencies.filter((d) => d.contractId === contract.id).length})`,
            icon: LayersIcon,
          },
          { id: "migration", label: "Migration Plan", icon: ShieldIcon },
          { id: "drift", label: `Telemetry Drift (${driftFindings.length})`, icon: ActivityIcon },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ContractTab)}
              className={`flex items-center gap-2 px-3 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
                isActive
                  ? "border-[#FFFFFF] text-[#FFFFFF] bg-[#141414]"
                  : "border-transparent text-[#858585] hover:text-[#FFFFFF] hover:bg-[#0D0D0D]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {/* Operations Catalog */}
        {activeTab === "operations" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {operations.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#858585]">
                No operations or channels defined in this specification.
              </div>
            ) : (
              operations.map((op) => {
                const isSelected =
                  op.operationId === selectedOperationId || op.id === selectedOperationId;

                return (
                  <div
                    key={op.id}
                    onClick={() => onSelectOperation(op.operationId)}
                    className={`p-3 rounded-md cursor-pointer border transition-all flex items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-[#141414] border-[#404040]"
                        : "bg-[#080808] border-[#262626] hover:border-[#333333] hover:bg-[#0D0D0D]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-mono font-medium rounded-md border ${getMethodBadgeClass(
                          op.method
                        )}`}
                      >
                        {op.method || "OP"}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-medium text-[#FFFFFF] truncate">
                            {op.path || op.operationId}
                          </span>
                          {op.isDeprecated && (
                            <span className="px-1.5 py-0.2 text-[9px] font-mono text-[#858585] bg-[#141414] border border-[#262626] rounded-md">
                              DEPRECATED
                            </span>
                          )}
                        </div>
                        {op.summary && (
                          <p className="text-[11px] text-[#858585] truncate mt-0.5">
                            {op.summary}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-xs text-[#858585] font-mono">
                      <span>{(op.parameters || []).length} params</span>
                      {op.requestSchemaRef && <span>req body</span>}
                      <span>{Object.keys(op.responseSchemas || {}).length} responses</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Schemas List */}
        {activeTab === "schemas" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {schemaList.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#858585]">
                No data schemas defined.
              </div>
            ) : (
              schemaList.map(([sName, sDef]) => {
                const isSelected = sName === selectedSchemaName;
                const propCount = sDef.properties ? Object.keys(sDef.properties).length : 0;

                return (
                  <div
                    key={sName}
                    onClick={() => onSelectSchema(sName)}
                    className={`p-3 rounded-md cursor-pointer border transition-all flex items-center justify-between gap-4 ${
                      isSelected
                        ? "bg-[#141414] border-[#404040]"
                        : "bg-[#080808] border-[#262626] hover:border-[#333333] hover:bg-[#0D0D0D]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">
                        {sDef.type}
                      </span>
                      <div>
                        <span className="text-xs font-mono font-medium text-[#FFFFFF]">
                          {sName}
                        </span>
                        {sDef.description && (
                          <p className="text-[11px] text-[#858585] truncate mt-0.5">
                            {sDef.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#858585] font-mono">
                      {sDef.fieldNumber !== undefined && <span>Tag #{sDef.fieldNumber}</span>}
                      <span>{propCount} fields</span>
                      {sDef.requiredProperties && (
                        <span>{sDef.requiredProperties.length} required</span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* Compatibility Diff */}
        {activeTab === "diff" && (
          <CompatibilityDiffView
            contract={contract}
            activeRevision={activeRevision}
            candidateRevision={candidateRevision}
            diffCandidateRevisionId={diffCandidateRevisionId}
            diff={semanticDiff}
            onSelectCandidateRevision={onSelectCandidateRevision}
          />
        )}

        {/* Consumer Dependencies */}
        {activeTab === "dependencies" && (
          <ConsumerDependencyView
            contract={contract}
            dependencies={dependencies}
            impactReport={consumerImpactReport}
            onSelectOperation={(opId) => {
              onSelectOperation(opId);
              setActiveTab("operations");
            }}
          />
        )}

        {/* Migration Plan */}
        {activeTab === "migration" && (
          <MigrationPlanView migrationPlan={migrationPlan} />
        )}

        {/* Telemetry Drift */}
        {activeTab === "drift" && (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
                Observed Telemetry vs Declared Specifications ({driftFindings.length} findings)
              </h4>
              <span className="text-[11px] text-[#666666]">
                Evidence Source: Observed OpenTelemetry Traffic
              </span>
            </div>

            {driftFindings.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#858585] bg-[#080808] border border-[#262626] rounded-md">
                No contract drift or shadow endpoints detected for this service.
              </div>
            ) : (
              <div className="space-y-2.5">
                {driftFindings.map((finding) => (
                  <div
                    key={finding.id}
                    className="p-3.5 rounded-md bg-[#080808] border border-[#262626] space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-md bg-[#1F1414] text-[#FFFFFF] border border-[#404040]">
                          {finding.driftType.toUpperCase()}
                        </span>
                        {finding.operationId && (
                          <span className="text-xs font-mono font-medium text-[#FFFFFF]">
                            {finding.operationId}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-[#858585]">
                        Severity: {finding.severity}
                      </span>
                    </div>

                    <p className="text-xs text-[#B5B5B5] leading-relaxed">
                      {finding.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

