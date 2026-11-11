import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  BottleneckReport,
  WorkloadScenario as BottleneckWorkloadScenario,
} from "../../bottlenecks/contracts/bottleneck.types";
import { DEFAULT_WORKLOAD_SCENARIOS } from "../../bottlenecks/scenarios/scenario-registry";
import type { FailureAnalysisReport } from "../../failure-analysis/contracts/failure.types";
import type { SecurityAnalysisReport } from "../../security-analysis/contracts/security.types";
import type {
  ScalabilityStrategy,
  RecommendationFeasibility,
  ImplementationComplexity,
  OperationalComplexity,
  Reversibility,
  GraphOperation,
  TradeoffAnalysis,
  ScalabilityRecommendation,
  ScenarioComparisonResult,
  WhatIfPlan,
  ScalabilityAnalysisReport,
} from "../schemas/scalability.schemas";

export type {
  ScalabilityStrategy,
  RecommendationFeasibility,
  ImplementationComplexity,
  OperationalComplexity,
  Reversibility,
  GraphOperation,
  TradeoffAnalysis,
  ScalabilityRecommendation,
  ScenarioComparisonResult,
  WhatIfPlan,
  ScalabilityAnalysisReport,
};

export type ScalabilityScenarioInput =
  | BottleneckWorkloadScenario
  | {
      id: string;
      name?: string;
      description?: string;
      trafficMultiplier?: number;
      concurrentUsersMultiplier?: number;
    };

export function toBottleneckScenario(scenario?: ScalabilityScenarioInput): BottleneckWorkloadScenario {
  if (scenario && "parameters" in scenario) return scenario;

  const id = scenario?.id || "normal_traffic";
  const preset = DEFAULT_WORKLOAD_SCENARIOS[id];
  if (preset?.parameters) return preset;
  const trafficMultiplier = Number(scenario?.trafficMultiplier ?? 1.0);
  const concurrentUsersMultiplier = Number(scenario?.concurrentUsersMultiplier ?? 1.0);
  return {
    id,
    name: scenario?.name || id,
    description: scenario?.description || "",
    parameters: {
      activeUsers: Math.round(10000 * concurrentUsersMultiplier),
      concurrentUsers: Math.round(500 * concurrentUsersMultiplier),
      ingressRps: Math.round(1000 * trafficMultiplier),
      peakMultiplier: trafficMultiplier,
      readRatio: 0.8,
      avgRequestSizeBytes: 2048,
      avgResponseSizeBytes: 16384,
      cacheHitRate: 0.85,
      fanOutFactor: 1.0,
      retryAmplificationFactor: 1.02,
    },
  };
}

export interface ScalabilityEvaluationContext {
  nodes: BaseNode[];
  edges: BaseEdge[];
  nodeMap: Map<string, BaseNode>;
  outgoingEdgesMap: Map<string, BaseEdge[]>;
  incomingEdgesMap: Map<string, BaseEdge[]>;
  scenario: BottleneckWorkloadScenario;
  bottleneckReport: BottleneckReport;
  failureReport?: FailureAnalysisReport;
  securityReport?: SecurityAnalysisReport;
}

export interface IScalabilityStrategyEvaluator {
  readonly strategy: ScalabilityStrategy;
  evaluate(context: ScalabilityEvaluationContext): ScalabilityRecommendation[];
}
