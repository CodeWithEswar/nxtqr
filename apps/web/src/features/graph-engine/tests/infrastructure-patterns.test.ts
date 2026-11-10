import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  DISTRIBUTED_SYSTEMS_PATTERNS_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_PATTERNS_SLUGS = [
  "circuit-breaker",
  "bulkhead",
  "retry-controller",
  "saga-orchestrator",
  "leader-election",
  "distributed-lock",
  "consensus-coordinator",
  "idempotency-service",
  "distributed-scheduler",
  "service-registry",
] as const;

describe("Phase 05.1.18 — Distributed Systems Patterns Infrastructure Library", () => {
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
    it("registers the canonical category 'distributed-systems-patterns'", () => {
      const category = infrastructureRegistry.getCategory(
        DISTRIBUTED_SYSTEMS_PATTERNS_CATEGORY_ID
      );
      expect(category).toBeDefined();
      expect(category?.name).toBe("Distributed Systems Patterns");
      expect(category?.order).toBe(18);
      expect(category?.iconSlug).toBe("circuit-breaker");
    });

    it("registers exactly the 10 required Distributed Systems Patterns component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(
        DISTRIBUTED_SYSTEMS_PATTERNS_CATEGORY_ID
      );
      expect(components.length).toBe(10);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_PATTERNS_SLUGS].sort());
    });

    it("ensures every Distributed Systems Patterns component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_PATTERNS_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Default Configuration & Schema Validation", () => {
    it("validates all default configurations against their respective schemas", () => {
      for (const slug of EXPECTED_PATTERNS_SLUGS) {
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

    it("ensures each Distributed Systems Patterns component specifies valid typed ports", () => {
      for (const slug of EXPECTED_PATTERNS_SLUGS) {
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
    it("adds a Distributed Systems Patterns component to the graph editor store with BaseNodeSchema compliance", () => {
      const addNode = useGraphEditorStore.getState().addNode;

      for (const slug of EXPECTED_PATTERNS_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        const newNode = {
          id: `test-node-${slug}`,
          type: def.id,
          position: { x: 250, y: 150 },
          dimensions: { width: def.node.minWidth, height: def.node.minHeight },
          status: "idle" as const,
          label: String(def.defaultConfig.label || def.display.name),
          description: def.display.description,
          data: {
            ...def.defaultConfig,
            isInfrastructure: true,
            categoryId: def.categoryId,
            componentType: def.id,
            version: def.version,
            iconSlug: def.display.iconSlug,
          },
          ports: [...def.ports],
          metadata: {
            infrastructureCategory: def.categoryId,
            version: def.version,
          },
        };

        const validatedNode = BaseNodeSchema.safeParse(newNode);
        expect(
          validatedNode.success,
          `BaseNodeSchema failed for ${slug}: ${JSON.stringify(
            (validatedNode as { error?: unknown }).error
          )}`
        ).toBe(true);

        addNode(newNode);
      }

      const storedNodes = useGraphEditorStore.getState().nodes;
      expect(storedNodes.length).toBe(10);
    });
  });
});
