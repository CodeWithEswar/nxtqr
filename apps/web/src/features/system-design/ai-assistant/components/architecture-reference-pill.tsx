"use client";

import * as React from "react";
import type { AICitation } from "@nxtqr/architecture-intelligence";
import { LayersIcon, AlertTriangleIcon, CheckCircleIcon } from "@nxtqr/icons";

export interface ArchitectureReferencePillProps {
  citation: AICitation;
  onSelectNode?: (nodeId: string) => void;
  onSelectEdge?: (edgeId: string) => void;
  className?: string;
}

export function ArchitectureReferencePill({
  citation,
  onSelectNode,
  onSelectEdge,
  className = "",
}: ArchitectureReferencePillProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (citation.type === "node" && onSelectNode) {
      onSelectNode(citation.targetId);
    } else if (citation.type === "edge" && onSelectEdge) {
      onSelectEdge(citation.targetId);
    }
  };

  const isClickable =
    (citation.type === "node" && Boolean(onSelectNode)) ||
    (citation.type === "edge" && Boolean(onSelectEdge));

  const getIcon = () => {
    switch (citation.type) {
      case "node":
        return <LayersIcon className="w-3.5 h-3.5 text-foreground/80 shrink-0" />;
      case "edge":
        return <span className="text-[10px] text-muted-foreground font-mono">→</span>;
      case "finding":
        return <AlertTriangleIcon className="w-3.5 h-3.5 text-warning/90 shrink-0" />;
      case "recommendation":
        return <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-400 shrink-0" />;
      case "doc":
      default:
        return <span className="text-[10px] text-muted-foreground font-mono">§</span>;
    }
  };

  const getPrefix = () => {
    switch (citation.type) {
      case "node":
        return "#";
      case "finding":
        return "Finding: ";
      case "recommendation":
        return "Rec: ";
      case "doc":
        return "Doc: ";
      default:
        return "";
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isClickable}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded-md text-xs font-mono transition-colors
        bg-[#141414] border border-[#262626] text-foreground/90
        ${
          isClickable
            ? "hover:bg-[#1A1A1A] hover:border-[#333333] hover:text-foreground cursor-pointer"
            : "cursor-default opacity-85"
        }
        focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#404040] ${className}`}
      title={`Reference: ${citation.label} (${citation.type})`}
    >
      {getIcon()}
      <span className="truncate max-w-[160px]">
        {getPrefix()}
        {citation.label}
      </span>
    </button>
  );
}

