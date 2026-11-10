import { create } from "zustand";
import type {
  BaseNode,
  BaseEdge,
  CanvasViewport,
  GraphDocument,
  NodePosition,
} from "../schemas/graph.schema";
import { HistoryService } from "../services/history-service";
import {
  AddNodeCommand,
  DeleteNodesCommand,
  MoveNodesCommand,
  AddEdgeCommand,
  DeleteEdgeCommand,
  UpdateNodeConfigCommand,
  AutoLayoutCommand,
  ApplyWhatIfPlanCommand,
  type GraphCommandContext,
} from "../domain/graph-commands";
import { GraphProposalApplier, type WhatIfPlan } from "@nxtqr/architecture-intelligence";
import {
  copyGraphSelection,
  getClipboardData,
  preparePastedEntities,
} from "../services/clipboard-service";
import { computeElkLayout, type LayoutDirection } from "../services/layout-service";

export type ToolMode = "select" | "pan";
export type GridType = "dots" | "lines" | "none";
export type AutosaveStatus = "saved" | "saving" | "unsaved_changes" | "error";

export interface GraphEditorState {
  // Document state
  documentId: string;
  projectId: string | null;
  visualizerType: string;
  title: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  viewport: CanvasViewport;
  metadata: Record<string, unknown>;

  // Selection state
  selectedNodeIds: string[];
  selectedEdgeIds: string[];

  // Ephemeral editor settings
  toolMode: ToolMode;
  gridType: GridType;
  snapToGrid: boolean;
  showMinimap: boolean;
  isInspectorOpen: boolean;
  isNodeLibraryOpen: boolean;
  isValidationOpen: boolean;
  isHealthOpen: boolean;
  isBottlenecksOpen: boolean;
  isFailureAnalysisOpen: boolean;
  isSecurityOpen: boolean;
  isScalabilityOpen: boolean;
  nodeLibraryWidth: number;
  inspectorWidth: number;
  validationPanelWidth: number;
  healthPanelWidth: number;
  bottlenecksPanelWidth: number;
  failureAnalysisPanelWidth: number;
  securityPanelWidth: number;
  scalabilityPanelWidth: number;
  activeScenarioId: string;
  activeWhatIfPlan: WhatIfPlan | null;
  autosaveStatus: AutosaveStatus;

  // History state indicators
  canUndo: boolean;
  canRedo: boolean;

  // Core Actions
  loadDocument: (doc: GraphDocument, projectId?: string | null) => void;
  setNodesRaw: (nodes: BaseNode[]) => void;
  setEdgesRaw: (edges: BaseEdge[]) => void;
  setViewport: (viewport: CanvasViewport) => void;

  // Tool & UI Toggles
  setToolMode: (mode: ToolMode) => void;
  setGridType: (type: GridType) => void;
  setSnapToGrid: (enabled: boolean) => void;
  setShowMinimap: (show: boolean) => void;
  toggleMinimap: () => void;
  setInspectorOpen: (open: boolean) => void;
  toggleInspector: () => void;
  setValidationOpen: (open: boolean) => void;
  toggleValidation: () => void;
  setHealthOpen: (open: boolean) => void;
  toggleHealth: () => void;
  setBottlenecksOpen: (open: boolean) => void;
  toggleBottlenecks: () => void;
  setFailureAnalysisOpen: (open: boolean) => void;
  toggleFailureAnalysis: () => void;
  setSecurityOpen: (open: boolean) => void;
  toggleSecurity: () => void;
  setScalabilityOpen: (open: boolean) => void;
  toggleScalability: () => void;
  setNodeLibraryOpen: (open: boolean) => void;
  toggleNodeLibrary: () => void;
  setNodeLibraryWidth: (width: number) => void;
  setInspectorWidth: (width: number) => void;
  setValidationPanelWidth: (width: number) => void;
  setHealthPanelWidth: (width: number) => void;
  setBottlenecksPanelWidth: (width: number) => void;
  setFailureAnalysisPanelWidth: (width: number) => void;
  setSecurityPanelWidth: (width: number) => void;
  setScalabilityPanelWidth: (width: number) => void;
  setActiveScenarioId: (scenarioId: string) => void;
  setActiveWhatIfPlan: (plan: WhatIfPlan | null) => void;
  applyWhatIfPlan: (plan: WhatIfPlan) => void;
  resetPanelWidths: () => void;
  setAutosaveStatus: (status: AutosaveStatus) => void;

