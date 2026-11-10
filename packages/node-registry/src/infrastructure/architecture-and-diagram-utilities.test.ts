import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID,
  ALL_ARCHITECTURE_AND_DIAGRAM_UTILITIES_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.19 — Infrastructure Component Registry (Architecture & Diagram Utilities)", () => {
  it("registers the canonical Architecture & Diagram Utilities category", () => {
    const cat = infrastructureRegistry.getCategory(ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Architecture & Diagram Utilities");
    expect(cat?.order).toBe(19);
    expect(cat?.iconSlug).toBe("system-boundary");
  });

  it("registers exactly 10 production Architecture & Diagram Utilities components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID
    );
    expect(components).toHaveLength(10);
    expect(ALL_ARCHITECTURE_AND_DIAGRAM_UTILITIES_DEFINITIONS).toHaveLength(10);
  });

  it("ensures all 10 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_ARCHITECTURE_AND_DIAGRAM_UTILITIES_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(ARCHITECTURE_AND_DIAGRAM_UTILITIES_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_ARCHITECTURE_AND_DIAGRAM_UTILITIES_DEFINITIONS) {
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
    for (const comp of ALL_ARCHITECTURE_AND_DIAGRAM_UTILITIES_DEFINITIONS) {
      const mockNode = {
        id: `node-${comp.id}-1`,
        type: comp.id,
        position: { x: 300, y: 200 },
        data: {
          componentId: comp.id,
          label: String(comp.defaultConfig.label || comp.display.name),
          configuration: comp.defaultConfig,
        },
      };

      const parsed = BaseNodeSchema.safeParse(mockNode);
      expect(
        parsed.success,
        `BaseNodeSchema failed for "${comp.id}": ${
          !parsed.success ? JSON.stringify(parsed.error) : ""
        }`
      ).toBe(true);
    }
  });

  it("verifies structured inspector sections for every utility component", () => {
    for (const comp of ALL_ARCHITECTURE_AND_DIAGRAM_UTILITIES_DEFINITIONS) {
      expect(comp.inspector.length).toBeGreaterThanOrEqual(2);
      for (const section of comp.inspector) {
        expect(section.id).toBeTruthy();
        expect(section.title).toBeTruthy();
        expect(section.fields.length).toBeGreaterThanOrEqual(1);
        for (const field of section.fields) {
          expect(field.path).toBeTruthy();
          expect(field.label).toBeTruthy();
          expect(field.type).toBeTruthy();
        }
      }
    }
  });

  it("verifies correct ports configured for each utility component", () => {
    for (const comp of ALL_ARCHITECTURE_AND_DIAGRAM_UTILITIES_DEFINITIONS) {
      expect(comp.ports.length).toBeGreaterThanOrEqual(2);
      for (const port of comp.ports) {
        expect(port.id).toBeTruthy();
        expect(port.name).toBeTruthy();
        expect(["input", "output", "bidirectional"]).toContain(port.type);
        expect(port.capacity).toBeGreaterThan(0);
      }
    }
  });
});
