"use client";

import * as React from "react";
import type {
  ArchitectureTemplate,
  TemplateNodeConfiguration,
} from "@nxtqr/architecture-execution";
import { MaximizeIcon, MinusIcon, PlusIcon, RefreshIcon } from "@nxtqr/icons";
import { Button } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";

export interface TemplatePreviewProps {
  template: ArchitectureTemplate;
  selectedNodeId?: string;
  highlightedNodeId?: string;
  highlightedEdgeId?: string;
  onSelectNode?: (nodeId: string) => void;
  onSelectEdge?: (edgeId: string) => void;
}

const NODE_W = 168;
const NODE_H = 58;

export function TemplatePreview({
  template,
  selectedNodeId,
  highlightedNodeId,
  highlightedEdgeId,
  onSelectNode,
  onSelectEdge,
}: TemplatePreviewProps) {
  const [zoom, setZoom] = React.useState(0.92);

  const bounds = React.useMemo(() => {
    const nodes = template.topology.nodes;
    if (nodes.length === 0) {
      return { minX: 0, minY: 0, width: 720, height: 320 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const n of nodes) {
      minX = Math.min(minX, n.position.x);
      minY = Math.min(minY, n.position.y);
      maxX = Math.max(maxX, n.position.x + NODE_W);
      maxY = Math.max(maxY, n.position.y + NODE_H);
    }
    const pad = 44;
    return {
      minX: minX - pad,
      minY: minY - pad,
      width: Math.max(640, maxX - minX + pad * 2),
      height: Math.max(240, maxY - minY + pad * 2),
    };
  }, [template.topology.nodes]);

  const nodeById = React.useMemo(() => {
    const m = new Map<string, TemplateNodeConfiguration>();
    for (const n of template.topology.nodes) {
      m.set(n.id, n);
    }
    return m;
  }, [template.topology.nodes]);

  return (
    <div
      className="flex flex-col rounded-md border border-border-default bg-background overflow-hidden shadow-level-1"
      role="region"
      aria-label={`Read-only topology preview for ${template.manifest.title}`}
    >
      <div className="flex items-center justify-between px-3 py-1.5 bg-surface-02 border-b border-border-subtle">
        <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary">
          <span className="font-semibold text-foreground">Topology Preview</span>
          <span className="text-text-muted">
            {template.topology.nodes.length} nodes · {template.topology.edges.length} edges
          </span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.max(0.55, Number((z - 0.12).toFixed(2))))}
            aria-label="Zoom out topology preview"
            className="h-6 w-6 p-0 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
          >
            <MinusIcon className="w-3 h-3" />
          </Button>
          <span className="text-[10px] font-mono text-text-muted w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setZoom((z) => Math.min(1.4, Number((z + 0.12).toFixed(2))))}
            aria-label="Zoom in topology preview"
            className="h-6 w-6 p-0 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
          >
            <PlusIcon className="w-3 h-3" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setZoom(0.92)}
            aria-label="Reset topology zoom"
            className="h-6 w-6 p-0 rounded-md text-text-muted hover:text-foreground hover:bg-surface-03"
          >
            <RefreshIcon className="w-3 h-3" />
          </Button>
          <MaximizeIcon className="w-3 h-3 text-text-disabled ml-1" />
        </div>
      </div>

      <div className="overflow-auto bg-background max-h-[290px]">
        <svg
          viewBox={`${bounds.minX} ${bounds.minY} ${bounds.width} ${bounds.height}`}
          style={{
            width: Math.round(bounds.width * zoom),
            height: Math.round(bounds.height * zoom),
            minWidth: "100%",
          }}
          className="block select-none"
        >
          <defs>
            <marker
              id={`arrow-${template.manifest.id}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#666666" />
            </marker>
            <marker
              id={`arrow-active-${template.manifest.id}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#b5b5b5" />
            </marker>
          </defs>

          {/* Subtle monochrome dot grid */}
          <pattern
            id={`grid-${template.manifest.id}`}
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.8" fill="#1a1a1a" />
          </pattern>
          <rect
            x={bounds.minX}
            y={bounds.minY}
            width={bounds.width}
            height={bounds.height}
            fill={`url(#grid-${template.manifest.id})`}
          />

          {/* Edges */}
          {template.topology.edges.map((edge) => {
            const src = nodeById.get(edge.source);
            const tgt = nodeById.get(edge.target);
            if (!src || !tgt) return null;

            const x1 = src.position.x + NODE_W;
            const y1 = src.position.y + NODE_H / 2;
            const x2 = tgt.position.x;
            const y2 = tgt.position.y + NODE_H / 2;
            const midX = (x1 + x2) / 2;
            const pathD =
              x2 >= x1
                ? `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`
                : `M ${x1} ${y1} C ${x1 + 48} ${y1 - 44}, ${x2 - 48} ${y2 - 44}, ${x2} ${y2}`;

            const isHighlighted = highlightedEdgeId === edge.id;
            return (
              <g
                key={edge.id}
                onClick={() => onSelectEdge?.(edge.id)}
                className="cursor-pointer"
              >
                <path
                  d={pathD}
                  fill="none"
                  stroke={isHighlighted ? "#555555" : "#2e2e2e"}
                  strokeWidth={isHighlighted ? 2.4 : 1.5}
                  strokeDasharray={
                    edge.communicationMode === "async_queue" ||
                    edge.communicationMode === "replication"
                      ? "4 3"
                      : undefined
                  }
                  markerEnd={`url(#${isHighlighted ? "arrow-active" : "arrow"}-${template.manifest.id})`}
                />
                {edge.label && (
                  <text
                    x={midX}
                    y={(y1 + y2) / 2 - 6}
                    textAnchor="middle"
                    fill={isHighlighted ? "#e5e5e5" : "#858585"}
                    fontSize="9"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                  >
                    {edge.label.slice(0, 26)}
                  </text>
                )}
              </g>
            );
          })}

          {/* Nodes */}
          {template.topology.nodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            const isHighlighted = highlightedNodeId === node.id;
            const fill = isSelected || isHighlighted ? "#1a1a1a" : "#0d0d0d";
            const stroke = isSelected || isHighlighted ? "#404040" : "#262626";
            return (
              <g
                key={node.id}
                transform={`translate(${node.position.x}, ${node.position.y})`}
                onClick={() => onSelectNode?.(node.id)}
                className="cursor-pointer"
              >
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={6}
                  ry={6}
                  fill={fill}
                  stroke={stroke}
                  strokeWidth={isSelected || isHighlighted ? 1.8 : 1.1}
                />
                <text
                  x={10}
                  y={21}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight={isSelected || isHighlighted ? "700" : "600"}
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {node.label.slice(0, 21)}
                </text>
                <text
                  x={10}
                  y={36}
                  fill="#858585"
                  fontSize="9"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {node.componentType.slice(0, 24)}
                </text>
                <text
                  x={10}
                  y={49}
                  fill="#b5b5b5"
                  fontSize="8.5"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  x{node.analysisProfile.replicas} · {node.analysisProfile.capacityPerReplicaRps} rps
                </text>
                <rect
                  x={NODE_W - 34}
                  y={7}
                  width={26}
                  height={13}
                  rx={4}
                  fill="#141414"
                  stroke="#262626"
                  strokeWidth={0.8}
                />
                <text
                  x={NODE_W - 21}
                  y={16.5}
                  textAnchor="middle"
                  fill="#b5b5b5"
                  fontSize="7.5"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                >
                  {node.analysisProfile.multiAz ? "MAZ" : "SAZ"}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-surface-02 border-t border-border-subtle text-[10px] font-mono text-text-muted">
        <span>Click any node to inspect configuration and role</span>
        <span className={cn(highlightedNodeId ? "text-foreground" : "text-text-muted")}>
          {highlightedNodeId
            ? `Focused: ${nodeById.get(highlightedNodeId)?.label ?? highlightedNodeId}`
            : "Dashed edges = async replication / queues"}
        </span>
      </div>
    </div>
  );
}
