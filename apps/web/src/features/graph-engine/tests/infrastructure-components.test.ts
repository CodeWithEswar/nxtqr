import { describe, it, expect, beforeEach } from "vitest";
import { infrastructureRegistry } from "@nxtqr/node-registry";
import { getClientInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_CLIENT_SLUGS = [
  "web-browser",
  "mobile-application",
  "desktop-application",
  "single-page-application",
  "server-side-rendered-app",
  "static-website",
  "progressive-web-app",
  "cli-client",
  "iot-device",
  "third-party-client",
] as const;

describe("Phase 05.1.1 — Clients & User Interfaces Infrastructure Library", () => {
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
    it("registers the canonical category 'clients-and-user-interfaces'", () => {
      const category = infrastructureRegistry.getCategory("clients-and-user-interfaces");
      expect(category).toBeDefined();
      expect(category?.name).toBe("Clients & User Interfaces");
      expect(category?.order).toBe(1);
    });

    it("registers exactly the 10 required client component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory("clients-and-user-interfaces");
      expect(components.length).toBe(10);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_CLIENT_SLUGS].sort());
    });

    it("ensures every client component has an icon mapped in clientIconRegistry", () => {
      for (const slug of EXPECTED_CLIENT_SLUGS) {
        const Icon = getClientInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Node Factory & Graph Schema Compliance", () => {
    it("creates valid BaseNode instances conforming to @nxtqr/graph-schema", () => {
      for (const slug of EXPECTED_CLIENT_SLUGS) {
        const node = infrastructureRegistry.createInfrastructureNode(slug, {
          position: { x: 100, y: 150 },
          label: `Custom ${slug}`,
        });

        // Strict schema validation using BaseNodeSchema
        const parseResult = BaseNodeSchema.safeParse(node);
        expect(
          parseResult.success,
          `Node created for "${slug}" failed BaseNodeSchema validation: ${JSON.stringify(
            (parseResult as any).error?.errors
          )}`
        ).toBe(true);

        expect(node.type).toBe(slug);
        expect(node.position).toEqual({ x: 100, y: 150 });
        expect(node.label).toBe(`Custom ${slug}`);
        expect(node.ports).toBeDefined();
        expect(node.ports!.length).toBeGreaterThanOrEqual(1);
        expect(node.data.isInfrastructure).toBe(true);
        expect(node.data.categoryId).toBe("clients-and-user-interfaces");
      }
    });

    it("correctly assigns ports with names, types, and data formats", () => {
      const browserNode = infrastructureRegistry.createInfrastructureNode("web-browser");
      expect(browserNode.ports).toBeDefined();
      const egressPort = browserNode.ports?.find((p) => p.type === "output");
      expect(egressPort).toBeDefined();
      expect(egressPort?.dataType).toContain("HTTP");
    });
  });

  describe("3. Schema-Driven Configuration Validation", () => {
    it("validates compliant component configurations", () => {
      const result = infrastructureRegistry.validateConfiguration("web-browser", {
        browserFamily: "chromium",
        concurrentUsers: 500,
        cachingStrategy: "standard",
        environment: "production",
      });

      expect(result.success).toBe(true);
      expect(result.data?.concurrentUsers).toBe(500);
      expect(result.data?.browserFamily).toBe("chromium");
    });

    it("rejects invalid configuration properties with descriptive errors", () => {
      const invalidResult = infrastructureRegistry.validateConfiguration("web-browser", {
        concurrentUsers: -50, // Negative users prohibited
        browserFamily: "invalid-engine-type", // Invalid enum
      });

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.errors).toBeDefined();
      expect(invalidResult.errors?.length).toBeGreaterThanOrEqual(1);
    });

    it("validates IoT device configuration telemetry frequency", () => {
      const iotValid = infrastructureRegistry.validateConfiguration("iot-device", {
        deviceClass: "sensor",
        telemetryIntervalSeconds: 30,
        bufferOffline: true,
      });
      expect(iotValid.success).toBe(true);

      const iotInvalid = infrastructureRegistry.validateConfiguration("iot-device", {
        telemetryIntervalSeconds: 0, // Must be positive min(1)
      });
      expect(iotInvalid.success).toBe(false);
    });
  });

  describe("4. Zustand Graph Editor Store Integration", () => {
    it("adds an infrastructure node to the canvas store", () => {
      const store = useGraphEditorStore.getState();
      const newNode = infrastructureRegistry.createInfrastructureNode("single-page-application", {
        position: { x: 300, y: 200 },
      });

      store.addNode(newNode);

      const updatedNodes = useGraphEditorStore.getState().nodes;
      expect(updatedNodes.length).toBe(1);
      expect(updatedNodes[0].id).toBe(newNode.id);
      expect(updatedNodes[0].type).toBe("single-page-application");
      expect(updatedNodes[0].data.isInfrastructure).toBe(true);
    });

    it("updates configuration data of an infrastructure node", () => {
      const store = useGraphEditorStore.getState();
      const newNode = infrastructureRegistry.createInfrastructureNode("mobile-application", {
        position: { x: 200, y: 200 },
      });
      store.addNode(newNode);

      // Update data field
      store.updateNodeConfig(newNode.id, {
        data: {
          ...newNode.data,
          platform: "ios",
          biometricsEnabled: true,
        },
      });

      const updated = useGraphEditorStore.getState().nodes.find((n) => n.id === newNode.id);
      expect(updated?.data.platform).toBe("ios");
      expect(updated?.data.biometricsEnabled).toBe(true);
    });

    it("supports undo and redo when adding an infrastructure node", () => {
      const store = useGraphEditorStore.getState();
      const newNode = infrastructureRegistry.createInfrastructureNode("cli-client");

      store.addNode(newNode);
      expect(useGraphEditorStore.getState().nodes.length).toBe(1);
      expect(useGraphEditorStore.getState().canUndo).toBe(true);

      // Undo
      useGraphEditorStore.getState().undo();
      expect(useGraphEditorStore.getState().nodes.length).toBe(0);
      expect(useGraphEditorStore.getState().canRedo).toBe(true);

      // Redo
      useGraphEditorStore.getState().redo();
      expect(useGraphEditorStore.getState().nodes.length).toBe(1);
      expect(useGraphEditorStore.getState().nodes[0].id).toBe(newNode.id);
    });

    it("serializes and deserializes graph documents containing infrastructure nodes", () => {
      const nodeA = infrastructureRegistry.createInfrastructureNode("web-browser", {
        position: { x: 100, y: 100 },
      });
      const nodeB = infrastructureRegistry.createInfrastructureNode("third-party-client", {
        position: { x: 400, y: 100 },
      });

      const jsonStr = JSON.stringify({ nodes: [nodeA, nodeB] });
      const parsed = JSON.parse(jsonStr);

      expect(parsed.nodes.length).toBe(2);
      expect(parsed.nodes[0].type).toBe("web-browser");
      expect(parsed.nodes[1].type).toBe("third-party-client");
      expect(parsed.nodes[0].data.categoryId).toBe("clients-and-user-interfaces");
    });
  });

  describe("5. Catalog Search & Filter Functionality", () => {
    it("searches components by name, keyword, and slug", () => {
      const resultsByKeyword = infrastructureRegistry.searchComponents("pwa");
      expect(resultsByKeyword.length).toBeGreaterThanOrEqual(1);
      expect(resultsByKeyword.some((c) => c.id === "progressive-web-app")).toBe(true);

      const resultsByTerminal = infrastructureRegistry.searchComponents("terminal");
      expect(resultsByTerminal.length).toBeGreaterThanOrEqual(1);
      expect(resultsByTerminal.some((c) => c.id === "cli-client")).toBe(true);

      const resultsBySlug = infrastructureRegistry.searchComponents("desktop-application");
      expect(resultsBySlug.length).toBe(1);
      expect(resultsBySlug[0].display.name).toBe("Desktop Application");
    });
  });
});
