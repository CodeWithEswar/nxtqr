import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  CACHING_AND_PERFORMANCE_CATEGORY_ID,
  ALL_CACHING_AND_PERFORMANCE_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.6 — Infrastructure Component Registry (Caching & Performance)", () => {
  it("registers the canonical Caching & Performance category", () => {
    const cat = infrastructureRegistry.getCategory(CACHING_AND_PERFORMANCE_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Caching & Performance");
    expect(cat?.order).toBe(6);
  });

  it("registers exactly 10 production Caching & Performance components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(CACHING_AND_PERFORMANCE_CATEGORY_ID);
    expect(components).toHaveLength(10);
    expect(ALL_CACHING_AND_PERFORMANCE_DEFINITIONS).toHaveLength(10);
  });

  it("ensures all 10 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_CACHING_AND_PERFORMANCE_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(CACHING_AND_PERFORMANCE_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_CACHING_AND_PERFORMANCE_DEFINITIONS) {
      const parsed = comp.configSchema.safeParse(comp.defaultConfig);
      expect(
        parsed.success,
        `defaultConfig for "${comp.id}" failed schema validation: ${!parsed.success ? JSON.stringify(parsed.error) : ""}`
      ).toBe(true);

      const valResult = infrastructureRegistry.validateConfiguration(comp.id, comp.defaultConfig);
      expect(
        valResult.success,
        `validateConfiguration for "${comp.id}" failed: ${valResult.errors?.join(", ")}`
      ).toBe(true);
      expect(valResult.errors).toBeUndefined();
    }
  });

  it("rejects invalid configurations with informative error messages", () => {
    const badRedisConfig = {
      label: "",
      deploymentMode: "invalid-mode",
      memoryAllocationMb: 10, // Min is 64
    };
    const res = infrastructureRegistry.validateConfiguration("redis-cache", badRedisConfig);
    expect(res.success).toBe(false);
    expect(res.errors && res.errors.length > 0).toBe(true);

    const badRateLimitConfig = {
      rateLimitAlgorithm: "invalid-algorithm",
      tokenCapacity: -5,
    };
    const rateRes = infrastructureRegistry.validateConfiguration("rate-limit-store", badRateLimitConfig);
    expect(rateRes.success).toBe(false);
  });

  it("ensures port definitions are well-formed and unique within each component", () => {
    for (const comp of ALL_CACHING_AND_PERFORMANCE_DEFINITIONS) {
      expect(comp.ports.length, `${comp.id} must have connection ports`).toBeGreaterThan(0);
      const portIds = new Set<string>();

      for (const port of comp.ports) {
        expect(portIds.has(port.id), `Duplicate port "${port.id}" in ${comp.id}`).toBe(false);
        portIds.add(port.id);
        expect(port.name).toBeTruthy();
        expect(["input", "output", "bidirectional"]).toContain(port.type);
      }
    }
  });

  it("creates fully-formed BaseNode instances matching @nxtqr/graph-schema", () => {
    for (const comp of ALL_CACHING_AND_PERFORMANCE_DEFINITIONS) {
      const node = infrastructureRegistry.createInfrastructureNode(comp.id, {
        position: { x: 150, y: 250 },
        label: `Test ${comp.display.name}`,
      });

      expect(node.id).toMatch(new RegExp(`^infra_${comp.id}_[a-z0-9]+$`));
      expect(node.type).toBe(comp.id);
      expect(node.position).toEqual({ x: 150, y: 250 });
      expect(node.label).toBe(`Test ${comp.display.name}`);
      expect(node.data.isInfrastructure).toBe(true);
      expect(node.data.categoryId).toBe(CACHING_AND_PERFORMANCE_CATEGORY_ID);

      const parsedNode = BaseNodeSchema.safeParse(node);
      expect(
        parsedNode.success,
        `Node "${comp.id}" failed BaseNodeSchema validation: ${JSON.stringify(
          !parsedNode.success ? (parsedNode as any).error?.errors : ""
        )}`
      ).toBe(true);
    }
  });

  it("filters components by keyword accurately", () => {
    const redisMatches = infrastructureRegistry.searchComponents("redis");
    expect(redisMatches.some((c) => c.id === "redis-cache")).toBe(true);

    const rateLimitMatches = infrastructureRegistry.searchComponents("rate-limit");
    expect(rateLimitMatches.some((c) => c.id === "rate-limit-store")).toBe(true);

    const writeBehindMatches = infrastructureRegistry.searchComponents("write-behind");
    expect(writeBehindMatches.some((c) => c.id === "write-behind-cache")).toBe(true);
  });
});
