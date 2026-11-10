import { describe, it, expect, beforeEach } from "vitest";
import { useGraphEditorStore } from "@/features/graph-engine/store/graph-editor-store";
import {
  bottleneckEngine,
  DEFAULT_WORKLOAD_SCENARIOS,
} from "@nxtqr/architecture-intelligence";
import type { BaseNode, BaseEdge } from "@/features/graph-engine/schemas/graph.schema";

describe("Bottleneck Detection Engine - Graph Editor Store Integration", () => {
  beforeEach(() => {
    bottleneckEngine.reset();
    useGraphEditorStore.setState({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      isBottlenecksOpen: false,
      bottlenecksPanelWidth: 360,
    });
  });

  it("toggles and updates bottlenecks panel state in graph editor store", () => {
    expect(useGraphEditorStore.getState().isBottlenecksOpen).toBe(false);

    useGraphEditorStore.getState().toggleBottlenecks();
    expect(useGraphEditorStore.getState().isBottlenecksOpen).toBe(true);

    useGraphEditorStore.getState().setBottlenecksOpen(false);
    expect(useGraphEditorStore.getState().isBottlenecksOpen).toBe(false);

    useGraphEditorStore.getState().setBottlenecksPanelWidth(450);
    expect(useGraphEditorStore.getState().bottlenecksPanelWidth).toBe(450);
  });

  it("evaluates bottleneck analysis for nodes loaded into graph editor store", () => {
    const gateway: BaseNode = {
      id: "gw_1",
      type: "api-gateway",
      position: { x: 100, y: 100 },
      data: {
        componentType: "api-gateway",
        replicas: 4,
        capacityRps: 10000,
      },
    };

    const service: BaseNode = {
      id: "svc_1",
      type: "container-service",
      position: { x: 300, y: 100 },
      data: {
        componentType: "container-service",
        replicas: 1,
        capacityRps: 800, // lower than incoming
      },
    };

    const edge: BaseEdge = {
      id: "e1",
      source: "gw_1",
      target: "svc_1",
      data: { protocol: "HTTPS", relationshipKind: "request-response" },
    };

    useGraphEditorStore.setState({ nodes: [gateway, service], edges: [edge] });

    const nodes = useGraphEditorStore.getState().nodes;
    const edges = useGraphEditorStore.getState().edges;

    const report = bottleneckEngine.analyzeGraph(
      nodes,
      edges,
      DEFAULT_WORKLOAD_SCENARIOS.normal_traffic
    );

    expect(report.metrics.analyzedNodesCount).toBe(2);
    expect(report.nodeUtilization["svc_1"]).toBeDefined();
    expect(report.nodeUtilization["svc_1"].demandRps).toBe(1020); // 1000 * 1.02 retry amplification
    expect(report.nodeUtilization["svc_1"].declaredCapacityRps).toBe(800);
    expect(report.nodeUtilization["svc_1"].utilizationRatio).toBeGreaterThan(1.0);

    const saturationFinding = report.findings.find((f) => f.ruleId === "BOT-SRV-001");
    expect(saturationFinding).toBeDefined();
    expect(saturationFinding?.affectedNodeIds).toContain("svc_1");

    // Select the finding's target node in store
    if (saturationFinding) {
      useGraphEditorStore.getState().selectNode(saturationFinding.affectedNodeIds[0]);
      expect(useGraphEditorStore.getState().selectedNodeIds).toEqual(["svc_1"]);
    }
  });

  it("identifies queue backlog growth when producer outpaces consumer", () => {
    const queueNode: BaseNode = {
      id: "orders_queue",
      type: "message-queue",
      position: { x: 200, y: 0 },
      data: { capacityMsgPerSec: 10000 },
    };

    const producer: BaseNode = {
      id: "order_svc",
      type: "container-service",
      position: { x: 0, y: 0 },
      data: { replicas: 3, capacityRps: 5000 },
    };

    const consumer: BaseNode = {
      id: "slow_processor",
      type: "worker-service",
      position: { x: 400, y: 0 },
      data: { replicas: 1, capacityMsgPerSec: 300 },
    };

    const e1: BaseEdge = {
      id: "e_pub",
      source: "order_svc",
      target: "orders_queue",
      data: { protocol: "AMQP", relationshipKind: "event-delivery" },
    };

    const e2: BaseEdge = {
      id: "e_sub",
      source: "orders_queue",
      target: "slow_processor",
      data: { protocol: "AMQP", relationshipKind: "stream" },
    };

    useGraphEditorStore.setState({
      nodes: [producer, queueNode, consumer],
      edges: [e1, e2],
    });

    const nodes = useGraphEditorStore.getState().nodes;
    const edges = useGraphEditorStore.getState().edges;

    const report = bottleneckEngine.analyzeGraph(
      nodes,
      edges,
      DEFAULT_WORKLOAD_SCENARIOS.normal_traffic
    );

    const queueMetrics = report.queueMetrics["orders_queue"];
    expect(queueMetrics).toBeDefined();
    expect(queueMetrics.arrivalRateMsgPerSec).toBe(1020);
    expect(queueMetrics.processingCapacityMsgPerSec).toBe(300);
    expect(queueMetrics.netBacklogGrowthMsgPerSec).toBe(720);
    expect(queueMetrics.isSaturating).toBe(true);

    const backlogFinding = report.findings.find((f) => f.ruleId === "BOT-QUE-001");
    expect(backlogFinding).toBeDefined();
  });
});
