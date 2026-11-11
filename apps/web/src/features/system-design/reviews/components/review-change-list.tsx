"use client";

import React from "react";
import type {
  ArchitectureComparisonResult,
  ArchitectureChange,
} from "@nxtqr/architecture-intelligence";

interface ReviewChangeListProps {
  semanticDiff: ArchitectureComparisonResult | null;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
  onSelectAnchor: (change: ArchitectureChange) => void;
}

export function ReviewChangeList({
  semanticDiff,
  selectedNodeId,
  onSelectNode,
  onSelectAnchor,
}: ReviewChangeListProps) {
  if (!semanticDiff) {
    return (
      <aside className="w-80 border-r border-[#262626] bg-[#080808] p-4 text-xs text-[#858585] select-none">
        Loading semantic changes...
      </aside>
    );
  }

  const changes = semanticDiff.changes || [];
  const addedChanges = changes.filter((c) => c.kind === "added");
  const modifiedChanges = changes.filter((c) => c.kind === "modified");
  const removedChanges = changes.filter((c) => c.kind === "removed");
  const regressions = semanticDiff.regressions || [];

  return (
    <aside className="w-80 border-r border-[#262626] bg-[#080808] flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="p-4 border-b border-[#262626]">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs uppercase font-mono tracking-wider text-[#858585]">
            Semantic Changes
          </span>
          <span className="text-xs font-mono px-1.5 py-0.5 rounded-md bg-[#141414] border border-[#262626] text-[#B5B5B5]">
            {changes.length} delta(s)
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-[#858585] mt-2">
          <span className="text-[#4ADE80]">+{addedChanges.length}</span>
          <span className="text-[#FB923C]">~{modifiedChanges.length}</span>
          <span className="text-[#F87171]">-{removedChanges.length}</span>
          {regressions.length > 0 && (
            <span className="text-[#F87171] font-semibold">⚠️ {regressions.length} regr</span>
          )}
        </div>
      </div>

      {/* Change Sections */}
      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* Added */}
        {addedChanges.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#4ADE80] px-2 py-1">
              Added Components ({addedChanges.length})
            </div>
            <div className="space-y-1">
              {addedChanges.map((change) => {
                const targetId = change.candidateId || change.id;
                const isSelected = selectedNodeId === targetId;

                return (
                  <div
                    key={change.id}
                    onClick={() => {
                      onSelectNode(targetId);
                      onSelectAnchor(change);
                    }}
                    className={`flex items-start justify-between px-3 py-2 rounded-md text-xs cursor-pointer border transition-colors ${
                      isSelected
                        ? "bg-[#141F14] border-[#1F4028] text-white"
                        : "bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#262626] text-[#B5B5B5] hover:text-white"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="font-medium text-white truncate">
                        + {change.label || targetId}
                      </div>
                      <div className="text-[10px] text-[#858585] font-mono mt-0.5">
                        {change.entityType} • {change.nodeType || "service"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Modified */}
        {modifiedChanges.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#FB923C] px-2 py-1">
              Modified Components ({modifiedChanges.length})
            </div>
            <div className="space-y-1">
              {modifiedChanges.map((change) => {
                const targetId = change.candidateId || change.baselineId || change.id;
                const isSelected = selectedNodeId === targetId;

                return (
                  <div
                    key={change.id}
                    onClick={() => {
                      onSelectNode(targetId);
                      onSelectAnchor(change);
                    }}
                    className={`flex items-start justify-between px-3 py-2 rounded-md text-xs cursor-pointer border transition-colors ${
                      isSelected
                        ? "bg-[#1F1810] border-[#4D3319] text-white"
                        : "bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#262626] text-[#B5B5B5] hover:text-white"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="font-medium text-white truncate">
                        ~ {change.label || targetId}
                      </div>
                      <div className="text-[10px] text-[#858585] font-mono mt-0.5">
                        {change.changedFields.join(", ") || "Configuration changed"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Removed */}
        {removedChanges.length > 0 && (
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-[#F87171] px-2 py-1">
              Removed Components ({removedChanges.length})
            </div>
            <div className="space-y-1">
              {removedChanges.map((change) => {
                const targetId = change.baselineId || change.id;
                const isSelected = selectedNodeId === targetId;

                return (
                  <div
                    key={change.id}
                    onClick={() => {
                      onSelectNode(targetId);
                      onSelectAnchor(change);
                    }}
                    className={`flex items-start justify-between px-3 py-2 rounded-md text-xs cursor-pointer border transition-colors ${
                      isSelected
                        ? "bg-[#1F1010] border-[#4D1919] text-white"
                        : "bg-[#0D0D0D] border-[#1A1A1A] hover:border-[#262626] text-[#B5B5B5] hover:text-white"
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="font-medium text-white truncate">
                        - {change.label || targetId}
                      </div>
                      <div className="text-[10px] text-[#858585] font-mono mt-0.5">
                        {change.entityType}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Regressions */}
        {regressions.length > 0 && (
          <div className="p-3 rounded-md bg-[#1C1212] border border-[#552222]">
            <div className="text-[11px] font-semibold text-[#FF8888] mb-1">
              Architectural Regressions ({regressions.length})
            </div>
            <ul className="space-y-1 text-[11px] text-[#B5B5B5]">
              {regressions.map((reg) => (
                <li key={reg.id} className="leading-tight">
                  • <strong>{reg.title}</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </aside>
  );
}
