import { describe, it, expect } from "vitest";
import { calculateGrade, calculateDimensionScore, calculateOverallAssessment } from "../scoring/score-calculator";
import { DEFAULT_SCORING_POLICY } from "../scoring/scoring-policy";
import type { HealthFinding, DimensionAssessment } from "../contracts/health.types";

describe("Health Scoring Model", () => {
  it("converts numerical scores to letter grades correctly", () => {
    expect(calculateGrade(95)).toBe("A");
    expect(calculateGrade(85)).toBe("B");
    expect(calculateGrade(72)).toBe("C");
    expect(calculateGrade(64)).toBe("D");
    expect(calculateGrade(40)).toBe("F");
    expect(calculateGrade(null)).toBe("N/A");
  });

  it("returns insufficient-evidence when evidenceCount is below threshold", () => {
    const assessment = calculateDimensionScore(
      "reliability",
      [],
      0, // 0 components
      [],
      "",
      DEFAULT_SCORING_POLICY
    );

    expect(assessment.status).toBe("insufficient-evidence");
    expect(assessment.score).toBeNull();
    expect(assessment.grade).toBe("N/A");
  });

  it("applies severity deductions and respects maxDeductionPerRule cap", () => {
    const findings: HealthFinding[] = [
      {
        id: "f1",
        ruleId: "REL-SPOF-001",
        dimension: "reliability",
        severity: "high", // 15 points
        title: "SPOF 1",
        explanation: "",
        evidence: [],
        affectedNodeIds: ["n1"],
        affectedEdgeIds: [],
        assumptions: [],
        confidence: "high",
        recommendationIds: [],
      },
      {
        id: "f2",
        ruleId: "REL-SPOF-001",
        dimension: "reliability",
        severity: "high", // 15 points (total for rule = 30)
        title: "SPOF 2",
        explanation: "",
        evidence: [],
        affectedNodeIds: ["n2"],
        affectedEdgeIds: [],
        assumptions: [],
        confidence: "high",
        recommendationIds: [],
      },
      {
        id: "f3",
        ruleId: "REL-SPOF-001",
        dimension: "reliability",
        severity: "high", // 15 points (should be capped at 30 max per rule)
        title: "SPOF 3",
        explanation: "",
        evidence: [],
        affectedNodeIds: ["n3"],
        affectedEdgeIds: [],
        assumptions: [],
        confidence: "high",
        recommendationIds: [],
      },
    ];

    const assessment = calculateDimensionScore(
      "reliability",
      findings,
      5,
      [],
      "Assessment summary",
      DEFAULT_SCORING_POLICY
    );

    expect(assessment.status).toBe("assessed");
    // 100 - 30 = 70
    expect(assessment.score).toBe(70);
    expect(assessment.grade).toBe("C");
    expect(assessment.deductions.length).toBe(1);
    expect(assessment.deductions[0].points).toBe(30);
  });

  it("calculates weighted overall assessment", () => {
    const dummy = (score: number): DimensionAssessment => ({
      dimension: "reliability",
      status: "assessed",
      score,
      grade: calculateGrade(score),
      findings: [],
      findingsCount: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
      evidenceCoveragePercent: 100,
      summary: "",
      assumptionsEvaluated: [],
      deductions: [],
    });

    const dimensions = {
      reliability: dummy(90),
      security: dummy(90),
      scalability: dummy(90),
      performance: dummy(90),
      maintainability: dummy(90),
      operations: dummy(90),
    };

    const overall = calculateOverallAssessment(dimensions, DEFAULT_SCORING_POLICY);
    expect(overall.status).toBe("assessed");
    expect(overall.overallScore).toBe(90);
    expect(overall.overallGrade).toBe("A");
  });
});

