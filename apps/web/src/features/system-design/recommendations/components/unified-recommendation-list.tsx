"use client";

import * as React from "react";
import { SearchIcon, CheckCircleIcon } from "@nxtqr/icons";
import { Input } from "@nxtqr/ui";
import { useUnifiedRecommendations } from "../hooks/use-unified-recommendations";
import { UnifiedRecommendationCard } from "./unified-recommendation-card";
import { RecommendationConflictBanner } from "./recommendation-conflict-banner";

export interface UnifiedRecommendationListProps {
  onFocusNode?: (nodeId: string) => void;
  onFocusEdge?: (edgeId: string) => void;
  className?: string;
}

export function UnifiedRecommendationList({
  onFocusNode,
  onFocusEdge,
  className,
}: UnifiedRecommendationListProps) {
  const {
    report,
    recommendations,
    selectedRecId,
    focusRecommendation,
    previewRecommendation,
    applyRecommendation,
    setLifecycleState,
    priorityFilter,
    setPriorityFilter,
    searchQuery,
    setSearchQuery,
  } = useUnifiedRecommendations();

  const handleSelect = (rec: any) => {
    focusRecommendation(rec);
    if (rec.affectedEdgeIds.length > 0 && onFocusEdge) {
      onFocusEdge(rec.affectedEdgeIds[0]);
    } else if (rec.affectedNodeIds.length > 0 && onFocusNode) {
      onFocusNode(rec.affectedNodeIds[0]);
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-surface-01 text-foreground select-none overflow-hidden space-y-2 p-2 ${
        className || ""
      }`}
    >
      {/* 1. Conflicts Alert Banner if any */}
      {report.conflicts.length > 0 && (
        <RecommendationConflictBanner conflicts={report.conflicts} />
      )}

      {/* 2. Search & Priority Filter Chips */}
      <div className="space-y-1.5 shrink-0">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter recommendations, strategies..."
            className="h-7 text-xs font-sans pl-7 bg-surface-02 border-border-default"
          />
          <SearchIcon className="w-3.5 h-3.5 absolute left-2 top-2 text-text-muted pointer-events-none" />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 font-mono text-[10px]">
          {(["all", "critical", "high", "medium", "low"] as const).map((p) => {
            const count =
              p === "all"
                ? report.recommendations.length
                : report.summary.byPriority[p] || 0;

            const isSelected = priorityFilter === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPriorityFilter(p)}
                className={`px-2 py-0.5 rounded border transition-colors shrink-0 uppercase ${
                  isSelected
                    ? "bg-surface-03 border-border-strong text-foreground font-semibold shadow-level-1"
                    : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground hover:bg-surface-03"
                }`}
              >
                {p} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Recommendations Scrollable List */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-2 pr-1">
        {recommendations.length === 0 ? (
          <div className="p-8 rounded-md bg-surface-02 border border-border-default text-center font-sans space-y-1">
            <CheckCircleIcon className="w-6 h-6 text-emerald-400 mx-auto" />
            <h5 className="text-xs font-semibold text-foreground">
              {searchQuery ? "No matching recommendations" : "Architecture Fully Aligned"}
            </h5>
            <p className="text-[11px] text-text-muted">
              {searchQuery
                ? "Try searching for a different component or keyword."
                : "All intelligence findings have been resolved or are within nominal tolerances."}
            </p>
          </div>
        ) : (
          recommendations.map((rec) => (
            <UnifiedRecommendationCard
              key={rec.id}
              recommendation={rec}
              isSelected={selectedRecId === rec.id}
              onSelect={() => handleSelect(rec)}
              onPreview={() => previewRecommendation(rec)}
              onApply={() => applyRecommendation(rec)}
              onDismiss={() => setLifecycleState(rec.id, "dismissed")}
            />
          ))
        )}
      </div>
    </div>
  );
}
