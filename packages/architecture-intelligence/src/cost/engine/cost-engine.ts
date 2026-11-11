import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  CostEstimate,
  CostOptimizationOpportunity,
  CostForecastIntervalPoint,
  CostComparisonResult,
} from "../contracts/cost.types";
import type { CloudProviderId, PricingCatalog, BillingPeriod } from "../contracts/pricing.types";
import type { CapacityForecastScenario } from "../../capacity-planning/contracts/capacity.types";
import { DEFAULT_CAPACITY_SCENARIOS } from "../../capacity-planning/scenarios/capacity-scenarios";
import { DEFAULT_PRICING_CATALOGS } from "../pricing/default-catalogs";
import { ResourceMapper } from "../models/resource-mapper";
import { CostCalculator } from "./cost-calculator";
import { CostAggregator } from "./cost-aggregator";
import { CostOptimizationEngine } from "./optimization-engine";
import { CostForecaster } from "./cost-forecaster";
import { CostScenarioComparator } from "./scenario-comparator";

export interface CostEstimationOptions {
  providerId?: CloudProviderId;
  customCatalog?: PricingCatalog;
  billingPeriod?: BillingPeriod;
  currency?: string;
  graphRevision?: string;
  architectureId?: string;
}

export class ArchitectureCostEngine {
  private cache = new Map<string, CostEstimate>();

  /**
   * Generates a deterministic, decimal-safe infrastructure cost estimate
   * for the given architecture topology and cloud pricing catalog.
   */
  public estimateCost(
    nodes: BaseNode[],
    edges: BaseEdge[],
    options?: CostEstimationOptions
  ): CostEstimate {
    const providerId = options?.providerId || "aws";
    const catalog = options?.customCatalog || DEFAULT_PRICING_CATALOGS[providerId] || DEFAULT_PRICING_CATALOGS.aws;
    const billingPeriod = options?.billingPeriod || "monthly";
    const currency = options?.currency || catalog.currency || "USD";
    const graphRevision = options?.graphRevision || `rev_${nodes.length}_${edges.length}`;
    const architectureId = options?.architectureId || "current_arch";

    const cacheKey = this.computeCacheKey(nodes, edges, providerId, catalog.version, graphRevision);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // 1. Map nodes to billable resource items
    const billableResources = nodes.flatMap((node) => ResourceMapper.mapNodeToResources(node));

    // 2. Calculate line item costs using tiered pricing engine
    const { lineItems, status, unpricedCount, totalCount } = CostCalculator.calculate(
      billableResources,
      catalog
    );

    // 3. Aggregate totals, categories, subsystems, and fixed/variable breakdown
    const aggregation = CostAggregator.aggregate(lineItems);

    const assumptions: string[] = [
      `Pricing based on ${catalog.name} (Catalog v${catalog.version}).`,
      `Operating schedule assumed at 730 active instance-hours per month.`,
      `Internet egress traffic estimated based on ingress gateway throughput profile.`,
      `Database storage calculated at GP3 SSD standard baseline rates.`,
      `Modeled costs do not reflect contractual volume enterprise discounts or reserved instances unless explicitly configured.`,
    ];

    const estimate: CostEstimate = {
      id: `est_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      architectureId,
      graphRevision,
      providerId,
      currency,
      billingPeriod,
      status,
      totalMonthlyCost: aggregation.totalMonthlyCost,
      totalAnnualCost: aggregation.totalAnnualCost,
      lineItems,
      categorySummaries: aggregation.categorySummaries,
      subsystemSummaries: aggregation.subsystemSummaries,
      unpricedResourcesCount: unpricedCount,
      totalResourcesCount: totalCount,
      fixedMonthlyCost: aggregation.fixedMonthlyCost,
      variableMonthlyCost: aggregation.variableMonthlyCost,
      assumptions,
      calculatedAt: new Date().toISOString(),
    };

    // Cache management (bounded LRU to 20 estimates)
    if (this.cache.size > 20) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(cacheKey, estimate);

    return estimate;
  }

  /**
   * Generates architecture-aware cost optimization opportunities with trade-off analysis.
   */
  public getOptimizationOpportunities(
    nodes: BaseNode[],
    estimate: CostEstimate
  ): CostOptimizationOpportunity[] {
    return CostOptimizationEngine.analyze(nodes, estimate.lineItems, estimate.totalMonthlyCost);
  }

  /**
   * Projects future cost trajectories over a workload growth horizon.
   */
  public forecastCost(
    nodes: BaseNode[],
    estimate: CostEstimate,
    scenario: CapacityForecastScenario = DEFAULT_CAPACITY_SCENARIOS.rapid_startup_growth
  ): CostForecastIntervalPoint[] {
    return CostForecaster.forecast(nodes, estimate, scenario);
  }

  /**
   * Compares baseline architecture against candidate architecture for side-by-side cost delta analysis.
   */
  public compareCost(
    baselineEstimate: CostEstimate,
    candidateEstimate: CostEstimate
  ): CostComparisonResult {
    return CostScenarioComparator.compare(baselineEstimate, candidateEstimate);
  }

  private computeCacheKey(
    nodes: BaseNode[],
    edges: BaseEdge[],
    providerId: string,
    catalogVersion: number,
    graphRevision: string
  ): string {
    const nodeState = nodes.map((n) => `${n.id}:${n.data?.replicas || 1}:${n.data?.pricingSku || ""}`).join(";");
    const raw = `${nodes.length}_${edges.length}_${providerId}_${catalogVersion}_${graphRevision}_${nodeState}`;
    let hash = 0;
    for (let i = 0; i < raw.length; i++) {
      hash = (hash << 5) - hash + raw.charCodeAt(i);
      hash |= 0;
    }
    return `cost_${Math.abs(hash).toString(36)}`;
  }
}

export const architectureCostEngine = new ArchitectureCostEngine();

