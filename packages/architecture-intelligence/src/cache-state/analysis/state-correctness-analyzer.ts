/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * State Ownership & Data Correctness Analyzer
 */

import type {
  DistributedStateTopology,
  CacheStateFinding,
} from "../contracts/cache-state.types";

export class StateCorrectnessAnalyzer {
  public static analyze(topology: DistributedStateTopology): CacheStateFinding[] {
    const findings: CacheStateFinding[] = [];

    // Group state owners by domain
    const ownersByDomain = new Map<string, typeof topology.stateOwners>();
    for (const owner of topology.stateOwners) {
      const list = ownersByDomain.get(owner.stateDomain) || [];
      list.push(owner);
      ownersByDomain.set(owner.stateDomain, list);
    }

    // 1. Multiple Uncoordinated Writers on Same State Domain
    for (const [domain, owners] of ownersByDomain.entries()) {
      if (owners.length > 1) {
        const services = owners.map((o) => o.serviceId);
        const allHaveLocking = owners.every((o) => !!o.distributedLockConfig);
        const allHaveOCC = owners.every((o) => !!o.optimisticConcurrencyField);

        if (!allHaveLocking && !allHaveOCC) {
          findings.push({
            id: `finding-multiple-writers-${domain}`,
            category: "cache_coherence_divergence",
            severity: "critical",
            title: `Uncoordinated Multiple Writers on State Domain "${domain}"`,
            explanation: `Multiple independent services (${services.join(
              ", "
            )}) declare write ownership over state domain "${domain}" without uniform optimistic concurrency fields or distributed locking. Concurrent writes from different services will overwrite each other's changes, leading to lost updates.`,
            evidence: [
              `Domain: ${domain}`,
              `Writing Services: ${services.join(", ")}`,
              `Optimistic Concurrency Field Configured: ${allHaveOCC ? "Yes" : "No"}`,
              `Distributed Lock Configured: ${allHaveLocking ? "Yes" : "No"}`,
            ],
            riskAnalysis:
              "Silent data corruption: updates committed by one service are clobbered by another service reading and writing stale state.",
            remediation:
              "Designate a single authoritative owner service for this domain, or enforce optimistic concurrency control (OCC) with atomic version check-and-set.",
          });
        }
      }

      // 2. Entity State Domain Missing Optimistic Concurrency
      for (const owner of owners) {
        if (
          (owner.stateType === "entity" || owner.stateType === "workflow") &&
          !owner.optimisticConcurrencyField &&
          !owner.distributedLockConfig
        ) {
          findings.push({
            id: `finding-missing-occ-${owner.id}`,
            category: "cache_coherence_divergence",
            severity: "high",
            affectedStateOwnerId: owner.id,
            title: `Missing Optimistic Concurrency Control on "${owner.stateDomain}" (${owner.serviceId})`,
            explanation: `Service "${owner.serviceId}" mutates ${owner.stateType} state in domain "${owner.stateDomain}" without configuring an optimistic concurrency field (e.g. 'version' or 'updated_at') or distributed lock.`,
            evidence: [
              `Service: ${owner.serviceId}`,
              `Domain: ${owner.stateDomain}`,
              `Type: ${owner.stateType}`,
              `optimisticConcurrencyField: undefined`,
            ],
            riskAnalysis:
              "Blind overwrites: concurrent requests handling the same entity will overwrite each other without conflict detection.",
            remediation:
              "Add an integer version column to the state table and enforce conditional updates (e.g. `WHERE version = :expected`).",
          });
        }
      }
    }

    // 3. Write-Behind Cache Durability Exposure
    for (const layer of topology.cacheLayers) {
      if (layer.strategy === "write_behind") {
        findings.push({
          id: `finding-write-behind-data-loss-${layer.id}`,
          category: "unbounded_write_behind_data_loss",
          severity: "high",
          affectedCacheLayerId: layer.id,
          title: `Write-Behind Asynchronous Durability Exposure on "${layer.name}"`,
          explanation: `Cache layer "${layer.name}" uses a write-behind (write-back) caching strategy. Writes are acknowledged immediately to clients upon being written to volatile cache memory before being asynchronously flushed to the database. If the cache node crashes, reboots, or undergoes an OOM eviction before flushing, committed client writes are permanently lost.`,
          evidence: [
            `Layer: ${layer.name} (${layer.technology})`,
            `Strategy: write_behind`,
            `Allocated Memory: ${layer.allocatedMemoryMb} MB`,
          ],
          riskAnalysis:
            "Permanent data loss: clients receive successful write acknowledgments for transactions that never reach durable disk storage.",
          remediation:
            "Switch to write-through caching or ensure write-behind queues use a durable write-ahead log (WAL) with multi-node replication.",
        });
      }
    }

    return findings;
  }
}

