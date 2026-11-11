/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Replication Topology & Quorum Consistency Analyzer
 */

import type {
  DistributedStateTopology,
  CacheStateFinding,
} from "../contracts/cache-state.types";

export class ReplicationConsistencyAnalyzer {
  public static analyze(topology: DistributedStateTopology): CacheStateFinding[] {
    const findings: CacheStateFinding[] = [];

    for (const group of topology.replicaGroups) {
      const n = group.replicas.length;
      const r = group.readQuorumSize;
      const w = group.writeQuorumSize;

      // 1. Quorum Sizing Analysis (R + W > N)
      if (group.replicationMode === "quorum_based" && r !== undefined && w !== undefined) {
        const quorumSum = r + w;
        const isOverlapGuaranteed = quorumSum > n;

        if (!isOverlapGuaranteed) {
          findings.push({
            id: `finding-quorum-inconsistency-${group.id}`,
            category: "quorum_inconsistency_hazard",
            severity: "critical",
            affectedReplicaGroupId: group.id,
            title: `Quorum Inconsistency Hazard: R + W ≤ N (${r} + ${w} ≤ ${n})`,
            explanation: `Replica group configures Read Quorum R=${r} and Write Quorum W=${w} across N=${n} replicas. Because R + W (${quorumSum}) is not strictly greater than N (${n}), the read and write quorums do not overlap by at least one replica. Concurrent writes can succeed while subsequent reads read only un-updated nodes, violating strong consistency.`,
            evidence: [
              `Replicas (N): ${n}`,
              `Read Quorum (R): ${r}`,
              `Write Quorum (W): ${w}`,
              `Quorum Overlap: R + W = ${quorumSum} (<= ${n})`,
            ],
            riskAnalysis:
              "Silent data regression: stale values returned immediately following confirmed writes.",
            remediation: `Adjust quorum parameters such that R + W > ${n} (e.g. R=${Math.ceil(
              (n + 1) / 2
            )}, W=${Math.ceil((n + 1) / 2)}).`,
            deterministicCalculation: {
              metricName: "Quorum Overlap Metric",
              value: quorumSum,
              threshold: n,
              formula: "R + W - N",
            },
          });
        }
      }

      // 2. Multi-Leader Last-Write-Wins (LWW) Data Loss Hazard
      if (
        (group.topologyType === "multi_leader" || group.topologyType === "leaderless_dynamo") &&
        group.conflictResolution === "last_write_wins_timestamp"
      ) {
        findings.push({
          id: `finding-lww-conflict-loss-${group.id}`,
          category: "cache_coherence_divergence",
          severity: "high",
          affectedReplicaGroupId: group.id,
          title: `Silent Data Loss Hazard via Last-Write-Wins (LWW) on ${group.topologyType}`,
          explanation: `Replica group uses Last-Write-Wins (LWW) based on wall-clock timestamps for conflict resolution across multi-leader/leaderless nodes. Because physical server clocks experience non-zero drift, a valid subsequent write with a slightly backward clock will be silently dropped in favor of an obsolete write with a forward clock.`,
          evidence: [
            `Topology: ${group.topologyType}`,
            `Conflict Resolution: last_write_wins_timestamp`,
            `Replicas: ${group.replicas.length}`,
          ],
          riskAnalysis:
            "Silent overwrite and lost updates between concurrent users in different data centers without any error reported to the caller.",
          remediation:
            "Replace LWW timestamps with Conflict-Free Replicated Data Types (CRDTs), Lamport/vector clocks, or application-level business merge strategies.",
        });
      }

      // 3. Multi-Region Replication Lag Warning
      const distinctRegions = new Set(group.replicas.map((r) => r.regionId));
      if (distinctRegions.size > 1 && group.replicationMode === "asynchronous") {
        findings.push({
          id: `finding-cross-region-divergence-${group.id}`,
          category: "cache_coherence_divergence",
          severity: "medium",
          affectedReplicaGroupId: group.id,
          title: `Cross-Region Replication Divergence Window across ${distinctRegions.size} Regions`,
          explanation: `Replicas are distributed across multiple geographic regions (${Array.from(
            distinctRegions
          ).join(
            ", "
          )}) with asynchronous replication. Cross-continental WAN round-trip latency creates an unavoidable 100-300ms window where regional read replicas serve conflicting versions.`,
          evidence: [
            `Regions: ${Array.from(distinctRegions).join(", ")}`,
            `Replication Mode: asynchronous`,
          ],
          riskAnalysis:
            "Regional user divergence: users in different regions observing different entity state concurrently.",
          remediation:
            "Design services to read from local primary regions for writes or use global session affinity headers.",
        });
      }
    }

    return findings;
  }
}

