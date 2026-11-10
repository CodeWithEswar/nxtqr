"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import {
  CURRENT_GRAPH_SCHEMA_VERSION,
  type BaseNode,
  type BaseEdge,
  type GraphDocument,
} from "@nxtqr/graph-schema";
import {
  ActivityIcon,
  CpuIcon,
  getInfrastructureIcon,
  GridIcon,
  LayersIcon,
  MaximizeIcon,
} from "@nxtqr/icons";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import type { TutorialScenario } from "../schemas/tutorial.schema";
import { OpenInVisualizerButton } from "./open-in-visualizer-button";
import type { TutorialLayout } from "./tutorial-canvas";
import { orderTutorialFlow, TUTORIAL_FLOW_HOP_MS } from "../lib/tutorial-flow";

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

const ConnectionIcon = getInfrastructureIcon("connection-junction");

const scenarios = [
  { id: "isolated", label: "Isolated", icon: <CpuIcon size={14} /> },
  {
    id: "connected",
    label: "Connected",
    icon: ConnectionIcon ? (
      <ConnectionIcon size={16} variant="monochrome" />
    ) : (
      <GridIcon size={14} />
    ),
  },
  { id: "architecture", label: "Architecture", icon: <LayersIcon size={14} /> },
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
  const previewTitle = React.useRef<HTMLHeadingElement>(null);
  const [layouts, setLayouts] = React.useState<Partial<Record<TutorialScenario, TutorialLayout>>>(
    {},
  );
  const layout = layouts[activeScenario] ?? emptyLayout;
  const nodes = previewNodes[activeScenario];
  const edges = previewEdges[activeScenario];
  const activeEdgeIds = React.useMemo(
    () => (showFlow ? orderTutorialFlow(edges) : []),
    [edges, showFlow],
  );

  React.useEffect(() => {
    if (activeEdgeIds.length === 0) return;
    const timer = window.setTimeout(
      () => setShowFlow(false),
      activeEdgeIds.length * TUTORIAL_FLOW_HOP_MS + 200,
    );
    return () => window.clearTimeout(timer);
  }, [activeEdgeIds]);

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
      <ToggleGroup
        type="single"
        value={activeScenario}
        size="sm"
        aria-label="Preview scenario"
        className="gap-0.5 rounded-md border border-border-subtle bg-surface-00 p-0.5"
        onValueChange={(value) => {
          const scenario = scenarios.find(({ id }) => id === value);
          if (!scenario) return;
          setActiveScenario(scenario.id);
          setShowFlow(false);
        }}
      >
        {scenarios
          .filter(({ id }) => previewNodes[id].length > 0)
          .map(({ id, label, icon }) => (
            <Tooltip key={id}>
              <TooltipTrigger asChild>
                <ToggleGroupItem
                  value={id}
                  aria-label={label}
                  className="size-7 p-0 text-text-muted"
                >
                  {icon}
                </ToggleGroupItem>
              </TooltipTrigger>
              <TooltipContent side="bottom">{label}</TooltipContent>
            </Tooltip>
          ))}
      </ToggleGroup>
      {edges.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              variant="outline"
              size="sm"
              pressed={showFlow}
              onPressedChange={setShowFlow}
              aria-label="Trace flow"
              className="size-7 p-0 text-text-secondary"
            >
              <ActivityIcon size={14} />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent side="bottom">{showFlow ? "Stop trace" : "Trace flow"}</TooltipContent>
        </Tooltip>
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
    <Dialog
      open={expanded}
      onOpenChange={(open) => {
        setShowFlow(false);
        setExpanded(open);
      }}
    >
      <div
        className={cn(
          "overflow-hidden rounded-md border border-border-default bg-surface-01",
          className,
        )}
      >
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border-default px-2 py-1">
          {controls}
          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <Tooltip>
              <DialogTrigger asChild>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    aria-label="Expand preview"
                    className="text-text-secondary"
                  >
                    <MaximizeIcon size={14} />
                  </Button>
                </TooltipTrigger>
              </DialogTrigger>
              <TooltipContent side="bottom">Expand preview</TooltipContent>
            </Tooltip>
            <OpenInVisualizerButton document={document} variant="outline" iconOnly />
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
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          previewTitle.current?.focus({ preventScroll: true });
        }}
      >
        <DialogTitle
          ref={previewTitle}
          tabIndex={-1}
          className="border-b border-border-default px-3 py-3 pr-12 focus:outline-none"
        >
          {componentName}
        </DialogTitle>
        <div className="flex flex-wrap items-center gap-1.5 border-b border-border-default px-2 py-1">
          {controls}
          <OpenInVisualizerButton
            document={document}
            variant="outline"
            iconOnly
            className="text-text-secondary"
          />
        </div>
        {expanded && canvas(true)}
      </DialogContent>
    </Dialog>
  );
}
