/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Multi-Analyzer Contradiction & Conflict Detection Engine
 */

import type {
  NormalizedFinding,
  ContradictionRecord,
  CanonicalAnalysisContext,
} from "../contracts/orchestration.types";

export class ContradictionDetector {
  /**
   * Identifies genuine contradictions and architectural tensions across analyzer findings.
   * Adheres strictly to the Non-Fabrication Principle: flags contradictions explicitly
   * rather than picking an arbitrary winner.
   */
  public static detectContradictions(
    findings: NormalizedFinding[],
    _context: CanonicalAnalysisContext
  ): ContradictionRecord[] {
    const contradictions: ContradictionRecord[] = [];
    let counter = 1;

    // 1. Redundancy Conflict: SPOF vs High Availability assertion
    const spofFindings = findings.filter(
      (f) =>
        f.sourceAnalyzerId === "architecture.spof" ||
        (f.category || "").toLowerCase().includes("spof") ||
        (f.category || "").toLowerCase().includes("single_point_of_failure")
    );
    const reliabilityFindings = findings.filter(
      (f) =>
        f.sourceAnalyzerId === "architecture.reliability" ||
        f.sourceAnalyzerId === "architecture.database"
    );

    for (const spof of spofFindings) {
      for (const compId of spof.affectedComponentIds) {
        // Check if another analyzer treats this component as redundant or HA
        const conflicting = reliabilityFindings.find(
          (rf) =>
            rf.affectedComponentIds.includes(compId) &&
            ((rf.title || "").toLowerCase().includes("redundant") ||
              (rf.title || "").toLowerCase().includes("replica") ||
              (rf.description || "").toLowerCase().includes("multi-zone") ||
              (rf.description || "").toLowerCase().includes("failover configured"))
        );

        if (conflicting) {
          contradictions.push({
            id: `contra-${counter++}`,
            type: "redundancy_conflict",
            description: `Contradiction on component '${compId}': SPOF detected despite claimed redundancy/replication.`,
            involvedAnalyzerIds: [spof.sourceAnalyzerId, conflicting.sourceAnalyzerId],
            involvedFindingIds: [spof.id, conflicting.id],
            affectedComponentIds: [compId],
            explanation: `Analyzer '${spof.sourceAnalyzerId}' flagged '${compId}' as a single point of failure, whereas '${conflicting.sourceAnalyzerId}' reported active redundancy or replication.`,
            resolutionGuidance: `Verify whether physical placement isolates replicas into distinct failure domains or whether a hidden upstream dependency collapses the redundancy.`,
          });
        }
      }
    }

    // 2. RTO / Disaster Recovery Verification Gap
    const rtoAssumptions = findings.filter(
      (f) =>
        (f.title || "").toLowerCase().includes("rto") ||
        (f.description || "").toLowerCase().includes("rto") ||
        (f.description || "").toLowerCase().includes("recovery time")
    );
    const verificationFailures = findings.filter(
      (f) =>
        f.sourceAnalyzerId === "architecture.verification" &&
        ((f.title || "").toLowerCase().includes("dr") ||
          (f.title || "").toLowerCase().includes("backup") ||
          (f.title || "").toLowerCase().includes("failover"))
    );

    if (rtoAssumptions.length > 0 && verificationFailures.length > 0) {
      for (const vFail of verificationFailures) {
        contradictions.push({
          id: `contra-${counter++}`,
          type: "rto_verification_gap",
          description: `RTO Target vs Verification Gap: Recovery claims exist but verification readiness tests failed.`,
          involvedAnalyzerIds: [
            ...new Set([...rtoAssumptions.map((r) => r.sourceAnalyzerId), vFail.sourceAnalyzerId]),
          ],
          involvedFindingIds: [...rtoAssumptions.slice(0, 2).map((r) => r.id), vFail.id],
          affectedComponentIds: vFail.affectedComponentIds,
          explanation: `System designs specify operational recovery objectives, yet automated readiness test '${vFail.title}' failed without empirical recovery evidence.`,
          resolutionGuidance: `Run an operational game day or restore rehearsal to produce verified recovery time evidence before certifying readiness.`,
        });
      }
    }

    // 3. Security Boundary Conflict
    const securityVulnerabilities = findings.filter(
      (f) =>
        f.sourceAnalyzerId === "architecture.security" &&
        ((f.title || "").toLowerCase().includes("unencrypted") ||
          (f.title || "").toLowerCase().includes("boundary") ||
          (f.title || "").toLowerCase().includes("perimeter"))
    );
    const networkPasses = findings.filter(
      (f) =>
        f.sourceAnalyzerId === "architecture.network" &&
        ((f.title || "").toLowerCase().includes("segmented") ||
          (f.title || "").toLowerCase().includes("isolated"))
    );

    for (const sec of securityVulnerabilities) {
      for (const net of networkPasses) {
        const overlap = sec.affectedComponentIds.filter((id) =>
          net.affectedComponentIds.includes(id)
        );
        if (overlap.length > 0) {
          contradictions.push({
            id: `contra-${counter++}`,
            type: "security_boundary_conflict",
            description: `Security & Network Boundary Conflict on [${overlap.join(", ")}].`,
            involvedAnalyzerIds: [sec.sourceAnalyzerId, net.sourceAnalyzerId],
            involvedFindingIds: [sec.id, net.id],
            affectedComponentIds: overlap,
            explanation: `Security analysis identified missing boundary enforcement or unencrypted channels on components that Network analysis classified as protected/isolated.`,
            resolutionGuidance: `Confirm whether intra-VPC traffic requires TLS/mTLS or whether network perimeter controls satisfy compliance requirements.`,
          });
        }
      }
    }

    // 4. Missing required evidence contradiction
    for (const finding of findings) {
      if (finding.confidence === "assumed" && finding.severity === "critical") {
        contradictions.push({
          id: `contra-${counter++}`,
          type: "scenario_assumption_conflict",
          description: `Critical finding '${finding.title}' is based on an unverified assumption without supporting evidence.`,
          involvedAnalyzerIds: [finding.sourceAnalyzerId],
          involvedFindingIds: [finding.id],
          affectedComponentIds: finding.affectedComponentIds,
          explanation: `The architecture evaluation assumes critical failure modes without empirical or modeled telemetry evidence.`,
          resolutionGuidance: `Attach verified evidence (telemetry traces, benchmark data, or policy assertions) to eliminate ungrounded assumptions.`,
        });
      }
    }

    return contradictions;
  }
}
