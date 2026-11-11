"use client";

import * as React from "react";
import { GraphCanvas } from "./graph-canvas";
import { GraphToolbar } from "./graph-toolbar";
import { NodeLibrary } from "./node-library";
import { NodeInspector } from "./node-inspector";
import { MobileGraphToolbar } from "./mobile-graph-toolbar";
import { PanelResizeHandle } from "./panel-resize-handle";
import { ValidationPanel } from "@/features/system-design/validation";
import { HealthPanel } from "@/features/system-design/health";
import { BottleneckPanel } from "@/features/system-design/bottlenecks";
import { FailurePanel } from "@/features/system-design/failure-analysis";
import { SecurityPanel } from "@/features/system-design/security-analysis";
import { ScalabilityPanel } from "@/features/system-design/scalability";
import { useGraphEditorStore } from "../store/graph-editor-store";
import { useGraphPersistence } from "../hooks/use-graph-persistence";
import { Badge } from "@nxtqr/ui";
import { CheckCircleIcon, SpinnerIcon, AlertCircleIcon } from "@nxtqr/icons";
import { ReactFlowProvider } from "@xyflow/react";

export interface GraphEditorProps {
  projectId?: string | null;
  className?: string;
  fitViewOnMount?: boolean;
}

function InnerGraphEditor({ projectId, className, fitViewOnMount }: GraphEditorProps) {
  const { autosaveStatus } = useGraphPersistence(projectId);

  const title = useGraphEditorStore((s) => s.title);
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const isNodeLibraryOpen = useGraphEditorStore((s) => s.isNodeLibraryOpen);
  const isInspectorOpen = useGraphEditorStore((s) => s.isInspectorOpen);
  const isValidationOpen = useGraphEditorStore((s) => s.isValidationOpen);
  const setValidationOpen = useGraphEditorStore((s) => s.setValidationOpen);
  const isHealthOpen = useGraphEditorStore((s) => s.isHealthOpen);
  const setHealthOpen = useGraphEditorStore((s) => s.setHealthOpen);
  const isBottlenecksOpen = useGraphEditorStore((s) => s.isBottlenecksOpen);
  const setBottlenecksOpen = useGraphEditorStore((s) => s.setBottlenecksOpen);
  const isFailureAnalysisOpen = useGraphEditorStore((s) => s.isFailureAnalysisOpen);
  const setFailureAnalysisOpen = useGraphEditorStore((s) => s.setFailureAnalysisOpen);
  const isSecurityOpen = useGraphEditorStore((s) => s.isSecurityOpen);
  const setSecurityOpen = useGraphEditorStore((s) => s.setSecurityOpen);
  const isScalabilityOpen = useGraphEditorStore((s) => s.isScalabilityOpen);
  const setScalabilityOpen = useGraphEditorStore((s) => s.setScalabilityOpen);
  const setInspectorOpen = useGraphEditorStore((s) => s.setInspectorOpen);
  const nodeLibraryWidth = useGraphEditorStore((s) => s.nodeLibraryWidth);
  const inspectorWidth = useGraphEditorStore((s) => s.inspectorWidth);
  const validationPanelWidth = useGraphEditorStore((s) => s.validationPanelWidth);
  const healthPanelWidth = useGraphEditorStore((s) => s.healthPanelWidth);
  const bottlenecksPanelWidth = useGraphEditorStore((s) => s.bottlenecksPanelWidth);
  const failureAnalysisPanelWidth = useGraphEditorStore((s) => s.failureAnalysisPanelWidth);
  const securityPanelWidth = useGraphEditorStore((s) => s.securityPanelWidth);
  const scalabilityPanelWidth = useGraphEditorStore((s) => s.scalabilityPanelWidth);
  const setNodeLibraryWidth = useGraphEditorStore((s) => s.setNodeLibraryWidth);
  const setInspectorWidth = useGraphEditorStore((s) => s.setInspectorWidth);
  const setValidationPanelWidth = useGraphEditorStore((s) => s.setValidationPanelWidth);
  const setHealthPanelWidth = useGraphEditorStore((s) => s.setHealthPanelWidth);
  const setBottlenecksPanelWidth = useGraphEditorStore((s) => s.setBottlenecksPanelWidth);
  const setFailureAnalysisPanelWidth = useGraphEditorStore((s) => s.setFailureAnalysisPanelWidth);
  const setSecurityPanelWidth = useGraphEditorStore((s) => s.setSecurityPanelWidth);
  const setScalabilityPanelWidth = useGraphEditorStore((s) => s.setScalabilityPanelWidth);
  const resetPanelWidths = useGraphEditorStore((s) => s.resetPanelWidths);

  React.useEffect(() => {
    const handleReset = () => {
      resetPanelWidths();
    };
    window.addEventListener("nxtqr:reset-layout", handleReset);
    return () => window.removeEventListener("nxtqr:reset-layout", handleReset);
  }, [resetPanelWidths]);

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
          <aside
            style={{ width: `${nodeLibraryWidth}px` }}
            className="hidden md:flex relative border-r border-border-default bg-surface-01 shrink-0 overflow-visible flex-col shadow-level-1 select-none"
          >
            <div className="flex h-9 shrink-0 items-center border-b border-border-subtle bg-surface-02 px-3 text-xs font-semibold">
              Component picker
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <NodeLibrary />
            </div>

            {/* Resize Handle on Right Edge of Node Palette */}
            <PanelResizeHandle
              side="right"
              currentWidth={nodeLibraryWidth}
              minWidth={220}
              maxWidth={480}
              defaultWidth={280}
              onResize={setNodeLibraryWidth}
              ariaLabel="Resize Node Palette panel"
            />
          </aside>
        )}

        {/* Center: Graph Canvas Viewport */}
        <main className="flex-1 relative h-full w-full overflow-hidden min-h-0">
          <GraphCanvas fitViewOnMount={fitViewOnMount} />

          {/* Mobile Bottom Floating Action Bar & Drawers */}
          <MobileGraphToolbar />
        </main>

        {/* Right: Desktop Scalability Recommendations & What-If Planner Panel */}
        {isScalabilityOpen && (
          <aside
            style={{ width: `${scalabilityPanelWidth}px` }}
            className="hidden md:flex relative border-l border-border-default bg-surface-01 shrink-0 overflow-visible flex-col shadow-level-1 select-none"
          >
            <div className="flex-1 overflow-hidden min-h-0">
              <ScalabilityPanel
                onClose={() => setScalabilityOpen(false)}
                onFocusNode={() => setInspectorOpen(true)}
              />
            </div>

            {/* Resize Handle on Left Edge of Scalability Panel */}
            <PanelResizeHandle
              side="left"
              currentWidth={scalabilityPanelWidth}
              minWidth={280}
              maxWidth={600}
              defaultWidth={380}
              onResize={setScalabilityPanelWidth}
              ariaLabel="Resize Scalability Recommendations panel"
            />
          </aside>
        )}

        {/* Right: Desktop Security Architecture Analysis Panel */}
        {isSecurityOpen && (
          <aside
            style={{ width: `${securityPanelWidth}px` }}
            className="hidden md:flex relative border-l border-border-default bg-surface-01 shrink-0 overflow-visible flex-col shadow-level-1 select-none"
          >
            <div className="flex-1 overflow-hidden min-h-0">
              <SecurityPanel
                onClose={() => setSecurityOpen(false)}
                onFocusNode={() => setInspectorOpen(true)}
              />
            </div>

            {/* Resize Handle on Left Edge of Security Panel */}
            <PanelResizeHandle
              side="left"
              currentWidth={securityPanelWidth}
              minWidth={280}
              maxWidth={580}
              defaultWidth={380}
              onResize={setSecurityPanelWidth}
              ariaLabel="Resize Security Architecture panel"
            />
          </aside>
        )}

        {/* Right: Desktop Single Point of Failure (SPOF) Analysis Panel */}
        {isFailureAnalysisOpen && (
          <aside
            style={{ width: `${failureAnalysisPanelWidth}px` }}
            className="hidden md:flex relative border-l border-border-default bg-surface-01 shrink-0 overflow-visible flex-col shadow-level-1 select-none"
          >
            <div className="flex-1 overflow-hidden min-h-0">
              <FailurePanel
                onClose={() => setFailureAnalysisOpen(false)}
                onFocusNode={() => setInspectorOpen(true)}
              />
            </div>

            {/* Resize Handle on Left Edge of Failure Analysis Panel */}
            <PanelResizeHandle
              side="left"
              currentWidth={failureAnalysisPanelWidth}
              minWidth={280}
              maxWidth={580}
              defaultWidth={360}
              onResize={setFailureAnalysisPanelWidth}
              ariaLabel="Resize SPOF analysis panel"
            />
          </aside>
        )}

        {/* Right: Desktop Bottleneck Detection Panel (Resizable / Collapsible) */}
        {isBottlenecksOpen && (
          <aside
            style={{ width: `${bottlenecksPanelWidth}px` }}
            className="hidden md:flex relative border-l border-border-default bg-surface-01 shrink-0 overflow-visible flex-col shadow-level-1 select-none"
          >
            <div className="flex-1 overflow-hidden min-h-0">
              <BottleneckPanel
                onClose={() => setBottlenecksOpen(false)}
                onFocusNode={() => setInspectorOpen(true)}
              />
            </div>

            {/* Resize Handle on Left Edge of Bottlenecks Panel */}
            <PanelResizeHandle
              side="left"
              currentWidth={bottlenecksPanelWidth}
              minWidth={280}
              maxWidth={580}
              defaultWidth={360}
              onResize={setBottlenecksPanelWidth}
              ariaLabel="Resize Bottleneck Detection panel"
            />
          </aside>
        )}

        {/* Right: Desktop Architecture Health Analysis Panel (Resizable / Collapsible) */}
        {isHealthOpen && (
          <aside
            style={{ width: `${healthPanelWidth}px` }}
            className="hidden md:flex relative border-l border-border-default bg-surface-01 shrink-0 overflow-visible flex-col shadow-level-1 select-none"
          >
            <div className="flex-1 overflow-hidden min-h-0">
              <HealthPanel
                onClose={() => setHealthOpen(false)}
                onFocusNode={() => setInspectorOpen(true)}
              />
            </div>

            {/* Resize Handle on Left Edge of Health Panel */}
            <PanelResizeHandle
              side="left"
              currentWidth={healthPanelWidth}
              minWidth={280}
              maxWidth={560}
              defaultWidth={340}
              onResize={setHealthPanelWidth}
              ariaLabel="Resize Architecture Health panel"
            />
          </aside>
        )}

        {/* Right: Desktop Architecture Validation Panel (Resizable / Collapsible) */}
        {isValidationOpen && (
          <aside
            style={{ width: `${validationPanelWidth}px` }}
            className="hidden md:flex relative border-l border-border-default bg-surface-01 shrink-0 overflow-visible flex-col shadow-level-1 select-none"
          >
            <div className="flex-1 overflow-hidden min-h-0">
              <ValidationPanel
                onClose={() => setValidationOpen(false)}
                onOpenInspectorField={() => setInspectorOpen(true)}
              />
            </div>

            {/* Resize Handle on Left Edge of Validation Panel */}
            <PanelResizeHandle
              side="left"
              currentWidth={validationPanelWidth}
              minWidth={260}
              maxWidth={540}
              defaultWidth={320}
              onResize={setValidationPanelWidth}
              ariaLabel="Resize Architecture Validation panel"
            />
          </aside>
        )}

        {/* Right: Desktop Node Inspector (Resizable / Collapsible) */}
        {isInspectorOpen && (
          <aside
            style={{ width: `${inspectorWidth}px` }}
            className="hidden md:flex relative border-l border-border-default bg-surface-01 shrink-0 overflow-visible flex-col shadow-level-1 select-none"
          >
            <div className="h-8 px-3 border-b border-border-subtle bg-surface-02 flex items-center justify-between text-[11px] font-mono font-semibold text-text-muted uppercase tracking-wider shrink-0">
              <span>Inspector</span>
              <Badge variant="outline" className="text-[9px] font-mono rounded-md h-4 px-1 text-text-disabled">
                Live
              </Badge>
            </div>
            <div className="flex-1 overflow-hidden min-h-0">
              <NodeInspector />
            </div>

            {/* Resize Handle on Left Edge of Node Inspector */}
            <PanelResizeHandle
              side="left"
              currentWidth={inspectorWidth}
              minWidth={260}
              maxWidth={540}
              defaultWidth={320}
              onResize={setInspectorWidth}
              ariaLabel="Resize Node Inspector panel"
            />
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

