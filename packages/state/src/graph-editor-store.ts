import { create } from "zustand";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { SimulationStatus, SimulationEvent } from "@nxtqr/simulation-core";

export type GridType = "dots" | "lines" | "none";

export interface HistorySnapshot {
  nodes: BaseNode[];
  edges: BaseEdge[];
}

export interface GraphEditorState {
  // Document state
  documentId: string;
  title: string;
  nodes: BaseNode[];
  edges: BaseEdge[];

  // Ephemeral editor state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  selectedTraceEventId: string | null;
  gridType: GridType;
  snapToGrid: boolean;
  isInspectorOpen: boolean;

  // Simulation state
  simulationStatus: SimulationStatus;
  playbackSpeed: number;
  currentStep: number;
  traceEvents: SimulationEvent[];

  // Undo / Redo history
  past: HistorySnapshot[];
  future: HistorySnapshot[];

  // Actions
  setNodes: (nodes: BaseNode[]) => void;
  setEdges: (edges: BaseEdge[]) => void;
  addNode: (node: BaseNode) => void;
  updateNodeData: (id: string, data: Record<string, unknown>) => void;
  updateNodeStatus: (id: string, status: BaseNode["status"]) => void;
  removeNode: (id: string) => void;
  addEdge: (edge: BaseEdge) => void;
  removeEdge: (id: string) => void;

  selectNode: (id: string | null) => void;
  selectEdge: (id: string | null) => void;
  selectTraceEvent: (id: string | null) => void;

  setGridType: (gridType: GridType) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;

  setSimulationStatus: (status: SimulationStatus) => void;
  setPlaybackSpeed: (speed: number) => void;
  addTraceEvent: (event: SimulationEvent) => void;
  clearTraceEvents: () => void;
  resetSimulationState: () => void;

  undo: () => void;
  redo: () => void;
  resetToFixture: () => void;
}

export const INITIAL_FIXTURE_NODES: BaseNode[] = [
  {
    id: "node_ingress",
    type: "input",
    position: { x: 100, y: 150 },
    status: "idle",
    label: "Edge Gateway",
    description: "Cloudflare Ingress & Rate Limiter",
    data: {
      protocol: "HTTPS/3",
      rateLimitRps: 2500,
      authRequired: true,
      path: "/api/v1/telemetry",
    },
    ports: [
      { id: "out", name: "Out", type: "output", dataType: "RequestPayload" },
    ],
  },
  {
    id: "node_worker",
    type: "process",
    position: { x: 380, y: 150 },
    status: "idle",
    label: "Compute Worker",
    description: "Transformation Lambda",
    data: {
      concurrency: 8,
      timeoutMs: 3000,
      memoryMb: 1024,
      runtime: "NodeJS 20 LTS",
    },
    ports: [
      { id: "in", name: "In", type: "input", dataType: "RequestPayload" },
      { id: "out", name: "Out", type: "output", dataType: "ProcessedData" },
    ],
  },
  {
    id: "node_database",
    type: "database",
    position: { x: 660, y: 80 },
    status: "idle",
    label: "PostgreSQL Primary",
    description: "Transactional Storage",
    data: {
      engine: "PostgreSQL 16",
      connectionPool: 24,
      readReplicas: 2,
    },
    ports: [
      { id: "query", name: "Query", type: "input", dataType: "SQLQuery" },
      { id: "data", name: "Result", type: "output", dataType: "RowSet" },
    ],
  },
  {
    id: "node_egress",
    type: "output",
    position: { x: 660, y: 240 },
    status: "idle",
    label: "Client Response",
    description: "200 OK Telemetry Response",
    data: {
      format: "application/json",
      status: 200,
      compress: true,
    },
    ports: [
      { id: "in", name: "In", type: "input", dataType: "ProcessedData" },
    ],
  },
];

export const INITIAL_FIXTURE_EDGES: BaseEdge[] = [
  {
    id: "edge_ingress_worker",
    source: "node_ingress",
    target: "node_worker",
    sourceHandle: "out",
    targetHandle: "in",
    type: "bezier",
    status: "idle",
    label: "REST JSON",
    data: { protocol: "HTTP/2", latencyMs: 1.2 },
  },
  {
    id: "edge_worker_db",
    source: "node_worker",
    target: "node_database",
    sourceHandle: "out",
    targetHandle: "query",
    type: "bezier",
    status: "idle",
    label: "SQL Write",
    data: { pool: "primary", timeoutMs: 500 },
  },
  {
    id: "edge_worker_egress",
    source: "node_worker",
    target: "node_egress",
    sourceHandle: "out",
    targetHandle: "in",
    type: "bezier",
    status: "idle",
    label: "Response Stream",
    data: { gzip: true },
  },
];

