"use client";

/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Source vs Target Architecture Comparator Component
 */

import React from "react";
import type { ArchitectureSnapshot } from "@nxtqr/architecture-intelligence";
import { DatabaseIcon, LayersIcon, CheckCircleIcon, ChevronRightIcon } from "@nxtqr/icons";

interface SourceTargetComparatorProps {
  sourceSnapshot: ArchitectureSnapshot;
  targetSnapshot: ArchitectureSnapshot;
}

export function SourceTargetComparator({
  sourceSnapshot,
  targetSnapshot,
}: SourceTargetComparatorProps) {
  const sourceNodeCount = sourceSnapshot.nodes.length;
  const targetNodeCount = targetSnapshot.nodes.length;
  const sourceEdgeCount = sourceSnapshot.edges.length;
  const targetEdgeCount = targetSnapshot.edges.length;

  return (
    <div className="space-y-6">
      {/* Topology Evolution Metrics Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#262626]">
          <div className="text-xs uppercase tracking-wider text-[#858585] mb-1">Source Nodes</div>
          <div className="text-2xl font-bold font-mono text-[#FFFFFF]">{sourceNodeCount}</div>
          <div className="text-xs text-[#858585] mt-1 font-mono">{sourceSnapshot.revision}</div>
        </div>
        <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#262626]">
          <div className="text-xs uppercase tracking-wider text-[#858585] mb-1">Target Nodes</div>
          <div className="text-2xl font-bold font-mono text-[#FFFFFF]">{targetNodeCount}</div>
          <div className="text-xs text-[#858585] mt-1 font-mono">{targetSnapshot.revision}</div>
        </div>
        <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#262626]">
          <div className="text-xs uppercase tracking-wider text-[#858585] mb-1">Inter-Service Edges</div>
          <div className="text-2xl font-bold font-mono text-[#FFFFFF]">
            {sourceEdgeCount} <span className="text-[#858585] text-lg font-normal">→</span> {targetEdgeCount}
          </div>
          <div className="text-xs text-[#858585] mt-1">Topology complexity transition</div>
        </div>
        <div className="p-4 rounded-md bg-[#0D0D0D] border border-[#262626]">
          <div className="text-xs uppercase tracking-wider text-[#858585] mb-1">Evolution Profile</div>
          <div className="text-sm font-semibold text-[#FFFFFF] flex items-center gap-1.5 mt-1">
            <CheckCircleIcon size={16} className="text-[#22c55e]" />
            Decomposed Microservices
          </div>
          <div className="text-xs text-[#858585] mt-1">Polyglot DB & Async Bus</div>
        </div>
      </div>

      {/* Side-by-Side Snapshots */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Architecture (Legacy) */}
        <div className="rounded-md bg-[#080808] border border-[#262626] p-4">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#262626]">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#858585]">Source Architecture</div>
              <h3 className="text-base font-semibold text-[#FFFFFF]">Baseline Legacy Topology</h3>
            </div>
            <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-[#141414] border border-[#333333] text-[#B5B5B5]">
              {String(sourceSnapshot.metadata?.environment || "Legacy DC")}
            </span>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">Components</div>
            <div className="space-y-2">
              {sourceSnapshot.nodes.map((node) => (
                <div
                  key={node.id}
                  className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    {node.data.nodeType === "database" ? (
                      <DatabaseIcon size={16} className="text-[#858585]" />
                    ) : (
                      <LayersIcon size={16} className="text-[#858585]" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-[#FFFFFF]">{String(node.data.label || node.id)}</div>
                      <div className="text-xs font-mono text-[#858585]">{node.id}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-xs bg-[#141414] border border-[#262626] text-[#858585]">
                    {String(node.data.nodeType || "service")}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider pt-2">Connections</div>
            <div className="space-y-1.5">
              {sourceSnapshot.edges.map((edge) => (
                <div
                  key={edge.id}
                  className="p-2 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-xs font-mono text-[#858585] flex items-center gap-2"
                >
                  <span className="text-[#FFFFFF]">{edge.source}</span>
                  <ChevronRightIcon size={14} className="text-[#666666]" />
                  <span className="text-[#FFFFFF]">{edge.target}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Target Architecture (Modernized) */}
        <div className="rounded-md bg-[#080808] border border-[#262626] p-4">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#262626]">
            <div>
              <div className="text-xs uppercase tracking-wider text-[#858585]">Target Architecture</div>
              <h3 className="text-base font-semibold text-[#FFFFFF]">Modernized Cloud Topology</h3>
            </div>
            <span className="px-2 py-0.5 rounded-md text-xs font-mono bg-[#141414] border border-[#333333] text-[#B5B5B5]">
              {String(targetSnapshot.metadata?.environment || "Target Cloud")}
            </span>
          </div>

          <div className="space-y-3">
            <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider">Components</div>
            <div className="space-y-2">
              {targetSnapshot.nodes.map((node) => (
                <div
                  key={node.id}
                  className="p-3 rounded-md bg-[#0D0D0D] border border-[#202020] flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    {node.data.nodeType === "database" ? (
                      <DatabaseIcon size={16} className="text-[#22c55e]" />
                    ) : (
                      <LayersIcon size={16} className="text-[#FFFFFF]" />
                    )}
                    <div>
                      <div className="text-sm font-medium text-[#FFFFFF]">{String(node.data.label || node.id)}</div>
                      <div className="text-xs font-mono text-[#858585]">{node.id}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-md text-xs bg-[#1A1A1A] border border-[#333333] text-[#B5B5B5]">
                    {String(node.data.nodeType || "service")}
                  </span>
                </div>
              ))}
            </div>

            <div className="text-xs font-semibold text-[#858585] uppercase tracking-wider pt-2">Connections</div>
            <div className="space-y-1.5">
              {targetSnapshot.edges.map((edge) => (
                <div
                  key={edge.id}
                  className="p-2 rounded-md bg-[#0D0D0D] border border-[#1A1A1A] text-xs font-mono text-[#858585] flex items-center gap-2"
                >
                  <span className="text-[#FFFFFF]">{edge.source}</span>
                  <ChevronRightIcon size={14} className="text-[#666666]" />
                  <span className="text-[#FFFFFF]">{edge.target}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

