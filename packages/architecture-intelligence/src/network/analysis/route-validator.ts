/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Gateway Route Validation & Precedence Conflict Analyzer
 */

import type {
  NetworkArchitectureTopology,
  NetworkFinding,
} from "../contracts/network.types";

export class RouteValidator {
  public static analyze(topology: NetworkArchitectureTopology): NetworkFinding[] {
    const findings: NetworkFinding[] = [];
    const now = new Date().toISOString();
    const prov = {
      source: "modeled_performance" as const,
      sourceIdentifier: "route_validator",
      timestamp: now,
      graphRevision: topology.graphRevision,
      confirmed: true,
    };

    const validPoolIds = new Set(topology.upstreamPools.map((p) => p.id));

    for (const gw of topology.gateways) {
      const seenRoutes = new Map<string, string>(); // key -> routeId

      for (const route of gw.routes) {
        // 1. Missing Upstream Pool Reference
        if (!validPoolIds.has(route.targetUpstreamPoolId)) {
          findings.push({
            id: `route-finding-missing-upstream-${route.id}`,
            category: "black_hole_route",
            severity: "critical",
            title: `Route Points to Non-Existent Upstream Pool: ${route.name}`,
            summary: `Gateway route '${route.name}' references target upstream pool '${route.targetUpstreamPoolId}' which does not exist in the topology.`,
            rationale:
              "Requests matching this route will trigger immediate 502/503 Bad Gateway errors at the gateway boundary.",
            affectedResourceIds: [gw.id, route.id],
            remediation:
              "Attach the route to a valid defined upstream pool with healthy backend endpoints.",
            provenance: prov,
          });
        }

        // 2. Conflicting Route Precedence / Duplicate Path
        const hostKey = route.match.hosts?.sort().join(",") || "*";
        const pathKey = route.match.pathExact || route.match.pathPrefix || route.match.pathRegex || "/";
        const methodKey = route.match.methods?.sort().join(",") || "ANY";
        const routeKey = `${hostKey}::${methodKey}::${pathKey}`;

        if (seenRoutes.has(routeKey)) {
          const conflictingRouteId = seenRoutes.get(routeKey)!;
          findings.push({
            id: `route-finding-duplicate-${route.id}`,
            category: "conflicting_route_precedence",
            severity: "high",
            title: `Conflicting Duplicate Route Match: ${route.name}`,
            summary: `Route '${route.name}' shares identical host/method/path match criteria with '${conflictingRouteId}'.`,
            rationale:
              "Identical matching criteria leads to non-deterministic route selection or complete shadowing of the second route.",
            affectedResourceIds: [gw.id, route.id, conflictingRouteId],
            remediation:
              "Differentiate the conflicting routes using path specificity, method restrictions, or distinct precedence orders.",
            provenance: prov,
          });
        } else {
          seenRoutes.set(routeKey, route.id);
        }

        // 3. Traffic Split Weight Validation
        if (route.trafficSplit && route.trafficSplit.length > 0) {
          const totalWeight = route.trafficSplit.reduce((sum, s) => sum + s.weight, 0);
          const hasNegativeWeight = route.trafficSplit.some((s) => s.weight < 0);

          if (hasNegativeWeight || totalWeight <= 0) {
            findings.push({
              id: `route-finding-invalid-weight-${route.id}`,
              category: "conflicting_route_precedence",
              severity: "high",
              title: `Invalid Traffic Split Weights on Route: ${route.name}`,
              summary: `Traffic split weights on '${route.name}' sum to ${totalWeight} (must be > 0) or contain negative values.`,
              rationale:
                "Gateways cannot partition traffic across upstreams when weights are non-positive or corrupted, leading to 500 errors.",
              affectedResourceIds: [gw.id, route.id],
              remediation:
                "Configure positive non-zero integer weights summing to 100 for clear percentage allocation.",
            provenance: prov,
          });
          }

          // Check target pool existence for split targets
          for (const split of route.trafficSplit) {
            if (!validPoolIds.has(split.targetUpstreamPoolId)) {
              findings.push({
                id: `route-finding-split-missing-pool-${route.id}-${split.targetUpstreamPoolId}`,
                category: "black_hole_route",
                severity: "critical",
                title: `Traffic Split References Missing Pool: ${split.targetUpstreamPoolId}`,
                summary: `Canary/Split target on route '${route.name}' references non-existent upstream pool '${split.targetUpstreamPoolId}'.`,
                rationale:
                  "Traffic shifted to this canary target will be dropped or fail with 503 Service Unavailable.",
                affectedResourceIds: [gw.id, route.id],
                remediation:
                  "Ensure all canary and baseline upstream pools are provisioned before enabling traffic splitting.",
                provenance: prov,
              });
            }
          }
        }
      }
    }

    return findings;
  }
}
