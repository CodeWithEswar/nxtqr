"use client";

import * as React from "react";
import { GraphCanvas } from "../canvas/graph-canvas";
import { NodePalette } from "../nodes/node-palette";
import { NodeInspector } from "../inspector/node-inspector";
import { SimulationControls } from "../simulation/simulation-controls";
import { ExecutionTraceViewer } from "../trace/execution-trace-viewer";
import { useGraphEditorStore } from "@nxtqr/state";
import { Badge } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";

export interface ConnectedGraphWorkspaceProps {
  className?: string;
  height?: string | number;
}

export function ConnectedGraphWorkspace({
  className,
  height = "640px",
}: ConnectedGraphWorkspaceProps) {
  const [showPalette, setShowPalette] = React.useState<boolean>(true);
  const [showInspector, setShowInspector] = React.useState<boolean>(true);

  const nodes = useGraphEditorStore((state) => state.nodes);
  const edges = useGraphEditorStore((state) => state.edges);

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-black shadow-level-2 overflow-hidden flex flex-col select-none",
        className
      )}
      style={{ minHeight: height }}
    >
      {/* Workspace Header Bar */}
      <div className="h-10 px-3 bg-surface border-b border-subtle-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-accent flex items-center justify-center font-mono text-[10px] font-bold text-accent-foreground">
            NX
          </div>
          <span className="text-xs font-bold font-sans text-foreground">
            Connected Graph Engineering Studio
          </span>
          <Badge variant="outline" className="text-[10px] font-mono border-accent text-accent">
            {nodes.length} Nodes · {edges.length} Edges
          </Badge>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowPalette(!showPalette)}
            className={cn(
              "px-2 py-1 text-xs font-mono rounded border transition-colors",
              showPalette ? "border-accent bg-accent/10 text-accent font-semibold" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            Palette
          </button>
          <button
            onClick={() => setShowInspector(!showInspector)}
            className={cn(
              "px-2 py-1 text-xs font-mono rounded border transition-colors",
              showInspector ? "border-accent bg-accent/10 text-accent font-semibold" : "border-border text-muted-foreground hover:text-foreground"
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
          <aside className="w-56 border-r border-border bg-surface p-2.5 overflow-y-auto hidden md:block shrink-0 scrollbar-dense">
            <NodePalette className="border-0 shadow-none p-0" />
          </aside>
        )}

        {/* Center: Graph Canvas */}
        <main className="flex-1 relative flex flex-col min-w-0">
          <GraphCanvas height="100%" showToolbar={true} showMinimap={true} />
        </main>

        {/* Right: Node Inspector */}
        {showInspector && (
          <aside className="w-72 border-l border-border bg-surface p-2.5 overflow-y-auto hidden lg:block shrink-0 scrollbar-dense">
            <NodeInspector className="border-0 shadow-none p-0" />
          </aside>
        )}
      </div>

      {/* Bottom Area: Simulation Controls & Execution Trace Viewer */}
      <div className="border-t border-border bg-surface flex flex-col">
        <SimulationControls className="border-0 rounded-none bg-transparent" />
        <ExecutionTraceViewer className="border-0 rounded-none bg-black/40 border-t border-subtle-border" />
      </div>
    </div>
  );
}
