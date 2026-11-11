"use client";

/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Operation Inspector Component
 */

import React from "react";
import type {
  ContractOperation,
  ContractRevision,
  ConsumerDependency,
} from "@nxtqr/architecture-intelligence";
import {
  TerminalIcon,
  AlertCircleIcon,
  CloseIcon,
} from "@nxtqr/icons";

interface OperationInspectorProps {
  operation: ContractOperation | null;
  revision: ContractRevision | null;
  dependencies: ConsumerDependency[];
  onClose: () => void;
  onSelectSchema?: (schemaName: string) => void;
}

export function OperationInspector({
  operation,
  revision: _revision,
  dependencies,
  onClose,
  onSelectSchema,
}: OperationInspectorProps) {
  if (!operation) {
    return (
      <div className="w-96 h-full flex flex-col items-center justify-center p-6 bg-[#080808] border-l border-[#262626] text-center text-[#858585]">
        <TerminalIcon className="w-8 h-8 mb-2 text-[#404040]" />
        <p className="text-xs">Select an operation, RPC, or event channel to inspect parameters and schemas.</p>
      </div>
    );
  }

  // Find known consumers calling this operation
  const knownConsumers = dependencies.filter((d) =>
    d.operationIds.includes(operation.operationId) ||
    d.operationIds.includes("*")
  );

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
      case "RPC":
      case "QUERY":
      case "MUTATION":
      case "EVENT":
        return "bg-[#141414] text-[#FFFFFF] border-[#262626]";
      default:
        return "bg-[#141414] text-[#858585] border-[#202020]";
    }
  };

  return (
    <aside className="w-96 h-full flex flex-col bg-[#080808] border-l border-[#262626] select-none overflow-hidden">
      {/* Header */}
      <div className="p-3.5 border-b border-[#262626] flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`px-1.5 py-0.5 text-[10px] font-mono font-medium rounded-md border ${getMethodBadgeClass(
                operation.method
              )}`}
            >
              {operation.method || "OP"}
            </span>
            <span className="text-xs font-mono text-[#FFFFFF] truncate">
              {operation.operationId}
            </span>
          </div>
          {operation.path && (
            <p className="text-[11px] font-mono text-[#858585] truncate">{operation.path}</p>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#858585] hover:text-[#FFFFFF] hover:bg-[#1A1A1A] transition-colors"
          title="Close Inspector"
        >
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-xs">
        {/* Deprecation Warning */}
        {operation.isDeprecated && (
          <div className="p-2.5 rounded-md bg-[#141414] border border-[#333333] flex items-start gap-2">
            <AlertCircleIcon className="w-4 h-4 text-[#FFFFFF] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-medium text-[#FFFFFF] text-[11px]">Deprecated Operation</span>
              <p className="text-[11px] text-[#858585]">
                {operation.deprecationNotice?.migrationGuidance || "This endpoint has been marked for retirement."}
              </p>
              {operation.deprecationNotice?.plannedRetirementDate && (
                <p className="text-[10px] text-[#666666]">
                  Retirement Target: {operation.deprecationNotice.plannedRetirementDate}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Summary & Description */}
        {operation.summary && (
          <div>
            <h5 className="text-[10px] font-semibold tracking-wide uppercase text-[#858585] mb-1">
              Summary
            </h5>
            <p className="text-xs text-[#B5B5B5] leading-relaxed">{operation.summary}</p>
          </div>
        )}
        {operation.description && (
          <div>
            <h5 className="text-[10px] font-semibold tracking-wide uppercase text-[#858585] mb-1">
              Description
            </h5>
            <p className="text-[11px] text-[#858585] leading-relaxed whitespace-pre-wrap">
              {operation.description}
            </p>
          </div>
        )}

        {/* Parameters */}
        <div>
          <h5 className="text-[10px] font-semibold tracking-wide uppercase text-[#858585] mb-2 flex items-center justify-between">
            <span>Parameters</span>
            <span className="font-mono text-[#666666]">{(operation.parameters || []).length}</span>
          </h5>
          {(operation.parameters || []).length === 0 ? (
            <p className="text-[11px] text-[#666666] italic">No parameters defined.</p>
          ) : (
            <div className="space-y-1.5">
              {(operation.parameters || []).map((p, idx) => (
                <div
                  key={`${p.name}-${idx}`}
                  className="p-2 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-medium text-[#FFFFFF]">{p.name}</span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-mono text-[#858585]">{p.in}</span>
                      {p.required ? (
                        <span className="text-[9px] px-1 py-0.2 rounded-md bg-[#1A1A1A] text-[#FFFFFF] border border-[#333333]">
                          REQUIRED
                        </span>
                      ) : (
                        <span className="text-[9px] text-[#666666]">opt</span>
                      )}
                    </div>
                  </div>
                  {p.description && (
                    <p className="text-[10px] text-[#858585]">{p.description}</p>
                  )}
                  {p.schema && (
                    <div className="text-[10px] font-mono text-[#666666]">
                      type: <span className="text-[#B5B5B5]">{p.schema.type}</span>
                      {p.schema.format && ` (${p.schema.format})`}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Request & Response Schemas */}
        <div>
          <h5 className="text-[10px] font-semibold tracking-wide uppercase text-[#858585] mb-2">
            Payload Schemas
          </h5>
          <div className="space-y-2">
            {operation.requestSchemaRef && (
              <div className="p-2 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#858585] uppercase tracking-wider block">
                    Request Body
                  </span>
                  <span className="font-mono text-[#FFFFFF] text-[11px]">
                    {operation.requestSchemaRef}
                  </span>
                </div>
                {onSelectSchema && (
                  <button
                    onClick={() => onSelectSchema(operation.requestSchemaRef!)}
                    className="px-2 py-0.5 text-[10px] text-[#FFFFFF] bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] rounded-md transition-colors"
                  >
                    View
                  </button>
                )}
              </div>
            )}

            {Object.entries(operation.responseSchemas || {}).map(([status, schemaRef]) => (
              <div
                key={status}
                className="p-2 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] text-[#858585] uppercase tracking-wider block">
                    Response HTTP {status}
                  </span>
                  <span className="font-mono text-[#FFFFFF] text-[11px]">{schemaRef}</span>
                </div>
                {onSelectSchema && (
                  <button
                    onClick={() => onSelectSchema(schemaRef)}
                    className="px-2 py-0.5 text-[10px] text-[#FFFFFF] bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] rounded-md transition-colors"
                  >
                    View
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Known Downstream Consumers */}
        <div>
          <h5 className="text-[10px] font-semibold tracking-wide uppercase text-[#858585] mb-2 flex items-center justify-between">
            <span>Known Consumers</span>
            <span className="font-mono text-[#666666]">{knownConsumers.length}</span>
          </h5>
          {knownConsumers.length === 0 ? (
            <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-[11px] text-[#858585]">
              No consumer services explicitly declared for this operation.
            </div>
          ) : (
            <div className="space-y-1.5">
              {knownConsumers.map((c) => (
                <div
                  key={c.id}
                  className="p-2 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] flex items-center justify-between"
                >
                  <div>
                    <span className="font-mono text-[#FFFFFF] font-medium block">
                      {c.consumerServiceId}
                    </span>
                    <span className="text-[10px] text-[#858585]">
                      Version: {c.expectedSchemaVersion || "*"}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 text-[9px] rounded-md bg-[#141414] text-[#B5B5B5] border border-[#262626]">
                    {c.source}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security & Provenance */}
        <div className="pt-2 border-t border-[#1A1A1A] space-y-2 text-[10px] text-[#666666]">
          <div className="flex items-center justify-between">
            <span>Provenance:</span>
            <span className="font-mono text-[#858585]">
              {operation.provenance?.source || "declared"}
            </span>
          </div>
          {(operation.securityRequirements || []).length > 0 && (
            <div className="flex items-center justify-between">
              <span>Security Scheme:</span>
              <span className="font-mono text-[#858585]">
                {(operation.securityRequirements || []).map((s) => s.scheme).join(", ")}
              </span>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

