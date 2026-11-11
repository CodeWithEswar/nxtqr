/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Traffic Path Traversal, Latency Budgets & Boundary Crossings
 */

import type {
  NetworkArchitectureTopology,
  NetworkPath,
  NetworkPathHop,
  NetworkFinding,
} from "../contracts/network.types";

export class PathTraversalEngine {
  private static readonly MAX_HOPS = 15;

  public static tracePaths(topology: NetworkArchitectureTopology): {
    paths: NetworkPath[];
    findings: NetworkFinding[];
  } {
    const paths: NetworkPath[] = [];
    const findings: NetworkFinding[] = [];
    const now = new Date().toISOString();
    const prov = {
      source: "modeled_performance" as const,
      sourceIdentifier: "path_traversal_engine",
      timestamp: now,
      graphRevision: topology.graphRevision,
      confirmed: true,
    };

    // Index resources and boundaries for rapid lookup
    const boundaryByNodeId = new Map<string, string>();
    for (const b of topology.boundaries) {
      if (Array.isArray(b.memberNodeIds)) {
        for (const nid of b.memberNodeIds) {
          boundaryByNodeId.set(nid, b.name);
        }
      }
    }

    // Trace paths for each scenario
    for (const scenario of topology.scenarios) {
      const hops: NetworkPathHop[] = [];
      let currentHopIndex = 1;
      let totalModeledLatencyMs = 0;
      let hasPlaintextHop = false;
      let hasCrossRegionHop = false;
      let isReachable = true;
      let unreachableReason: string | undefined;

      const visited = new Set<string>();

      // Check max hops safety guard
      if (hops.length >= this.MAX_HOPS) {
        continue;
      }

      // 1. DNS Resolution Hop (if public destination)
      const matchingZone = topology.dnsZones.find(
        (z) => !z.isPrivate && z.records.some((r) => r.name.includes(scenario.destinationId))
      );
      if (matchingZone) {
        const record = matchingZone.records.find((r) =>
          r.name.includes(scenario.destinationId)
        );
        hops.push({
          hopIndex: currentHopIndex++,
          resourceId: matchingZone.id,
          resourceType: "dns_zone",
          resourceName: `DNS: ${record?.name || matchingZone.domainName}`,
          protocol: "dns",
          tlsState: "plaintext",
          crossesBoundary: false,
          isCrossRegion: false,
          latencyBudgetMs: {
            modeled: 12.0, // Standard DNS lookup
            isUnknown: false,
          },
        });
        totalModeledLatencyMs += 12.0;
      }

      // 2. CDN / Edge Layer Hop
      const cdn = topology.cdnDistributions.find(
        (c) =>
          (Array.isArray(c.domainNames) && c.domainNames.some((d) => d.includes(scenario.destinationId))) ||
          (Array.isArray(c.originTargetIds) && c.originTargetIds.includes(scenario.destinationId))
      );
      if (cdn) {
        hops.push({
          hopIndex: currentHopIndex++,
          resourceId: cdn.id,
          resourceType: "cdn_distribution",
          resourceName: cdn.name || cdn.id,
          protocol: scenario.protocol,
          tlsState: cdn.tlsMode !== "none" ? "tls" : "plaintext",
          crossesBoundary: true,
          sourceBoundaryName: "Public Internet",
          targetBoundaryName: "CDN Edge",
          isCrossRegion: false,
          latencyBudgetMs: {
            modeled: 15.0,
            isUnknown: false,
          },
        });
        totalModeledLatencyMs += 15.0;
        if (cdn.tlsMode === "none") hasPlaintextHop = true;
      }

      // 3. Gateway / Load Balancer Hop
      let activeGateway = topology.gateways.find(
        (g) =>
          g.id === scenario.destinationId ||
          g.routes.some(
            (r) =>
              r.targetNodeId === scenario.destinationId ||
              r.targetUpstreamPoolId.includes(scenario.destinationId)
          )
      );

      if (!activeGateway && topology.gateways.length > 0) {
        // Fall back to first gateway
        activeGateway = topology.gateways[0];
      }

      if (activeGateway) {
        visited.add(activeGateway.id);
        const gwListener = activeGateway.listeners[0];
        const isTls =
          gwListener &&
          (gwListener.tlsMode === "edge_terminated" ||
            gwListener.tlsMode === "re_encrypted" ||
            gwListener.tlsMode === "mtls_strict");

        const gwBoundary = boundaryByNodeId.get(activeGateway.id) || "DMZ / Ingress";

        hops.push({
          hopIndex: currentHopIndex++,
          resourceId: activeGateway.id,
          resourceType: activeGateway.gatewayType,
          resourceName: activeGateway.name,
          protocol: gwListener?.protocol || scenario.protocol,
          tlsState: isTls ? "tls" : "plaintext",
          crossesBoundary: true,
          sourceBoundaryName: "Edge / Internet",
          targetBoundaryName: gwBoundary,
          isCrossRegion: false,
          latencyBudgetMs: {
            modeled: 4.5,
            isUnknown: false,
          },
        });
        totalModeledLatencyMs += 4.5;
        if (!isTls) hasPlaintextHop = true;

        // 4. Upstream Pool Hop from Route
        const matchingRoute =
          activeGateway.routes.find((r) => r.targetNodeId === scenario.destinationId) ||
          activeGateway.routes[0];

        if (matchingRoute) {
          const pool = topology.upstreamPools.find(
            (p) => p.id === matchingRoute.targetUpstreamPoolId
          );

          if (pool) {
            const hasHealthyEndpoint = pool.endpoints.some((e) => e.isHealthy && !e.isDraining);
            if (!hasHealthyEndpoint) {
              isReachable = false;
              unreachableReason = `No healthy endpoints available in target upstream pool '${pool.name}'.`;
            }

            const poolBoundary = boundaryByNodeId.get(pool.id) || "Private VPC";
            hops.push({
              hopIndex: currentHopIndex++,
              resourceId: pool.id,
              resourceType: "load_balancer",
              resourceName: pool.name,
              protocol: "http1",
              tlsState: "plaintext",
              crossesBoundary: true,
              sourceBoundaryName: gwBoundary,
              targetBoundaryName: poolBoundary,
              isCrossRegion: false,
              latencyBudgetMs: {
                modeled: 2.0,
                isUnknown: false,
              },
            });
            totalModeledLatencyMs += 2.0;

            // 5. Backend Service Target Hop
            const targetEndpoint = pool.endpoints.find((e) => e.isHealthy) || pool.endpoints[0];
            if (targetEndpoint) {
              hops.push({
                hopIndex: currentHopIndex++,
                resourceId: targetEndpoint.id,
                resourceType: "custom",
                resourceName: `Endpoint: ${targetEndpoint.address}:${targetEndpoint.port}`,
                protocol: "http1",
                tlsState: "plaintext",
                crossesBoundary: false,
                isCrossRegion: false,
                latencyBudgetMs: {
                  modeled: 1.5,
                  isUnknown: false,
                },
              });
              totalModeledLatencyMs += 1.5;
            }
          } else {
            isReachable = false;
            unreachableReason = `Target upstream pool '${matchingRoute.targetUpstreamPoolId}' not found.`;
          }
        }
      }

      // Check cross region scenario
      if (scenario.geographicRegion && scenario.geographicRegion !== "us-east-1") {
        hasCrossRegionHop = true;
        totalModeledLatencyMs += 65.0; // Inter-region transit latency
      }

      const path: NetworkPath = {
        id: `path-${scenario.id}`,
        sourceNodeId: scenario.sourceId,
        destinationNodeId: scenario.destinationId,
        hops,
        totalModeledLatencyMs: Math.round(totalModeledLatencyMs * 10) / 10,
        hasPlaintextHop,
        hasCrossRegionHop,
        isReachable,
        unreachableReason,
      };

      paths.push(path);

      // 6. Security Analysis: Unencrypted Public Traffic
      if (hasPlaintextHop) {
        findings.push({
          id: `path-finding-plaintext-${scenario.id}`,
          category: "unencrypted_public_traffic",
          severity: "critical",
          title: `Unencrypted Plaintext Traffic on Ingress Path: ${scenario.name}`,
          summary: `Network path for scenario '${scenario.name}' traverses network boundaries without TLS termination or encryption in transit.`,
          rationale:
            "Plaintext HTTP/TCP traffic crossing public networks is vulnerable to packet interception, man-in-the-middle attacks, and credential sniffing.",
          affectedResourceIds: hops.filter((h) => h.tlsState === "plaintext").map((h) => h.resourceId),
          remediation:
            "Enforce HTTPS/TLS edge termination at the CDN or API Gateway with automatic HTTP-to-HTTPS 301 redirects.",
          provenance: prov,
        });
      }

      // 7. Performance: Cross-Region Latency
      if (hasCrossRegionHop && totalModeledLatencyMs >= 65) {
        findings.push({
          id: `path-finding-cross-region-${scenario.id}`,
          category: "cross_region_latency_bottleneck",
          severity: "high",
          title: `Cross-Region High Latency Path: ${scenario.name} (${path.totalModeledLatencyMs}ms)`,
          summary: `Scenario '${scenario.name}' incurs multi-region round-trips adding ~65ms network transit delay.`,
          rationale:
            "Cross-region network traversals severely constrain user response times and compound sequential API round-trips.",
          affectedResourceIds: [scenario.id],
          remediation:
            "Deploy regional edge API gateways or regional read replicas to satisfy requests within the client's local region.",
          provenance: prov,
        });
      }
    }

    return { paths, findings };
  }
}
