"use client";

import * as React from "react";
import type { BaseNode, BaseEdge, GraphDocument } from "@nxtqr/graph-schema";
import type { TutorialScenario } from "../schemas/tutorial.schema";
import { getInfrastructureIcon, CpuIcon, MaximizeIcon, RefreshIcon, PlusIcon, MinusIcon } from "@nxtqr/icons";
import { Button, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@nxtqr/ui";
import { OpenInVisualizerButton } from "./open-in-visualizer-button";
import { CURRENT_GRAPH_SCHEMA_VERSION } from "@nxtqr/graph-schema";

export interface ComponentPreviewProps {
  componentId: string;
  componentName: string;
  previewNodes: Record<TutorialScenario, BaseNode[]>;
  previewEdges: Record<TutorialScenario, BaseEdge[]>;
  className?: string;
}

export function ComponentPreview({
  componentId,
  componentName,
  previewNodes,
  previewEdges,
  className = "",
}: ComponentPreviewProps) {
  const [activeScenario, setActiveScenario] = React.useState<TutorialScenario>("connected");
  const [zoom, setZoom] = React.useState<number>(1);
  const [pan, setPan] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isFullscreenOpen, setIsFullscreenOpen] = React.useState(false);

  const currentNodes = previewNodes[activeScenario] || [];
  const currentEdges = previewEdges[activeScenario] || [];

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 2.0));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.5));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Construct a full GraphDocument for opening directly into the workspace
  const currentDocument: GraphDocument = React.useMemo(() => {
    return {
      id: `doc_preview_${componentId}_${activeScenario}`,
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: `${componentName} (${activeScenario} topology)`,
      nodes: currentNodes,
      edges: currentEdges,
      viewport: { x: pan.x, y: pan.y, zoom },
      metadata: { componentId, scenario: activeScenario },
    };
  }, [componentId, componentName, activeScenario, currentNodes, currentEdges, pan, zoom]);

  const renderCanvas = (isModal: boolean = false) => {
    const canvasHeight = isModal ? "h-[560px]" : "h-[360px]";

    return (
      <div className={`relative w-full ${canvasHeight} bg-black border border-border-default rounded-md overflow-hidden select-none flex flex-col`}>
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, #404040 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        />

        {/* Top Scenario Selector & Toolbar */}
        <div className="relative z-10 h-10 px-3 bg-surface-01 border-b border-border-default flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider text-text-muted mr-1">
              Scenario:
            </span>
            {(["isolated", "connected", "architecture"] as TutorialScenario[]).map((scenario) => (
              <button
                key={scenario}
                onClick={() => {
                  setActiveScenario(scenario);
                  handleReset();
                }}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  activeScenario === scenario
                    ? "bg-surface-04 text-foreground font-semibold border border-border-hover"
                    : "text-text-muted hover:text-text-secondary hover:bg-surface-02"
                }`}
              >
                {scenario === "isolated" && "Isolated"}
                {scenario === "connected" && "Connected"}
                {scenario === "architecture" && "Full Architecture"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="h-7 w-7 p-0 text-text-muted hover:text-foreground"
              title="Zoom Out"
            >
              <MinusIcon className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-[11px] text-text-muted w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              className="h-7 w-7 p-0 text-text-muted hover:text-foreground"
              title="Zoom In"
            >
              <PlusIcon className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-7 w-7 p-0 text-text-muted hover:text-foreground"
              title="Reset View"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
            </Button>

            {!isModal && (
              <Dialog open={isFullscreenOpen} onOpenChange={setIsFullscreenOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 px-2 text-xs font-mono text-text-muted hover:text-foreground gap-1"
                  >
                    <MaximizeIcon className="w-3 h-3" />
                    <span>Expand</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl bg-surface-01 border-border-default text-foreground">
                  <DialogHeader>
                    <DialogTitle className="font-mono text-sm font-semibold flex items-center justify-between">
                      <span>{componentName} — Interactive Topology Explorer</span>
                      <OpenInVisualizerButton
                        document={currentDocument}
                        size="sm"
                        label="Open in Workspace"
                      />
                    </DialogTitle>
                  </DialogHeader>
                  <div className="mt-2">{renderCanvas(true)}</div>
                </DialogContent>
              </Dialog>
            )}

            <OpenInVisualizerButton
              document={currentDocument}
              size="sm"
              label="Visualizer"
              className="h-7 text-xs"
            />
          </div>
        </div>

        {/* Visual Graph Viewport */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="absolute inset-0 origin-center transition-transform duration-100 ease-out flex items-center justify-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <div className="relative w-[850px] h-[300px]">
              {/* SVG Edges Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#404040" />
                  </marker>
                </defs>
                {currentEdges.map((edge) => {
                  const sourceNode = currentNodes.find((n) => n.id === edge.source);
                  const targetNode = currentNodes.find((n) => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;

                  const sx = sourceNode.position.x + (sourceNode.dimensions?.width || 200);
                  const sy = sourceNode.position.y + 38;
                  const tx = targetNode.position.x;
                  const ty = targetNode.position.y + 38;
                  const mx = (sx + tx) / 2;

                  const pathD = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;

                  return (
                    <g key={edge.id}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke="#262626"
                        strokeWidth="2"
                        markerEnd="url(#arrowhead)"
                      />
                      {edge.label && (
                        <foreignObject
                          x={mx - 60}
                          y={(sy + ty) / 2 - 12}
                          width="120"
                          height="24"
                        >
                          <div className="flex items-center justify-center">
                            <span className="px-1.5 py-0.5 rounded bg-surface-03 border border-border-default font-mono text-[9px] text-text-muted truncate">
                              {edge.label}
                            </span>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Render Graph Nodes */}
              {currentNodes.map((node) => {
                const isTarget = node.id.includes(componentId);
                const IconComponent = getInfrastructureIcon(node.type) || CpuIcon;

                return (
                  <div
                    key={node.id}
                    className={`absolute rounded-md p-3 transition-all z-10 flex flex-col justify-between ${
                      isTarget
                        ? "bg-surface-03 border-2 border-border-strong shadow-level-2"
                        : "bg-surface-02 border border-border-default"
                    }`}
                    style={{
                      left: `${node.position.x}px`,
                      top: `${node.position.y}px`,
                      width: `${node.dimensions?.width || 210}px`,
                      height: `${node.dimensions?.height || 76}px`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-7 h-7 rounded flex items-center justify-center shrink-0 ${
                          isTarget ? "bg-surface-04 text-foreground" : "bg-surface-01 text-text-muted"
                        }`}
                      >
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-sans text-xs font-semibold text-foreground truncate">
                          {String(node.label || (node.data && node.data.name) || node.type)}
                        </div>
                        <div className="font-mono text-[10px] text-text-muted truncate">
                          {node.type}
                        </div>
                      </div>
                      {isTarget && (
                        <Badge
                          variant="outline"
                          className="text-[9px] px-1 py-0 h-4 border-border-hover bg-surface-04 text-foreground font-mono"
                        >
                          Target
                        </Badge>
                      )}
                    </div>

                    {/* Node Ports Preview */}
                    {node.ports && node.ports.length > 0 && (
                      <div className="flex items-center justify-between pt-1 border-t border-border-subtle mt-1">
                        <div className="flex items-center gap-1 font-mono text-[9px] text-text-disabled truncate">
                          <span>in: {node.ports.filter((p) => p.type === "input" || p.type === "bidirectional").length}</span>
                          <span>•</span>
                          <span>out: {node.ports.filter((p) => p.type === "output" || p.type === "bidirectional").length}</span>
                        </div>
                        <span className="font-mono text-[9px] text-text-muted">
                          {String((node.data && node.data.environment) || "prod")}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Hint */}
        <div className="h-6 px-3 bg-surface-01 border-t border-border-default flex items-center justify-between text-[10px] font-mono text-text-muted shrink-0">
          <span>{currentNodes.length} Nodes • {currentEdges.length} Connections</span>
          <span>Click &apos;Visualizer&apos; to load full graph</span>
        </div>
      </div>
    );
  };

  return <div className={`w-full ${className}`}>{renderCanvas(false)}</div>;
}
