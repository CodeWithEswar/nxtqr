import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  ALL_CLOUD_INFRASTRUCTURE_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.16 — Infrastructure Component Registry (Cloud Infrastructure)", () => {
  it("registers the canonical Cloud Infrastructure category", () => {
    const cat = infrastructureRegistry.getCategory(CLOUD_INFRASTRUCTURE_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Cloud Infrastructure");
    expect(cat?.order).toBe(16);
    expect(cat?.iconSlug).toBe("cloud-region");
  });

  it("registers exactly 12 production Cloud Infrastructure components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      CLOUD_INFRASTRUCTURE_CATEGORY_ID
    );
    expect(components).toHaveLength(12);
    expect(ALL_CLOUD_INFRASTRUCTURE_DEFINITIONS).toHaveLength(12);
  });

  it("ensures all 12 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_CLOUD_INFRASTRUCTURE_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(CLOUD_INFRASTRUCTURE_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_CLOUD_INFRASTRUCTURE_DEFINITIONS) {
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

  it("validates typed ports and inspector paths for each component", () => {
    for (const comp of ALL_CLOUD_INFRASTRUCTURE_DEFINITIONS) {
      expect(comp.ports.length).toBeGreaterThan(0);
      for (const port of comp.ports) {
        expect(["input", "output", "bidirectional"]).toContain(port.type);
      }

      if (comp.inspector) {
        for (const section of comp.inspector) {
          expect(section.id).toBeTruthy();
          expect(section.title).toBeTruthy();
          for (const field of section.fields) {
            expect(field.label).toBeTruthy();
            expect(field.type).toBeTruthy();
            expect(field.path).toBeTruthy();
          }
        }
      }
    }
  });

  it("creates valid React Flow canvas nodes adhering to BaseNodeSchema", () => {
    for (const comp of ALL_CLOUD_INFRASTRUCTURE_DEFINITIONS) {
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
});

