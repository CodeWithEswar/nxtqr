"use client";

/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Resource Inspector Pane
 */

import React from "react";
import type { DeploymentTopology } from "@nxtqr/architecture-intelligence";
import { LayersIcon, TrashIcon } from "@nxtqr/icons";

interface ResourceInspectorProps {
  topology: DeploymentTopology;
  selectedResourceId: string | null;
  onRemoveResource: (id: string) => void;
  onSetProbeSource: (id: string) => void;
  onSetProbeTarget: (id: string) => void;
}

export function ResourceInspector({
  topology,
  selectedResourceId,
  onRemoveResource,
  onSetProbeSource,
  onSetProbeTarget,
}: ResourceInspectorProps) {
  const resource = topology.resources.find((r) => r.id === selectedResourceId);

  if (!resource) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center text-[#666666] font-mono text-xs">
        <LayersIcon size={24} className="mb-2 text-[#404040]" />
        Select an infrastructure resource, VPC, or subnet to view configuration and connections.
      </div>
    );
  }

  // Find incoming and outgoing relationships
  const outgoingRels = topology.relationships.filter((r) => r.sourceResourceId === resource.id);
  const incomingRels = topology.relationships.filter((r) => r.targetResourceId === resource.id);

  // Mapped logical components
  const mappings = topology.mappings.filter((m) => m.infrastructureResourceId === resource.id);

  return (
    <div className="flex flex-col h-full bg-[#080808] p-3 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="border-b border-[#262626] pb-3">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase text-[#858585] tracking-wider">
            {resource.provider.toUpperCase()} &bull; {resource.type.replace(/_/g, " ")}
          </span>
          <button
            onClick={() => onRemoveResource(resource.id)}
            title="Delete Resource"
            className="text-[#858585] hover:text-[#FFFFFF] p-1 rounded-md hover:bg-[#1A1A1A] transition-colors"
          >
            <TrashIcon size={14} />
          </button>
        </div>
        <h3 className="text-sm font-semibold text-[#FFFFFF] mt-1">{resource.name}</h3>
        <span className="text-[11px] font-mono text-[#666666]">{resource.id}</span>
      </div>

      {/* Network Probe Actions */}
      <div className="p-2.5 rounded-md bg-[#0D0D0D] border border-[#202020] space-y-2">
        <span className="text-[11px] font-semibold text-[#858585] uppercase tracking-wider block">
          Network Reachability Probe
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onSetProbeSource(resource.id)}
            className="flex-1 py-1 px-2 rounded-md bg-[#1A1A1A] border border-[#333333] hover:border-[#404040] text-xs font-mono text-[#FFFFFF] transition-colors text-center"
          >
            Set as Probe Source
          </button>
          <button
            onClick={() => onSetProbeTarget(resource.id)}
            className="flex-1 py-1 px-2 rounded-md bg-[#1A1A1A] border border-[#333333] hover:border-[#404040] text-xs font-mono text-[#FFFFFF] transition-colors text-center"
          >
            Set as Probe Target
          </button>
        </div>
      </div>

      {/* Placement Details */}
      <div className="space-y-1.5 text-xs font-mono">
        <span className="text-[10px] font-semibold text-[#858585] uppercase tracking-wider block mb-1">
          Placement & Network
        </span>
        <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
          <span className="text-[#858585]">Region:</span>
          <span className="text-[#FFFFFF]">{resource.regionId || "—"}</span>
        </div>
        <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
          <span className="text-[#858585]">Availability Zone:</span>
          <span className="text-[#FFFFFF]">{resource.zoneId || "—"}</span>
        </div>
        {resource.cidr && (
          <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
            <span className="text-[#858585]">CIDR Block:</span>
            <span className="text-[#FFFFFF]">{resource.cidr}</span>
          </div>
        )}
        {resource.parentId && (
          <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
            <span className="text-[#858585]">Parent Resource:</span>
            <span className="text-[#B5B5B5] truncate max-w-[150px]">{resource.parentId}</span>
          </div>
        )}
        <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
          <span className="text-[#858585]">Provenance:</span>
          <span className="text-[#B5B5B5]">{resource.provenance.source.replace(/_/g, " ")}</span>
        </div>
      </div>

      {/* Mapped Logical Components */}
      <div className="space-y-2">
        <span className="text-[10px] font-semibold text-[#858585] uppercase tracking-wider block">
          Mapped Logical Services ({mappings.length})
        </span>
        {mappings.length > 0 ? (
          <div className="space-y-1.5">
            {mappings.map((m) => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2 rounded-md bg-[#0D0D0D] border border-[#202020] text-xs font-mono"
              >
                <span className="text-[#FFFFFF] truncate">{m.logicalComponentId}</span>
                <span className="text-[10px] text-[#858585] uppercase">{m.mappingType}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-mono text-[#666666] block">
            No logical architecture service mapped to this workload.
          </span>
        )}
      </div>

      {/* Relationships */}
      <div className="space-y-2">
        <span className="text-[10px] font-semibold text-[#858585] uppercase tracking-wider block">
          Interconnects
        </span>
        {outgoingRels.length > 0 || incomingRels.length > 0 ? (
          <div className="space-y-1.5 text-xs font-mono">
            {outgoingRels.map((rel) => (
              <div
                key={rel.id}
                className="flex items-center justify-between p-1.5 rounded-md bg-[#0D0D0D] border border-[#202020] text-[11px]"
              >
                <span className="text-[#858585] truncate">&rarr; {rel.targetResourceId}</span>
                <span className="text-[#B5B5B5] uppercase">{rel.relationshipType}</span>
              </div>
            ))}
            {incomingRels.map((rel) => (
              <div
                key={rel.id}
                className="flex items-center justify-between p-1.5 rounded-md bg-[#0D0D0D] border border-[#202020] text-[11px]"
              >
                <span className="text-[#858585] truncate">&larr; {rel.sourceResourceId}</span>
                <span className="text-[#B5B5B5] uppercase">{rel.relationshipType}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="text-[11px] font-mono text-[#666666] block">
            No active connections or routes defined.
          </span>
        )}
      </div>

      {/* Configuration Attributes */}
      {Object.keys(resource.configuration).length > 0 && (
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold text-[#858585] uppercase tracking-wider block">
            Configuration Payload
          </span>
          <pre className="p-2 rounded-md bg-[#000000] border border-[#202020] text-[11px] font-mono text-[#B5B5B5] overflow-x-auto">
            {JSON.stringify(resource.configuration, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

