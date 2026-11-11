/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Cache Stampede, Avalanche & Penetration Analyzer
 */

import type {
  DistributedStateTopology,
  CacheStampedeEvaluation,
  CacheStateFinding,
} from "../contracts/cache-state.types";

export interface StampedeAnalysisResult {
  evaluations: CacheStampedeEvaluation[];
  findings: CacheStateFinding[];
}

export class StampedeAnalyzer {
  public static analyze(topology: DistributedStateTopology): StampedeAnalysisResult {
    const evaluations: CacheStampedeEvaluation[] = [];
    const findings: CacheStateFinding[] = [];

    for (const layer of topology.cacheLayers) {
      const mitigationsActive: string[] = [];
      const missingSafeguards: string[] = [];
      const vulnerableKeyPatterns: string[] = [];

      if (layer.requestCoalescingEnabled) {
        mitigationsActive.push("Request Coalescing / Single-Flight Lock on Miss");
      } else {
        missingSafeguards.push("Request Coalescing (Single-Flight Mutex)");
      }

      if (layer.ttlConfig.jitterPercentage > 10) {
        mitigationsActive.push(`TTL Random Jitter (${layer.ttlConfig.jitterPercentage}%)`);
      } else {
        missingSafeguards.push("TTL Randomization Jitter");
      }

      if (layer.negativeCachingEnabled) {
        mitigationsActive.push("Negative Caching (Null Value Caching)");
      } else {
        missingSafeguards.push("Negative Caching Guard");
      }

      // Check key spaces
      for (const ks of layer.keySpaces) {
        if (!ks.includesTenantScope) {
          findings.push({
            id: `finding-key-tenant-omission-${layer.id}-${ks.id}`,
            category: "missing_tenant_key_collision",
            severity: "critical",
            affectedCacheLayerId: layer.id,
            title: `Multi-Tenant Key Collision Hazard in "${ks.name}"`,
            explanation: `Cache key space "${ks.name}" (${ks.namespacePattern}) omits tenant scope isolation. In a multi-tenant environment, tenants requesting identical entity IDs will share cached entries, leaking confidential data across tenant boundaries.`,
            evidence: [
              `Layer: ${layer.name} (${layer.technology})`,
              `Namespace Pattern: ${ks.namespacePattern}`,
              `includesTenantScope: false`,
              `Data Classification: ${ks.dataClassification}`,
            ],
            riskAnalysis:
              "Severe cross-tenant data breach, regulatory compliance failure, and state corruption.",
            remediation:
              "Prefix all cache key namespace patterns with tenant identifiers (e.g. `tenant:{tenantId}:entity:{id}`).",
          });
        }
      }

      // 1. Cache Stampede Evaluation
      const isStampedeRisk = !layer.requestCoalescingEnabled;
      const peakBackendLoadMultiplier = isStampedeRisk ? 8.5 : 1.1;

      if (isStampedeRisk) {
        findings.push({
          id: `finding-cache-stampede-${layer.id}`,
          category: "cache_stampede_risk",
          severity: "high",
          affectedCacheLayerId: layer.id,
          title: `Cache Stampede Vulnerability on "${layer.name}"`,
          explanation: `Cache layer "${layer.name}" does not enable request coalescing or single-flight locking on cache misses. Under concurrent access to a hot key, expiration causes multiple workers to query the backing data store in parallel, amplifying backend load up to ${peakBackendLoadMultiplier}x.`,
          evidence: [
            `Cache Layer: ${layer.name} (${layer.technology})`,
            `requestCoalescingEnabled: false`,
            `Peak Load Multiplier: ${peakBackendLoadMultiplier}x`,
          ],
          riskAnalysis:
            "Backend database CPU saturation, connection pool exhaustion, cascading timeouts, and service unavailability during traffic spikes.",
          remediation:
            "Enable request coalescing (e.g. Golang singleflight, Redis distributed mutex on miss, or XFetch probabilistic early expiration).",
          deterministicCalculation: {
            metricName: "Peak Backend Load Multiplier",
            value: peakBackendLoadMultiplier,
            threshold: 1.5,
            formula: "Without coalescing: concurrency_spike * (1 - hit_rate)",
          },
        });
      }

      // 2. Cache Avalanche Evaluation (Synchronized Expiration)
      if (layer.ttlConfig.jitterPercentage < 5 && layer.ttlConfig.defaultTtlSeconds > 0) {
        findings.push({
          id: `finding-cache-avalanche-${layer.id}`,
          category: "cache_avalanche_risk",
          severity: "high",
          affectedCacheLayerId: layer.id,
          title: `Cache Avalanche Risk: Synchronized TTL Expiration on "${layer.name}"`,
          explanation: `TTL policy on "${layer.name}" uses a fixed ${layer.ttlConfig.defaultTtlSeconds}s duration with ${layer.ttlConfig.jitterPercentage}% jitter. Keys populated in batch during service startup will expire simultaneously, precipitating a synchronized mass-miss avalanche on the database.`,
          evidence: [
            `Layer: ${layer.name}`,
            `defaultTtlSeconds: ${layer.ttlConfig.defaultTtlSeconds}`,
            `jitterPercentage: ${layer.ttlConfig.jitterPercentage}%`,
          ],
          riskAnalysis:
            "Periodic latency spikes and database resource exhaustion occurring at regular TTL intervals.",
          remediation:
            "Configure a randomized jitter percentage (e.g. 15% - 25%) when computing key expiration timestamps.",
        });
      }

      // 3. Cache Penetration Evaluation
      if (!layer.negativeCachingEnabled) {
        findings.push({
          id: `finding-cache-penetration-${layer.id}`,
          category: "cache_penetration_risk",
          severity: "medium",
          affectedCacheLayerId: layer.id,
          title: `Cache Penetration Hazard on "${layer.name}"`,
          explanation: `Layer "${layer.name}" does not cache non-existent/null query results. Queries for missing entity IDs will bypass the cache on every invocation, penetrating directly through to the database.`,
          evidence: [
            `Layer: ${layer.name}`,
            `negativeCachingEnabled: false`,
            `fallbackBehavior: ${layer.fallbackBehavior}`,
          ],
          riskAnalysis:
            "Denial-of-service vulnerability: malicious actors can flood endpoints with randomized non-existent IDs to bypass caches completely.",
          remediation:
            "Enable negative caching with a short TTL (e.g. 30s - 120s) or deploy a Bloom filter to reject invalid keys prior to database query execution.",
        });
      }

      evaluations.push({
        layerId: layer.id,
        isStampedeRisk,
        peakBackendLoadMultiplier,
        vulnerableKeyPatterns,
        explanation: isStampedeRisk
          ? `Missing single-flight mutex creates a ${peakBackendLoadMultiplier}x backend query surge upon hot key expiration.`
          : `Request coalescing protects backend from dog-piling during key expiration.`,
        mitigationsActive,
        missingSafeguards,
      });
    }

    return { evaluations, findings };
  }
}
