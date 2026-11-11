import type { CloudProviderId, BillingPeriod, PricingSourceType, BillingUnit } from "./pricing.types";
import type { TradeoffEvaluation } from "../../recommendations/contracts/recommendations.types";

export type BillableResourceCategory =
  | "compute"
  | "database"
  | "cache"
  | "storage"
  | "network"
  | "serverless"
  | "messaging"
  | "observability"
  | "external_api"
  | "other";

export type CostEstimateStatus = "complete" | "partial" | "unavailable";

export interface CostLineItem {
  id: string;
  nodeId: string;
  nodeLabel: string;
  subsystem?: string;
  category: BillableResourceCategory;
  resourceName: string;
  skuId?: string;
  quantity: number;
  unit: BillingUnit;
  unitPrice: string; // Decimal string e.g. "0.048"
  extendedMonthlyCost: string; // Decimal string e.g. "34.56"
  isUnpriced: boolean;
  pricingSource: PricingSourceType;
  isShared: boolean;
  allocationPercentage?: number;
  assumptions: string[];
}

export interface CategoryCostSummary {
  category: BillableResourceCategory;
  monthlyCost: string; // Decimal string
  percentageOfTotal: number;
  lineItemCount: number;
  unpricedCount: number;
}

export interface SubsystemCostSummary {
  subsystem: string;
  monthlyCost: string;
  percentageOfTotal: number;
  nodeCount: number;
}

export interface CostEstimate {
  id: string;
  architectureId: string;
  graphRevision: string;
  providerId: CloudProviderId;
  currency: string; // ISO 4217, default "USD"
  billingPeriod: BillingPeriod;
  status: CostEstimateStatus;
  totalMonthlyCost: string; // Decimal string of known items
  totalAnnualCost: string; // Decimal string (totalMonthlyCost * 12)
  lineItems: CostLineItem[];
  categorySummaries: Record<BillableResourceCategory, CategoryCostSummary>;
  subsystemSummaries: Record<string, SubsystemCostSummary>;
  unpricedResourcesCount: number;
  totalResourcesCount: number;
  fixedMonthlyCost: string;
  variableMonthlyCost: string;
  assumptions: string[];
  calculatedAt: string;
}

export interface CostOptimizationOpportunity {
  id: string;
  strategyId: string;
  title: string;
  summary: string;
  affectedNodeIds: string[];
  category: BillableResourceCategory;
  estimatedMonthlySavings: string; // Decimal string
  estimatedSavingsPercentage: number;
  confidence: "high" | "medium" | "low";
  feasibility: "applicable" | "conditional" | "complex";
  prerequisites: string[];
  tradeoffs: string[];
  tradeoffDetails: TradeoffEvaluation;
  proposedOperations?: Array<{
    type: "adjust_instances" | "modify_node_data" | "replace_node";
    nodeId: string;
    changes: Record<string, unknown>;
  }>;
}

export interface CostForecastIntervalPoint {
  intervalIndex: number;
  intervalLabel: string; // "Now", "M1", "M2"
  projectedIngressRps: number;
  totalMonthlyCost: string;
  computeCost: string;
  databaseCost: string;
  cacheCost: string;
  networkCost: string;
  otherCost: string;
}

export interface CostComparisonResult {
  baselineRevision: string;
  candidateRevision: string;
  baselineMonthlyCost: string;
  candidateMonthlyCost: string;
  netMonthlySavings: string; // Can be negative if candidate is more expensive
  percentageDifference: number;
  addedLineItems: CostLineItem[];
  removedLineItems: CostLineItem[];
  modifiedLineItems: Array<{
    nodeId: string;
    nodeLabel: string;
    category: BillableResourceCategory;
    baselineCost: string;
    candidateCost: string;
    difference: string;
  }>;
  reliabilityTradeoffs: string[];
  performanceTradeoffs: string[];
  securityTradeoffs: string[];
}

