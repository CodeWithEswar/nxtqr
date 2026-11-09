"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  CpuIcon,
  DatabaseIcon,
  ActivityIcon,
  LayersIcon,
  SearchIcon,
  GridIcon,
  CheckCircleIcon,
  SlidersIcon,
} from "@nxtqr/icons";
import { nodeRegistry } from "@nxtqr/node-registry";
import type { BaseNode, PortDefinition } from "../schemas/graph.schema";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  input: ActivityIcon,
  process: CpuIcon,
  output: CheckCircleIcon,
  group: GridIcon,
  decision: SlidersIcon,
  service: LayersIcon,
  database: DatabaseIcon,
  queue: SearchIcon,
};

export type GraphNodeData = {
  label?: string;
  description?: string;
  nodeType?: string;
  status?: BaseNode["status"];
  ports?: PortDefinition[];
  visualizerType?: string;
  [key: string]: unknown;
};

export const GraphNode = React.memo(function GraphNode({
  id,
  data,
  selected,
}: NodeProps) {
  const nodeData = data as GraphNodeData;
  const nodeType = nodeData.nodeType || "process";
  const visualizerType = (nodeData.visualizerType as any) || "generic";

  const nodeDef = React.useMemo(() => {
    return nodeRegistry.get(visualizerType, nodeType);
  }, [visualizerType, nodeType]);

  const IconComponent = ICON_MAP[nodeType] || CpuIcon;
  const label = nodeData.label || nodeDef?.label || "Node";
  const description = nodeData.description || nodeDef?.description || "";

  // Merge registered ports with node instance ports
  const ports = React.useMemo(() => {
    if (nodeData.ports && nodeData.ports.length > 0) {
      return nodeData.ports;
    }
    return nodeDef?.ports || [
      { id: "in", name: "In", type: "input", dataType: "Any" },
      { id: "out", name: "Out", type: "output", dataType: "Any" },
    ];
  }, [nodeData.ports, nodeDef]);

  const inputPorts = ports.filter((p) => p.type === "input" || p.type === "bidirectional");
  const outputPorts = ports.filter((p) => p.type === "output" || p.type === "bidirectional");

  // Pure Black Monochrome strict appearance:
  // Base: Surface 02 (#0D0D0D), Border Default (#262626)
  // Selected: Surface 04 (#1A1A1A), Border Strong (#404040), Shadow Level 3, bold foreground text
  return (
    <div
      data-node-id={id}
      className={`group relative min-w-[190px] max-w-[260px] rounded-md border transition-all duration-150 select-none ${
        selected
          ? "bg-surface-04 border-border-strong shadow-level-3 ring-1 ring-border-strong"
          : "bg-surface-02 border-border-default hover:border-border-hover hover:bg-surface-03 shadow-level-1"
      }`}
    >
      {/* Input Ports (Top / Left) */}
      <div className="absolute -top-1.5 left-0 right-0 flex justify-around pointer-events-auto">
        {inputPorts.map((port, index) => {
          const total = inputPorts.length;
          const leftPercent = total === 1 ? 50 : ((index + 1) / (total + 1)) * 100;
          return (
            <Handle
              key={port.id}
              id={port.id}
              type="target"
              position={Position.Top}
              style={{ left: `${leftPercent}%` }}
              className="!w-2.5 !h-2.5 !rounded-full !bg-surface-01 !border-2 !border-border-strong hover:!border-foreground hover:!scale-125 transition-all duration-150"
              title={`${port.name} (${port.dataType || "Any"})`}
            />
          );
        })}
      </div>

      {/* Node Header */}
      <div className="p-2.5 flex items-start gap-2.5 border-b border-border-subtle/60">
        <div
          className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 border transition-colors ${
            selected
              ? "bg-surface-03 border-border-strong text-foreground"
              : "bg-surface-01 border-border-default text-text-muted group-hover:text-foreground"
          }`}
        >
          <IconComponent className="h-3.5 w-3.5" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-1">
            <span className="font-mono text-[10px] text-text-muted uppercase tracking-wider font-semibold truncate">
              {nodeDef?.category || nodeType}
            </span>
            <span className="font-mono text-[9px] text-text-disabled shrink-0">
              #{id.slice(-4)}
            </span>
          </div>
          <h4
            className={`font-sans text-xs leading-tight truncate ${
              selected ? "text-foreground font-semibold" : "text-text-secondary group-hover:text-foreground font-medium"
            }`}
          >
            {label}
          </h4>
        </div>
      </div>

      {/* Node Body / Metadata */}
      <div className="px-2.5 py-1.5 flex items-center justify-between font-mono text-[10px] text-text-muted">
        <span className="truncate max-w-[130px]">
          {description ? description.slice(0, 24) : nodeType}
        </span>
        <span className="text-[9px] px-1 py-0.5 rounded bg-surface-01 border border-border-subtle text-text-disabled">
          {inputPorts.length}in · {outputPorts.length}out
        </span>
      </div>

      {/* Output Ports (Bottom / Right) */}
      <div className="absolute -bottom-1.5 left-0 right-0 flex justify-around pointer-events-auto">
        {outputPorts.map((port, index) => {
          const total = outputPorts.length;
          const leftPercent = total === 1 ? 50 : ((index + 1) / (total + 1)) * 100;
          return (
            <Handle
              key={port.id}
              id={port.id}
              type="source"
              position={Position.Bottom}
              style={{ left: `${leftPercent}%` }}
              className="!w-2.5 !h-2.5 !rounded-full !bg-surface-01 !border-2 !border-border-strong hover:!border-foreground hover:!scale-125 transition-all duration-150"
              title={`${port.name} (${port.dataType || "Any"})`}
            />
          );
        })}
      </div>
    </div>
  );
});

export const nodeTypes = {
  input: GraphNode,
  process: GraphNode,
  output: GraphNode,
  group: GraphNode,
  decision: GraphNode,
  service: GraphNode,
  database: GraphNode,
  queue: GraphNode,
  generic: GraphNode,
};

