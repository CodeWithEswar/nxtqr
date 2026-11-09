"use client";

import * as React from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  MiniMap,
  Controls,
  useReactFlow,
  type Connection,
  type NodeChange,
  type EdgeChange,
  applyNodeChanges,
  applyEdgeChanges,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { useGraphEditorStore } from "../store/graph-editor-store";
import { nodeTypes } from "./graph-node";
import { edgeTypes } from "./graph-edge";
import { validatePortConnection } from "../domain/port-validator";
import { useGraphShortcuts } from "../hooks/use-graph-shortcuts";
import { infrastructureRegistry, nodeRegistry } from "@nxtqr/node-registry";
import type { BaseEdge, BaseNode, NodePosition } from "../schemas/graph.schema";

export interface GraphCanvasProps {
  className?: string;
}

function InnerGraphCanvas({ className }: GraphCanvasProps) {
  // Bind global keyboard shortcuts (Undo, Redo, Copy, Paste, Delete, Select All)
  useGraphShortcuts();

  const nodes = useGraphEditorStore((s) => s.nodes);
  const edges = useGraphEditorStore((s) => s.edges);
  const setNodesRaw = useGraphEditorStore((s) => s.setNodesRaw);
  const setEdgesRaw = useGraphEditorStore((s) => s.setEdgesRaw);
  const selectedNodeIds = useGraphEditorStore((s) => s.selectedNodeIds);
  const selectedEdgeIds = useGraphEditorStore((s) => s.selectedEdgeIds);
  const selectNode = useGraphEditorStore((s) => s.selectNode);
  const selectEdge = useGraphEditorStore((s) => s.selectEdge);
  const selectNodes = useGraphEditorStore((s) => s.selectNodes);
  const clearSelection = useGraphEditorStore((s) => s.clearSelection);
  const addNode = useGraphEditorStore((s) => s.addNode);
  const addEdge = useGraphEditorStore((s) => s.addEdge);
  const moveNodesBatch = useGraphEditorStore((s) => s.moveNodesBatch);
  const setViewport = useGraphEditorStore((s) => s.setViewport);

  const visualizerType = useGraphEditorStore((s) => s.visualizerType);
  const toolMode = useGraphEditorStore((s) => s.toolMode);
  const gridType = useGraphEditorStore((s) => s.gridType);
  const snapToGrid = useGraphEditorStore((s) => s.snapToGrid);
  const showMinimap = useGraphEditorStore((s) => s.showMinimap);

  // Track initial node positions at drag start to group continuous drag into a single history transaction
  const dragStartPositions = React.useRef<Map<string, NodePosition>>(new Map());

  // Map NXTQR nodes to React Flow format
  const flowNodes = React.useMemo(() => {
    return nodes.map((n) => ({
      id: n.id,
      type: n.type || "generic",
      position: n.position,
      selected: selectedNodeIds.includes(n.id),
      data: {
        label: n.label,
        description: n.description,
        nodeType: n.type || "process",
        status: n.status || "idle",
        ports: n.ports,
        ...n.data,
      },
    }));
  }, [nodes, selectedNodeIds]);

  // Map NXTQR edges to React Flow format
  const flowEdges = React.useMemo(() => {
    return edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      type: e.type || "bezier",
      selected: selectedEdgeIds.includes(e.id),
      data: {
        label: e.label,
        edgeType: e.type,
        ...e.data,
      },
      label: e.label,
    }));
  }, [edges, selectedEdgeIds]);

  // Node Changes (Dragging, Selection)
  const onNodesChange = React.useCallback(
    (changes: NodeChange[]) => {
      const updated = applyNodeChanges(changes, flowNodes);
      const mapped = updated.map((fn) => {
        const orig = nodes.find((n) => n.id === fn.id);
        return {
          ...orig!,
          position: fn.position,
        };
      });
      setNodesRaw(mapped);
    },
    [flowNodes, nodes, setNodesRaw],
  );

  // Edge Changes
  const onEdgesChange = React.useCallback(
    (changes: EdgeChange[]) => {
      const updated = applyEdgeChanges(changes, flowEdges);
      const mapped = updated.map((fe) => {
        const orig = edges.find((e) => e.id === fe.id);
        return orig!;
      });
      setEdgesRaw(mapped);
    },
    [flowEdges, edges, setEdgesRaw],
  );

  // Drag start: record starting positions
  const onNodeDragStart = React.useCallback(
    (_event: unknown, node: { id: string }) => {
      dragStartPositions.current.clear();
      // Record position of the dragged node and all other selected nodes
      const targetIds = selectedNodeIds.includes(node.id) ? selectedNodeIds : [node.id];
      for (const id of targetIds) {
        const n = nodes.find((item) => item.id === id);
        if (n) {
          dragStartPositions.current.set(id, { ...n.position });
        }
      }
    },
    [nodes, selectedNodeIds],
  );

  // Drag stop: push transactional MoveNodesCommand if positions changed
  const onNodeDragStop = React.useCallback(
    (_event: unknown, _node: { id: string }) => {
      const moves: { nodeId: string; from: NodePosition; to: NodePosition }[] = [];

      for (const [id, startPos] of dragStartPositions.current.entries()) {
        const current = nodes.find((n) => n.id === id);
        if (current && (current.position.x !== startPos.x || current.position.y !== startPos.y)) {
          moves.push({
            nodeId: id,
            from: startPos,
            to: { ...current.position },
          });
        }
      }

      if (moves.length > 0) {
        moveNodesBatch(moves);
      }
      dragStartPositions.current.clear();
    },
    [nodes, moveNodesBatch],
  );

  // Connect validation & creation
  const isValidConnection = React.useCallback(
    (connection: any) => {
      if (!connection.source || !connection.target) return false;
      const result = validatePortConnection({
        sourceNodeId: connection.source,
        targetNodeId: connection.target,
        sourceHandleId: connection.sourceHandle,
        targetHandleId: connection.targetHandle,
        nodes,
        edges,
      });
      return result.valid;
    },
    [nodes, edges],
  );

  const onConnect = React.useCallback(
    (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      if (!isValidConnection(connection)) return;

      const newEdge: BaseEdge = {
        id: `edge_${crypto.randomUUID().slice(0, 8)}`,
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle || undefined,
        targetHandle: connection.targetHandle || undefined,
        sourcePort: connection.sourceHandle || undefined,
        targetPort: connection.targetHandle || undefined,
        type: "bezier",
        status: "idle",
        data: {},
      };

      addEdge(newEdge);
    },
    [isValidConnection, addEdge],
  );

  // Selection handlers
  const onNodeClick = React.useCallback(
    (event: React.MouseEvent, node: { id: string }) => {
      const isMulti = event.shiftKey || event.ctrlKey || event.metaKey;
      selectNode(node.id, isMulti);
    },
    [selectNode],
  );

  const onEdgeClick = React.useCallback(
    (event: React.MouseEvent, edge: { id: string }) => {
      const isMulti = event.shiftKey || event.ctrlKey || event.metaKey;
      selectEdge(edge.id, isMulti);
    },
    [selectEdge],
  );

  const onPaneClick = React.useCallback(() => {
    clearSelection();
  }, [clearSelection]);

  const onSelectionChange = React.useCallback(
    (params: { nodes: { id: string }[]; edges: { id: string }[] }) => {
      if (params.nodes.length > 0) {
        selectNodes(params.nodes.map((n) => n.id));
      }
    },
    [selectNodes],
  );

  const { setCenter, screenToFlowPosition } = useReactFlow();

  const onDragOver = React.useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }, []);

  const onDrop = React.useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();
      const nodeType = event.dataTransfer.getData("application/nxtqr-node-type");
      const isInfra = event.dataTransfer.getData("application/nxtqr-is-infra") === "true";
      if (!nodeType) return;

      const position = screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      if (isInfra) {
        const newNode = infrastructureRegistry.createInfrastructureNode(nodeType, { position });
        addNode(newNode);
        selectNode(newNode.id, false);
      } else {
        const def = nodeRegistry.get(visualizerType as any, nodeType);
        if (def) {
          const id = `node_${def.type}_${crypto.randomUUID().slice(0, 6)}`;
          const newNode: BaseNode = {
            id,
            type: def.type,
            position,
            dimensions: { width: 200, height: 80 },
            status: "idle",
            label: def.label,
            description: def.description,
            data: { ...def.defaultData },
            ports: def.ports,
          };
          addNode(newNode);
          selectNode(newNode.id, false);
        }
      }
    },
    [screenToFlowPosition, addNode, selectNode],
  );

  // Minimap click-to-center navigation
  const onMinimapClick = React.useCallback(
    (_event: React.MouseEvent, position: { x: number; y: number }) => {
      setCenter(position.x, position.y, { duration: 250 });
    },
    [setCenter],
  );

  // Viewport change persistence
  const onMoveEnd = React.useCallback(
    (_event: unknown, viewport: { x: number; y: number; zoom: number }) => {
      setViewport(viewport);
    },
    [setViewport],
  );

  return (
    <div className={`relative h-full w-full bg-black ${className || ""}`}>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStart={onNodeDragStart}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        isValidConnection={isValidConnection}
        onNodeClick={onNodeClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onSelectionChange={onSelectionChange}
        onMoveEnd={onMoveEnd}
        onDragOver={onDragOver}
        onDrop={onDrop}
        // Interaction controls
        panOnDrag={toolMode === "pan" ? true : [1, 2]} // In select mode, right-click or middle-click pans
        selectionOnDrag={toolMode === "select"}
        panOnScroll={false}
        zoomOnScroll={true}
        zoomOnPinch={true}
        minZoom={0.1}
        maxZoom={3.0}
        snapToGrid={snapToGrid}
        snapGrid={[16, 16]}
        // Strict Pure Black styling
        colorMode="dark"
        proOptions={{ hideAttribution: true }}
        className="nxtqr-graph-canvas"
      >
        {/* Subtle Engineering Grid Background */}
        {gridType !== "none" && (
          <Background
            variant={gridType === "lines" ? BackgroundVariant.Lines : BackgroundVariant.Dots}
            gap={20}
            size={1.5}
            color="#202020"
          />
        )}

        {/* On-Canvas Precision Viewport Controls */}
        <Controls
          showZoom={true}
          showFitView={true}
          showInteractive={false}
          position="bottom-left"
          className="!m-3 !border !border-border-default !rounded-md !shadow-level-2 overflow-hidden"
          aria-label="Canvas Viewport Controls"
        />

        {/* Precision Minimap (Pannable, Zoomable, Click-to-center) */}
        {showMinimap && (
          <MiniMap
            pannable={true}
            zoomable={true}
            nodeStrokeWidth={2}
            nodeColor={(node) => (node.selected ? "#525252" : "#262626")}
            nodeStrokeColor={(node) => (node.selected ? "#737373" : "#383838")}
            maskColor="rgba(0, 0, 0, 0.65)"
            maskStrokeColor="#404040"
            maskStrokeWidth={1.5}
            className="!bg-surface-01 !border !border-border-default !rounded-md !m-3 !shadow-level-2"
            style={{ width: 140, height: 90 }}
            onClick={onMinimapClick}
            ariaLabel="Canvas Navigation Minimap"
          />
        )}
      </ReactFlow>
    </div>
  );
}

export function GraphCanvas(props: GraphCanvasProps) {
  return <InnerGraphCanvas {...props} />;
}

