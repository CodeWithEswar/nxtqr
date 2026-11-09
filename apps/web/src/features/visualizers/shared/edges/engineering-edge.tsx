"use client";

import * as React from "react";
import {
  getBezierPath,
  EdgeLabelRenderer,
  type EdgeProps,
} from "@xyflow/react";
import type { BaseEdge } from "@nxtqr/graph-schema";
import { cn } from "@nxtqr/utils";

export interface EngineeringEdgeData extends Record<string, unknown> {
  label?: string;
  status?: BaseEdge["status"];
  protocol?: string;
}

export function EngineeringEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  selected,
  style = {},
  markerEnd,
}: EdgeProps) {
  const edgeData = data as EngineeringEdgeData | undefined;
  const status = edgeData?.status ?? "idle";
  const label = edgeData?.label ?? "";

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const isExecuting = status === "active";

  return (
    <>
      {/* Background interaction path */}
      <path
        id={`${id}_bg`}
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={14}
        className="cursor-pointer"
      />

      {/* Main Visible Edge Line */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={selected ? "#a3a3a3" : isExecuting ? "#ffffff" : "#444444"}
        strokeWidth={selected ? 2 : 1.5}
        strokeDasharray={isExecuting ? "5 5" : undefined}
        className={cn(
          "transition-colors duration-150",
          isExecuting && "animate-[dash_1s_linear_infinite]"
        )}
        style={style}
        markerEnd={markerEnd}
      />

      {/* Optional Compact Edge Label */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: "absolute",
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
              pointerEvents: "all",
            }}
            className={cn(
              "px-2 py-0.5 rounded font-mono text-[9px] border transition-colors select-none",
              selected
                ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-2"
                : "bg-surface/90 border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}

export const edgeTypes = {
  bezier: EngineeringEdge,
  default: EngineeringEdge,
};
