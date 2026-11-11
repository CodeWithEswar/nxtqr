/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Distributed Lock Fencing & Safety Analyzer
 */

import type {
  DistributedStateTopology,
  CacheStateFinding,
} from "../contracts/cache-state.types";

export class LockSafetyAnalyzer {
  public static analyze(topology: DistributedStateTopology): CacheStateFinding[] {
    const findings: CacheStateFinding[] = [];

    for (const owner of topology.stateOwners) {
      const lock = owner.distributedLockConfig;
      if (!lock) continue;

      // 1. Missing Fencing Token Hazard (Martin Kleppmann's Redlock proof)
      if (!lock.hasFencingToken) {
        findings.push({
          id: `finding-lock-missing-fencing-${owner.id}-${lock.id}`,
          category: "split_brain_distributed_lock_hazard",
          severity: "critical",
          affectedStateOwnerId: owner.id,
          title: `Critical Split-Brain Hazard: Distributed Lock "${lock.name}" Lacks Fencing Token`,
          explanation: `Distributed lock "${lock.name}" (${lock.lockManagerTechnology}) does not generate or verify monotonically increasing fencing tokens (Martin Kleppmann distributed lock safety hazard). If a worker holding this lock experiences an unannounced pause (e.g. Garbage Collection freeze or network partition), its lease (${lock.leaseDurationMs}ms) will expire and a second worker will acquire the lock. When the first worker resumes, it will execute writes unaware that its lock expired, clobbering the second worker's changes.`,
          evidence: [
            `State Domain: ${owner.stateDomain}`,
            `Service: ${owner.serviceId}`,
            `Lock Manager: ${lock.lockManagerTechnology}`,
            `Lease Duration: ${lock.leaseDurationMs}ms`,
            `hasFencingToken: false`,
          ],
          riskAnalysis:
            "Distributed race conditions and concurrent mutation collisions occurring under normal production Garbage Collection and cloud VM pauses.",
          remediation:
            "Include a monotonically incrementing fencing token returned upon lock acquisition and reject database writes where `storage.fencing_token >= client.fencing_token`.",
        });
      }

      // 2. Dangerous Ultra-Short Lease Duration
      if (lock.leaseDurationMs < 1000) {
        findings.push({
          id: `finding-lock-short-lease-${owner.id}-${lock.id}`,
          category: "split_brain_distributed_lock_hazard",
          severity: "high",
          affectedStateOwnerId: owner.id,
          title: `Premature Lock Expiration Risk: Short Lease Duration (${lock.leaseDurationMs}ms)`,
          explanation: `Lock lease duration of ${lock.leaseDurationMs}ms on "${lock.name}" is dangerously close to standard cloud network jitter and TCP retransmission windows. Transient GC pauses or network delays will easily cause the lease to expire before the critical section completes.`,
          evidence: [
            `Lock: ${lock.name}`,
            `Lease Duration: ${lock.leaseDurationMs}ms`,
            `Auto-renewal: ${lock.autoRenewal}`,
          ],
          riskAnalysis:
            "Premature lock loss and concurrent double execution of critical business logic.",
          remediation:
            "Increase lease duration to at least 5,000ms - 10,000ms with proactive background lease renewal heartbeats.",
        });
      }
    }

    return findings;
  }
}

