import { z } from "zod";

export const GrowthModelKindSchema = z.enum([
  "constant",
  "linear",
  "compound",
  "step",
  "seasonal",
  "custom",
]);

export const ForecastIntervalUnitSchema = z.enum(["day", "week", "month"]);

export const ResourceCategorySchema = z.enum([
  "compute",
  "database",
  "cache",
  "messaging",
  "storage",
  "network",
  "external_api",
]);

export const LinearGrowthParamsSchema = z.object({
  growthPerIntervalRps: z.number().min(0),
});

export const CompoundGrowthParamsSchema = z.object({
  growthRatePercentPerInterval: z.number().min(-100).max(500),
});

export const StepMilestoneSchema = z.object({
  intervalIndex: z.number().int().min(0),
  demandRps: z.number().min(0),
  label: z.string().optional(),
});

export const StepGrowthParamsSchema = z.object({
  milestones: z.array(StepMilestoneSchema),
});

export const SeasonalGrowthParamsSchema = z.object({
  baseGrowthRatePercent: z.number(),
  amplitudePercent: z.number().min(0).max(300),
  periodIntervals: z.number().int().min(2),
});

export const CustomForecastPointSchema = z.object({
  intervalIndex: z.number().int().min(0),
  demandRps: z.number().min(0),
  activeUsers: z.number().min(0).optional(),
});

export const CustomGrowthParamsSchema = z.object({
  points: z.array(CustomForecastPointSchema),
});

export const GrowthModelParamsSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("constant") }),
  z.object({ kind: z.literal("linear"), params: LinearGrowthParamsSchema }),
  z.object({ kind: z.literal("compound"), params: CompoundGrowthParamsSchema }),
  z.object({ kind: z.literal("step"), params: StepGrowthParamsSchema }),
  z.object({ kind: z.literal("seasonal"), params: SeasonalGrowthParamsSchema }),
  z.object({ kind: z.literal("custom"), params: CustomGrowthParamsSchema }),
]);

export const CapacityForecastScenarioSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  baseWorkloadScenarioId: z.string().min(1),
  growthModel: GrowthModelKindSchema,
  growthParams: GrowthModelParamsSchema,
  horizonIntervals: z.number().int().min(1).max(60),
  intervalUnit: ForecastIntervalUnitSchema,
  warningUtilizationThreshold: z.number().min(0.1).max(1.0).default(0.7),
  criticalUtilizationThreshold: z.number().min(0.1).max(1.0).default(0.85),
  graphRevision: z.string().min(1),
  sourceOfAssumptions: z.string().optional(),
});

export const ComponentCapacityEvaluationSchema = z.object({
  nodeId: z.string().min(1),
  category: ResourceCategorySchema,
  declaredCapacityRps: z.number().optional(),
  currentDemandRps: z.number(),
  currentUtilizationRatio: z.number().optional(),
  status: z.enum(["optimal", "approaching_capacity", "near_saturation", "exceeding_capacity", "unknown"]),
  processingTimeMs: z.number().optional(),
  scalingEfficiency: z.number().min(0).max(1).optional(),
  instancesCount: z.number().int().min(1),
  recommendedInstancesCount: z.number().int().optional(),
  saturatesAtInterval: z.number().int().optional(),
  saturatesAtLabel: z.string().optional(),
  headroomAtHorizonRps: z.number().optional(),
  utilizationAtHorizonRatio: z.number().optional(),
  isUnknownCapacity: z.boolean(),
  notes: z.string().optional(),
});

export const CapacityPlanningFindingSchema = z.object({
  id: z.string().min(1),
  ruleId: z.string().min(1),
  resourceCategory: ResourceCategorySchema,
  severity: z.enum(["critical", "high", "medium", "low", "info"]),
  title: z.string().min(1),
  explanation: z.string().min(1),
  affectedNodeId: z.string().min(1),
  forecastIntervalIndex: z.number().int().min(0),
  forecastIntervalLabel: z.string().min(1),
  projectedDemandRps: z.number(),
  declaredCapacityRps: z.number().optional(),
  headroomRps: z.number().optional(),
  utilizationRatio: z.number().optional(),
  recommendationIds: z.array(z.string()),
});
