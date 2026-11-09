"use client";

import * as React from "react";
import { standardNodeDefinitions } from "@nxtqr/node-registry";
import { useGraphEditorStore } from "@nxtqr/state";
import { Badge } from "@nxtqr/ui";
import { PlusIcon } from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export interface NodePaletteProps {
  className?: string;
  columns?: 1 | 2;
}

export function NodePalette({ className, columns = 1 }: NodePaletteProps) {
  const addNode = useGraphEditorStore((state) => state.addNode);
  const nodes = useGraphEditorStore((state) => state.nodes);

  const handleAddNode = (def: (typeof standardNodeDefinitions)[number]) => {
    const count = nodes.filter((n) => n.type === def.type).length + 1;
    const newNodeId = `node_${def.type}_${Date.now().toString(36)}`;
    
    // Position node with small staggered offset
    const lastNode = nodes[nodes.length - 1];
    const newX = lastNode ? lastNode.position.x + 40 : 200;
    const newY = lastNode ? lastNode.position.y + 40 : 150;

    addNode({
      id: newNodeId,
      type: def.type,
      position: { x: newX, y: newY },
      status: "idle",
      label: `${def.label} ${count}`,
      description: def.description,
      data: { ...def.defaultData },
      ports: [...def.ports],
    });
  };

  return (
    <div
      className={cn(
        "rounded-md border border-subtle-border bg-surface p-3 shadow-level-1 space-y-3",
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-subtle-border pb-2">
        <span className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground">
          Node Palette
        </span>
        <Badge variant="outline" className="text-[10px] font-mono border-subtle-border">
          {standardNodeDefinitions.length} Types
        </Badge>
      </div>

      <div className={cn("grid gap-1.5", columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1")}>
        {standardNodeDefinitions.map((def) => (
          <button
            key={def.type}
            onClick={() => handleAddNode(def)}
            className="p-2 rounded-md border border-subtle-border bg-elevated-surface hover:border-border-hover hover:bg-secondary-surface transition-all text-left flex items-center justify-between group"
            title={`Add ${def.label} to canvas`}
          >
            <div className="min-w-0 flex-1 pr-2">
              <div className="text-xs font-semibold font-sans text-foreground truncate group-hover:text-foreground transition-colors">
                {def.label}
              </div>
              <div className="text-[10px] font-mono text-muted-foreground truncate">
                {def.category}
              </div>
            </div>

            <div className="w-5 h-5 rounded border border-subtle-border bg-surface flex items-center justify-center shrink-0 text-muted-foreground group-hover:text-foreground group-hover:border-border-hover transition-colors">
              <PlusIcon className="h-3 w-3" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
