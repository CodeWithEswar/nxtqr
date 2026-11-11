import type { PricingCatalog } from "../contracts/pricing.types";
import type { CostLineItem, CostEstimateStatus } from "../contracts/cost.types";
import type { MappedBillableResource } from "../models/resource-mapper";
import { TieredPricingEvaluator } from "../pricing/tiered-pricing";

export interface CalculationResult {
  lineItems: CostLineItem[];
  status: CostEstimateStatus;
  unpricedCount: number;
  totalCount: number;
}

export class CostCalculator {
  public static calculateLineItems(
    resources: MappedBillableResource[],
    catalog: PricingCatalog
  ): CostLineItem[] {
    return CostCalculator.calculate(resources, catalog).lineItems;
  }

  public static calculate(
    resources: MappedBillableResource[],
    catalog: PricingCatalog
  ): CalculationResult {
    let unpricedCount = 0;
    const lineItems: CostLineItem[] = [];

    resources.forEach((resource, idx) => {
      const rate = catalog.rates[resource.suggestedSkuId];

      if (!rate) {
        unpricedCount++;
        lineItems.push({
          id: `line-${idx + 1}-${resource.nodeId}`,
          nodeId: resource.nodeId,
          nodeLabel: resource.nodeLabel,
          subsystem: resource.subsystem,
          category: resource.category,
          resourceName: resource.resourceName,
          skuId: resource.suggestedSkuId,
          quantity: resource.quantity,
          unit: resource.unit,
          unitPrice: "0.00",
          extendedMonthlyCost: "0.00",
          isUnpriced: true,
          pricingSource: "estimated",
          isShared: resource.isShared,
          allocationPercentage: resource.allocationPercentage,
          assumptions: [...resource.assumptions, `Unpriced: SKU '${resource.suggestedSkuId}' not found in active catalog`],
        });
        return;
      }

      // Calculate cost via tiered pricing evaluator
      const extended = TieredPricingEvaluator.calculateCost(rate, resource.quantity);

      lineItems.push({
        id: `line-${idx + 1}-${resource.nodeId}`,
        nodeId: resource.nodeId,
        nodeLabel: resource.nodeLabel,
        subsystem: resource.subsystem,
        category: resource.category,
        resourceName: resource.resourceName,
        skuId: resource.suggestedSkuId,
        quantity: resource.quantity,
        unit: resource.unit,
        unitPrice: rate.unitPrice,
        extendedMonthlyCost: extended,
        isUnpriced: false,
        pricingSource: rate.source,
        isShared: resource.isShared,
        allocationPercentage: resource.allocationPercentage,
        assumptions: resource.assumptions,
      });
    });

    const totalCount = resources.length;
    let status: CostEstimateStatus = "complete";
    if (unpricedCount === totalCount && totalCount > 0) {
      status = "unavailable";
    } else if (unpricedCount > 0) {
      status = "partial";
    }

    return {
      lineItems,
      status,
      unpricedCount,
      totalCount,
    };
  }
}

