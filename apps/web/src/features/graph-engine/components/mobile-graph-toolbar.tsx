"use client";

import * as React from "react";
import { useReactFlow } from "@xyflow/react";
import { useGraphEditorStore } from "../store/graph-editor-store";
import {
  PlusIcon,
  CursorIcon,
  HandIcon,
  UndoIcon,
  RedoIcon,
  SlidersIcon,
  CopyIcon,
  TrashIcon,
  CloseIcon,
  MaximizeIcon,
  LayersIcon,
  GridIcon,
} from "@nxtqr/icons";
import {
  Button,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@nxtqr/ui";
import { NodeLibrary } from "./node-library";
import { NodeInspector } from "./node-inspector";
import { ValidationPanel, ValidationSummaryBadge } from "@/features/system-design/validation";
import { HealthPanel, HealthSummaryBadge } from "@/features/system-design/health";

export function MobileGraphToolbar() {
  const toolMode = useGraphEditorStore((s) => s.toolMode);
  const setToolMode = useGraphEditorStore((s) => s.setToolMode);

  const canUndo = useGraphEditorStore((s) => s.canUndo);
  const canRedo = useGraphEditorStore((s) => s.canRedo);
  const undo = useGraphEditorStore((s) => s.undo);
  const redo = useGraphEditorStore((s) => s.redo);

  const selectedNodeIds = useGraphEditorStore((s) => s.selectedNodeIds);
  const nodes = useGraphEditorStore((s) => s.nodes);
  const clearSelection = useGraphEditorStore((s) => s.clearSelection);
  const duplicateSelected = useGraphEditorStore((s) => s.duplicateSelected);
  const deleteSelected = useGraphEditorStore((s) => s.deleteSelected);
  const applyAutoLayout = useGraphEditorStore((s) => s.applyAutoLayout);
  const snapToGrid = useGraphEditorStore((s) => s.snapToGrid);
  const setSnapToGrid = useGraphEditorStore((s) => s.setSnapToGrid);

  const { fitView } = useReactFlow();

  // Mobile Drawer states
  const [libraryOpen, setLibraryOpen] = React.useState(false);
  const [inspectorOpen, setInspectorOpen] = React.useState(false);
  const [validationOpen, setValidationOpen] = React.useState(false);
  const [healthOpen, setHealthOpen] = React.useState(false);
  const [moreMenuOpen, setMoreMenuOpen] = React.useState(false);

  // Selected node reference for contextual bar
  const selectedNode = React.useMemo(() => {
    if (selectedNodeIds.length === 1) {
      return nodes.find((n) => n.id === selectedNodeIds[0]) || null;
    }
    return null;
  }, [selectedNodeIds, nodes]);

  return (
    <>
      {/* 1. Contextual Quick Bar when node(s) are selected on mobile */}
      {selectedNodeIds.length > 0 && (
        <div className="md:hidden fixed bottom-16 left-3 right-3 z-30 flex items-center justify-between p-2 rounded-md bg-surface-02/95 border border-border-strong shadow-level-3 backdrop-blur-none animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center gap-2 min-w-0 pr-2">
            <span className="font-mono text-[10px] text-text-muted shrink-0">
              {selectedNodeIds.length === 1 ? `#${selectedNodeIds[0].slice(-4)}` : `${selectedNodeIds.length}N`}
            </span>
            <span className="font-sans text-xs font-semibold text-foreground truncate">
              {selectedNode ? selectedNode.label || selectedNode.type : "Selected"}
            </span>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInspectorOpen(true)}
              className="h-7 px-2 text-[10px] font-mono rounded-md border-border-default bg-surface-01 gap-1"
            >
              <SlidersIcon className="h-3 w-3" />
              <span>Inspect</span>
            </Button>

            <Button
              variant="outline"
              size="icon-sm"
              onClick={duplicateSelected}
              className="h-7 w-7 rounded-md border-border-default bg-surface-01"
              title="Duplicate"
            >
              <CopyIcon className="h-3 w-3" />
            </Button>

            <Button
              variant="destructive"
              size="icon-sm"
              onClick={deleteSelected}
              className="h-7 w-7 rounded-md"
              title="Delete"
            >
              <TrashIcon className="h-3 w-3" />
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={clearSelection}
              className="h-7 w-7 rounded-md text-text-muted hover:text-foreground"
              title="Deselect"
            >
              <CloseIcon className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* 2. Floating Mobile Bottom Action Bar */}
      <div className="md:hidden fixed bottom-3 left-3 right-3 z-20 flex items-center justify-between px-3 py-1.5 rounded-md bg-surface-01 border border-border-default shadow-level-2 select-none">
        {/* Add Node Trigger */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => setLibraryOpen(true)}
          className="h-8 px-2.5 text-xs font-mono rounded-md gap-1.5 border-border-default bg-surface-02 shadow-level-1 text-foreground"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          <span>Add</span>
        </Button>

        {/* Tool Mode Toggle */}
        <div className="flex items-center bg-surface-02 p-0.5 rounded-md border border-border-subtle">
          <button
            type="button"
            onClick={() => setToolMode("select")}
            className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
              toolMode === "select"
                ? "bg-surface-04 text-foreground shadow-level-1 font-semibold"
                : "text-text-muted"
            }`}
            title="Select tool"
          >
            <CursorIcon className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setToolMode("pan")}
            className={`h-7 w-7 rounded flex items-center justify-center transition-colors ${
              toolMode === "pan"
                ? "bg-surface-04 text-foreground shadow-level-1 font-semibold"
                : "text-text-muted"
            }`}
            title="Pan tool"
          >
            <HandIcon className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Undo / Redo */}
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={undo}
            disabled={!canUndo}
            className="h-7 w-7 rounded-md text-text-muted hover:text-foreground disabled:opacity-20"
          >
            <UndoIcon className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={redo}
            disabled={!canRedo}
            className="h-7 w-7 rounded-md text-text-muted hover:text-foreground disabled:opacity-20"
          >
            <RedoIcon className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Mobile Validation Button */}
        <ValidationSummaryBadge
          isOpen={validationOpen}
          onToggle={() => setValidationOpen(!validationOpen)}
        />

        {/* Mobile Health Button */}
        <HealthSummaryBadge
          isOpen={healthOpen}
          onToggle={() => setHealthOpen(!healthOpen)}
        />

        {/* Mobile Popover Menu for Secondary Actions */}
        <Popover open={moreMenuOpen} onOpenChange={setMoreMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2 text-xs font-mono rounded-md border-border-default bg-surface-02 text-text-muted hover:text-foreground"
            >
              More
            </Button>
          </PopoverTrigger>
          <PopoverContent
            side="top"
            align="end"
            className="w-48 p-1.5 bg-surface-01 border border-border-strong rounded-md shadow-level-3 space-y-1 font-mono text-xs"
          >
            <button
              type="button"
              onClick={() => {
                fitView({ duration: 250, padding: 0.2 });
                setMoreMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-03 text-text-secondary hover:text-foreground text-left"
            >
              <MaximizeIcon className="h-3.5 w-3.5" />
              <span>Fit to View</span>
            </button>

            <button
              type="button"
              onClick={() => {
                applyAutoLayout("LR");
                setMoreMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-03 text-text-secondary hover:text-foreground text-left"
            >
              <LayersIcon className="h-3.5 w-3.5" />
              <span>Auto Layout (LR)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                applyAutoLayout("TB");
                setMoreMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-surface-03 text-text-secondary hover:text-foreground text-left"
            >
              <LayersIcon className="h-3.5 w-3.5" />
              <span>Auto Layout (TB)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setSnapToGrid(!snapToGrid);
                setMoreMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded hover:bg-surface-03 text-text-secondary hover:text-foreground text-left"
            >
              <div className="flex items-center gap-2">
                <GridIcon className="h-3.5 w-3.5" />
                <span>Snap to Grid</span>
              </div>
              <span className="text-[10px] text-text-muted">{snapToGrid ? "ON" : "OFF"}</span>
            </button>
          </PopoverContent>
        </Popover>
      </div>

      {/* 3. Searchable Bottom Drawer for Node Library on Mobile */}
      <Sheet open={libraryOpen} onOpenChange={setLibraryOpen}>
        <SheetContent
          side="bottom"
          hideCloseButton
          aria-describedby={undefined}
          className="flex h-[85dvh] flex-col gap-0 overflow-hidden rounded-t-md border-t border-border-strong bg-surface-01 p-0 pb-[env(safe-area-inset-bottom)] shadow-level-2"
        >
          <SheetHeader className="flex-row items-center justify-between space-y-0 border-b border-border-subtle bg-surface-02 px-3 py-2">
            <SheetTitle>Component picker</SheetTitle>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Close component picker"
              onClick={() => setLibraryOpen(false)}
              className="size-10 text-text-muted hover:text-foreground"
            >
              <CloseIcon aria-hidden={true} className="size-4" />
            </Button>
          </SheetHeader>

          <div className="flex-1 overflow-hidden min-h-0">
            <NodeLibrary onNodeAdded={() => setLibraryOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* 4. Bottom Drawer for Node Inspector on Mobile */}
      <Sheet open={inspectorOpen} onOpenChange={setInspectorOpen}>
        <SheetContent
          side="bottom"
          hideCloseButton
          className="h-[80vh] max-h-[80vh] p-0 bg-surface-01 border-t border-border-strong rounded-t-md flex flex-col overflow-hidden shadow-level-3"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Node Inspector</SheetTitle>
          </SheetHeader>

          {/* Drawer Drag Pill */}
          <div className="w-full flex justify-center pt-2.5 pb-1.5 shrink-0 bg-surface-02 border-b border-border-subtle/40">
            <div className="w-10 h-1 rounded-full bg-border-strong" />
          </div>

          <div className="flex items-center justify-between px-3 py-2 border-b border-border-subtle bg-surface-02">
            <span className="font-sans text-xs font-bold text-foreground">Inspector</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setInspectorOpen(false)}
              className="h-6 w-6 rounded-md text-text-muted hover:text-foreground"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </Button>
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            <NodeInspector onClose={() => setInspectorOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* 5. Bottom Drawer for Architecture Validation on Mobile */}
      <Sheet open={validationOpen} onOpenChange={setValidationOpen}>
        <SheetContent
          side="bottom"
          hideCloseButton
          className="h-[80vh] max-h-[80vh] p-0 bg-surface-01 border-t border-border-strong rounded-t-md flex flex-col overflow-hidden shadow-level-3"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Architecture Validation</SheetTitle>
          </SheetHeader>

          {/* Drawer Drag Pill */}
          <div className="w-full flex justify-center pt-2.5 pb-1.5 shrink-0 bg-surface-02 border-b border-border-subtle/40">
            <div className="w-10 h-1 rounded-full bg-border-strong" />
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            <ValidationPanel onClose={() => setValidationOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* 6. Bottom Drawer for Architecture Health on Mobile */}
      <Sheet open={healthOpen} onOpenChange={setHealthOpen}>
        <SheetContent
          side="bottom"
          hideCloseButton
          className="h-[80vh] max-h-[80vh] p-0 bg-surface-01 border-t border-border-strong rounded-t-md flex flex-col overflow-hidden shadow-level-3"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Architecture Health</SheetTitle>
          </SheetHeader>

          {/* Drawer Drag Pill */}
          <div className="w-full flex justify-center pt-2.5 pb-1.5 shrink-0 bg-surface-02 border-b border-border-subtle/40">
            <div className="w-10 h-1 rounded-full bg-border-strong" />
          </div>

          <div className="flex-1 overflow-hidden min-h-0">
            <HealthPanel onClose={() => setHealthOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

