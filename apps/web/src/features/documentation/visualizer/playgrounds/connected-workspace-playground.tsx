"use client";

import * as React from "react";
import { ConnectedGraphWorkspace } from "../../../visualizers/shared/workspace/connected-graph-workspace";
import { Badge } from "@nxtqr/ui";

export function ConnectedWorkspacePlayground() {
  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold font-sans text-foreground">
              Integrated Graph Visualizer Studio
            </h3>
            <Badge
              variant="outline"
              className="border-accent/40 bg-accent/10 text-accent font-mono text-[10px] uppercase tracking-wider"
            >
              Connected Architecture
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Complete synchronized workspace integrating Canvas, Nodes, Edges, Inspector, Simulation Controls, and Execution Trace Viewer.
          </p>
        </div>
      </div>

      <ConnectedGraphWorkspace height="620px" />
    </div>
  );
}

