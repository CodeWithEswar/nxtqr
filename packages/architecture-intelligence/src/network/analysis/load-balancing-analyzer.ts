/**
 * NXTQR — Phase 05.3.24: Architecture Network, API Gateway & Traffic Engineering Intelligence Engine
 * Load Balancing, Upstream Pool Health & Health Check Analyzer
 */

import type {
  NetworkArchitectureTopology,
  NetworkFinding,
} from "../contracts/network.types";

export class LoadBalancingAnalyzer {
  public static analyze(topology: NetworkArchitectureTopology): NetworkFinding[] {
    const findings: NetworkFinding[] = [];
    const now = new Date().toISOString();
    const prov = {
      source: "modeled_performance" as const,
      sourceIdentifier: "load_balancing_analyzer",
      timestamp: now,
      graphRevision: topology.graphRevision,
      confirmed: true,
    };

    for (const pool of topology.upstreamPools) {
      // 1. Unhealthy Upstream Pool Exhaustion
      if (pool.endpoints.length === 0) {
        findings.push({
          id: `lb-finding-empty-pool-${pool.id}`,
          category: "unhealthy_upstream_pool",
          severity: "critical",
          title: `Empty Upstream Pool: ${pool.name}`,
          summary: `Upstream pool '${pool.name}' has 0 registered backend endpoints.`,
          rationale:
            "Any traffic routed to this pool will immediately fail with 503 Service Unavailable.",
          affectedResourceIds: [pool.id],
          remediation:
            "Register active backend service instances or pod endpoints into the upstream pool.",
          provenance: prov,
        });
        continue;
      }

      const healthyCount = pool.endpoints.filter((e) => e.isHealthy && !e.isDraining).length;
      if (healthyCount === 0) {
        findings.push({
          id: `lb-finding-all-unhealthy-${pool.id}`,
          category: "unhealthy_upstream_pool",
          severity: "critical",
          title: `All Backend Endpoints Unhealthy in Pool: ${pool.name}`,
          summary: `None of the ${pool.endpoints.length} backend endpoints in '${pool.name}' are healthy or available to receive traffic.`,
          rationale:
            "Load balancers cannot dispatch requests, resulting in complete service outage for dependent routes.",
          affectedResourceIds: [pool.id],
          remediation:
            "Investigate backend crash loops, failed health checks, or restart unhealthy container instances.",
          provenance: prov,
        });
      } else if (healthyCount < pool.endpoints.length / 2) {
        findings.push({
          id: `lb-finding-degraded-capacity-${pool.id}`,
          category: "unhealthy_upstream_pool",
          severity: "high",
          title: `Degraded Upstream Pool Capacity: ${pool.name} (${healthyCount}/${pool.endpoints.length} Healthy)`,
          summary: `Over 50% of endpoints in '${pool.name}' are unhealthy or draining.`,
          rationale:
            "Remaining healthy endpoints will suffer traffic concentration and risk cascading collapse under load.",
          affectedResourceIds: [pool.id],
          remediation:
            "Scale out backend instances and inspect failing health checks to restore full pool redundancy.",
          provenance: prov,
        });
      }

      // 2. Health Check Policy Mismatches
      const hc = pool.healthCheck;
      if (!hc) {
        findings.push({
          id: `lb-finding-no-hc-${pool.id}`,
          category: "missing_health_check",
          severity: "high",
          title: `Missing Health Check Policy on Pool: ${pool.name}`,
          summary: `Upstream pool '${pool.name}' has no active health check policy.`,
          rationale:
            "Without health checks, dead or unready backends will continue receiving traffic, causing intermittent customer errors.",
          affectedResourceIds: [pool.id],
          remediation:
            "Configure an active HTTP/TCP probe policy with appropriate timeouts and thresholds.",
          provenance: prov,
        });
      } else {
        if (hc.timeoutSeconds >= hc.intervalSeconds) {
          findings.push({
            id: `lb-finding-hc-timeout-interval-${pool.id}`,
            category: "missing_health_check",
            severity: "medium",
            title: `Health Check Timeout >= Interval on Pool: ${pool.name}`,
            summary: `Probe timeout (${hc.timeoutSeconds}s) is greater than or equal to probe interval (${hc.intervalSeconds}s).`,
            rationale:
              "Probes can overlap, causing false negative health transitions and load balancer controller thread exhaustion.",
            affectedResourceIds: [pool.id],
            remediation:
              "Set probe timeout to less than half the probe interval (e.g., timeout 2s, interval 5s).",
            provenance: prov,
          });
        }

        if (hc.intervalSeconds < 1) {
          findings.push({
            id: `lb-finding-aggressive-hc-${pool.id}`,
            category: "missing_health_check",
            severity: "low",
            title: `Aggressive Health Check Interval (< 1s) on Pool: ${pool.name}`,
            summary: `Probe interval of ${hc.intervalSeconds}s generates high probe overhead across all nodes.`,
            rationale:
              "Very rapid health checking wastes backend CPU and network bandwidth without significant availability gains.",
            affectedResourceIds: [pool.id],
            remediation:
              "Use standard probe intervals between 5s and 15s with an unhealthy threshold of 2-3 consecutive failures.",
            provenance: prov,
          });
        }
      }
    }

    return findings;
  }
}
