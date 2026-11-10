import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  EXTERNAL_INTEGRATIONS_CATEGORY_ID,
  ALL_EXTERNAL_INTEGRATIONS_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.17 — Infrastructure Component Registry (External Integrations)", () => {
  it("registers the canonical External Integrations category", () => {
    const cat = infrastructureRegistry.getCategory(EXTERNAL_INTEGRATIONS_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("External Integrations");
    expect(cat?.order).toBe(17);
    expect(cat?.iconSlug).toBe("external-rest-api");
  });

  it("registers exactly 10 production External Integrations components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      EXTERNAL_INTEGRATIONS_CATEGORY_ID
    );
    expect(components).toHaveLength(10);
    expect(ALL_EXTERNAL_INTEGRATIONS_DEFINITIONS).toHaveLength(10);
  });

  it("ensures all 10 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_EXTERNAL_INTEGRATIONS_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(EXTERNAL_INTEGRATIONS_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_EXTERNAL_INTEGRATIONS_DEFINITIONS) {
      const parsed = comp.configSchema.safeParse(comp.defaultConfig);
      expect(
        parsed.success,
        `defaultConfig for "${comp.id}" failed schema validation: ${
          !parsed.success ? JSON.stringify(parsed.error) : ""
        }`
      ).toBe(true);

      const valResult = infrastructureRegistry.validateConfiguration(
        comp.id,
        comp.defaultConfig
      );
      expect(
        valResult.success,
        `validateConfiguration for "${comp.id}" failed: ${valResult.errors?.join(", ")}`
      ).toBe(true);
      expect(valResult.errors).toBeUndefined();
    }
  });

  it("creates valid React Flow canvas nodes adhering to BaseNodeSchema", () => {
    for (const comp of ALL_EXTERNAL_INTEGRATIONS_DEFINITIONS) {
      const mockNode = {
        id: `node-${comp.id}-1`,
        type: comp.id,
        position: { x: 300, y: 200 },
        data: {
          componentId: comp.id,
          label: comp.defaultConfig.label,
          configuration: comp.defaultConfig,
        },
      };

      const result = BaseNodeSchema.safeParse(mockNode);
      expect(
        result.success,
        `BaseNodeSchema failed for "${comp.id}": ${!result.success ? JSON.stringify(result.error) : ""}`
      ).toBe(true);
    }
  });

  it("verifies typed input and output ports for all 10 external integration components", () => {
    for (const comp of ALL_EXTERNAL_INTEGRATIONS_DEFINITIONS) {
      expect(comp.ports.length).toBeGreaterThan(0);

      for (const port of comp.ports) {
        expect(port.id).toBeTruthy();
        expect(port.name).toBeTruthy();
        expect(["input", "output", "bidirectional"]).toContain(port.type);
        expect(port.dataType).toBeTruthy();
        expect(port.capacity).toBeGreaterThan(0);
      }
    }
  });
});
