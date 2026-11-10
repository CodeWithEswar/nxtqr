import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  SEARCH_AND_DISCOVERY_CATEGORY_ID,
  ALL_SEARCH_AND_DISCOVERY_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.11 — Infrastructure Component Registry (Search & Discovery)", () => {
  it("registers the canonical Search & Discovery category", () => {
    const cat = infrastructureRegistry.getCategory(SEARCH_AND_DISCOVERY_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Search & Discovery");
    expect(cat?.order).toBe(11);
  });

  it("registers exactly 8 production Search & Discovery components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      SEARCH_AND_DISCOVERY_CATEGORY_ID
    );
    expect(components).toHaveLength(8);
    expect(ALL_SEARCH_AND_DISCOVERY_DEFINITIONS).toHaveLength(8);
  });

  it("ensures all 8 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_SEARCH_AND_DISCOVERY_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(SEARCH_AND_DISCOVERY_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_SEARCH_AND_DISCOVERY_DEFINITIONS) {
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
    for (const comp of ALL_SEARCH_AND_DISCOVERY_DEFINITIONS) {
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
    for (const comp of ALL_SEARCH_AND_DISCOVERY_DEFINITIONS) {
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

  it("supports deep search queries matching Search & Discovery keywords and components", () => {
    const opensearchResults = infrastructureRegistry.searchComponents("opensearch");
    expect(opensearchResults.length).toBeGreaterThanOrEqual(1);
    expect(opensearchResults.some((c) => c.id === "search-engine")).toBe(true);

    const indexResults = infrastructureRegistry.searchComponents("inverted-index");
    expect(indexResults.length).toBeGreaterThanOrEqual(1);
    expect(indexResults.some((c) => c.id === "full-text-search-index")).toBe(true);

    const indexerResults = infrastructureRegistry.searchComponents("indexer");
    expect(indexerResults.length).toBeGreaterThanOrEqual(1);
    expect(indexerResults.some((c) => c.id === "search-indexer")).toBe(true);

    const suggestResults = infrastructureRegistry.searchComponents("autocomplete");
    expect(suggestResults.length).toBeGreaterThanOrEqual(1);
    expect(suggestResults.some((c) => c.id === "autocomplete-service")).toBe(true);

    const recsysResults = infrastructureRegistry.searchComponents("recommendations");
    expect(recsysResults.length).toBeGreaterThanOrEqual(1);
    expect(recsysResults.some((c) => c.id === "recommendation-engine")).toBe(true);

    const discoveryResults = infrastructureRegistry.searchComponents("discovery");
    expect(discoveryResults.length).toBeGreaterThanOrEqual(1);
    expect(discoveryResults.some((c) => c.id === "discovery-service")).toBe(true);

    const cacheResults = infrastructureRegistry.searchComponents("search-cache");
    expect(cacheResults.length).toBeGreaterThanOrEqual(1);
    expect(cacheResults.some((c) => c.id === "search-cache")).toBe(true);

    const queryResults = infrastructureRegistry.searchComponents("processor");
    expect(queryResults.length).toBeGreaterThanOrEqual(1);
    expect(queryResults.some((c) => c.id === "query-processor")).toBe(true);
  });
});
