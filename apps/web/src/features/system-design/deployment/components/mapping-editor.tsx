"use client";

/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Logical Component Mapping Editor
 */

import React, { useState } from "react";
import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  DeploymentTopology,
  DeploymentMappingType,
} from "@nxtqr/architecture-intelligence";
import { TrashIcon } from "@nxtqr/icons";

interface MappingEditorProps {
  logicalNodes: BaseNode[];
  topology: DeploymentTopology;
  onAddMapping: (logicalId: string, infraId: string, mappingType: DeploymentMappingType) => void;
  onRemoveMapping: (mappingId: string) => void;
}

export function MappingEditor({
  logicalNodes,
  topology,
  onAddMapping,
  onRemoveMapping,
}: MappingEditorProps) {
  const [selectedLogicalId, setSelectedLogicalId] = useState<string>("");
  const [selectedInfraId, setSelectedInfraId] = useState<string>("");
  const [selectedMappingType, setSelectedMappingType] = useState<DeploymentMappingType>("runs_on");

  // Workloads eligible for mapping
  const eligibleWorkloads = topology.resources.filter(
    (r) =>
      r.type === "k8s_workload" ||
      r.type === "vm" ||
      r.type === "managed_db" ||
      r.type === "load_balancer" ||
      r.type === "api_gateway" ||
      r.type === "serverless_function"
  );

  // Mapped vs unmapped logical nodes
  const mappedLogicalIds = new Set(topology.mappings.map((m) => m.logicalComponentId));
  const mappedCount = logicalNodes.filter((n) => mappedLogicalIds.has(n.id)).length;
  const coveragePct =
    logicalNodes.length === 0 ? 100 : Math.round((mappedCount / logicalNodes.length) * 100);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLogicalId || !selectedInfraId) return;

    onAddMapping(selectedLogicalId, selectedInfraId, selectedMappingType);
    setSelectedLogicalId("");
    setSelectedInfraId("");
  };

  return (
    <div className="flex flex-col h-full bg-[#080808] p-3 space-y-4 overflow-y-auto">
      {/* Header & Coverage */}
      <div className="border-b border-[#262626] pb-3">
        <span className="text-[10px] font-mono uppercase text-[#858585] tracking-wider block">
          Logical Mapping Completeness
        </span>
        <div className="flex items-center justify-between mt-1">
          <h3 className="text-sm font-semibold text-[#FFFFFF]">Component Bindings</h3>
          <span className="text-xs font-mono font-bold text-[#FFFFFF]">{coveragePct}% Mapped</span>
        </div>
        <div className="w-full bg-[#1A1A1A] h-1.5 rounded-full mt-2 overflow-hidden">
          <div
            className="bg-[#FFFFFF] h-full transition-all"
            style={{ width: `${coveragePct}%` }}
          />
        </div>
      </div>

      {/* Quick Mapping Creator */}
      <form onSubmit={handleCreate} className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
        <span className="text-[11px] font-semibold text-[#858585] uppercase tracking-wider block">
          Link Logical Node to Workload
        </span>

        <select
          value={selectedLogicalId}
          onChange={(e) => setSelectedLogicalId(e.target.value)}
          className="w-full bg-[#000000] border border-[#262626] focus:border-[#404040] rounded-md px-2 py-1.5 text-xs text-[#FFFFFF] outline-none"
        >
          <option value="">Select Architecture Node...</option>
          {logicalNodes.map((n) => (
            <option key={n.id} value={n.id}>
              {(n.data?.label as string) || n.id} ({n.type || "node"})
            </option>
          ))}
        </select>

        <select
          value={selectedInfraId}
          onChange={(e) => setSelectedInfraId(e.target.value)}
          className="w-full bg-[#000000] border border-[#262626] focus:border-[#404040] rounded-md px-2 py-1.5 text-xs text-[#FFFFFF] outline-none"
        >
          <option value="">Select Target Infrastructure...</option>
          {eligibleWorkloads.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.type})
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <select
            value={selectedMappingType}
            onChange={(e) => setSelectedMappingType(e.target.value as DeploymentMappingType)}
            className="flex-1 bg-[#000000] border border-[#262626] focus:border-[#404040] rounded-md px-2 py-1.5 text-xs text-[#FFFFFF] outline-none font-mono"
          >
            <option value="runs_on">runs_on (Compute / Container)</option>
            <option value="stored_in">stored_in (Database / Storage)</option>
            <option value="served_by">served_by (Ingress / Gateway)</option>
            <option value="implemented_by">implemented_by (Queue / Broker)</option>
          </select>

          <button
            type="submit"
            disabled={!selectedLogicalId || !selectedInfraId}
            className="px-3 py-1.5 rounded-md bg-[#1A1A1A] border border-[#333333] hover:border-[#404040] disabled:opacity-40 text-xs font-mono text-[#FFFFFF] transition-colors"
          >
            Bind
          </button>
        </div>
      </form>

      {/* Existing Mappings List */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-semibold text-[#858585] uppercase tracking-wider block">
          Configured Mappings ({topology.mappings.length})
        </span>

        {topology.mappings.map((m) => {
          const logicalNode = logicalNodes.find((n) => n.id === m.logicalComponentId);
          const infra = topology.resources.find((r) => r.id === m.infrastructureResourceId);

          return (
            <div
              key={m.id}
              className="flex items-center justify-between p-2 rounded-md bg-[#0D0D0D] border border-[#202020] text-xs font-mono"
            >
              <div className="min-w-0 pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#FFFFFF] truncate">
                    {(logicalNode?.data?.label as string) || m.logicalComponentId}
                  </span>
                  <span className="text-[10px] text-[#858585]">&rarr;</span>
                  <span className="text-[#B5B5B5] truncate">{infra?.name || m.infrastructureResourceId}</span>
                </div>
                <span className="text-[10px] text-[#666666] uppercase block mt-0.5">
                  {m.mappingType} ({m.replicas || 1} replicas)
                </span>
              </div>

              <button
                onClick={() => onRemoveMapping(m.id)}
                title="Remove mapping"
                className="text-[#858585] hover:text-[#FFFFFF] p-1 rounded hover:bg-[#1A1A1A] transition-colors shrink-0"
              >
                <TrashIcon size={12} />
              </button>
            </div>
          );
        })}

        {topology.mappings.length === 0 && (
          <div className="text-[11px] font-mono text-[#666666] py-4 text-center border border-dashed border-[#202020] rounded-md">
            No logical mappings created. Select a node above to link it to infrastructure.
          </div>
        )}
      </div>
    </div>
  );
}

