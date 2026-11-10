import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  OBSERVABILITY_AND_RELIABILITY_CATEGORY_ID,
  ALL_OBSERVABILITY_AND_RELIABILITY_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.10 — Infrastructure Component Registry (Observability & Reliability)", () => {
  it("registers the canonical Observability & Reliability category", () => {
    const cat = infrastructureRegistry.getCategory(OBSERVABILITY_AND_RELIABILITY_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Observability & Reliability");
    expect(cat?.order).toBe(10);
  });

  it("registers exactly 10 production Observability & Reliability components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(
      OBSERVABILITY_AND_RELIABILITY_CATEGORY_ID
    );
    expect(components).toHaveLength(10);
    expect(ALL_OBSERVABILITY_AND_RELIABILITY_DEFINITIONS).toHaveLength(10);
  });

  it("ensures all 10 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_OBSERVABILITY_AND_RELIABILITY_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(OBSERVABILITY_AND_RELIABILITY_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_OBSERVABILITY_AND_RELIABILITY_DEFINITIONS) {
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
    for (const comp of ALL_OBSERVABILITY_AND_RELIABILITY_DEFINITIONS) {
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
    for (const comp of ALL_OBSERVABILITY_AND_RELIABILITY_DEFINITIONS) {
      const node = infrastructureRegistry.createInfrastructureNode(comp.id, {
        position: { x: 200, y: 150 },
        label: `Custom ${comp.display.name}`,
        environment: "production",
      });

      expect(node.id).toContain(comp.id);
      expect(node.type).toBe(comp.id);
      expect(node.position).toEqual({ x: 200, y: 150 });
      expect(node.status).toBe("idle");
      expect(node.data.label).toBe(`Custom ${comp.display.name}`);
      expect(node.data.componentType).toBe(comp.id);
      expect(node.data.environment).toBe("production");

      // Verify the resulting node passes standard NXTQR BaseNodeSchema validation
      const parseResult = BaseNodeSchema.safeParse(node);
      expect(parseResult.success).toBe(true);
    }
  });

  it("supports deep search queries matching Observability keywords and components", () => {
    const tracingResults = infrastructureRegistry.searchComponents("tracing");
    expect(tracingResults.length).toBeGreaterThanOrEqual(1);
    expect(tracingResults.some((c) => c.id === "distributed-tracing")).toBe(true);

    const metricsResults = infrastructureRegistry.searchComponents("metrics");
    expect(metricsResults.length).toBeGreaterThanOrEqual(1);
    expect(metricsResults.some((c) => c.id === "metrics-collector")).toBe(true);

    const alertResults = infrastructureRegistry.searchComponents("alert");
    expect(alertResults.length).toBeGreaterThanOrEqual(1);
    expect(alertResults.some((c) => c.id === "alert-manager")).toBe(true);

    const sentryResults = infrastructureRegistry.searchComponents("sentry");
    expect(sentryResults.some((c) => c.id === "error-tracker")).toBe(true);
  });
});
