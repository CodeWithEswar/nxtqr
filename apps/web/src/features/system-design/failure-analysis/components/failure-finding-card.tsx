"use client";

import * as React from "react";
import {
  AlertTriangleIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CursorIcon,
} from "@nxtqr/icons";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import type { FailureFinding, HealthSeverity } from "@nxtqr/architecture-intelligence";
import { FAILURE_RECOMMENDATION_REGISTRY } from "@nxtqr/architecture-intelligence";

export interface FailureFindingCardProps {
  finding: FailureFinding;
  isSelected?: boolean;
  onSelect?: (finding: FailureFinding) => void;
  onOpenInspector?: (nodeId: string) => void;
}

const SEVERITY_CONFIG: Record<
  HealthSeverity,
  { label: string; icon: React.ComponentType<{ className?: string }>; badgeClass: string }
> = {
  critical: {
    label: "Critical",
    icon: AlertCircleIcon,
    badgeClass: "border-rose-900/60 text-rose-400 bg-rose-950/20",
  },
  high: {
    label: "High",
    icon: AlertTriangleIcon,
    badgeClass: "border-amber-900/60 text-amber-400 bg-amber-950/20",
  },
  medium: {
    label: "Medium",
    icon: AlertTriangleIcon,
    badgeClass: "border-amber-900/40 text-amber-300 bg-amber-950/10",
  },
  low: {
    label: "Low",
    icon: AlertTriangleIcon,
    badgeClass: "border-border-default text-text-muted bg-surface-03",
  },
  info: {
    label: "Info",
    icon: AlertTriangleIcon,
    badgeClass: "border-border-subtle text-text-muted bg-surface-02",
  },
};

export function FailureFindingCard({
  finding,
  isSelected,
  onSelect,
  onOpenInspector,
}: FailureFindingCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const config = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.medium;
  const SeverityIcon = config.icon;

  const recommendations = (finding.recommendationIds || [])
    .map((id) => FAILURE_RECOMMENDATION_REGISTRY[id])
    .filter(Boolean);

  return (
    <div
      className={cn(
        "rounded-md border bg-surface-02 transition-colors select-none text-left overflow-hidden",
        isSelected
          ? "border-border-strong bg-surface-03 shadow-level-2"
          : "border-border-default hover:border-border-hover"
      )}
    >
      {/* Clickable Header Bar */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          onSelect?.(finding);
          setIsExpanded((prev) => !prev);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect?.(finding);
            setIsExpanded((prev) => !prev);
          }
        }}
        className="p-2.5 flex items-start justify-between gap-2 cursor-pointer"
      >
        <div className="flex items-start gap-2 min-w-0">
          <div className="mt-0.5 shrink-0 text-text-muted">
            <SeverityIcon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-[9px]">
              <Badge variant="outline" className={cn("h-4 px-1 rounded uppercase", config.badgeClass)}>
                {config.label}
              </Badge>
              <Badge
                variant="outline"
                className="h-4 px-1 rounded uppercase border-border-subtle bg-surface-01 text-text-secondary"
              >
                {finding.classification.replace(/-/g, " ")}
              </Badge>
              <span className="text-text-disabled font-mono">{finding.ruleId}</span>
            </div>
            <h5 className="font-sans text-xs font-semibold text-foreground leading-tight truncate">
              {finding.title}
            </h5>
          </div>
        </div>

        <div className="shrink-0 text-text-muted hover:text-foreground mt-0.5">
          {isExpanded ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
        </div>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border-subtle bg-surface-01 space-y-2.5 text-xs font-sans">
          {/* Explanation */}
          <div>
            <p className="text-text-secondary text-[11px] leading-relaxed">
              {finding.explanation}
            </p>
          </div>

          {/* Affected Nodes & Connections */}
          {finding.affectedNodeIds.length > 0 && (
            <div className="space-y-1 font-mono text-[10px]">
              <span className="text-text-muted uppercase tracking-wider block">
                Affected Components ({finding.affectedNodeIds.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {finding.affectedNodeIds.map((nodeId) => (
                  <Button
                    key={nodeId}
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenInspector?.(nodeId)}
                    className="h-5 px-1.5 text-[9px] font-mono border-border-subtle bg-surface-02 text-text-secondary hover:text-foreground hover:border-border-default"
                  >
                    <CursorIcon className="w-2.5 h-2.5 mr-1 text-text-muted" />
                    {nodeId}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Evidence */}
          {finding.evidence && finding.evidence.length > 0 && (
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                Graph Evidence & Indicators
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-text-secondary text-[10px] font-mono">
                {finding.evidence.map((ev, i) => (
                  <li key={i}>{ev.description}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Modeling Assumptions */}
          {finding.assumptions && finding.assumptions.length > 0 && (
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                Failure & Recovery Assumptions
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-text-muted text-[10px] italic">
                {finding.assumptions.map((ass, i) => (
                  <li key={i}>{ass}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Recommendations with Trade-Offs */}
          {recommendations.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-border-subtle">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                Remediation Guidance & Trade-Offs
              </span>
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-2 rounded bg-surface-02 border border-border-subtle space-y-1 text-[11px]"
                >
                  <div className="font-semibold text-foreground">{rec.title}</div>
                  <div className="text-text-secondary text-[10px] leading-relaxed">
                    {rec.description}
                  </div>
                  <div className="text-[10px] text-text-disabled font-mono border-t border-border-subtle pt-1 mt-1">
                    Trade-offs: {rec.tradeOffs.join("; ")}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
