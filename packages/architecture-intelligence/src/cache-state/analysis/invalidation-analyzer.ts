/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Cache Invalidation & Propagation Analyzer
 */

import type {
  DistributedStateTopology,
  CacheLayer,
  CacheStateFinding,
} from "../contracts/cache-state.types";

export interface InvalidationAnalysisResult {
  findings: CacheStateFinding[];
  uncoveredLayersByRule: Record<string, string[]>;
}

export class InvalidationAnalyzer {
  public static analyze(topology: DistributedStateTopology): InvalidationAnalysisResult {
    const findings: CacheStateFinding[] = [];
    const uncoveredLayersByRule: Record<string, string[]> = {};

    const layerMap = new Map<string, CacheLayer>(topology.cacheLayers.map((l) => [l.id, l]));

    // 1. Audit Invalidation Rules for Multi-Tier Propagation Gaps
    for (const rule of topology.invalidationRules) {
      const targetedLayers = rule.targetCacheLayerIds
        .map((id) => layerMap.get(id))
        .filter((l): l is CacheLayer => !!l);

      // Check if there are upstream client-facing cache layers (CDN / Browser / Edge) that are omitted
      const minTierTargeted = Math.min(...targetedLayers.map((l) => l.tierOrder), 999);

      const upstreamOmittedLayers = topology.cacheLayers.filter(
        (l) => l.tierOrder < minTierTargeted && !rule.targetCacheLayerIds.includes(l.id)
      );

      uncoveredLayersByRule[rule.id] = upstreamOmittedLayers.map((l) => l.name);

      if (upstreamOmittedLayers.length > 0) {
        findings.push({
          id: `finding-invalidation-propagation-gap-${rule.id}`,
          category: "invalidation_propagation_gap",
          severity: "high",
          title: `Upstream Invalidation Propagation Gap in Rule "${rule.name}"`,
          explanation: `Invalidation rule "${rule.name}" targets tier ${minTierTargeted} cache (${targetedLayers.map((l) => l.name).join(", ")}), but omits upstream cache layers closer to users (${upstreamOmittedLayers.map((l) => l.name).join(", ")}). When data mutates, upstream caches will continue serving stale representations until natural TTL expires.`,
          evidence: [
            `Rule: ${rule.name} (${rule.mechanism})`,
            `Trigger: ${rule.triggerEventOrTable}`,
            `Targeted tiers: ${targetedLayers.map((l) => `${l.name} (tier ${l.tierOrder})`).join(", ")}`,
            `Omitted upstream tiers: ${upstreamOmittedLayers.map((l) => `${l.name} (tier ${l.tierOrder})`).join(", ")}`,
          ],
          riskAnalysis:
            "Users observe inconsistent, stale data even after successful writes because CDN or edge caches remain unpurged.",
          remediation: `Extend invalidation rule "${rule.name}" to propagate purge events or surrogate-key (Cache-Tag) bans to upstream layers (${upstreamOmittedLayers.map((l) => l.name).join(", ")}).`,
        });
      }

      // 2. Asynchronous Invalidation Race Condition Hazard
      if (rule.isAsynchronous) {
        findings.push({
          id: `finding-invalidation-race-${rule.id}`,
          category: "invalidation_race_condition",
          severity: "medium",
          title: `Asynchronous Invalidation Race Hazard on "${rule.name}"`,
          explanation: `Rule "${rule.name}" executes asynchronously via ${rule.mechanism}. If a concurrent reader misses or reads the database before asynchronous invalidation message delivery, the cache may be refilled with stale pre-update data.`,
          evidence: [
            `Mechanism: ${rule.mechanism}`,
            `isAsynchronous: true`,
            `Expected latency: ${rule.propagationLatencyMsExpected ?? "unspecified"}ms`,
          ],
          riskAnalysis:
            "Silent permanent cache staleness: pre-update values can overwrite newly written records in the cache until the next write or TTL expiration.",
          remediation:
            "Use two-step deletion (invalidate before and after commit) or verify version tokens before writing read results into the cache.",
        });
      }
    }

    // 3. Detect Authoritative Sources with Zero Invalidation Rules
    for (const sot of topology.sourcesOfTruth) {
      const hasAssociatedInvalidation = topology.invalidationRules.some(
        (r) =>
          r.triggerEventOrTable.toLowerCase().includes(sot.name.toLowerCase()) ||
          r.name.toLowerCase().includes(sot.name.toLowerCase())
      );

      if (!hasAssociatedInvalidation && topology.cacheLayers.length > 0) {
        findings.push({
          id: `finding-missing-invalidation-${sot.id}`,
          category: "authoritative_source_missing",
          severity: "high",
          affectedSourceOfTruthId: sot.id,
          title: `Missing Cache Invalidation Rules for Source-of-Truth "${sot.name}"`,
          explanation: `Source-of-truth "${sot.name}" has no explicit cache invalidation or purge rules registered. Modifications committed directly to "${sot.name}" will not trigger cache eviction, leaving caches reliant entirely on passive TTL expiration.`,
          evidence: [
            `Source of Truth: ${sot.name} (${sot.type})`,
            `Registered cache layers: ${topology.cacheLayers.length}`,
            `Matching invalidation rules: 0`,
          ],
          riskAnalysis:
            "Significant staleness window: database writes will not be reflected in cached endpoints until TTL expiration.",
          remediation:
            "Define an event-driven or transactional CDC invalidation rule linking mutations on this data store to target cache layer purges.",
        });
      }
    }

    return { findings, uncoveredLayersByRule };
  }
}