  // Selection
  selectNode: (id: string | null, multi?: boolean) => void;
  selectNodes: (ids: string[]) => void;
  selectEdge: (id: string | null, multi?: boolean) => void;
  selectAll: () => void;
  clearSelection: () => void;

  // Command-driven operations (with history)
  addNode: (node: BaseNode) => void;
  deleteSelected: () => void;
  deleteNodeById: (id: string) => void;
  moveNodesBatch: (moves: { nodeId: string; from: NodePosition; to: NodePosition }[]) => void;
  addEdge: (edge: BaseEdge) => void;
  deleteEdgeById: (id: string) => void;
  updateNodeConfig: (
    id: string,
    config: { label?: string; description?: string; data: Record<string, unknown> },
  ) => void;
  applyAutoLayout: (direction?: LayoutDirection) => Promise<void>;
  copySelected: () => void;
  pasteClipboard: () => void;
  duplicateSelected: () => void;

  // Undo / Redo
  undo: () => void;
  redo: () => void;
}

// Initial fixture nodes for foundational graph demonstration
export const DEFAULT_FOUNDATION_NODES: BaseNode[] = [
  {
    id: "node_input_1",
    type: "input",
    position: { x: 120, y: 160 },
    dimensions: { width: 200, height: 80 },
    status: "idle",
    label: "Ingress Source",
    description: "Primary HTTP/gRPC ingress",
    data: { name: "Ingress Gateway", protocol: "HTTPS" },
    ports: [{ id: "out", name: "Out", type: "output", dataType: "Any" }],
  },
  {
    id: "node_process_1",
    type: "process",
    position: { x: 420, y: 160 },
    dimensions: { width: 200, height: 80 },
    status: "idle",
    label: "Transformation Worker",
    description: "Payload normalizer & validator",
    data: { name: "Worker 01", concurrency: 4 },
    ports: [
      { id: "in", name: "In", type: "input", dataType: "Any" },
      { id: "out", name: "Out", type: "output", dataType: "Any" },
    ],
  },
  {
    id: "node_output_1",
    type: "output",
    position: { x: 720, y: 160 },
    dimensions: { width: 200, height: 80 },
    status: "idle",
    label: "Telemetry Sink",
    description: "Persistent trace storage",
    data: { name: "Sink Egress", persistResult: true },
    ports: [{ id: "in", name: "In", type: "input", dataType: "Any" }],
  },
];

export const DEFAULT_FOUNDATION_EDGES: BaseEdge[] = [
  {
    id: "edge_in_proc",
    source: "node_input_1",
    target: "node_process_1",
    sourceHandle: "out",
    targetHandle: "in",
    type: "bezier",
    status: "idle",
    label: "Raw Stream",
    data: {},
  },
  {
    id: "edge_proc_out",
    source: "node_process_1",
    target: "node_output_1",
    sourceHandle: "out",
    targetHandle: "in",
    type: "bezier",
    status: "idle",
    label: "Normalized",
    data: {},
  },
];

const history = new HistoryService();

