import { describe, it, expect, beforeEach } from "vitest";
import { validatePortConnection } from "../domain/port-validator";
import { HistoryService } from "../services/history-service";
import {
  AddNodeCommand,
  DeleteNodesCommand,
  MoveNodesCommand,
  type GraphCommandContext,
} from "../domain/graph-commands";
import {
  copyGraphSelection,
  preparePastedEntities,
} from "../services/clipboard-service";
import type { BaseNode, BaseEdge } from "../schemas/graph.schema";

describe("Phase 04 — Graph Engine Domain & Services", () => {
  let mockNodes: BaseNode[];
  let mockEdges: BaseEdge[];

  beforeEach(() => {
    mockNodes = [
      {
        id: "node_1",
        type: "input",
        position: { x: 100, y: 100 },
        data: { label: "Ingress" },
        ports: [
          { id: "in", name: "In", type: "input" },
          { id: "out", name: "Out", type: "output" },
        ],
      },
      {
        id: "node_2",
        type: "process",
        position: { x: 300, y: 100 },
        data: { label: "Worker" },
        ports: [
          { id: "in", name: "In", type: "input", capacity: 1 },
          { id: "out", name: "Out", type: "output" },
        ],
      },
      {
        id: "node_3",
        type: "output",
        position: { x: 500, y: 100 },
        data: { label: "Egress" },
        ports: [{ id: "in", name: "In", type: "input" }],
      },
    ];

    mockEdges = [
      {
        id: "edge_1_2",
        source: "node_1",
        target: "node_2",
        sourceHandle: "out",
        targetHandle: "in",
        data: {},
      },
    ];
  });

  describe("Port & Connection Validator", () => {
    it("disallows self-connections by default", () => {
      const res = validatePortConnection({
        sourceNodeId: "node_1",
        targetNodeId: "node_1",
        nodes: mockNodes,
        edges: mockEdges,
      });

      expect(res.valid).toBe(false);
      expect(res.reason).toContain("Self-connections are not allowed");
    });

    it("prevents duplicate edges between the same source and target ports", () => {
      const res = validatePortConnection({
        sourceNodeId: "node_1",
        targetNodeId: "node_2",
        sourceHandleId: "out",
        targetHandleId: "in",
        nodes: mockNodes,
        edges: mockEdges,
      });

      expect(res.valid).toBe(false);
      expect(res.reason).toContain("identical connection");
    });

    it("prevents outbound connection from an input port", () => {
      const res = validatePortConnection({
        sourceNodeId: "node_2",
        targetNodeId: "node_3",
        sourceHandleId: "in", // invalid: input port as source
        targetHandleId: "in",
        nodes: mockNodes,
        edges: mockEdges,
      });

      expect(res.valid).toBe(false);
      expect(res.reason).toContain("cannot be an outbound source");
    });

    it("enforces port capacity limits", () => {
      // node_2 target handle "in" already has 1 connection from node_1, capacity is 1
      const res = validatePortConnection({
        sourceNodeId: "node_3",
        targetNodeId: "node_2",
        sourceHandleId: "out",
        targetHandleId: "in",
        nodes: mockNodes,
        edges: mockEdges,
      });

      expect(res.valid).toBe(false);
      expect(res.reason).toContain("maximum capacity");
    });

    it("allows valid connection from output to available input", () => {
      const res = validatePortConnection({
        sourceNodeId: "node_2",
        targetNodeId: "node_3",
        sourceHandleId: "out",
        targetHandleId: "in",
        nodes: mockNodes,
        edges: mockEdges,
      });

      expect(res.valid).toBe(true);
    });

    it("detects and rejects closed cycles when allowCycles is false", () => {
      // Current graph: node_1 -> node_2. Trying to connect node_2 -> node_1 would create cycle
      const res = validatePortConnection({
        sourceNodeId: "node_2",
        targetNodeId: "node_1",
        sourceHandleId: "out",
        targetHandleId: "in",
        nodes: mockNodes,
        edges: mockEdges,
        allowCycles: false,
      });

      expect(res.valid).toBe(false);
      expect(res.reason).toContain("closed loop");
    });
  });

  describe("Command-Based History System (Undo / Redo)", () => {
    let history: HistoryService;
    let currentNodes: BaseNode[];
    let currentEdges: BaseEdge[];
    let selectedIds: string[];

    const getContext = (): GraphCommandContext => ({
      getNodes: () => currentNodes,
      setNodes: (n) => {
        currentNodes = n;
      },
      getEdges: () => currentEdges,
      setEdges: (e) => {
        currentEdges = e;
      },
      selectNodes: (ids) => {
        selectedIds = ids;
      },
    });

    beforeEach(() => {
      history = new HistoryService(10);
      currentNodes = [...mockNodes];
      currentEdges = [...mockEdges];
      selectedIds = [];
    });

    it("executes AddNodeCommand and undos deterministically", () => {
      const newNode: BaseNode = {
        id: "node_new",
        type: "process",
        position: { x: 600, y: 200 },
        data: { label: "Async Queue" },
      };

      const cmd = new AddNodeCommand(newNode);
      history.execute(cmd, getContext());

      expect(currentNodes).toHaveLength(4);
      expect(selectedIds).toContain("node_new");
      expect(history.canUndo()).toBe(true);

      // Undo
      history.undo(getContext());
      expect(currentNodes).toHaveLength(3);
      expect(currentNodes.some((n) => n.id === "node_new")).toBe(false);
      expect(history.canRedo()).toBe(true);

      // Redo
      history.redo(getContext());
      expect(currentNodes).toHaveLength(4);
      expect(currentNodes.some((n) => n.id === "node_new")).toBe(true);
    });

    it("executes DeleteNodesCommand and restores incident edges on undo", () => {
      const cmd = new DeleteNodesCommand(["node_2"]);
      history.execute(cmd, getContext());

      expect(currentNodes).toHaveLength(2);
      // incident edge_1_2 connected to node_2 should be removed
      expect(currentEdges).toHaveLength(0);

      // Undo restore
      history.undo(getContext());
      expect(currentNodes).toHaveLength(3);
      expect(currentEdges).toHaveLength(1);
      expect(currentEdges[0].id).toBe("edge_1_2");
    });

    it("groups continuous MoveNodesCommand into a single undoable step", () => {
      const moveCmd = new MoveNodesCommand([
        {
          nodeId: "node_1",
          from: { x: 100, y: 100 },
          to: { x: 250, y: 350 },
        },
      ]);

      history.execute(moveCmd, getContext());
      expect(currentNodes.find((n) => n.id === "node_1")?.position).toEqual({ x: 250, y: 350 });

      history.undo(getContext());
      expect(currentNodes.find((n) => n.id === "node_1")?.position).toEqual({ x: 100, y: 100 });
    });
  });

  describe("Clipboard Service (Copy, Offset Paste, Duplicate)", () => {
    it("copies selected nodes and internal incident edges", () => {
      const payload = copyGraphSelection(["node_1", "node_2"], mockNodes, mockEdges);
      expect(payload).toBeDefined();
      expect(payload?.nodes).toHaveLength(2);
      // edge_1_2 connects node_1 and node_2, both selected -> must be copied
      expect(payload?.edges).toHaveLength(1);
    });

    it("does not copy edges pointing outside the selected subset", () => {
      // Only node_1 is selected; edge_1_2 points to node_2 (not selected)
      const payload = copyGraphSelection(["node_1"], mockNodes, mockEdges);
      expect(payload?.nodes).toHaveLength(1);
      expect(payload?.edges).toHaveLength(0);
    });

    it("prepares pasted entities with new UUIDs and offset positions", () => {
      const payload = copyGraphSelection(["node_1", "node_2"], mockNodes, mockEdges)!;
      const { nodes: pastedNodes, edges: pastedEdges } = preparePastedEntities(payload, {
        x: 40,
        y: 40,
      });

      expect(pastedNodes).toHaveLength(2);
      expect(pastedEdges).toHaveLength(1);

      // IDs must be regenerated
      expect(pastedNodes[0].id).not.toBe("node_1");
      expect(pastedNodes[1].id).not.toBe("node_2");

      // Positions must be shifted by offset
      expect(pastedNodes[0].position.x).toBe(140);
      expect(pastedNodes[0].position.y).toBe(140);

      // Edge endpoints must point to the new node IDs
      expect(pastedEdges[0].source).toBe(pastedNodes[0].id);
      expect(pastedEdges[0].target).toBe(pastedNodes[1].id);
    });
  });
});
