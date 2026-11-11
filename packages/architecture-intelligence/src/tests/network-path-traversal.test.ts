import { describe, it, expect } from "vitest";
import { PathTraversalEngine } from "../network/analysis/path-traversal-engine";
import type { NetworkArchitectureTopology } from "../network/contracts/network.types";

describe("Phase 05.3.24: Traffic Path Traversal & Latency Budget Engine", () => {
  const now = new Date().toISOString();

  it("should trace client-to-service hops and flag unencrypted plaintext ingress traffic", () => {
    const topology: NetworkArchitectureTopology = {
      id: "topo-path-plaintext",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [
        {
          id: "zone-1",
          domainName: "store.acme.com",
          isPrivate: false,
          records: [{ id: "r1", name: "store.acme.com", recordType: "A", ttlSeconds: 300, values: ["203.0.113.10"], provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true } }],
          providerTechnology: "cloudflare",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [
        {
          id: "pool-storefront",
          name: "Storefront Web Pods",
          endpoints: [{ id: "ep-1", address: "10.0.1.44", port: 80, weight: 100, isHealthy: true }],
          healthCheck: { id: "hc-1", protocol: "http", intervalSeconds: 10, timeoutSeconds: 3, healthyThreshold: 2, unhealthyThreshold: 3 },
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      gateways: [
        {
          id: "gw-insecure",
          name: "Plaintext HTTP Ingress",
          gatewayType: "api_gateway",
          listeners: [
            {
              name: "http-plain",
              port: 80,
              protocol: "http1",
              hostname: "store.acme.com",
              tlsMode: "none", // INSECURE PLAINTEXT!
            },
          ],
          routes: [
            {
              id: "route-store",
              gatewayId: "gw-insecure",
              name: "Storefront Route",
              match: { pathPrefix: "/" },
              precedenceOrder: 1,
              targetUpstreamPoolId: "pool-storefront",
              targetNodeId: "node-storefront",
              policies: {},
              provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
            },
          ],
          globalPolicies: {},
          providerTechnology: "nginx",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      boundaries: [
        {
          id: "b-dmz",
          name: "Public DMZ",
          boundaryType: "dmz",
          memberNodeIds: ["gw-insecure"],
          ingressRules: [],
          egressRules: [],
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      serviceMeshes: [],
      scenarios: [
        {
          id: "scenario-checkout",
          name: "Customer Web Checkout Flow",
          sourceId: "client-browser",
          destinationId: "node-storefront",
          protocol: "http1",
          requestRateQps: 50,
          averagePayloadBytes: 2048,
          averageResponseBytes: 8192,
          concurrency: 10,
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const { paths, findings } = PathTraversalEngine.tracePaths(topology);

    expect(paths.length).toBe(1);
    const path = paths[0];
    expect(path.hops.length).toBeGreaterThanOrEqual(3);
    expect(path.hasPlaintextHop).toBe(true);
    expect(path.totalModeledLatencyMs).toBeGreaterThan(0);

    const plaintextFinding = findings.find((f) => f.category === "unencrypted_public_traffic");
    expect(plaintextFinding).toBeDefined();
    expect(plaintextFinding?.severity).toBe("critical");
  });

  it("should calculate cross-region inter-DC transit latency penalties", () => {
    const topology: NetworkArchitectureTopology = {
      id: "topo-path-cross-region",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [
        {
          id: "pool-orders",
          name: "Orders Pool",
          endpoints: [{ id: "ep-1", address: "10.2.0.5", port: 8080, weight: 100, isHealthy: true }],
          healthCheck: { id: "hc-1", protocol: "http", intervalSeconds: 10, timeoutSeconds: 3, healthyThreshold: 2, unhealthyThreshold: 3 },
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      gateways: [
        {
          id: "gw-eu",
          name: "EU Gateway",
          gatewayType: "api_gateway",
          listeners: [{ name: "https", port: 443, protocol: "https", tlsMode: "edge_terminated" }],
          routes: [
            {
              id: "r-eu",
              gatewayId: "gw-eu",
              name: "EU Route",
              match: { pathPrefix: "/" },
              precedenceOrder: 1,
              targetUpstreamPoolId: "pool-orders",
              targetNodeId: "node-us-orders",
              policies: {},
              provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
            },
          ],
          globalPolicies: {},
          providerTechnology: "aws",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      boundaries: [],
      serviceMeshes: [],
      scenarios: [
        {
          id: "scenario-cross-region",
          name: "EU Client to US Database Backend",
          sourceId: "client-eu",
          destinationId: "node-us-orders",
          protocol: "https",
          requestRateQps: 10,
          averagePayloadBytes: 1024,
          averageResponseBytes: 2048,
          concurrency: 5,
          geographicRegion: "eu-west-1", // Cross-region from US primary!
        },
      ],
      createdAt: now,
      updatedAt: now,
    };

    const { paths, findings } = PathTraversalEngine.tracePaths(topology);
    expect(paths[0].hasCrossRegionHop).toBe(true);
    expect(paths[0].totalModeledLatencyMs).toBeGreaterThanOrEqual(65);

    const crossRegionFinding = findings.find((f) => f.category === "cross_region_latency_bottleneck");
    expect(crossRegionFinding).toBeDefined();
    expect(crossRegionFinding?.severity).toBe("high");
  });
});
