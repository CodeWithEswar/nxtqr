"use client";

import * as React from "react";
import { ConnectedGraphWorkspace } from "../../../visualizers/shared/workspace/connected-graph-workspace";
import { Badge } from "@nxtqr/ui";

export function ConnectedWorkspacePlayground() {
  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-4">
        <div>
          <h3 className="text-sm font-semibold font-sans text-foreground flex items-center gap-2">
            Integrated Graph Visualizer Studio
            <Badge variant="outline" className="border-accent text-accent font-mono text-[10px] uppercase">
              Connected Architecture
            </Badge>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Complete synchronized workspace integrating Canvas, Nodes, Edges, Inspector, Simulation Controls, and Execution Trace Viewer.
          </p>
        </div>
      </div>

      <ConnectedGraphWorkspace height="620px" />
    </div>
  );
}

