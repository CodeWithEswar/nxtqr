import { create } from "zustand";
import {
  loadLayoutPreferences,
  saveLayoutPreferences,
  resetStoredLayoutPreferences,
} from "../lib/layout-storage";

export interface ShellStoreState {
  // Sidebar state
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  isDraggingSidebar: boolean;

  // Modals & Drawers
  mobileNavOpen: boolean;
  commandPaletteOpen: boolean;

  // Workspace panels state
  secondaryPanelOpen: boolean;
  workspacePanelSizes: number[];
  bottomPanelOpen: boolean;
  bottomPanelSize: number;

  // Active workspace / project identity
  activeWorkspaceId: string;
  activeWorkspaceName: string;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  setIsDraggingSidebar: (isDragging: boolean) => void;

  setMobileNavOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;

  toggleSecondaryPanel: () => void;
  setSecondaryPanelOpen: (open: boolean) => void;
  setWorkspacePanelSizes: (sizes: number[]) => void;

  toggleBottomPanel: () => void;
  setBottomPanelOpen: (open: boolean) => void;
  setBottomPanelSize: (size: number) => void;

  resetWorkspaceLayout: () => void;
  initializeFromStorage: () => void;
}

export const useShellStore = create<ShellStoreState>((set, get) => {
  // Safe initial state (SSR-friendly)
  return {
    sidebarCollapsed: false,
    sidebarWidth: 248,
    isDraggingSidebar: false,

    mobileNavOpen: false,
    commandPaletteOpen: false,

    secondaryPanelOpen: false,
    workspacePanelSizes: [20, 60, 20],
    bottomPanelOpen: false,
    bottomPanelSize: 25,

    activeWorkspaceId: "default",
    activeWorkspaceName: "Engineering Studio",

    toggleSidebar: () => {
      const next = !get().sidebarCollapsed;
      set({ sidebarCollapsed: next });
      saveLayoutPreferences({ sidebarCollapsed: next });
    },

    setSidebarCollapsed: (collapsed) => {
      set({ sidebarCollapsed: collapsed });
      saveLayoutPreferences({ sidebarCollapsed: collapsed });
    },

    setSidebarWidth: (width) => {
      const clamped = Math.max(208, Math.min(360, width));
      set({ sidebarWidth: clamped });
      saveLayoutPreferences({ sidebarWidth: clamped });
    },

    setIsDraggingSidebar: (isDragging) => {
      set({ isDraggingSidebar: isDragging });
    },

    setMobileNavOpen: (open) => {
      set({ mobileNavOpen: open });
    },

    setCommandPaletteOpen: (open) => {
      set({ commandPaletteOpen: open });
    },

    toggleSecondaryPanel: () => {
      const next = !get().secondaryPanelOpen;
      set({ secondaryPanelOpen: next });
      saveLayoutPreferences({ secondaryPanelOpen: next });
    },

    setSecondaryPanelOpen: (open) => {
      set({ secondaryPanelOpen: open });
      saveLayoutPreferences({ secondaryPanelOpen: open });
    },

    setWorkspacePanelSizes: (sizes) => {
      set({ workspacePanelSizes: sizes });
      saveLayoutPreferences({ panelSizes: sizes });
    },

    toggleBottomPanel: () => {
      const next = !get().bottomPanelOpen;
      set({ bottomPanelOpen: next });
      saveLayoutPreferences({ bottomPanelOpen: next });
    },

    setBottomPanelOpen: (open) => {
      set({ bottomPanelOpen: open });
      saveLayoutPreferences({ bottomPanelOpen: open });
    },

    setBottomPanelSize: (size) => {
      set({ bottomPanelSize: size });
      saveLayoutPreferences({ bottomPanelSize: size });
    },

    resetWorkspaceLayout: () => {
      const defaults = resetStoredLayoutPreferences();
      set({
        sidebarWidth: defaults.sidebarWidth,
        sidebarCollapsed: defaults.sidebarCollapsed,
        secondaryPanelOpen: defaults.secondaryPanelOpen,
        workspacePanelSizes: defaults.panelSizes,
        bottomPanelOpen: defaults.bottomPanelOpen,
        bottomPanelSize: defaults.bottomPanelSize,
      });
    },

    initializeFromStorage: () => {
      const stored = loadLayoutPreferences();
      set({
        sidebarWidth: stored.sidebarWidth,
        sidebarCollapsed: stored.sidebarCollapsed,
        secondaryPanelOpen: stored.secondaryPanelOpen,
        workspacePanelSizes: stored.panelSizes,
        bottomPanelOpen: stored.bottomPanelOpen,
        bottomPanelSize: stored.bottomPanelSize,
      });
    },
  };
});

