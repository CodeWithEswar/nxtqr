import { describe, expect, it } from "vitest";
import {
  ANALYSIS_PRESET_METADATA,
  ArchitectureAnalysisExecutionEngine,
  cloneRevisionImmutable,
  computeRevisionContentHash,
  computeSemanticDiff,
  createAnalysisPresetExperiment,
} from "../index";

describe("Phase 05.4.22 Distributed Architecture Trade-Offs, Bottleneck Diagnosis, Reliability & Decision Engine", () => {
  it("runs all 40 analysis presets deterministically with passing correctness invariants", () => {
    expect(ANALYSIS_PRESET_METADATA).toHaveLength(40);

    for (const meta of ANALYSIS_PRESET_METADATA) {
      const exp = createAnalysisPresetExperiment(meta.id);
      const { frames, finalState, trace } =
        ArchitectureAnalysisExecutionEngine.runExperiment(exp);

      expect(frames.length).toBeGreaterThan(0);
      expect(trace.events.length).toBeGreaterThan(0);
      expect(finalState.invariants.allPassed).toBe(true);
      expect(finalState.invariants.baselineImmutableOk).toBe(true);
      expect(finalState.invariants.candidateVersionedOk).toBe(true);
      expect(finalState.invariants.noFabricatedMetricsOk).toBe(true);
      expect(finalState.invariants.findingsHaveEvidenceOk).toBe(true);
      expect(finalState.invariants.recommendationsHaveEvidenceOk).toBe(true);
      expect(finalState.invariants.adrLinksValidOk).toBe(true);
      expect(finalState.adr.markdownText).toContain("## Evidence");
      expect(finalState.executiveReportMarkdown).toContain(
        "Architecture Analysis Report"
      );
    }
  });

  it("preserves baseline revision immutability and computes accurate semantic diffs", () => {
    const exp = createAnalysisPresetExperiment("ana_cache_vs_no_cache");
    const baseHashBefore = computeRevisionContentHash(exp.baselineRevision);
    const cloned = cloneRevisionImmutable(
      exp.baselineRevision,
      "rev_custom_cand",
      "Cloned Candidate"
    );

    expect(cloned.revisionId).toBe("rev_custom_cand");
    expect(cloned.parentRevisionId).toBe(exp.baselineRevision.revisionId);
    expect(computeRevisionContentHash(exp.baselineRevision)).toBe(baseHashBefore);

    const diff = computeSemanticDiff(exp.baselineRevision, exp.candidateRevision);
    expect(diff.addedComponents).toContain("redis-cache");
    expect(diff.modifiedComponents.some((m) => m.componentId === "orders-db")).toBe(
      true
    );
  });

  it("refuses to apply independent parallel reliability formulas when shared SPOFs/single-AZ exist", () => {
    const exp = createAnalysisPresetExperiment("ana_az_outage");
    const { finalState } = ArchitectureAnalysisExecutionEngine.runExperiment(exp);

    expect(finalState.baselineMetrics.availabilityAssumptionsHeld).toBe(false);
    expect(finalState.baselineMetrics.analyticalAvailability).toBeNull();
    expect(finalState.spofs.length).toBeGreaterThan(0);
    expect(finalState.candidateMetrics.simulatedAvailability).toBeGreaterThan(
      finalState.baselineMetrics.simulatedAvailability
    );
  });

  it("diagnoses bottleneck relief, hard constraint failures without score masking, and toggleable composite scoring", () => {
    const rpoExp = createAnalysisPresetExperiment("ana_sync_vs_async_replication");
    rpoExp.scoringEnabled = false;
    const rpoRes = ArchitectureAnalysisExecutionEngine.runExperiment(rpoExp);

    expect(rpoRes.finalState.scorecard.scoringEnabled).toBe(false);
    expect(rpoRes.finalState.scorecard.baselineComposite).toBeNull();
    expect(rpoRes.finalState.scorecard.candidateComposite).toBeNull();
    expect(
      rpoRes.finalState.baselineConstraintChecks.some((c) => !c.passed)
    ).toBe(true);
    expect(rpoRes.finalState.scorecard.baselineConstraintsPassed).toBe(false);
    expect(rpoRes.finalState.scorecard.candidateConstraintsPassed).toBe(true);
  });

  it("supports multi-seed statistical summaries and identical deterministic replay", () => {
    const adrExp = createAnalysisPresetExperiment("ana_architecture_decision_record");
    const run1 = ArchitectureAnalysisExecutionEngine.runExperiment(adrExp);
    const run2 = ArchitectureAnalysisExecutionEngine.runExperiment(adrExp);

    expect(run1.finalState.statisticalSummary).toBeDefined();
    expect(run1.finalState.statisticalSummary?.seedCount).toBe(4);
    expect(run1.finalState.candidateMetrics).toEqual(
      run2.finalState.candidateMetrics
    );
    expect(run1.finalState.adr.markdownText).toBe(run2.finalState.adr.markdownText);
  });
});

