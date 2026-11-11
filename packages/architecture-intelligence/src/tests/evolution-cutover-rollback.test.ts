import { describe, it, expect } from "vitest";
import { CutoverReadinessAnalyzer } from "../evolution/analysis/cutover-readiness-analyzer";
import { RollbackFeasibilityAnalyzer } from "../evolution/analysis/rollback-feasibility-analyzer";
import { WavePlanner } from "../evolution/planning/wave-planner";
import { RequirementExtractor } from "../evolution/planning/requirement-extractor";
import type { ArchitectureSnapshot } from "../comparison/contracts/comparison.types";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";

describe("Phase 05.3.26 — Cutover Planning & Rollback Feasibility Analyzer", () => {
  const sourceSnapshot: ArchitectureSnapshot = {
    id: "snap-cutover-source",
    title: "Cutover Source Snapshot",
    schemaVersion: 1,
    provenance: "current-draft",
    revision: "rev-source",
    createdAt: new Date().toISOString(),
    nodes: [
      { id: "monolith", type: "custom", position: { x: 0, y: 0 }, data: { label: "Monolith", nodeType: "service" } } as BaseNode,
    ],
    edges: [],
    metadata: { environment: "prod", version: "1.0.0" },
  };

  const targetSnapshot: ArchitectureSnapshot = {
    id: "snap-cutover-target",
    title: "Cutover Target Snapshot",
    schemaVersion: 1,
    provenance: "what-if-proposal",
    revision: "rev-target",
    createdAt: new Date().toISOString(),
    nodes: [
      { id: "gw", type: "custom", position: { x: 0, y: 0 }, data: { label: "API Gateway", nodeType: "gateway" } } as BaseNode,
      { id: "svc-1", type: "custom", position: { x: 100, y: 0 }, data: { label: "Service 1", nodeType: "service" } } as BaseNode,
    ],
    edges: [{ id: "e1", source: "gw", target: "svc-1", type: "smoothstep", data: {} } as unknown as BaseEdge],
    metadata: { environment: "prod-cloud", version: "2.0.0" },
  };

  it("plans 4-step progressive traffic cutover with automated rollback triggers", () => {
    const requirements = RequirementExtractor.extractRequirements(sourceSnapshot, targetSnapshot, "p-cutover");
    const plan = WavePlanner.planWaves(requirements, "strangler_fig", "p-cutover");

    const assessment = CutoverReadinessAnalyzer.planCutover(plan.waves, plan.gates, "p-cutover");

    expect(assessment.isReadyForCutover).toBe(true);
    expect(assessment.blockingReasons).toHaveLength(0);
    expect(assessment.recommendedCutoverType).toBe("weighted_shift");
    expect(assessment.plans).toHaveLength(1);

    const cutoverPlan = assessment.plans[0];
    expect(cutoverPlan.steps).toHaveLength(4);
    expect(cutoverPlan.steps[0].weightPercent).toBe(5);
    expect(cutoverPlan.steps[1].weightPercent).toBe(25);
    expect(cutoverPlan.steps[2].weightPercent).toBe(50);
    expect(cutoverPlan.steps[3].weightPercent).toBe(100);

    expect(cutoverPlan.rollbackTriggers.length).toBeGreaterThan(0);
    expect(cutoverPlan.rollbackTriggers.some((t) => t.includes("error rate"))).toBe(true);
  });

  it("blocks cutover when a prerequisite verification gate fails", () => {
    const requirements = RequirementExtractor.extractRequirements(sourceSnapshot, targetSnapshot, "p-block");
    const plan = WavePlanner.planWaves(requirements, "strangler_fig", "p-block");

    // Force gate failure
    const failedGate = plan.gates.find((g) => g.waveId?.includes("wave-2"));
    if (failedGate) {
      failedGate.status = "failed";
      failedGate.evaluationNotes = "Data reconciliation detected 142 missing records.";
    }

    const assessment = CutoverReadinessAnalyzer.planCutover(plan.waves, plan.gates, "p-block");

    expect(assessment.isReadyForCutover).toBe(false);
    expect(assessment.blockingReasons.length).toBeGreaterThan(0);
    expect(assessment.blockingReasons[0]).toContain("Blocking Gate Failed");
  });

  it("correctly identifies points of no return and irreversible waves", () => {
    const requirements = RequirementExtractor.extractRequirements(sourceSnapshot, targetSnapshot, "p-rollback");
    const plan = WavePlanner.planWaves(requirements, "strangler_fig", "p-rollback");

    const rollbackPlans = RollbackFeasibilityAnalyzer.analyzeRollbackPlans(plan.waves, plan.tasks);

    expect(rollbackPlans).toHaveLength(5);

    // Waves 1 to 4 should be fully reversible
    expect(rollbackPlans[0].feasibilityStatus).toBe("fully_reversible");
    expect(rollbackPlans[0].isFeasible).toBe(true);

    expect(rollbackPlans[1].feasibilityStatus).toBe("fully_reversible");
    expect(rollbackPlans[2].feasibilityStatus).toBe("fully_reversible");
    expect(rollbackPlans[3].feasibilityStatus).toBe("fully_reversible");

    // Wave 5 has irreversible decommissioning tasks (point of no return)
    const wave5Plan = rollbackPlans[4];
    expect(wave5Plan.feasibilityStatus).toBe("irreversible");
    expect(wave5Plan.isFeasible).toBe(false);
    expect(wave5Plan.pointOfNoReturnWarning).toContain("point of no return");
  });
});
