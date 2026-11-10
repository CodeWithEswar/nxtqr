import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  PROTOCOL_AND_INTERFACE_COMPONENTS_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_PROTOCOLS_SLUGS = [
  "http-endpoint",
  "https-endpoint",
  "rest-endpoint",
  "graphql-endpoint",
  "grpc-endpoint",
  "websocket-endpoint",
  "tcp-endpoint",
  "udp-endpoint",
  "mqtt-broker",
  "event-subscription",
  "streaming-endpoint",
  "file-transfer-endpoint",
] as const;

describe("Phase 05.1.20 — Protocol & Interface Components Infrastructure Library", () => {
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
    it("registers the canonical category 'protocol-and-interface-components'", () => {
      const category = infrastructureRegistry.getCategory(
        PROTOCOL_AND_INTERFACE_COMPONENTS_CATEGORY_ID
      );
      expect(category).toBeDefined();
      expect(category?.name).toBe("Protocol & Interface Components");
      expect(category?.order).toBe(20);
      expect(category?.iconSlug).toBe("http-endpoint");
    });

    it("registers exactly the 12 required Protocol & Interface component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(
        PROTOCOL_AND_INTERFACE_COMPONENTS_CATEGORY_ID
      );
      expect(components.length).toBe(12);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_PROTOCOLS_SLUGS].sort());
    });

    it("ensures every Protocol & Interface component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_PROTOCOLS_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Default Configuration & Schema Validation", () => {
    it("validates all default configurations against their respective schemas", () => {
      for (const slug of EXPECTED_PROTOCOLS_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def, `Component ${slug} must be defined`).toBeDefined();
        if (!def) continue;

        const parseResult = def.configSchema.safeParse(def.defaultConfig);
        expect(
          parseResult.success,
          `Validation failed for ${slug}: ${JSON.stringify(
            !parseResult.success ? parseResult.error : null
          )}`
        ).toBe(true);
      }
    });

    it("ensures default configs pass registry validation", () => {
      for (const slug of EXPECTED_PROTOCOLS_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        const result = infrastructureRegistry.validateConfiguration(
          slug,
          def.defaultConfig
        );
        expect(
          result.success,
          `validateConfiguration failed for ${slug}: ${result.errors?.join(", ")}`
        ).toBe(true);
      }
    });
  });

  describe("3. Canvas Node Instantiation & BaseNodeSchema Conformance", () => {
    it("instantiates each protocol component as a valid canvas node in store", () => {
      const store = useGraphEditorStore.getState();

      for (let i = 0; i < EXPECTED_PROTOCOLS_SLUGS.length; i++) {
        const slug = EXPECTED_PROTOCOLS_SLUGS[i];
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        const node = {
          id: `test-node-${slug}-${i}`,
          type: slug,
          position: { x: i * 180, y: 150 },
          data: {
            componentId: slug,
            label: String(def.defaultConfig.label || def.display.name),
            configuration: def.defaultConfig,
            visualizerType: "system-design",
            status: "ready" as const,
          },
        };

        const validated = BaseNodeSchema.safeParse(node);
        expect(
          validated.success,
          `BaseNodeSchema rejected node ${slug}: ${JSON.stringify(
            !validated.success ? validated.error : null
          )}`
        ).toBe(true);

        store.addNode(node as any);
      }

      expect(useGraphEditorStore.getState().nodes.length).toBe(12);
    });
  });

  describe("4. Capabilities and Inspector Metadata", () => {
    it("verifies capabilities for all 12 protocol components", () => {
      for (const slug of EXPECTED_PROTOCOLS_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        expect(def?.capabilities.length).toBeGreaterThanOrEqual(3);
      }
    });

    it("verifies inspector sections contain valid paths and non-empty options for select fields", () => {
      for (const slug of EXPECTED_PROTOCOLS_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        for (const section of def.inspector) {
          for (const field of section.fields) {
            expect(field.path).toBeTruthy();
            expect(field.label).toBeTruthy();
            if (field.type === "select") {
              expect(field.options && field.options.length > 0).toBe(true);
            }
          }
        }
      }
    });
  });
});
