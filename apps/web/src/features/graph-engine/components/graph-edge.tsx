"use client";

import * as React from "react";
import {
  BaseEdge,
  getBezierPath,
  getSmoothStepPath,
  getStraightPath,
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
  markerEnd,
  data,
}: EdgeProps) {
  const edgeType = data?.edgeType ?? "bezier";
  const flowActive = data?.flowActive === true;
  const tutorialWire = data?.tutorialWire === true;
  const routeTop = typeof data?.routeTop === "number" ? data.routeTop : undefined;

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
        centerY: tutorialWire && targetX - sourceX < 40 ? routeTop : undefined,
      });
    }

    if (edgeType === "straight") {
      return getStraightPath({ sourceX, sourceY, targetX, targetY });
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
    routeTop,
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    tutorialWire,
  ]);

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
        markerEnd={markerEnd}
        style={{
          ...style,
          stroke: flowActive ? "#858585" : selected ? "#737373" : (style.stroke ?? "#333333"),
          strokeWidth: flowActive || selected ? 2 : (style.strokeWidth ?? 1.5),
          transition: "stroke 0.15s ease, stroke-width 0.15s ease",
        }}
      />

      {flowActive && <path aria-hidden={true} d={edgePath} className="tutorial-flow-trace" />}

      {/* Optional Directed Edge Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              left: labelX,
              top: labelY,
              transform: tutorialWire
                ? "translate(-50%, calc(-100% - 4px))"
                : "translate(-50%, -50%)",
              pointerEvents: tutorialWire ? "none" : "all",
            }}
            className={`${tutorialWire ? "max-w-36 truncate whitespace-nowrap " : ""}px-1.5 py-0.5 rounded-md border text-[9px] font-mono tracking-tight transition-colors select-none ${
              selected || flowActive
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
