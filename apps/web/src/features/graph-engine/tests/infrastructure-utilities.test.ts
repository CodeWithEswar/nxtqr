import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_UTILITIES_SLUGS = [
  "system-boundary",
  "service-group",
  "network-boundary",
  "trust-boundary",
  "architecture-note",
  "decision-annotation",
  "traffic-label",
  "connection-junction",
  "external-dependency",
  "failure-zone",
] as const;

describe("Phase 05.1.19 — Architecture & Diagram Utilities Infrastructure Library", () => {
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
    it("registers the canonical category 'architecture-and-diagram-utilities'", () => {
      const category = infrastructureRegistry.getCategory(
        ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID
      );
      expect(category).toBeDefined();
      expect(category?.name).toBe("Architecture & Diagram Utilities");
      expect(category?.order).toBe(19);
      expect(category?.iconSlug).toBe("system-boundary");
    });

    it("registers exactly the 10 required Architecture & Diagram Utilities component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(
        ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID
      );
      expect(components.length).toBe(10);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_UTILITIES_SLUGS].sort());
    });

    it("ensures every Architecture & Diagram Utilities component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_UTILITIES_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Default Configuration & Schema Validation", () => {
    it("validates all default configurations against their respective schemas", () => {
      for (const slug of EXPECTED_UTILITIES_SLUGS) {
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
      for (const slug of EXPECTED_UTILITIES_SLUGS) {
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
    it("instantiates each utility component as a valid canvas node in store", () => {
      const store = useGraphEditorStore.getState();

      for (let i = 0; i < EXPECTED_UTILITIES_SLUGS.length; i++) {
        const slug = EXPECTED_UTILITIES_SLUGS[i];
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

      expect(useGraphEditorStore.getState().nodes.length).toBe(10);
    });
  });

  describe("4. Capabilities and Inspector Metadata", () => {
    it("verifies capabilities for all 10 utility components", () => {
      for (const slug of EXPECTED_UTILITIES_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        expect(def?.capabilities.length).toBeGreaterThanOrEqual(3);
      }
    });

    it("verifies inspector sections contain valid paths and non-empty options for select fields", () => {
      for (const slug of EXPECTED_UTILITIES_SLUGS) {
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
