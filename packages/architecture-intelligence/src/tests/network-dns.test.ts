import { describe, it, expect } from "vitest";
import { DnsAnalyzer } from "../network/analysis/dns-analyzer";
import type { NetworkArchitectureTopology } from "../network/contracts/network.types";

describe("Phase 05.3.24: DNS Architecture, CNAME Loops & Failover Analyzer", () => {
  const now = new Date().toISOString();

  it("should detect circular CNAME resolution loops creating infinite resolver recursion", () => {
    const topology: NetworkArchitectureTopology = {
      id: "topo-dns-loop",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [
        {
          id: "zone-example",
          domainName: "example.com",
          isPrivate: false,
          records: [
            {
              id: "rec-1",
              name: "api.example.com",
              recordType: "CNAME",
              ttlSeconds: 300,
              values: ["edge.example.com"],
              provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
            },
            {
              id: "rec-2",
              name: "edge.example.com",
              recordType: "CNAME",
              ttlSeconds: 300,
              values: ["api.example.com"], // Points back to rec-1!
              provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
            },
          ],
          providerTechnology: "cloudflare",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [],
      gateways: [],
      boundaries: [],
      serviceMeshes: [],
      scenarios: [],
      createdAt: now,
      updatedAt: now,
    };

    const findings = DnsAnalyzer.analyze(topology);
    const loopFinding = findings.find((f) => f.category === "routing_loop_detected");

    expect(loopFinding).toBeDefined();
    expect(loopFinding?.severity).toBe("critical");
    expect(loopFinding?.title).toContain("DNS CNAME Resolution Loop");
  });

  it("should flag excessive CNAME chains (> 3 hops) adding recursive lookup latency", () => {
    const topology: NetworkArchitectureTopology = {
      id: "topo-dns-chain",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [
        {
          id: "zone-example",
          domainName: "example.com",
          isPrivate: false,
          records: [
            { id: "r1", name: "app.example.com", recordType: "CNAME", ttlSeconds: 300, values: ["c1.example.com"], provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true } },
            { id: "r2", name: "c1.example.com", recordType: "CNAME", ttlSeconds: 300, values: ["c2.example.com"], provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true } },
            { id: "r3", name: "c2.example.com", recordType: "CNAME", ttlSeconds: 300, values: ["c3.example.com"], provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true } },
            { id: "r4", name: "c3.example.com", recordType: "CNAME", ttlSeconds: 300, values: ["c4.example.com"], provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true } },
            { id: "r5", name: "c4.example.com", recordType: "A", ttlSeconds: 300, values: ["93.184.216.34"], provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true } },
          ],
          providerTechnology: "aws",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [],
      gateways: [],
      boundaries: [],
      serviceMeshes: [],
      scenarios: [],
      createdAt: now,
      updatedAt: now,
    };

    const findings = DnsAnalyzer.analyze(topology);
    const chainFinding = findings.find((f) => f.title.includes("Excessive DNS CNAME Redirection Chain"));

    expect(chainFinding).toBeDefined();
    expect(chainFinding?.severity).toBe("medium");
  });

  it("should warn when failover DNS records have TTL > 300s delaying multi-region disaster recovery", () => {
    const topology: NetworkArchitectureTopology = {
      id: "topo-dns-ttl",
      projectId: "p1",
      architectureId: "a1",
      graphRevision: "r1",
      version: 1,
      dnsZones: [
        {
          id: "zone-example",
          domainName: "example.com",
          isPrivate: false,
          records: [
            {
              id: "rec-failover",
              name: "checkout.example.com",
              recordType: "A",
              ttlSeconds: 3600, // 1 hour TTL on failover record!
              values: ["198.51.100.1"],
              routingPolicy: {
                type: "failover",
                isPrimary: true,
              },
              provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
            },
          ],
          providerTechnology: "aws",
          provenance: { source: "declared_design", timestamp: now, graphRevision: "r1", confirmed: true },
        },
      ],
      cdnDistributions: [],
      loadBalancers: [],
      upstreamPools: [],
      gateways: [],
      boundaries: [],
      serviceMeshes: [],
      scenarios: [],
      createdAt: now,
      updatedAt: now,
    };

    const findings = DnsAnalyzer.analyze(topology);
    const ttlFinding = findings.find((f) => f.category === "failover_destination_unready");

    expect(ttlFinding).toBeDefined();
    expect(ttlFinding?.severity).toBe("high");
    expect(ttlFinding?.summary).toContain("3600");
  });
});
