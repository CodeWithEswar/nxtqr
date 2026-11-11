"use client";

/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Consumer Dependency View Component
 */

import React from "react";
import type {
  APIContract,
  ConsumerDependency,
  ConsumerImpactReport,
} from "@nxtqr/architecture-intelligence";
import { AlertTriangleIcon } from "@nxtqr/icons";

interface ConsumerDependencyViewProps {
  contract: APIContract;
  dependencies: ConsumerDependency[];
  impactReport: ConsumerImpactReport | null;
  onSelectOperation?: (opId: string) => void;
}

export function ConsumerDependencyView({
  contract,
  dependencies,
  impactReport,
  onSelectOperation,
}: ConsumerDependencyViewProps) {
  const contractDeps = dependencies.filter((d) => d.contractId === contract.id);
  const impactedCount = impactReport?.impactedConsumers.length || 0;

  const getEvidenceSourceBadge = (source: string) => {
    return (
      <span className="px-1.5 py-0.5 text-[9px] font-mono rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">
        {source}
      </span>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#000000] overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 border-b border-[#262626] bg-[#080808] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-2">
            <span>Consumer Dependency & Blast Radius Topology</span>
          </h3>
          <p className="text-xs text-[#858585] mt-0.5">
            Services depending on <span className="font-mono text-[#FFFFFF]">{contract.providerServiceId}</span> ({contract.name})
          </p>
        </div>

        {impactReport && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#858585]">Impacted Consumers:</span>
            <span
              className={`px-2 py-0.5 text-xs font-mono font-bold rounded-md border ${
                impactedCount > 0
                  ? "bg-[#1F1414] text-[#FFFFFF] border-[#404040]"
                  : "bg-[#141414] text-[#B5B5B5] border-[#262626]"
              }`}
            >
              {impactedCount} / {contractDeps.length}
            </span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Unknown Consumers Warning */}
        {impactReport?.unknownConsumerRisk && (
          <div className="p-3.5 rounded-md bg-[#141414] border border-[#333333] flex items-start gap-3">
            <AlertTriangleIcon className="w-4 h-4 text-[#FFFFFF] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#FFFFFF] block">
                Unknown Downstream Consumers Risk
              </span>
              <p className="text-xs text-[#B5B5B5] leading-relaxed">
                This contract is marked as <span className="font-semibold text-[#FFFFFF]">{contract.exposure}</span>. Breaking changes may impact external clients, mobile app versions, or third-party integrators not tracked in this internal service catalog.
              </p>
            </div>
          </div>
        )}

        {/* Consumer Services List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
              Registered Downstream Consumers ({contractDeps.length})
            </h4>
            <span className="text-[11px] text-[#666666]">
              Provider: {contract.providerServiceId}
            </span>
          </div>

          {contractDeps.length === 0 ? (
            <div className="p-6 rounded-md bg-[#0D0D0D] border border-[#262626] text-center text-xs text-[#858585]">
              No consumer services are currently registered for this contract.
            </div>
          ) : (
            <div className="space-y-2.5">
              {contractDeps.map((dep) => {
                const impacted = impactReport?.impactedConsumers.find(
                  (c) => c.consumerServiceId === dep.consumerServiceId
                );

                return (
                  <div
                    key={dep.id}
                    className={`p-3.5 rounded-md border transition-colors space-y-2 ${
                      impacted
                        ? "bg-[#141010] border-[#404040]"
                        : "bg-[#080808] border-[#262626] hover:border-[#333333]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-[#FFFFFF]">
                            {dep.consumerServiceId}
                          </span>
                          {impacted && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-md bg-[#1F1414] text-[#FFFFFF] border border-[#404040]">
                              BREAKING IMPACT
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {getEvidenceSourceBadge(dep.source)}
                      </div>
                    </div>

                    {/* Consumed Operations */}
                    <div className="pt-2 border-t border-[#1A1A1A] flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-[#666666] uppercase tracking-wider font-semibold mr-1">
                        Consumed:
                      </span>
                      {dep.operationIds.map((opId) => (
                        <button
                          key={opId}
                          onClick={() => onSelectOperation && onSelectOperation(opId)}
                          className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-[#0D0D0D] text-[#B5B5B5] hover:text-[#FFFFFF] border border-[#262626] hover:border-[#333333] transition-colors"
                        >
                          {opId}
                        </button>
                      ))}
                    </div>

                    {/* Impact Details if impacted */}
                    {impacted && (
                      <div className="p-2 rounded-md bg-[#1A1414] border border-[#333333] space-y-1">
                        <span className="text-[10px] font-semibold text-[#FFFFFF] block">
                          Impact Analysis:
                        </span>
                        <div className="text-[10px] text-[#B5B5B5] space-y-0.5">
                          {impacted.breakingOperationIds.map((bOp) => (
                            <div key={bOp} className="font-mono text-[#FFFFFF]">
                              • Operation "{bOp}" has breaking changes affecting this consumer.
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

