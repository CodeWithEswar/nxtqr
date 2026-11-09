import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  DATABASES_AND_PERSISTENCE_CATEGORY_ID,
  ALL_DATABASES_AND_PERSISTENCE_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.5 — Infrastructure Component Registry (Databases & Persistence)", () => {
  it("registers the canonical Databases & Persistence category", () => {
    const cat = infrastructureRegistry.getCategory(DATABASES_AND_PERSISTENCE_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Databases & Persistence");
    expect(cat?.order).toBe(5);
  });

  it("registers exactly 15 production Databases & Persistence components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(DATABASES_AND_PERSISTENCE_CATEGORY_ID);
    expect(components).toHaveLength(15);
    expect(ALL_DATABASES_AND_PERSISTENCE_DEFINITIONS).toHaveLength(15);
  });

  it("ensures all 15 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_DATABASES_AND_PERSISTENCE_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(DATABASES_AND_PERSISTENCE_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_DATABASES_AND_PERSISTENCE_DEFINITIONS) {
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
    const badPgConfig = {
      label: "",
      version: "invalid-version",
      storageGb: 5, // Min is 20
    };
    const res = infrastructureRegistry.validateConfiguration("postgresql", badPgConfig);
    expect(res.success).toBe(false);
    expect(res.errors && res.errors.length > 0).toBe(true);

    const badVectorConfig = {
      embeddingDimensions: 16, // Min is 64
      distanceMetric: "invalid-metric",
    };
    const vecRes = infrastructureRegistry.validateConfiguration("vector-database", badVectorConfig);
    expect(vecRes.success).toBe(false);
  });

  it("ensures port definitions are well-formed and unique within each component", () => {
    for (const comp of ALL_DATABASES_AND_PERSISTENCE_DEFINITIONS) {
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
    const componentsToTest = [
      "relational-database",
      "postgresql",
      "mysql",
      "distributed-sql-database",
      "document-database",
      "key-value-database",
      "wide-column-database",
      "graph-database",
      "time-series-database",
      "vector-database",
      "in-memory-database",
      "database-primary",
      "read-replica",
      "database-cluster",
      "data-warehouse",
    ];

    for (const slug of componentsToTest) {
      const node = infrastructureRegistry.createInfrastructureNode(slug, {
        position: { x: 150, y: 300 },
        label: `Custom ${slug}`,
      });

      expect(node.id).toMatch(new RegExp(`^infra_${slug}_`));
      expect(node.type).toBe(slug);
      expect(node.position).toEqual({ x: 150, y: 300 });
      expect(node.label).toBe(`Custom ${slug}`);
      expect(node.data.isInfrastructure).toBe(true);
      expect(node.data.categoryId).toBe(DATABASES_AND_PERSISTENCE_CATEGORY_ID);

      const parsed = BaseNodeSchema.safeParse(node);
      expect(
        parsed.success,
        `Node "${node.id}" failed BaseNodeSchema validation: ${!parsed.success ? JSON.stringify(parsed.error) : ""}`
      ).toBe(true);
    }
  });

  it("supports accurate keyword and metadata searches for database architecture components", () => {
    const qdrantResults = infrastructureRegistry.searchComponents("qdrant");
    expect(qdrantResults.some((c) => c.id === "vector-database")).toBe(true);

    const postgresResults = infrastructureRegistry.searchComponents("postgresql");
    expect(postgresResults.some((c) => c.id === "postgresql")).toBe(true);

    const snowflakeResults = infrastructureRegistry.searchComponents("snowflake");
    expect(snowflakeResults.some((c) => c.id === "data-warehouse")).toBe(true);

    const cassandraResults = infrastructureRegistry.searchComponents("cassandra");
    expect(cassandraResults.some((c) => c.id === "wide-column-database")).toBe(true);

    const neo4jResults = infrastructureRegistry.searchComponents("neo4j");
    expect(neo4jResults.some((c) => c.id === "graph-database")).toBe(true);
  });
});
