import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  DATA_ENGINEERING_AND_ANALYTICS_CATEGORY_ID,
  ALL_DATA_ENGINEERING_AND_ANALYTICS_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.13 — Infrastructure Component Registry (Data Engineering & Analytics)", () => {
  it("registers the canonical Data Engineering & Analytics category", () => {
    const cat = infrastructureRegistry.getCategory(DATA_ENGINEERING_AND_ANALYTICS_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Data Engineering & Analytics");
    expect(cat?.order).toBe(13);
  });

  it("registers exactly 10 production Data Engineering & Analytics components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      DATA_ENGINEERING_AND_ANALYTICS_CATEGORY_ID
    );
    expect(components).toHaveLength(10);
    expect(ALL_DATA_ENGINEERING_AND_ANALYTICS_DEFINITIONS).toHaveLength(10);
  });

  it("ensures all 10 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_DATA_ENGINEERING_AND_ANALYTICS_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(DATA_ENGINEERING_AND_ANALYTICS_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_DATA_ENGINEERING_AND_ANALYTICS_DEFINITIONS) {
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
    for (const comp of ALL_DATA_ENGINEERING_AND_ANALYTICS_DEFINITIONS) {
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
    for (const comp of ALL_DATA_ENGINEERING_AND_ANALYTICS_DEFINITIONS) {
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

  it("supports deep search queries matching Data Engineering keywords and components", () => {
    const etlResults = infrastructureRegistry.searchComponents("spark");
    expect(etlResults.length).toBeGreaterThanOrEqual(1);
    expect(etlResults.some((c) => c.id === "etl-pipeline")).toBe(true);

    const eltResults = infrastructureRegistry.searchComponents("dbt");
    expect(eltResults.length).toBeGreaterThanOrEqual(1);
    expect(eltResults.some((c) => c.id === "elt-pipeline")).toBe(true);

    const lakeResults = infrastructureRegistry.searchComponents("parquet");
    expect(lakeResults.length).toBeGreaterThanOrEqual(1);
    expect(lakeResults.some((c) => c.id === "data-lake")).toBe(true);

    const lakehouseResults = infrastructureRegistry.searchComponents("iceberg");
    expect(lakehouseResults.length).toBeGreaterThanOrEqual(1);
    expect(lakehouseResults.some((c) => c.id === "data-lakehouse")).toBe(true);

    const pipelineResults = infrastructureRegistry.searchComponents("flink");
    expect(pipelineResults.length).toBeGreaterThanOrEqual(1);
    expect(pipelineResults.some((c) => c.id === "data-pipeline")).toBe(true);

    const cdcResults = infrastructureRegistry.searchComponents("debezium");
    expect(cdcResults.length).toBeGreaterThanOrEqual(1);
    expect(cdcResults.some((c) => c.id === "cdc-connector")).toBe(true);

    const olapResults = infrastructureRegistry.searchComponents("clickhouse");
    expect(olapResults.length).toBeGreaterThanOrEqual(1);
    expect(olapResults.some((c) => c.id === "olap-engine")).toBe(true);

    const airflowResults = infrastructureRegistry.searchComponents("airflow");
    expect(airflowResults.length).toBeGreaterThanOrEqual(1);
    expect(airflowResults.some((c) => c.id === "workflow-orchestrator")).toBe(true);
  });
});

