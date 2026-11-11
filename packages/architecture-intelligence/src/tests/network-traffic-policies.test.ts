import { describe, it, expect } from "vitest";
import { TrafficPolicyAnalyzer } from "../network/analysis/traffic-policy-analyzer";
import type { NetworkArchitectureTopology } from "../network/contracts/network.types";

describe("Phase 05.3.24: Traffic Policies, Rate Limiting & Retry Amplification Analyzer", () => {
  const now = new Date().toISOString();

  it("should detect timeout budget inversion when gateway timeout is shorter than upstream backend timeout", () => {
    const topology: NetworkArchitectureTopology = {
      id: "topo-timeout-inversion",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [],
      gateways: [
        {
          id: "gw-inversion",
          name: "API Gateway",
          gatewayType: "api_gateway",
          listeners: [],
          routes: [
            {
              id: "route-inverted",
              gatewayId: "gw-inversion",
              name: "Long Running Data Export",
              match: { pathPrefix: "/export" },
              precedenceOrder: 1,
              targetUpstreamPoolId: "pool-export",
              policies: {
                timeout: {
                  gatewayTimeoutMs: 3000, // Gateway drops client at 3s
                  upstreamTimeoutMs: 15000, // Upstream backend allowed to run for 15s!
                  idleTimeoutMs: 60000,
                },
              },
              provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
            },
          ],
          globalPolicies: {},
          providerTechnology: "envoy",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      boundaries: [],
      serviceMeshes: [],
      scenarios: [],
      createdAt: now,
      updatedAt: now,
    };

    const findings = TrafficPolicyAnalyzer.analyze(topology);
    const inversionFinding = findings.find((f) => f.category === "timeout_budget_inversion");

    expect(inversionFinding).toBeDefined();
    expect(inversionFinding?.severity).toBe("high");
    expect(inversionFinding?.title).toContain("Timeout Budget Inversion");
  });

  it("should flag critical hazard when automatic retries are enabled on non-idempotent HTTP methods without jitter", () => {
    const topology: NetworkArchitectureTopology = {
      id: "topo-retry-hazard",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [],
      gateways: [
        {
          id: "gw-payments",
          name: "Payments Gateway",
          gatewayType: "api_gateway",
          listeners: [],
          routes: [
            {
              id: "route-charge",
              gatewayId: "gw-payments",
              name: "Charge Credit Card",
              match: { pathPrefix: "/charge", methods: ["POST"] },
              precedenceOrder: 1,
              targetUpstreamPoolId: "pool-billing",
              policies: {
                retry: {
                  maxRetries: 3,
                  backoffBaseMs: 500,
                  backoffMaxMs: 2000,
                  jitter: false, // Thundering herd!
                  retryableStatusCodes: [502, 503, 504],
                  retryOnIdempotentMethodsOnly: false, // Critical hazard on POST!
                },
              },
              provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
            },
          ],
          globalPolicies: {},
          providerTechnology: "kong",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      boundaries: [],
      serviceMeshes: [],
      scenarios: [],
      createdAt: now,
      updatedAt: now,
    };

    const findings = TrafficPolicyAnalyzer.analyze(topology);
    const nonIdempotentFinding = findings.find((f) => f.title.includes("Non-Idempotent Retry Policy Hazard"));
    const noJitterFinding = findings.find((f) => f.title.includes("Missing Jitter"));

    expect(nonIdempotentFinding).toBeDefined();
    expect(nonIdempotentFinding?.severity).toBe("critical");
    expect(noJitterFinding).toBeDefined();
  });
});
