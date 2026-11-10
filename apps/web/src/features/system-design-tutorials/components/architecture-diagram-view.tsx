"use client";

import * as React from "react";
import type { ArchitectureExample } from "../schemas/tutorial.schema";
import { getInfrastructureIcon, CpuIcon, PlusIcon, MinusIcon, RefreshIcon, ChevronRightIcon } from "@nxtqr/icons";
import { Button, Badge } from "@nxtqr/ui";
import { OpenInVisualizerButton } from "./open-in-visualizer-button";

export interface ArchitectureDiagramViewProps {
  example: ArchitectureExample;
  className?: string;
}

export function ArchitectureDiagramView({ example, className = "" }: ArchitectureDiagramViewProps) {
  const [activeStep, setActiveStep] = React.useState<number | null>(null);
  const [zoom, setZoom] = React.useState<number>(0.9);
  const [pan, setPan] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const doc = example.graphDocument;
  const nodes = doc.nodes || [];
  const edges = doc.edges || [];
  const steps = example.flowSteps || [];

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 2.0));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.5));
  const handleReset = () => {
    setZoom(0.9);
    setPan({ x: 0, y: 0 });
    setActiveStep(null);
  };

  // Determine active edge and nodes if a step is selected
  const activeFlow = activeStep !== null ? steps[activeStep] : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Visualizer Canvas */}
      <div className="relative w-full h-[460px] bg-black border border-border-default rounded-md overflow-hidden select-none flex flex-col">
        {/* Background Grid Pattern */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `radial-gradient(circle, #404040 1px, transparent 1px)`,
            backgroundSize: "24px 24px",
          }}
        />

        {/* Toolbar */}
        <div className="relative z-10 h-10 px-3 bg-surface-01 border-b border-border-default flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-semibold text-foreground">
              {example.title}
            </span>
            <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 h-4 border-border-default text-text-muted">
              {example.difficulty}
            </Badge>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              className="h-7 w-7 p-0 text-text-muted hover:text-foreground"
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
            >
              <PlusIcon className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="h-7 w-7 p-0 text-text-muted hover:text-foreground"
            >
              <RefreshIcon className="w-3.5 h-3.5" />
            </Button>
            <OpenInVisualizerButton
              document={doc}
              templateSlug={example.slug}
              size="sm"
              className="h-7 text-xs"
              label="Open in Visualizer"
            />
          </div>
        </div>

        {/* Canvas Area */}
        <div className="relative flex-1 overflow-hidden">
          <div
            className="absolute inset-0 origin-center transition-transform duration-100 ease-out flex items-center justify-center"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            }}
          >
            <div className="relative w-[1500px] h-[480px]">
              {/* SVG Edges Layer */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                <defs>
                  <marker
                    id="archArrow"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#404040" />
                  </marker>
                  <marker
                    id="archArrowActive"
                    markerWidth="8"
                    markerHeight="6"
                    refX="7"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 8 3, 0 6" fill="#FFFFFF" />
                  </marker>
                </defs>

                {edges.map((edge) => {
                  const sourceNode = nodes.find((n) => n.id === edge.source);
                  const targetNode = nodes.find((n) => n.id === edge.target);
                  if (!sourceNode || !targetNode) return null;

                  const sx = sourceNode.position.x + (sourceNode.dimensions?.width || 210);
                  const sy = sourceNode.position.y + 38;
                  const tx = targetNode.position.x;
                  const ty = targetNode.position.y + 38;
                  const mx = (sx + tx) / 2;

                  const isEdgeActive =
                    activeFlow &&
                    (edge.label?.includes(String(activeFlow.step)) ||
                      (sourceNode.label?.includes(activeFlow.from) && targetNode.label?.includes(activeFlow.to)));

                  const pathD = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;

                  return (
                    <g key={edge.id}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isEdgeActive ? "#858585" : "#262626"}
                        strokeWidth={isEdgeActive ? "3" : "1.5"}
                        strokeDasharray={isEdgeActive ? "4 4" : "none"}
                        markerEnd={isEdgeActive ? "url(#archArrowActive)" : "url(#archArrow)"}
                        className="transition-colors duration-200"
                      />
                      {edge.label && (
                        <foreignObject
                          x={mx - 75}
                          y={(sy + ty) / 2 - 12}
                          width="150"
                          height="24"
                        >
                          <div className="flex items-center justify-center">
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono text-[9px] truncate border ${
                                isEdgeActive
                                  ? "bg-surface-04 border-border-hover text-foreground font-semibold"
                                  : "bg-surface-02 border-border-default text-text-muted"
                              }`}
                            >
                              {edge.label}
                            </span>
                          </div>
                        </foreignObject>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Render Nodes */}
              {nodes.map((node) => {
                const IconComponent = getInfrastructureIcon(node.type) || CpuIcon;
                const isNodeActive =
                  activeFlow &&
                  (node.label?.includes(activeFlow.from) || node.label?.includes(activeFlow.to));

                return (
                  <div
                    key={node.id}
                    className={`absolute rounded-md p-3 transition-all z-10 flex flex-col justify-between ${
                      isNodeActive
                        ? "bg-surface-03 border-2 border-border-strong shadow-level-3"
                        : "bg-surface-02 border border-border-default hover:border-border-hover"
                    }`}
                    style={{
                      left: `${node.position.x}px`,
                      top: `${node.position.y}px`,
                      width: `${node.dimensions?.width || 220}px`,
                      height: `${node.dimensions?.height || 76}px`,
                    }}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded bg-surface-01 border border-border-default flex items-center justify-center shrink-0 text-text-secondary">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-sans text-xs font-semibold text-foreground truncate">
                          {String(node.label || (node.data && node.data.name) || node.type)}
                        </div>
                        <div className="font-mono text-[9px] text-text-muted truncate">
                          {node.type}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-border-subtle mt-1 text-[9px] font-mono text-text-disabled">
                      <span>{node.ports?.length || 2} ports</span>
                      <span className="text-text-muted">{String((node.data && node.data.environment) || "production")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer info bar */}
        <div className="h-6 px-3 bg-surface-01 border-t border-border-default flex items-center justify-between text-[10px] font-mono text-text-muted shrink-0">
          <span>
            {nodes.length} Components • {edges.length} Connections • Scale: {example.scale.requestsPerSec || "Enterprise"}
          </span>
          <span>Click any request step below to highlight flow trace</span>
        </div>
      </div>

      {/* Step-by-Step Request Flow Stepper */}
      {steps.length > 0 && (
        <div className="p-4 rounded-md bg-surface-01 border border-border-default space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-text-secondary">
              Request Flow Sequence
            </span>
            {activeStep !== null && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveStep(null)}
                className="h-6 text-[10px] font-mono text-text-muted hover:text-foreground"
              >
                Clear Step Highlight
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {steps.map((st, idx) => {
              const isSelected = activeStep === idx;

              return (
                <div
                  key={st.step}
                  onClick={() => setActiveStep(isSelected ? null : idx)}
                  className={`p-2.5 rounded-md border cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-surface-04 border-border-strong text-foreground shadow-level-2"
                      : "bg-surface-02 border-border-default hover:border-border-hover text-text-secondary"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-[10px] font-bold text-foreground">
                      Step {st.step}
                    </span>
                    <Badge variant="outline" className="font-mono text-[9px] px-1 py-0 h-4 border-border-default text-text-muted">
                      {st.protocol}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-foreground mb-1">
                    <span className="truncate">{st.from}</span>
                    <ChevronRightIcon className="w-3 h-3 text-text-disabled shrink-0" />
                    <span className="truncate">{st.to}</span>
                  </div>

                  <p className="text-[11px] font-sans text-text-muted leading-snug">
                    {st.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
