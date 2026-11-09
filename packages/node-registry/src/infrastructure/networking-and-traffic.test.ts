import { describe, it, expect } from "vitest";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import {
  infrastructureRegistry,
  NETWORKING_AND_TRAFFIC_CATEGORY_ID,
  ALL_NETWORKING_AND_TRAFFIC_DEFINITIONS,
} from "./index";

describe("NXTQR Phase 05.1.3 — Infrastructure Component Registry (Networking & Traffic)", () => {
  it("registers the canonical Networking & Traffic category", () => {
    const cat = infrastructureRegistry.getCategory(NETWORKING_AND_TRAFFIC_CATEGORY_ID);
    expect(cat).toBeDefined();
    expect(cat?.name).toBe("Networking & Traffic");
    expect(cat?.order).toBe(3);
  });

  it("registers exactly 12 production Networking & Traffic components", () => {
    const components = infrastructureRegistry.listComponentsByCategory(NETWORKING_AND_TRAFFIC_CATEGORY_ID);
    expect(components).toHaveLength(12);
    expect(ALL_NETWORKING_AND_TRAFFIC_DEFINITIONS).toHaveLength(12);
  });

  it("ensures all 12 components have unique IDs, valid display metadata, and matching iconSlug", () => {
    const ids = new Set<string>();
    for (const comp of ALL_NETWORKING_AND_TRAFFIC_DEFINITIONS) {
      expect(ids.has(comp.id), `Component ID "${comp.id}" must be unique`).toBe(false);
      ids.add(comp.id);

      expect(comp.display.name).toBeTruthy();
      expect(comp.display.shortName).toBeTruthy();
      expect(comp.display.description).toBeTruthy();
      expect(comp.display.iconSlug).toBe(comp.id);
      expect(comp.display.keywords.length).toBeGreaterThan(0);
      expect(comp.version).toBe(1);
      expect(comp.categoryId).toBe(NETWORKING_AND_TRAFFIC_CATEGORY_ID);
    }
  });

  it("validates that all defaultConfigs strictly satisfy their Zod schemas", () => {
    for (const comp of ALL_NETWORKING_AND_TRAFFIC_DEFINITIONS) {
      const parsed = comp.configSchema.safeParse(comp.defaultConfig);
      expect(parsed.success, `defaultConfig for "${comp.id}" failed schema validation: ${!parsed.success ? JSON.stringify(parsed.error) : ""}`).toBe(true);

      const valResult = infrastructureRegistry.validateConfiguration(comp.id, comp.defaultConfig);
      expect(valResult.success, `validateConfiguration for "${comp.id}" failed: ${valResult.errors?.join(", ")}`).toBe(true);
      expect(valResult.errors).toBeUndefined();
    }
  });

  it("rejects invalid configurations with informative error messages", () => {
    const badLbConfig = {
      label: "",
      algorithm: "invalid-algo",
      healthCheckIntervalSeconds: 0,
    };
    const res = infrastructureRegistry.validateConfiguration("load-balancer", badLbConfig);
    expect(res.success).toBe(false);
    expect(res.errors && res.errors.length > 0).toBe(true);

    const badVpcConfig = {
      primaryCidr: "10.0.0.0/16",
      peeringConnectionsCount: -1, // Min is 0
    };
    const vpcRes = infrastructureRegistry.validateConfiguration("vpc", badVpcConfig);
    expect(vpcRes.success).toBe(false);
  });

  it("ensures port definitions are well-formed and unique within each component", () => {
    for (const comp of ALL_NETWORKING_AND_TRAFFIC_DEFINITIONS) {
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
      "load-balancer",
      "layer-4-load-balancer",
      "layer-7-load-balancer",
      "api-gateway",
      "ingress-controller",
      "forward-proxy",
      "nat-gateway",
      "vpc",
      "subnet",
      "service-discovery",
      "service-mesh",
      "network-firewall",
    ];

    for (const compId of componentsToTest) {
      const node = infrastructureRegistry.createInfrastructureNode(compId, {
        label: `Test ${compId}`,
        position: { x: 300, y: 200 },
      });

      expect(node.id).toMatch(new RegExp(`^infra_${compId}_`));
      expect(node.type).toBe(compId);
      expect(node.position).toEqual({ x: 300, y: 200 });
      expect(node.label).toBe(`Test ${compId}`);
      expect(node.data.isInfrastructure).toBe(true);
      expect(node.data.categoryId).toBe(NETWORKING_AND_TRAFFIC_CATEGORY_ID);
      expect(node.ports).toBeDefined();
      expect(node.ports!.length).toBeGreaterThan(0);

      // Verify node satisfies NXTQR canonical BaseNodeSchema
      const parseResult = BaseNodeSchema.safeParse(node);
      expect(
        parseResult.success,
        `Node "${compId}" does not satisfy BaseNodeSchema: ${JSON.stringify(parseResult.error)}`
      ).toBe(true);
    }
  });

  it("supports fast and resilient keyword searching across all 12 components", () => {
    const lbResults = infrastructureRegistry.searchComponents("load balancer");
    expect(lbResults.length).toBeGreaterThanOrEqual(3);

    const gatewayResults = infrastructureRegistry.searchComponents("gateway");
    expect(gatewayResults.some((c) => c.id === "api-gateway")).toBe(true);
    expect(gatewayResults.some((c) => c.id === "nat-gateway")).toBe(true);

    const meshResults = infrastructureRegistry.searchComponents("mesh");
    expect(meshResults.some((c) => c.id === "service-mesh")).toBe(true);

    const firewallResults = infrastructureRegistry.searchComponents("firewall");
    expect(firewallResults.some((c) => c.id === "network-firewall")).toBe(true);

    const vpcResults = infrastructureRegistry.searchComponents("vpc");
    expect(vpcResults.some((c) => c.id === "vpc")).toBe(true);
  });
});
