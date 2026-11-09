import { describe, it, expect, beforeEach } from "vitest";
import { useGraphEditorStore } from "../store/graph-editor-store";

describe("Graph Editor — Resizable Workspace Panels", () => {
  beforeEach(() => {
    useGraphEditorStore.getState().resetPanelWidths();
  });

  it("initializes with default panel widths", () => {
    const store = useGraphEditorStore.getState();
    expect(store.nodeLibraryWidth).toBe(280);
    expect(store.inspectorWidth).toBe(320);
  });

  it("clamps and sets node library width between 220px and 480px", () => {
    const store = useGraphEditorStore.getState();

    // Below minimum clamp
    store.setNodeLibraryWidth(150);
    expect(useGraphEditorStore.getState().nodeLibraryWidth).toBe(220);

    // Above maximum clamp
    store.setNodeLibraryWidth(900);
    expect(useGraphEditorStore.getState().nodeLibraryWidth).toBe(480);

    // Valid intermediate width
    store.setNodeLibraryWidth(350);
    expect(useGraphEditorStore.getState().nodeLibraryWidth).toBe(350);
  });

  it("clamps and sets inspector width between 260px and 540px", () => {
    const store = useGraphEditorStore.getState();

    // Below minimum clamp
    store.setInspectorWidth(180);
    expect(useGraphEditorStore.getState().inspectorWidth).toBe(260);

    // Above maximum clamp
    store.setInspectorWidth(1200);
    expect(useGraphEditorStore.getState().inspectorWidth).toBe(540);

    // Valid intermediate width
    store.setInspectorWidth(420);
    expect(useGraphEditorStore.getState().inspectorWidth).toBe(420);
  });

  it("resets panel widths back to default values cleanly", () => {
    const store = useGraphEditorStore.getState();

    store.setNodeLibraryWidth(400);
    store.setInspectorWidth(450);
    expect(useGraphEditorStore.getState().nodeLibraryWidth).toBe(400);
    expect(useGraphEditorStore.getState().inspectorWidth).toBe(450);

    store.resetPanelWidths();
    expect(useGraphEditorStore.getState().nodeLibraryWidth).toBe(280);
    expect(useGraphEditorStore.getState().inspectorWidth).toBe(320);
  });
});
