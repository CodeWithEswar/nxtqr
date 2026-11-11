"use client";

import * as React from "react";
import { cn } from "@nxtqr/utils";
import { Button } from "@nxtqr/ui";
import { CloseIcon, SlidersIcon, PlayIcon } from "@nxtqr/icons";
import { useExecutionStore } from "../store/execution-store";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import type { HttpMethod } from "@nxtqr/architecture-execution";

export interface ExecutionConfigDialogProps {
  onClose?: () => void;
}

const METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE"];

export function ExecutionConfigDialog({ onClose }: ExecutionConfigDialogProps) {
  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);

  const configuration = useExecutionStore((s) => s.configuration);
  const updateConfiguration = useExecutionStore((s) => s.updateConfiguration);
  const setEntryNodeId = useExecutionStore((s) => s.setEntryNodeId);
  const setSelectedBranch = useExecutionStore((s) => s.setSelectedBranch);
  const toggleConfigDialog = useExecutionStore((s) => s.toggleConfigDialog);
  const runExecution = useExecutionStore((s) => s.runExecution);

  const [activeMethod, setActiveMethod] = React.useState<HttpMethod>(configuration.request.method);
  const [activePath, setActivePath] = React.useState<string>(configuration.request.path);
  const [bodyText, setBodyText] = React.useState<string>(
    configuration.request.body ? JSON.stringify(configuration.request.body, null, 2) : ""
  );

  // Identify components with multiple outgoing connections
  const branchingNodes = React.useMemo(() => {
    const map = new Map<string, typeof edges>();
    for (const edge of edges) {
      if (!map.has(edge.source)) map.set(edge.source, []);
      map.get(edge.source)!.push(edge);
    }
    return nodes
      .filter((n) => (map.get(n.id)?.length || 0) > 1)
      .map((n) => ({
        node: n,
        outEdges: map.get(n.id)!,
      }));
  }, [nodes, edges]);

  const handleSaveAndRun = () => {
    let parsedBody: unknown = undefined;
    if (bodyText.trim()) {
      try {
        parsedBody = JSON.parse(bodyText);
      } catch {
        parsedBody = bodyText;
      }
    }

    updateConfiguration({
      request: {
        ...configuration.request,
        method: activeMethod,
        path: activePath,
        body: parsedBody,
      },
    });

    toggleConfigDialog(false);
    runExecution(nodes, edges);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="execution-config-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-none p-4 select-none"
    >
      <div className="w-full max-w-lg bg-surface-02 border border-border-default rounded-md shadow-level-2 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-surface-01 border-b border-border-subtle shrink-0">
          <div className="flex items-center gap-2">
            <SlidersIcon className="w-4 h-4 text-text-secondary" />
            <h3 id="execution-config-title" className="text-xs font-mono font-semibold text-foreground uppercase tracking-wider">
              Architecture Execution Configuration
            </h3>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleConfigDialog(false))}
            className="h-6 w-6 p-0 text-text-muted hover:text-foreground rounded"
            title="Close"
          >
            <CloseIcon className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Form Body */}
        <div className="p-4 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* 1. Starting Component */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-text-muted font-semibold uppercase tracking-wider block">
              Starting Component (Entry Point)
            </label>
            <select
              value={configuration.entryNodeId}
              onChange={(e) => setEntryNodeId(e.target.value)}
              className="w-full h-8 px-2.5 rounded-md bg-surface-01 border border-border-default text-xs font-mono text-foreground focus:outline-none focus:border-border-strong"
            >
              {nodes.map((node) => (
                <option key={node.id} value={node.id}>
                  {node.label || node.id} ({String((node.data as any)?.componentType || node.type || "service")})
                </option>
              ))}
            </select>
          </div>

          {/* 2. Request Details */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-text-muted font-semibold uppercase tracking-wider block">
              Simulated Request
            </label>
            <div className="flex items-center gap-2">
              {/* Method select */}
              <div className="flex items-center rounded-md border border-border-default bg-surface-01 p-0.5 shrink-0">
                {METHODS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setActiveMethod(m)}
                    className={cn(
                      "px-2 py-1 rounded text-[10px] font-mono font-semibold transition-colors",
                      activeMethod === m
                        ? "bg-surface-04 text-foreground shadow-level-3 border border-border-strong"
                        : "text-text-muted hover:text-foreground"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>

              {/* Path input */}
              <input
                type="text"
                value={activePath}
                onChange={(e) => setActivePath(e.target.value)}
                placeholder="/api/v1/resource"
                className="flex-1 h-8 px-2.5 rounded-md bg-surface-01 border border-border-default text-xs font-mono text-foreground focus:outline-none focus:border-border-strong"
              />
            </div>

            {/* Body Payload (POST/PUT/PATCH) */}
            {(activeMethod === "POST" || activeMethod === "PUT" || activeMethod === "PATCH") && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] font-mono text-text-muted block">JSON Request Body</span>
                <textarea
                  rows={3}
                  value={bodyText}
                  onChange={(e) => setBodyText(e.target.value)}
                  placeholder='{"key": "value"}'
                  className="w-full p-2 rounded-md bg-surface-01 border border-border-default text-xs font-mono text-foreground focus:outline-none focus:border-border-strong resize-y"
                />
              </div>
            )}
          </div>

          {/* 3. Branch Routing Controls if branching exists */}
          {branchingNodes.length > 0 && (
            <div className="space-y-2 border-t border-border-subtle pt-3">
              <label className="text-[11px] font-mono text-text-muted font-semibold uppercase tracking-wider block">
                Branch Routing Decisions
              </label>
              <div className="space-y-2">
                {branchingNodes.map(({ node, outEdges }) => (
                  <div key={node.id} className="p-2.5 rounded bg-surface-01 border border-border-subtle space-y-1.5">
                    <span className="text-xs font-mono font-semibold text-foreground block">
                      {node.label || node.id}
                    </span>
                    <select
                      value={configuration.routing.selectedBranches?.[node.id] || outEdges[0]?.id || ""}
                      onChange={(e) => setSelectedBranch(node.id, e.target.value)}
                      className="w-full h-7 px-2 rounded bg-surface-02 border border-border-default text-[11px] font-mono text-foreground focus:outline-none"
                    >
                      {outEdges.map((e) => {
                        const targetNode = nodes.find((n) => n.id === e.target);
                        return (
                          <option key={e.id} value={e.id}>
                            Route along "{e.label || e.id}" → {targetNode?.label || e.target}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Safety Limits */}
          <div className="p-2.5 rounded bg-surface-01 border border-border-subtle grid grid-cols-2 gap-3 text-xs font-mono">
            <div>
              <span className="text-text-muted block text-[10px] uppercase">Max Hops</span>
              <span className="text-foreground font-semibold">{configuration.limits.maxHops} hops</span>
            </div>
            <div>
              <span className="text-text-muted block text-[10px] uppercase">Max Events</span>
              <span className="text-foreground font-semibold">{configuration.limits.maxEvents} events</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-2.5 bg-surface-01 border-t border-border-subtle shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose || (() => toggleConfigDialog(false))}
            className="h-7 text-xs font-mono text-text-muted hover:text-foreground"
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSaveAndRun}
            className="h-7 px-3 text-xs font-mono font-medium rounded-md gap-1.5 bg-foreground text-background hover:bg-neutral-200"
          >
            <PlayIcon className="w-3.5 h-3.5" />
            <span>Apply & Run</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
