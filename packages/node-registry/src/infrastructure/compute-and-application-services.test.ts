import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  COMPUTE_AND_APPLICATION_SERVICES_CATEGORY_ID,
  ALL_COMPUTE_AND_APPLICATION_SERVICES_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.4 — Infrastructure Component Registry (Compute & Application Services)", () => {
  it("registers the canonical Compute & Application Services category", () => {
    const cat = infrastructureRegistry.getCategory(COMPUTE_AND_APPLICATION_SERVICES_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Compute & Application Services");
    expect(cat?.order).toBe(4);
  });

  it("registers exactly 14 production Compute & Application Services components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(COMPUTE_AND_APPLICATION_SERVICES_CATEGORY_ID);
    expect(components).toHaveLength(14);
    expect(ALL_COMPUTE_AND_APPLICATION_SERVICES_DEFINITIONS).toHaveLength(14);
  });

  it("ensures all 14 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_COMPUTE_AND_APPLICATION_SERVICES_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(COMPUTE_AND_APPLICATION_SERVICES_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_COMPUTE_AND_APPLICATION_SERVICES_DEFINITIONS) {
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
    const badWebServerConfig = {
      label: "",
      serverCategory: "invalid-engine",
      httpPort: 70000, // Invalid port
    };
    const res = infrastructureRegistry.validateConfiguration("web-server", badWebServerConfig);
    expect(res.success).toBe(false);
    expect(res.errors && res.errors.length > 0).toBe(true);

    const badWorkerConfig = {
      workerConcurrency: -5, // Min is 1
      batchSize: 0, // Min is 1
    };
    const workerRes = infrastructureRegistry.validateConfiguration("background-worker", badWorkerConfig);
    expect(workerRes.success).toBe(false);
  });

  it("ensures port definitions are well-formed and unique within each component", () => {
    for (const comp of ALL_COMPUTE_AND_APPLICATION_SERVICES_DEFINITIONS) {
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
      "web-server",
      "application-server",
      "backend-service",
      "microservice",
      "monolithic-application",
      "serverless-function",
      "container",
      "container-cluster",
      "kubernetes-pod",
      "kubernetes-service",
      "virtual-machine",
      "background-worker",
      "scheduled-job",
      "batch-processor",
    ];

    for (const compId of componentsToTest) {
      const node = infrastructureRegistry.createInfrastructureNode(compId, {
        position: { x: 150, y: 220 },
      });

      expect(node.id).toMatch(new RegExp(`^infra_${compId}_`));
      expect(node.type).toBe(compId);
      expect(node.position).toEqual({ x: 150, y: 220 });
      expect(node.ports).toBeDefined();
      expect(node.ports!.length).toBeGreaterThan(0);

      // Validate against the strict monorepo BaseNodeSchema
      const parseResult = BaseNodeSchema.safeParse(node);
      expect(
        parseResult.success,
        `Node "${node.id}" failed BaseNodeSchema: ${!parseResult.success ? JSON.stringify(parseResult.error) : ""}`
      ).toBe(true);
    }
  });

  it("supports catalog search by name, keywords, and description", () => {
    const webResults = infrastructureRegistry.searchComponents("nginx");
    expect(webResults.some((c) => c.id === "web-server")).toBe(true);

    const k8sResults = infrastructureRegistry.searchComponents("kubernetes");
    expect(k8sResults.some((c) => c.id === "kubernetes-pod")).toBe(true);
    expect(k8sResults.some((c) => c.id === "kubernetes-service")).toBe(true);

    const batchResults = infrastructureRegistry.searchComponents("mapreduce");
    expect(batchResults.some((c) => c.id === "batch-processor")).toBe(true);
  });
});
