"use client";

import * as React from "react";
import {
  LayersIcon,
  RefreshIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PlusIcon,
  MinusIcon,
  EditIcon,
} from "@nxtqr/icons";
import { Button } from "@nxtqr/ui";
import type { ComparisonSummary } from "@nxtqr/architecture-intelligence";

export interface ComparisonToolbarProps {
  baselineTitle: string;
  candidateTitle: string;
  summary: ComparisonSummary;
  filterKind: "all" | "added" | "removed" | "modified" | "regressions";
  onFilterChange: (kind: "all" | "added" | "removed" | "modified" | "regressions") => void;
  isSyncNavigation: boolean;
  onToggleSyncNavigation: () => void;
  onSwapSnapshots: () => void;
  onApplyCandidate?: () => void;
  onResetView?: () => void;
  className?: string;
}

export function ComparisonToolbar({
  baselineTitle,
  candidateTitle,
  summary,
  filterKind,
  onFilterChange,
  isSyncNavigation,
  onToggleSyncNavigation,
  onSwapSnapshots,
  onApplyCandidate,
  className,
}: ComparisonToolbarProps) {
  const [applied, setApplied] = React.useState(false);

  const handleApply = () => {
    if (onApplyCandidate) {
      onApplyCandidate();
      setApplied(true);
      setTimeout(() => setApplied(false), 2500);
    }
  };

  return (
    <div
      className={`h-12 px-3 bg-surface-01 border-b border-border-default flex items-center justify-between gap-3 text-xs font-sans shrink-0 z-20 ${
        className || ""
      }`}
    >
      {/* 1. Architecture Version Label & Swap Control */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex items-center gap-1.5 font-mono text-[11px] truncate">
          <span className="px-1.5 py-0.5 rounded bg-surface-02 border border-border-subtle text-text-secondary truncate max-w-[140px] sm:max-w-[180px]">
            {baselineTitle}
          </span>
          <span className="text-text-muted">vs</span>
          <span className="px-1.5 py-0.5 rounded bg-surface-02 border border-border-subtle text-foreground font-semibold truncate max-w-[140px] sm:max-w-[180px]">
            {candidateTitle}
          </span>
        </div>

        <button
          type="button"
          onClick={onSwapSnapshots}
          title="Swap Baseline and Candidate directions"
          className="p-1.5 rounded hover:bg-surface-02 text-text-muted hover:text-foreground transition-colors shrink-0"
        >
          <RefreshIcon className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Change Filter Chips */}
      <div className="hidden lg:flex items-center gap-1 font-mono text-[10px]">
        <button
          type="button"
          onClick={() => onFilterChange("all")}
          className={`px-2 py-1 rounded border transition-colors ${
            filterKind === "all"
              ? "bg-surface-03 border-border-strong text-foreground font-semibold"
              : "bg-surface-01 border-border-subtle text-text-muted hover:text-foreground"
          }`}
        >
          All Changes
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("added")}
          className={`px-2 py-1 rounded border flex items-center gap-1 transition-colors ${
            filterKind === "added"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-300 font-semibold"
              : "bg-surface-01 border-border-subtle text-text-muted hover:text-emerald-400"
          }`}
        >
          <PlusIcon className="w-2.5 h-2.5 text-emerald-400" />
          <span>Added ({summary.addedNodesCount + summary.addedEdgesCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("removed")}
          className={`px-2 py-1 rounded border flex items-center gap-1 transition-colors ${
            filterKind === "removed"
              ? "bg-rose-950/40 border-rose-800 text-rose-300 font-semibold"
              : "bg-surface-01 border-border-subtle text-text-muted hover:text-rose-400"
          }`}
        >
          <MinusIcon className="w-2.5 h-2.5 text-rose-400" />
          <span>Removed ({summary.removedNodesCount + summary.removedEdgesCount})</span>
        </button>

        <button
          type="button"
          onClick={() => onFilterChange("modified")}
          className={`px-2 py-1 rounded border flex items-center gap-1 transition-colors ${
            filterKind === "modified"
              ? "bg-amber-950/40 border-amber-800 text-amber-300 font-semibold"
              : "bg-surface-01 border-border-subtle text-text-muted hover:text-amber-400"
          }`}
        >
          <EditIcon className="w-2.5 h-2.5 text-amber-400" />
          <span>Modified ({summary.modifiedNodesCount + summary.modifiedEdgesCount})</span>
        </button>

        {summary.regressionsCount > 0 && (
          <button
            type="button"
            onClick={() => onFilterChange("regressions")}
            className={`px-2 py-1 rounded border flex items-center gap-1 transition-colors ${
              filterKind === "regressions"
                ? "bg-red-950/50 border-red-800 text-red-200 font-semibold"
                : "bg-red-950/20 border-red-900/40 text-red-400 hover:text-red-300"
            }`}
          >
            <AlertTriangleIcon className="w-2.5 h-2.5 text-red-400" />
            <span>Regressions ({summary.regressionsCount})</span>
          </button>
        )}
      </div>

      {/* 3. Navigation Sync & Actions */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onToggleSyncNavigation}
          className={`h-7 px-2 rounded border font-mono text-[10px] flex items-center gap-1.5 transition-colors ${
            isSyncNavigation
              ? "bg-surface-03 border-border-strong text-foreground font-semibold"
              : "bg-surface-02 border-border-subtle text-text-muted hover:text-foreground"
          }`}
          title="Synchronize zoom and pan between Baseline and Candidate canvases"
        >
          <LayersIcon className="w-3 h-3 text-text-secondary" />
          <span className="hidden sm:inline">Sync Pan/Zoom</span>
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              isSyncNavigation ? "bg-emerald-400" : "bg-text-disabled"
            }`}
          />
        </button>

        {onApplyCandidate && (
          <Button
            type="button"
            size="sm"
            onClick={handleApply}
            className="h-7 text-xs font-semibold bg-white text-black hover:bg-neutral-200"
          >
            {applied ? (
              <>
                <CheckCircleIcon className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                Applied
              </>
            ) : (
              "Apply Candidate"
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
