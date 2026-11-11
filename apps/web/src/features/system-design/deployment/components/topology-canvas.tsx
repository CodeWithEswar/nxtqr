"use client";

/**
 * NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
 * Hierarchical Topology Canvas Component
 */

import React, { useMemo } from "react";
import type {
  DeploymentTopology,
  InfrastructureResource,
} from "@nxtqr/architecture-intelligence";
import {
  LayersIcon,
  DatabaseIcon,
  CpuIcon,
  ChevronRightIcon,
} from "@nxtqr/icons";

interface TopologyCanvasProps {
  topology: DeploymentTopology;
  selectedResourceId: string | null;
  onSelectResource: (resourceId: string) => void;
  probeSourceId?: string | null;
  probeTargetId?: string | null;
  viewMode?: "deployment" | "logical" | "network" | "regions";
}

export function TopologyCanvas({
  topology,
  selectedResourceId,
  onSelectResource,
  probeSourceId,
  probeTargetId,
  viewMode: _viewMode,
}: TopologyCanvasProps) {
  // Organize resources by VPC, Subnet, and Standalone
  const { vpcs, subnetsByVpc, resourcesBySubnet, standaloneResources } = useMemo(() => {
    const vpcs = topology.resources.filter((r) => r.type === "vpc");
    const subnetsByVpc = new Map<string, InfrastructureResource[]>();
    const resourcesBySubnet = new Map<string, InfrastructureResource[]>();
    const standalone: InfrastructureResource[] = [];

    const subnetIds = new Set(topology.resources.filter((r) => r.type === "subnet").map((s) => s.id));
    const vpcIds = new Set(vpcs.map((v) => v.id));

    // Group subnets by VPC
    for (const res of topology.resources) {
      if (res.type === "subnet" && res.parentId && vpcIds.has(res.parentId)) {
        const list = subnetsByVpc.get(res.parentId) || [];
        list.push(res);
        subnetsByVpc.set(res.parentId, list);
      }
    }

    // Group workloads by Subnet or Standalone
    for (const res of topology.resources) {
      if (res.type === "vpc" || res.type === "subnet") continue;

      if (res.parentId && subnetIds.has(res.parentId)) {
        const list = resourcesBySubnet.get(res.parentId) || [];
        list.push(res);
        resourcesBySubnet.set(res.parentId, list);
      } else {
        standalone.push(res);
      }
    }

    return { vpcs, subnetsByVpc, resourcesBySubnet, standaloneResources: standalone };
  }, [topology.resources]);

  // Map logical component bindings count
  const mappingsCountByResId = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of topology.mappings) {
      map.set(m.infrastructureResourceId, (map.get(m.infrastructureResourceId) || 0) + 1);
    }
    return map;
  }, [topology.mappings]);

  const renderResourceBadge = (res: InfrastructureResource) => {
    const isSelected = selectedResourceId === res.id;
    const isProbeSource = probeSourceId === res.id;
    const isProbeTarget = probeTargetId === res.id;
    const mappedCount = mappingsCountByResId.get(res.id) || 0;

    let borderClass = "border-[#262626]";
    if (isSelected) {
      borderClass = "border-[#404040] bg-[#1A1A1A]";
    } else if (isProbeSource) {
      borderClass = "border-[#333333] bg-[#141414]";
    } else if (isProbeTarget) {
      borderClass = "border-[#333333] bg-[#141414]";
    }

    return (
      <div
        key={res.id}
        onClick={(e) => {
          e.stopPropagation();
          onSelectResource(res.id);
        }}
        className={`cursor-pointer flex flex-col p-2.5 rounded-md border ${borderClass} bg-[#0D0D0D] hover:border-[#333333] transition-all`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            {res.type === "managed_db" || res.type === "db_replica" ? (
              <DatabaseIcon size={14} className="text-[#FFFFFF] shrink-0" />
            ) : res.type === "load_balancer" || res.type === "api_gateway" ? (
              <LayersIcon size={14} className="text-[#FFFFFF] shrink-0" />
            ) : res.type === "k8s_workload" || res.type === "vm" ? (
              <CpuIcon size={14} className="text-[#FFFFFF] shrink-0" />
            ) : (
              <LayersIcon size={14} className="text-[#B5B5B5] shrink-0" />
            )}
            <span className="text-xs font-medium text-[#FFFFFF] truncate">{res.name}</span>
          </div>

          <span className="text-[10px] font-mono text-[#858585] uppercase px-1.5 py-0.5 rounded bg-[#141414] border border-[#202020] shrink-0">
            {res.type.replace(/_/g, " ")}
          </span>
        </div>

        {/* Metadata bar */}
        <div className="flex items-center justify-between text-[10px] text-[#858585] mt-2 font-mono">
          <span>{res.zoneId || res.regionId || res.provider.toUpperCase()}</span>
          {mappedCount > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-[#1A1A1A] border border-[#262626] text-[#B5B5B5]">
              {mappedCount} logical {mappedCount === 1 ? "service" : "services"}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      onClick={() => onSelectResource("")}
      className="flex-1 h-full bg-[#000000] overflow-y-auto p-4 space-y-4"
    >
      {/* Top Banner / Environment Info */}
      <div className="flex items-center justify-between p-3 rounded-md bg-[#080808] border border-[#202020]">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-[#FFFFFF]">{topology.environment.name}</span>
          <span className="text-[11px] font-mono text-[#858585] px-2 py-0.5 rounded bg-[#141414] border border-[#262626]">
            {topology.environment.category.toUpperCase()}
          </span>
          <span className="text-[11px] font-mono text-[#666666]">
            Isolation: {topology.environment.isolationLevel.replace(/_/g, " ")}
          </span>
        </div>
        <div className="text-xs font-mono text-[#858585]">
          {topology.resources.length} resources &bull; {topology.relationships.length} links &bull;{" "}
          {topology.mappings.length} mappings
        </div>
      </div>

      {/* VPC Hierarchy Containers */}
      {vpcs.map((vpc) => {
        const subnets = subnetsByVpc.get(vpc.id) || [];
        const isVpcSelected = selectedResourceId === vpc.id;

        return (
          <div
            key={vpc.id}
            onClick={(e) => {
              e.stopPropagation();
              onSelectResource(vpc.id);
            }}
            className={`flex flex-col p-3 rounded-md bg-[#080808] border ${
              isVpcSelected ? "border-[#404040]" : "border-[#1A1A1A]"
            } space-y-3 transition-colors`}
          >
            {/* VPC Header */}
            <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
              <div className="flex items-center gap-2">
                <LayersIcon size={16} className="text-[#FFFFFF]" />
                <span className="text-xs font-semibold text-[#FFFFFF]">{vpc.name}</span>
                {vpc.cidr && (
                  <span className="text-[11px] font-mono text-[#B5B5B5] px-2 py-0.5 rounded bg-[#141414] border border-[#262626]">
                    {vpc.cidr}
                  </span>
                )}
              </div>
              <span className="text-[11px] font-mono text-[#666666]">
                Region: {vpc.regionId || "us-east-1"}
              </span>
            </div>

            {/* Subnets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {subnets.map((sub) => {
                const subResources = resourcesBySubnet.get(sub.id) || [];
                const isSubSelected = selectedResourceId === sub.id;
                const isPublic = sub.configuration?.isPublic === true;

                return (
                  <div
                    key={sub.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectResource(sub.id);
                    }}
                    className={`flex flex-col p-2.5 rounded-md bg-[#0D0D0D] border ${
                      isSubSelected ? "border-[#404040]" : "border-[#202020]"
                    } space-y-2`}
                  >
                    {/* Subnet Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isPublic ? "bg-[#B5B5B5]" : "bg-[#404040]"
                          }`}
                        />
                        <span className="text-xs font-medium text-[#FFFFFF]">{sub.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {sub.cidr && (
                          <span className="text-[10px] font-mono text-[#858585]">{sub.cidr}</span>
                        )}
                        <span className="text-[10px] font-mono text-[#666666]">
                          [{sub.zoneId || "AZ"}]
                        </span>
                      </div>
                    </div>

                    {/* Resources inside this subnet */}
                    <div className="space-y-1.5 mt-1">
                      {subResources.map((res) => renderResourceBadge(res))}
                      {subResources.length === 0 && (
                        <div className="text-[11px] font-mono text-[#666666] py-3 text-center border border-dashed border-[#202020] rounded-md">
                          No workloads in subnet
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Standalone Resources (Not nested under subnets) */}
      {standaloneResources.length > 0 && (
        <div className="flex flex-col p-3 rounded-md bg-[#080808] border border-[#1A1A1A] space-y-2">
          <div className="flex items-center justify-between border-b border-[#1A1A1A] pb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#858585]">
              Cluster / Standalone Infrastructure
            </span>
            <span className="text-[11px] font-mono text-[#666666]">
              {standaloneResources.length} assets
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {standaloneResources.map((res) => renderResourceBadge(res))}
          </div>
        </div>
      )}

      {/* Infrastructure Relationships List */}
      {topology.relationships.length > 0 && (
        <div className="p-3 rounded-md bg-[#080808] border border-[#1A1A1A]">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#858585] block mb-2">
            Active Infrastructure Interconnects
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {topology.relationships.map((rel) => {
              const src = topology.resources.find((r) => r.id === rel.sourceResourceId);
              const tgt = topology.resources.find((r) => r.id === rel.targetResourceId);
              return (
                <div
                  key={rel.id}
                  className="flex items-center justify-between p-2 rounded-md bg-[#0D0D0D] border border-[#202020] text-xs font-mono text-[#B5B5B5]"
                >
                  <span className="truncate text-[#FFFFFF]">{src?.name || rel.sourceResourceId}</span>
                  <div className="flex items-center gap-1 text-[#858585] px-1.5 shrink-0">
                    <span className="text-[10px] uppercase">{rel.relationshipType.replace(/_/g, " ")}</span>
                    <ChevronRightIcon size={12} />
                  </div>
                  <span className="truncate text-[#FFFFFF]">{tgt?.name || rel.targetResourceId}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

