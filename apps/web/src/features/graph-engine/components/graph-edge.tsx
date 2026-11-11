"use client";

import * as React from "react";
import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
  MarkerType,
  Position,
  type EdgeProps,
  EdgeLabelRenderer,
} from "@xyflow/react";
import { cn } from "@nxtqr/utils";

export const showcaseEdgeMarker = {
  type: MarkerType.ArrowClosed,
  width: 12,
  height: 12,
};

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
  markerEnd,
  data,
}: EdgeProps) {
  const edgeType = data?.edgeType ?? "bezier";
  const flowActive = data?.flowActive === true;
  const pulseDelay = typeof data?.flowPulseDelay === "number" ? data.flowPulseDelay : undefined;
  const traceKey = typeof data?.traceKey === "string" ? data.traceKey : undefined;
  const tutorialWire = data?.tutorialWire === true;
  const showcaseWire = tutorialWire || data?.showcaseWire === true;
  const horizontal = sourcePosition === Position.Right && targetPosition === Position.Left;

  const [edgePath, labelX, labelY] = React.useMemo(() => {
    if (edgeType === "straight") {
      return getStraightPath({ sourceX, sourceY, targetX, targetY });
    }

    if (showcaseWire || edgeType === "smoothstep" || edgeType === "step") {
      return getSmoothStepPath({
        sourceX,
        sourceY,
        sourcePosition,
        targetX,
        targetY,
        targetPosition,
        borderRadius: 8,
        centerY:
          showcaseWire && horizontal && targetX - sourceX < 40
            ? Math.min(sourceY, targetY) - 96
            : undefined,
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
  }, [
    edgeType,
    horizontal,
    showcaseWire,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  ]);

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={tutorialWire ? 0 : 24}
        style={{
          ...style,
          stroke: flowActive
            ? "var(--tutorial-flow-route-stroke, #858585)"
            : selected
              ? "#737373"
              : (style.stroke ?? (showcaseWire ? "var(--text-disabled)" : "#333333")),
          strokeWidth: selected ? 2 : (style.strokeWidth ?? 1.5),
          vectorEffect: showcaseWire ? "non-scaling-stroke" : style.vectorEffect,
          transition: "stroke 0.15s ease, stroke-width 0.15s ease",
        }}
      />

      {pulseDelay !== undefined && (
        <path
          key={traceKey}
          aria-hidden={true}
          d={edgePath}
          pathLength={100}
          className="tutorial-flow-trace"
          style={{ animationDelay: `${pulseDelay}ms` }}
        />
      )}

      {/* Optional Directed Edge Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              left: labelX,
              top: labelY,
              transform: showcaseWire
                ? horizontal
                  ? "translate(-50%, calc(-100% - 5px))"
                  : "translate(10px, -50%)"
                : "translate(-50%, -50%)",
              pointerEvents: tutorialWire ? "none" : "all",
            }}
            className={cn(
              "select-none rounded-md border px-1.5 py-0.5 transition-colors",
              showcaseWire
                ? "max-w-[8.5rem] truncate text-[11px] font-medium"
                : "font-mono text-[9px] tracking-tight",
              selected || flowActive
                ? "bg-surface-04 border-border-strong text-foreground shadow-level-2"
                : "bg-surface-01 border-border-default text-text-secondary hover:text-foreground hover:border-border-hover shadow-level-1",
            )}
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
