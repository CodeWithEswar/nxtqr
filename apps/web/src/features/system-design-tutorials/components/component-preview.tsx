"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  CURRENT_GRAPH_SCHEMA_VERSION,
  type BaseNode,
  type BaseEdge,
  type GraphDocument,
} from "@nxtqr/graph-schema";
import { MaximizeIcon } from "@nxtqr/icons";
import { Button, Dialog, DialogContent, DialogTitle, DialogTrigger } from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import type { TutorialScenario } from "../schemas/tutorial.schema";
import { OpenInVisualizerButton } from "./open-in-visualizer-button";
import type { TutorialLayout } from "./tutorial-canvas";

const TutorialCanvas = dynamic(
  () => import("./tutorial-canvas").then((module) => module.TutorialCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        role="status"
        className="grid h-[clamp(17rem,46vh,30rem)] place-items-center bg-black text-xs text-text-muted"
      >
        Loading canvas…
      </div>
    ),
  },
);

const emptyLayout: TutorialLayout = {};

const scenarios = [
  { id: "isolated", label: "Isolated" },
  { id: "connected", label: "Connected" },
  { id: "architecture", label: "Architecture" },
] as const;

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
  className,
}: ComponentPreviewProps) {
  const [activeScenario, setActiveScenario] = React.useState<TutorialScenario>(
    previewNodes.connected.length ? "connected" : "isolated",
  );
  const [showFlow, setShowFlow] = React.useState(false);
  const [expanded, setExpanded] = React.useState(false);
  const [layouts, setLayouts] = React.useState<Partial<Record<TutorialScenario, TutorialLayout>>>(
    {},
  );
  const layout = layouts[activeScenario] ?? emptyLayout;
  const nodes = previewNodes[activeScenario];
  const edges = previewEdges[activeScenario];
  const activeEdgeIds = React.useMemo(
    () => (showFlow ? edges.map((edge) => edge.id) : []),
    [edges, showFlow],
  );

  const document: GraphDocument = {
    id: `doc_preview_${componentId}_${activeScenario}`,
    schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
    visualizerType: "generic",
    title: `${componentName} (${activeScenario})`,
    nodes: nodes.map((node) => ({ ...node, position: layout[node.id] ?? node.position })),
    edges,
    viewport: { x: 0, y: 0, zoom: 1 },
    metadata: { componentId, scenario: activeScenario },
  };

  const controls = (
    <>
      <div role="group" aria-label="Preview scenario" className="flex flex-wrap gap-1">
        {scenarios
          .filter(({ id }) => previewNodes[id].length > 0)
          .map(({ id, label }) => (
            <Button
              key={id}
              type="button"
              variant="ghost"
              size="sm"
              aria-pressed={activeScenario === id}
              className="h-9 border border-transparent text-text-secondary aria-pressed:border-border-strong aria-pressed:bg-surface-04 aria-pressed:text-foreground"
              onClick={() => {
                setActiveScenario(id);
                setShowFlow(false);
              }}
            >
              {label}
            </Button>
          ))}
      </div>
      {edges.length > 0 && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-pressed={showFlow}
          className="h-9 aria-pressed:border-border-strong aria-pressed:bg-surface-04"
          onClick={() => setShowFlow((value) => !value)}
        >
          Trace flow
        </Button>
      )}
    </>
  );
  const canvas = (full: boolean) => (
    <TutorialCanvas
      key={activeScenario}
      label={`${componentName} ${activeScenario} diagram`}
      nodes={nodes}
      edges={edges}
      activeEdgeIds={activeEdgeIds}
      highlightedType={componentId}
      layout={layout}
      setLayout={(update) =>
        setLayouts((previous) => ({
          ...previous,
          [activeScenario]:
            typeof update === "function" ? update(previous[activeScenario] ?? emptyLayout) : update,
        }))
      }
      className={full ? "h-full min-h-0 flex-1" : undefined}
    />
  );

  return (
    <Dialog open={expanded} onOpenChange={setExpanded}>
      <div
        className={cn(
          "overflow-hidden rounded-md border border-border-default bg-surface-01",
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-2 border-b border-border-default p-2 sm:justify-between">
          {controls}
          <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
            <DialogTrigger asChild>
              <Button type="button" variant="ghost" size="icon" aria-label="Expand preview">
                <MaximizeIcon className="size-4" />
              </Button>
            </DialogTrigger>
            <OpenInVisualizerButton
              document={document}
              variant="outline"
              size="sm"
              className="h-9"
            />
          </div>
        </div>
        {expanded ? (
          <div aria-hidden={true} className="h-[clamp(17rem,46vh,30rem)] bg-black" />
        ) : (
          canvas(false)
        )}
        <p className="border-t border-border-default px-3 py-2 font-mono text-[10px] text-text-muted">
          {nodes.length} {nodes.length === 1 ? "node" : "nodes"} · {edges.length}{" "}
          {edges.length === 1 ? "connection" : "connections"}
        </p>
      </div>
      <DialogContent
        className="flex h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100vw-2rem)]"
        aria-describedby={undefined}
      >
        <DialogTitle className="border-b border-border-default px-3 py-3 pr-12">
          {componentName}
        </DialogTitle>
        <div className="flex flex-wrap items-center gap-2 border-b border-border-default p-2">
          {controls}
          <OpenInVisualizerButton
            document={document}
            variant="outline"
            size="sm"
            className="h-9 sm:ml-auto"
          />
        </div>
        {expanded && canvas(true)}
      </DialogContent>
    </Dialog>
  );
}
