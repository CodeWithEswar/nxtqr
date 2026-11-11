import type {
  UnifiedRecommendation,
  TradeoffEvaluation,
} from "../contracts/recommendations.types";

export class TradeoffAnalyzer {
  public static calculateNetBenefit(rec: UnifiedRecommendation): {
    netScore: number;
    positives: string[];
    risks: string[];
  } {
    const details = rec.tradeoffDetails;
    let score = 0;
    const positives: string[] = [];
    const risks: string[] = [];

    const dimensions: (keyof Pick<TradeoffEvaluation, "reliability" | "performance" | "scalability" | "security" | "dataConsistency">)[] = [
      "reliability",
      "performance",
      "scalability",
      "security",
      "dataConsistency",
    ];

    for (const dim of dimensions) {
      if (details[dim] === "positive") {
        score += 20;
        positives.push(`Enhances ${dim}`);
      } else if (details[dim] === "negative") {
        score -= 15;
        risks.push(`Trade-off in ${dim}`);
      }
    }

    if (details.operationalComplexity === "low") score += 10;
    else if (details.operationalComplexity === "high") {
      score -= 15;
      risks.push("High operational maintenance complexity");
    }

    if (details.costDirection === "decrease") score += 10;
    else if (details.costDirection === "increase") {
      score -= 10;
      risks.push("Increases hosting infrastructure costs");
    }

    return {
      netScore: Math.max(0, Math.min(100, score)),
      positives,
      risks,
    };
  }
}
