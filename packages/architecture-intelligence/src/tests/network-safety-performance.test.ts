/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Safety, SPOF, Bandwidth Saturation & Performance Benchmark Test Suite
 */

import { describe, it, expect } from "vitest";
import { NetworkSafetyAnalyzer } from "../network/analysis/network-safety-analyzer";
import { RoutingEvaluator } from "../network/evaluator/routing-evaluator";
import type {
  NetworkArchitectureTopology,
  ApiGateway,
  GatewayRoute,
  TrafficScenario,
  HealthCheckPolicy,
} from "../network/contracts/network.types";

describe("Phase 05.3.24: Network Safety, SPOF, Saturation & Performance Benchmarks", () => {
  const now = new Date().toISOString();

  const defaultHealthCheck: HealthCheckPolicy = {
    id: "hc-default",
    protocol: "http",
    intervalSeconds: 15,
    timeoutSeconds: 5,
    healthyThreshold: 2,
    unhealthyThreshold: 3,
  };

  it("should detect inter-gateway routing loops where gateway A forwards to B and B forwards back to A", () => {
    const topology: NetworkArchitectureTopology = {
      id: "topo-loop",
      projectId: "proj-loop",
      architectureId: "arch-1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [
        {
          id: "pool-b",
          name: "Forward to Gateway B",
          endpoints: [{ id: "ep-b", address: "gw-b.internal", port: 8080, weight: 100, isHealthy: true }],
          healthCheck: defaultHealthCheck,
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
        {
          id: "pool-a",
          name: "Forward back to Gateway A",
          endpoints: [{ id: "ep-a", address: "gw-a.internal", port: 8080, weight: 100, isHealthy: true }],
          healthCheck: defaultHealthCheck,
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      gateways: [
        {
          id: "gw-a",
          name: "Gateway A",
          gatewayType: "api_gateway",
          listeners: [{ name: "http", port: 80, protocol: "http1", tlsMode: "none" }],
          routes: [
            {
              id: "route-a-to-b",
              gatewayId: "gw-a",
              name: "Route to B",
              match: { pathPrefix: "/loop" },
              precedenceOrder: 1,
              targetUpstreamPoolId: "pool-b",
              policies: {},
              provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
            },
          ],
          globalPolicies: {},
          providerTechnology: "envoy",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
        {
          id: "gw-b",
          name: "Gateway B",
          gatewayType: "reverse_proxy",
          listeners: [{ name: "http", port: 8080, protocol: "http1", tlsMode: "none" }],
          routes: [
            {
              id: "route-b-to-a",
              gatewayId: "gw-b",
              name: "Route to A",
              match: { pathPrefix: "/loop" },
              precedenceOrder: 1,
              targetUpstreamPoolId: "pool-a",
              policies: {},
              provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
            },
          ],
          globalPolicies: {},
          providerTechnology: "nginx",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      boundaries: [],
      serviceMeshes: [],
      scenarios: [],
      createdAt: now,
      updatedAt: now,
    };

    const findings = NetworkSafetyAnalyzer.analyze(topology);
    const loopFinding = findings.find((f) => f.category === "routing_loop_detected");
    expect(loopFinding).toBeDefined();
    expect(loopFinding?.severity).toBe("critical");
    expect(loopFinding?.affectedResourceIds).toContain("gw-a");
    expect(loopFinding?.affectedResourceIds).toContain("gw-b");
  });

  it("should detect single ingress gateway SPOF when all traffic routes through one entrypoint without HA redundancy", () => {
    const topology: NetworkArchitectureTopology = {
      id: "topo-spof",
      projectId: "proj-spof",
      architectureId: "arch-1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [
        {
          id: "pool-core",
          name: "Core Services",
          endpoints: [{ id: "ep-1", address: "10.0.1.5", port: 8080, weight: 100, isHealthy: true }],
          healthCheck: defaultHealthCheck,
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      gateways: [
        {
          id: "gw-solo",
          name: "Solo Standalone Gateway",
          gatewayType: "api_gateway",
          listeners: [{ name: "https", port: 443, protocol: "https", tlsMode: "edge_terminated" }],
          routes: [
            {
              id: "r-all",
              gatewayId: "gw-solo",
              name: "Catch-All",
              match: { pathPrefix: "/" },
              precedenceOrder: 1,
              targetUpstreamPoolId: "pool-core",
              policies: {},
              provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
            },
          ],
          globalPolicies: {},
          providerTechnology: "traefik",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      boundaries: [],
      serviceMeshes: [],
      scenarios: [
        {
          id: "sc-1",
          name: "Production Traffic Ingress",
          sourceId: "internet",
          destinationId: "gw-solo",
          protocol: "https",
          requestRateQps: 500,
          averagePayloadBytes: 2048,
          averageResponseBytes: 8192,
          concurrency: 100,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const findings = NetworkSafetyAnalyzer.analyze(topology);
    const spofFinding = findings.find((f) => f.category === "single_ingress_spof");
    expect(spofFinding).toBeDefined();
    expect(spofFinding?.severity).toBe("high");
    expect(spofFinding?.affectedResourceIds).toContain("gw-solo");
  });

  it("should flag egress bandwidth saturation risks when scenario throughput exceeds 800 Mbps", () => {
    const heavyScenario: TrafficScenario = {
      id: "sc-heavy-video",
      name: "4K Media Streaming Ingress/Egress",
      sourceId: "clients",
      destinationId: "video-cluster",
      protocol: "https",
      requestRateQps: 12000,
      averagePayloadBytes: 4096,
      averageResponseBytes: 65536, // 64 KB response per request -> 12,000 * 64,000 * 8 = 6.14 Gbps!
      concurrency: 5000,
    };

    const topology: NetworkArchitectureTopology = {
      id: "topo-bw",
      projectId: "proj-bandwidth",
      architectureId: "arch-1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [],
      gateways: [
        {
          id: "gw-1",
          name: "Ingress Gateway 1",
          gatewayType: "api_gateway",
          listeners: [{ name: "https", port: 443, protocol: "https", tlsMode: "edge_terminated" }],
          routes: [],
          globalPolicies: {},
          providerTechnology: "aws",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
        {
          id: "gw-2",
          name: "Ingress Gateway 2 (Redundant)",
          gatewayType: "api_gateway",
          listeners: [{ name: "https", port: 443, protocol: "https", tlsMode: "edge_terminated" }],
          routes: [],
          globalPolicies: {},
          providerTechnology: "aws",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      boundaries: [],
      serviceMeshes: [],
      scenarios: [heavyScenario],
      createdAt: now,
      updatedAt: now,
    };

    const findings = NetworkSafetyAnalyzer.analyze(topology);
    const bwFinding = findings.find((f) => f.category === "bandwidth_saturation_risk");
    expect(bwFinding).toBeDefined();
    expect(bwFinding?.severity).toBe("high");
    expect(bwFinding?.title).toContain("Bandwidth Saturation Risk");
  });

  it("benchmark: should evaluate 1,000 incoming requests against a pool of 500 routes in under 500ms", () => {
    const routes: GatewayRoute[] = [];
    for (let i = 0; i < 500; i++) {
      routes.push({
        id: `r-${i}`,
        gatewayId: "gw-bench",
        name: `Route ${i}`,
        match: {
          hosts: i % 2 === 0 ? ["api.nxtqr.io"] : undefined,
          pathExact: i === 250 ? "/api/v1/bench-target" : undefined,
          pathPrefix: i !== 250 ? `/api/v${i}` : undefined,
          methods: ["GET", "POST"],
        },
        precedenceOrder: i === 250 ? 1 : 100 + i,
        targetUpstreamPoolId: "pool-bench",
        policies: {},
        provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
      });
    }

    const gateway: ApiGateway = {
      id: "gw-bench",
      name: "Benchmark Gateway",
      gatewayType: "api_gateway",
      listeners: [{ name: "https", port: 443, protocol: "https", tlsMode: "edge_terminated" }],
      routes,
      globalPolicies: {},
      providerTechnology: "envoy",
      provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
    };

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      const match = RoutingEvaluator.evaluateRoute(gateway, {
        host: "api.nxtqr.io",
        path: "/api/v1/bench-target",
        method: "GET",
      });
      expect(match?.selectedRoute?.id).toBe("r-250");
    }
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(500); // Under 500ms for 1,000 matches across 500 routes (sub-millisecond routing)
  });
});
