import type { CostEstimate, CostComparisonResult, CostLineItem } from "../contracts/cost.types";
import { DecimalMoney } from "../pricing/decimal-money";

export class CostScenarioComparator {
  /**
   * Performs an exact, side-by-side differential cost comparison between two architecture revisions.
   */
  public static compare(
    baselineEstimate: CostEstimate,
    candidateEstimate: CostEstimate
  ): CostComparisonResult {
    const baseTotal = baselineEstimate.totalMonthlyCost;
    const candTotal = candidateEstimate.totalMonthlyCost;

    const netSavings = DecimalMoney.subtract(baseTotal, candTotal);
    const baseNum = Number(baseTotal);
    const candNum = Number(candTotal);

    let percentageDiff = 0;
    if (baseNum > 0) {
      percentageDiff = Math.round(((candNum - baseNum) / baseNum) * 1000) / 10;
    }

    // Line item matching
    const baseItemMap = new Map<string, CostLineItem>(
      baselineEstimate.lineItems.map((item) => [`${item.nodeId}:${item.category}:${item.resourceName}`, item])
    );
    const candItemMap = new Map<string, CostLineItem>(
      candidateEstimate.lineItems.map((item) => [`${item.nodeId}:${item.category}:${item.resourceName}`, item])
    );

    const addedLineItems: CostLineItem[] = [];
    const removedLineItems: CostLineItem[] = [];
    const modifiedLineItems: CostComparisonResult["modifiedLineItems"] = [];

    // Find added and modified
    for (const [key, candItem] of candItemMap.entries()) {
      const baseItem = baseItemMap.get(key);
      if (!baseItem) {
        addedLineItems.push(candItem);
      } else if (baseItem.extendedMonthlyCost !== candItem.extendedMonthlyCost) {
        const diff = DecimalMoney.subtract(candItem.extendedMonthlyCost, baseItem.extendedMonthlyCost);
        modifiedLineItems.push({
          nodeId: candItem.nodeId,
          nodeLabel: candItem.nodeLabel,
          category: candItem.category,
          baselineCost: baseItem.extendedMonthlyCost,
          candidateCost: candItem.extendedMonthlyCost,
          difference: diff,
        });
      }
    }

    // Find removed
    for (const [key, baseItem] of baseItemMap.entries()) {
      if (!candItemMap.has(key)) {
        removedLineItems.push(baseItem);
      }
    }

    // Synthesize trade-offs
    const reliabilityTradeoffs: string[] = [];
    const performanceTradeoffs: string[] = [];
    const securityTradeoffs: string[] = [];

    if (candNum < baseNum) {
      reliabilityTradeoffs.push("Verify that reduced instance pools still satisfy high availability SLA during zonal maintenance.");
      performanceTradeoffs.push("Check that throughput headroom remains above 20% under burst peak traffic.");
    } else if (candNum > baseNum) {
      reliabilityTradeoffs.push("Higher redundancy and multi-AZ deployment improve fault isolation and recovery speed.");
      performanceTradeoffs.push("Enhanced instance capacity eliminates compute bottlenecks under high concurrency.");
    }

    return {
      baselineRevision: baselineEstimate.graphRevision,
      candidateRevision: candidateEstimate.graphRevision,
      baselineMonthlyCost: baseTotal,
      candidateMonthlyCost: candTotal,
      netMonthlySavings: netSavings,
      percentageDifference: percentageDiff,
      addedLineItems,
      removedLineItems,
      modifiedLineItems,
      reliabilityTradeoffs,
      performanceTradeoffs,
      securityTradeoffs,
    };
  }
}

