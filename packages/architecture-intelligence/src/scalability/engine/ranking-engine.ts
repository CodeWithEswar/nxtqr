import type { ScalabilityRecommendation } from "../schemas/scalability.schemas";

export class RecommendationRankingEngine {
  public static rank(recommendations: ScalabilityRecommendation[]): ScalabilityRecommendation[] {
    const scored = recommendations.map((rec) => {
      let score = rec.rankScore || 50;

      // Feasibility factor
      if (rec.feasibility === "applicable") score += 20;
      else if (rec.feasibility === "conditional") score += 5;
      else if (rec.feasibility === "insufficient-evidence") score -= 15;
      else if (rec.feasibility === "not-applicable") score -= 30;

      // Implementation complexity
      if (rec.tradeoffs.implementationComplexity === "low") score += 10;
      else if (rec.tradeoffs.implementationComplexity === "high") score -= 10;

      // Operational complexity
      if (rec.tradeoffs.operationalComplexity === "low") score += 5;
      else if (rec.tradeoffs.operationalComplexity === "high") score -= 5;

      // Confidence
      if (rec.confidence === "high") score += 10;
      else if (rec.confidence === "low") score -= 10;

      return {
        ...rec,
        rankScore: Math.max(0, Math.min(100, score)),
      };
    });

    // Deterministic sort: highest rankScore first, tie-break by ID
    scored.sort((a, b) => {
      if (b.rankScore !== a.rankScore) {
        return b.rankScore - a.rankScore;
      }
      return a.id.localeCompare(b.id);
    });

    return scored;
  }
}
