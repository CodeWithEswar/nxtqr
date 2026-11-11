"use client";

import * as React from "react";
import {
  Panel,
  useNodesInitialized,
  applyNodeChanges,
  useReactFlow,
  useStore,
  type Edge,
  type Node,
  type NodeChange,
  type XYPosition,
} from "@xyflow/react";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import { cn } from "@nxtqr/utils";
import { Button, Tooltip, TooltipContent, TooltipTrigger } from "@nxtqr/ui";
import { RefreshIcon } from "@nxtqr/icons";
import type { GraphNodeData, GraphPortLayout } from "@/features/graph-engine/components/graph-node";
import { GraphCanvasSurface } from "@/features/graph-engine/components/graph-canvas-surface";
import { showcaseEdgeMarker } from "@/features/graph-engine/components/graph-edge";
import { TUTORIAL_FLOW_HOP_MS } from "../lib/tutorial-flow";
import "./tutorial-canvas.css";

const fitOptions = { padding: 0.15, minZoom: 0.12, maxZoom: 1.1 };
const emptyIds: readonly string[] = [];
const pulseStyle = {
  "--tutorial-flow-hop-duration": `${TUTORIAL_FLOW_HOP_MS}ms`,
} as React.CSSProperties;

export type TutorialLayout = Readonly<Record<string, XYPosition>>;
const emptyLayout: TutorialLayout = {};

interface TutorialCanvasProps {
  label: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  activeEdgeIds?: readonly string[];
  traceKey?: string;
  highlightedType?: string;
  portLayout?: GraphPortLayout;
  showcase?: boolean;
  layout?: TutorialLayout;
  setLayout?: React.Dispatch<React.SetStateAction<TutorialLayout>>;
  className?: string;
}

function FlowFocus({ focusIds }: { focusIds: string[] }) {
  const { fitView } = useReactFlow();
  const initialized = useNodesInitialized();
  const narrow = useStore((state) => state.width < 540);

  React.useEffect(() => {
    if (initialized && narrow && focusIds.length > 0) {
      void fitView({ ...fitOptions, nodes: focusIds.map((id) => ({ id })) });
    }
  }, [fitView, focusIds, initialized, narrow]);

  return null;
}

