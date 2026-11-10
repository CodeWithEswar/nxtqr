"use client";

import * as React from "react";
import {
  ShieldIcon,
  LockIcon,
  ChevronRightIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
  CursorIcon,
} from "@nxtqr/icons";
import { Badge, Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import type {
  SecurityAnalysisReport,
} from "@nxtqr/architecture-intelligence";

export interface TrustBoundaryExplorerProps {
  report: SecurityAnalysisReport;
  selectedBoundaryId: string | null;
  onSelectBoundary: (id: string | null) => void;
  onSelectNode: (nodeId: string) => void;
  onSelectEdge: (edgeId: string) => void;
}

export function TrustBoundaryExplorer({
  report,
  selectedBoundaryId,
  onSelectBoundary,
  onSelectNode,
  onSelectEdge,
}: TrustBoundaryExplorerProps) {
  const boundaries = report.trustBoundaries;
  const activeBoundary =
    boundaries.find((b) => b.id === selectedBoundaryId) || boundaries[0] || null;

  // Crossings associated with active boundary
  const relevantCrossings = React.useMemo(() => {
    if (!activeBoundary) return report.crossings;
    return report.crossings.filter(
      (c) =>
        c.boundaryId === activeBoundary.id ||
        activeBoundary.crossingEdgeIds.includes(c.edgeId) ||
        activeBoundary.containedNodeIds.includes(c.sourceNodeId) ||
        activeBoundary.containedNodeIds.includes(c.targetNodeId)
    );
  }, [activeBoundary, report.crossings]);

  if (boundaries.length === 0 && report.crossings.length === 0) {
    return (
      <div className="p-6 text-center space-y-2">
        <ShieldIcon className="w-8 h-8 mx-auto text-text-disabled" />
        <h4 className="text-xs font-medium text-text-secondary">No Trust Boundaries Modeled</h4>
        <p className="text-[11px] text-text-muted max-w-[280px] mx-auto leading-relaxed">
          Add a <span className="font-mono text-text-secondary">Trust Boundary</span>,{" "}
          <span className="font-mono text-text-secondary">Network Boundary</span>, or{" "}
          <span className="font-mono text-text-secondary">System Boundary</span> from the node library to segment and model security perimeters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Boundary Selector Tabs/Chips */}
      {boundaries.length > 0 && (
        <div className="space-y-1.5">
          <label className="text-[10px] font-mono uppercase tracking-wider text-text-muted block">
            Modeled Perimeters & Zones ({boundaries.length}):
          </label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {boundaries.map((b) => {
              const isSelected = activeBoundary?.id === b.id;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => onSelectBoundary(b.id)}
                  className={cn(
                    "text-xs px-2.5 py-1.5 rounded-md border flex items-center gap-2 transition-all text-left",
                    isSelected
                      ? "bg-surface-04 border-border-strong text-text-primary shadow-level-1"
                      : "bg-surface-02 border-border-default text-text-secondary hover:border-border-hover hover:text-text-primary"
                  )}
                >
                  <ShieldIcon className="w-3 h-3 text-text-muted" />
                  <span className="font-medium text-[11px]">{b.name}</span>
                  {b.findingsCount > 0 ? (
                    <Badge variant="outline" className="text-[9px] px-1 py-0 border-rose-900/60 text-rose-400 bg-rose-950/20">
                      {b.findingsCount}
                    </Badge>
                  ) : (
                    <span className="text-[9px] font-mono text-text-disabled">0 findings</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Boundary Overview Card */}
      {activeBoundary && (
        <div className="p-3 rounded-md bg-surface-02 border border-border-default space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                Threat Zone: {activeBoundary.zone}
              </span>
              <h4 className="text-xs font-medium text-text-primary mt-0.5">
                {activeBoundary.name}
              </h4>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-6 text-[10px] px-2 border-border-default"
              onClick={() => onSelectNode(activeBoundary.id)}
            >
              Focus on Canvas
            </Button>
          </div>

          {/* Contained Components */}
          <div className="space-y-1 pt-1 border-t border-border-subtle">
            <span className="text-[10px] font-mono text-text-muted block">
              Contained Components ({activeBoundary.containedNodeIds.length}):
            </span>
            {activeBoundary.containedNodeIds.length === 0 ? (
              <p className="text-[10px] text-text-disabled italic">
                No components nested inside boundary.
              </p>
            ) : (
              <div className="flex items-center gap-1.5 flex-wrap">
                {activeBoundary.containedNodeIds.map((nodeId) => (
                  <button
                    key={nodeId}
                    type="button"
                    onClick={() => onSelectNode(nodeId)}
                    className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-03 border border-border-default hover:border-border-strong text-text-secondary hover:text-text-primary"
                  >
                    <CursorIcon className="w-2.5 h-2.5 text-text-muted" />
                    {nodeId}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Boundary Crossings Inspector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
            Boundary Crossings ({relevantCrossings.length})
          </span>
          <span className="text-[10px] font-mono text-text-disabled">
            Traffic Crossing Security Perimeter
          </span>
        </div>

        {relevantCrossings.length === 0 ? (
          <div className="p-4 rounded-md bg-surface-02 border border-border-default text-center">
            <p className="text-[11px] text-text-muted">
              No cross-boundary connections detected for this perimeter.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {relevantCrossings.map((crossing) => {
              const hasIssues = !crossing.hasCrossingControls;
              return (
                <div
                  key={crossing.edgeId}
                  onClick={() => onSelectEdge(crossing.edgeId)}
                  className={cn(
                    "p-2.5 rounded-md border text-left cursor-pointer transition-colors space-y-1.5",
                    hasIssues
                      ? "bg-surface-02 border-amber-900/30 hover:border-amber-900/60"
                      : "bg-surface-02 border-border-default hover:border-border-hover"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-text-primary font-medium">{crossing.sourceNodeId}</span>
                      <ChevronRightIcon className="w-3 h-3 text-text-muted" />
                      <span className="text-text-primary font-medium">{crossing.targetNodeId}</span>
                    </div>

                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-03 border border-border-subtle text-text-muted uppercase">
                      {crossing.protocol}
                    </span>
                  </div>

                  {/* Trust levels & encryption */}
                  <div className="flex items-center gap-3 text-[10px] font-mono text-text-muted">
                    <div className="flex items-center gap-1">
                      {crossing.isEncryptedInTransit ? (
                        <CheckCircleIcon className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <AlertTriangleIcon className="w-3 h-3 text-amber-400" />
                      )}
                      <span>{crossing.isEncryptedInTransit ? "TLS Encrypted" : "Plaintext"}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <LockIcon className="w-2.5 h-2.5" />
                      <span>Sensitivity: {crossing.dataSensitivity}</span>
                    </div>
                  </div>

                  {/* Missing Controls Warning */}
                  {crossing.missingControls.length > 0 && (
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[9px] font-mono text-amber-400">Missing Controls:</span>
                      {crossing.missingControls.map((ctrl) => (
                        <span
                          key={ctrl}
                          className="text-[9px] font-mono px-1 py-0.2 rounded bg-amber-950/20 border border-amber-900/40 text-amber-300"
                        >
                          {ctrl}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
