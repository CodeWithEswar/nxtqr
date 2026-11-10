"use client";

import * as React from "react";
import { type WhatIfPlan } from "@nxtqr/architecture-intelligence";
import { Badge, Button } from "@nxtqr/ui";
import { CheckCircleIcon, AlertTriangleIcon, CheckIcon, CloseIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export interface WhatIfPlannerViewProps {
  plan: WhatIfPlan;
  onCommit: () => void;
  onDiscard: () => void;
  className?: string;
}

export function WhatIfPlannerView({
  plan,
  onCommit,
  onDiscard,
  className,
}: WhatIfPlannerViewProps) {
  const comparison = plan.comparison;

  return (
    <div className={cn("p-4 space-y-4 bg-surface-01 rounded-md border border-border-default", className)}>
      {/* Top Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-border-default">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-semibold text-sky-400 bg-sky-950/20 px-1.5 py-0.5 rounded border border-sky-900/60">
              What-If Simulation
            </span>
            <span className="font-mono text-[10px] text-text-muted">
              {plan.operations.length} Graph Operations
            </span>
          </div>
          <h3 className="font-sans font-medium text-foreground text-sm mt-1.5">
            {plan.title}
          </h3>
          <p className="font-mono text-[10px] text-text-muted mt-0.5">
            Graph Revision: <span className="text-text-secondary">{plan.originalGraphRevision}</span>
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDiscard}
          className="h-7 w-7 p-0 text-text-muted hover:text-foreground"
          title="Exit What-If Simulation"
        >
          <CloseIcon className="w-4 h-4" />
        </Button>
      </div>

      {/* Validation Status */}
      <div
        className={cn(
          "p-2.5 rounded-md border text-xs font-mono flex items-center justify-between",
          plan.isValidated
            ? "bg-emerald-950/10 border-emerald-900/50 text-emerald-400"
            : "bg-amber-950/10 border-amber-900/50 text-amber-400"
        )}
      >
        <div className="flex items-center gap-2">
          {plan.isValidated ? (
            <CheckCircleIcon className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangleIcon className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <span>
            {plan.isValidated
              ? "Graph topology validated by Architecture Validation Engine"
              : `Topology validation warnings: ${plan.validationErrors.length}`}
          </span>
        </div>
        <Badge
          variant="outline"
          className={cn(
            "text-[9px] uppercase font-mono px-1.5 py-0",
            plan.isValidated ? "border-emerald-800 text-emerald-400" : "border-amber-800 text-amber-400"
          )}
        >
          {plan.isValidated ? "Compliant" : "Review Required"}
        </Badge>
      </div>

      {/* Before vs After Impact Grid */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1">
          <span className="text-[10px] font-mono text-text-muted block uppercase">
            Capacity Gain
          </span>
          <div className="flex items-center justify-center gap-1.5 font-mono text-xs">
            <span className="text-text-disabled">1.0x</span>
            <span className="text-text-muted">&rarr;</span>
            <span className="text-emerald-400 font-semibold">
              {comparison.capacityGainRatio.toFixed(2)}x
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1">
          <span className="text-[10px] font-mono text-text-muted block uppercase">
            Baseline Cap
          </span>
          <div className="font-mono text-xs font-semibold text-text-secondary">
            {Math.round(comparison.beforeCapacityRps)} rps
          </div>
        </div>

        <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1">
          <span className="text-[10px] font-mono text-text-muted block uppercase">
            Simulated Cap
          </span>
          <div className="font-mono text-xs font-semibold text-emerald-400">
            {Math.round(comparison.estimatedAfterCapacityRps)} rps
          </div>
        </div>
      </div>

      {/* Resolved Findings vs New Risks */}
      <div className="space-y-2 text-xs">
        {comparison.resolvedFindingIds.length > 0 && (
          <div className="p-2 rounded bg-surface-02 border border-border-default space-y-1">
            <span className="text-[10px] font-mono uppercase text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircleIcon className="w-3.5 h-3.5" />
              Resolved Findings ({comparison.resolvedFindingIds.length})
            </span>
            <ul className="text-[11px] font-mono text-text-secondary pl-2 space-y-0.5">
              {comparison.resolvedFindingIds.map((rf, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="text-emerald-500">&check;</span>
                  <span>{rf}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {comparison.newRiskFindingIds.length > 0 && (
          <div className="p-2 rounded bg-surface-02 border border-border-default space-y-1">
            <span className="text-[10px] font-mono uppercase text-amber-400 flex items-center gap-1 font-medium">
              <AlertTriangleIcon className="w-3.5 h-3.5" />
              Potential Risks / Caveats ({comparison.newRiskFindingIds.length})
            </span>
            <ul className="text-[11px] font-mono text-text-muted pl-2 space-y-0.5">
              {comparison.newRiskFindingIds.map((risk, idx) => (
                <li key={idx} className="flex items-center gap-1.5">
                  <span className="text-amber-500">&bull;</span>
                  <span>{risk}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {comparison.notes && comparison.notes.length > 0 && (
          <div className="p-2 rounded bg-surface-02 border border-border-default space-y-0.5 font-mono text-[10px] text-text-muted">
            {comparison.notes.map((note, idx) => (
              <div key={idx}>&bull; {note}</div>
            ))}
          </div>
        )}
      </div>

      {/* Planned Graph Operations List */}
      <div className="space-y-1.5">
        <span className="text-[10px] font-mono uppercase text-text-muted font-medium">
          Applied Operations ({plan.operations.length})
        </span>
        <div className="max-h-48 overflow-y-auto precision-rail space-y-1 rounded bg-surface-02 p-2 border border-border-default font-mono text-[11px]">
          {plan.operations.map((op, idx) => (
            <div key={idx} className="p-1.5 rounded bg-surface-03/60 border border-border-subtle flex items-start gap-2">
              <Badge variant="outline" className="text-[9px] uppercase px-1 py-0 border-border-default text-text-muted">
                {op.type.replace(/_/g, " ")}
              </Badge>
              <div className="flex-1 text-text-secondary text-[10px] leading-tight break-all">
                {op.type === "adjust_instances" && (
                  <span>
                    Scale <span className="text-foreground">{op.nodeId}</span> replicas to <span className="text-emerald-400 font-semibold">{op.newReplicas}x</span>
                  </span>
                )}
                {op.type === "add_node" && (
                  <span>
                    Add node <span className="text-foreground">{op.node.label || op.node.id}</span> ({op.node.type}) at ({op.node.position.x}, {op.node.position.y})
                  </span>
                )}
                {op.type === "insert_mediator" && (
                  <span>
                    Insert mediator <span className="text-foreground">{op.mediatorNode.label || op.mediatorNode.id}</span> replacing edge <span className="text-text-muted">{op.replaceEdgeId}</span>
                  </span>
                )}
                {op.type === "update_node_config" && (
                  <span>
                    Update node <span className="text-foreground">{op.nodeId}</span> configuration: {JSON.stringify(op.configUpdates)}
                  </span>
                )}
                {op.type === "add_edge" && (
                  <span>
                    Add edge {op.edge.source} &rarr; {op.edge.target}
                  </span>
                )}
                {op.type === "delete_edge" && (
                  <span>
                    Delete edge {op.edgeId}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Commit / Discard Buttons */}
      <div className="pt-2 border-t border-border-default flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onDiscard}
          className="h-8 px-3 font-mono text-xs text-text-muted hover:text-foreground bg-surface-02 border-border-default"
        >
          Discard Preview
        </Button>

        <Button
          variant="default"
          size="sm"
          onClick={onCommit}
          className="h-8 px-3 font-mono text-xs bg-foreground text-background hover:bg-neutral-200 font-semibold gap-1.5"
        >
          <CheckIcon className="w-3.5 h-3.5" />
          Apply to Canvas
        </Button>
      </div>
    </div>
  );
}
