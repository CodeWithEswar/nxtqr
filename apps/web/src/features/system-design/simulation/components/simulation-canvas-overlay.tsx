"use client";

import React from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { TimelineStepSnapshot } from "@nxtqr/architecture-intelligence";
import { ActivityIcon, ShieldIcon } from "@nxtqr/icons";

export interface SimulationCanvasOverlayProps {
  nodes: BaseNode[];
  edges: BaseEdge[];
  currentStep: TimelineStepSnapshot;
  selectedComponentId: string | null;
  onSelectComponent: (id: string | null) => void;
  className?: string;
}

export function SimulationCanvasOverlay({
  nodes,
  edges,
  currentStep,
  selectedComponentId,
  onSelectComponent,
  className = "",
}: SimulationCanvasOverlayProps) {
  return (
    <div className={`relative w-full h-full bg-black overflow-hidden select-none ${className}`}>
      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "radial-gradient(#333333 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Render Edges */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {edges.map((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;

          const sx = sourceNode.position.x + 90;
          const sy = sourceNode.position.y + 40;
          const tx = targetNode.position.x + 90;
          const ty = targetNode.position.y + 40;

          const sourceState = currentStep.componentStates[edge.source]?.state;
          const targetState = currentStep.componentStates[edge.target]?.state;
          const isFailingPath =
            targetState === "unavailable" ||
            sourceState === "unavailable" ||
            targetState === "degraded";

          return (
            <g key={edge.id}>
              <line
                x1={sx}
                y1={sy}
                x2={tx}
                y2={ty}
                stroke={isFailingPath ? "#EF4444" : "#333333"}
                strokeWidth={isFailingPath ? 2 : 1.5}
                strokeDasharray={isFailingPath ? "4 4" : undefined}
                className={isFailingPath ? "animate-pulse" : ""}
              />
            </g>
          );
        })}
      </svg>

      {/* Render Component Nodes */}
      {nodes.map((node) => {
        const state = currentStep.componentStates[node.id];
        const status = state?.state || "healthy";
        const isSelected = selectedComponentId === node.id;
        const isUnavailable = status === "unavailable";
        const isDegraded = status === "degraded";

        return (
          <div
            key={node.id}
            onClick={() => onSelectComponent(node.id)}
            style={{
              position: "absolute",
              left: `${node.position.x}px`,
              top: `${node.position.y}px`,
              width: "180px",
            }}
            className={`cursor-pointer rounded-md border p-3 transition-all ${
              isSelected
                ? "bg-surface-04 border-border-strong shadow-level-3"
                : isUnavailable
                ? "bg-surface-02 border-red-800/80 shadow-level-2"
                : isDegraded
                ? "bg-surface-02 border-orange-800/80 shadow-level-1"
                : "bg-surface-02 border-border-default hover:border-border-hover hover:bg-surface-03"
            }`}
          >
            {/* Component Header */}
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-xs text-white truncate max-w-[110px]">
                {(node.data?.label as string) || node.id}
              </span>
              <span
                className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded-md ${
                  status === "healthy"
                    ? "bg-surface-03 text-text-muted border border-border-subtle"
                    : isDegraded
                    ? "bg-orange-950/80 text-orange-300 border border-orange-800"
                    : "bg-red-950/80 text-red-300 border border-red-800 animate-pulse"
                }`}
              >
                {status}
              </span>
            </div>

            {/* Type badge and replicas */}
            <div className="flex items-center justify-between text-[10px] text-text-muted font-mono">
              <span className="truncate max-w-[90px]">{node.type}</span>
              <span>Replicas: {state?.activeReplicas ?? 1}</span>
            </div>

            {/* Circuit Breaker Badge */}
            {state?.isCircuitOpen && (
              <div className="mt-1.5 flex items-center gap-1 text-[10px] font-mono text-orange-400 bg-orange-950/40 px-1.5 py-0.5 rounded-md border border-orange-900/50">
                <ShieldIcon className="w-3 h-3" />
                <span>Circuit Open</span>
              </div>
            )}

            {/* Latency Multiplier Badge */}
            {(state?.latencyMultiplier || 1) > 1.2 && (
              <div className="mt-1 flex items-center gap-1 text-[10px] font-mono text-text-secondary">
                <ActivityIcon className="w-3 h-3 text-orange-400" />
                <span>Latency {state?.latencyMultiplier}x</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
