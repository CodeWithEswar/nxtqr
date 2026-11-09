"use client";

import * as React from "react";
import { GraphCanvas } from "../../../visualizers/shared/canvas/graph-canvas";
import { useGraphEditorStore } from "@nxtqr/state";
import { Button } from "@nxtqr/ui";
import { RefreshIcon } from "@nxtqr/icons";
import { CodeBlock } from "../../components/code-block";

export function CanvasPlayground() {
  const resetToFixture = useGraphEditorStore((state) => state.resetToFixture);

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <div className="flex items-center justify-between gap-2 sm:gap-3">
          <h3 className="text-sm font-semibold font-sans text-foreground">
            <span className="hidden sm:inline">Graph Canvas Interactive Workspace</span>
            <span className="sm:hidden">Graph Canvas</span>
          </h3>

          <Button
            variant="outline"
            size="sm"
            onClick={resetToFixture}
            className="h-7 text-xs font-mono gap-1.5 shrink-0 whitespace-nowrap"
          >
            <RefreshIcon className="h-3 w-3" />
            <span className="hidden sm:inline">Reset Graph</span>
            <span className="sm:hidden">Reset</span>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Infinite pan-and-zoom visual engineering canvas with edge-to-edge full-width studio toolbar, sub-pixel grid options, automated hierarchical layout, and multi-node selection.
        </p>
      </div>

      {/* Live Canvas with Edge-to-Edge Full-Width Toolbar */}
      <GraphCanvas height="460px" showToolbar={true} showMinimap={true} />

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Graph Canvas Implementation
        </div>
        <CodeBlock
          code={`import { GraphCanvas } from "@nxtqr/web/features/visualizers";

export function StudioView() {
  return (
    <GraphCanvas
      height="100%"
      showToolbar={true}
      showMinimap={true}
    />
  );
}`}
          language="tsx"
          filename="studio-view.tsx"
        />
      </div>
    </div>
  );
}
