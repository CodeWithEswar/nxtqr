"use client";

import * as React from "react";
import {
  type ScalabilityRecommendation,
  type RecommendationFeasibility,
  type ImplementationComplexity,
} from "@nxtqr/architecture-intelligence";
import { Badge, Button } from "@nxtqr/ui";
import { ChevronDownIcon, ChevronUpIcon, LayersIcon, CheckCircleIcon, AlertTriangleIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export interface ScalabilityRecommendationCardProps {
  recommendation: ScalabilityRecommendation;
  isActive?: boolean;
  onSelect?: () => void;
  onPreviewWhatIf?: () => void;
  className?: string;
}

export function ScalabilityRecommendationCard({
  recommendation,
  isActive,
  onSelect,
  onPreviewWhatIf,
  className,
}: ScalabilityRecommendationCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  const getFeasibilityBadge = (feasibility: RecommendationFeasibility) => {
    switch (feasibility) {
      case "applicable":
        return (
          <Badge
            variant="outline"
            className="text-[9px] font-mono px-1.5 py-0 h-4 border-sky-900/60 text-sky-400 bg-sky-950/20"
          >
            Applicable
          </Badge>
        );
      case "conditional":
        return (
          <Badge
            variant="outline"
            className="text-[9px] font-mono px-1.5 py-0 h-4 border-amber-900/60 text-amber-400 bg-amber-950/20"
          >
            Conditional
          </Badge>
        );
      case "not-applicable":
        return (
          <Badge
            variant="outline"
            className="text-[9px] font-mono px-1.5 py-0 h-4 border-border-default text-text-disabled bg-surface-02"
          >
            Not Applicable
          </Badge>
        );
      case "insufficient-evidence":
        return (
          <Badge
            variant="outline"
            className="text-[9px] font-mono px-1.5 py-0 h-4 border-border-default text-text-muted bg-surface-02"
          >
            Need Workload Data
          </Badge>
        );
    }
  };

  const getComplexityBadge = (complexity: ImplementationComplexity) => {
    switch (complexity) {
      case "low":
        return (
          <span className="text-[10px] font-mono text-emerald-400">
            Low Effort
          </span>
        );
      case "medium":
        return (
          <span className="text-[10px] font-mono text-amber-400">
            Medium Effort
          </span>
        );
      case "high":
        return (
          <span className="text-[10px] font-mono text-rose-400">
            High Effort
          </span>
        );
    }
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative rounded-md border text-xs transition-colors cursor-pointer p-3 space-y-2.5",
        isActive
          ? "bg-surface-03 border-border-strong shadow-level-2"
          : "bg-surface-02 border-border-default hover:border-border-hover hover:bg-surface-03/70",
        className
      )}
    >
      {/* Top Meta Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant="outline"
            className="text-[9px] font-mono uppercase px-1.5 py-0 h-4 border-border-default text-text-secondary bg-surface-01"
          >
            {recommendation.strategy.replace(/_/g, " ")}
          </Badge>
          {getFeasibilityBadge(recommendation.feasibility)}
        </div>

        <div className="flex items-center gap-2">
          {getComplexityBadge(recommendation.tradeoffs.implementationComplexity)}
        </div>
      </div>

      {/* Title & Target Component */}
      <div>
        <h4 className="font-sans font-medium text-foreground text-xs leading-snug">
          {recommendation.title}
        </h4>
        {recommendation.affectedNodeIds.length > 0 && (
          <p className="font-mono text-[10px] text-text-muted mt-0.5">
            Target: <span className="text-text-secondary">{recommendation.affectedNodeIds.join(", ")}</span>
          </p>
        )}
      </div>

      {/* Summary */}
      <p className="text-[11px] text-text-secondary font-sans leading-relaxed">
        {recommendation.summary}
      </p>

      {/* Proposed Operations Preview */}
      {recommendation.proposedOperations.length > 0 && (
        <div className="rounded-md bg-surface-01 border border-border-default p-2 space-y-1">
          <div className="flex items-center justify-between text-[10px] font-mono text-text-muted">
            <span>Proposed Graph Operations ({recommendation.proposedOperations.length})</span>
            <span className="text-text-disabled">Reversibility: {recommendation.tradeoffs.reversibility}</span>
          </div>
          <div className="space-y-0.5 font-mono text-[10px] text-text-secondary">
            {recommendation.proposedOperations.map((op, idx) => (
              <div key={idx} className="flex items-center gap-1.5 truncate">
                <span className="text-sky-400">&bull;</span>
                <span className="truncate">
                  {op.type === "adjust_instances" && `Scale instances on ${op.nodeId} to ${op.newReplicas}x`}
                  {op.type === "add_node" && `Add node ${op.node.label || op.node.id} (${op.node.type})`}
                  {op.type === "insert_mediator" && `Insert mediator ${op.mediatorNode.label || op.mediatorNode.id} replacing edge`}
                  {op.type === "update_node_config" && `Update config on ${op.nodeId}`}
                  {op.type === "add_edge" && `Connect ${op.edge.source} -> ${op.edge.target}`}
                  {op.type === "delete_edge" && `Remove edge ${op.edgeId}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trade-offs Collapsible Section */}
      {isExpanded && (
        <div className="pt-2 border-t border-border-subtle space-y-2 text-[11px]">
          {/* Benefits */}
          {recommendation.benefits.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-medium text-emerald-400 flex items-center gap-1">
                <CheckCircleIcon className="w-3 h-3" /> Architecture Benefits
              </span>
              <ul className="list-disc list-inside text-text-secondary pl-1 space-y-0.5">
                {recommendation.benefits.map((adv, idx) => (
                  <li key={idx}>{adv}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Trade-off Implications */}
          <div className="space-y-1 font-mono text-[10px] text-text-muted">
            <span className="text-[10px] font-mono font-medium text-amber-400 flex items-center gap-1">
              <AlertTriangleIcon className="w-3 h-3" /> Trade-offs &amp; Implications
            </span>
            <div className="space-y-1 pl-1 text-text-secondary">
              <div>&bull; Reliability: {recommendation.tradeoffs.reliabilityImplications}</div>
              <div>&bull; Security: {recommendation.tradeoffs.securityImplications}</div>
              <div>&bull; Consistency: {recommendation.tradeoffs.consistencyImplications}</div>
              <div>&bull; Cost Impact: {recommendation.tradeoffs.costImpact}</div>
            </div>
          </div>

          {/* Operational Impacts */}
          <div className="grid grid-cols-2 gap-2 text-[10px] font-mono pt-1 text-text-muted">
            <div>
              Reversibility: <span className="text-text-secondary">{recommendation.tradeoffs.reversibility}</span>
            </div>
            <div>
              Operational Effort: <span className="text-text-secondary">{recommendation.tradeoffs.operationalComplexity}</span>
            </div>
            <div>
              Confidence: <span className="text-text-secondary">{recommendation.confidence}</span>
            </div>
            <div>
              Rank Score: <span className="text-text-secondary">{recommendation.rankScore}</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border-subtle">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="h-6 px-1.5 text-[10px] font-mono text-text-muted hover:text-foreground gap-1"
        >
          {isExpanded ? (
            <>
              <ChevronUpIcon className="w-3 h-3" /> Hide Trade-offs
            </>
          ) : (
            <>
              <ChevronDownIcon className="w-3 h-3" /> View Trade-offs
            </>
          )}
        </Button>

        {recommendation.proposedOperations.length > 0 && onPreviewWhatIf && (
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPreviewWhatIf();
            }}
            className="h-6 px-2 text-[10px] font-mono text-sky-400 border-sky-900/60 bg-sky-950/20 hover:bg-sky-900/30 gap-1"
          >
            <LayersIcon className="w-3 h-3" />
            <span>What-If Preview</span>
          </Button>
        )}
      </div>
    </div>
  );
}