export const useGraphEditorStore = create<GraphEditorState>((set, get) => ({
  documentId: "doc_reference_studio",
  title: "Engineering Telemetry Pipeline",
  nodes: INITIAL_FIXTURE_NODES,
  edges: INITIAL_FIXTURE_EDGES,

  selectedNodeId: "node_ingress",
  selectedEdgeId: null,
  selectedTraceEventId: null,
  gridType: "dots",
  snapToGrid: true,
  isInspectorOpen: true,

  simulationStatus: "idle",
  playbackSpeed: 1.0,
  currentStep: 0,
  traceEvents: [],

  past: [],
  future: [],

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  addNode: (node) => {
    const { nodes, edges, past } = get();
    set({
      past: [...past, { nodes, edges }],
      future: [],
      nodes: [...nodes, node],
      selectedNodeId: node.id,
      selectedEdgeId: null,
    });
  },

  updateNodeData: (id, partialData) => {
    const { nodes } = get();
    set({
      nodes: nodes.map((n) =>
        n.id === id ? { ...n, data: { ...n.data, ...partialData } } : n
      ),
    });
  },

  updateNodeStatus: (id, status) => {
    const { nodes } = get();
    set({
      nodes: nodes.map((n) => (n.id === id ? { ...n, status } : n)),
    });
  },

  removeNode: (id) => {
    const { nodes, edges, past } = get();
    set({
      past: [...past, { nodes, edges }],
      future: [],
      nodes: nodes.filter((n) => n.id !== id),
      edges: edges.filter((e) => e.source !== id && e.target !== id),
      selectedNodeId: null,
    });
  },

  addEdge: (edge) => {
    const { nodes, edges, past } = get();
    set({
      past: [...past, { nodes, edges }],
      future: [],
      edges: [...edges, edge],
    });
  },

  removeEdge: (id) => {
    const { nodes, edges, past } = get();
    set({
      past: [...past, { nodes, edges }],
      future: [],
      edges: edges.filter((e) => e.id !== id),
      selectedEdgeId: null,
    });
  },

  selectNode: (id) =>
    set({ selectedNodeId: id, selectedEdgeId: null }),
  selectEdge: (id) =>
    set({ selectedEdgeId: id, selectedNodeId: null }),
  selectTraceEvent: (id) => set({ selectedTraceEventId: id }),

  setGridType: (gridType) => set({ gridType }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  setInspectorOpen: (isInspectorOpen) => set({ isInspectorOpen }),
  toggleInspector: () => set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),

  setSimulationStatus: (simulationStatus) => set({ simulationStatus }),
  setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),
  addTraceEvent: (event) =>
    set((s) => ({
      traceEvents: [...s.traceEvents, event],
      currentStep: event.step,
    })),
  clearTraceEvents: () => set({ traceEvents: [], currentStep: 0 }),
  resetSimulationState: () => {
    const { nodes, edges } = get();
    set({
      simulationStatus: "idle",
      currentStep: 0,
      traceEvents: [],
      selectedTraceEventId: null,
      nodes: nodes.map((n) => ({ ...n, status: "idle" })),
      edges: edges.map((e) => ({ ...e, status: "idle" })),
    });
  },

  undo: () => {
    const { past, future, nodes, edges } = get();
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    set({
      past: newPast,
      future: [{ nodes, edges }, ...future],
      nodes: previous.nodes,
      edges: previous.edges,
    });
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    set({
      past: [...past, { nodes, edges }],
      future: newFuture,
      nodes: next.nodes,
      edges: next.edges,
    });
  },

  resetToFixture: () => {
    set({
      nodes: INITIAL_FIXTURE_NODES,
      edges: INITIAL_FIXTURE_EDGES,
      selectedNodeId: "node_ingress",
      selectedEdgeId: null,
      selectedTraceEventId: null,
      simulationStatus: "idle",
      currentStep: 0,
      traceEvents: [],
      past: [],
      future: [],
    });
  },
}));
