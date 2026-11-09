"use client";

import * as React from "react";
import { useGraphEditorStore } from "../store/graph-editor-store";
import {
  SlidersIcon,
  CopyIcon,
  TrashIcon,
  CloseIcon,
} from "@nxtqr/icons";
import { Button, Badge } from "@nxtqr/ui";

export interface NodeInspectorProps {
  className?: string;
  onClose?: () => void;
}

export function NodeInspector({ className, onClose }: NodeInspectorProps) {
  const selectedNodeIds = useGraphEditorStore((s) => s.selectedNodeIds);
  const nodes = useGraphEditorStore((s) => s.nodes);
  const updateNodeConfig = useGraphEditorStore((s) => s.updateNodeConfig);
  const deleteSelected = useGraphEditorStore((s) => s.deleteSelected);
  const duplicateSelected = useGraphEditorStore((s) => s.duplicateSelected);

  // Single selection target
  const selectedNode = React.useMemo(() => {
    if (selectedNodeIds.length === 1) {
      return nodes.find((n) => n.id === selectedNodeIds[0]) || null;
    }
    return null;
  }, [selectedNodeIds, nodes]);

  // Editable form state for single node
  const [label, setLabel] = React.useState("");
  const [description, setDescription] = React.useState("");

  React.useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.label || "");
      setDescription(selectedNode.description || "");
    }
  }, [selectedNode]);

  const handleLabelChange = (val: string) => {
    setLabel(val);
    if (selectedNode) {
      updateNodeConfig(selectedNode.id, {
        label: val,
        data: selectedNode.data,
      });
    }
  };

  const handleDescriptionChange = (val: string) => {
    setDescription(val);
    if (selectedNode) {
      updateNodeConfig(selectedNode.id, {
        description: val,
        data: selectedNode.data,
      });
    }
  };

  const handleDataFieldChange = (key: string, val: unknown) => {
    if (!selectedNode) return;
    updateNodeConfig(selectedNode.id, {
      data: {
        ...selectedNode.data,
        [key]: val,
      },
    });
  };

  // Case 1: Empty Selection
  if (selectedNodeIds.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center h-full p-6 text-center select-none bg-surface-01 ${className || ""}`}>
        <div className="h-10 w-10 rounded-md bg-surface-02 border border-border-default flex items-center justify-center mb-3 text-text-muted shadow-level-1">
          <SlidersIcon className="h-5 w-5" />
        </div>
        <h4 className="font-sans text-xs font-semibold text-foreground mb-1">
          No Selection
        </h4>
        <p className="font-sans text-[11px] text-text-muted max-w-[200px] leading-relaxed">
          Select a node or edge on the canvas to inspect telemetry, ports, and configuration.
        </p>
      </div>
    );
  }

  // Case 2: Multi-Selection
  if (selectedNodeIds.length > 1) {
    return (
      <div className={`flex flex-col h-full bg-surface-01 text-foreground select-none p-4 space-y-4 ${className || ""}`}>
        <div className="flex items-center justify-between pb-3 border-b border-border-subtle">
          <div className="space-y-0.5">
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider">
              Bulk Selection
            </span>
            <h3 className="font-sans text-sm font-bold text-foreground">
              {selectedNodeIds.length} Nodes Selected
            </h3>
          </div>
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className="font-mono text-[9px] text-text-muted rounded-md border-border-subtle">
              Batch Mode
            </Badge>
            {onClose && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="h-6 w-6 rounded-md text-text-muted hover:text-foreground"
                title="Close Inspector"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>

        <div className="p-3 rounded-md bg-surface-02 border border-border-default text-xs font-mono space-y-2">
          <span className="text-[10px] text-text-muted uppercase tracking-wider block">
            Selected IDs:
          </span>
          <div className="flex flex-wrap gap-1">
            {selectedNodeIds.map((id) => (
              <span key={id} className="px-1.5 py-0.5 rounded bg-surface-03 border border-border-subtle text-[10px] text-text-secondary">
                #{id.slice(-6)}
              </span>
            ))}
          </div>
        </div>

        <div className="pt-2 space-y-2">
          <Button
            variant="outline"
            size="sm"
            onClick={duplicateSelected}
            className="w-full h-8 text-xs font-mono gap-1.5 rounded-md border-border-default hover:bg-surface-03"
          >
            <CopyIcon className="h-3.5 w-3.5" />
            <span>Duplicate Selected ({selectedNodeIds.length})</span>
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={deleteSelected}
            className="w-full h-8 text-xs font-mono gap-1.5 rounded-md"
          >
            <TrashIcon className="h-3.5 w-3.5" />
            <span>Delete Selected ({selectedNodeIds.length})</span>
          </Button>
        </div>
      </div>
    );
  }

  // Case 3: Single Node Inspection
  if (!selectedNode) return null;

  const ports = selectedNode.ports || [];
  const dataEntries = Object.entries(selectedNode.data || {});

  return (
    <div className={`flex flex-col h-full bg-surface-01 text-foreground select-none overflow-hidden ${className || ""}`}>
      {/* Inspector Header */}
      <div className="p-3.5 border-b border-border-subtle bg-surface-02 space-y-2 shrink-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted uppercase tracking-wider">
              <span>{selectedNode.type}</span>
              <span className="text-border-subtle">·</span>
              <span className="truncate">ID: {selectedNode.id}</span>
            </div>
            <h3 className="font-sans text-sm font-bold text-foreground truncate mt-0.5">
              {selectedNode.label || selectedNode.type}
            </h3>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Badge variant="outline" className="font-mono text-[9px] text-text-muted rounded-md border-border-default uppercase">
              {selectedNode.status || "idle"}
            </Badge>
            {onClose && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                className="h-6 w-6 rounded-md text-text-muted hover:text-foreground"
                title="Close Inspector"
              >
                <CloseIcon className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Inspector Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 precision-rail font-mono text-xs">
        {/* Label Field */}
        <div className="space-y-1">
          <label className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">
            Display Label
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => handleLabelChange(e.target.value)}
            className="w-full h-8 px-2.5 bg-surface-02 border border-border-default hover:border-border-hover focus:border-border-strong rounded-md text-xs text-foreground outline-none transition-colors"
          />
        </div>

        {/* Description Field */}
        <div className="space-y-1">
          <label className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">
            Description
          </label>
          <input
            type="text"
            value={description}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            placeholder="Node purpose or summary..."
            className="w-full h-8 px-2.5 bg-surface-02 border border-border-default hover:border-border-hover focus:border-border-strong rounded-md text-xs text-foreground placeholder:text-text-disabled outline-none transition-colors"
          />
        </div>

        {/* Port Definitions */}
        <div className="space-y-1.5 pt-1">
          <label className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">
            Connection Ports ({ports.length})
          </label>
          <div className="space-y-1">
            {ports.length === 0 ? (
              <div className="p-2 text-center text-text-disabled text-[10px] bg-surface-02 border border-border-subtle rounded-md">
                No external connection ports
              </div>
            ) : (
              ports.map((port) => (
                <div
                  key={port.id}
                  className="flex items-center justify-between p-2 rounded-md bg-surface-02 border border-border-default text-[10px]"
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        port.type === "input" ? "bg-amber-400" : "bg-emerald-400"
                      }`}
                    />
                    <span className="font-semibold text-text-secondary">{port.name}</span>
                    <span className="text-text-muted uppercase">({port.type})</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-surface-03 border border-border-subtle text-text-muted text-[9px]">
                    {port.dataType || "Any"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Data / Configuration Parameters */}
        {dataEntries.length > 0 && (
          <div className="space-y-1.5 pt-1">
            <label className="text-[10px] text-text-muted uppercase tracking-wider block font-semibold">
              Configuration Parameters
            </label>
            <div className="space-y-1.5">
              {dataEntries.map(([key, value]) => {
                const isBool = typeof value === "boolean";
                const isNum = typeof value === "number";

                return (
                  <div
                    key={key}
                    className="p-2 rounded-md bg-surface-02 border border-border-default space-y-1"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-text-muted uppercase font-semibold">{key}</span>
                      <span className="text-text-disabled text-[9px]">{typeof value}</span>
                    </div>

                    {isBool ? (
                      <button
                        type="button"
                        onClick={() => handleDataFieldChange(key, !value)}
                        className={`px-2 py-1 rounded text-[10px] border transition-colors ${
                          value
                            ? "bg-surface-04 border-border-strong text-foreground font-bold"
                            : "bg-surface-01 border-border-subtle text-text-muted"
                        }`}
                      >
                        {String(value)}
                      </button>
                    ) : (
                      <input
                        type={isNum ? "number" : "text"}
                        value={String(value ?? "")}
                        onChange={(e) =>
                          handleDataFieldChange(
                            key,
                            isNum ? Number(e.target.value) : e.target.value,
                          )
                        }
                        className="w-full h-7 px-2 bg-surface-01 border border-border-subtle hover:border-border-hover focus:border-border-strong rounded text-[11px] text-foreground outline-none transition-colors"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Inspector Actions Footer */}
      <div className="p-3 border-t border-border-subtle bg-surface-02 flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={duplicateSelected}
          className="flex-1 h-8 text-xs font-mono gap-1.5 rounded-md border-border-default bg-surface-01 hover:bg-surface-03 shadow-level-1"
        >
          <CopyIcon className="h-3.5 w-3.5" />
          <span>Duplicate</span>
        </Button>

        <Button
          variant="destructive"
          size="sm"
          onClick={deleteSelected}
          className="flex-1 h-8 text-xs font-mono gap-1.5 rounded-md shadow-level-1"
        >
          <TrashIcon className="h-3.5 w-3.5" />
          <span>Delete</span>
        </Button>
      </div>
    </div>
  );
}

