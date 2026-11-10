import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  DNS_CDN_EDGE_CATEGORY_ID,
  ALL_DNS_CDN_EDGE_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.2 — Infrastructure Component Registry (DNS, CDN & Edge)", () => {
  it("registers the canonical DNS, CDN & Edge category", () => {
    const cat = infrastructureRegistry.getCategory(DNS_CDN_EDGE_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("DNS, CDN & Edge");
    expect(cat?.order).toBe(2);
  });

  it("registers exactly 10 production DNS, CDN & Edge components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(DNS_CDN_EDGE_CATEGORY_ID);
    expect(components).toHaveLength(10);
    expect(ALL_DNS_CDN_EDGE_DEFINITIONS).toHaveLength(10);
  });

  it("ensures all 10 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_DNS_CDN_EDGE_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(DNS_CDN_EDGE_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_DNS_CDN_EDGE_DEFINITIONS) {
      const parsed = comp.configSchema.safeParse(comp.defaultConfig);
      expect(parsed.success, `defaultConfig for "${comp.id}" failed schema validation`).toBe(true);

      const valResult = infrastructureRegistry.validateConfiguration(comp.id, comp.defaultConfig);
      expect(valResult.success, `validateConfiguration for "${comp.id}" failed: ${valResult.errors?.join(", ")}`).toBe(true);
      expect(valResult.errors).toBeUndefined();
    }
  });

  it("rejects invalid configurations with informative error messages", () => {
    const badDnsConfig = {
      label: "", // Empty label not allowed
      queryTimeoutMs: 50, // Min is 100
      assumedQps: -100,
    };
    const res = infrastructureRegistry.validateConfiguration("dns-resolver", badDnsConfig);
    expect(res.success).toBe(false);
    expect(res.errors && res.errors.length > 0).toBe(true);

    const badWorkerConfig = {
      memoryLimitMb: 4096, // Max is 1024
      executionTimeoutMs: 60000, // Max is 30000
    };
    const workerRes = infrastructureRegistry.validateConfiguration("edge-worker", badWorkerConfig);
    expect(workerRes.success).toBe(false);
  });

  it("ensures port definitions are well-formed and unique within each component", () => {
    for (const comp of ALL_DNS_CDN_EDGE_DEFINITIONS) {
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
      "dns-resolver",
      "authoritative-dns",
      "cdn",
      "edge-cache",
      "edge-worker",
      "edge-router",
      "reverse-proxy",
      "global-traffic-manager",
      "anycast-network",
    ];

    for (const compId of componentsToTest) {
      const node = infrastructureRegistry.createInfrastructureNode(compId, {
        label: `Test ${compId}`,
        position: { x: 250, y: 150 },
      });

      expect(node.id).toContain(`infra_${compId}_`);
      expect(node.type).toBe(compId);
      expect(node.label).toBe(`Test ${compId}`);
      expect(node.position).toEqual({ x: 250, y: 150 });
      expect(node.data.isInfrastructure).toBe(true);
      expect(node.data.componentType).toBe(compId);
      expect(node.data.categoryId).toBe(DNS_CDN_EDGE_CATEGORY_ID);

      // Verify against @nxtqr/graph-schema
      const schemaValidation = BaseNodeSchema.safeParse(node);
      expect(schemaValidation.success, `Generated node for ${compId} must satisfy BaseNodeSchema`).toBe(true);
    }
  });

  it("supports accurate search queries across DNS, CDN & Edge components", () => {
    expect(infrastructureRegistry.searchComponents("dns").length).toBeGreaterThanOrEqual(3); // resolver, authoritative, lb
    const cdnMatches = infrastructureRegistry.searchComponents("cdn");
    expect(cdnMatches.length).toBeGreaterThanOrEqual(1);
    expect(cdnMatches.some((c) => c.id === "cdn")).toBe(true);
    const workerMatches = infrastructureRegistry.searchComponents("worker");
    expect(workerMatches.some((c) => c.id === "edge-worker")).toBe(true);
    expect(infrastructureRegistry.searchComponents("edge-worker")).toHaveLength(1);
    expect(infrastructureRegistry.searchComponents("reverse-proxy")).toHaveLength(1);
    expect(infrastructureRegistry.searchComponents("anycast").length).toBeGreaterThanOrEqual(1);
    expect(infrastructureRegistry.searchComponents("anycast").some((c) => c.id === "anycast-network")).toBe(true);
    expect(infrastructureRegistry.searchComponents("traffic-manager")).toHaveLength(1);
    expect(infrastructureRegistry.searchComponents("bgp")).toHaveLength(1); // keyword in Anycast
    expect(infrastructureRegistry.searchComponents("v8-isolate")).toHaveLength(1); // keyword in Edge Worker
  });
});
