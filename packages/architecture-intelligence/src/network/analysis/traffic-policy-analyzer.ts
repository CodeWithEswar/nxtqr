/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Traffic Policies, Rate Limiting, Timeouts & Retry Amplification Analyzer
 */

import type {
  NetworkArchitectureTopology,
  NetworkFinding,
} from "../contracts/network.types";

export class TrafficPolicyAnalyzer {
  public static analyze(topology: NetworkArchitectureTopology): NetworkFinding[] {
    const findings: NetworkFinding[] = [];
    const now = new Date().toISOString();
    const prov = {
      source: "modeled_performance" as const,
      sourceIdentifier: "traffic_policy_analyzer",
      timestamp: now,
      graphRevision: topology.graphRevision,
      confirmed: true,
    };

    for (const gw of topology.gateways) {
      for (const route of gw.routes) {
        // 1. Timeout Budget Inversion
        if (route.policies.timeout) {
          const t = route.policies.timeout;
          if (t.gatewayTimeoutMs <= t.upstreamTimeoutMs) {
            findings.push({
              id: `traffic-finding-timeout-inversion-${route.id}`,
              category: "timeout_budget_inversion",
              severity: "high",
              title: `Timeout Budget Inversion on Route: ${route.name}`,
              summary: `Gateway timeout (${t.gatewayTimeoutMs}ms) is less than or equal to upstream timeout (${t.upstreamTimeoutMs}ms).`,
              rationale:
                "The gateway will disconnect the client with a 504 Gateway Timeout while the upstream backend continues executing expensive operations, resulting in phantom load, orphaned database locks, and potential duplicate processing.",
              affectedResourceIds: [gw.id, route.id],
              remediation:
                "Ensure gateway timeout > upstream timeout (e.g. gateway timeout = upstream timeout + 500ms safety margin).",
              provenance: prov,
            });
          }
        }

        // 2. Retry Amplification Hazard
        if (route.policies.retry) {
          const r = route.policies.retry;
          if (r.maxRetries > 0) {
            if (!r.retryOnIdempotentMethodsOnly) {
              const hasWriteMethods =
                !route.match.methods ||
                route.match.methods.some((m) =>
                  ["POST", "PATCH"].includes(m.toUpperCase())
                );
              if (hasWriteMethods) {
                findings.push({
                  id: `traffic-finding-retry-non-idempotent-${route.id}`,
                  category: "retry_amplification_hazard",
                  severity: "critical",
                  title: `Non-Idempotent Retry Policy Hazard on Route: ${route.name}`,
                  summary: `Route allows ${r.maxRetries} automatic retries without restricting execution to idempotent HTTP methods (GET/PUT/DELETE).`,
                  rationale:
                    "Retrying non-idempotent operations (such as payment processing or order creation) after network timeouts can result in duplicate payments, corrupt business state, and downstream retry storms.",
                  affectedResourceIds: [gw.id, route.id],
                  remediation:
                    "Enable 'retryOnIdempotentMethodsOnly' or enforce idempotency keys before retrying mutations.",
                  provenance: prov,
                });
              }
            }

            if (!r.jitter) {
              findings.push({
                id: `traffic-finding-retry-no-jitter-${route.id}`,
                category: "retry_amplification_hazard",
                severity: "medium",
                title: `Missing Jitter in Retry Backoff on Route: ${route.name}`,
                summary: `Retry policy on '${route.name}' uses deterministic backoff intervals without randomized jitter.`,
                rationale:
                  "When backends experience transient pauses, all failed clients retry at identical synchronised intervals, causing periodic load spikes (thundering herd) that prevent recovery.",
                affectedResourceIds: [gw.id, route.id],
                remediation:
                  "Enable full jitter or decorrelated jitter on all exponential retry policies.",
                provenance: prov,
              });
            }
          }
        }

        // 3. Rate Limit Scope Omission
        if (route.policies.rateLimit) {
          const rl = route.policies.rateLimit;
          if (rl.scope === "global" || rl.scope === "ip") {
            const isApiRoute =
              route.match.pathPrefix?.startsWith("/api") ||
              route.match.pathPrefix?.startsWith("/v1");
            if (isApiRoute) {
              findings.push({
                id: `traffic-finding-rate-limit-scope-${route.id}`,
                category: "rate_limit_scope_omission",
                severity: "medium",
                title: `Overly Broad Rate Limit Scope on API Route: ${route.name}`,
                summary: `Rate limit on '${route.name}' is configured with '${rl.scope}' scope rather than per-tenant or per-API-key scope.`,
                rationale:
                  "Global and IP-only rate limits suffer from NAT IP sharing (entire corporate offices blocked together) and allow a single tenant to exhaust the shared quota, causing noisy-neighbor outages.",
                affectedResourceIds: [gw.id, route.id],
                remediation:
                  "Scope rate limits by authenticated tenant ID or API key header with fallback to client IP.",
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
