"use client";

import * as React from "react";
import { GraphCanvas } from "../../../visualizers/shared/canvas/graph-canvas";
import { useGraphEditorStore, type GridType } from "@nxtqr/state";
import { Badge, Button } from "@nxtqr/ui";
import { RefreshIcon } from "@nxtqr/icons";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

export function CanvasPlayground() {
  const gridType = useGraphEditorStore((state) => state.gridType);
  const setGridType = useGraphEditorStore((state) => state.setGridType);
  const snapToGrid = useGraphEditorStore((state) => state.snapToGrid);
  const setSnapToGrid = useGraphEditorStore((state) => state.setSnapToGrid);
  const resetToFixture = useGraphEditorStore((state) => state.resetToFixture);

  const nodes = useGraphEditorStore((state) => state.nodes);
  const edges = useGraphEditorStore((state) => state.edges);

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-4">
        <div>
          <h3 className="text-sm font-semibold font-sans text-foreground flex items-center gap-2">
            Graph Canvas Interactive Workspace
            <Badge variant="outline" className="border-accent text-accent font-mono text-[10px] uppercase">
              @xyflow/react + ELK.js
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Infinite pan-and-zoom visual engineering canvas with sub-pixel grid options, automated hierarchical layout, and multi-node selection.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={resetToFixture}
          className="h-7 text-xs font-mono gap-1.5 self-start sm:self-auto"
        >
          <RefreshIcon className="h-3 w-3" />
          Reset Graph
        </Button>
      </div>

      {/* Control Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 bg-secondary-surface border border-border rounded-md">
        {/* Grid Type Selector */}
        <div className="flex items-center gap-1 text-xs font-mono">
          <span className="text-muted-foreground mr-1">Grid:</span>
          {(["dots", "lines", "none"] as GridType[]).map((g) => (
            <button
              key={g}
              onClick={() => setGridType(g)}
              className={cn(
                "px-2 py-0.5 rounded capitalize transition-colors",
                gridType === g
                  ? "bg-accent text-accent-foreground font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {g}
            </button>
          ))}
        </div>

        {/* Snap to grid switch */}
        <button
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={cn(
            "px-2.5 py-1 text-xs font-mono rounded border transition-colors",
            snapToGrid
              ? "border-accent bg-accent/10 text-accent font-semibold"
              : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Snap to 20px Grid: {snapToGrid ? "ON" : "OFF"}
        </button>

        {/* Telemetry badge */}
        <div className="text-xs font-mono text-muted-foreground">
          Nodes: <span className="text-foreground font-bold">{nodes.length}</span> · Edges:{" "}
          <span className="text-foreground font-bold">{edges.length}</span>
        </div>
      </div>

      {/* Live Canvas */}
      <GraphCanvas height="420px" showToolbar={true} showMinimap={true} />

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Graph Canvas Implementation
        </div>
        <CodeBlock
          code={`import { GraphCanvas } from "@nxtqr/web/features/visualizers";

export function StudioView() {
  return (
    <div className="w-full h-[600px] border border-border rounded-md">
      <GraphCanvas
        showToolbar={true}
        showMinimap={true}
        height="100%"
      />
    </div>
  );
}`}
          language="tsx"
          filename="canvas-example.tsx"
        />
      </div>
    </div>
  );
}
