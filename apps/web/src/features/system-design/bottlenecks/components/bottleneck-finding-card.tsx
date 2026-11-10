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
import type { BottleneckFinding, HealthSeverity } from "@nxtqr/architecture-intelligence";
import { BOTTLENECK_RECOMMENDATION_REGISTRY } from "@nxtqr/architecture-intelligence";

export interface BottleneckFindingCardProps {
  finding: BottleneckFinding;
  isSelected?: boolean;
  onSelect?: (finding: BottleneckFinding) => void;
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

export function BottleneckFindingCard({
  finding,
  isSelected,
  onSelect,
  onOpenInspector,
}: BottleneckFindingCardProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const config = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.medium;
  const SeverityIcon = config.icon;

  const recommendations = (finding.recommendationIds || [])
    .map((id) => BOTTLENECK_RECOMMENDATION_REGISTRY[id])
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
                {finding.bottleneckType.replace(/_/g, " ")}
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

          {/* Mathematical Calculations Breakdown */}
          {finding.calculations && finding.calculations.length > 0 && (
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                Deterministic Calculation
              </span>
              {finding.calculations.map((calc, i) => (
                <div
                  key={i}
                  className="p-2 rounded-md bg-surface-02 border border-border-subtle font-mono text-[10px] space-y-1"
                >
                  <div className="text-emerald-400 font-semibold">{calc.formula}</div>
                  <div className="text-text-muted text-[9px]">
                    Inputs: {JSON.stringify(calc.variables)}
                  </div>
                  <div className="text-text-secondary border-t border-border-subtle pt-0.5">
                    Result: <span className="text-foreground font-bold">{calc.result} {calc.unit}</span> ({calc.explanation})
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assumptions */}
          {finding.assumptions && finding.assumptions.length > 0 && (
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                Workload Assumptions
              </span>
              <ul className="list-disc list-inside text-[11px] text-text-muted space-y-0.5">
                {finding.assumptions.map((asm, i) => (
                  <li key={i}>{asm}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Actionable Recommendations & Trade-Offs */}
          {recommendations.length > 0 && (
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
                Remediation & Architectural Trade-Offs
              </span>
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-2 rounded-md bg-surface-02 border border-border-subtle text-[11px] space-y-1"
                >
                  <div className="font-semibold text-foreground">{rec.title}</div>
                  <p className="text-text-secondary text-[11px]">{rec.description}</p>
                  <div className="text-text-muted text-[10px] font-mono border-t border-border-subtle pt-1 mt-1">
                    Step: {rec.actionableStep}
                  </div>
                  {rec.tradeOffs.length > 0 && (
                    <div className="pt-1 space-y-0.5">
                      <span className="text-[9px] font-mono text-amber-400 uppercase">Trade-Offs:</span>
                      <ul className="list-disc list-inside text-[10px] text-text-muted">
                        {rec.tradeOffs.map((to, j) => (
                          <li key={j}>{to}</li>
                        ))}
                      </ul>
                    </div>
                  )}
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
                Focus Bottleneck Node
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
