"use client";

import * as React from "react";
import { NodeInspector } from "../../../visualizers/shared/inspector/node-inspector";
import { useGraphEditorStore } from "@nxtqr/state";
import { Badge } from "@nxtqr/ui";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

export function InspectorPlayground() {
  const nodes = useGraphEditorStore((state) => state.nodes);
  const selectedNodeId = useGraphEditorStore((state) => state.selectedNodeId);
  const selectNode = useGraphEditorStore((state) => state.selectNode);

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-4">
        <div>
          <h3 className="text-sm font-semibold font-sans text-foreground flex items-center gap-2">
            Node Inspector Laboratory
            <Badge variant="outline" className="border-accent text-accent font-mono text-[10px] uppercase">
              Zod Validated Forms
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Contextual floating properties inspector with real-time state synchronization, port connections, and container query adaptation.
          </p>
        </div>

        <div className="text-xs font-mono text-muted-foreground self-start sm:self-auto">
          Active Node: <span className="text-accent font-bold">{selectedNodeId ?? "None"}</span>
        </div>
      </div>

      {/* Node selector buttons */}
      <div className="space-y-1.5">
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
          Select Graph Node to Inspect
        </label>
        <div className="flex flex-wrap gap-2">
          {nodes.map((n) => (
            <button
              key={n.id}
              onClick={() => selectNode(n.id)}
              className={cn(
                "px-3 py-1.5 rounded-md border text-xs font-mono transition-all",
                selectedNodeId === n.id
                  ? "border-accent bg-accent/10 ring-1 ring-accent text-foreground font-semibold"
                  : "border-border bg-elevated-surface text-muted-foreground hover:border-muted-border hover:text-foreground"
              )}
            >
              {n.label ?? n.id} ({n.type})
            </button>
          ))}
          <button
            onClick={() => selectNode(null)}
            className="px-2.5 py-1.5 rounded-md border border-dashed border-border text-xs font-mono text-muted-foreground hover:text-foreground"
          >
            Clear Selection
          </button>
        </div>
      </div>

      {/* Live Inspector Stage */}
      <div className="p-4 bg-black border border-subtle-border rounded-md flex justify-center">
        <div className="w-full max-w-md">
          <NodeInspector />
        </div>
      </div>

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Node Inspector Implementation
        </div>
        <CodeBlock
          code={`import { NodeInspector } from "@nxtqr/web/features/visualizers";

// Desktop sidepane or mobile Sheet
<aside className="w-80 border-l border-border bg-surface p-4">
  <NodeInspector />
</aside>`}
          language="tsx"
          filename="inspector-usage.tsx"
        />
      </div>
    </div>
  );
}
