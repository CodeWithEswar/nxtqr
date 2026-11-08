"use client";

import * as React from "react";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

export function EdgesPlayground() {
  const [curveType, setCurveType] = React.useState<"bezier" | "smoothstep" | "straight">("bezier");
  const [isActive, setIsActive] = React.useState<boolean>(true);
  const [isSelected, setIsSelected] = React.useState<boolean>(false);
  const [edgeLabel, setEdgeLabel] = React.useState<string>("gRPC Protocol [4.2ms]");

  const curves: { id: "bezier" | "smoothstep" | "straight"; label: string }[] = [
    { id: "bezier", label: "Cubic Bezier (Standard)" },
    { id: "smoothstep", label: "Smooth Step" },
    { id: "straight", label: "Straight Line" },
  ];

  // Generate SVG path for preview
  const getPath = () => {
    if (curveType === "straight") {
      return "M 40 80 L 360 80";
    }
    if (curveType === "smoothstep") {
      return "M 40 40 L 180 40 Q 200 40 200 60 L 200 100 Q 200 120 220 120 L 360 120";
    }
    // Bezier
    return "M 40 40 C 200 40, 200 120, 360 120";
  };

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            Graph Edges Connection Laboratory
          </h3>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              onClick={() => setIsActive(!isActive)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono rounded border whitespace-nowrap transition-colors",
                isActive ? "border-accent bg-accent text-accent-foreground font-semibold" : "border-border text-muted-foreground"
              )}
            >
              Pulse: {isActive ? "ON" : "OFF"}
            </button>
            <button
              onClick={() => setIsSelected(!isSelected)}
              className={cn(
                "px-2.5 py-1 text-xs font-mono rounded border whitespace-nowrap transition-colors",
                isSelected ? "border-accent bg-accent text-accent-foreground font-semibold" : "border-border text-muted-foreground"
              )}
            >
              Selected: {isSelected ? "ON" : "OFF"}
            </button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Evaluate connection curves, active execution pulse animations, connection validation, and compact metadata labels.
        </p>
      </div>

      {/* Curve Selector */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {curves.map((c) => (
          <button
            key={c.id}
            onClick={() => setCurveType(c.id)}
            className={cn(
              "p-2.5 rounded-md border text-left transition-all",
              curveType === c.id
                ? "border-accent bg-accent/10 ring-1 ring-accent"
                : "border-border bg-elevated-surface hover:border-muted-border"
            )}
          >
            <div className="text-xs font-semibold text-foreground">{c.label}</div>
            <div className="text-[10px] font-mono text-muted-foreground uppercase">{c.id}</div>
          </button>
        ))}
      </div>

      {/* Label editor */}
      <div className="flex items-center gap-2 p-2.5 bg-secondary-surface border border-border rounded-md">
        <span className="text-xs font-mono text-muted-foreground shrink-0">Edge Label:</span>
        <input
          type="text"
          value={edgeLabel}
          onChange={(e) => setEdgeLabel(e.target.value)}
          className="flex-1 px-2.5 py-1 rounded border border-border bg-black text-foreground font-mono text-xs focus:outline-none focus:border-accent"
        />
      </div>

      {/* Edge Render Stage */}
      <div className="p-8 bg-black border border-subtle-border rounded-md flex items-center justify-center min-h-[200px] relative">
        <svg className="w-full max-w-[400px] h-[160px] overflow-visible">
          <defs>
            <marker
              id="arrowhead"
              markerWidth="10"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={isSelected || isActive ? "var(--accent)" : "#505050"}
              />
            </marker>
          </defs>

          {/* Connection line */}
          <path
            d={getPath()}
            fill="none"
            stroke={isSelected ? "var(--accent)" : isActive ? "var(--accent)" : "#3a3a3a"}
            strokeWidth={isSelected ? 2.5 : 1.5}
            strokeDasharray={isActive ? "6 6" : undefined}
            markerEnd="url(#arrowhead)"
            className={cn(isActive && "animate-[dash_1s_linear_infinite]")}
          />

          {/* Source node stub */}
          <circle cx="40" cy={curveType === "straight" ? "80" : "40"} r="5" fill="var(--accent)" />
          {/* Target node stub */}
          <circle cx="360" cy={curveType === "straight" ? "80" : "120"} r="5" fill="var(--accent)" />
        </svg>

        {/* Overlay Label */}
        {edgeLabel && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-0.5 rounded font-mono text-[10px] bg-surface border border-border shadow-level-1 text-foreground">
            {edgeLabel}
          </div>
        )}
      </div>

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Edge Contract Reference
        </div>
        <CodeBlock
          code={`import type { BaseEdge } from "@nxtqr/graph-schema";

export const primaryEdge: BaseEdge = {
  id: "edge_01",
  source: "node_ingress",
  target: "node_worker",
  type: "${curveType}",
  status: "${isActive ? "active" : "idle"}",
  label: "${edgeLabel}",
  data: { protocol: "gRPC", latencyMs: 4.2 },
};`}
          language="tsx"
          filename="edge-definition.ts"
        />
      </div>
    </div>
  );
}
