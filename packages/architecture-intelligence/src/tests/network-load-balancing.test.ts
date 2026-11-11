import { describe, it, expect } from "vitest";
import { LoadBalancingAnalyzer } from "../network/analysis/load-balancing-analyzer";
import { NetworkCapabilityRegistry } from "../network/providers/network-capability-registry";
import type { NetworkArchitectureTopology } from "../network/contracts/network.types";

describe("Phase 05.3.24: Load Balancing, Upstream Health & Capability Matrix", () => {
  const now = new Date().toISOString();

  it("should accurately resolve provider capabilities without hallucinating support for unsupported features", () => {
    const registry = new NetworkCapabilityRegistry();
    const cloudflareCaps = registry.getCapabilities("cloudflare");
    const envoyCaps = registry.getCapabilities("envoy");
    const nginxCaps = registry.getCapabilities("nginx");
    const k8sIngressCaps = registry.getCapabilities("kubernetes_ingress");

    expect(cloudflareCaps.supportsAnycastRouting).toBe(true);
    expect(cloudflareCaps.supportsHttp3).toBe(true);
    expect(cloudflareCaps.supportsCircuitBreaker).toBe(false);

    expect(envoyCaps.supportsCircuitBreaker).toBe(true);
    expect(envoyCaps.supportsAnycastRouting).toBe(false);
    expect(envoyCaps.supportsWeightedSplitting).toBe(true);

    expect(nginxCaps.supportsWafIntegration).toBe(false);
    expect(nginxCaps.supportsWeightedSplitting).toBe(true);

    expect(k8sIngressCaps.supportsWeightedSplitting).toBe(false);
  });

  it("should flag critical outage when all backend endpoints in an upstream pool are unhealthy or draining", () => {
    const topology: NetworkArchitectureTopology = {
      id: "topo-lb-unhealthy",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [
        {
          id: "pool-crashed",
          name: "Inventory Service Pool",
          endpoints: [
            { id: "ep-1", address: "10.0.3.11", port: 9000, weight: 100, isHealthy: false },
            { id: "ep-2", address: "10.0.3.12", port: 9000, weight: 100, isHealthy: false },
            { id: "ep-3", address: "10.0.3.13", port: 9000, weight: 100, isHealthy: false, isDraining: true },
          ],
          healthCheck: {
            id: "hc-inv",
            protocol: "http",
            path: "/healthz",
            intervalSeconds: 5,
            timeoutSeconds: 2,
            healthyThreshold: 2,
            unhealthyThreshold: 3,
          },
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      gateways: [],
      boundaries: [],
      serviceMeshes: [],
      scenarios: [],
      createdAt: now,
      updatedAt: now,
    };

    const findings = LoadBalancingAnalyzer.analyze(topology);
    const outageFinding = findings.find((f) => f.category === "unhealthy_upstream_pool");

    expect(outageFinding).toBeDefined();
    expect(outageFinding?.severity).toBe("critical");
    expect(outageFinding?.title).toContain("All Backend Endpoints Unhealthy in Pool");
  });

  it("should warn when health check probe timeout is greater than or equal to probe interval", () => {
    const topology: NetworkArchitectureTopology = {
      id: "topo-lb-hc-err",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [
        {
          id: "pool-hc-timeout",
          name: "Catalog Pool",
          endpoints: [{ id: "ep-1", address: "10.0.1.5", port: 80, weight: 100, isHealthy: true }],
          healthCheck: {
            id: "hc-bad",
            protocol: "http",
            intervalSeconds: 5,
            timeoutSeconds: 10, // Timeout > Interval!
            healthyThreshold: 2,
            unhealthyThreshold: 3,
          },
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      gateways: [],
      boundaries: [],
      serviceMeshes: [],
      scenarios: [],
      createdAt: now,
      updatedAt: now,
    };

    const findings = LoadBalancingAnalyzer.analyze(topology);
    const hcFinding = findings.find((f) => f.title.includes("Health Check Timeout >= Interval"));

    expect(hcFinding).toBeDefined();
    expect(hcFinding?.severity).toBe("medium");
  });
});
