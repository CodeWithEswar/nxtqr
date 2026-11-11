"use client";

import React, { useMemo } from "react";
import type {
  ArchitectureReview,
  ArchitectureReviewRevision,
  ArchitectureComparisonResult,
  ArchitectureChange,
  ReviewCommentAnchor,
} from "@nxtqr/architecture-intelligence";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { PlusIcon, MinusIcon, EditIcon, CommentIcon, AlertTriangleIcon } from "@nxtqr/icons";

interface ReviewCanvasProps {
  review: ArchitectureReview;
  activeRevision: ArchitectureReviewRevision;
  semanticDiff: ArchitectureComparisonResult | null;
  viewMode: "split" | "candidate" | "baseline";
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onSelectAnchor: (anchor: ReviewCommentAnchor) => void;
}

export function ReviewCanvas({
  review,
  activeRevision,
  semanticDiff,
  viewMode,
  selectedNodeId,
  onSelectNode,
  onSelectAnchor,
}: ReviewCanvasProps) {
  // Map node IDs to change records
  const changeByNodeId = useMemo(() => {
    const map = new Map<string, ArchitectureChange>();
    if (!semanticDiff) return map;
    for (const change of semanticDiff.changes) {
      if (change.entityType === "node") {
        if (change.candidateId) map.set(change.candidateId, change);
        if (change.baselineId) map.set(change.baselineId, change);
      }
    }
    return map;
  }, [semanticDiff]);

  // Regressed node IDs
  const regressedNodeIds = useMemo(() => {
    const set = new Set<string>();
    if (!semanticDiff?.regressions) return set;
    for (const regr of semanticDiff.regressions) {
      if (regr.affectedNodeIds) {
        for (const nid of regr.affectedNodeIds) {
          set.add(nid);
        }
      }
    }
    return set;
  }, [semanticDiff]);

  // Threads grouped by nodeId
  const threadsByNodeId = useMemo(() => {
    const map = new Map<string, { total: number; unresolved: number }>();
    for (const thread of review.threads) {
      if (thread.anchor.type === "node" && thread.anchor.nodeId) {
        const current = map.get(thread.anchor.nodeId) || { total: 0, unresolved: 0 };
        current.total += 1;
        if (thread.status === "open") current.unresolved += 1;
        map.set(thread.anchor.nodeId, current);
      }
    }
    return map;
  }, [review.threads]);

  const renderGraphPane = (
    role: "baseline" | "candidate",
    title: string,
    revisionLabel: string,
    nodes: BaseNode[],
    edges: BaseEdge[]
  ) => {
    return (
      <div className="flex-1 flex flex-col h-full bg-black border border-[#262626] rounded-md overflow-hidden min-w-[320px]">
        {/* Pane Header */}
        <div className="h-9 px-3 bg-[#080808] border-b border-[#262626] flex items-center justify-between font-mono text-[11px] shrink-0">
          <div className="flex items-center gap-2">
            <span
              className={`px-1.5 py-0.5 rounded-md font-bold uppercase text-[9px] ${
                role === "baseline"
                  ? "bg-[#141414] text-[#858585] border border-[#262626]"
                  : "bg-[#1A1A1A] text-white border border-[#404040]"
              }`}
            >
              {role.toUpperCase()}
            </span>
            <span className="text-white font-medium truncate">{title}</span>
            <span className="text-[#858585] text-[10px]">({revisionLabel})</span>
          </div>
          <div className="text-[#858585] text-[10px]">
            {nodes.length} nodes • {edges.length} edges
          </div>
        </div>

        {/* Node Grid View */}
        <div className="flex-1 relative overflow-auto p-4 bg-black">
          {/* Subtle dot pattern */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: "radial-gradient(#333333 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />

          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-3 auto-rows-max">
            {nodes.map((node) => {
              const change = changeByNodeId.get(node.id);
              const threadInfo = threadsByNodeId.get(node.id);
              const isSelected = selectedNodeId === node.id;
              const hasRegression = regressedNodeIds.has(node.id);
              const compType = (node.data?.componentType as string) || node.type || "service";

              let borderStyle = "border-[#262626] bg-[#0D0D0D]";
              let changeBadge: React.ReactNode = null;

              if (role === "candidate" && change?.kind === "added") {
                borderStyle = "border-[#1F4028] bg-[#0E2014]";
                changeBadge = (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#0A160E] border border-[#1F4028] text-[#4ADE80] font-mono text-[9px] font-semibold flex items-center gap-1">
                    <PlusIcon className="w-2.5 h-2.5" /> Added
                  </span>
                );
              } else if (change?.kind === "removed") {
                borderStyle = "border-[#4D1919] bg-[#260D0D] opacity-75";
                changeBadge = (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#1C0A0A] border border-[#4D1919] text-[#F87171] font-mono text-[9px] font-semibold flex items-center gap-1">
                    <MinusIcon className="w-2.5 h-2.5" /> Removed
                  </span>
                );
              } else if (change?.kind === "modified") {
                borderStyle = "border-[#4D3319] bg-[#261A0D]";
                changeBadge = (
                  <span className="px-1.5 py-0.5 rounded-md bg-[#1C130A] border border-[#4D3319] text-[#FB923C] font-mono text-[9px] font-semibold flex items-center gap-1">
                    <EditIcon className="w-2.5 h-2.5" /> Mod ({change.changedFields.length})
                  </span>
                );
              }

              if (isSelected) {
                borderStyle += " ring-1 ring-[#404040] shadow-level-2";
              }

              return (
                <div
                  key={node.id}
                  onClick={() => onSelectNode(node.id)}
                  className={`p-3 rounded-md border transition-all cursor-pointer select-none space-y-2 hover:border-[#333333] ${borderStyle}`}
                >
                  {/* Top Bar: Title & Diff Badge */}
                  <div className="flex items-start justify-between gap-1">
                    <div className="font-semibold text-white text-xs truncate">
                      {node.label || node.id}
                    </div>
                    {changeBadge}
                  </div>

                  {/* Component Type & Node ID */}
                  <div className="flex items-center justify-between font-mono text-[10px] text-[#858585]">
                    <span className="truncate">{compType}</span>
                    <span>#{node.id}</span>
                  </div>

                  {/* Key Properties Preview */}
                  <div className="pt-1.5 border-t border-[#1A1A1A] font-mono text-[9px] text-[#B5B5B5] grid grid-cols-2 gap-1 truncate">
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

                  {/* Footer: Regression Warnings & Thread Badges */}
                  <div className="pt-1.5 border-t border-[#1A1A1A] flex items-center justify-between gap-2">
                    {hasRegression ? (
                      <div className="flex items-center gap-1 text-[9px] font-mono text-[#F87171]">
                        <AlertTriangleIcon className="w-3 h-3 text-[#F87171]" />
                        <span>Regression</span>
                      </div>
                    ) : (
                      <div />
                    )}

                    <div className="flex items-center gap-1.5">
                      {threadInfo && threadInfo.total > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectNode(node.id);
                            onSelectAnchor({
                              type: "node",
                              nodeId: node.id,
                              nodeLabel: node.label || node.id,
                            });
                          }}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded-md font-mono text-[9px] border transition-colors ${
                            threadInfo.unresolved > 0
                              ? "bg-[#261A0D] border-[#4D3319] text-[#FB923C]"
                              : "bg-[#141414] border-[#262626] text-[#858585]"
                          }`}
                          title={`${threadInfo.unresolved} unresolved thread(s)`}
                        >
                          <CommentIcon className="w-2.5 h-2.5" />
                          <span>{threadInfo.total}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectNode(node.id);
                          onSelectAnchor({
                            type: "node",
                            nodeId: node.id,
                            nodeLabel: node.label || node.id,
                          });
                        }}
                        className="px-1.5 py-0.5 rounded-md text-[9px] font-mono bg-[#141414] hover:bg-[#1A1A1A] border border-[#262626] hover:border-[#333333] text-[#B5B5B5] hover:text-white transition-colors"
                      >
                        + Comment
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex gap-3 p-3 overflow-hidden bg-black">
      {(viewMode === "split" || viewMode === "baseline") && (
        renderGraphPane(
          "baseline",
          review.baselineSnapshot.title || "Production Baseline",
          review.baselineSnapshot.revision,
          review.baselineSnapshot.nodes,
          review.baselineSnapshot.edges
        )
      )}

      {(viewMode === "split" || viewMode === "candidate") && (
        renderGraphPane(
          "candidate",
          activeRevision.candidateSnapshot.title || activeRevision.changeSummary || "Proposed Changes",
          `Revision v${activeRevision.revisionNumber}`,
          activeRevision.candidateSnapshot.nodes,
          activeRevision.candidateSnapshot.edges
        )
      )}
    </div>
  );
}
