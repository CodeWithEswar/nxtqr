import { z } from "zod";
import { CloudProviderIdSchema, BillingPeriodSchema, BillingUnitSchema, PricingSourceTypeSchema } from "./pricing.schemas";
import { ImpactDirectionSchema } from "../../recommendations/schemas/recommendations.schemas";

export const BillableResourceCategorySchema = z.enum([
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
]);

export const CostEstimateStatusSchema = z.enum(["complete", "partial", "unavailable"]);

export const CostLineItemSchema = z.object({
  id: z.string().min(1),
  nodeId: z.string().min(1),
  nodeLabel: z.string(),
  subsystem: z.string().optional(),
  category: BillableResourceCategorySchema,
  resourceName: z.string(),
  skuId: z.string().optional(),
  quantity: z.number().min(0),
  unit: BillingUnitSchema,
  unitPrice: z.string(),
  extendedMonthlyCost: z.string(),
  isUnpriced: z.boolean(),
  pricingSource: PricingSourceTypeSchema,
  isShared: z.boolean(),
  allocationPercentage: z.number().min(0).max(100).optional(),
  assumptions: z.array(z.string()),
});

export const CategoryCostSummarySchema = z.object({
  category: BillableResourceCategorySchema,
  monthlyCost: z.string(),
  percentageOfTotal: z.number().min(0).max(100),
  lineItemCount: z.number().int().min(0),
  unpricedCount: z.number().int().min(0),
});

export const SubsystemCostSummarySchema = z.object({
  subsystem: z.string(),
  monthlyCost: z.string(),
  percentageOfTotal: z.number().min(0).max(100),
  nodeCount: z.number().int().min(0),
});

export const CostEstimateSchema = z.object({
  id: z.string().min(1),
  architectureId: z.string().min(1),
  graphRevision: z.string(),
  providerId: CloudProviderIdSchema,
  currency: z.string().length(3),
  billingPeriod: BillingPeriodSchema,
  status: CostEstimateStatusSchema,
  totalMonthlyCost: z.string(),
  totalAnnualCost: z.string(),
  lineItems: z.array(CostLineItemSchema),
  categorySummaries: z.record(CategoryCostSummarySchema),
  subsystemSummaries: z.record(SubsystemCostSummarySchema),
  unpricedResourcesCount: z.number().int().min(0),
  totalResourcesCount: z.number().int().min(0),
  fixedMonthlyCost: z.string(),
  variableMonthlyCost: z.string(),
  assumptions: z.array(z.string()),
  calculatedAt: z.string(),
});

export const CostTradeoffEvaluationSchema = z.object({
  reliability: ImpactDirectionSchema,
  performance: ImpactDirectionSchema,
  scalability: ImpactDirectionSchema,
  security: ImpactDirectionSchema,
  dataConsistency: ImpactDirectionSchema,
  operationalComplexity: z.enum(["low", "medium", "high"]),
  costDirection: z.enum(["increase", "neutral", "decrease"]),
  reversibility: z.enum(["high", "medium", "low"]),
  tradeoffNotes: z.array(z.string()),
});

export const CostOptimizationOpportunitySchema = z.object({
  id: z.string().min(1),
  strategyId: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  affectedNodeIds: z.array(z.string()),
  category: BillableResourceCategorySchema,
  estimatedMonthlySavings: z.string(),
  estimatedSavingsPercentage: z.number().min(0).max(100),
  confidence: z.enum(["high", "medium", "low"]),
  feasibility: z.enum(["applicable", "conditional", "complex"]),
  prerequisites: z.array(z.string()),
  tradeoffs: z.array(z.string()),
  tradeoffDetails: CostTradeoffEvaluationSchema,
  proposedOperations: z
    .array(
      z.object({
        type: z.enum(["adjust_instances", "modify_node_data", "replace_node"]),
        nodeId: z.string(),
        changes: z.record(z.unknown()),
      })
    )
    .optional(),
});

export const CostForecastIntervalPointSchema = z.object({
  intervalIndex: z.number().int().min(0),
  intervalLabel: z.string(),
  projectedIngressRps: z.number().min(0),
  totalMonthlyCost: z.string(),
  computeCost: z.string(),
  databaseCost: z.string(),
  cacheCost: z.string(),
  networkCost: z.string(),
  otherCost: z.string(),
});

export const CostComparisonResultSchema = z.object({
  baselineRevision: z.string(),
  candidateRevision: z.string(),
  baselineMonthlyCost: z.string(),
  candidateMonthlyCost: z.string(),
  netMonthlySavings: z.string(),
  percentageDifference: z.number(),
  addedLineItems: z.array(CostLineItemSchema),
  removedLineItems: z.array(CostLineItemSchema),
  modifiedLineItems: z.array(
    z.object({
      nodeId: z.string(),
      nodeLabel: z.string(),
      category: BillableResourceCategorySchema,
      baselineCost: z.string(),
      candidateCost: z.string(),
      difference: z.string(),
    })
  ),
  reliabilityTradeoffs: z.array(z.string()),
  performanceTradeoffs: z.array(z.string()),
  securityTradeoffs: z.array(z.string()),
});
