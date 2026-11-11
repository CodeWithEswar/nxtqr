import type {
  UnifiedRecommendation,
  RecommendationPriority,
} from "../contracts/recommendations.types";

export class RankingEngine {
  public static rankRecommendations(
    recommendations: UnifiedRecommendation[]
  ): UnifiedRecommendation[] {
    const scored = recommendations.map((rec) => {
      let rawScore = 0;

      // 1. Priority Base
      switch (rec.priority) {
        case "critical":
          rawScore += 70;
          break;
        case "high":
          rawScore += 50;
          break;
        case "medium":
          rawScore += 30;
          break;
        case "low":
          rawScore += 15;
          break;
      }

      // 2. Multi-engine convergence bonus (Cross-Engine Validation)
      if (rec.sourceEngines.length >= 3) rawScore += 15;
      else if (rec.sourceEngines.length === 2) rawScore += 10;

      // 3. Evidence count
      rawScore += Math.min(10, rec.evidence.length * 2);

      // 4. Confidence modifier
      if (rec.confidence === "high") rawScore += 5;
      else if (rec.confidence === "low") rawScore -= 5;

      // 5. Feasibility Multiplier
      let feasibilityMultiplier = 1.0;
      if (rec.feasibility === "conditional") feasibilityMultiplier = 0.75;
      else if (rec.feasibility === "insufficient-evidence") feasibilityMultiplier = 0.4;
      else if (rec.feasibility === "not-applicable") feasibilityMultiplier = 0.0;

      const finalScore = Math.round(Math.min(100, Math.max(0, rawScore * feasibilityMultiplier)));

      // Determine updated priority based on final score
      let priority: RecommendationPriority = rec.priority;
      if (finalScore >= 80) priority = "critical";
      else if (finalScore >= 60) priority = "high";
      else if (finalScore >= 35) priority = "medium";
      else priority = "low";

      return {
        ...rec,
        score: finalScore,
        priority,
      };
    });

    // Sort descending by score, then by sourceEngines count
    return scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return b.sourceEngines.length - a.sourceEngines.length;
    });
  }
}
