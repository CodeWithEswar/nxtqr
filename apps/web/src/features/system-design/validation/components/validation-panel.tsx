"use client";

import * as React from "react";
import {
  CheckCircleIcon,
  RefreshIcon,
  CloseIcon,
  SearchIcon,
} from "@nxtqr/icons";
import { Badge, Input, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useArchitectureValidation } from "../hooks/use-architecture-validation";
import { ValidationFindingItem } from "./validation-finding-item";
import type { ValidationFinding } from "@nxtqr/architecture-validation";

export interface ValidationPanelProps {
  className?: string;
  onClose?: () => void;
  onFocusNode?: (nodeId: string) => void;
  onFocusEdge?: (edgeId: string) => void;
  onOpenInspectorField?: (fieldPath: string) => void;
}

export function ValidationPanel({
  className,
  onClose,
  onFocusNode,
  onFocusEdge,
  onOpenInspectorField,
}: ValidationPanelProps) {
  const {
    findings,
    summary,
    severityFilter,
    setSeverityFilter,
    categoryFilter,
    setCategoryFilter,
    searchQuery,
    setSearchQuery,
    activeFindingId,
    focusFinding,
    dismissFinding,
    revalidate,
  } = useArchitectureValidation();

  const handleSelectFinding = (finding: ValidationFinding) => {
    focusFinding(finding);
    if (finding.edgeId && onFocusEdge) {
      onFocusEdge(finding.edgeId);
    } else if (finding.targetNodeId && onFocusNode) {
      onFocusNode(finding.targetNodeId);
    } else if (finding.sourceNodeId && onFocusNode) {
      onFocusNode(finding.sourceNodeId);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col h-full bg-surface-01 text-foreground select-none overflow-hidden",
        className,
      )}
    >
      {/* 1. Header */}
      <div className="h-9 px-3 border-b border-border-default bg-surface-02 flex items-center justify-between shrink-0 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-foreground">Architecture Validation</span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-mono h-4 px-1 rounded",
              summary.errors > 0
                ? "border-rose-900/60 text-rose-400 bg-rose-950/20"
                : summary.warnings > 0
                  ? "border-amber-900/60 text-amber-400 bg-amber-950/20"
                  : "border-border-default text-emerald-400 bg-emerald-950/20",
            )}
          >
            {summary.errors > 0
              ? `${summary.errors} Error${summary.errors > 1 ? "s" : ""}`
              : summary.warnings > 0
                ? `${summary.warnings} Warning${summary.warnings > 1 ? "s" : ""}`
                : "Valid"}
          </Badge>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={revalidate}
            className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
            title="Revalidate graph"
          >
            <RefreshIcon className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded text-text-muted hover:text-foreground hover:bg-surface-03 transition-colors"
              title="Close Validation Panel"
            >
              <CloseIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Status Summary Banner */}
      <div className="px-3 py-2 border-b border-border-subtle bg-surface-01 font-mono text-[11px] text-text-muted flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={summary.errors > 0 ? "text-rose-400 font-semibold" : "text-text-disabled"}>
            {summary.errors} errors
          </span>
          <span className="text-border-subtle">·</span>
          <span className={summary.warnings > 0 ? "text-amber-400 font-semibold" : "text-text-disabled"}>
            {summary.warnings} warnings
          </span>
          <span className="text-border-subtle">·</span>
          <span className={summary.info > 0 ? "text-text-muted" : "text-text-disabled"}>
            {summary.info} info
          </span>
        </div>
        <span className="text-[10px] text-text-disabled">
          {summary.componentCount}N · {summary.connectionCount}E
        </span>
      </div>

      {/* 3. Filters: Search Input + Severity Buttons + Category Selector */}
      <div className="p-2 border-b border-border-subtle bg-surface-02 space-y-1.5 shrink-0">
        <div className="relative">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter findings..."
            className="h-7 text-xs font-sans pl-7 bg-surface-01 border-border-default"
          />
          <SearchIcon className="w-3.5 h-3.5 absolute left-2 top-2 text-text-muted pointer-events-none" />
        </div>

        <div className="flex items-center gap-1">
          {(["all", "error", "warning", "info"] as const).map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setSeverityFilter(sev)}
              className={cn(
                "h-6 px-2 rounded-md font-mono text-[10px] uppercase transition-colors",
                severityFilter === sev
                  ? "bg-surface-04 border border-border-strong text-foreground font-semibold shadow-level-1"
                  : "bg-surface-01 border border-border-default text-text-muted hover:text-foreground",
              )}
            >
              {sev === "all" ? "All" : sev}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Select
            value={categoryFilter}
            onValueChange={(val) => setCategoryFilter(val as any)}
          >
            <SelectTrigger className="h-7 w-full px-2 font-mono text-[11px] bg-surface-01 border-border-default hover:border-border-hover text-foreground">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2">
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="connection">Connection Rules</SelectItem>
              <SelectItem value="component">Component Config</SelectItem>
              <SelectItem value="relationship">Relationships</SelectItem>
              <SelectItem value="structural">Structural & Groups</SelectItem>
              <SelectItem value="dependency">Dependencies</SelectItem>
              <SelectItem value="integrity">Graph Integrity</SelectItem>
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
              No Issues Detected
            </h5>
            <p className="font-sans text-[11px] text-text-muted max-w-[220px] leading-relaxed">
              Your architecture satisfies all structural constraints, protocol compatibility rules, and component invariants.
            </p>
          </div>
        ) : (
          findings.map((f) => (
            <ValidationFindingItem
              key={f.id}
              finding={f}
              isSelected={activeFindingId === f.id}
              onSelect={handleSelectFinding}
              onDismiss={dismissFinding}
              onOpenInspectorField={onOpenInspectorField}
            />
          ))
        )}
      </div>
    </div>
  );
}
