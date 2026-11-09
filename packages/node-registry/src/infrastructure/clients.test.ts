import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  CLIENTS_CATEGORY_ID,
  ALL_CLIENT_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.1 — Infrastructure Component Registry (Clients & UI)", () => {
  it("registers the canonical clients category", () => {
    const cat = infrastructureRegistry.getCategory(CLIENTS_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Clients & User Interfaces");
    expect(cat?.order).toBe(1);
  });

  it("registers exactly 10 production client components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(CLIENTS_CATEGORY_ID);
    expect(components).toHaveLength(10);
    expect(ALL_CLIENT_DEFINITIONS).toHaveLength(10);
  });

  it("ensures all 10 components have unique IDs and valid display metadata", () => {
    const ids = new Set<string>();
    for (const comp of ALL_CLIENT_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(CLIENTS_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_CLIENT_DEFINITIONS) {
      const parsed = comp.configSchema.safeParse(comp.defaultConfig);
      expect(parsed.success, `defaultConfig for "${comp.id}" failed schema validation`).toBe(true);

      const valResult = infrastructureRegistry.validateConfiguration(comp.id, comp.defaultConfig);
      expect(valResult.success).toBe(true);
      expect(valResult.errors).toBeUndefined();
    }
  });

  it("rejects invalid configurations with informative error messages", () => {
    const badConfig = {
      label: "", // Empty label not allowed
      environment: "invalid-env",
      concurrentUsers: -10,
    };
    const res = infrastructureRegistry.validateConfiguration("web-browser", badConfig);
    expect(res.success).toBe(false);
    expect(res.errors && res.errors.length > 0).toBe(true);
  });

  it("ensures port definitions are well-formed and unique within each component", () => {
    for (const comp of ALL_CLIENT_DEFINITIONS) {
      expect(comp.ports.length, `${comp.id} must have connection ports`).toBeGreaterThan(0);
      const portIds = new Set<string>();

      for (const port of comp.ports) {
        expect(portIds.has(port.id), `Duplicate port "${port.id}" in ${comp.id}`).toBe(false);
        portIds.add(port.id);
        expect(["input", "output", "bidirectional"]).toContain(port.type);
        expect(port.dataType).toBeTruthy();
      }
    }
  });

  it("creates fully valid BaseNode objects ready for React Flow and persistence", () => {
    const node = infrastructureRegistry.createInfrastructureNode("web-browser", {
      label: "Production Chromium Fleet",
      position: { x: 120, y: 340 },
    });

    expect(node.id).toContain("infra_web-browser_");
    expect(node.type).toBe("web-browser");
    expect(node.label).toBe("Production Chromium Fleet");
    expect(node.position).toEqual({ x: 120, y: 340 });
    expect(node.data.isInfrastructure).toBe(true);
    expect(node.data.componentType).toBe("web-browser");

    // Verify against @nxtqr/graph-schema
    const schemaValidation = BaseNodeSchema.safeParse(node);
    expect(schemaValidation.success, "Generated node must satisfy BaseNodeSchema").toBe(true);
  });

  it("supports accurate multi-field search", () => {
    expect(infrastructureRegistry.searchComponents("browser")).toHaveLength(1);
    expect(infrastructureRegistry.searchComponents("mobile")).toHaveLength(1);
    expect(infrastructureRegistry.searchComponents("iot")).toHaveLength(1);
    expect(infrastructureRegistry.searchComponents("terminal")).toHaveLength(1); // keyword in CLI
    expect(infrastructureRegistry.searchComponents("jamstack")).toHaveLength(1); // keyword in Static site
    expect(infrastructureRegistry.searchComponents("non-existent-xyz")).toHaveLength(0);
  });
});
