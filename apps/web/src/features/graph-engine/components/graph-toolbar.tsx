"use client";

import * as React from "react";
import { useReactFlow } from "@xyflow/react";
import { useGraphEditorStore } from "../store/graph-editor-store";
import {
  CursorIcon,
  HandIcon,
  UndoIcon,
  RedoIcon,
  GridIcon,
  MaximizeIcon,
  SlidersIcon,
  PlusIcon,
  LayersIcon,
} from "@nxtqr/icons";
import { Button } from "@nxtqr/ui";

export interface GraphToolbarProps {
  className?: string;
}

export function GraphToolbar({ className }: GraphToolbarProps) {
  const toolMode = useGraphEditorStore((s) => s.toolMode);
  const setToolMode = useGraphEditorStore((s) => s.setToolMode);

  const canUndo = useGraphEditorStore((s) => s.canUndo);
  const canRedo = useGraphEditorStore((s) => s.canRedo);
  const undo = useGraphEditorStore((s) => s.undo);
  const redo = useGraphEditorStore((s) => s.redo);

  const snapToGrid = useGraphEditorStore((s) => s.snapToGrid);
  const setSnapToGrid = useGraphEditorStore((s) => s.setSnapToGrid);

  const isInspectorOpen = useGraphEditorStore((s) => s.isInspectorOpen);
  const toggleInspector = useGraphEditorStore((s) => s.toggleInspector);

  const isNodeLibraryOpen = useGraphEditorStore((s) => s.isNodeLibraryOpen);
  const toggleNodeLibrary = useGraphEditorStore((s) => s.toggleNodeLibrary);

  const applyAutoLayout = useGraphEditorStore((s) => s.applyAutoLayout);

  const { fitView } = useReactFlow();

  return (
    <div
      className={`h-9 px-3 border-b border-border-default bg-surface-01 shrink-0 flex items-center justify-between text-xs font-mono select-none ${
        className || ""
      }`}
    >
      {/* Left: Mode Selection + Node Library Toggle */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleNodeLibrary}
          className={`h-7 px-2 text-[11px] font-mono rounded-md gap-1.5 transition-colors ${
            isNodeLibraryOpen
              ? "bg-surface-04 border-border-strong text-foreground shadow-level-3 font-semibold"
              : "bg-surface-01 border-border-default text-text-muted hover:text-foreground"
          }`}
          title="Toggle Node Library Panel"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Palette</span>
        </Button>

        <div className="h-4 w-px bg-border-subtle mx-1" />

        {/* Tool Mode: Select vs Pan */}
        <div className="flex items-center bg-surface-02 p-0.5 rounded-md border border-border-subtle">
          <button
            type="button"
            onClick={() => setToolMode("select")}
            className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${
              toolMode === "select"
                ? "bg-surface-04 text-foreground shadow-level-1 font-semibold"
                : "text-text-muted hover:text-foreground"
            }`}
            title="Select & Box Marquee Tool (V)"
          >
            <CursorIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setToolMode("pan")}
            className={`h-6 w-6 rounded flex items-center justify-center transition-colors ${
              toolMode === "pan"
                ? "bg-surface-04 text-foreground shadow-level-1 font-semibold"
                : "text-text-muted hover:text-foreground"
            }`}
            title="Hand & Canvas Pan Tool (H)"
          >
            <HandIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5 ml-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={undo}
            disabled={!canUndo}
            className="h-7 w-7 rounded-md text-text-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
            title="Undo (Ctrl+Z)"
          >
            <UndoIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={redo}
            disabled={!canRedo}
            className="h-7 w-7 rounded-md text-text-muted hover:text-foreground disabled:opacity-30 disabled:pointer-events-none"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RedoIcon className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Right: Layout, Viewport & Inspector Toggles */}
      <div className="flex items-center gap-1.5">
        {/* ELK Auto Layout */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyAutoLayout("LR")}
          className="h-7 px-2 text-[11px] font-mono rounded-md gap-1.5 border-border-default hover:bg-surface-03 text-text-secondary hover:text-foreground shadow-level-1"
          title="Auto-arrange graph layout via ELK.js (Left to Right)"
        >
          <LayersIcon className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Auto Layout</span>
        </Button>

        {/* Fit View */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => fitView({ duration: 250, padding: 0.2 })}
          className="h-7 w-7 rounded-md text-text-muted hover:text-foreground"
          title="Fit Canvas to Content"
        >
          <MaximizeIcon className="h-3.5 w-3.5" />
        </Button>

        {/* Snap to Grid Toggle */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSnapToGrid(!snapToGrid)}
          className={`h-7 w-7 rounded-md transition-colors ${
            snapToGrid ? "text-foreground bg-surface-03" : "text-text-muted hover:text-foreground"
          }`}
          title="Toggle 16px Grid Snap"
        >
          <GridIcon className="h-3.5 w-3.5" />
        </Button>

        <div className="h-4 w-px bg-border-subtle mx-1" />

        {/* Inspector Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleInspector}
          className={`h-7 px-2 text-[11px] font-mono rounded-md gap-1.5 transition-colors ${
            isInspectorOpen
              ? "bg-surface-04 border-border-strong text-foreground shadow-level-3 font-semibold"
              : "bg-surface-01 border-border-default text-text-muted hover:text-foreground"
          }`}
          title="Toggle Node Inspector Panel"
        >
          <SlidersIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Inspector</span>
        </Button>
      </div>
    </div>
  );
}

