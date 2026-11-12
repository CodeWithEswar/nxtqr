import type {
  AnalysisAdrRecord,
  AnalysisEvidence,
  AnalysisInvariantReport,
  AnalysisNormalizedMetrics,
  AnalysisRecommendation,
  AnalysisBottleneckFinding,
  AnalysisRevision,
} from "../analysis-schemas";
import { computeRevisionContentHash } from "../revisions/revision-diff-engine";

export class AnalysisInvariantMonitor {
  public static verify(params: {
    baselineOriginalHash: string;
    baselineRevision: AnalysisRevision;
    candidateRevision: AnalysisRevision;
    baselineMetrics: AnalysisNormalizedMetrics;
    candidateMetrics: AnalysisNormalizedMetrics;
    evidences: AnalysisEvidence[];
    bottlenecks: AnalysisBottleneckFinding[];
    recommendations: AnalysisRecommendation[];
    adr: AnalysisAdrRecord;
    constraintsEvaluatedExplicitly: boolean;
  }): AnalysisInvariantReport {
    const {
      baselineOriginalHash,
      baselineRevision,
      candidateRevision,
      baselineMetrics,
      candidateMetrics,
      evidences,
      bottlenecks,
      recommendations,
      adr,
      constraintsEvaluatedExplicitly,
    } = params;

    const violations: string[] = [];
    const evIds = new Set(evidences.map((e) => e.id));

    const currentBaseHash = computeRevisionContentHash(baselineRevision);
    const baselineImmutableOk = currentBaseHash === baselineOriginalHash;
    if (!baselineImmutableOk) {
      violations.push("Baseline architecture revision was mutated during experiment.");
    }

    const candidateVersionedOk =
      candidateRevision.revisionId !== baselineRevision.revisionId;
    if (!candidateVersionedOk) {
      violations.push("Candidate revision does not have an independent revisionId.");
    }

    const unitsNormalizedOk =
      baselineMetrics.errorRate >= 0 &&
      baselineMetrics.errorRate <= 1 &&
      candidateMetrics.errorRate >= 0 &&
      candidateMetrics.errorRate <= 1 &&
      baselineMetrics.p95LatencyMs >= 0 &&
      candidateMetrics.p95LatencyMs >= 0;

    // Zero fabricated metrics: when analytical assumptions do not hold, analyticalAvailability must stay null
    const noFabricatedMetricsOk =
      (baselineMetrics.availabilityAssumptionsHeld ||
        baselineMetrics.analyticalAvailability === null) &&
      (candidateMetrics.availabilityAssumptionsHeld ||
        candidateMetrics.analyticalAvailability === null);
    if (!noFabricatedMetricsOk) {
      violations.push("Analytical availability was reported despite violated independence assumptions.");
    }

    const findingsHaveEvidenceOk = bottlenecks.every((b) =>
      b.evidenceIds.some((id) => evIds.has(id))
    );
    if (!findingsHaveEvidenceOk) {
      violations.push("At least one bottleneck finding lacks traceable evidence.");
    }

    const recommendationsHaveEvidenceOk = recommendations.every((r) =>
      r.evidenceIds.some((id) => evIds.has(id))
    );
    if (!recommendationsHaveEvidenceOk) {
      violations.push("At least one recommendation lacks traceable evidence.");
    }

    const sharedDependenciesNotIndependentOk =
      candidateMetrics.availabilityAssumptionsHeld ||
      candidateMetrics.analyticalAvailability === null;

    const constraintsNotHiddenOk = constraintsEvaluatedExplicitly;

    const adrLinksValidOk =
      adr.baselineRevisionHash === currentBaseHash &&
      adr.evidenceIds.every((id) => evIds.has(id));
    if (!adrLinksValidOk) {
      violations.push("ADR revision hash or evidence references are inconsistent.");
    }

    return {
      allPassed: violations.length === 0,
      baselineImmutableOk,
      candidateVersionedOk,
      unitsNormalizedOk,
      noFabricatedMetricsOk,
      findingsHaveEvidenceOk,
      recommendationsHaveEvidenceOk,
      sharedDependenciesNotIndependentOk,
      constraintsNotHiddenOk,
      adrLinksValidOk,
      violations,
    };
  }
}

