"use client";

import React from "react";
import type { SimulationComparisonResult } from "@nxtqr/architecture-intelligence";
import { ShieldIcon } from "@nxtqr/icons";

export interface SimulationComparisonProps {
  comparison: SimulationComparisonResult | null;
  onClose: () => void;
  className?: string;
}

export function SimulationComparison({
  comparison,
  onClose,
  className = "",
}: SimulationComparisonProps) {
  if (!comparison) {
    return (
      <div className={`p-6 text-center text-text-muted text-xs ${className}`}>
        No comparison available. Configure a candidate architecture to evaluate resilience improvement.
      </div>
    );
  }

  const isBlastImproved = comparison.blastRadiusScoreDelta < 0;

  return (
    <div className={`flex flex-col h-full bg-surface-01 border border-border-default rounded-md overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle bg-surface-02">
        <div>
          <span className="font-semibold text-xs text-white">Resilience What-If Comparison</span>
          <p className="text-[10px] text-text-muted">Baseline ({comparison.baselineRevision}) vs Candidate ({comparison.candidateRevision})</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-xs text-text-muted hover:text-white px-2 py-1 rounded-md border border-border-subtle hover:bg-surface-03"
        >
          Close
        </button>
      </div>

      {/* Comparison Metrics */}
      <div className="p-4 space-y-4 overflow-y-auto text-xs">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-surface-02 border border-border-subtle rounded-md space-y-1">
            <span className="text-text-muted text-[11px]">Blast Radius Delta</span>
            <div className="flex items-baseline gap-2">
              <span className={`text-lg font-bold font-mono ${isBlastImproved ? "text-green-400" : "text-red-400"}`}>
                {comparison.blastRadiusScoreDelta > 0 ? `+${comparison.blastRadiusScoreDelta}` : comparison.blastRadiusScoreDelta}%
              </span>
              <span className="text-[10px] text-text-muted font-mono">
                ({comparison.baselineBlastRadiusScore}% ➔ {comparison.candidateBlastRadiusScore}%)
              </span>
            </div>
            <p className="text-[10px] text-text-secondary">
              {isBlastImproved ? "Reduced downstream failure cascading." : "Increased system blast radius."}
            </p>
          </div>

          <div className="p-3 bg-surface-02 border border-border-subtle rounded-md space-y-1">
            <span className="text-text-muted text-[11px]">Journey Impact Delta</span>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-bold font-mono text-green-400">
                {comparison.journeyAvailabilityDelta > 0 ? `+${comparison.journeyAvailabilityDelta}` : comparison.journeyAvailabilityDelta}
              </span>
              <span className="text-[10px] text-text-muted font-mono">
                ({comparison.baselineUnavailableJourneys} ➔ {comparison.candidateUnavailableJourneys} unavailable)
              </span>
            </div>
            <p className="text-[10px] text-text-secondary">
              Critical journeys preserved during outage.
            </p>
          </div>
        </div>

        {/* Executive Summary */}
        <div className="p-3 bg-surface-02 border border-border-subtle rounded-md space-y-1.5">
          <span className="font-semibold text-white text-[11px]">Resilience Assessment Summary</span>
          <p className="text-[11px] text-text-secondary leading-relaxed">
            {comparison.summary}
          </p>
        </div>

        {/* Active Resilience Controls */}
        {comparison.newResilienceControlsActive.length > 0 && (
          <div className="space-y-2">
            <span className="font-semibold text-white text-[11px]">Active Resilience Controls in Candidate:</span>
            <div className="space-y-1.5">
              {comparison.newResilienceControlsActive.map((ctrl, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 p-2 bg-surface-02 border border-border-subtle rounded-md text-[11px] text-text-secondary"
                >
                  <ShieldIcon className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                  <span>{ctrl}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Improved Components */}
        {comparison.improvedComponentIds.length > 0 && (
          <div className="space-y-1.5">
            <span className="font-semibold text-white text-[11px]">Components Protected from Failure:</span>
            <div className="flex flex-wrap gap-1.5">
              {comparison.improvedComponentIds.map((id) => (
                <span
                  key={id}
                  className="px-2 py-0.5 bg-green-950/50 text-green-300 border border-green-800/80 rounded-md font-mono text-[10px]"
                >
                  {id}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