export function TutorialCanvas({
  label,
  nodes,
  edges,
  activeEdgeIds = emptyIds,
  traceKey,
  highlightedType,
  portLayout = "horizontal",
  showcase = false,
  layout: controlledLayout,
  setLayout: setControlledLayout,
  className,
}: TutorialCanvasProps) {
  const [localLayout, setLocalLayout] = React.useState<TutorialLayout>(emptyLayout);
  const layout = controlledLayout ?? localLayout;
  const setLayout = setControlledLayout ?? setLocalLayout;
  const active = React.useMemo(
    () => new Map(activeEdgeIds.map((id, index) => [id, index])),
    [activeEdgeIds],
  );
  const focusedNodes = React.useMemo(
    () =>
      new Set(
        edges.filter((edge) => active.has(edge.id)).flatMap((edge) => [edge.source, edge.target]),
      ),
    [active, edges],
  );
  const focusIds = React.useMemo(() => [...focusedNodes], [focusedNodes]);

  const connectedPorts = React.useMemo(() => {
    const ports = new Map<string, { inputs: Set<string>; outputs: Set<string> }>();
    const add = (nodeId: string, direction: "inputs" | "outputs", portId?: string) => {
      if (!portId) return;
      const existing = ports.get(nodeId) ?? {
        inputs: new Set<string>(),
        outputs: new Set<string>(),
      };
      existing[direction].add(portId);
      ports.set(nodeId, existing);
    };
    for (const edge of edges) {
      add(edge.source, "outputs", edge.sourceHandle ?? edge.sourcePort);
      add(edge.target, "inputs", edge.targetHandle ?? edge.targetPort);
    }
    return ports;
  }, [edges]);

  const graphNodes = React.useMemo<Node<GraphNodeData>[]>(
    () =>
      nodes.map((node) => ({
        id: node.id,
        type: "custom",
        position: node.position,
        ariaLabel: node.label ?? node.type,
        data: {
          ...node.data,
          nodeType: node.type,
          label: node.label,
          description: node.description,
          ports: node.ports,
          portLayout,
          showcase,
          connectedPorts: connectedPorts.get(node.id),
          highlighted: focusedNodes.has(node.id) || node.type === highlightedType,
        },
      })),
    [connectedPorts, focusedNodes, highlightedType, nodes, portLayout, showcase],
  );

  const [flowNodes, setFlowNodes] = React.useState(() =>
    graphNodes.map((node) => ({ ...node, position: layout[node.id] ?? node.position })),
  );

  React.useEffect(() => {
    setFlowNodes((current) => {
      const byId = new Map(current.map((node) => [node.id, node]));
      return graphNodes.map((node) => {
        const previous = byId.get(node.id);
        return previous ? { ...previous, data: node.data, ariaLabel: node.ariaLabel } : node;
      });
    });
  }, [graphNodes, setFlowNodes]);

  const flowEdges = React.useMemo<Edge[]>(() => {
    return edges.map((edge) => {
      const hop = active.get(edge.id);
      const flowActive = hop !== undefined;
      const edgeType = edge.type === "straight" ? "straight" : "smoothstep";
      return {
        id: edge.id,
        type: edgeType,
        source: edge.source,
        target: edge.target,
        sourceHandle: edge.sourceHandle ?? edge.sourcePort,
        targetHandle: edge.targetHandle ?? edge.targetPort,
        label: active.size === 0 || flowActive ? edge.label : undefined,
        selectable: false,
        data: {
          edgeType,
          flowActive,
          tutorialWire: true,
          flowPulseDelay: hop === undefined ? undefined : hop * TUTORIAL_FLOW_HOP_MS,
          traceKey,
        },
        markerEnd: showcaseEdgeMarker,
      };
    });
  }, [active, edges, traceKey]);

  const handleNodesChange = React.useCallback(
    (changes: NodeChange<Node<GraphNodeData>>[]) => {
      // Keep React Flow measurements and port bounds while updating live positions.
      setFlowNodes((current) => applyNodeChanges(changes, current));

      const committed: Record<string, XYPosition> = {};
      for (const change of changes) {
        if (change.type === "position" && change.position && !change.dragging) {
          committed[change.id] = change.position;
        }
      }
      if (Object.keys(committed).length > 0)
        setLayout((previous) => ({ ...previous, ...committed }));
    },
    [setLayout],
  );

  function resetLayout() {
    const positions = new Map(nodes.map((node) => [node.id, node.position]));
    setFlowNodes((current) =>
      current.map((node) => ({ ...node, position: positions.get(node.id) ?? node.position })),
    );
    setLayout(emptyLayout);
  }

  return (
    <div
      role="region"
      aria-label={label}
      style={pulseStyle}
      className={cn(
        "tutorial-canvas relative h-[clamp(17rem,46vh,30rem)] min-w-0 bg-black",
        className,
      )}
    >
      <GraphCanvasSurface
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={handleNodesChange}
        panOnDrag
        nodesDraggable
        autoPanOnNodeDrag={false}
        nodesConnectable={false}
        multiSelectionKeyCode={null}
        edgesFocusable={false}
        deleteKeyCode={null}
        zoomOnScroll={false}
        preventScrolling={false}
        fitView
        fitViewOptions={fitOptions}
        minZoom={fitOptions.minZoom}
        maxZoom={2}
      >
        <FlowFocus focusIds={focusIds} />
        {Object.keys(layout).length > 0 && (
          <Panel position="bottom-right" className="!m-3">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  type="button"
                  size="icon-sm"
                  variant="outline"
                  aria-label="Reset layout"
                  className="text-text-secondary"
                  onClick={resetLayout}
                >
                  <RefreshIcon size={14} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" align="end">
                Reset layout
              </TooltipContent>
            </Tooltip>
          </Panel>
        )}
      </GraphCanvasSurface>
    </div>
  );
}
