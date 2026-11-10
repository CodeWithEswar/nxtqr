"use client";

import * as React from "react";
import { Badge, Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@nxtqr/ui";
import { AlertCircleIcon, ShieldIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";
import type { BlastRadiusReport, BusinessCapability } from "@nxtqr/architecture-intelligence";
import type { BaseNode } from "@nxtqr/graph-schema";

export interface BlastRadiusExplorerProps {
  nodes: BaseNode[];
  activeProfile: BlastRadiusReport | null;
  capabilities: Record<string, BusinessCapability>;
  onSelectNode: (nodeId: string) => void;
  className?: string;
}

export function BlastRadiusExplorer({
  nodes,
  activeProfile,
  capabilities,
  onSelectNode,
  className,
}: BlastRadiusExplorerProps) {
  if (!activeProfile) {
    return (
      <div className="p-4 text-center font-mono text-xs text-text-muted bg-surface-02 border border-border-default rounded-md">
        Select a component to inspect its failure blast radius.
      </div>
    );
  }

  const score = activeProfile.blastRadiusScore;
  const isSevere = score >= 70;
  const isModerate = score >= 35 && score < 70;

  return (
    <div className={cn("space-y-3 font-sans text-xs select-none", className)}>
      {/* Component Target Selector */}
      <div className="space-y-1">
        <label className="font-mono text-[10px] text-text-muted uppercase tracking-wider block">
          Hypothetical Failure Component
        </label>
        <Select
          value={activeProfile.targetId}
          onValueChange={(val) => onSelectNode(val)}
        >
          <SelectTrigger className="h-7 w-full px-2 font-mono text-[11px] bg-surface-01 border-border-default hover:border-border-hover text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-surface-02 border-border-strong text-xs font-mono text-foreground shadow-level-2 max-h-56">
            {nodes.map((n) => (
              <SelectItem key={n.id} value={n.id}>
                {n.label || n.id} ({n.type})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Blast Radius Score Banner */}
      <div className="p-2.5 rounded-md bg-surface-02 border border-border-default space-y-1.5">
        <div className="flex items-center justify-between font-mono">
          <span className="text-[10px] text-text-muted uppercase font-semibold">
            Estimated Blast Radius
          </span>
          <Badge
            variant="outline"
            className={cn(
              "text-[9px] font-mono h-4 px-1 rounded uppercase",
              isSevere
                ? "border-rose-900/60 text-rose-400 bg-rose-950/20"
                : isModerate
                  ? "border-amber-900/60 text-amber-400 bg-amber-950/20"
                  : "border-border-default text-emerald-400 bg-emerald-950/20"
            )}
          >
            {score}% Impact
          </Badge>
        </div>

        <div className="h-2 w-full rounded-full bg-surface-01 border border-border-subtle overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 rounded-full",
              isSevere ? "bg-rose-500" : isModerate ? "bg-amber-500" : "bg-emerald-500"
            )}
            style={{ width: `${Math.max(4, score)}%` }}
          />
        </div>

        <p className="text-[11px] text-text-secondary leading-relaxed pt-0.5">
          {activeProfile.summary}
        </p>
      </div>

      {/* Impact Breakdown */}
      <div className="space-y-2 font-mono text-[10px]">
        {/* Direct Impact */}
        <div className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="font-semibold text-rose-400 flex items-center gap-1">
              <AlertCircleIcon className="w-3 h-3" />
              Direct Impacted Services ({activeProfile.directImpactedNodeIds.length})
            </span>
          </div>
          {activeProfile.directImpactedNodeIds.length === 0 ? (
            <span className="text-text-disabled text-[9px] block">No direct synchronous callers failed.</span>
          ) : (
            <div className="flex flex-wrap gap-1 pt-1">
              {activeProfile.directImpactedNodeIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectNode(id)}
                  className="px-1.5 py-0.5 rounded border border-rose-900/40 bg-rose-950/20 text-rose-300 hover:text-foreground transition-colors"
                >
                  {id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cascading / Indirect Impact */}
        <div className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1">
          <div className="flex items-center justify-between text-text-muted">
            <span className="font-semibold text-amber-400 flex items-center gap-1">
              <AlertCircleIcon className="w-3 h-3" />
              Indirect Cascades ({activeProfile.indirectImpactedNodeIds.length})
            </span>
          </div>
          {activeProfile.indirectImpactedNodeIds.length === 0 ? (
            <span className="text-text-disabled text-[9px] block">No secondary cascade propagation.</span>
          ) : (
            <div className="flex flex-wrap gap-1 pt-1">
              {activeProfile.indirectImpactedNodeIds.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => onSelectNode(id)}
                  className="px-1.5 py-0.5 rounded border border-border-subtle bg-surface-01 text-text-secondary hover:text-foreground transition-colors"
                >
                  {id}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Business Capabilities Affected */}
        <div className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1.5">
          <span className="font-semibold text-text-muted uppercase tracking-wider block">
            Business Capabilities Status
          </span>
          <div className="space-y-1">
            {activeProfile.affectedCapabilityIds.map((capId) => {
              const cap = capabilities[capId];
              return (
                <div key={capId} className="flex items-center justify-between text-[10px]">
                  <span className="text-rose-400 font-medium truncate max-w-[170px]">
                    {cap?.name || capId}
                  </span>
                  <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-rose-900/60 text-rose-400 bg-rose-950/20">
                    Severed
                  </Badge>
                </div>
              );
            })}
            {activeProfile.degradedCapabilityIds.map((capId) => {
              const cap = capabilities[capId];
              return (
                <div key={capId} className="flex items-center justify-between text-[10px]">
                  <span className="text-amber-300 font-medium truncate max-w-[170px]">
                    {cap?.name || capId}
                  </span>
                  <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-amber-900/40 text-amber-300 bg-amber-950/10">
                    Degraded
                  </Badge>
                </div>
              );
            })}
            {activeProfile.unaffectedCapabilityIds.map((capId) => {
              const cap = capabilities[capId];
              return (
                <div key={capId} className="flex items-center justify-between text-[10px]">
                  <span className="text-emerald-400 font-medium truncate max-w-[170px]">
                    {cap?.name || capId}
                  </span>
                  <Badge variant="outline" className="text-[8px] h-3.5 px-1 border-border-default text-emerald-400 bg-emerald-950/20">
                    Surviving
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Alternative Paths */}
        <div className="p-2 rounded-md bg-surface-01 border border-border-subtle flex items-center justify-between text-text-muted text-[10px]">
          <span className="flex items-center gap-1">
            <ShieldIcon className="w-3 h-3 text-emerald-400" />
            Surviving Replicas / Redundancy:
          </span>
          <span className="font-bold text-foreground">
            {activeProfile.survivingAlternativePaths > 0
              ? `${activeProfile.survivingAlternativePaths} Standby/Peer(s)`
              : "0 (Single Point)"}
          </span>
        </div>
      </div>
    </div>
  );
}
