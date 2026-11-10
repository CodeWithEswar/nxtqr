import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  CLOUD_INFRASTRUCTURE_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_CLOUD_SLUGS = [
  "cloud-region",
  "availability-zone",
  "compute-instance",
  "managed-database",
  "managed-kubernetes",
  "managed-queue",
  "managed-cache",
  "cloud-function",
  "cloud-storage-bucket",
  "cloud-load-balancer",
  "cloud-network",
  "cloud-iam",
] as const;

describe("Phase 05.1.16 — Cloud Infrastructure Library", () => {
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
    it("registers the canonical category 'cloud-infrastructure'", () => {
      const category = infrastructureRegistry.getCategory(
        CLOUD_INFRASTRUCTURE_CATEGORY_ID
      );
      expect(category).toBeDefined();
      expect(category?.name).toBe("Cloud Infrastructure");
      expect(category?.order).toBe(16);
      expect(category?.iconSlug).toBe("cloud-region");
    });

    it("registers exactly the 12 required Cloud Infrastructure component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(
        CLOUD_INFRASTRUCTURE_CATEGORY_ID
      );
      expect(components.length).toBe(12);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_CLOUD_SLUGS].sort());
    });

    it("ensures every Cloud component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_CLOUD_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Default Configuration & Schema Validation", () => {
    it("validates all default configurations against their respective schemas", () => {
      for (const slug of EXPECTED_CLOUD_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def, `Definition for ${slug} must exist`).toBeDefined();
        if (!def) continue;

        const validation = infrastructureRegistry.validateConfiguration(
          slug,
          def.defaultConfig
        );
        expect(
          validation.success,
          `Default config for ${slug} should pass validation: ${validation.errors?.join(", ")}`
        ).toBe(true);
      }
    });
  });

  describe("3. React Flow Node Creation & Graph Editor Store Integration", () => {
    it("allows adding all 12 Cloud components to the canvas", () => {
      const store = useGraphEditorStore.getState();

      for (let i = 0; i < EXPECTED_CLOUD_SLUGS.length; i++) {
        const slug = EXPECTED_CLOUD_SLUGS[i];
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        const node = {
          id: `cloud-node-${i + 1}`,
          type: slug,
          position: { x: i * 160, y: (i % 3) * 120 },
          data: {
            componentId: slug,
            label: def.defaultConfig.label,
            configuration: def.defaultConfig,
          },
        };

        const parsed = BaseNodeSchema.safeParse(node);
        expect(parsed.success, `Node ${slug} must satisfy BaseNodeSchema`).toBe(true);

        store.addNode(node as any);
      }

      expect(useGraphEditorStore.getState().nodes.length).toBe(12);
    });
  });
});

