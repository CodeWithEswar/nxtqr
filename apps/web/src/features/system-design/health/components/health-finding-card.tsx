"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangleIcon,
  AlertCircleIcon,
  CheckCircleIcon,
  HelpCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ExternalLinkIcon,
  CursorIcon,
} from "@nxtqr/icons";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import type { HealthFinding, HealthSeverity } from "@nxtqr/architecture-intelligence";
import { RECOMMENDATION_REGISTRY } from "@nxtqr/architecture-intelligence";

export interface HealthFindingCardProps {
  finding: HealthFinding;
  isSelected?: boolean;
  onSelect?: (finding: HealthFinding) => void;
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
    icon: HelpCircleIcon,
    badgeClass: "border-border-default text-text-muted bg-surface-03",
  },
  info: {
    label: "Info",
    icon: CheckCircleIcon,
    badgeClass: "border-border-subtle text-text-muted bg-surface-02",
  },
};

export function HealthFindingCard({
  finding,
  isSelected,
  onSelect,
  onOpenInspector,
}: HealthFindingCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const config = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info;
  const SeverityIcon = config.icon;

  const recommendations = (finding.recommendationIds || [])
    .map((id) => RECOMMENDATION_REGISTRY[id])
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
                {finding.dimension}
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

          {/* Evidence Details */}
          {finding.evidence.length > 0 && (
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                Evidence
              </span>
              <div className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1 font-mono text-[10px]">
                {finding.evidence.map((ev, i) => (
                  <div key={i} className="text-text-secondary leading-snug">
                    <span className="text-foreground font-semibold">[{ev.kind}]</span> {ev.description}
                    {ev.expectedValue !== undefined && (
                      <div className="text-text-muted pl-2 mt-0.5">
                        Expected: <span className="text-emerald-400">{String(ev.expectedValue)}</span> | Actual:{" "}
                        <span className="text-rose-400">{String(ev.actualValue)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assumptions */}
          {finding.assumptions.length > 0 && (
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                Modeling Assumptions
              </span>
              <ul className="list-disc list-inside text-[11px] text-text-muted space-y-0.5">
                {finding.assumptions.map((asm, i) => (
                  <li key={i}>{asm}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                Actionable Recommendation
              </span>
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-2 rounded-md bg-surface-02 border border-border-subtle text-[11px] space-y-1"
                >
                  <div className="font-semibold text-foreground flex items-center justify-between">
                    <span>{rec.title}</span>
                    <Badge variant="outline" className="text-[9px] font-mono h-3.5 px-1 rounded text-text-muted border-border-subtle">
                      Impact: {rec.impact}
                    </Badge>
                  </div>
                  <p className="text-text-secondary text-[11px]">{rec.description}</p>
                  <p className="text-text-muted text-[10px] font-mono border-t border-border-subtle pt-1 mt-1">
                    Step: {rec.actionableStep}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Actions Footer */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-border-subtle">
            {finding.affectedNodeIds.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onSelect?.(finding);
                  if (onOpenInspector) onOpenInspector(finding.affectedNodeIds[0]);
                }}
                className="h-6 px-2 text-[10px] font-mono rounded-md border-border-default gap-1"
              >
                <CursorIcon className="w-3 h-3" />
                Focus Affected Node
              </Button>
            )}

            {finding.documentationId && (
              <Link
                href={`/tutorial/system-design/components/${finding.documentationId}`}
                target="_blank"
                className="h-6 px-2 text-[10px] font-mono rounded-md border border-border-default bg-surface-02 hover:bg-surface-03 text-text-secondary hover:text-foreground inline-flex items-center gap-1 transition-colors"
              >
                <ExternalLinkIcon className="w-3 h-3" />
                Component Reference
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

