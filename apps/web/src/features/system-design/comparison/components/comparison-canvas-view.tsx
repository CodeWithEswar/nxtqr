"use client";

import * as React from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ArchitectureChange } from "@nxtqr/architecture-intelligence";
import { PlusIcon, MinusIcon, EditIcon } from "@nxtqr/icons";

export interface ComparisonCanvasViewProps {
  role: "baseline" | "candidate";
  title: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  changes: ArchitectureChange[];
  selectedNodeId?: string | null;
  onSelectNode?: (nodeId: string) => void;
  className?: string;
}

export function ComparisonCanvasView({
  role,
  title,
  nodes,
  edges,
  changes,
  selectedNodeId,
  onSelectNode,
  className,
}: ComparisonCanvasViewProps) {
  // Map node IDs to their change record
  const changeByNodeId = React.useMemo(() => {
    const map = new Map<string, ArchitectureChange>();
    for (const c of changes) {
      if (c.entityType === "node") {
        if (role === "baseline" && c.baselineId) {
          map.set(c.baselineId, c);
        } else if (role === "candidate" && c.candidateId) {
          map.set(c.candidateId, c);
        }
      }
    }
    return map;
  }, [changes, role]);

  return (
    <div
      className={`relative flex flex-col h-full bg-black border border-border-default rounded-md overflow-hidden ${
        className || ""
      }`}
    >
      {/* 1. Canvas Role Header */}
      <div className="h-8 px-3 bg-surface-01 border-b border-border-subtle flex items-center justify-between font-mono text-[11px] shrink-0 z-10">
        <div className="flex items-center gap-2">
          <span
            className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
              role === "baseline"
                ? "bg-surface-03 text-text-secondary border border-border-subtle"
                : "bg-surface-04 text-foreground border border-border-strong"
            }`}
          >
            {role.toUpperCase()}
          </span>
          <span className="text-foreground font-semibold truncate max-w-[200px]">{title}</span>
        </div>
        <div className="text-text-muted text-[10px]">
          {nodes.length} nodes, {edges.length} connections
        </div>
      </div>

      {/* 2. Interactive Architecture Visual Grid */}
      <div className="flex-1 relative overflow-auto p-6 bg-black">
        {/* Subtle dot grid pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: "radial-gradient(#333333 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        />

        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 auto-rows-max">
          {nodes.map((node) => {
            const change = changeByNodeId.get(node.id);
            const isSelected = selectedNodeId === node.id;
            const compType = (node.data?.componentType as string) || node.type;

            let borderStyle = "border-border-default bg-surface-01";
            let diffBadge: React.ReactNode = null;

            if (change?.kind === "added") {
              borderStyle = "border-emerald-700/60 bg-emerald-950/20";
              diffBadge = (
                <span className="px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-300 font-mono text-[9px] font-bold flex items-center gap-0.5">
                  <PlusIcon className="w-2.5 h-2.5" /> Added
                </span>
              );
            } else if (change?.kind === "removed") {
              borderStyle = "border-rose-700/60 bg-rose-950/20 opacity-70";
              diffBadge = (
                <span className="px-1.5 py-0.5 rounded bg-rose-950 border border-rose-800 text-rose-300 font-mono text-[9px] font-bold flex items-center gap-0.5">
                  <MinusIcon className="w-2.5 h-2.5" /> Removed
                </span>
              );
            } else if (change?.kind === "modified") {
              borderStyle = "border-amber-700/60 bg-amber-950/20";
              diffBadge = (
                <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-800 text-amber-300 font-mono text-[9px] font-bold flex items-center gap-0.5">
                  <EditIcon className="w-2.5 h-2.5" /> Mod ({change.changedFields.length})
                </span>
              );
            }

            if (isSelected) {
              borderStyle += " ring-1 ring-border-strong shadow-level-2";
            }

            return (
              <div
                key={node.id}
                onClick={() => onSelectNode?.(node.id)}
                className={`p-3 rounded-md border transition-all cursor-pointer select-none space-y-2 hover:border-border-hover ${borderStyle}`}
              >
                <div className="flex items-start justify-between gap-1">
                  <div className="font-semibold text-foreground text-xs truncate">
                    {node.label || node.id}
                  </div>
                  {diffBadge}
                </div>

                <div className="flex items-center justify-between font-mono text-[10px] text-text-muted">
                  <span className="truncate">{compType}</span>
                  <span>#{node.id}</span>
                </div>

                {/* Key configuration preview */}
                <div className="pt-1 border-t border-border-subtle/50 font-mono text-[9px] text-text-secondary grid grid-cols-2 gap-1 truncate">
                  {node.data?.instanceCount !== undefined && (
                    <div>Instances: {String(node.data.instanceCount)}</div>
                  )}
                  {node.data?.readReplicas !== undefined && (
                    <div>Replicas: {String(node.data.readReplicas)}</div>
                  )}
                  {node.data?.rateLimitRps !== undefined && (
                    <div>Rate: {String(node.data.rateLimitRps)} rps</div>
                  )}
                  {node.data?.authPolicy !== undefined && (
                    <div className="truncate">Auth: {String(node.data.authPolicy)}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
