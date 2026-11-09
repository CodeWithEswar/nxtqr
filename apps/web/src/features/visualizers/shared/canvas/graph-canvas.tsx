"use client";

import * as React from "react";
import {
  ReactFlow,
  Background,
  MiniMap,
  BackgroundVariant,
  useReactFlow,
  type Connection,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useGraphEditorStore } from "@nxtqr/state";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { nodeTypes } from "../nodes/engineering-node";
import { edgeTypes } from "../edges/engineering-edge";
import { validateGraphConnection } from "../edges/connection-validator";
import { CanvasToolbar } from "./canvas-toolbar";
import { cn } from "@nxtqr/utils";

export interface GraphCanvasProps {
  className?: string;
  showToolbar?: boolean;
  showMinimap?: boolean;
  height?: string | number;
}

function InnerGraphCanvas({
  className,
  showToolbar = true,
  showMinimap = true,
  height = "480px",
}: GraphCanvasProps) {
  const nodes = useGraphEditorStore((state) => state.nodes);
  const edges = useGraphEditorStore((state) => state.edges);
  const setNodes = useGraphEditorStore((state) => state.setNodes);
  const setEdges = useGraphEditorStore((state) => state.setEdges);

  const selectedNodeId = useGraphEditorStore((state) => state.selectedNodeId);
  const selectedEdgeId = useGraphEditorStore((state) => state.selectedEdgeId);
  const selectNode = useGraphEditorStore((state) => state.selectNode);
  const selectEdge = useGraphEditorStore((state) => state.selectEdge);
  const addEdge = useGraphEditorStore((state) => state.addEdge);
  const removeNode = useGraphEditorStore((state) => state.removeNode);
  const removeEdge = useGraphEditorStore((state) => state.removeEdge);
  const undo = useGraphEditorStore((state) => state.undo);
  const redo = useGraphEditorStore((state) => state.redo);

  const gridType = useGraphEditorStore((state) => state.gridType);
  const snapToGrid = useGraphEditorStore((state) => state.snapToGrid);
  const storeShowMinimap = useGraphEditorStore((state) => state.showMinimap);

  const { setCenter } = useReactFlow();

  // Map NXTQR nodes to React Flow format
  const flowNodes = React.useMemo(() => {
    return nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      selected: n.id === selectedNodeId,
      data: {
        label: n.label,
        description: n.description,
        nodeType: n.type,
        status: n.status,
        ports: n.ports,
        ...n.data,
      },
    }));
  }, [nodes, selectedNodeId]);

  // Map NXTQR edges to React Flow format
  const flowEdges = React.useMemo(() => {
    return edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: e.type ?? "bezier",
      selected: e.id === selectedEdgeId,
      data: {
        label: e.label,
        status: e.status,
        ...e.data,
      },
    }));
  }, [edges, selectedEdgeId]);

  // On Node Changes (Dragging, Selection)
  const onNodesChange = React.useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, flowNodes);
      const newNodes: BaseNode[] = updated.map((fn) => {
        const original = nodes.find((n) => n.id === fn.id)!;
        return {
          ...original,
          position: fn.position,
        };
      });
      setNodes(newNodes);
    },
    [flowNodes, nodes, setNodes]
  );

  // On Edge Changes
  const onEdgesChange = React.useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, flowEdges);
      const newEdges: BaseEdge[] = updated.map((fe) => {
        const original = edges.find((e) => e.id === fe.id)!;
        return {
          ...original,
        };
      });
      setEdges(newEdges);
    },
    [edges, flowEdges, setEdges]
  );

  // On Connect
  const onConnect = React.useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;

      const validation = validateGraphConnection(
        {
          source: connection.source,
          target: connection.target,
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
        },
        nodes,
        edges
      );

      if (!validation.isValid) {
        return;
      }

      const newEdge: BaseEdge = {
        id: `edge_${connection.source}_${connection.target}_${Date.now().toString(36)}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? undefined,
        targetHandle: connection.targetHandle ?? undefined,
        type: "bezier",
        status: "idle",
        label: "Signal",
        data: {},
      };

      addEdge(newEdge);
    },
    [addEdge, edges, nodes]
  );

  // Keyboard Shortcuts
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        e.preventDefault();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        redo();
        e.preventDefault();
      } else if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedNodeId) {
          removeNode(selectedNodeId);
          e.preventDefault();
        } else if (selectedEdgeId) {
          removeEdge(selectedEdgeId);
          e.preventDefault();
        }
      } else if (e.key === "Escape") {
        selectNode(null);
        selectEdge(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [redo, removeEdge, removeNode, selectEdge, selectNode, selectedEdgeId, selectedNodeId, undo]);

  return (
    <div
      className={cn(
        "relative w-full rounded-md border border-border bg-black overflow-hidden shadow-level-1",
        className
      )}
      style={{ height }}
    >
      {/* Canvas Viewport Toolbar */}
      {showToolbar && (
        <div className="absolute top-3 left-3 z-20">
          <CanvasToolbar />
        </div>
      )}

      {/* Main Flow Canvas */}
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={(_, node) => selectNode(node.id)}
        onEdgeClick={(_, edge) => selectEdge(edge.id)}
        onPaneClick={() => {
          selectNode(null);
          selectEdge(null);
        }}
        snapToGrid={snapToGrid}
        snapGrid={[20, 20]}
        minZoom={0.2}
        maxZoom={2.5}
        fitView
        colorMode="dark"
        className="bg-black dark"
        proOptions={{ hideAttribution: true }}
      >
        {/* Subtle Background Grid */}
        {gridType === "dots" && (
          <Background
            variant={BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color="#222222"
          />
        )}
        {gridType === "lines" && (
          <Background
            variant={BackgroundVariant.Lines}
            gap={20}
            color="#141414"
          />
        )}

        {/* MiniMap */}
        {showMinimap && storeShowMinimap && (
          <MiniMap
            className="!bg-[#080808] !border !border-border !rounded-md !shadow-level-2 max-sm:scale-75 max-sm:origin-bottom-right cursor-grab active:cursor-grabbing"
            bgColor="#080808"
            maskColor="rgba(0, 0, 0, 0.75)"
            maskStrokeColor="#404040"
            maskStrokeWidth={1}
            pannable={true}
            zoomable={true}
            onNodeClick={(_, node) => {
              selectNode(node.id);
              setCenter(node.position.x + 80, node.position.y + 40, { duration: 250 });
            }}
            nodeColor={(node) => {
              if (node.id === selectedNodeId) return "#ffffff";
              if (node.data?.status === "executing") return "#ffffff";
              if (node.data?.status === "completed") return "#00cc66";
              return "#262626";
            }}
            nodeStrokeColor="#333333"
            nodeStrokeWidth={1}
            nodeBorderRadius={2}
            style={{ width: 120, height: 80 }}
          />
        )}
      </ReactFlow>
    </div>
  );
}

export function GraphCanvas(props: GraphCanvasProps) {
  return (
    <ReactFlowProvider>
      <InnerGraphCanvas {...props} />
    </ReactFlowProvider>
  );
}

