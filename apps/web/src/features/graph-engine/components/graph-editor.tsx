"use client";

import * as React from "react";
import { GraphCanvas } from "./graph-canvas";
import { GraphToolbar } from "./graph-toolbar";
import { NodeLibrary } from "./node-library";
import { NodeInspector } from "./node-inspector";
import { MobileGraphToolbar } from "./mobile-graph-toolbar";
import { useGraphEditorStore } from "../store/graph-editor-store";
import { useGraphPersistence } from "../hooks/use-graph-persistence";
import { Badge } from "@nxtqr/ui";
import { CheckCircleIcon, SpinnerIcon, AlertCircleIcon } from "@nxtqr/icons";
import { ReactFlowProvider } from "@xyflow/react";

export interface GraphEditorProps {
  projectId?: string | null;
  className?: string;
}

function InnerGraphEditor({ projectId, className }: GraphEditorProps) {
  const { autosaveStatus } = useGraphPersistence(projectId);

  const title = useGraphEditorStore((s) => s.title);
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const isNodeLibraryOpen = useGraphEditorStore((s) => s.isNodeLibraryOpen);
  const isInspectorOpen = useGraphEditorStore((s) => s.isInspectorOpen);

  return (
    <div
      className={`relative h-full w-full flex flex-col bg-black text-foreground overflow-hidden select-none ${
        className || ""
      }`}
    >
      {/* 1. Desktop & Tablet Top Canvas Toolbar */}
      <div className="hidden md:block">
        <GraphToolbar />
      </div>

      {/* 2. Mobile Minimal Top Header Bar */}
      <div className="md:hidden h-10 px-3 bg-surface-01 border-b border-border-default flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-2 min-w-0 pr-2">
          <div className="w-5 h-5 rounded bg-primary flex items-center justify-center font-mono text-[10px] font-bold text-primary-foreground shrink-0">
            NX
          </div>
          <span className="text-xs font-bold font-sans text-foreground truncate">
            {title || "Graph Studio"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className="text-[9px] font-mono border-border-default text-text-muted rounded-md h-5 px-1.5"
          >
            {nodes.length}N · {edges.length}E
          </Badge>
          {autosaveStatus === "saving" && (
            <SpinnerIcon className="h-3 w-3 text-text-muted animate-spin" />
          )}
        </div>
      </div>

      {/* 3. Main Center Workspace: 3-column layout on Desktop, Fullscreen on Mobile */}
      <div className="flex-1 flex relative overflow-hidden min-h-0">
        {/* Left: Desktop Node Library (Resizable / Collapsible) */}
        {isNodeLibraryOpen && (
          <aside className="hidden md:flex w-64 lg:w-68 border-r border-border-default bg-surface-01 shrink-0 overflow-hidden flex-col shadow-level-1">
            <div className="h-8 px-3 border-b border-border-subtle bg-surface-02 flex items-center justify-between text-[11px] font-mono font-semibold text-text-muted uppercase tracking-wider shrink-0">
              <span>Node Palette</span>
              <Badge variant="outline" className="text-[9px] font-mono rounded-md h-4 px-1 text-text-disabled">
                Foundations
              </Badge>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <NodeLibrary />
            </div>
          </aside>
        )}

        {/* Center: Graph Canvas Viewport */}
        <main className="flex-1 relative h-full w-full overflow-hidden min-h-0">
          <GraphCanvas />

          {/* Mobile Bottom Floating Action Bar & Drawers */}
          <MobileGraphToolbar />
        </main>

        {/* Right: Desktop Node Inspector (Resizable / Collapsible) */}
        {isInspectorOpen && (
          <aside className="hidden md:flex w-72 lg:w-80 border-l border-border-default bg-surface-01 shrink-0 overflow-hidden flex-col shadow-level-1">
            <div className="h-8 px-3 border-b border-border-subtle bg-surface-02 flex items-center justify-between text-[11px] font-mono font-semibold text-text-muted uppercase tracking-wider shrink-0">
              <span>Inspector</span>
              <Badge variant="outline" className="text-[9px] font-mono rounded-md h-4 px-1 text-text-disabled">
                Live
              </Badge>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <NodeInspector />
            </div>
          </aside>
        )}
      </div>

      {/* 4. Desktop Status Strip */}
      <footer className="hidden md:flex h-6 px-3 bg-surface-02 border-t border-border-default items-center justify-between font-mono text-[10px] text-text-muted shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <span className="font-semibold text-foreground truncate max-w-[200px]">
            {title}
          </span>
          <span className="text-border-subtle">·</span>
          <span>{nodes.length} Nodes</span>
          <span className="text-border-subtle">·</span>
          <span>{edges.length} Connections</span>
        </div>

        <div className="flex items-center gap-2">
          {autosaveStatus === "saving" && (
            <span className="flex items-center gap-1 text-text-muted">
              <SpinnerIcon className="h-2.5 w-2.5 animate-spin" />
              <span>Saving...</span>
            </span>
          )}
          {autosaveStatus === "saved" && (
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircleIcon className="h-2.5 w-2.5" />
              <span>Autosaved</span>
            </span>
          )}
          {autosaveStatus === "unsaved_changes" && (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>Unsaved Changes</span>
            </span>
          )}
          {autosaveStatus === "error" && (
            <span className="flex items-center gap-1 text-red-400">
              <AlertCircleIcon className="h-2.5 w-2.5" />
              <span>Save Failed</span>
            </span>
          )}
          <span className="text-border-subtle">·</span>
          <span>NXTQR Canvas v1.0</span>
        </div>
      </footer>
    </div>
  );
}

export function GraphEditor(props: GraphEditorProps) {
  return (
    <ReactFlowProvider>
      <InnerGraphEditor {...props} />
    </ReactFlowProvider>
  );
}

