"use client";

import * as React from "react";
import {
  AlertTriangleIcon,
  PlusIcon,
  MinusIcon,
  EditIcon,
  SlidersIcon,
  ShieldIcon,
  ActivityIcon,
} from "@nxtqr/icons";
import type {
  ArchitectureChange,
  ArchitecturalRegression,
} from "@nxtqr/architecture-intelligence";

export interface ChangeInspectorProps {
  change?: ArchitectureChange;
  regression?: ArchitecturalRegression;
  onFocusNode?: (nodeId: string) => void;
  className?: string;
}

export function ChangeInspector({
  change,
  regression,
  onFocusNode,
  className,
}: ChangeInspectorProps) {
  if (regression && !change) {
    return (
      <div
        className={`flex flex-col h-full bg-surface-01 text-foreground overflow-y-auto p-3 space-y-3 font-sans text-xs ${
          className || ""
        }`}
      >
        <div className="p-2.5 rounded-md bg-red-950/20 border border-red-900/50 space-y-2">
          <div className="flex items-center gap-1.5 text-red-400 font-semibold text-xs">
            <AlertTriangleIcon className="w-4 h-4 shrink-0" />
            <span>Architectural Regression</span>
          </div>
          <div className="font-semibold text-foreground text-sm">{regression.title}</div>
          <p className="text-text-secondary text-xs leading-relaxed">{regression.explanation}</p>
        </div>

        <div className="space-y-1.5">
          <div className="font-mono text-[10px] uppercase font-bold text-text-muted">
            Regression Details
          </div>
          <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
            <div className="p-2 rounded bg-surface-02 border border-border-subtle">
              <span className="text-text-muted block text-[9px] uppercase">Rule ID</span>
              <span className="text-foreground">{regression.ruleId}</span>
            </div>
            <div className="p-2 rounded bg-surface-02 border border-border-subtle">
              <span className="text-text-muted block text-[9px] uppercase">Severity</span>
              <span
                className={
                  regression.severity === "critical"
                    ? "text-red-400 font-semibold"
                    : "text-amber-400 font-semibold"
                }
              >
                {regression.severity.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {regression.affectedNodeIds.length > 0 && (
          <div className="space-y-1">
            <div className="font-mono text-[10px] uppercase font-bold text-text-muted">
              Affected Targets
            </div>
            <div className="flex flex-wrap gap-1.5">
              {regression.affectedNodeIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onFocusNode?.(id)}
                  className="px-2 py-0.5 rounded bg-surface-02 border border-border-subtle hover:border-border-hover font-mono text-[10px] text-text-secondary hover:text-foreground"
                >
                  #{id}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (!change) {
    return (
      <div
        className={`flex flex-col items-center justify-center h-full text-center p-6 text-text-muted font-sans text-xs ${
          className || ""
        }`}
      >
        <SlidersIcon className="w-8 h-8 mb-2 text-text-disabled" />
        <p className="font-semibold text-text-secondary">No Element Selected</p>
        <p className="text-[11px] text-text-disabled mt-1 max-w-[200px]">
          Select an added, removed, or modified element from the diagram or list to inspect field-level deltas.
        </p>
      </div>
    );
  }

  const kindBadge = () => {
    switch (change.kind) {
      case "added":
        return (
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/40 border border-emerald-800 text-emerald-300 font-mono text-[10px] font-semibold flex items-center gap-1">
            <PlusIcon className="w-2.5 h-2.5" /> Added
          </span>
        );
      case "removed":
        return (
          <span className="px-1.5 py-0.5 rounded bg-rose-950/40 border border-rose-800 text-rose-300 font-mono text-[10px] font-semibold flex items-center gap-1">
            <MinusIcon className="w-2.5 h-2.5" /> Removed
          </span>
        );
      case "modified":
        return (
          <span className="px-1.5 py-0.5 rounded bg-amber-950/40 border border-amber-800 text-amber-300 font-mono text-[10px] font-semibold flex items-center gap-1">
            <EditIcon className="w-2.5 h-2.5" /> Modified
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded bg-surface-02 border border-border-subtle text-text-muted font-mono text-[10px]">
            Unchanged
          </span>
        );
    }
  };

  return (
    <div
      className={`flex flex-col h-full bg-surface-01 text-foreground overflow-y-auto p-3 space-y-3 font-sans text-xs select-none ${
        className || ""
      }`}
    >
      {/* 1. Header Information */}
      <div className="space-y-1.5 pb-2 border-b border-border-default">
        <div className="flex items-center justify-between gap-2">
          {kindBadge()}
          <span className="font-mono text-[10px] text-text-disabled uppercase">
            {change.entityType}
          </span>
        </div>
        <div className="text-sm font-semibold text-foreground truncate">
          {change.label || change.candidateId || change.baselineId}
        </div>
        {change.nodeType && (
          <div className="font-mono text-[10px] text-text-muted">{change.nodeType}</div>
        )}
      </div>

      {/* 2. Change Categories */}
      {change.categories.length > 0 && (
        <div className="space-y-1">
          <div className="font-mono text-[10px] uppercase font-bold text-text-muted">
            Categories
          </div>
          <div className="flex flex-wrap gap-1 font-mono text-[9px]">
            {change.categories.map((cat) => (
              <span
                key={cat}
                className="px-1.5 py-0.5 rounded bg-surface-02 border border-border-subtle text-text-secondary"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. Field-Level Deltas */}
      {change.fieldDeltas.length > 0 && (
        <div className="space-y-1.5">
          <div className="font-mono text-[10px] uppercase font-bold text-text-muted">
            Configuration Deltas ({change.fieldDeltas.length})
          </div>
          <div className="space-y-1.5">
            {change.fieldDeltas.map((delta, i) => (
              <div
                key={i}
                className="p-2 rounded bg-surface-02 border border-border-subtle font-mono text-[10px] space-y-1"
              >
                <div className="text-text-muted font-bold truncate">{delta.fieldPath}</div>
                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="text-rose-400/80 truncate">
                    <span className="text-text-disabled block text-[8px] uppercase">Baseline</span>
                    {delta.baselineValue === undefined
                      ? "<none>"
                      : JSON.stringify(delta.baselineValue)}
                  </div>
                  <div className="text-emerald-400 font-semibold truncate">
                    <span className="text-text-disabled block text-[8px] uppercase">Candidate</span>
                    {delta.candidateValue === undefined
                      ? "<none>"
                      : JSON.stringify(delta.candidateValue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Architectural Impact */}
      {(change.impact.reliabilityImplications.length > 0 ||
        change.impact.securityImplications.length > 0 ||
        change.impact.scalabilityImplications.length > 0) && (
        <div className="space-y-1.5">
          <div className="font-mono text-[10px] uppercase font-bold text-text-muted">
            Architectural Impact
          </div>
          <div className="space-y-1 text-text-secondary text-[11px] leading-relaxed">
            {change.impact.reliabilityImplications.map((imp, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <ActivityIcon className="w-3 h-3 text-purple-400 shrink-0 mt-0.5" />
                <span>{imp}</span>
              </div>
            ))}
            {change.impact.securityImplications.map((imp, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <ShieldIcon className="w-3 h-3 text-emerald-400 shrink-0 mt-0.5" />
                <span>{imp}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
