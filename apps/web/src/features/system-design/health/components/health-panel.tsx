"use client";

import * as React from "react";
import {
  RefreshIcon,
  CloseIcon,
  SearchIcon,
  CheckCircleIcon,
  CopyIcon,
  ActivityIcon,
} from "@nxtqr/icons";
import { Badge, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useArchitectureHealth } from "../hooks/use-architecture-health";
import { HealthFindingCard } from "./health-finding-card";
import type { HealthDimension, HealthFinding } from "@nxtqr/architecture-intelligence";

export interface HealthPanelProps {
  className?: string;
  onClose?: () => void;
  onFocusNode?: (nodeId: string) => void;
  onFocusEdge?: (edgeId: string) => void;
}

const DIMENSIONS: { id: HealthDimension; label: string }[] = [
  { id: "reliability", label: "Reliability" },
  { id: "security", label: "Security" },
  { id: "scalability", label: "Scalability" },
  { id: "performance", label: "Performance" },
  { id: "maintainability", label: "Maintainability" },
  { id: "operations", label: "Operations" },
];

export function HealthPanel({
  className,
  onClose,
  onFocusNode,
  onFocusEdge,
}: HealthPanelProps) {
  const {
    report,
    findings,
    dimensionFilter,
    setDimensionFilter,
    severityFilter,
    setSeverityFilter,
    searchQuery,
    setSearchQuery,
    activeFindingId,
    focusFinding,
    reassess,
    isAssessing,
  } = useArchitectureHealth();

  const [copied, setCopied] = React.useState(false);

  const handleSelectFinding = (finding: HealthFinding) => {
    focusFinding(finding);
    if (finding.affectedEdgeIds.length > 0 && onFocusEdge) {
      onFocusEdge(finding.affectedEdgeIds[0]);
    } else if (finding.affectedNodeIds.length > 0 && onFocusNode) {
      onFocusNode(finding.affectedNodeIds[0]);
    }
  };

  const copyReportSnapshot = () => {
    navigator.clipboard.writeText(JSON.stringify(report, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const score = report.overallScore;
  const grade = report.overallGrade;

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-surface-01 text-foreground select-none overflow-hidden",
        className
      )}
    >
      {/* 1. Header Bar */}
      <div className="h-9 px-3 border-b border-border-default bg-surface-02 flex items-center justify-between shrink-0 font-mono text-xs">
        <div className="flex items-center gap-2">
          <ActivityIcon className={cn("w-3.5 h-3.5 text-text-muted", isAssessing && "animate-pulse")} />
          <span className="font-semibold text-foreground">Architecture Health</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-mono h-4 px-1 rounded border-border-default",
              score !== null && score >= 80
                ? "text-emerald-400 bg-emerald-950/20"
                : score !== null && score >= 60
                  ? "text-amber-400 bg-amber-950/20"
                  : score !== null
                    ? "text-rose-400 bg-rose-950/20"
                    : "text-text-disabled bg-surface-01"
            )}
          >
            {score !== null ? `Grade ${grade} · ${score}/100` : "Insufficient Evidence"}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={copyReportSnapshot}
            className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
            title={copied ? "Copied JSON Report!" : "Copy Health Assessment JSON"}
          >
            <CopyIcon className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={reassess}
            className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
            title="Re-run health assessment"
          >
            <RefreshIcon className={cn("w-3.5 h-3.5", isAssessing && "animate-spin")} />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
              title="Close Health Panel"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. 6-Dimension Score Grid */}
      <div className="p-2 border-b border-border-subtle bg-surface-01 grid grid-cols-3 gap-1.5 shrink-0">
        {DIMENSIONS.map((dim) => {
          const dimData = report.dimensions[dim.id];
          const isSelected = dimensionFilter === dim.id;
          const dimScore = dimData?.score;
          const dimGrade = dimData?.grade || "N/A";

          return (
            <button
              key={dim.id}
              type="button"
              onClick={() => setDimensionFilter(isSelected ? "all" : dim.id)}
              className={cn(
                "p-1.5 rounded-md border text-left transition-colors flex flex-col justify-between",
                isSelected
                  ? "border-border-strong bg-surface-03 shadow-level-2"
                  : "border-border-subtle bg-surface-02 hover:border-border-hover hover:bg-surface-03"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-mono text-[10px] text-text-muted uppercase truncate">
                  {dim.label}
                </span>
                <span
                  className={cn(
                    "font-mono text-[9px] font-bold",
                    dimScore !== null && dimScore >= 80
                      ? "text-emerald-400"
                      : dimScore !== null && dimScore >= 60
                        ? "text-amber-400"
                        : dimScore !== null
                          ? "text-rose-400"
                          : "text-text-disabled"
                  )}
                >
                  {dimGrade}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1 w-full font-mono">
                <span className="text-xs font-bold text-foreground">
                  {dimScore !== null ? dimScore : "—"}
                </span>
                <span className="text-[9px] text-text-disabled">
                  {dimData?.findings.length || 0} issues
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* 3. Search & Filters */}
      <div className="p-2 border-b border-border-subtle bg-surface-02 space-y-1.5 shrink-0">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search findings, rules, assumptions..."
            className="h-7 text-xs font-sans pl-7 bg-surface-01 border-border-default"
          />
          <SearchIcon className="w-3.5 h-3.5 absolute left-2 top-2 text-text-muted pointer-events-none" />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
          {(["all", "critical", "high", "medium", "low", "info"] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={cn(
                "h-6 px-2 rounded-md font-mono text-[10px] uppercase transition-colors shrink-0",
                severityFilter === sev
                  ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-1"
                  : "bg-surface-01 border border-border-default text-text-muted hover:text-foreground"
              )}
            >
              {sev === "all" ? "All" : sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Select
            value={dimensionFilter}
            onValueChange={(val) => setDimensionFilter(val as any)}
          >
            <SelectTrigger className="h-7 w-full px-2 font-mono text-[11px] bg-surface-01 border-border-default hover:border-border-hover text-foreground">
              <SelectValue placeholder="All Dimensions" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2">
              <SelectItem value="all">All Dimensions (6)</SelectItem>
              {DIMENSIONS.map((dim) => (
                <SelectItem key={dim.id} value={dim.id}>
                  {dim.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 4. Findings List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {findings.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center text-text-muted">
            <div className="w-8 h-8 rounded-md bg-surface-02 border border-border-default flex items-center justify-center text-emerald-400 mb-2 shadow-level-1">
              <CheckCircleIcon className="w-4 h-4" />
            </div>
            <h5 className="font-sans text-xs font-semibold text-foreground mb-1">
              No Architectural Health Risks
            </h5>
            <p className="font-sans text-[11px] text-text-muted max-w-[240px] leading-relaxed">
              The current topology exhibits strong reliability, boundary isolation, and scalable decoupling based on declared modeling assumptions.
            </p>
          </div>
        ) : (
          findings.map((f) => (
            <HealthFindingCard
              key={f.id}
              finding={f}
              isSelected={activeFindingId === f.id}
              onSelect={handleSelectFinding}
              onOpenInspector={onFocusNode}
            />
          ))
        )}
      </div>

      {/* 5. Metrics Footer */}
      <div className="px-3 py-1.5 border-t border-border-subtle bg-surface-02 font-mono text-[10px] text-text-muted flex items-center justify-between shrink-0">
        <span>
          {report.metrics.totalComponents}N · {report.metrics.totalConnections}E · {report.metrics.criticalPathsCount} Paths
        </span>
        <span className="text-text-disabled">
          {report.metrics.executionTimeMs}ms
        </span>
      </div>
    </div>
  );
}
