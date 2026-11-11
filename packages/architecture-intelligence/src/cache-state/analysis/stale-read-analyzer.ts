/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Stale Read & Read-After-Write Consistency Analyzer
 */

import type {
  DistributedStateTopology,
  StaleReadEvaluation,
  CacheStateFinding,
} from "../contracts/cache-state.types";

export interface StaleReadAnalysisResult {
  evaluations: StaleReadEvaluation[];
  findings: CacheStateFinding[];
}

export class StaleReadAnalyzer {
  public static analyze(topology: DistributedStateTopology): StaleReadAnalysisResult {
    const evaluations: StaleReadEvaluation[] = [];
    const findings: CacheStateFinding[] = [];

    // 1. Audit Cache Layers for Stale Read Windows
    for (const layer of topology.cacheLayers) {
      const ttlSeconds = layer.ttlConfig.defaultTtlSeconds;
      const isLongTtl = ttlSeconds > 300; // > 5 minutes

      for (const ks of layer.keySpaces) {
        const isConfidentialOrRestricted =
          ks.dataClassification === "restricted" || ks.dataClassification === "confidential";

        const hasExplicitInvalidation = topology.invalidationRules.some(
          (r) =>
            r.targetCacheLayerIds.includes(layer.id) &&
            (r.invalidationKeyPattern.includes(ks.namespacePattern) ||
              ks.namespacePattern.includes(r.invalidationKeyPattern) ||
              r.invalidationKeyPattern === "*")
        );

        if (isConfidentialOrRestricted && isLongTtl && !hasExplicitInvalidation) {
          findings.push({
            id: `finding-stale-read-ttl-${layer.id}-${ks.id}`,
            category: "stale_read_violation",
            severity: "high",
            affectedCacheLayerId: layer.id,
            title: `Excessive Stale-Read Window on Classified Key Space "${ks.name}" (${ttlSeconds}s)`,
            explanation: `Key space "${ks.name}" stores ${ks.dataClassification} data on cache layer "${layer.name}" with a ${ttlSeconds}s TTL, but has no explicit or event-driven invalidation rules. Stale representations persist up to ${ttlSeconds} seconds after updates.`,
            evidence: [
              `Layer: ${layer.name} (${layer.technology})`,
              `Data Classification: ${ks.dataClassification}`,
              `TTL: ${ttlSeconds}s`,
              `Explicit Invalidation: none`,
            ],
            riskAnalysis:
              "Revoked permissions, security credential changes, or balance modifications remain unenforced in the cache for minutes, creating unauthorized access windows.",
            remediation:
              "Configure immediate event-driven invalidation on data mutation or reduce TTL to ≤ 30s.",
          });
        }

        evaluations.push({
          layerOrReplicaId: layer.id,
          layerOrReplicaName: layer.name,
          targetDomain: ks.name,
          isStaleReadRisk: isConfidentialOrRestricted && !hasExplicitInvalidation && isLongTtl,
          maximumStalenessWindowSeconds: ttlSeconds,
          consistencyModel: "eventual",
          explanation: hasExplicitInvalidation
            ? `Protected by explicit invalidation purge rules.`
            : `Bounded only by passive TTL expiration (${ttlSeconds}s).`,
          riskSeverity: isConfidentialOrRestricted ? "high" : "low",
        });
      }
    }

    // 2. Audit Read Replica Groups for Read-After-Write Consistency Gaps
    for (const group of topology.replicaGroups) {
      const readOnlyReplicas = group.replicas.filter((r) => r.isReadOnly);
      const isAsync = group.replicationMode === "asynchronous";

      if (readOnlyReplicas.length > 0 && isAsync) {
        // High risk of client writing to leader and reading from lagging replica
        const maxLag = Math.max(
          ...readOnlyReplicas.map(
            (r) => r.replicationLagMsObserved ?? r.replicationLagMsModeled ?? 150
          )
        );

        findings.push({
          id: `finding-read-after-write-gap-${group.id}`,
          category: "read_after_write_lag_hazard",
          severity: "high",
          affectedReplicaGroupId: group.id,
          title: `Read-After-Write Consistency Hazard on Replica Group (${readOnlyReplicas.length} Read Replicas)`,
          explanation: `Replica group uses asynchronous replication across ${readOnlyReplicas.length} read replicas with up to ${maxLag}ms lag. When an end user mutates data and immediately refreshes their view, read routing to an asynchronous replica will observe older state, appearing as if the mutation failed.`,
          evidence: [
            `Topology: ${group.topologyType}`,
            `Replication Mode: asynchronous`,
            `Read Replicas: ${readOnlyReplicas.length}`,
            `Estimated Replica Lag: ${maxLag}ms`,
          ],
          riskAnalysis:
            "User confusion, duplicate resubmissions (e.g. submitting orders multiple times), and user trust degradation.",
          remediation:
            "Implement read-after-write session affinity (route user reads to primary for 5-10 seconds following any write) or enforce causal consistency version tokens.",
          deterministicCalculation: {
            metricName: "Asynchronous Replica Lag Ceiling",
            value: maxLag,
            threshold: 50,
            formula: "Max(replica_lag_ms)",
          },
        });

        // 3. Monotonic Read Violation Check
        if (group.consistencyModel !== "monotonic_reads" && group.consistencyModel !== "linearizable") {
          findings.push({
            id: `finding-monotonic-read-violation-${group.id}`,
            category: "monotonic_read_violation",
            severity: "medium",
            affectedReplicaGroupId: group.id,
            title: `Monotonic Read Violation Hazard across Independent Replicas`,
            explanation: `Replica group does not guarantee monotonic reads. Successive read requests from the same user routed across different replicas can observe time moving backwards if the second replica is further behind in replication lag than the first.`,
            evidence: [
              `Consistency Model: ${group.consistencyModel}`,
              `Replication Mode: ${group.replicationMode}`,
            ],
            riskAnalysis:
              "State flicker and intermittent disappearing data in client applications.",
            remediation:
              "Enforce sticky session hashing or client-side vector clocks to ensure monotonic reads.",
          });
        }
      }
    }

    return { evaluations, findings };
  }
}

