"use client";

import * as React from "react";
import { AlertTriangleIcon, ChevronDownIcon, ChevronUpIcon } from "@nxtqr/icons";
import type { RecommendationConflict } from "@nxtqr/architecture-intelligence";

export interface RecommendationConflictBannerProps {
  conflicts: RecommendationConflict[];
  className?: string;
}

export function RecommendationConflictBanner({
  conflicts,
  className,
}: RecommendationConflictBannerProps) {
  const [expanded, setExpanded] = React.useState(false);

  if (conflicts.length === 0) return null;

  return (
    <div
      className={`p-2.5 rounded-md bg-amber-950/20 border border-amber-900/40 text-amber-300 font-sans text-xs space-y-1.5 shrink-0 ${
        className || ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-semibold">
          <AlertTriangleIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>{conflicts.length} Recommendation Conflict{conflicts.length > 1 ? "s" : ""} Detected</span>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-[10px] font-mono text-amber-400 hover:text-foreground flex items-center gap-0.5"
        >
          <span>{expanded ? "Hide Details" : "Resolve"}</span>
          {expanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
        </button>
      </div>

      <p className="text-[11px] text-amber-200/80 leading-relaxed">
        Some proposed architecture improvements compete or introduce conflicting trade-offs on shared components.
      </p>

      {expanded && (
        <div className="pt-2 border-t border-amber-900/30 space-y-2">
          {conflicts.map((c, i) => (
            <div key={i} className="p-2 rounded bg-surface-01 border border-border-default space-y-1 font-mono text-[10px]">
              <div className="font-bold text-amber-400 uppercase">
                {c.conflictType.replace(/-/g, " ")}
              </div>
              <p className="text-text-secondary leading-relaxed font-sans">{c.explanation}</p>
              <div className="mt-1 pt-1 border-t border-border-subtle">
                <span className="text-text-muted font-bold">Resolution Options:</span>
                <ul className="list-disc list-inside text-text-secondary mt-0.5 font-sans space-y-0.5">
                  {c.resolutionOptions.map((opt, optIdx) => (
                    <li key={optIdx}>{opt}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
