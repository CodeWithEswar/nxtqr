"use client";

import * as React from "react";
import { useReactFlow, useViewport } from "@xyflow/react";
import { useGraphEditorStore, type GridType } from "@nxtqr/state";
import { layoutGraphWithElk } from "./elk-layout";
import {
  LayersIcon,
  RefreshIcon,
  SettingsIcon,
  ChevronDownIcon,
  PlusIcon,
  MinusIcon,
  SpinnerIcon,
} from "@nxtqr/icons";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";

export function CanvasToolbar({ className }: { className?: string }) {
  const { zoomIn, zoomOut, fitView, zoomTo } = useReactFlow();
  const { zoom } = useViewport();
  const zoomPercent = Math.round(zoom * 100);

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

  return (
    <div
      className={cn(
        "w-full h-10 px-3 bg-surface border-b border-subtle-border flex items-center justify-between gap-2 select-none shrink-0 z-10",
        className
      )}
    >
      {/* =========================================================================
          DESKTOP TOOLBAR (md and above): Full-width engineering strip
          ========================================================================= */}
      <div className="hidden md:flex items-center justify-between w-full">
        {/* Left: Viewport Zoom & Telemetry */}
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => zoomOut({ duration: 150 })}
              className="w-7 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface flex items-center justify-center shrink-0 shadow-level-1 active:shadow-level-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              title="Zoom Out (Ctrl -)"
              aria-label="Zoom Out"
            >
              <MinusIcon className="h-3 w-3" />
            </button>

            <button
              onClick={() => zoomIn({ duration: 150 })}
              className="w-7 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface flex items-center justify-center shrink-0 shadow-level-1 active:shadow-level-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              title="Zoom In (Ctrl +)"
              aria-label="Zoom In"
            >
              <PlusIcon className="h-3 w-3" />
            </button>

            <button
              onClick={() => zoomTo(1, { duration: 150 })}
              className="px-2 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface font-mono text-xs flex items-center justify-center shrink-0 shadow-level-1 active:shadow-level-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              title="Reset Zoom to 100%"
            >
              {zoomPercent}%
            </button>

            <button
              onClick={() => fitView({ duration: 200, padding: 0.2 })}
              className="px-2.5 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface font-mono text-xs flex items-center justify-center shrink-0 shadow-level-1 active:shadow-level-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              title="Fit View to All Nodes"
            >
              Fit
            </button>
          </div>

          <div className="w-[1px] h-4 bg-subtle-border mx-1 shrink-0" />

          <span className="text-[11px] font-mono text-muted-foreground whitespace-nowrap">
            {nodes.length} nodes · {edges.length} edges
          </span>
        </div>

        {/* Center: Grid and Snapping Settings */}
        <div className="flex items-center gap-2">
          {/* Grid Mode Segmented Control */}
          <div className="inline-flex items-center p-0.5 rounded-md bg-black border border-subtle-border">
            <span className="text-[10px] font-mono text-muted-foreground uppercase px-1.5 hidden lg:inline">
              Grid:
            </span>
            {(["dots", "lines", "none"] as GridType[]).map((type) => {
              const isActive = gridType === type;
              return (
                <button
                  key={type}
                  onClick={() => setGridType(type)}
                  className={cn(
                    "px-2 h-6 rounded-md text-[11px] font-mono capitalize transition-all",
                    isActive
                      ? "bg-surface-04 border border-foreground text-foreground font-semibold shadow-level-3"
                      : "text-muted-foreground hover:text-foreground border border-transparent"
                  )}
                  title={`Switch to ${type} grid`}
                >
                  {type}
                </button>
              );
            })}
          </div>

          {/* Snap Switch */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={cn(
              "px-2.5 h-7 rounded-md border text-xs font-mono transition-all flex items-center gap-1.5",
              snapToGrid
                ? "border-foreground bg-surface-04 text-foreground font-semibold shadow-level-3"
                : "border-border bg-elevated-surface text-muted-foreground hover:text-foreground hover:bg-secondary-surface shadow-level-1"
            )}
            title={`Toggle 20px grid snapping (${snapToGrid ? "ON" : "OFF"})`}
          >
            <span>Snap</span>
            <span
              className={cn(
                "text-[10px] font-bold px-1 rounded",
                snapToGrid ? "bg-black/60 text-foreground" : "text-muted-foreground"
              )}
            >
              {snapToGrid ? "ON" : "OFF"}
            </span>
          </button>

          {/* MiniMap Switch */}
          <button
            onClick={toggleMinimap}
            className={cn(
              "px-2.5 h-7 rounded-md border text-xs font-mono transition-all flex items-center gap-1.5",
              showMinimap
                ? "border-foreground bg-surface-04 text-foreground font-semibold shadow-level-3"
                : "border-border bg-elevated-surface text-muted-foreground hover:text-foreground hover:bg-secondary-surface shadow-level-1"
            )}
            title={`Toggle canvas minimap navigator (${showMinimap ? "ON" : "OFF"})`}
          >
            <span>Map</span>
            <span
              className={cn(
                "text-[10px] font-bold px-1 rounded",
                showMinimap ? "bg-black/60 text-foreground" : "text-muted-foreground"
              )}
            >
              {showMinimap ? "ON" : "OFF"}
            </span>
          </button>
        </div>

        {/* Right: Actions, Layout, History */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* ELK Auto-Layout */}
          <button
            onClick={() => handleAutoLayout("RIGHT")}
            disabled={isLayingOut}
            className="px-2.5 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:border-foreground hover:bg-surface-04 flex items-center gap-1.5 text-xs font-mono transition-colors shadow-level-1 active:shadow-level-3 disabled:opacity-40"
            title="Automated Hierarchical Layout (ELK.js)"
          >
            {isLayingOut ? (
              <SpinnerIcon className="h-3 w-3 animate-spin text-foreground" />
            ) : (
              <LayersIcon className="h-3 w-3 text-foreground" />
            )}
            <span>{isLayingOut ? "Laying out..." : "Auto-Layout"}</span>
          </button>

          <div className="w-[1px] h-4 bg-subtle-border mx-0.5 shrink-0" />

          {/* Undo */}
          <button
            onClick={undo}
            disabled={past.length === 0}
            className="px-2 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface disabled:opacity-35 disabled:pointer-events-none text-xs font-mono shrink-0 items-center justify-center shadow-level-1 active:shadow-level-3"
            title="Undo Canvas Mutation (Ctrl+Z)"
          >
            Undo
          </button>

          {/* Redo */}
          <button
            onClick={redo}
            disabled={future.length === 0}
            className="px-2 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface disabled:opacity-35 disabled:pointer-events-none text-xs font-mono shrink-0 items-center justify-center shadow-level-1 active:shadow-level-3"
            title="Redo Canvas Mutation (Ctrl+Y)"
          >
            Redo
          </button>

          {/* Reset */}
          <button
            onClick={resetToFixture}
            className="w-7 h-7 rounded-md border border-border bg-elevated-surface text-muted-foreground hover:text-foreground hover:bg-secondary-surface flex items-center justify-center shrink-0 shadow-level-1 active:shadow-level-3"
            title="Reset Graph to Initial Fixture"
            aria-label="Reset Graph"
          >
            <RefreshIcon className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          MOBILE TOOLBAR (below md): Essential Zoom + Popover Menu
          ========================================================================= */}
      <div className="flex md:hidden items-center justify-between w-full">
        {/* Left: Essential Zoom Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => zoomOut({ duration: 150 })}
            className="w-7 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface flex items-center justify-center shrink-0 shadow-level-1 active:shadow-level-3"
            title="Zoom Out"
            aria-label="Zoom Out"
          >
            <MinusIcon className="h-3 w-3" />
          </button>

          <button
            onClick={() => zoomIn({ duration: 150 })}
            className="w-7 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface flex items-center justify-center shrink-0 shadow-level-1 active:shadow-level-3"
            title="Zoom In"
            aria-label="Zoom In"
          >
            <PlusIcon className="h-3 w-3" />
          </button>

          <button
            onClick={() => fitView({ duration: 200, padding: 0.2 })}
            className="px-2 h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface font-mono text-xs flex items-center justify-center shrink-0 shadow-level-1 active:shadow-level-3"
            title="Fit View"
          >
            Fit
          </button>

          <span className="text-[10px] font-mono text-muted-foreground px-1">
            {zoomPercent}%
          </span>
        </div>

        {/* Right: Mobile Popover Menu */}
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="h-7 px-2.5 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface text-xs font-mono flex items-center gap-1.5 shadow-level-1 active:shadow-level-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label="Canvas studio options"
            >
              <SettingsIcon className="h-3.5 w-3.5 text-foreground" />
              <span>Tools</span>
              <ChevronDownIcon className="h-3 w-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent
            align="end"
            sideOffset={8}
            className="w-72 p-3.5 bg-surface-03 border border-border shadow-level-2 rounded-md space-y-3 z-50 text-foreground"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between border-b border-subtle-border pb-2">
              <span className="text-xs font-bold font-sans text-foreground">
                Canvas Studio Controls
              </span>
              <span className="text-[10px] font-mono text-muted-foreground">
                {nodes.length}N · {edges.length}E
              </span>
            </div>

            {/* Grid Mode */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Grid Mode
              </div>
              <div className="grid grid-cols-3 gap-1 p-0.5 rounded-md bg-black border border-subtle-border">
                {(["dots", "lines", "none"] as GridType[]).map((type) => {
                  const isActive = gridType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setGridType(type)}
                      className={cn(
                        "py-1 rounded text-xs font-mono capitalize transition-all text-center",
                        isActive
                          ? "bg-surface-04 border border-foreground text-foreground font-semibold shadow-level-3"
                          : "text-muted-foreground hover:text-foreground border border-transparent"
                      )}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Viewport Helpers */}
            <div className="space-y-1.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Viewport Helpers
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setSnapToGrid(!snapToGrid)}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-xs font-mono transition-all",
                    snapToGrid
                      ? "border-foreground bg-surface-04 text-foreground font-semibold shadow-level-3"
                      : "border-border bg-elevated-surface text-muted-foreground hover:text-foreground hover:bg-secondary-surface shadow-level-1"
                  )}
                >
                  <span>Snap to 20px Grid</span>
                  <span className="text-[10px] font-bold">
                    {snapToGrid ? "ON" : "OFF"}
                  </span>
                </button>
                <button
                  onClick={toggleMinimap}
                  className={cn(
                    "w-full flex items-center justify-between px-2.5 py-1.5 rounded-md border text-xs font-mono transition-all",
                    showMinimap
                      ? "border-foreground bg-surface-04 text-foreground font-semibold shadow-level-3"
                      : "border-border bg-elevated-surface text-muted-foreground hover:text-foreground hover:bg-secondary-surface shadow-level-1"
                  )}
                >
                  <span>Minimap Navigator</span>
                  <span className="text-[10px] font-bold">
                    {showMinimap ? "ON" : "OFF"}
                  </span>
                </button>
              </div>
            </div>

            {/* Layout & Studio Actions */}
            <div className="space-y-1.5 border-t border-subtle-border pt-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                Layout & Actions
              </div>
              <button
                onClick={() => handleAutoLayout("RIGHT")}
                disabled={isLayingOut}
                className="w-full h-8 px-2.5 rounded-md border border-border bg-elevated-surface text-foreground hover:border-foreground hover:bg-surface-04 flex items-center justify-center gap-2 text-xs font-mono transition-colors shadow-level-1 disabled:opacity-50"
              >
                {isLayingOut ? (
                  <SpinnerIcon className="h-3.5 w-3.5 animate-spin text-foreground" />
                ) : (
                  <LayersIcon className="h-3.5 w-3.5 text-foreground" />
                )}
                <span>{isLayingOut ? "Laying out..." : "Auto-Layout Graph (ELK.js)"}</span>
              </button>

              <div className="grid grid-cols-3 gap-1.5 pt-1">
                <button
                  onClick={undo}
                  disabled={past.length === 0}
                  className="h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface disabled:opacity-40 text-xs font-mono flex items-center justify-center shadow-level-1 active:shadow-level-3"
                >
                  Undo
                </button>
                <button
                  onClick={redo}
                  disabled={future.length === 0}
                  className="h-7 rounded-md border border-border bg-elevated-surface text-foreground hover:bg-secondary-surface disabled:opacity-40 text-xs font-mono flex items-center justify-center shadow-level-1 active:shadow-level-3"
                >
                  Redo
                </button>
                <button
                  onClick={resetToFixture}
                  className="h-7 rounded-md border border-border bg-elevated-surface text-muted-foreground hover:text-foreground hover:bg-secondary-surface text-xs font-mono flex items-center justify-center gap-1 shadow-level-1 active:shadow-level-3"
                >
                  <RefreshIcon className="h-3 w-3" />
                  Reset
                </button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
