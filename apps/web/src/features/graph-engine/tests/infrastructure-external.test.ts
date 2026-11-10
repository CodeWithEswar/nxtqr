import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  EXTERNAL_INTEGRATIONS_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_EXTERNAL_SLUGS = [
  "external-rest-api",
  "graphql-api",
  "grpc-service",
  "payment-gateway",
  "email-provider",
  "sms-provider",
  "whatsapp-provider",
  "maps-provider",
  "oauth-integration",
  "third-party-webhook",
] as const;

describe("Phase 05.1.17 — External Integrations Infrastructure Library", () => {
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
    it("registers the canonical category 'external-integrations'", () => {
      const category = infrastructureRegistry.getCategory(
        EXTERNAL_INTEGRATIONS_CATEGORY_ID
      );
      expect(category).toBeDefined();
      expect(category?.name).toBe("External Integrations");
      expect(category?.order).toBe(17);
      expect(category?.iconSlug).toBe("external-rest-api");
    });

    it("registers exactly the 10 required External Integrations component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(
        EXTERNAL_INTEGRATIONS_CATEGORY_ID
      );
      expect(components.length).toBe(10);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_EXTERNAL_SLUGS].sort());
    });

    it("ensures every External Integrations component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_EXTERNAL_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Default Configuration & Schema Validation", () => {
    it("validates all default configurations against their respective schemas", () => {
      for (const slug of EXPECTED_EXTERNAL_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def, `Component ${slug} must be defined`).toBeDefined();
        if (!def) continue;

        const parseResult = def.configSchema.safeParse(def.defaultConfig);
        expect(
          parseResult.success,
          `Validation failed for ${slug}: ${JSON.stringify(
            (parseResult as { error?: unknown }).error
          )}`
        ).toBe(true);
      }
    });

    it("ensures each External component specifies valid typed ports", () => {
      for (const slug of EXPECTED_EXTERNAL_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        expect(def.ports.length).toBeGreaterThan(0);
        for (const port of def.ports) {
          expect(port.id).toBeDefined();
          expect(port.name).toBeDefined();
          expect(["input", "output", "bidirectional"]).toContain(port.type);
        }
      }
    });
  });

  describe("3. Graph Editor Store Node Creation", () => {
    it("adds an External Integration component to the graph editor store with BaseNodeSchema compliance", () => {
      const addNode = useGraphEditorStore.getState().addNode;

      for (const slug of EXPECTED_EXTERNAL_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        const newNode = {
          id: `node-${slug}-test`,
          type: slug,
          position: { x: 100, y: 150 },
          dimensions: { width: 220, height: 96 },
          status: "idle" as const,
          label: def.display.name,
          description: def.display.description,
          data: {
            componentId: slug,
            configuration: def.defaultConfig,
            label: def.display.name,
          },
          ports: [...def.ports],
        };

        const parseResult = BaseNodeSchema.safeParse(newNode);
        expect(parseResult.success, `BaseNodeSchema validation failed for ${slug}`).toBe(true);

        addNode(newNode);
      }

      const stateNodes = useGraphEditorStore.getState().nodes;
      expect(stateNodes.length).toBe(10);
    });
  });
});
