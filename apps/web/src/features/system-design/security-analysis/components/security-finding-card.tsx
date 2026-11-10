"use client";

import * as React from "react";
import {
  AlertTriangleIcon,
  AlertCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  CursorIcon,
  ShieldIcon,
  LockIcon,
} from "@nxtqr/icons";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import type { SecurityFinding, HealthSeverity } from "@nxtqr/architecture-intelligence";
import { SECURITY_RECOMMENDATIONS_CATALOG } from "@nxtqr/architecture-intelligence";

export interface SecurityFindingCardProps {
  finding: SecurityFinding;
  isSelected?: boolean;
  onSelect?: (finding: SecurityFinding) => void;
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
    icon: ShieldIcon,
    badgeClass: "border-border-default text-text-muted bg-surface-03",
  },
  info: {
    label: "Info",
    icon: ShieldIcon,
    badgeClass: "border-border-subtle text-text-muted bg-surface-02",
  },
};

export function SecurityFindingCard({
  finding,
  isSelected,
  onSelect,
  onOpenInspector,
}: SecurityFindingCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const config = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.medium;
  const SeverityIcon = config.icon;

  const recommendations = (finding.recommendationIds || [])
    .map((id) => SECURITY_RECOMMENDATIONS_CATALOG[id])
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
        className="p-3 cursor-pointer flex flex-col gap-2"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span
              className={cn(
                "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium border",
                config.badgeClass
              )}
            >
              <SeverityIcon className="w-2.5 h-2.5" />
              {config.label}
            </span>

            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-04 border border-border-subtle text-text-secondary">
              {finding.ruleId}
            </span>

            {finding.strideCategory && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-03 border border-border-subtle text-text-muted capitalize">
                STRIDE: {finding.strideCategory}
              </span>
            )}
          </div>

          <div className="text-text-muted hover:text-text-primary transition-colors flex-shrink-0">
            {isExpanded ? (
              <ChevronUpIcon className="w-3.5 h-3.5" />
            ) : (
              <ChevronDownIcon className="w-3.5 h-3.5" />
            )}
          </div>
        </div>

        <h4 className="text-xs font-medium text-text-primary leading-snug">
          {finding.title}
        </h4>

        {/* Affected Elements Pill Row */}
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
          {finding.affectedNodeIds.map((nodeId) => (
            <button
              key={nodeId}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInspector?.(nodeId);
              }}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-04 border border-border-default hover:border-border-strong text-text-secondary hover:text-text-primary transition-colors"
              title="Inspect component"
            >
              <CursorIcon className="w-2.5 h-2.5 text-text-muted" />
              {nodeId}
            </button>
          ))}
          {finding.affectedEdgeIds.map((edgeId) => (
            <span
              key={edgeId}
              className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-04/50 border border-border-subtle text-text-muted"
            >
              edge: {edgeId}
            </span>
          ))}
        </div>
      </div>

      {/* Expanded Details Region */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-border-subtle space-y-3 bg-surface-01/60">
          {/* Explanation */}
          <div>
            <p className="text-[11px] leading-relaxed text-text-secondary">
              {finding.explanation}
            </p>
          </div>

          {/* Evidence List */}
          {finding.evidence && finding.evidence.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block">
                Graph Evidence & Indicators:
              </span>
              <div className="space-y-1">
                {finding.evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-surface-03/80 border border-border-subtle text-[11px] text-text-secondary"
                  >
                    <p>{ev.description}</p>
                    {ev.expectedValue !== undefined && (
                      <div className="mt-1 flex items-center gap-2 text-[10px] font-mono text-text-muted">
                        <span>Expected: {String(ev.expectedValue)}</span>
                        <span>•</span>
                        <span>Actual: {String(ev.actualValue)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Modeling Assumptions */}
          {finding.assumptions && finding.assumptions.length > 0 && (
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted block">
                Security Assumptions:
              </span>
              <ul className="list-disc list-inside space-y-0.5 text-[10px] text-text-muted font-mono">
                {finding.assumptions.map((assump, i) => (
                  <li key={i}>{assump}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations / Remediation Actions */}
          {recommendations.length > 0 && (
            <div className="space-y-1.5 pt-1 border-t border-border-subtle">
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted flex items-center gap-1">
                <LockIcon className="w-2.5 h-2.5" />
                Actionable Hardening Guidance:
              </span>

              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-2 rounded bg-surface-03 border border-border-subtle space-y-1.5"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-text-primary">
                      {rec.title}
                    </span>
                    <div className="flex items-center gap-1 font-mono text-[9px]">
                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-border-default">
                        Effort: {rec.effort}
                      </Badge>
                      <Badge variant="outline" className="text-[9px] px-1 py-0 border-border-default">
                        Impact: {rec.impact}
                      </Badge>
                    </div>
                  </div>
                  <p className="text-[11px] text-text-muted leading-relaxed">
                    {rec.actionableStep}
                  </p>
                  {rec.suggestedComponentTypes && rec.suggestedComponentTypes.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[9px] font-mono text-text-disabled">Suggested:</span>
                      {rec.suggestedComponentTypes.map((comp) => (
                        <span
                          key={comp}
                          className="text-[9px] font-mono px-1 py-0.2 rounded bg-surface-04 border border-border-subtle text-text-secondary"
                        >
                          {comp}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-1">
            <span className="text-[10px] font-mono text-text-disabled">
              Confidence: {finding.confidence}
            </span>
            {finding.affectedNodeIds[0] && (
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] px-2 border-border-default hover:border-border-strong"
                onClick={() => onOpenInspector?.(finding.affectedNodeIds[0])}
              >
                Inspect Primary Node
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

