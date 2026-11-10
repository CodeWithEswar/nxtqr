import type {
  DimensionAssessment,
  HealthDimension,
  HealthFinding,
  HealthGrade,
  ScoringPolicy,
} from "../contracts/health.types";

export function calculateGrade(score: number | null): HealthGrade {
  if (score === null) return "N/A";
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function calculateDimensionScore(
  dimension: HealthDimension,
  findings: HealthFinding[],
  evidenceCount: number,
  assumptionsEvaluated: string[],
  summary: string,
  policy: ScoringPolicy
): DimensionAssessment {
  // Check for insufficient evidence
  if (evidenceCount < policy.minComponentsForScoring) {
    return {
      dimension,
      status: "insufficient-evidence",
      score: null,
      grade: "N/A",
      findings,
      findingsCount: {
        critical: findings.filter((f) => f.severity === "critical").length,
        high: findings.filter((f) => f.severity === "high").length,
        medium: findings.filter((f) => f.severity === "medium").length,
        low: findings.filter((f) => f.severity === "low").length,
        info: findings.filter((f) => f.severity === "info").length,
      },
      evidenceCoveragePercent: 0,
      summary: summary || "Insufficient diagram evidence to assess this dimension.",
      assumptionsEvaluated,
      deductions: [],
    };
  }

  // Calculate deductions per rule
  const ruleDeductions = new Map<string, { totalPoints: number; reason: string }>();

  for (const finding of findings) {
    const baseDeduction = finding.deductionWeight ?? policy.severityDeductions[finding.severity] ?? 0;
    const confidenceMultiplier = policy.confidenceMultipliers[finding.confidence] ?? 1.0;
    const finalPoints = Math.round(baseDeduction * confidenceMultiplier);

    const existing = ruleDeductions.get(finding.ruleId) || { totalPoints: 0, reason: finding.title };
    existing.totalPoints = Math.min(policy.maxDeductionPerRule, existing.totalPoints + finalPoints);
    existing.reason = finding.title;
    ruleDeductions.set(finding.ruleId, existing);
  }

  const deductions = Array.from(ruleDeductions.entries()).map(([ruleId, info]) => ({
    ruleId,
    points: info.totalPoints,
    reason: info.reason,
  }));

  const totalDeductions = deductions.reduce((sum, d) => sum + d.points, 0);
  const rawScore = Math.max(0, 100 - totalDeductions);

  return {
    dimension,
    status: "assessed",
    score: rawScore,
    grade: calculateGrade(rawScore),
    findings,
    findingsCount: {
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
      info: findings.filter((f) => f.severity === "info").length,
    },
    evidenceCoveragePercent: Math.min(100, Math.round((evidenceCount / Math.max(1, evidenceCount + findings.length)) * 100)),
    summary,
    assumptionsEvaluated,
    deductions,
  };
}

export function calculateOverallAssessment(
  dimensions: Record<HealthDimension, DimensionAssessment>,
  policy: ScoringPolicy
): {
  overallScore: number | null;
  overallGrade: HealthGrade;
  status: "assessed" | "insufficient-evidence" | "partial";
} {
  let weightedSum = 0;
  let activeWeightTotal = 0;
  let assessedCount = 0;

  for (const [dim, assessment] of Object.entries(dimensions) as [HealthDimension, DimensionAssessment][]) {
    if (assessment.status === "assessed" && assessment.score !== null) {
      const weight = policy.dimensionWeights[dim] ?? 0.16;
      weightedSum += assessment.score * weight;
      activeWeightTotal += weight;
      assessedCount++;
    }
  }

  if (assessedCount === 0 || activeWeightTotal === 0) {
    return {
      overallScore: null,
      overallGrade: "N/A",
      status: "insufficient-evidence",
    };
  }

  const overallScore = Math.round(weightedSum / activeWeightTotal);
  const overallGrade = calculateGrade(overallScore);
  const status = assessedCount === 6 ? "assessed" : "partial";

  return {
    overallScore,
    overallGrade,
    status,
  };
}
