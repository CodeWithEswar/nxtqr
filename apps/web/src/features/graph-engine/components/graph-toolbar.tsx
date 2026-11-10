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
  MonitorIcon,
} from "@nxtqr/icons";
import { Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { ValidationSummaryBadge } from "@/features/system-design/validation";
import { HealthSummaryBadge } from "@/features/system-design/health";
import { BottleneckSummaryBadge } from "@/features/system-design/bottlenecks";
import { FailureSummaryBadge } from "@/features/system-design/failure-analysis";
import { SecuritySummaryBadge } from "@/features/system-design/security-analysis";

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

  const isValidationOpen = useGraphEditorStore((s) => s.isValidationOpen);
  const toggleValidation = useGraphEditorStore((s) => s.toggleValidation);
  const isHealthOpen = useGraphEditorStore((s) => s.isHealthOpen);
  const toggleHealth = useGraphEditorStore((s) => s.toggleHealth);
  const isBottlenecksOpen = useGraphEditorStore((s) => s.isBottlenecksOpen);
  const toggleBottlenecks = useGraphEditorStore((s) => s.toggleBottlenecks);
  const isFailureAnalysisOpen = useGraphEditorStore((s) => s.isFailureAnalysisOpen);
  const toggleFailureAnalysis = useGraphEditorStore((s) => s.toggleFailureAnalysis);
  const isSecurityOpen = useGraphEditorStore((s) => s.isSecurityOpen);
  const toggleSecurity = useGraphEditorStore((s) => s.toggleSecurity);

  const isNodeLibraryOpen = useGraphEditorStore((s) => s.isNodeLibraryOpen);
  const toggleNodeLibrary = useGraphEditorStore((s) => s.toggleNodeLibrary);

  const showMinimap = useGraphEditorStore((s) => s.showMinimap);
  const toggleMinimap = useGraphEditorStore((s) => s.toggleMinimap);

  const applyAutoLayout = useGraphEditorStore((s) => s.applyAutoLayout);

  const { fitView } = useReactFlow();

  return (
    <div
      className={cn(
        "h-9 px-3 border-b border-border-default bg-surface-01 shrink-0 flex items-center justify-between text-xs font-mono select-none",
        className
      )}
    >
      {/* Left: Palette + Tool Mode (Select/Pan) + Undo/Redo */}
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={toggleNodeLibrary}
          className={cn(
            "h-7 px-2 text-[11px] font-mono rounded-md gap-1.5 border transition-colors shadow-level-1",
            isNodeLibraryOpen
              ? "bg-surface-04 border-border-strong text-foreground shadow-level-3 font-semibold"
              : "bg-surface-02 border-border-default text-text-muted hover:text-foreground hover:bg-surface-03"
          )}
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
            className={cn(
              "h-6 w-6 rounded flex items-center justify-center transition-colors cursor-pointer",
              toolMode === "select"
                ? "bg-surface-04 text-foreground shadow-level-1 font-semibold"
                : "text-text-muted hover:text-foreground hover:bg-surface-03"
            )}
            title="Select & Box Marquee Tool (V)"
          >
            <CursorIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setToolMode("pan")}
            className={cn(
              "h-6 w-6 rounded flex items-center justify-center transition-colors cursor-pointer",
              toolMode === "pan"
                ? "bg-surface-04 text-foreground shadow-level-1 font-semibold"
                : "text-text-muted hover:text-foreground hover:bg-surface-03"
            )}
            title="Hand & Canvas Pan Tool (H)"
          >
            <HandIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center bg-surface-02 p-0.5 rounded-md border border-border-subtle">
          <button
            type="button"
            onClick={undo}
            disabled={!canUndo}
            className="h-6 w-6 rounded flex items-center justify-center transition-colors text-text-muted hover:text-foreground hover:bg-surface-03 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Undo (Ctrl+Z)"
          >
            <UndoIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={redo}
            disabled={!canRedo}
            className="h-6 w-6 rounded flex items-center justify-center transition-colors text-text-muted hover:text-foreground hover:bg-surface-03 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            title="Redo (Ctrl+Shift+Z)"
          >
            <RedoIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Right: Layout, Viewport (Fit View + Grid Snap) & Inspector */}
      <div className="flex items-center gap-1.5">
        {/* ELK Auto Layout */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => applyAutoLayout("LR")}
          className="h-7 px-2 text-[11px] font-mono rounded-md gap-1.5 border border-border-default bg-surface-02 hover:bg-surface-03 text-text-secondary hover:text-foreground shadow-level-1"
          title="Auto-arrange graph layout via ELK.js (Left to Right)"
        >
          <LayersIcon className="h-3.5 w-3.5" />
          <span className="hidden md:inline">Auto Layout</span>
        </Button>

        {/* Viewport controls: Fit View + Snap to Grid + Minimap */}
        <div className="flex items-center bg-surface-02 p-0.5 rounded-md border border-border-subtle">
          <button
            type="button"
            onClick={() => fitView({ duration: 250, padding: 0.2 })}
            className="h-6 w-6 rounded flex items-center justify-center transition-colors text-text-muted hover:text-foreground hover:bg-surface-03 cursor-pointer"
            title="Fit Canvas to Content (Shift+1)"
          >
            <MaximizeIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={cn(
              "h-6 w-6 rounded flex items-center justify-center transition-colors cursor-pointer",
              snapToGrid
                ? "bg-surface-04 text-foreground shadow-level-1 font-semibold"
                : "text-text-muted hover:text-foreground hover:bg-surface-03"
            )}
            title="Toggle 16px Grid Snap (G)"
          >
            <GridIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={toggleMinimap}
            className={cn(
              "h-6 w-6 rounded flex items-center justify-center transition-colors cursor-pointer",
              showMinimap
                ? "bg-surface-04 text-foreground shadow-level-1 font-semibold"
                : "text-text-muted hover:text-foreground hover:bg-surface-03"
            )}
            title="Toggle Precision Minimap (M)"
          >
            <MonitorIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="h-4 w-px bg-border-subtle mx-1" />

        {/* Validation Panel Toggle */}
        <ValidationSummaryBadge
          isOpen={isValidationOpen}
          onToggle={toggleValidation}
        />

        {/* Health Analysis Panel Toggle */}
        <HealthSummaryBadge
          isOpen={isHealthOpen}
          onToggle={toggleHealth}
        />

        {/* Bottleneck Detection Toggle */}
        <BottleneckSummaryBadge
          isOpen={isBottlenecksOpen}
          onToggle={toggleBottlenecks}
        />

        {/* SPOF & Resiliency Analysis Toggle */}
        <FailureSummaryBadge
          isOpen={isFailureAnalysisOpen}
          onToggle={toggleFailureAnalysis}
        />

        {/* Security Architecture Analysis Toggle */}
        <SecuritySummaryBadge
          isOpen={isSecurityOpen}
          onToggle={toggleSecurity}
        />

        {/* Inspector Toggle */}
        <Button
          variant="outline"
          size="sm"
          onClick={toggleInspector}
          className={cn(
            "h-7 px-2 text-[11px] font-mono rounded-md gap-1.5 border transition-colors shadow-level-1",
            isInspectorOpen
              ? "bg-surface-04 border-border-strong text-foreground shadow-level-3 font-semibold"
              : "bg-surface-02 border-border-default text-text-muted hover:text-foreground hover:bg-surface-03"
          )}
          title="Toggle Node Inspector Panel"
        >
          <SlidersIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Inspector</span>
        </Button>
      </div>
    </div>
  );
}

