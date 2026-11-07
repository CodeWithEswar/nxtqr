import { create } from "zustand";

export type CanvasToolMode = "select" | "pan" | "connect" | "inspect";

export interface CanvasUIStoreState {
  toolMode: CanvasToolMode;
  isInspectorOpen: boolean;
  zoomLevel: number;
  isGridVisible: boolean;
  selectedNodeIds: string[];
  selectedEdgeIds: string[];
  setToolMode: (mode: CanvasToolMode) => void;
  toggleInspector: () => void;
  setInspectorOpen: (open: boolean) => void;
  setZoomLevel: (zoom: number) => void;
  toggleGrid: () => void;
  setSelectedNodes: (ids: string[]) => void;
  setSelectedEdges: (ids: string[]) => void;
  clearSelection: () => void;
}

export const useCanvasUIStore = create<CanvasUIStoreState>((set) => ({
  toolMode: "select",
  isInspectorOpen: true,
  zoomLevel: 1.0,
  isGridVisible: true,
  selectedNodeIds: [],
  selectedEdgeIds: [],

  setToolMode: (toolMode) => set({ toolMode }),
  toggleInspector: () => set((s) => ({ isInspectorOpen: !s.isInspectorOpen })),
  setInspectorOpen: (isInspectorOpen) => set({ isInspectorOpen }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel: Math.max(0.1, Math.min(3.0, zoomLevel)) }),
  toggleGrid: () => set((s) => ({ isGridVisible: !s.isGridVisible })),
  setSelectedNodes: (selectedNodeIds) => set({ selectedNodeIds }),
  setSelectedEdges: (selectedEdgeIds) => set({ selectedEdgeIds }),
  clearSelection: () => set({ selectedNodeIds: [], selectedEdgeIds: [] }),
}));
