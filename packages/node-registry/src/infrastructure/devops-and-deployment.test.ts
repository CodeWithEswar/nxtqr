import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  ALL_DEVOPS_AND_DEPLOYMENT_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.15 — Infrastructure Component Registry (DevOps & Deployment)", () => {
  it("registers the canonical DevOps & Deployment category", () => {
    const cat = infrastructureRegistry.getCategory(DEVOPS_AND_DEPLOYMENT_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("DevOps & Deployment");
    expect(cat?.order).toBe(15);
    expect(cat?.iconSlug).toBe("git-repository");
  });

  it("registers exactly 12 production DevOps & Deployment components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      DEVOPS_AND_DEPLOYMENT_CATEGORY_ID
    );
    expect(components).toHaveLength(12);
    expect(ALL_DEVOPS_AND_DEPLOYMENT_DEFINITIONS).toHaveLength(12);
  });

  it("ensures all 12 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_DEVOPS_AND_DEPLOYMENT_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(DEVOPS_AND_DEPLOYMENT_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_DEVOPS_AND_DEPLOYMENT_DEFINITIONS) {
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
    for (const comp of ALL_DEVOPS_AND_DEPLOYMENT_DEFINITIONS) {
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
    for (const comp of ALL_DEVOPS_AND_DEPLOYMENT_DEFINITIONS) {
      const mockNode = {
        id: `node-${comp.id}-1`,
        type: comp.id,
        position: { x: 250, y: 150 },
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

