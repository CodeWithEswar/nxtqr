"use client";

import * as React from "react";
import { useGraphEditorStore } from "@nxtqr/state";
import { standardNodeDefinitions } from "@nxtqr/node-registry";
import { Badge } from "@nxtqr/ui";
import {
  CloseIcon,
  TrashIcon,
  LayersIcon,
} from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export function NodeInspector({ className }: { className?: string }) {
  const selectedNodeId = useGraphEditorStore((state) => state.selectedNodeId);
  const nodes = useGraphEditorStore((state) => state.nodes);
  const edges = useGraphEditorStore((state) => state.edges);
  const updateNodeData = useGraphEditorStore((state) => state.updateNodeData);
  const removeNode = useGraphEditorStore((state) => state.removeNode);
  const selectNode = useGraphEditorStore((state) => state.selectNode);

  const [activeTab, setActiveTab] = React.useState<"general" | "config" | "connections">("general");

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const incomingEdges = edges.filter((e) => e.target === selectedNodeId);
  const outgoingEdges = edges.filter((e) => e.source === selectedNodeId);

  if (!selectedNode) {
    return (
      <div
        className={cn(
          "rounded-md border border-border bg-surface p-6 shadow-level-1 flex flex-col items-center justify-center text-center min-h-[320px]",
          className
        )}
      >
        <div className="w-10 h-10 rounded-md border border-border bg-elevated-surface flex items-center justify-center text-muted-foreground mb-3">
          <LayersIcon className="h-5 w-5" />
        </div>
        <h4 className="text-xs font-semibold font-sans text-foreground mb-1">
          No Node Selected
        </h4>
        <p className="text-[11px] text-muted-foreground max-w-[220px]">
          Select any node on the graph canvas to inspect parameters, connection ports, and execution state.
        </p>
      </div>
    );
  }

  const def = standardNodeDefinitions.find((d) => d.type === selectedNode.type);

  return (
    <div
      className={cn(
        "rounded-md border border-border bg-surface p-4 shadow-level-1 space-y-4 flex flex-col",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-subtle-border pb-3">
        <div className="min-w-0 pr-2">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-xs font-bold font-sans text-foreground truncate">
              {selectedNode.label ?? selectedNode.id}
            </span>
            <Badge variant="outline" className="text-[9px] font-mono uppercase px-1.5 py-0 border-subtle-border text-foreground bg-surface-03">
              {selectedNode.type}
            </Badge>
          </div>
          <div className="text-[10px] font-mono text-muted-foreground truncate">
            ID: {selectedNode.id}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => removeNode(selectedNode.id)}
            className="p-1.5 rounded border border-border text-muted-foreground hover:text-red-400 hover:border-red-400/50 transition-colors"
            title="Delete Node"
          >
            <TrashIcon className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => selectNode(null)}
            className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground transition-colors"
            title="Close Inspector"
          >
            <CloseIcon className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-secondary-surface border border-border rounded-md">
        {(["general", "config", "connections"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 text-xs font-mono py-1 rounded transition-colors uppercase text-center",
              activeTab === tab
                ? "bg-surface text-foreground font-semibold border border-subtle-border shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab 1: General */}
      {activeTab === "general" && (
        <div className="space-y-3 flex-1 text-xs font-sans">
          <div className="space-y-1">
            <label className="text-[11px] font-mono text-muted-foreground uppercase">Label</label>
            <input
              type="text"
              value={selectedNode.label ?? ""}
              onChange={(e) => updateNodeData(selectedNode.id, { label: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-md border border-border bg-black text-foreground font-sans text-xs focus:outline-none focus:border-foreground"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-mono text-muted-foreground uppercase">Description</label>
            <textarea
              rows={2}
              value={selectedNode.description ?? ""}
              onChange={(e) => updateNodeData(selectedNode.id, { description: e.target.value })}
              className="w-full px-2.5 py-1.5 rounded-md border border-border bg-black text-foreground font-sans text-xs focus:outline-none focus:border-foreground resize-none"
            />
          </div>

          <div className="p-3 bg-secondary-surface border border-border rounded-md space-y-1.5 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Category:</span>
              <span className="text-foreground">{def?.category ?? "General"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-foreground uppercase font-bold">{selectedNode.status ?? "idle"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Position:</span>
              <span className="text-foreground">X:{selectedNode.position.x} Y:{selectedNode.position.y}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Dynamic Configuration */}
      {activeTab === "config" && (
        <div className="space-y-3 flex-1 text-xs">
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {selectedNode.type.toUpperCase()} CONFIGURATION PARAMETERS
          </div>

          {Object.entries(selectedNode.data).map(([key, val]) => {
            if (key === "label" || key === "description" || key === "nodeType" || key === "status" || key === "ports") {
              return null;
            }

            const isBoolean = typeof val === "boolean";
            const isNumber = typeof val === "number";

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-mono text-muted-foreground">{key}</label>
                  {isBoolean ? (
                    <button
                      type="button"
                      onClick={() => updateNodeData(selectedNode.id, { [key]: !val })}
                      className={cn(
                        "w-9 h-4 rounded-full p-0.5 transition-colors border",
                        val ? "bg-white border-white" : "bg-black border-border"
                      )}
                    >
                      <div
                        className={cn(
                          "w-3 h-3 rounded-full transition-transform",
                          val ? "bg-black translate-x-5" : "bg-muted-foreground translate-x-0"
                        )}
                      />
                    </button>
                  ) : null}
                </div>

                {!isBoolean && (
                  <input
                    type={isNumber ? "number" : "text"}
                    value={String(val)}
                    onChange={(e) => {
                      const nextVal = isNumber ? Number(e.target.value) : e.target.value;
                      updateNodeData(selectedNode.id, { [key]: nextVal });
                    }}
                    className="w-full px-2.5 py-1.5 rounded-md border border-border bg-black text-foreground font-mono text-xs focus:outline-none focus:border-foreground"
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 3: Connections */}
      {activeTab === "connections" && (
        <div className="space-y-3 flex-1 text-xs font-mono">
          <div>
            <div className="text-[10px] text-muted-foreground uppercase mb-1">
              Incoming ({incomingEdges.length})
            </div>
            {incomingEdges.length === 0 ? (
              <div className="text-[11px] text-muted-foreground italic p-2 bg-black/40 rounded border border-border/50">
                No incoming connections
              </div>
            ) : (
              <div className="space-y-1">
                {incomingEdges.map((e) => (
                  <div key={e.id} className="p-1.5 rounded border border-border bg-black flex items-center justify-between">
                    <span className="text-foreground">{e.source}</span>
                    <span className="text-muted-foreground text-[10px]">→ {e.targetHandle ?? "in"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="text-[10px] text-muted-foreground uppercase mb-1">
              Outgoing ({outgoingEdges.length})
            </div>
            {outgoingEdges.length === 0 ? (
              <div className="text-[11px] text-muted-foreground italic p-2 bg-black/40 rounded border border-border/50">
                No outgoing connections
              </div>
            ) : (
              <div className="space-y-1">
                {outgoingEdges.map((e) => (
                  <div key={e.id} className="p-1.5 rounded border border-border bg-black flex items-center justify-between">
                    <span className="text-muted-foreground text-[10px]">{e.sourceHandle ?? "out"} →</span>
                    <span className="text-foreground">{e.target}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
