"use client";

import * as React from "react";
import type { AIArchitectureProposal } from "@nxtqr/architecture-intelligence";
import { Button, Badge } from "@nxtqr/ui";
import {
  LayersIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  PlusIcon,
  EditIcon,
} from "@nxtqr/icons";

export interface ProposalPreviewCardProps {
  proposal: AIArchitectureProposal;
  isPreviewing?: boolean;
  onTogglePreview?: () => void;
  onApplyProposal?: (proposal: AIArchitectureProposal) => void;
  className?: string;
}

export function ProposalPreviewCard({
  proposal,
  isPreviewing = false,
  onTogglePreview,
  onApplyProposal,
  className = "",
}: ProposalPreviewCardProps) {
  const [isConfirming, setIsConfirming] = React.useState(false);
  const isValid = proposal.validationStatus === "valid";

  const handleApplyClick = () => {
    if (isConfirming) {
      onApplyProposal?.(proposal);
      setIsConfirming(false);
    } else {
      setIsConfirming(true);
    }
  };

  return (
    <div
      className={`rounded-md border p-3.5 my-2.5 transition-all text-sm
        ${
          isPreviewing
            ? "bg-[#0D0D0D] border-[#404040] shadow-level-2 ring-1 ring-[#333333]"
            : "bg-[#080808] border-[#262626]"
        } ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <LayersIcon className="w-4 h-4 text-foreground/80 shrink-0" />
          <h4 className="font-semibold text-foreground tracking-tight text-xs">
            {proposal.title}
          </h4>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className="text-[10px] font-mono px-1.5 py-0 border-[#262626] bg-[#141414] text-muted-foreground"
          >
            {proposal.baseGraphRevision}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] font-mono px-1.5 py-0 ${
              isValid
                ? "border-emerald-900/60 bg-emerald-950/30 text-emerald-400"
                : "border-red-900/60 bg-red-950/30 text-red-400"
            }`}
          >
            {isValid ? (
              <span className="flex items-center gap-1">
                <CheckCircleIcon className="w-2.5 h-2.5" /> VALID
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <AlertTriangleIcon className="w-2.5 h-2.5" /> INVALID
              </span>
            )}
          </Badge>
        </div>
      </div>

      {/* Explanation */}
      <p className="text-xs text-secondary mb-3 leading-relaxed">
        {proposal.explanation}
      </p>

      {/* Operations List */}
      <div className="rounded-md bg-[#141414] border border-[#202020] p-2 mb-3">
        <div className="text-[11px] font-mono text-muted-foreground mb-1.5 flex items-center justify-between">
          <span>PROPOSED GRAPH OPERATIONS ({proposal.operations.length})</span>
        </div>
        <ul className="space-y-1">
          {proposal.operations.map((op, idx) => {
            switch (op.type) {
              case "add_node":
                return (
                  <li key={idx} className="text-xs font-mono text-foreground/90 flex items-center gap-1.5">
                    <PlusIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Add Component:</span>
                    <span className="text-foreground font-semibold">{op.node.label || op.node.id}</span>
                    <span className="text-muted-foreground text-[10px]">({op.node.type})</span>
                  </li>
                );
              case "adjust_instances":
                return (
                  <li key={idx} className="text-xs font-mono text-foreground/90 flex items-center gap-1.5">
                    <EditIcon className="w-3 h-3 text-sky-400 shrink-0" />
                    <span>Scale Replicas:</span>
                    <span className="text-foreground font-semibold">{op.nodeId}</span>
                    <span className="text-sky-400">→ {op.newReplicas} instances</span>
                  </li>
                );
              case "insert_mediator":
                return (
                  <li key={idx} className="text-xs font-mono text-foreground/90 flex items-center gap-1.5">
                    <PlusIcon className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span>Insert Mediator:</span>
                    <span className="text-foreground font-semibold">{op.mediatorNode.label || op.mediatorNode.id}</span>
                    <span className="text-muted-foreground text-[10px]">({op.mediatorNode.type})</span>
                  </li>
                );
              case "update_node_config":
                return (
                  <li key={idx} className="text-xs font-mono text-foreground/90 flex items-center gap-1.5">
                    <EditIcon className="w-3 h-3 text-sky-400 shrink-0" />
                    <span>Update Config:</span>
                    <span className="text-foreground font-semibold">{op.nodeId}</span>
                  </li>
                );
              default:
                return (
                  <li key={idx} className="text-xs font-mono text-foreground/80">
                    Operation: {(op as any).type}
                  </li>
                );
            }
          })}
        </ul>
      </div>

      {/* Validation Errors if any */}
      {!isValid && proposal.validationErrors.length > 0 && (
        <div className="rounded-md bg-red-950/20 border border-red-900/50 p-2 mb-3">
          <div className="text-[11px] font-semibold text-red-400 mb-1 flex items-center gap-1">
            <AlertTriangleIcon className="w-3 h-3" />
            Deterministic Validation Errors:
          </div>
          <ul className="list-disc list-inside text-xs text-red-300 space-y-0.5">
            {proposal.validationErrors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Trade-offs & Assumptions */}
      {proposal.tradeoffs.length > 0 && (
        <div className="text-[11px] text-muted-foreground mb-3 space-y-1">
          <span className="font-semibold text-secondary">Trade-offs: </span>
          <span>{proposal.tradeoffs.join("; ")}</span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#1A1A1A]">
        {onTogglePreview && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onTogglePreview}
            className={`text-xs h-7 px-2.5 rounded-md border-[#262626] ${
              isPreviewing
                ? "bg-[#1A1A1A] text-foreground border-[#404040]"
                : "bg-transparent text-secondary hover:bg-[#141414] hover:text-foreground"
            }`}
          >
            {isPreviewing ? "Exit Preview" : "Preview on Canvas"}
          </Button>
        )}

        {onApplyProposal && (
          <Button
            type="button"
            size="sm"
            disabled={!isValid}
            onClick={handleApplyClick}
            className={`text-xs h-7 px-3 rounded-md transition-colors ${
              isConfirming
                ? "bg-amber-600 hover:bg-amber-500 text-white font-medium"
                : "bg-[#1A1A1A] hover:bg-[#262626] text-foreground border border-[#333333]"
            }`}
          >
            {isConfirming ? "Confirm & Apply" : "Apply to Diagram"}
          </Button>
        )}
      </div>
    </div>
  );
}

