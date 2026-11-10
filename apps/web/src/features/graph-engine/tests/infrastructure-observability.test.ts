import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  OBSERVABILITY_AND_RELIABILITY_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_OBSERVABILITY_SLUGS = [
  "monitoring-service",
  "metrics-collector",
  "log-collector",
  "log-aggregator",
  "distributed-tracing",
  "alert-manager",
  "health-check-service",
  "error-tracker",
  "apm-service",
  "status-page",
] as const;

describe("Phase 05.1.10 — Observability & Reliability Infrastructure Library", () => {
  beforeEach(() => {
    useGraphEditorStore.setState({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      canUndo: false,
      canRedo: false,
    });
  });

  describe("1. Registry & Category Inventory", () => {
    it("registers the canonical category 'observability-and-reliability'", () => {
      const category = infrastructureRegistry.getCategory(
        OBSERVABILITY_AND_RELIABILITY_CATEGORY_ID
      );
      expect(category).toBeDefined();
      expect(category?.name).toBe("Observability & Reliability");
      expect(category?.order).toBe(10);
    });

    it("registers exactly the 10 required Observability & Reliability component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(
        OBSERVABILITY_AND_RELIABILITY_CATEGORY_ID
      );
      expect(components.length).toBe(10);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_OBSERVABILITY_SLUGS].sort());
    });

    it("ensures every Observability component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_OBSERVABILITY_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Default Configuration & Zod Schemas", () => {
    it("validates all 10 components against their respective Zod config schemas", () => {
      for (const slug of EXPECTED_OBSERVABILITY_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def, `Component definition for ${slug} must exist`).toBeDefined();
        if (!def) continue;

        const parseResult = def.configSchema.safeParse(def.defaultConfig);
        expect(
          parseResult.success,
          `Default config for ${slug} failed validation: ${
            !parseResult.success ? JSON.stringify(parseResult.error) : ""
          }`
        ).toBe(true);
      }
    });

    it("ensures no plaintext credentials or sensitive keys exist in default configs", () => {
      for (const slug of EXPECTED_OBSERVABILITY_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        const serialized = JSON.stringify(def.defaultConfig).toLowerCase();
        expect(serialized).not.toContain("rawpassword");
        expect(serialized).not.toContain("apikeysecret");
        expect(serialized).not.toContain("privatekey");
        expect(serialized).not.toContain("bearer eyj");
      }
    });
  });

  describe("3. Telemetry Connection Semantics & Port Topology", () => {
    it("defines telemetry-accurate input and output ports for every observability component", () => {
      for (const slug of EXPECTED_OBSERVABILITY_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        expect(def.ports.length).toBeGreaterThanOrEqual(2);
        const inputs = def.ports.filter((p) => p.type === "input");
        const outputs = def.ports.filter((p) => p.type === "output");
        expect(inputs.length, `${slug} must have at least one input port`).toBeGreaterThanOrEqual(1);
        expect(outputs.length, `${slug} must have at least one output port`).toBeGreaterThanOrEqual(1);

        for (const port of def.ports) {
          expect(port.dataType).toBeDefined();
          expect(port.description).toBeDefined();
        }
      }
    });

    it("verifies Metrics Collector and TSDB write-out ports", () => {
      const metrics = infrastructureRegistry.getComponent("metrics-collector");
      expect(metrics).toBeDefined();
      const portIds = metrics?.ports.map((p) => p.id);
      expect(portIds).toContain("scrape-target-in");
      expect(portIds).toContain("otlp-push-in");
      expect(portIds).toContain("metrics-egress-out");
      expect(portIds).toContain("tsdb-write-out");
    });

    it("verifies Distributed Tracing context propagation and service map ports", () => {
      const tracing = infrastructureRegistry.getComponent("distributed-tracing");
      expect(tracing).toBeDefined();
      const portIds = tracing?.ports.map((p) => p.id);
      expect(portIds).toContain("span-ingress-in");
      expect(portIds).toContain("w3c-context-in");
      expect(portIds).toContain("dag-reconstruction-out");
      expect(portIds).toContain("service-map-out");
    });

    it("verifies Alert Manager signal ingestion and notification dispatches", () => {
      const alertMgr = infrastructureRegistry.getComponent("alert-manager");
      expect(alertMgr).toBeDefined();
      const portIds = alertMgr?.ports.map((p) => p.id);
      expect(portIds).toContain("alert-signal-in");
      expect(portIds).toContain("notification-dispatch-out");
      expect(portIds).toContain("webhook-egress-out");
      expect(portIds).toContain("incident-command-out");
    });
  });

  describe("4. Graph Editor Store & React Flow Node Lifecycle", () => {
    it("creates BaseNode instances for every observability component and verifies schema compliance", () => {
      for (const slug of EXPECTED_OBSERVABILITY_SLUGS) {
        const node = infrastructureRegistry.createInfrastructureNode(slug, {
          position: { x: 100, y: 150 },
          label: `Primary ${slug}`,
          environment: "production",
        });

        expect(node.id).toBeDefined();
        expect(node.type).toBe(slug);
        expect(node.data.componentType).toBe(slug);
        expect(node.data.isInfrastructure).toBe(true);

        const schemaValidation = BaseNodeSchema.safeParse(node);
        expect(
          schemaValidation.success,
          `BaseNode schema failed for ${slug}: ${
            !schemaValidation.success ? JSON.stringify(schemaValidation.error) : ""
          }`
        ).toBe(true);
      }
    });

    it("adds, selects, and removes Observability components in the graph store", () => {
      const store = useGraphEditorStore.getState();

      const monitorNode = infrastructureRegistry.createInfrastructureNode("monitoring-service", {
        position: { x: 50, y: 50 },
      });
      const alertNode = infrastructureRegistry.createInfrastructureNode("alert-manager", {
        position: { x: 250, y: 50 },
      });

      store.addNode(monitorNode);
      store.addNode(alertNode);

      let state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(2);

      store.selectNode(monitorNode.id, false);
      state = useGraphEditorStore.getState();
      expect(state.selectedNodeIds).toEqual([monitorNode.id]);

      store.deleteNodeById(monitorNode.id);
      state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(1);
      expect(state.nodes[0].id).toBe(alertNode.id);
    });

    it("connects a full telemetry and incident response pipeline in the graph store", () => {
      const store = useGraphEditorStore.getState();

      const metricsCollector = infrastructureRegistry.createInfrastructureNode("metrics-collector", {
        position: { x: 0, y: 0 },
      });
      const monitoringService = infrastructureRegistry.createInfrastructureNode("monitoring-service", {
        position: { x: 220, y: 0 },
      });
      const alertManager = infrastructureRegistry.createInfrastructureNode("alert-manager", {
        position: { x: 440, y: 0 },
      });
      const statusPage = infrastructureRegistry.createInfrastructureNode("status-page", {
        position: { x: 660, y: 0 },
      });

      store.addNode(metricsCollector);
      store.addNode(monitoringService);
      store.addNode(alertManager);
      store.addNode(statusPage);

      store.addEdge({
        id: "edge_metrics_to_mon",
        source: metricsCollector.id,
        target: monitoringService.id,
        sourceHandle: "metrics-egress-out",
        targetHandle: "metrics-stream-in",
        type: "smoothstep",
        data: {},
      });

      store.addEdge({
        id: "edge_mon_to_alert",
        source: monitoringService.id,
        target: alertManager.id,
        sourceHandle: "alert-eval-out",
        targetHandle: "alert-signal-in",
        type: "smoothstep",
        data: {},
      });

      store.addEdge({
        id: "edge_alert_to_status",
        source: alertManager.id,
        target: statusPage.id,
        sourceHandle: "incident-command-out",
        targetHandle: "incident-sync-in",
        type: "smoothstep",
        data: {},
      });

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(4);
      expect(state.edges.length).toBe(3);
    });
  });
});

