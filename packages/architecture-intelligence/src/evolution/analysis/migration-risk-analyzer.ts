/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Migration Risk & Blast Radius Analyzer
 * Detects dual-write hazards, data drift, temporary security boundaries, and cutover blast radius.
 */

import type { ArchitectureSnapshot } from "../../comparison/contracts/comparison.types";
import type {
  MigrationRisk,
  MigrationWave,
  MigrationTask,
} from "../contracts/evolution.types";

export class MigrationRiskAnalyzer {
  /**
   * Analyzes migration risks across waves and architecture components.
   */
  public static analyzeRisks(
    sourceSnapshot: ArchitectureSnapshot,
    targetSnapshot: ArchitectureSnapshot,
    waves: MigrationWave[],
    tasks: MigrationTask[],
    projectId: string = "migration-proj-1"
  ): MigrationRisk[] {
    const risks: MigrationRisk[] = [];
    let riskCount = 1;
    const makeRiskId = (cat: string) => `${projectId}-risk-${cat}-${riskCount++}`;

    const sourceDb = sourceSnapshot.nodes.find((n) => n.data.nodeType === "database");
    const targetDbs = targetSnapshot.nodes.filter((n) => n.data.nodeType === "database");
    const targetServices = targetSnapshot.nodes.filter((n) => n.data.nodeType === "service");
    const wave1 = waves.find((w) => w.waveNumber === 1) || waves[0];
    const wave2 = waves.find((w) => w.waveNumber === 2) || waves[0];
    const wave3 = waves.find((w) => w.waveNumber === 3) || waves[0];
    const wave4 = waves.find((w) => w.waveNumber === 4) || waves[0];
    const wave5 = waves.find((w) => w.waveNumber === 5) || waves[0];

    // 1. Dual-Write Inconsistency & Out-of-Order Replication Hazard
    if (sourceDb && targetDbs.length > 0) {
      risks.push({
        id: makeRiskId("dual-write"),
        waveId: wave2.id,
        affectedComponentIds: [sourceDb.id, ...targetDbs.map((d) => d.id)],
        failureMode: "Asynchronous replication lag or race conditions leading to inconsistent state between legacy and target databases during dual-run.",
        category: "dual_write_inconsistency",
        severity: "critical",
        likelihood: "high",
        mitigationPlan: "Enforce idempotent upserts, record-level monotonically increasing version timestamps, and automated continuous reconciliation audit jobs.",
        owner: "Data Platform Engineering",
        status: "identified",
      });
    }

    // 2. Latency Spikes from Gateway Hop & Distributed Decomposition
    if (targetServices.length > 1) {
      risks.push({
        id: makeRiskId("latency"),
        waveId: wave3.id,
        affectedComponentIds: targetServices.map((s) => s.id),
        failureMode: "Additional network serialization, gateway routing hops, and inter-service RPC overhead degrades P99 customer response latency.",
        category: "latency_spike",
        severity: "medium",
        likelihood: "medium",
        mitigationPlan: "Use HTTP/2 or gRPC keepalive connection pools, optimize JSON serialization with protobuf where appropriate, and set strict 50ms timeouts.",
        owner: "Backend Platform Team",
        status: "mitigated",
      });
    }

    // 3. Breaking Contract Discrepancies during Strangler Proxying
    risks.push({
      id: makeRiskId("contract"),
      waveId: wave3.id,
      affectedComponentIds: targetServices.slice(0, 2).map((s) => s.id),
      failureMode: "Subtle field naming or nullability discrepancies between legacy monolith responses and extracted microservice JSON contracts.",
      category: "contract_breakage",
      severity: "high",
      likelihood: "medium",
      mitigationPlan: "Enforce bidirectional schema validation using OpenAPI spec diffs and run shadow parallel traffic comparison prior to canary cutover.",
      owner: "API Governance Team",
      status: "mitigated",
    });

    // 4. Service Disruption & Traffic Overload during Progressive Cutover
    risks.push({
      id: makeRiskId("disruption"),
      waveId: wave4.id,
      affectedComponentIds: targetServices.map((s) => s.id),
      failureMode: "Target service replicas or database connection pools saturate under 100% production peak burst traffic, causing 503 errors.",
      category: "service_disruption",
      severity: "critical",
      likelihood: "medium",
      mitigationPlan: "Pre-scale container replicas to 2x baseline capacity, configure Horizontal Pod Autoscaler (HPA) at 60% CPU, and enable circuit breakers in gateway.",
      owner: "SRE / Operations Team",
      status: "identified",
    });

    // 5. Rollback Failure & Point of No Return in Wave 5
    const wave5Tasks = tasks.filter((t) => t.waveId === wave5.id);
    const hasIrreversibleTask = wave5Tasks.some((t) => t.isPointOfNoReturn);
    if (hasIrreversibleTask) {
      risks.push({
        id: makeRiskId("rollback-fail"),
        waveId: wave5.id,
        affectedComponentIds: sourceSnapshot.nodes.map((n) => n.id).slice(0, 3),
        failureMode: "Legacy monolith termination or schema drop makes rollback impossible if a latent edge-case bug surfaces post-decommissioning.",
        category: "rollback_failure",
        severity: "critical",
        likelihood: "low",
        mitigationPlan: "Require minimum 14-day bake period under 100% traffic before executing irreversible decommissioning tasks, and take immutable cold storage snapshots.",
        owner: "Architecture Review Board",
        status: "accepted",
      });
    }

    // 6. Security Exposure at Transition Boundaries
    risks.push({
      id: makeRiskId("security"),
      waveId: wave1.id,
      affectedComponentIds: targetServices.map((s) => s.id),
      failureMode: "Interim routing facade or extracted microservices deployed with permissive debug network policies or unencrypted internal links.",
      category: "security_exposure",
      severity: "high",
      likelihood: "low",
      mitigationPlan: "Mandate mTLS encryption via service mesh sidecars, validate JWT token audiences on every internal call, and restrict ingress security groups.",
      owner: "Security Architecture Team",
      status: "mitigated",
    });

    // Attach risk IDs to respective waves
    for (const risk of risks) {
      const wave = waves.find((w) => w.id === risk.waveId);
      if (wave && !wave.riskIds.includes(risk.id)) {
        wave.riskIds.push(risk.id);
      }
    }

    return risks;
  }
}
