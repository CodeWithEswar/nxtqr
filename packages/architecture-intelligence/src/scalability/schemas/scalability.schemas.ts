import { z } from "zod";

export const scalabilityStrategySchema = z.enum([
  "horizontal-scaling",
  "vertical-scaling",
  "load-distribution",
  "caching",
  "read-replication",
  "partitioning",
  "sharding",
  "asynchronous-processing",
  "queue-load-leveling",
  "backpressure",
  "rate-limiting",
  "storage-scaling",
  "network-scaling",
  "multi-region",
  "resource-optimization",
  "custom",
]);
export type ScalabilityStrategy = z.infer<typeof scalabilityStrategySchema>;

export const recommendationFeasibilitySchema = z.enum([
  "applicable",
  "conditional",
  "not-applicable",
  "insufficient-evidence",
]);
export type RecommendationFeasibility = z.infer<typeof recommendationFeasibilitySchema>;

export const complexityLevelSchema = z.enum(["low", "medium", "high"]);
export type ImplementationComplexity = z.infer<typeof complexityLevelSchema>;
export type OperationalComplexity = z.infer<typeof complexityLevelSchema>;

export const reversibilityLevelSchema = z.enum(["easy", "moderate", "difficult"]);
export type Reversibility = z.infer<typeof reversibilityLevelSchema>;

export const graphOperationSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("add_node"),
    node: z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({ x: z.number(), y: z.number() }),
      data: z.record(z.unknown()),
      label: z.string().optional(),
    }),
  }),
  z.object({
    type: z.literal("update_node_config"),
    nodeId: z.string(),
    configUpdates: z.record(z.unknown()),
  }),
  z.object({
    type: z.literal("adjust_instances"),
    nodeId: z.string(),
    newReplicas: z.number().int().positive(),
  }),
  z.object({
    type: z.literal("add_edge"),
    edge: z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      data: z.record(z.unknown()).optional(),
    }),
  }),
  z.object({
    type: z.literal("delete_edge"),
    edgeId: z.string(),
  }),
  z.object({
    type: z.literal("insert_mediator"),
    mediatorNode: z.object({
      id: z.string(),
      type: z.string(),
      position: z.object({ x: z.number(), y: z.number() }),
      data: z.record(z.unknown()),
      label: z.string().optional(),
    }),
    replaceEdgeId: z.string(),
    inProtocol: z.string().optional(),
    outProtocol: z.string().optional(),
  }),
]);
export type GraphOperation = z.infer<typeof graphOperationSchema>;

export const tradeoffAnalysisSchema = z.object({
  implementationComplexity: complexityLevelSchema,
  operationalComplexity: complexityLevelSchema,
  reversibility: reversibilityLevelSchema,
  reliabilityImplications: z.string(),
  securityImplications: z.string(),
  consistencyImplications: z.string(),
  costImpact: z.string(),
});
export type TradeoffAnalysis = z.infer<typeof tradeoffAnalysisSchema>;

export const scalabilityRecommendationSchema = z.object({
  id: z.string(),
  strategy: scalabilityStrategySchema,
  title: z.string(),
  summary: z.string(),
  affectedNodeIds: z.array(z.string()),
  affectedEdgeIds: z.array(z.string()),
  sourceFindingIds: z.array(z.string()),
  feasibility: recommendationFeasibilitySchema,
  feasibilityReasoning: z.string(),
  evidence: z.array(
    z.object({
      kind: z.enum(["node", "edge", "property", "boundary", "capability", "metric"]),
      elementId: z.string().optional(),
      propertyKey: z.string().optional(),
      expectedValue: z.unknown().optional(),
      actualValue: z.unknown().optional(),
      description: z.string(),
    })
  ),
  assumptions: z.array(z.string()),
  prerequisites: z.array(z.string()),
  benefits: z.array(z.string()),
  tradeoffs: tradeoffAnalysisSchema,
  confidence: z.enum(["high", "medium", "low"]),
  rankScore: z.number(),
  proposedOperations: z.array(graphOperationSchema),
  documentationId: z.string().optional(),
});
export type ScalabilityRecommendation = z.infer<typeof scalabilityRecommendationSchema>;

export const scenarioComparisonResultSchema = z.object({
  beforeCapacityRps: z.number(),
  estimatedAfterCapacityRps: z.number(),
  capacityGainRatio: z.number(),
  resolvedFindingIds: z.array(z.string()),
  newRiskFindingIds: z.array(z.string()),
  complexityScoreDelta: z.number(),
  notes: z.array(z.string()),
});
export type ScenarioComparisonResult = z.infer<typeof scenarioComparisonResultSchema>;

export const whatIfPlanSchema = z.object({
  id: z.string(),
  recommendationId: z.string(),
  title: z.string(),
  originalGraphRevision: z.string(),
  operations: z.array(graphOperationSchema),
  comparison: scenarioComparisonResultSchema,
  isValidated: z.boolean(),
  validationErrors: z.array(z.string()),
});
export type WhatIfPlan = z.infer<typeof whatIfPlanSchema>;

export const scalabilityAnalysisReportSchema = z.object({
  id: z.string(),
  analyzedAt: z.string(),
  revisionHash: z.string(),
  scenarioId: z.string(),
  nodeCount: z.number(),
  edgeCount: z.number(),
  recommendations: z.array(scalabilityRecommendationSchema),
  summary: z.object({
    totalRecommendations: z.number(),
    applicableCount: z.number(),
    conditionalCount: z.number(),
    highConfidenceCount: z.number(),
    topStrategy: scalabilityStrategySchema.optional(),
  }),
});
export type ScalabilityAnalysisReport = z.infer<typeof scalabilityAnalysisReportSchema>;
