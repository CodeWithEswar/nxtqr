"use client";

import * as React from "react";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
} from "@nxtqr/icons";
import type {
  ComparisonSummary,
  ArchitecturalRegression,
  EngineAnalysisComparison,
} from "@nxtqr/architecture-intelligence";

export interface ComparisonSummaryPanelProps {
  summary: ComparisonSummary;
  regressions: ArchitecturalRegression[];
  analysisComparison?: EngineAnalysisComparison;
  onSelectRegression?: (regressionId: string) => void;
  className?: string;
}

export function ComparisonSummaryPanel({
  summary,
  regressions,
  analysisComparison: _analysisComparison,
  onSelectRegression,
  className,
}: ComparisonSummaryPanelProps) {
  const assessmentBadge = () => {
    switch (summary.overallAssessment) {
      case "improved":
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 font-mono text-[10px] font-semibold flex items-center gap-1">
            <CheckCircleIcon className="w-3 h-3 text-emerald-400" />
            Improved
          </span>
        );
      case "regressed":
        return (
          <span className="px-2 py-0.5 rounded bg-red-950/40 border border-red-800 text-red-300 font-mono text-[10px] font-semibold flex items-center gap-1">
            <AlertTriangleIcon className="w-3 h-3 text-red-400" />
            Regressed
          </span>
        );
      case "mixed":
        return (
          <span className="px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800 text-amber-300 font-mono text-[10px] font-semibold">
            Mixed Trade-offs
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-surface-02 border border-border-subtle text-text-muted font-mono text-[10px]">
            Neutral
          </span>
        );
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-surface-01 text-foreground overflow-y-auto p-3 space-y-3 font-sans text-xs select-none ${
        className || ""
      }`}
    >
      {/* 1. Overall Assessment Header */}
      <div className="flex items-center justify-between gap-2 pb-2 border-b border-border-default">
        <div>
          <div className="font-semibold text-foreground text-sm">Architecture Diff Summary</div>
          <div className="font-mono text-[10px] text-text-muted">
            Semantic Comparison Results
          </div>
        </div>
        {assessmentBadge()}
      </div>

      {/* 2. Top-Level Metric Grid */}
      <div className="grid grid-cols-3 gap-1.5 font-mono text-[10px]">
        <div className="p-2 rounded bg-surface-02 border border-border-subtle text-center">
          <div className="text-text-muted text-[8px] uppercase">Nodes Added</div>
          <div className="text-emerald-400 font-bold text-sm">+{summary.addedNodesCount}</div>
        </div>
        <div className="p-2 rounded bg-surface-02 border border-border-subtle text-center">
          <div className="text-text-muted text-[8px] uppercase">Nodes Removed</div>
          <div className="text-rose-400 font-bold text-sm">-{summary.removedNodesCount}</div>
        </div>
        <div className="p-2 rounded bg-surface-02 border border-border-subtle text-center">
          <div className="text-text-muted text-[8px] uppercase">Modified</div>
          <div className="text-amber-400 font-bold text-sm">{summary.modifiedNodesCount}</div>
        </div>
      </div>

      {/* 3. Findings Resolved vs Introduced */}
      <div className="p-2.5 rounded bg-surface-02 border border-border-subtle space-y-1.5 font-mono text-[11px]">
        <div className="text-text-muted text-[9px] uppercase font-bold">Analysis Findings</div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-emerald-400 font-semibold">
            +{summary.resolvedFindingsCount} Resolved
          </span>
          <span className="text-text-muted">|</span>
          <span
            className={
              summary.introducedFindingsCount > 0
                ? "text-red-400 font-semibold"
                : "text-text-disabled"
            }
          >
            {summary.introducedFindingsCount} Introduced
          </span>
        </div>
      </div>

      {/* 4. Supported Regressions List */}
      {regressions.length > 0 && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-red-400 font-mono text-[10px] uppercase font-bold">
            <AlertTriangleIcon className="w-3.5 h-3.5 shrink-0" />
            <span>Detected Regressions ({regressions.length})</span>
          </div>

          <div className="space-y-1">
            {regressions.map((reg) => (
              <button
                key={reg.id}
                type="button"
                onClick={() => onSelectRegression?.(reg.id)}
                className="w-full text-left p-2 rounded bg-red-950/20 border border-red-900/40 hover:border-red-700/60 transition-colors space-y-0.5"
              >
                <div className="flex items-center justify-between gap-1 font-mono text-[10px]">
                  <span className="text-red-300 font-semibold truncate">{reg.title}</span>
                  <span className="text-red-400 text-[9px] uppercase shrink-0">
                    {reg.severity}
                  </span>
                </div>
                <p className="text-text-muted text-[10px] line-clamp-2">{reg.explanation}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 5. Key Trade-offs */}
      {summary.keyTradeoffs.length > 0 && (
        <div className="space-y-1.5">
          <div className="font-mono text-[10px] uppercase font-bold text-text-muted">
            Architectural Trade-offs
          </div>
          <ul className="list-disc list-inside space-y-1 text-text-secondary text-[11px] leading-relaxed">
            {summary.keyTradeoffs.map((tradeoff, i) => (
              <li key={i}>{tradeoff}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
