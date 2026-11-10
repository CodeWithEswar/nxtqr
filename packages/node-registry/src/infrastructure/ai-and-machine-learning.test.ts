import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  AI_AND_MACHINE_LEARNING_CATEGORY_ID,
  ALL_AI_AND_MACHINE_LEARNING_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.12 — Infrastructure Component Registry (AI & Machine Learning Infrastructure)", () => {
  it("registers the canonical AI & Machine Learning Infrastructure category", () => {
    const cat = infrastructureRegistry.getCategory(AI_AND_MACHINE_LEARNING_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("AI & Machine Learning Infrastructure");
    expect(cat?.order).toBe(12);
  });

  it("registers exactly 10 production AI & Machine Learning components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      AI_AND_MACHINE_LEARNING_CATEGORY_ID
    );
    expect(components).toHaveLength(10);
    expect(ALL_AI_AND_MACHINE_LEARNING_DEFINITIONS).toHaveLength(10);
  });

  it("ensures all 10 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_AI_AND_MACHINE_LEARNING_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(AI_AND_MACHINE_LEARNING_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_AI_AND_MACHINE_LEARNING_DEFINITIONS) {
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

  it("ensures all components have valid typed input and output ports with positive capacity", () => {
    for (const comp of ALL_AI_AND_MACHINE_LEARNING_DEFINITIONS) {
      expect(comp.ports.length).toBeGreaterThanOrEqual(2);
      for (const port of comp.ports) {
        expect(["input", "output"]).toContain(port.type);
        expect(port.id).toBeTruthy();
        expect(port.name).toBeTruthy();
        expect(port.dataType).toBeTruthy();
        expect(port.capacity).toBeGreaterThan(0);
      }
    }
  });

  it("creates fully-typed BaseNode instances via createInfrastructureNode", () => {
    for (const comp of ALL_AI_AND_MACHINE_LEARNING_DEFINITIONS) {
      const node = infrastructureRegistry.createInfrastructureNode(comp.id, {
        position: { x: 300, y: 400 },
        label: `Test ${comp.display.name}`,
        environment: "production",
      });

      expect(node.id).toContain(comp.id);
      expect(node.type).toBe(comp.id);
      expect(node.position).toEqual({ x: 300, y: 400 });
      expect(node.status).toBe("idle");
      expect(node.data.label).toBe(`Test ${comp.display.name}`);
      expect(node.data.componentType).toBe(comp.id);
      expect(node.data.environment).toBe("production");

      const schemaResult = BaseNodeSchema.safeParse(node);
      expect(
        schemaResult.success,
        `BaseNode validation failed for "${comp.id}": ${
          !schemaResult.success ? JSON.stringify(schemaResult.error) : ""
        }`
      ).toBe(true);
    }
  });

  it("ensures all inspector sections contain valid paths that exist on defaultConfig", () => {
    for (const comp of ALL_AI_AND_MACHINE_LEARNING_DEFINITIONS) {
      expect(comp.inspector.length).toBeGreaterThan(0);
      for (const section of comp.inspector) {
        expect(section.id).toBeTruthy();
        expect(section.title).toBeTruthy();
        expect(section.fields.length).toBeGreaterThan(0);
        for (const field of section.fields) {
          expect(field.path).toBeTruthy();
          expect(field.label).toBeTruthy();
          expect(["text", "number", "boolean", "select", "multiselect", "textarea"]).toContain(
            field.type
          );
          if (field.type === "select") {
            expect(field.options?.length).toBeGreaterThan(0);
          }
          expect(field.path in comp.defaultConfig).toBe(true);
        }
      }
    }
  });
});
