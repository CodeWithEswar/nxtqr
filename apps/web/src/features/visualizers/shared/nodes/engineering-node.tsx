"use client";

import * as React from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { BaseNode } from "@nxtqr/graph-schema";
import {
  LayersIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  TerminalIcon,
  FilterIcon,
  MonitorIcon,
  RefreshIcon,
} from "@nxtqr/icons";
import { cn } from "@nxtqr/utils";

export interface EngineeringNodeData extends Record<string, unknown> {
  label?: string;
  description?: string;
  nodeType?: string;
  status?: BaseNode["status"];
  ports?: BaseNode["ports"];
}

const TYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  input: MonitorIcon,
  process: TerminalIcon,
  decision: FilterIcon,
  service: RefreshIcon,
  database: LayersIcon,
  queue: LayersIcon,
  output: CheckCircleIcon,
};

export function EngineeringNode({
  id,
  data,
  selected,
}: NodeProps) {
  const nodeData = data as EngineeringNodeData;
  const nodeType = (nodeData.nodeType as string) ?? "process";
  const status = (nodeData.status as BaseNode["status"]) ?? "idle";
  const label = (nodeData.label as string) ?? id;
  const description = (nodeData.description as string) ?? "";
  const ports = nodeData.ports ?? [
    { id: "in", name: "In", type: "input" as const },
    { id: "out", name: "Out", type: "output" as const },
  ];

  const IconComp = TYPE_ICONS[nodeType] ?? TerminalIcon;

  const inputPorts = ports.filter((p) => p.type === "input" || p.type === "bidirectional");
  const outputPorts = ports.filter((p) => p.type === "output" || p.type === "bidirectional");

  return (
    <div
      className={cn(
        "min-w-[200px] max-w-[260px] rounded-md border p-3 transition-all duration-150 select-none",
        "shadow-level-1",
        selected
          ? "border-border-strong bg-surface-04 ring-1 ring-border-hover shadow-level-2"
          : "border-border bg-elevated-surface hover:border-border-hover",
        status === "executing" && "border-border-strong ring-1 ring-border-hover",
        status === "completed" && "border-emerald-600/70",
        status === "failed" && "border-red-600"
      )}
    >
      {/* Target Handles (Inputs) */}
      {inputPorts.map((port, idx) => (
        <Handle
          key={port.id}
          type="target"
          position={Position.Left}
          id={port.id}
          style={{
            top: inputPorts.length > 1 ? `${((idx + 1) / (inputPorts.length + 1)) * 100}%` : "50%",
            backgroundColor: selected ? "#707070" : "#404040",
            width: "8px",
            height: "8px",
            borderRadius: "2px",
            border: "1px solid #000000",
          }}
          title={`Input: ${port.name}`}
        />
      ))}

      {/* Node Header */}
      <div className="flex items-center justify-between gap-2 border-b border-subtle-border pb-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-5 h-5 rounded bg-surface border border-border flex items-center justify-center shrink-0 text-muted-foreground">
            <IconComp className="h-3 w-3" />
          </div>
          <span className="text-xs font-semibold font-sans text-foreground truncate">
            {label}
          </span>
        </div>

        {/* Status indicator */}
        <div className="shrink-0 flex items-center gap-1 font-mono text-[9px] uppercase">
          {status === "executing" && (
            <span className="inline-flex items-center gap-1 text-accent font-semibold animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-accent" />
              RUN
            </span>
          )}
          {status === "completed" && (
            <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold">
              <CheckCircleIcon className="w-2.5 h-2.5" />
              DONE
            </span>
          )}
          {status === "failed" && (
            <span className="inline-flex items-center gap-1 text-red-400 font-semibold">
              <AlertCircleIcon className="w-2.5 h-2.5" />
              FAIL
            </span>
          )}
          {status === "idle" && (
            <span className="text-muted-foreground">{nodeType}</span>
          )}
        </div>
      </div>

      {/* Description / Telemetry preview */}
      {description ? (
        <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
          {description}
        </p>
      ) : (
        <div className="font-mono text-[10px] text-muted-foreground">
          ID: {id}
        </div>
      )}

      {/* Source Handles (Outputs) */}
      {outputPorts.map((port, idx) => (
        <Handle
          key={port.id}
          type="source"
          position={Position.Right}
          id={port.id}
          style={{
            top: outputPorts.length > 1 ? `${((idx + 1) / (outputPorts.length + 1)) * 100}%` : "50%",
            backgroundColor: selected ? "#707070" : "#404040",
            width: "8px",
            height: "8px",
            borderRadius: "2px",
            border: "1px solid #000000",
          }}
          title={`Output: ${port.name}`}
        />
      ))}
    </div>
  );
}

export const nodeTypes = {
  input: EngineeringNode,
  process: EngineeringNode,
  decision: EngineeringNode,
  service: EngineeringNode,
  database: EngineeringNode,
  queue: EngineeringNode,
  output: EngineeringNode,
};

