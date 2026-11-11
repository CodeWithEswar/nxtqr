/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Integration Test Suite: AI Assistant Tool #27 & Architecture Reports Generator
 */

import { describe, it, expect } from "vitest";
import { architectureToolRegistry } from "../ai-assistant/tools/tool-registry";
import type { AIExecutionContext } from "../ai-assistant/contracts/ai-assistant.types";
import { architectureReportEngine } from "../reports/engine/report-engine";
import { MarkdownExporter } from "../reports/exporters/markdown-exporter";
import { HtmlExporter } from "../reports/exporters/html-exporter";
import type { NetworkArchitectureTopology } from "../network/contracts/network.types";

describe("Phase 05.3.24: AI Assistant Tool #27 & Reports Generator Integration", () => {
  const now = new Date().toISOString();

  const mockNetworkTopology: NetworkArchitectureTopology = {
    id: "net-topo-ecommerce",
    projectId: "proj-1",
    architectureId: "arch-1",
    graphRevision: "rev-1",
    version: 1,
    dnsZones: [
      {
        id: "zone-corp",
        domainName: "acme.corp",
        isPrivate: false,
        providerTechnology: "aws",
        records: [
          {
            id: "rec-apex",
            name: "api.acme.corp",
            recordType: "A",
            ttlSeconds: 60,
            values: ["1.2.3.4"],
            routingPolicy: {
              type: "failover",
              healthCheckId: "hc-primary",
              isPrimary: true,
            },
            provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        ],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    cdnDistributions: [
      {
        id: "cdn-global",
        name: "Global Edge CDN",
        domainNames: ["static.acme.corp"],
        originTargetIds: ["alb-prod"],
        wafEnabled: true,
        tlsMode: "edge_terminated",
        providerTechnology: "cloudflare",
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    loadBalancers: [
      {
        id: "alb-prod",
        name: "Production Application Load Balancer",
        layer: "layer7",
        scheme: "internet_facing",
        algorithm: "round_robin",
        listeners: [{ port: 443, protocol: "https", targetPoolId: "pool-app" }],
        upstreamPoolIds: ["pool-app"],
        crossZoneLoadBalancing: true,
        providerTechnology: "aws",
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    upstreamPools: [
      {
        id: "pool-app",
        name: "Application Tier Pool",
        endpoints: [
          { id: "ep-1", address: "10.0.1.10", port: 8080, weight: 100, isHealthy: true },
          { id: "ep-2", address: "10.0.1.11", port: 8080, weight: 100, isHealthy: true },
        ],
        healthCheck: {
          id: "hc-pool",
          protocol: "http",
          path: "/healthz",
          port: 8080,
          intervalSeconds: 15,
          timeoutSeconds: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 3,
        },
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    gateways: [
      {
        id: "gw-envoy",
        name: "Envoy Ingress Gateway",
        gatewayType: "api_gateway",
        listeners: [{ name: "https", port: 443, protocol: "https", tlsMode: "edge_terminated" }],
        routes: [
          {
            id: "route-checkout",
            gatewayId: "gw-envoy",
            name: "Checkout Service Route",
            match: { pathPrefix: "/checkout", methods: ["POST"] },
            precedenceOrder: 1,
            targetUpstreamPoolId: "pool-app",
            policies: {
              timeout: {
                gatewayTimeoutMs: 5000,
                upstreamTimeoutMs: 3000,
                idleTimeoutMs: 60000,
                clientTimeoutMs: 5000,
              },
              rateLimit: {
                id: "rl-checkout",
                algorithm: "token_bucket",
                limit: 100,
                windowSeconds: 60,
                scope: "ip",
                burstCapacity: 20,
              },
            },
            provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
          },
        ],
        globalPolicies: {},
        providerTechnology: "envoy",
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    boundaries: [
      {
        id: "bound-vpc",
        name: "Private Application VPC",
        boundaryType: "vpc_private",
        cidrBlock: "10.0.0.0/16",
        memberNodeIds: ["pool-app"],
        ingressRules: [],
        egressRules: [],
        provenance: { source: "declared_design", timestamp: now, graphRevision: "rev-1", confirmed: true },
      },
    ],
    serviceMeshes: [],
    scenarios: [
      {
        id: "sc-checkout",
        name: "Client Checkout Request Flow",
        sourceId: "browser-client",
        destinationId: "pool-app",
        protocol: "https",
        requestRateQps: 150,
        averagePayloadBytes: 2048,
        averageResponseBytes: 4096,
        concurrency: 25,
      },
    ],
    createdAt: now,
    updatedAt: now,
  };

  it("should execute AI Tool #27 (get_network_and_traffic_intelligence) returning topology summary and findings", async () => {
    const context: AIExecutionContext = {
      projectId: "proj-1",
      architectureId: "arch-1",
      graphRevision: "rev-1",
      nodes: [],
      edges: [],
      networkTopology: mockNetworkTopology,
    };

    const res = await architectureToolRegistry.executeTool("get_network_and_traffic_intelligence", {}, context);
    if (!res.success) {
      console.error("TOOL #27 ERROR:", res.error);
    }
    expect(res.success).toBe(true);
    expect(res.result).toBeDefined();

    const output = res.result as any;
    expect(output.summary.gatewayCount).toBe(1);
    expect(output.summary.routeCount).toBe(1);
    expect(output.summary.loadBalancerCount).toBe(1);
    expect(output.summary.dnsZoneCount).toBe(1);
    expect(output.summary.cdnCount).toBe(1);
    expect(output.findings).toBeDefined();
    expect(output.paths.length).toBeGreaterThanOrEqual(1);
  });

  it("should generate reports with network_and_traffic section in Markdown and HTML", () => {
    const report = architectureReportEngine.generateReport({
      projectId: "proj-1",
      architectureId: "arch-1",
      templateId: "detailed_technical_architecture",
      title: "Production Network & Traffic Architecture Review",
      nodes: [
        {
          id: "node-envoy",
          type: "gateway",
          data: { label: "Envoy Ingress Gateway" },
          position: { x: 0, y: 0 },
        },
      ],
      edges: [],
      analysisContext: {
        networkTopology: mockNetworkTopology,
      },
    });

    const netSection = report.sections.find((s) => s.kind === "network_and_traffic");
    expect(netSection).toBeDefined();

    // Verify Markdown export
    const md = MarkdownExporter.export(report).content;
    expect(md).toContain("Network Architecture, API Gateway & Traffic Engineering Intelligence");
    expect(md).toContain("Envoy Ingress Gateway");
    expect(md).toContain("sc-checkout");

    // Verify HTML export
    const html = HtmlExporter.export(report).content;
    expect(html).toContain("Network Architecture, API Gateway &amp; Traffic Engineering Intelligence");
    expect(html).toContain("Envoy Ingress Gateway");
  });
});
