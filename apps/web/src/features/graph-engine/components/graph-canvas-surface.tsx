"use client";

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  type Edge,
  type Node,
  type ReactFlowProps,
} from "@xyflow/react";
import { cn } from "@nxtqr/utils";
import { nodeTypes } from "./graph-node";
import { edgeTypes } from "./graph-edge";
import "@xyflow/react/dist/style.css";

type GraphCanvasSurfaceProps<N extends Node, E extends Edge> = ReactFlowProps<N, E> & {
  gridType?: "dots" | "lines" | "none";
};

export function GraphCanvasSurface<N extends Node, E extends Edge>({
  children,
  className,
  gridType = "dots",
  fitViewOptions,
  ...props
}: GraphCanvasSurfaceProps<N, E>) {
  return (
    <ReactFlow
      {...props}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      colorMode="dark"
      proOptions={{ hideAttribution: true }}
      fitViewOptions={fitViewOptions}
      className={cn("nxtqr-graph-canvas", className)}
    >
      {gridType !== "none" && (
        <Background
          variant={gridType === "lines" ? BackgroundVariant.Lines : BackgroundVariant.Dots}
          gap={20}
          size={1.5}
          color="#202020"
        />
      )}

      <Controls
        showInteractive={false}
        position="bottom-left"
        fitViewOptions={fitViewOptions}
        className="!m-3 !overflow-hidden !rounded-md !border !border-border-default !shadow-level-2"
        aria-label="Canvas Viewport Controls"
      />
      {children}
    </ReactFlow>
  );
}
