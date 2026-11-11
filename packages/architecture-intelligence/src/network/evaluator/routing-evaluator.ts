/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Deterministic Request Routing Evaluator
 */

import type {
  ApiGateway,
  GatewayRoute,
  UpstreamPool,
  UpstreamPoolMember,
} from "../contracts/network.types";

export interface RoutingEvaluationContext {
  host: string;
  path: string;
  method?: string;
  headers?: Record<string, string>;
  clientRegion?: string;
}

export interface RoutingEvaluationResult {
  selectedRoute: GatewayRoute | null;
  candidateRoutes: GatewayRoute[];
  isAmbiguous: boolean;
  ambiguityReason?: string;
  targetUpstreamPoolId?: string;
  selectedEndpoint?: UpstreamPoolMember | null;
  appliedPolicies: {
    authRequired?: boolean;
    hasRateLimit: boolean;
    hasTimeout: boolean;
    hasRetry: boolean;
    hasCircuitBreaker: boolean;
  };
}

export class RoutingEvaluator {
  /**
   * Evaluates incoming request context against an API Gateway's route catalog
   * and picks the highest-precedence route and healthy backend upstream.
   */
  public static evaluateRoute(
    gateway: ApiGateway,
    context: RoutingEvaluationContext,
    upstreamPools: UpstreamPool[] = []
  ): RoutingEvaluationResult {
    const candidates: Array<{ route: GatewayRoute; score: number }> = [];

    const reqHost = context.host.toLowerCase();
    const reqPath = context.path;
    const reqMethod = context.method?.toUpperCase();

    for (const route of gateway.routes) {
      const match = route.match;

      // 1. Host match check
      let hostMatched = false;
      let hostScore = 0;
      if (!match.hosts || match.hosts.length === 0) {
        hostMatched = true;
        hostScore = 1; // Catch-all host
      } else {
        for (const h of match.hosts) {
          const lowerH = h.toLowerCase();
          if (lowerH === reqHost) {
            hostMatched = true;
            hostScore = 100; // Exact host match
            break;
          }
          if (lowerH.startsWith("*.") && reqHost.endsWith(lowerH.substring(1))) {
            hostMatched = true;
            hostScore = 50; // Wildcard host match
            break;
          }
        }
      }
      if (!hostMatched) continue;

      // 2. Method match check
      if (match.methods && match.methods.length > 0) {
        if (!reqMethod || !match.methods.map((m) => m.toUpperCase()).includes(reqMethod)) {
          continue;
        }
      }

      // 3. Headers match check
      if (match.headers && Object.keys(match.headers).length > 0) {
        let headersMatch = true;
        for (const [k, v] of Object.entries(match.headers)) {
          const reqHeaderVal = context.headers?.[k.toLowerCase()];
          if (!reqHeaderVal || reqHeaderVal !== v) {
            headersMatch = false;
            break;
          }
        }
        if (!headersMatch) continue;
      }

      // 4. Path match check
      let pathMatched = false;
      let pathScore = 0;

      if (match.pathExact) {
        if (reqPath === match.pathExact) {
          pathMatched = true;
          pathScore = 1000 + match.pathExact.length;
        }
      } else if (match.pathPrefix) {
        if (reqPath.startsWith(match.pathPrefix)) {
          pathMatched = true;
          pathScore = 500 + match.pathPrefix.length; // Longest prefix preference
        }
      } else if (match.pathRegex) {
        try {
          const regex = new RegExp(match.pathRegex);
          if (regex.test(reqPath)) {
            pathMatched = true;
            pathScore = 250;
          }
        } catch {
          // Invalid regex ignored
        }
      } else {
        // No path restriction
        pathMatched = true;
        pathScore = 10;
      }

      if (!pathMatched) continue;

      // Composite score: HostScore + PathScore - PrecedencePenalty
      const totalScore = hostScore + pathScore - route.precedenceOrder;
      candidates.push({ route, score: totalScore });
    }

    // Sort by descending score
    candidates.sort((a, b) => b.score - a.score);

    const sortedCandidateRoutes = candidates.map((c) => c.route);

    if (candidates.length === 0) {
      return {
        selectedRoute: null,
        candidateRoutes: [],
        isAmbiguous: false,
        appliedPolicies: {
          hasRateLimit: false,
          hasTimeout: false,
          hasRetry: false,
          hasCircuitBreaker: false,
        },
      };
    }

    const topCandidate = candidates[0];
    const secondCandidate = candidates[1];
    const isAmbiguous =
      secondCandidate !== undefined &&
      secondCandidate.score === topCandidate.score &&
      secondCandidate.route.targetUpstreamPoolId !== topCandidate.route.targetUpstreamPoolId;

    const selectedRoute = topCandidate.route;

    // Resolve target upstream pool and healthy endpoint
    let targetPoolId = selectedRoute.targetUpstreamPoolId;
    if (selectedRoute.trafficSplit && selectedRoute.trafficSplit.length > 0) {
      // Pick highest weight split target for deterministic preview
      const topSplit = [...selectedRoute.trafficSplit].sort((a, b) => b.weight - a.weight)[0];
      if (topSplit) targetPoolId = topSplit.targetUpstreamPoolId;
    }

    const matchingPool = upstreamPools.find((p) => p.id === targetPoolId);
    let selectedEndpoint: UpstreamPoolMember | null = null;

    if (matchingPool && matchingPool.endpoints.length > 0) {
      const healthyEndpoints = matchingPool.endpoints.filter(
        (e) => e.isHealthy && !e.isDraining
      );
      if (healthyEndpoints.length > 0) {
        // Pick endpoint with highest weight
        selectedEndpoint = [...healthyEndpoints].sort((a, b) => b.weight - a.weight)[0] || null;
      }
    }

    return {
      selectedRoute,
      candidateRoutes: sortedCandidateRoutes,
      isAmbiguous,
      ambiguityReason: isAmbiguous
        ? `Ambiguous route precedence: routes '${topCandidate.route.name}' and '${secondCandidate.route.name}' have equal matching specificity.`
        : undefined,
      targetUpstreamPoolId: targetPoolId,
      selectedEndpoint,
      appliedPolicies: {
        authRequired: selectedRoute.policies.authRequired,
        hasRateLimit: selectedRoute.policies.rateLimit !== undefined,
        hasTimeout: selectedRoute.policies.timeout !== undefined,
        hasRetry: selectedRoute.policies.retry !== undefined,
        hasCircuitBreaker: selectedRoute.policies.circuitBreaker !== undefined,
      },
    };
  }
}
