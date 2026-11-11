import type {
  CostLineItem,
  CostEstimate,
  CostEstimateStatus,
  BillableResourceCategory,
  CategoryCostSummary,
  SubsystemCostSummary,
} from "../contracts/cost.types";
import type { PricingCatalog, BillingPeriod } from "../contracts/pricing.types";
import { DecimalMoney } from "../pricing/decimal-money";

export interface AggregationResult {
  totalMonthlyCost: string;
  totalAnnualCost: string;
  categorySummaries: Record<BillableResourceCategory, CategoryCostSummary>;
  subsystemSummaries: Record<string, SubsystemCostSummary>;
  fixedMonthlyCost: string;
  variableMonthlyCost: string;
}

export class CostAggregator {
  private static readonly ALL_CATEGORIES: BillableResourceCategory[] = [
    "compute",
    "database",
    "cache",
    "storage",
    "network",
    "serverless",
    "messaging",
    "observability",
    "external_api",
    "other",
  ];

  public static buildEstimate(
    id: string,
    architectureId: string,
    graphRevision: string,
    catalog: PricingCatalog,
    billingPeriod: BillingPeriod,
    lineItems: CostLineItem[]
  ): CostEstimate {
    const agg = CostAggregator.aggregate(lineItems);
    const unpricedCount = lineItems.filter((i) => i.isUnpriced).length;
    const status: CostEstimateStatus =
      unpricedCount === 0 ? "complete" : unpricedCount === lineItems.length ? "unavailable" : "partial";

    return {
      id,
      architectureId,
      graphRevision,
      providerId: catalog.providerId,
      currency: catalog.currency,
      billingPeriod,
      status,
      totalMonthlyCost: agg.totalMonthlyCost,
      totalAnnualCost: agg.totalAnnualCost,
      lineItems,
      categorySummaries: agg.categorySummaries,
      subsystemSummaries: agg.subsystemSummaries,
      unpricedResourcesCount: unpricedCount,
      totalResourcesCount: lineItems.length,
      fixedMonthlyCost: agg.fixedMonthlyCost,
      variableMonthlyCost: agg.variableMonthlyCost,
      assumptions: [],
      calculatedAt: new Date().toISOString(),
    };
  }

  public static aggregate(lineItems: CostLineItem[]): AggregationResult {
    let grandTotal = "0.00";
    let fixedTotal = "0.00";
    let variableTotal = "0.00";

    const catTotals: Record<BillableResourceCategory, { total: string; count: number; unpriced: number }> = {
      compute: { total: "0.00", count: 0, unpriced: 0 },
      database: { total: "0.00", count: 0, unpriced: 0 },
      cache: { total: "0.00", count: 0, unpriced: 0 },
      storage: { total: "0.00", count: 0, unpriced: 0 },
      network: { total: "0.00", count: 0, unpriced: 0 },
      serverless: { total: "0.00", count: 0, unpriced: 0 },
      messaging: { total: "0.00", count: 0, unpriced: 0 },
      observability: { total: "0.00", count: 0, unpriced: 0 },
      external_api: { total: "0.00", count: 0, unpriced: 0 },
      other: { total: "0.00", count: 0, unpriced: 0 },
    };

    const subTotals: Record<string, { total: string; nodes: Set<string> }> = {};

    for (const item of lineItems) {
      const cost = item.extendedMonthlyCost;
      grandTotal = DecimalMoney.add(grandTotal, cost);

      // Categorize fixed vs variable
      if (item.category === "compute" || item.category === "database" || item.category === "cache") {
        fixedTotal = DecimalMoney.add(fixedTotal, cost);
      } else {
        variableTotal = DecimalMoney.add(variableTotal, cost);
      }

      // Category breakdown
      const cat = catTotals[item.category] || catTotals.other;
      cat.total = DecimalMoney.add(cat.total, cost);
      cat.count++;
      if (item.isUnpriced) cat.unpriced++;

      // Subsystem breakdown
      const sub = item.subsystem || "default";
      if (!subTotals[sub]) {
        subTotals[sub] = { total: "0.00", nodes: new Set() };
      }
      subTotals[sub].total = DecimalMoney.add(subTotals[sub].total, cost);
      subTotals[sub].nodes.add(item.nodeId);
    }

    const grandTotalNum = Number(grandTotal);

    // Build Category Summaries
    const categorySummaries: Record<BillableResourceCategory, CategoryCostSummary> = {} as Record<
      BillableResourceCategory,
      CategoryCostSummary
    >;

    for (const cat of CostAggregator.ALL_CATEGORIES) {
      const data = catTotals[cat];
      const catNum = Number(data.total);
      categorySummaries[cat] = {
        category: cat,
        monthlyCost: data.total,
        percentageOfTotal: grandTotalNum > 0 ? Math.round((catNum / grandTotalNum) * 1000) / 10 : 0,
        lineItemCount: data.count,
        unpricedCount: data.unpriced,
      };
    }

    // Build Subsystem Summaries
    const subsystemSummaries: Record<string, SubsystemCostSummary> = {};
    for (const [sub, data] of Object.entries(subTotals)) {
      const subNum = Number(data.total);
      subsystemSummaries[sub] = {
        subsystem: sub,
        monthlyCost: data.total,
        percentageOfTotal: grandTotalNum > 0 ? Math.round((subNum / grandTotalNum) * 1000) / 10 : 0,
        nodeCount: data.nodes.size,
      };
    }

    const totalAnnualCost = DecimalMoney.multiply(grandTotal, 12);

    return {
      totalMonthlyCost: grandTotal,
      totalAnnualCost,
      categorySummaries,
      subsystemSummaries,
      fixedMonthlyCost: fixedTotal,
      variableMonthlyCost: variableTotal,
    };
  }
}

