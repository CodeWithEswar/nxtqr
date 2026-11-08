"use client";

import * as React from "react";
import { ReactFlow, ReactFlowProvider } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { standardNodeDefinitions } from "@nxtqr/node-registry";
import { nodeTypes } from "../../../visualizers/shared/nodes/engineering-node";
import type { BaseNode } from "@nxtqr/graph-schema";
import { Badge } from "@nxtqr/ui";
import { CodeBlock } from "../../components/code-block";
import { cn } from "@nxtqr/utils";

export function NodesPlayground() {
  const [selectedType, setSelectedType] = React.useState<string>("process");
  const [selectedStatus, setSelectedStatus] = React.useState<BaseNode["status"]>("idle");
  const [isSelected, setIsSelected] = React.useState<boolean>(true);

  const def = standardNodeDefinitions.find((d) => d.type === selectedType) ?? standardNodeDefinitions[1];

  const statuses: BaseNode["status"][] = ["idle", "executing", "completed", "failed"];

  return (
    <div className="my-6 rounded-md border border-border bg-surface overflow-hidden shadow-level-1 space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-subtle-border pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold font-sans text-foreground">
              Graph Nodes Architecture Laboratory
            </h3>
            <Badge
              variant="outline"
              className="border-accent/40 bg-accent/10 text-accent font-mono text-[10px] uppercase tracking-wider"
            >
              Discriminated Union Types
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Evaluate standardized node anatomy: typed input/output ports, physical micro-bevel elevation, and live execution states.
          </p>
        </div>

        <button
          onClick={() => setIsSelected(!isSelected)}
          className={cn(
            "px-2.5 py-1 text-xs font-mono rounded border transition-colors self-start sm:self-auto",
            isSelected ? "border-accent bg-accent text-accent-foreground font-semibold" : "border-border text-muted-foreground"
          )}
        >
          Selected: {isSelected ? "TRUE" : "FALSE"}
        </button>
      </div>

      {/* Type Selector */}
      <div className="space-y-2">
        <label className="text-xs font-mono text-muted-foreground uppercase tracking-wider block">
          Node Type Architecture
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-1.5">
          {standardNodeDefinitions.map((d) => (
            <button
              key={d.type}
              onClick={() => setSelectedType(d.type)}
              className={cn(
                "p-2 rounded-md border text-center transition-all",
                selectedType === d.type
                  ? "border-accent bg-accent/10 ring-1 ring-accent text-foreground font-semibold"
                  : "border-border bg-elevated-surface text-muted-foreground hover:border-muted-border hover:text-foreground"
              )}
            >
              <div className="text-xs truncate">{d.label.split(" ")[0]}</div>
              <div className="text-[9px] font-mono text-muted-foreground uppercase">{d.type}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Status Selector */}
      <div className="flex items-center gap-2 p-2 bg-secondary-surface border border-border rounded-md text-xs font-mono">
        <span className="text-muted-foreground">Execution State:</span>
        {statuses.map((st) => (
          <button
            key={st}
            onClick={() => setSelectedStatus(st)}
            className={cn(
              "px-2 py-0.5 rounded uppercase transition-colors text-[11px]",
              selectedStatus === st
                ? "bg-accent text-accent-foreground font-bold shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Live Node Render Stage */}
      <div className="p-4 bg-black border border-subtle-border rounded-md flex items-center justify-center min-h-[220px]">
        <div className="w-full h-[200px]">
          <ReactFlowProvider>
            <ReactFlow
              nodes={[
                {
                  id: `node_${def.type}_demo`,
                  type: def.type,
                  position: { x: 0, y: 0 },
                  selected: isSelected,
                  data: {
                    label: def.label,
                    description: def.description,
                    nodeType: def.type,
                    status: selectedStatus,
                    ports: def.ports,
                  },
                },
              ]}
              nodeTypes={nodeTypes}
              fitView
              className="bg-black"
              proOptions={{ hideAttribution: true }}
              nodesDraggable={false}
              nodesConnectable={false}
              zoomOnScroll={false}
              panOnDrag={false}
            />
          </ReactFlowProvider>
        </div>
      </div>

      {/* Code Snippet */}
      <div className="space-y-2 border-t border-subtle-border pt-4">
        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
          Node Contract Reference
        </div>
        <CodeBlock
          code={`import type { BaseNode } from "@nxtqr/graph-schema";

export const computeWorkerNode: BaseNode = {
  id: "node_worker_01",
  type: "${def.type}",
  position: { x: 200, y: 150 },
  status: "${selectedStatus}",
  label: "${def.label}",
  data: ${JSON.stringify(def.defaultData, null, 2)},
};`}
          language="tsx"
          filename="node-definition.ts"
        />
      </div>
    </div>
  );
}
