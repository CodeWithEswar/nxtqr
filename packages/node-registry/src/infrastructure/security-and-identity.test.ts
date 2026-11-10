import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  SECURITY_AND_IDENTITY_CATEGORY_ID,
  ALL_SECURITY_AND_IDENTITY_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.9 — Infrastructure Component Registry (Security & Identity)", () => {
  it("registers the canonical Security & Identity category", () => {
    const cat = infrastructureRegistry.getCategory(SECURITY_AND_IDENTITY_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Security & Identity");
    expect(cat?.order).toBe(9);
  });

  it("registers exactly 14 production Security & Identity components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      SECURITY_AND_IDENTITY_CATEGORY_ID
    );
    expect(components).toHaveLength(14);
    expect(ALL_SECURITY_AND_IDENTITY_DEFINITIONS).toHaveLength(14);
  });

  it("ensures all 14 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_SECURITY_AND_IDENTITY_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(SECURITY_AND_IDENTITY_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_SECURITY_AND_IDENTITY_DEFINITIONS) {
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

  it("ensures every component exposes valid, unique typed ports", () => {
    for (const comp of ALL_SECURITY_AND_IDENTITY_DEFINITIONS) {
      expect(comp.ports.length).toBeGreaterThanOrEqual(2);
      const portIds = new Set<string>();
      for (const port of comp.ports) {
        expect(portIds.has(port.id), `Duplicate port "${port.id}" on "${comp.id}"`).toBe(false);
        portIds.add(port.id);
        expect(["input", "output"]).toContain(port.type);
        expect(port.dataType).toBeTruthy();
        expect(port.description).toBeTruthy();
      }
    }
  });

  it("creates valid graph nodes that conform to BaseNodeSchema", () => {
    for (const comp of ALL_SECURITY_AND_IDENTITY_DEFINITIONS) {
      const node = infrastructureRegistry.createInfrastructureNode(comp.id, {
        position: { x: 120, y: 240 },
        environment: "staging",
      });

      expect(node.type).toBe(comp.id);
      expect(node.data.componentType).toBe(comp.id);
      expect(node.data.environment).toBe("staging");

      const parsedNode = BaseNodeSchema.safeParse(node);
      expect(
        parsedNode.success,
        `Generated node for "${comp.id}" failed BaseNodeSchema: ${
          !parsedNode.success ? JSON.stringify(parsedNode.error) : ""
        }`
      ).toBe(true);
    }
  });

  it("verifies security requirements: no real plaintext secrets or private keys in defaults", () => {
    for (const comp of ALL_SECURITY_AND_IDENTITY_DEFINITIONS) {
      const configStr = JSON.stringify(comp.defaultConfig).toLowerCase();
      expect(configStr).not.toContain("rawpassword");
      expect(configStr).not.toContain("clientsecret");
      expect(configStr).not.toContain("privatekey");
      expect(configStr).not.toContain("bearer eyj");
    }
  });

  it("provides inspector configurations with valid paths", () => {
    for (const comp of ALL_SECURITY_AND_IDENTITY_DEFINITIONS) {
      expect(comp.inspector.length).toBeGreaterThan(0);
      for (const section of comp.inspector) {
        expect(section.id).toBeTruthy();
        expect(section.title).toBeTruthy();
        expect(section.fields.length).toBeGreaterThan(0);
        for (const field of section.fields) {
          expect(field.path).toBeTruthy();
          expect(field.label).toBeTruthy();
          expect(comp.defaultConfig).toHaveProperty(field.path);
        }
      }
    }
  });
});