export const useGraphEditorStore = create<GraphEditorState>((set, get) => {
  const getCommandContext = (): GraphCommandContext => ({
    getNodes: () => get().nodes,
    setNodes: (nodes) =>
      set({
        nodes,
        autosaveStatus: "unsaved_changes",
      }),
    getEdges: () => get().edges,
    setEdges: (edges) =>
      set({
        edges,
        autosaveStatus: "unsaved_changes",
      }),
    selectNodes: (ids) => set({ selectedNodeIds: ids }),
  });

  const syncHistoryState = () => {
    set({
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  };

  return {
    documentId: "doc_foundation_studio",
    projectId: null,
    visualizerType: "generic",
    title: "Engineering Graph Architecture",
    nodes: DEFAULT_FOUNDATION_NODES,
    edges: DEFAULT_FOUNDATION_EDGES,
    viewport: { x: 0, y: 0, zoom: 1.0 },
    metadata: {},

    selectedNodeIds: ["node_input_1"],
    selectedEdgeIds: [],

    toolMode: "select",
    gridType: "dots",
    snapToGrid: true,
    showMinimap: true,
    isInspectorOpen: true,
    isNodeLibraryOpen: true,
    isValidationOpen: false,
    isHealthOpen: false,
    isBottlenecksOpen: false,
    isFailureAnalysisOpen: false,
    isSecurityOpen: false,
    isScalabilityOpen: false,
    nodeLibraryWidth: 280,
    inspectorWidth: 320,
    validationPanelWidth: 320,
    healthPanelWidth: 340,
    bottlenecksPanelWidth: 360,
    failureAnalysisPanelWidth: 360,
    securityPanelWidth: 380,
    scalabilityPanelWidth: 380,
    activeScenarioId: "normal_traffic",
    activeWhatIfPlan: null,
    autosaveStatus: "saved",

    canUndo: false,
    canRedo: false,

    loadDocument: (doc, projectId = null) => {
      history.clear();
      set({
        documentId: doc.id,
        projectId: projectId ?? get().projectId,
        visualizerType: doc.visualizerType ?? "generic",
        title: doc.title,
        nodes: doc.nodes ?? [],
        edges: doc.edges ?? [],
        viewport: doc.viewport ?? { x: 0, y: 0, zoom: 1.0 },
        metadata: doc.metadata ?? {},
        selectedNodeIds: [],
        selectedEdgeIds: [],
        autosaveStatus: "saved",
        canUndo: false,
        canRedo: false,
      });
    },

    setNodesRaw: (nodes) => set({ nodes }),
    setEdgesRaw: (edges) => set({ edges }),
    setViewport: (viewport) => set({ viewport }),

    setToolMode: (mode) => set({ toolMode: mode }),
    setGridType: (type) => set({ gridType: type }),
    setSnapToGrid: (snap) => set({ snapToGrid: snap }),
    setShowMinimap: (show) => set({ showMinimap: show }),
    toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
    setInspectorOpen: (open) => set({ isInspectorOpen: open }),
    toggleInspector: () => set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),
    setValidationOpen: (open) => set({ isValidationOpen: open }),
    toggleValidation: () => set((s) => ({ isValidationOpen: !s.isValidationOpen })),
    setHealthOpen: (open) => set({ isHealthOpen: open }),
    toggleHealth: () => set((s) => ({ isHealthOpen: !s.isHealthOpen })),
    setBottlenecksOpen: (open) => set({ isBottlenecksOpen: open }),
    toggleBottlenecks: () => set((s) => ({ isBottlenecksOpen: !s.isBottlenecksOpen })),
    setFailureAnalysisOpen: (open) => set({ isFailureAnalysisOpen: open }),
    toggleFailureAnalysis: () => set((s) => ({ isFailureAnalysisOpen: !s.isFailureAnalysisOpen })),
    setSecurityOpen: (open) => set({ isSecurityOpen: open }),
    toggleSecurity: () => set((s) => ({ isSecurityOpen: !s.isSecurityOpen })),
    setScalabilityOpen: (open) => set({ isScalabilityOpen: open }),
    toggleScalability: () => set((s) => ({ isScalabilityOpen: !s.isScalabilityOpen })),
    setNodeLibraryOpen: (open) => set({ isNodeLibraryOpen: open }),
    toggleNodeLibrary: () => set((s) => ({ isNodeLibraryOpen: !s.isNodeLibraryOpen })),
    setNodeLibraryWidth: (width) => {
      const clamped = Math.max(220, Math.min(480, width));
      set({ nodeLibraryWidth: clamped });
    },
    setInspectorWidth: (width) => {
      const clamped = Math.max(260, Math.min(540, width));
      set({ inspectorWidth: clamped });
    },
    setValidationPanelWidth: (width) => {
      const clamped = Math.max(260, Math.min(540, width));
      set({ validationPanelWidth: clamped });
    },
    setHealthPanelWidth: (width) => {
      const clamped = Math.max(260, Math.min(540, width));
      set({ healthPanelWidth: clamped });
    },
    setBottlenecksPanelWidth: (width) => {
      const clamped = Math.max(280, Math.min(600, width));
      set({ bottlenecksPanelWidth: clamped });
    },
    setFailureAnalysisPanelWidth: (width) => {
      const clamped = Math.max(280, Math.min(600, width));
      set({ failureAnalysisPanelWidth: clamped });
    },
    setSecurityPanelWidth: (width) => {
      const clamped = Math.max(280, Math.min(600, width));
      set({ securityPanelWidth: clamped });
    },
    setScalabilityPanelWidth: (width) => {
      const clamped = Math.max(280, Math.min(600, width));
      set({ scalabilityPanelWidth: clamped });
    },
    setActiveScenarioId: (scenarioId) => set({ activeScenarioId: scenarioId }),
    setActiveWhatIfPlan: (plan) => set({ activeWhatIfPlan: plan }),
    applyWhatIfPlan: (plan) => {
      const { nodes, edges } = get();
      const result = GraphProposalApplier.applyOperations(nodes, edges, plan.operations);
      const cmd = new ApplyWhatIfPlanCommand(
        nodes,
        edges,
        result.nodes,
        result.edges,
        plan.title,
      );
      history.execute(cmd, getCommandContext());
      set({ activeWhatIfPlan: null });
      syncHistoryState();
    },
    resetPanelWidths: () => set({ nodeLibraryWidth: 280, inspectorWidth: 320, validationPanelWidth: 320, healthPanelWidth: 340, bottlenecksPanelWidth: 360, failureAnalysisPanelWidth: 360, securityPanelWidth: 380, scalabilityPanelWidth: 380 }),
    setAutosaveStatus: (status) => set({ autosaveStatus: status }),

    selectNode: (id, multi = false) => {
      if (!id) {
        set({ selectedNodeIds: [], selectedEdgeIds: [] });
        return;
      }
      set((state) => {
        if (multi) {
          const exists = state.selectedNodeIds.includes(id);
          const next = exists
            ? state.selectedNodeIds.filter((nId) => nId !== id)
            : [...state.selectedNodeIds, id];
          return { selectedNodeIds: next, selectedEdgeIds: [] };
        }
        return { selectedNodeIds: [id], selectedEdgeIds: [] };
      });
    },

    selectNodes: (ids) => set({ selectedNodeIds: ids, selectedEdgeIds: [] }),

    selectEdge: (id, multi = false) => {
      if (!id) {
        set({ selectedEdgeIds: [] });
        return;
      }
      set((state) => {
        if (multi) {
          const exists = state.selectedEdgeIds.includes(id);
          const next = exists
            ? state.selectedEdgeIds.filter((eId) => eId !== id)
            : [...state.selectedEdgeIds, id];
          return { selectedEdgeIds: next };
        }
        return { selectedEdgeIds: [id], selectedNodeIds: [] };
      });
    },

    selectAll: () => {
      const { nodes } = get();
      set({
        selectedNodeIds: nodes.map((n) => n.id),
        selectedEdgeIds: [],
      });
    },

    clearSelection: () => set({ selectedNodeIds: [], selectedEdgeIds: [] }),

    addNode: (node) => {
      const cmd = new AddNodeCommand(node);
      history.execute(cmd, getCommandContext());
      syncHistoryState();
    },

    deleteSelected: () => {
      const { selectedNodeIds, selectedEdgeIds } = get();
      const ctx = getCommandContext();

      if (selectedNodeIds.length > 0) {
        const cmd = new DeleteNodesCommand(selectedNodeIds);
        history.execute(cmd, ctx);
      }

      if (selectedEdgeIds.length > 0) {
        for (const edgeId of selectedEdgeIds) {
          const cmd = new DeleteEdgeCommand(edgeId);
          history.execute(cmd, ctx);
        }
      }

      set({ selectedNodeIds: [], selectedEdgeIds: [] });
      syncHistoryState();
    },

    deleteNodeById: (id) => {
      const cmd = new DeleteNodesCommand([id]);
      history.execute(cmd, getCommandContext());
      syncHistoryState();
    },

    moveNodesBatch: (moves) => {
      if (moves.length === 0) return;
      const cmd = new MoveNodesCommand(moves);
      history.execute(cmd, getCommandContext());
      syncHistoryState();
    },

    addEdge: (edge) => {
      const cmd = new AddEdgeCommand(edge);
      history.execute(cmd, getCommandContext());
      syncHistoryState();
    },

    deleteEdgeById: (id) => {
      const cmd = new DeleteEdgeCommand(id);
      history.execute(cmd, getCommandContext());
      syncHistoryState();
    },

    updateNodeConfig: (id, config) => {
      const node = get().nodes.find((n) => n.id === id);
      if (!node) return;

      const prevConfig = {
        label: node.label,
        description: node.description,
        data: { ...node.data },
      };

      const cmd = new UpdateNodeConfigCommand(id, prevConfig, config);
      history.execute(cmd, getCommandContext());
      syncHistoryState();
    },

    applyAutoLayout: async (direction = "LR") => {
      const { nodes, edges } = get();
      if (nodes.length === 0) return;

      const prevPositions = new Map<string, NodePosition>();
      nodes.forEach((n) => prevPositions.set(n.id, { ...n.position }));

      const nextPositions = await computeElkLayout(nodes, edges, { direction });
      const cmd = new AutoLayoutCommand(prevPositions, nextPositions);
      history.execute(cmd, getCommandContext());
      syncHistoryState();
    },

    copySelected: () => {
      const { selectedNodeIds, nodes, edges } = get();
      copyGraphSelection(selectedNodeIds, nodes, edges);
    },

    pasteClipboard: () => {
      const clip = getClipboardData();
      if (!clip || clip.nodes.length === 0) return;

      const { nodes: newNodes, edges: newEdges } = preparePastedEntities(clip);
      const ctx = getCommandContext();

      for (const node of newNodes) {
        const cmd = new AddNodeCommand(node);
        history.execute(cmd, ctx);
      }
      for (const edge of newEdges) {
        const cmd = new AddEdgeCommand(edge);
        history.execute(cmd, ctx);
      }

      set({ selectedNodeIds: newNodes.map((n) => n.id) });
      syncHistoryState();
    },

    duplicateSelected: () => {
      const { selectedNodeIds, nodes, edges } = get();
      const clip = copyGraphSelection(selectedNodeIds, nodes, edges);
      if (!clip) return;

      const { nodes: newNodes, edges: newEdges } = preparePastedEntities(clip);
      const ctx = getCommandContext();

      for (const node of newNodes) {
        const cmd = new AddNodeCommand(node);
        history.execute(cmd, ctx);
      }
      for (const edge of newEdges) {
        const cmd = new AddEdgeCommand(edge);
        history.execute(cmd, ctx);
      }

      set({ selectedNodeIds: newNodes.map((n) => n.id) });
      syncHistoryState();
    },

    undo: () => {
      history.undo(getCommandContext());
      syncHistoryState();
    },

    redo: () => {
      history.redo(getCommandContext());
      syncHistoryState();
    },
  };
});

