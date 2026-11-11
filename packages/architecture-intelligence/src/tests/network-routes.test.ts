import { describe, it, expect } from "vitest";
import { GatewayApiParser } from "../network/parsers/gateway-api-parser";
import { RoutingEvaluator } from "../network/evaluator/routing-evaluator";
import { RouteValidator } from "../network/analysis/route-validator";
import type {
  ApiGateway,
  NetworkArchitectureTopology,
  UpstreamPool,
} from "../network/contracts/network.types";

describe("Phase 05.3.24: Gateway API Parser, Routing Evaluator & Route Validator", () => {
  const now = new Date().toISOString();

  it("should safely parse Kubernetes Gateway API and Ingress manifests into structured gateways and routes without eval", () => {
    const yaml = `
apiVersion: gateway.networking.k8s.io/v1
kind: Gateway
metadata:
  name: prod-gateway
spec:
  gatewayClassName: istio
  listeners:
  - name: https
    protocol: HTTPS
    port: 443
    hostname: "api.acme.corp"
    tls:
      certificateRefs:
      - name: acme-cert
---
apiVersion: gateway.networking.k8s.io/v1
kind: HTTPRoute
metadata:
  name: payments-route
spec:
  parentRefs:
  - name: prod-gateway
  hostnames:
  - "api.acme.corp"
  rules:
  - matches:
    - path:
        type: PathPrefix
        value: /v1/payments
      method: POST
    backendRefs:
    - name: payments-service
      port: 8080
      weight: 100
    `;

    const res = GatewayApiParser.parse(yaml);
    expect(res.errors.length).toBe(0);
    expect(res.gateways.length).toBe(1);

    const gw = res.gateways[0];
    expect(gw.name).toBe("prod-gateway");
    expect(gw.listeners.length).toBe(1);
    expect(gw.listeners[0].protocol).toBe("https");
    expect(gw.listeners[0].port).toBe(443);

    expect(gw.routes.length).toBe(1);
    const route = gw.routes[0];
    expect(route.name).toBe("payments-route");
    expect(route.match.pathPrefix).toBe("/v1/payments");
    expect(route.match.methods).toEqual(["POST"]);

    expect(res.upstreamPools.length).toBe(1);
    expect(res.upstreamPools[0].endpoints[0].address).toContain("payments-service");
  });

  it("should deterministically evaluate routes choosing exact path over prefix path and selecting healthy upstream endpoints", () => {
    const poolOrders: UpstreamPool = {
      id: "pool-orders",
      name: "Orders Pool",
      endpoints: [
        { id: "ep-1", address: "10.0.2.1", port: 8080, weight: 100, isHealthy: true },
        { id: "ep-2", address: "10.0.2.2", port: 8080, weight: 50, isHealthy: false }, // Unhealthy
      ],
      healthCheck: {
        id: "hc-orders",
        protocol: "http",
        path: "/healthz",
        intervalSeconds: 10,
        timeoutSeconds: 2,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      },
      provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
    };

    const gateway: ApiGateway = {
      id: "gw-test",
      name: "Test Gateway",
      gatewayType: "api_gateway",
      listeners: [{ name: "http", port: 80, protocol: "http1", tlsMode: "none" }],
      routes: [
        {
          id: "route-prefix",
          gatewayId: "gw-test",
          name: "Orders Prefix Route",
          match: { hosts: ["api.example.com"], pathPrefix: "/orders" },
          precedenceOrder: 2,
          targetUpstreamPoolId: "pool-generic",
          policies: {},
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
        {
          id: "route-exact",
          gatewayId: "gw-test",
          name: "Orders Checkout Exact Route",
          match: { hosts: ["api.example.com"], pathExact: "/orders/checkout", methods: ["POST"] },
          precedenceOrder: 1,
          targetUpstreamPoolId: "pool-orders",
          policies: {
            authRequired: true,
            rateLimit: { id: "rl-1", algorithm: "sliding_window", limit: 100, windowSeconds: 60, scope: "user" },
          },
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      globalPolicies: {},
      providerTechnology: "envoy",
      provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
    };

    // Test exact match
    const exactResult = RoutingEvaluator.evaluateRoute(
      gateway,
      { host: "api.example.com", path: "/orders/checkout", method: "POST" },
      [poolOrders]
    );

    expect(exactResult.selectedRoute).toBeDefined();
    expect(exactResult.selectedRoute?.id).toBe("route-exact");
    expect(exactResult.appliedPolicies.authRequired).toBe(true);
    expect(exactResult.appliedPolicies.hasRateLimit).toBe(true);
    expect(exactResult.selectedEndpoint?.id).toBe("ep-1"); // Healthy endpoint selected

    // Test prefix match for general order status
    const prefixResult = RoutingEvaluator.evaluateRoute(
      gateway,
      { host: "api.example.com", path: "/orders/12345", method: "GET" },
      [poolOrders]
    );

    expect(prefixResult.selectedRoute).toBeDefined();
    expect(prefixResult.selectedRoute?.id).toBe("route-prefix");
  });

  it("should flag routes pointing to non-existent upstream pools and invalid split weights", () => {
    const topology: NetworkArchitectureTopology = {
      id: "topo-route-err",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [
        {
          id: "pool-existing",
          name: "Existing Pool",
          endpoints: [{ id: "ep-1", address: "10.0.1.1", port: 80, weight: 100, isHealthy: true }],
          healthCheck: { id: "hc-1", protocol: "http", intervalSeconds: 10, timeoutSeconds: 3, healthyThreshold: 2, unhealthyThreshold: 3 },
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      gateways: [
        {
          id: "gw-1",
          name: "Gateway 1",
          gatewayType: "api_gateway",
          listeners: [],
          routes: [
            {
              id: "route-black-hole",
              gatewayId: "gw-1",
              name: "Dead Route",
              match: { pathPrefix: "/broken" },
              precedenceOrder: 1,
              targetUpstreamPoolId: "pool-does-not-exist", // Missing pool!
              policies: {},
              provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
            },
            {
              id: "route-bad-weights",
              gatewayId: "gw-1",
              name: "Split Route with Zero Weight",
              match: { pathPrefix: "/split" },
              precedenceOrder: 2,
              targetUpstreamPoolId: "pool-existing",
              trafficSplit: [
                { targetUpstreamPoolId: "pool-existing", weight: 0 },
              ],
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
      scenarios: [],
      createdAt: now,
      updatedAt: now,
    };

    const findings = RouteValidator.analyze(topology);
    const blackHole = findings.find((f) => f.category === "black_hole_route");
    const badWeight = findings.find((f) => f.title.includes("Invalid Traffic Split Weights"));

    expect(blackHole).toBeDefined();
    expect(blackHole?.severity).toBe("critical");
    expect(badWeight).toBeDefined();
  });
});
