"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PlayIcon,
} from "@nxtqr/icons";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import type {
  UnifiedRecommendation,
  AnalysisEngineSource,
} from "@nxtqr/architecture-intelligence";

export interface UnifiedRecommendationCardProps {
  recommendation: UnifiedRecommendation;
  isSelected?: boolean;
  onSelect?: () => void;
  onPreview?: () => void;
  onApply?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const ENGINE_LABELS: Record<AnalysisEngineSource, { label: string; className: string }> = {
  validation: { label: "Validation", className: "text-amber-400 border-amber-900/40 bg-amber-950/20" },
  health: { label: "Health", className: "text-blue-400 border-blue-900/40 bg-blue-950/20" },
  bottlenecks: { label: "Bottlenecks", className: "text-rose-400 border-rose-900/40 bg-rose-950/20" },
  spof: { label: "SPOF", className: "text-orange-400 border-orange-900/40 bg-orange-950/20" },
  security: { label: "Security", className: "text-emerald-400 border-emerald-900/40 bg-emerald-950/20" },
  scalability: { label: "Scalability", className: "text-cyan-400 border-cyan-900/40 bg-cyan-950/20" },
  reliability: { label: "Reliability", className: "text-purple-400 border-purple-900/40 bg-purple-950/20" },
};

export function UnifiedRecommendationCard({
  recommendation,
  isSelected = false,
  onSelect,
  onPreview,
  onApply,
  onDismiss: _onDismiss,
  className,
}: UnifiedRecommendationCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  const priorityColor =
    recommendation.priority === "critical"
      ? "text-rose-400 border-border-default bg-rose-950/20"
      : recommendation.priority === "high"
        ? "text-amber-400 border-border-default bg-amber-950/20"
        : recommendation.priority === "medium"
          ? "text-blue-400 border-border-default bg-blue-950/20"
          : "text-text-muted border-border-default bg-surface-02";

  return (
    <div
      onClick={onSelect}
      className={cn(
        "rounded-md border p-3 bg-surface-02 transition-colors cursor-pointer space-y-2.5 font-sans",
        isSelected
          ? "border-border-strong bg-surface-03 shadow-level-2"
          : "border-border-default hover:border-border-hover hover:bg-surface-03",
        className
      )}
    >
      {/* 1. Header with Priority & Provenance */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge variant="outline" className={cn("text-[9px] font-mono px-1.5 py-0.5 rounded", priorityColor)}>
            {recommendation.priority.toUpperCase()} · Score {recommendation.score}
          </Badge>

          {recommendation.feasibility === "conditional" && (
            <Badge variant="outline" className="text-[9px] font-mono text-amber-400 border-border-default bg-amber-950/10 px-1.5 py-0.5 rounded">
              CONDITIONAL
            </Badge>
          )}

          {recommendation.lifecycleState === "applied" && (
            <Badge variant="outline" className="text-[9px] font-mono text-emerald-400 border-border-default bg-emerald-950/10 px-1.5 py-0.5 rounded">
              APPLIED
            </Badge>
          )}
        </div>

        {/* Multi-Engine Provenance Badges */}
        <div className="flex items-center gap-1 shrink-0">
          {recommendation.sourceEngines.map((src) => {
            const info = ENGINE_LABELS[src] || { label: src, className: "text-text-muted border-border-default bg-surface-01" };
            return (
              <span
                key={src}
                className={cn("text-[8px] font-mono px-1 py-0.2 rounded border", info.className)}
                title={`Evidence verified by ${info.label} engine`}
              >
                {info.label}
              </span>
            );
          })}
        </div>
      </div>

      {/* 2. Title & Problem Summary */}
      <div>
        <h4 className="text-xs font-semibold text-foreground leading-snug">
          {recommendation.title}
        </h4>
        <p className="text-[11px] text-text-secondary mt-1 leading-relaxed">
          {recommendation.summary}
        </p>
      </div>

      {/* 3. Feasibility warning if conditional */}
      {recommendation.feasibility === "conditional" && recommendation.feasibilityReason && (
        <div className="p-2 rounded bg-surface-01 border border-border-default font-mono text-[10px] text-amber-400 flex items-start gap-1.5">
          <AlertTriangleIcon className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{recommendation.feasibilityReason}</span>
        </div>
      )}

      {/* 4. Action Buttons */}
      <div className="flex items-center justify-between pt-1 border-t border-border-subtle gap-2">
        <div className="flex items-center gap-1.5">
          {onPreview && recommendation.proposedOperations.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onPreview();
              }}
              className="h-6 text-[10px] font-mono px-2 border-border-default text-text-secondary hover:text-foreground hover:bg-surface-04"
            >
              <PlayIcon className="w-2.5 h-2.5 mr-1" />
              What-If Preview
            </Button>
          )}

          {onApply && recommendation.proposedOperations.length > 0 && recommendation.lifecycleState !== "applied" && (
            <Button
              variant="default"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onApply();
              }}
              className="h-6 text-[10px] font-mono px-2 bg-foreground text-background hover:bg-neutral-200"
            >
              <CheckCircleIcon className="w-2.5 h-2.5 mr-1" />
              Apply
            </Button>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded(!expanded);
          }}
          className="text-text-muted hover:text-foreground text-[10px] font-mono flex items-center gap-0.5 p-1 rounded"
        >
          <span>{expanded ? "Less" : "Details"}</span>
          {expanded ? <ChevronUpIcon className="w-3 h-3" /> : <ChevronDownIcon className="w-3 h-3" />}
        </button>
      </div>

      {/* 5. Expanded Engineering Details */}
      {expanded && (
        <div className="pt-2 border-t border-border-subtle space-y-2.5 text-[11px] leading-relaxed">
          {/* Expected Benefits */}
          <div>
            <div className="font-mono text-[10px] uppercase font-bold text-emerald-400 mb-1">
              Architecture Benefits
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-text-secondary">
              {recommendation.benefits.map((b, i) => (
                <li key={i}>{b}</li>
              ))}
            </ul>
          </div>

          {/* Trade-offs & Risks */}
          <div>
            <div className="font-mono text-[10px] uppercase font-bold text-amber-400 mb-1">
              Engineering Trade-offs & Risks
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-text-muted">
              {recommendation.tradeoffs.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>

          {/* Prerequisites */}
          {recommendation.prerequisites.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase font-bold text-blue-400 mb-1">
                Implementation Prerequisites
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-text-secondary">
                {recommendation.prerequisites.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Alternative Strategies */}
          {recommendation.alternativeStrategies && recommendation.alternativeStrategies.length > 0 && (
            <div>
              <div className="font-mono text-[10px] uppercase font-bold text-text-muted mb-1">
                Alternative Architectural Strategies
              </div>
              <div className="space-y-1.5">
                {recommendation.alternativeStrategies.map((alt) => (
                  <div key={alt.strategyId} className="p-1.5 rounded bg-surface-01 border border-border-subtle">
                    <span className="font-semibold text-foreground text-[10px]">{alt.title}</span>
                    <p className="text-[10px] text-text-secondary mt-0.5">{alt.explanation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Affected Components */}
          <div className="pt-1 flex flex-wrap items-center gap-1 font-mono text-[9px] text-text-disabled">
            <span>Targets:</span>
            {recommendation.affectedNodeIds.map((id) => (
              <span key={id} className="px-1.5 py-0.5 rounded bg-surface-01 border border-border-subtle text-text-muted">
                #{id}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
