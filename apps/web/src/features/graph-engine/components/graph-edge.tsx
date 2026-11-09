"use client";

import * as React from "react";
import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  type EdgeProps,
  EdgeLabelRenderer,
} from "@xyflow/react";

export const GraphEdge = React.memo(function GraphEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  selected,
  label,
  data,
}: EdgeProps) {
  const edgeType = (data as any)?.edgeType || "bezier";

  const [edgePath, labelX, labelY] = React.useMemo(() => {
    if (edgeType === "smoothstep" || edgeType === "step") {
      return getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
      });
    }

    return getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }, [edgeType, sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition]);

  return (
    <>
      {/* Invisible wider hit target for reliable clicking on mobile and desktop */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={24}
        className="cursor-pointer"
      />

      {/* Visible directed edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          ...style,
          stroke: selected ? "#737373" : "#333333",
          strokeWidth: selected ? 2 : 1.5,
          transition: "stroke 0.15s ease, stroke-width 0.15s ease",
        }}
      />

      {/* Optional Directed Edge Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={`px-1.5 py-0.5 rounded-md border text-[9px] font-mono tracking-tight transition-colors select-none ${
              selected
                ? "bg-surface-04 border-border-strong text-foreground shadow-level-2"
                : "bg-surface-01 border-border-default text-text-muted hover:text-foreground hover:border-border-hover shadow-level-1"
            }`}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
});

export const edgeTypes = {
  bezier: GraphEdge,
  straight: GraphEdge,
  smoothstep: GraphEdge,
  step: GraphEdge,
  default: GraphEdge,
};

