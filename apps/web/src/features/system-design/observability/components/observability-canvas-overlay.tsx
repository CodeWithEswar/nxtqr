"use client";

import React from "react";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ServiceHealthIndicator } from "@nxtqr/architecture-intelligence";
import type { ObservabilityOverlayMode } from "../hooks/use-architecture-observability";
import { CheckIcon, AlertTriangleIcon, AlertCircleIcon, HelpCircleIcon } from "@nxtqr/icons";

export interface ObservabilityCanvasOverlayProps {
  nodes: BaseNode[];
  edges: BaseEdge[];
  healthIndicators: Record<string, ServiceHealthIndicator>;
  activeOverlay: ObservabilityOverlayMode;
  selectedComponentId: string | null;
  onSelectComponent: (componentId: string) => void;
  className?: string;
}

export function ObservabilityCanvasOverlay({
  nodes,
  edges,
  healthIndicators,
  activeOverlay,
  selectedComponentId,
  onSelectComponent,
  className = "",
}: ObservabilityCanvasOverlayProps) {
  if (nodes.length === 0) return null;

  const minX = Math.min(...nodes.map((n) => n.position.x));
  const minY = Math.min(...nodes.map((n) => n.position.y));
  const maxX = Math.max(...nodes.map((n) => n.position.x + 200));
  const maxY = Math.max(...nodes.map((n) => n.position.y + 120));

  const canvasWidth = Math.max(maxX - minX + 160, 800);
  const canvasHeight = Math.max(maxY - minY + 160, 500);

  const getOverlayBadge = (health?: ServiceHealthIndicator) => {
    if (activeOverlay === "none") return null;

    if (!health || health.state === "unknown") {
      return (
        <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#141414] border border-[#262626] text-[#858585]">
          <HelpCircleIcon className="w-2.5 h-2.5" />
          No Telemetry
        </span>
      );
    }

    if (activeOverlay === "rps") {
      return (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#0D0D0D] border border-[#262626] text-white font-bold">
          {health.metrics.rps !== undefined ? `${health.metrics.rps} req/s` : "0 req/s"}
        </span>
      );
    }

    if (activeOverlay === "latency") {
      return (
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border font-bold ${
            (health.metrics.p95LatencyMs || 0) >= 500
              ? "bg-amber-950/40 border-amber-900/40 text-amber-400"
              : "bg-[#0D0D0D] border-[#262626] text-white"
          }`}
        >
          {health.metrics.p95LatencyMs !== undefined ? `${health.metrics.p95LatencyMs} ms` : "—"}
        </span>
      );
    }

    if (activeOverlay === "cpu") {
      return (
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] font-mono border font-bold ${
            (health.metrics.cpuSaturationPct || 0) >= 80
              ? "bg-amber-950/40 border-amber-900/40 text-amber-400"
              : "bg-[#0D0D0D] border-[#262626] text-white"
          }`}
        >
          {health.metrics.cpuSaturationPct !== undefined
            ? `${health.metrics.cpuSaturationPct}% CPU`
            : "—"}
        </span>
      );
    }

    // Default "health" overlay
    switch (health.state) {
      case "healthy":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-950/40 border border-emerald-900/40 text-emerald-400">
            <CheckIcon className="w-2.5 h-2.5" />
            Healthy
          </span>
        );
      case "degraded":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-950/40 border border-amber-900/40 text-amber-400">
            <AlertTriangleIcon className="w-2.5 h-2.5" />
            Degraded
          </span>
        );
      case "critical":
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-red-950/40 border border-red-900/40 text-red-400 animate-pulse">
            <AlertCircleIcon className="w-2.5 h-2.5" />
            Critical
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#141414] border border-[#262626] text-[#858585]">
            <HelpCircleIcon className="w-2.5 h-2.5" />
            Unknown
          </span>
        );
    }
  };

  return (
    <div className={`relative w-full h-full bg-[#000000] overflow-auto select-none p-8 ${className}`}>
      <svg
        width={canvasWidth}
        height={canvasHeight}
        className="absolute inset-0 pointer-events-none"
      >
        {/* Draw connections / edges */}
        {edges.map((edge) => {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);
          if (!sourceNode || !targetNode) return null;

          const x1 = sourceNode.position.x - minX + 160;
          const y1 = sourceNode.position.y - minY + 60;
          const x2 = targetNode.position.x - minX + 20;
          const y2 = targetNode.position.y - minY + 60;

          return (
            <g key={edge.id}>
              <line
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="#333333"
                strokeWidth="1.5"
                strokeDasharray="4 2"
              />
            </g>
          );
        })}
      </svg>

      {/* Render Architecture Component Nodes with Telemetry Overlay */}
      {nodes.map((node) => {
        const isSelected = node.id === selectedComponentId;
        const health = healthIndicators[node.id];
        const label = (node.data?.label as string) || node.id;
        const posX = node.position.x - minX + 20;
        const posY = node.position.y - minY + 20;

        return (
          <div
            key={node.id}
            onClick={() => onSelectComponent(node.id)}
            style={{
              position: "absolute",
              left: `${posX}px`,
              top: `${posY}px`,
              width: "150px",
            }}
            className={`cursor-pointer rounded-md p-2.5 transition-all shadow-level-1 ${
              isSelected
                ? "bg-[#1A1A1A] border-2 border-[#404040]"
                : "bg-[#0D0D0D] border border-[#262626] hover:border-[#333333]"
            }`}
          >
            {/* Header: Label & Type */}
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-xs text-white truncate">{label}</span>
              <span className="text-[9px] font-mono uppercase text-[#666666]">
                {node.type || "svc"}
              </span>
            </div>

            {/* Live Telemetry Overlay Pill */}
            <div className="mt-1 flex items-center justify-between">
              {getOverlayBadge(health)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
