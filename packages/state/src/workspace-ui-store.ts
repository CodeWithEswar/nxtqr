import { create } from "zustand";

export interface WorkspaceUIStoreState {
  sidebarCollapsed: boolean;
  commandPaletteOpen: boolean;
  activeModal: string | null;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
}

export const useWorkspaceUIStore = create<WorkspaceUIStoreState>((set) => ({
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  activeModal: null,

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  openModal: (modalId) => set({ activeModal: modalId }),
  closeModal: () => set({ activeModal: null }),
}));
