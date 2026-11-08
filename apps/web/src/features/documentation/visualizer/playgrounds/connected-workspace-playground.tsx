"use client";

import * as React from "react";
import { ConnectedGraphWorkspace } from "../../../visualizers/shared/workspace/connected-graph-workspace";

export function ConnectedWorkspacePlayground() {
  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      <div className="border-b border-subtle-border pb-4 space-y-1">
        <h3 className="text-sm font-semibold font-sans text-foreground">
          Integrated Graph Visualizer Studio
        </h3>
        <p className="text-xs text-muted-foreground">
          Complete synchronized workspace integrating Canvas, Nodes, Edges, Inspector, Simulation Controls, and Execution Trace Viewer.
        </p>
      </div>

      <ConnectedGraphWorkspace height="620px" />
    </div>
  );
}

