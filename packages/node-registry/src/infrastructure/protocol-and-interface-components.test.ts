import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  PROTOCOL_AND_INTERFACE_COMPONENTS_CATEGORY_ID,
  ALL_PROTOCOL_AND_INTERFACE_COMPONENTS_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.20 — Infrastructure Component Registry (Protocol & Interface Components)", () => {
  it("registers the canonical Protocol & Interface Components category", () => {
    const cat = infrastructureRegistry.getCategory(PROTOCOL_AND_INTERFACE_COMPONENTS_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Protocol & Interface Components");
    expect(cat?.order).toBe(20);
    expect(cat?.iconSlug).toBe("http-endpoint");
  });

  it("registers exactly 12 production Protocol & Interface components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      PROTOCOL_AND_INTERFACE_COMPONENTS_CATEGORY_ID
    );
    expect(components).toHaveLength(12);
    expect(ALL_PROTOCOL_AND_INTERFACE_COMPONENTS_DEFINITIONS).toHaveLength(12);
  });

  it("ensures all 12 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_PROTOCOL_AND_INTERFACE_COMPONENTS_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(PROTOCOL_AND_INTERFACE_COMPONENTS_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_PROTOCOL_AND_INTERFACE_COMPONENTS_DEFINITIONS) {
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
    for (const comp of ALL_PROTOCOL_AND_INTERFACE_COMPONENTS_DEFINITIONS) {
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

  it("verifies structured inspector sections for every protocol component", () => {
    for (const comp of ALL_PROTOCOL_AND_INTERFACE_COMPONENTS_DEFINITIONS) {
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

  it("verifies correct ports configured for each protocol and interface component", () => {
    for (const comp of ALL_PROTOCOL_AND_INTERFACE_COMPONENTS_DEFINITIONS) {
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
