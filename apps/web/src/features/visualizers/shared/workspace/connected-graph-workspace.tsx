"use client";

import * as React from "react";
import { GraphCanvas } from "../canvas/graph-canvas";
import { NodePalette } from "../nodes/node-palette";
import { NodeInspector } from "../inspector/node-inspector";
import { SimulationControls } from "../simulation/simulation-controls";
import { ExecutionTraceViewer } from "../trace/execution-trace-viewer";
import { useGraphEditorStore } from "@nxtqr/state";
import { Badge } from "@nxtqr/ui";
import { CloseIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export interface ConnectedGraphWorkspaceProps {
  className?: string;
  height?: string | number;
}

export function ConnectedGraphWorkspace({
  className,
  height = "640px",
}: ConnectedGraphWorkspaceProps) {
  const [showPalette, setShowPalette] = React.useState<boolean>(false);
  const [showInspector, setShowInspector] = React.useState<boolean>(true);

  // Auto-adapt default panel visibility based on viewport width
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const isDesktopWide = window.innerWidth >= 1280;
      setShowPalette(isDesktopWide);
      setShowInspector(window.innerWidth >= 768);
    }
  }, []);

  const nodes = useGraphEditorStore((state) => state.nodes);
  const edges = useGraphEditorStore((state) => state.edges);

  return (
    <div
      className={cn(
        "rounded-md border border-subtle-border bg-black shadow-level-2 overflow-hidden flex flex-col select-none",
        className
      )}
      style={{ minHeight: height }}
    >
      {/* Workspace Header Bar */}
      <div className="h-10 px-3 bg-surface border-b border-subtle-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center font-mono text-[10px] font-bold text-primary-foreground shrink-0">
            NX
          </div>
          <span className="text-xs font-bold font-sans text-foreground truncate">
            <span className="hidden sm:inline">Connected Graph Engineering Studio</span>
            <span className="sm:hidden">Graph Studio</span>
          </span>
          <Badge variant="outline" className="text-[10px] font-mono border-subtle-border text-muted-foreground shrink-0">
            <span className="hidden sm:inline">{nodes.length} Nodes · {edges.length} Edges</span>
            <span className="sm:hidden">{nodes.length}N · {edges.length}E</span>
          </Badge>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowPalette(!showPalette)}
            className={cn(
              "px-2 py-1 text-xs font-mono rounded-md border transition-colors",
              showPalette
                ? "border-foreground bg-[#1a1a1a] text-foreground font-semibold"
                : "border-subtle-border text-muted-foreground hover:text-foreground"
            )}
          >
            Palette
          </button>
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={cn(
              "px-2 py-1 text-xs font-mono rounded-md border transition-colors",
              showInspector
                ? "border-foreground bg-[#1a1a1a] text-foreground font-semibold"
                : "border-subtle-border text-muted-foreground hover:text-foreground"
            )}
          >
            Inspector
          </button>
        </div>
      </div>

      {/* Main Center Area: Palette + Canvas + Inspector */}
      <div className="flex-1 flex min-h-[380px] relative overflow-hidden">
        {/* Left: Node Palette */}
        {showPalette && (
          <>
            {/* Mobile/Tablet Backdrop overlay */}
            <div
              className="xl:hidden fixed inset-0 bg-black/60 z-20 backdrop-blur-none"
              onClick={() => setShowPalette(false)}
            />
            <aside
              className={cn(
                "border-r border-subtle-border bg-surface p-2.5 overflow-y-auto scrollbar-dense shrink-0",
                "absolute inset-y-0 left-0 z-30 w-60 sm:w-64 shadow-level-2 xl:relative xl:shadow-none xl:z-auto xl:w-56"
              )}
            >
              <div className="xl:hidden flex items-center justify-between pb-2 mb-2 border-b border-subtle-border">
                <span className="text-xs font-mono font-semibold uppercase text-muted-foreground">Node Palette</span>
                <button
                  onClick={() => setShowPalette(false)}
                  className="p-1 rounded border border-subtle-border text-muted-foreground hover:text-foreground"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </div>
              <NodePalette columns={1} className="border-0 shadow-none p-0" />
            </aside>
          </>
        )}

        {/* Center: Graph Canvas (Borderless drop-in) */}
        <main className="flex-1 relative flex flex-col min-w-0 overflow-hidden">
          <GraphCanvas
            height="100%"
            showToolbar={true}
            showMinimap={true}
            className="border-0 rounded-none shadow-none w-full h-full"
          />
        </main>

        {/* Right: Node Inspector */}
        {showInspector && (
          <>
            {/* Mobile/Tablet Backdrop overlay */}
            <div
              className="md:hidden fixed inset-0 bg-black/60 z-20 backdrop-blur-none"
              onClick={() => setShowInspector(false)}
            />
            <aside
              className={cn(
                "border-l border-subtle-border bg-surface p-2.5 overflow-y-auto scrollbar-dense shrink-0",
                "absolute inset-y-0 right-0 z-30 w-72 shadow-level-2 md:relative md:shadow-none md:z-auto md:w-64 xl:w-72"
              )}
            >
              <div className="md:hidden flex items-center justify-between pb-2 mb-2 border-b border-subtle-border">
                <span className="text-xs font-mono font-semibold uppercase text-muted-foreground">Inspector</span>
                <button
                  onClick={() => setShowInspector(false)}
                  className="p-1 rounded border border-subtle-border text-muted-foreground hover:text-foreground"
                >
                  <CloseIcon className="h-3 w-3" />
                </button>
              </div>
              <NodeInspector className="border-0 shadow-none p-0" />
            </aside>
          </>
        )}
      </div>

      {/* Bottom Area: Simulation Controls & Execution Trace Viewer */}
      <div className="border-t border-subtle-border bg-surface flex flex-col">
        <SimulationControls className="border-0 rounded-none bg-transparent" />
        <ExecutionTraceViewer className="border-0 rounded-none bg-black/40 border-t border-subtle-border" />
      </div>
    </div>
  );
}
