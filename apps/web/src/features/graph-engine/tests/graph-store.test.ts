import { describe, it, expect, beforeEach } from "vitest";
import { useGraphEditorStore } from "../store/graph-editor-store";
import type { BaseNode } from "../schemas/graph.schema";

describe("Phase 04 — Graph Editor Zustand Store Integration", () => {
  beforeEach(() => {
    // Reset store to known fixture state
    useGraphEditorStore.setState({
      nodes: [
        {
          id: "test_node_1",
          type: "input",
          position: { x: 50, y: 50 },
          data: { name: "Test Ingress" },
          ports: [{ id: "out", name: "Out", type: "output" }],
        },
        {
          id: "test_node_2",
          type: "process",
          position: { x: 250, y: 50 },
          data: { name: "Test Worker" },
          ports: [
            { id: "in", name: "In", type: "input" },
            { id: "out", name: "Out", type: "output" },
          ],
        },
      ],
      edges: [
        {
          id: "test_edge_1",
          source: "test_node_1",
          target: "test_node_2",
          sourceHandle: "out",
          targetHandle: "in",
          data: {},
        },
      ],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      toolMode: "select",
      autosaveStatus: "saved",
      canUndo: false,
      canRedo: false,
    });
  });

  it("handles single selection and multi-selection properly", () => {
    const store = useGraphEditorStore.getState();

    // Single select
    store.selectNode("test_node_1");
    expect(useGraphEditorStore.getState().selectedNodeIds).toEqual(["test_node_1"]);

    // Single select another replaces selection
    store.selectNode("test_node_2");
    expect(useGraphEditorStore.getState().selectedNodeIds).toEqual(["test_node_2"]);

    // Multi-select toggles
    store.selectNode("test_node_1", true);
    expect(useGraphEditorStore.getState().selectedNodeIds).toContain("test_node_1");
    expect(useGraphEditorStore.getState().selectedNodeIds).toContain("test_node_2");

    // Select all
    store.selectAll();
    expect(useGraphEditorStore.getState().selectedNodeIds).toHaveLength(2);

    // Clear selection
    store.clearSelection();
    expect(useGraphEditorStore.getState().selectedNodeIds).toHaveLength(0);
  });

  it("adds a node with command history and marks autosave dirty", () => {
    const store = useGraphEditorStore.getState();

    const newNode: BaseNode = {
      id: "test_node_3",
      type: "output",
      position: { x: 450, y: 50 },
      data: { name: "Test Egress" },
    };

    store.addNode(newNode);

    const stateAfterAdd = useGraphEditorStore.getState();
    expect(stateAfterAdd.nodes).toHaveLength(3);
    expect(stateAfterAdd.selectedNodeIds).toEqual(["test_node_3"]);
    expect(stateAfterAdd.canUndo).toBe(true);
    expect(stateAfterAdd.autosaveStatus).toBe("unsaved_changes");

    // Undo add
    stateAfterAdd.undo();
    const stateAfterUndo = useGraphEditorStore.getState();
    expect(stateAfterUndo.nodes).toHaveLength(2);
    expect(stateAfterUndo.canRedo).toBe(true);

    // Redo add
    stateAfterUndo.redo();
    expect(useGraphEditorStore.getState().nodes).toHaveLength(3);
  });

  it("deletes selected nodes and their incident edges through command history", () => {
    const store = useGraphEditorStore.getState();

    store.selectNode("test_node_1");
    store.deleteSelected();

    const stateAfterDelete = useGraphEditorStore.getState();
    expect(stateAfterDelete.nodes).toHaveLength(1);
    expect(stateAfterDelete.nodes[0].id).toBe("test_node_2");
    // Incident edge should be deleted
    expect(stateAfterDelete.edges).toHaveLength(0);
    expect(stateAfterDelete.canUndo).toBe(true);

    // Undo delete restores node AND edge
    stateAfterDelete.undo();
    const stateAfterUndo = useGraphEditorStore.getState();
    expect(stateAfterUndo.nodes).toHaveLength(2);
    expect(stateAfterUndo.edges).toHaveLength(1);
  });

  it("updates node configuration with undo/redo capability", () => {
    const store = useGraphEditorStore.getState();

    store.updateNodeConfig("test_node_1", {
      label: "Renamed Ingress Gateway",
      data: { protocol: "HTTP/3", port: 443 },
    });

    const updatedNode = useGraphEditorStore.getState().nodes.find((n) => n.id === "test_node_1");
    expect(updatedNode?.label).toBe("Renamed Ingress Gateway");
    expect(updatedNode?.data.protocol).toBe("HTTP/3");

    // Undo
    useGraphEditorStore.getState().undo();
    const revertedNode = useGraphEditorStore.getState().nodes.find((n) => n.id === "test_node_1");
    expect(revertedNode?.label).not.toBe("Renamed Ingress Gateway");
  });

  it("toggles tool mode between select and pan", () => {
    const store = useGraphEditorStore.getState();
    expect(store.toolMode).toBe("select");

    store.setToolMode("pan");
    expect(useGraphEditorStore.getState().toolMode).toBe("pan");

    store.setToolMode("select");
    expect(useGraphEditorStore.getState().toolMode).toBe("select");
  });
});

