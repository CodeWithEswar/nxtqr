import { describe, it, expect } from "vitest";
import { RequirementExtractor } from "../evolution/planning/requirement-extractor";
import { migrationStrategyRegistry } from "../evolution/registry/strategy-registry";
import type { ArchitectureSnapshot } from "../comparison/contracts/comparison.types";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

describe("Phase 05.3.26 — Migration Strategy Registry & Requirement Extraction", () => {
  const sourceSnapshot: ArchitectureSnapshot = {
    id: "snap-source-legacy",
    title: "Legacy Monolith Architecture",
    schemaVersion: 1,
    provenance: "current-draft",
    revision: "rev-source-legacy",
    createdAt: new Date().toISOString(),
    nodes: [
      {
        id: "legacy-monolith",
        type: "custom",
        position: { x: 100, y: 100 },
        data: { label: "Legacy Monolith App", nodeType: "service", tier: "application" },
      } as BaseNode,
      {
        id: "legacy-oracle-db",
        type: "custom",
        position: { x: 300, y: 100 },
        data: { label: "Legacy Monolithic DB", nodeType: "database", tier: "database" },
      } as BaseNode,
    ],
    edges: [
      {
        id: "e-mono-db",
        source: "legacy-monolith",
        target: "legacy-oracle-db",
        type: "smoothstep",
        data: {},
      } as unknown as BaseEdge,
    ],
    metadata: { environment: "datacenter-legacy", version: "1.0.0" },
  };

  const targetSnapshot: ArchitectureSnapshot = {
    id: "snap-target-microservices",
    title: "Microservices Architecture",
    schemaVersion: 1,
    provenance: "what-if-proposal",
    revision: "rev-target-microservices",
    createdAt: new Date().toISOString(),
    nodes: [
      {
        id: "api-gateway",
        type: "custom",
        position: { x: 50, y: 100 },
        data: { label: "Cloud API Gateway", nodeType: "gateway", tier: "edge" },
      } as BaseNode,
      {
        id: "order-service",
        type: "custom",
        position: { x: 250, y: 50 },
        data: { label: "Order Microservice", nodeType: "service", tier: "application" },
      } as BaseNode,
      {
        id: "payment-service",
        type: "custom",
        position: { x: 250, y: 150 },
        data: { label: "Payment Microservice", nodeType: "service", tier: "application" },
      } as BaseNode,
      {
        id: "order-db",
        type: "custom",
        position: { x: 450, y: 50 },
        data: { label: "Order PostgreSQL DB", nodeType: "database", tier: "database" },
      } as BaseNode,
      {
        id: "payment-db",
        type: "custom",
        position: { x: 450, y: 150 },
        data: { label: "Payment PostgreSQL DB", nodeType: "database", tier: "database" },
      } as BaseNode,
      {
        id: "event-broker",
        type: "custom",
        position: { x: 250, y: 250 },
        data: { label: "Kafka Event Broker", nodeType: "queue", tier: "integration" },
      } as BaseNode,
    ],
    edges: [
      { id: "e1", source: "api-gateway", target: "order-service", type: "smoothstep", data: {} } as unknown as BaseEdge,
      { id: "e2", source: "api-gateway", target: "payment-service", type: "smoothstep", data: {} } as unknown as BaseEdge,
      { id: "e3", source: "order-service", target: "order-db", type: "smoothstep", data: {} } as unknown as BaseEdge,
      { id: "e4", source: "payment-service", target: "payment-db", type: "smoothstep", data: {} } as unknown as BaseEdge,
      { id: "e5", source: "order-service", target: "event-broker", type: "smoothstep", data: {} } as unknown as BaseEdge,
    ],
    metadata: { environment: "cloud-native-aws", version: "2.0.0" },
  };

  it("registers standard 7 R's and modern strangler / cutover migration strategies", () => {
    const strategies = migrationStrategyRegistry.getAllStrategies();
    expect(strategies.length).toBeGreaterThanOrEqual(10);

    const ids = strategies.map((s) => s.id);
    expect(ids).toContain("rehost");
    expect(ids).toContain("replatform");
    expect(ids).toContain("refactor");
    expect(ids).toContain("rearchitect");
    expect(ids).toContain("replace");
    expect(ids).toContain("retire");
    expect(ids).toContain("retain");
    expect(ids).toContain("strangler_fig");
    expect(ids).toContain("parallel_run");
    expect(ids).toContain("blue_green");
    expect(ids).toContain("progressive_cutover");

    const strangler = migrationStrategyRegistry.getStrategy("strangler_fig");
    expect(strangler.name).toBe("Strangler Fig Application");
    expect(strangler.complexity).toBe("high");
    expect(strangler.tradeOffs.advantages.length).toBeGreaterThan(0);
    expect(strangler.tradeOffs.disadvantages.length).toBeGreaterThan(0);
  });

  it("accurately recommends Strangler Fig for monolith decomposition", () => {
    const recommendation = migrationStrategyRegistry.recommendStrategy(sourceSnapshot, targetSnapshot);
    expect(recommendation.recommendedStrategyId).toBe("strangler_fig");
    expect(recommendation.rationale).toContain("Strangler Fig");
  });

  it("extracts candidate requirements covering services, databases, routing, and decommissioning", () => {
    const requirements = RequirementExtractor.extractRequirements(
      sourceSnapshot,
      targetSnapshot,
      "test-proj-reqs"
    );

    expect(requirements.length).toBeGreaterThanOrEqual(5);

    // Verify categories extracted
    const categories = requirements.map((r) => r.category);
    expect(categories).toContain("network_routing");
    expect(categories).toContain("service_extraction");
    expect(categories).toContain("database_migration");
    expect(categories).toContain("data_synchronization");
    expect(categories).toContain("messaging_evolution");
    expect(categories).toContain("decommissioning");

    // Check specific requirement details
    const gatewayReq = requirements.find((r) => r.category === "network_routing");
    expect(gatewayReq?.title).toContain("API Gateway");
    expect(gatewayReq?.priority).toBe("critical");

    const decomReq = requirements.find((r) => r.category === "decommissioning");
    expect(decomReq?.sourceNodeIds).toContain("legacy-monolith");

    const syncReq = requirements.find((r) => r.category === "data_synchronization");
    expect(syncReq?.title).toContain("Dual-Write");
  });
});
