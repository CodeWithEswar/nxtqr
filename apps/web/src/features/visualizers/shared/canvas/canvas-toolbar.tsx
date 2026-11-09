"use client";

import * as React from "react";
import { useReactFlow } from "@xyflow/react";
import { useGraphEditorStore, type GridType } from "@nxtqr/state";
import { layoutGraphWithElk } from "./elk-layout";
import {
  LayersIcon,
  RefreshIcon,
} from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export function CanvasToolbar({ className }: { className?: string }) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();

  const gridType = useGraphEditorStore((state) => state.gridType);
  const setGridType = useGraphEditorStore((state) => state.setGridType);
  const snapToGrid = useGraphEditorStore((state) => state.snapToGrid);
  const setSnapToGrid = useGraphEditorStore((state) => state.setSnapToGrid);
  const showMinimap = useGraphEditorStore((state) => state.showMinimap);
  const toggleMinimap = useGraphEditorStore((state) => state.toggleMinimap);

  const nodes = useGraphEditorStore((state) => state.nodes);
  const edges = useGraphEditorStore((state) => state.edges);
  const setNodes = useGraphEditorStore((state) => state.setNodes);
  const setEdges = useGraphEditorStore((state) => state.setEdges);

  const past = useGraphEditorStore((state) => state.past);
  const future = useGraphEditorStore((state) => state.future);
  const undo = useGraphEditorStore((state) => state.undo);
  const redo = useGraphEditorStore((state) => state.redo);
  const resetToFixture = useGraphEditorStore((state) => state.resetToFixture);

  const [isLayingOut, setIsLayingOut] = React.useState(false);

  const handleAutoLayout = async (direction: "RIGHT" | "DOWN" = "RIGHT") => {
    setIsLayingOut(true);
    try {
      const res = await layoutGraphWithElk(nodes, edges, { direction });
      setNodes(res.nodes);
      setEdges(res.edges);
      setTimeout(() => {
        fitView({ duration: 250 });
      }, 50);
    } finally {
      setIsLayingOut(false);
    }
  };

  const cycleGrid = () => {
    const sequence: GridType[] = ["dots", "lines", "none"];
    const next = sequence[(sequence.indexOf(gridType) + 1) % sequence.length];
    setGridType(next);
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 p-1 rounded-md border border-border bg-surface/95 backdrop-blur-none shadow-level-2 select-none max-w-[calc(100%-1.5rem)] overflow-x-auto scrollbar-none",
        className
      )}
    >
      {/* Zoom Controls */}
      <button
        onClick={() => zoomIn({ duration: 150 })}
        className="w-7 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface flex items-center justify-center text-xs font-mono font-bold shrink-0"
        title="Zoom In"
      >
        +
      </button>

      <button
        onClick={() => zoomOut({ duration: 150 })}
        className="w-7 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface flex items-center justify-center text-xs font-mono font-bold shrink-0"
        title="Zoom Out"
      >
        -
      </button>

      <button
        onClick={() => fitView({ duration: 200, padding: 0.2 })}
        className="px-2 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface flex items-center justify-center text-xs font-mono shrink-0"
        title="Fit All Nodes"
      >
        Fit
      </button>

      <div className="w-[1px] h-4 bg-border mx-0.5 shrink-0" />

      {/* Grid Toggle */}
      <button
        onClick={cycleGrid}
        className={cn(
          "px-2 h-7 rounded-md border text-xs font-mono transition-colors whitespace-nowrap shrink-0",
          gridType !== "none"
            ? "border-foreground bg-[#1a1a1a] text-foreground font-semibold"
            : "border-border bg-elevated-surface text-muted-foreground hover:text-foreground"
        )}
        title={`Grid: ${gridType}`}
      >
        Grid: {gridType}
      </button>

      {/* Snap to grid */}
      <button
        onClick={() => setSnapToGrid(!snapToGrid)}
        className={cn(
          "px-2 h-7 rounded-md border text-xs font-mono transition-colors shrink-0",
          snapToGrid
            ? "border-foreground bg-[#1a1a1a] text-foreground font-semibold"
            : "border-border bg-elevated-surface text-muted-foreground hover:text-foreground"
        )}
        title={`Snap to Grid (20px): ${snapToGrid ? "ON" : "OFF"}`}
      >
        Snap
      </button>

      {/* MiniMap Toggle */}
      <button
        onClick={toggleMinimap}
        className={cn(
          "px-2 h-7 rounded-md border text-xs font-mono transition-colors whitespace-nowrap shrink-0",
          showMinimap
            ? "border-foreground bg-[#1a1a1a] text-foreground font-semibold"
            : "border-border bg-elevated-surface text-muted-foreground hover:text-foreground"
        )}
        title={`Toggle MiniMap: ${showMinimap ? "ON" : "OFF"}`}
      >
        Map
      </button>

      <div className="w-[1px] h-4 bg-border mx-0.5 shrink-0" />

      {/* ELK Auto-layout */}
      <button
        onClick={() => handleAutoLayout("RIGHT")}
        disabled={isLayingOut}
        className="px-2 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:border-foreground hover:bg-[#1a1a1a] flex items-center gap-1.5 text-xs font-mono transition-colors shrink-0"
        title="Automated Hierarchical Layout (ELK.js)"
      >
        <LayersIcon className="h-3 w-3" />
        <span className="hidden sm:inline">{isLayingOut ? "Laying out..." : "Auto-Layout"}</span>
      </button>

      {/* Undo / Redo */}
      <button
        onClick={undo}
        disabled={past.length === 0}
        className="hidden md:inline-flex px-2 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface disabled:opacity-40 disabled:pointer-events-none text-xs font-mono shrink-0 items-center justify-center"
        title="Undo (Ctrl+Z)"
      >
        Undo
      </button>

      <button
        onClick={redo}
        disabled={future.length === 0}
        className="hidden md:inline-flex px-2 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface disabled:opacity-40 disabled:pointer-events-none text-xs font-mono shrink-0 items-center justify-center"
        title="Redo (Ctrl+Y)"
      >
        Redo
      </button>

      {/* Reset */}
      <button
        onClick={resetToFixture}
        className="w-7 h-7 rounded-md border border-border bg-elevated-surface text-muted-foreground hover:text-foreground hover:bg-secondary-surface flex items-center justify-center shrink-0"
        title="Reset to Fixture Graph"
      >
        <RefreshIcon className="h-3 w-3" />
      </button>
    </div>
  );
}
