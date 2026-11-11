import type { WorkloadScenario, WorkloadUnit, UtilizationStatus } from "../../bottlenecks/contracts/bottleneck.types";
import type { UnifiedRecommendation } from "../../recommendations/contracts/recommendations.types";

export type GrowthModelKind =
  | "constant"
  | "linear"
  | "compound"
  | "step"
  | "seasonal"
  | "custom";

export type ForecastIntervalUnit = "day" | "week" | "month";

export type ResourceCategory =
  | "compute"
  | "database"
  | "cache"
  | "messaging"
  | "storage"
  | "network"
  | "external_api";

export interface LinearGrowthParams {
  growthPerIntervalRps: number;
}

export interface CompoundGrowthParams {
  growthRatePercentPerInterval: number; // e.g. 10 for 10% monthly growth
}

export interface StepMilestone {
  intervalIndex: number; // 0-based
  demandRps: number;
  label?: string;
}

export interface StepGrowthParams {
  milestones: StepMilestone[];
}

export interface SeasonalGrowthParams {
  baseGrowthRatePercent: number;
  amplitudePercent: number; // e.g. 30% surge
  periodIntervals: number; // e.g. 12 for annual cycle
}

export interface CustomForecastPoint {
  intervalIndex: number;
  demandRps: number;
  activeUsers?: number;
}

export interface CustomGrowthParams {
  points: CustomForecastPoint[];
}

export type GrowthModelParams =
  | { kind: "constant" }
  | { kind: "linear"; params: LinearGrowthParams }
  | { kind: "compound"; params: CompoundGrowthParams }
  | { kind: "step"; params: StepGrowthParams }
  | { kind: "seasonal"; params: SeasonalGrowthParams }
  | { kind: "custom"; params: CustomGrowthParams };

export interface CapacityForecastScenario {
  id: string;
  name: string;
  description: string;
  baseWorkloadScenarioId: string;
  growthModel: GrowthModelKind;
  growthParams: GrowthModelParams;
  horizonIntervals: number; // e.g. 6, 12, 24
  intervalUnit: ForecastIntervalUnit;
  warningUtilizationThreshold: number; // default 0.70 (70%)
  criticalUtilizationThreshold: number; // default 0.85 (85%)
  graphRevision: string;
  sourceOfAssumptions?: string;
}

export interface ProjectedIntervalDemand {
  intervalIndex: number;
  intervalLabel: string; // "Now", "M1", "M2", etc.
  projectedIngressRps: number;
  effectivePeakRps: number;
  activeUsers?: number;
  concurrentUsers?: number;
  totalDataVolumeGb?: number;
}

export interface ComponentCapacityEvaluation {
  nodeId: string;
  category: ResourceCategory;
  declaredCapacityRps?: number;
  declaredCapacityUnit?: WorkloadUnit;
  currentDemandRps: number;
  currentUtilizationRatio?: number;
  status: UtilizationStatus;
  processingTimeMs?: number;
  scalingEfficiency?: number; // 0.0 - 1.0 (Amdahl's scaling factor)
  instancesCount: number;
  recommendedInstancesCount?: number;
  // Saturation projection
  saturatesAtInterval?: number; // interval index where utilization crosses critical threshold
  saturatesAtLabel?: string; // "Month 4"
  headroomAtHorizonRps?: number;
  utilizationAtHorizonRatio?: number;
  isUnknownCapacity: boolean;
  notes?: string;
}

export interface ResourceCategorySummary {
  category: ResourceCategory;
  totalComponents: number;
  saturatedCount: number;
  warningCount: number;
  optimalCount: number;
  unknownCount: number;
  averageUtilizationRatio?: number;
  earliestSaturationLabel?: string;
}

export interface CapacityPlanningFinding {
  id: string;
  ruleId: string;
  resourceCategory: ResourceCategory;
  severity: "critical" | "high" | "medium" | "low" | "info";
  title: string;
  explanation: string;
  affectedNodeId: string;
  forecastIntervalIndex: number;
  forecastIntervalLabel: string;
  projectedDemandRps: number;
  declaredCapacityRps?: number;
  headroomRps?: number;
  utilizationRatio?: number;
  recommendationIds: string[];
}

export interface ForecastTimePointSeries {
  intervalIndex: number;
  intervalLabel: string;
  projectedIngressRps: number;
  effectivePeakRps: number;
  totalCapacityRps: number;
  bottleneckNodeId?: string;
  maxUtilizationRatio?: number;
  activeSaturationCount: number;
}

export interface CapacityPlanningReport {
  id: string;
  scenarioId: string;
  scenarioName: string;
  analyzedAt: string;
  graphRevision: string;
  horizonIntervals: number;
  intervalUnit: ForecastIntervalUnit;
  growthModel: GrowthModelKind;
  baselineWorkload: WorkloadScenario;
  timeSeries: ForecastTimePointSeries[];
  componentEvaluations: Record<string, ComponentCapacityEvaluation>;
  categorySummaries: Record<ResourceCategory, ResourceCategorySummary>;
  findings: CapacityPlanningFinding[];
  recommendations: UnifiedRecommendation[];
  summary: {
    totalComponentsEvaluated: number;
    earliestSaturationNodeId?: string;
    earliestSaturationLabel?: string;
    componentsExceedingCapacityCount: number;
    componentsNearSaturationCount: number;
    sufficientHeadroomCount: number;
    unknownCapacityCount: number;
    recommendedInstanceAdditions: number;
  };
}

export interface ScenarioComparisonPoint {
  scenarioId: string;
  scenarioName: string;
  finalDemandRps: number;
  earliestSaturationLabel: string;
  saturatedComponentsCount: number;
  totalRecommendedInstances: number;
}
