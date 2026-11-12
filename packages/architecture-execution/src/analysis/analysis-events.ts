import type { ModeledRuntimeState } from "../domain/runtime-state";

export interface AnalysisBaseEvent {
  id: string;
  sequence: number;
  atMs: number;
  durationMs: number;
  explanation: string;
  stateSnapshot?: ModeledRuntimeState;
}

export interface AnalysisExperimentCreatedEvent extends AnalysisBaseEvent {
  type: "analysis.experiment.created";
  experimentId: string;
}

export interface AnalysisRunStartedEvent extends AnalysisBaseEvent {
  type: "analysis.run.started";
  variant: "baseline" | "candidate";
  revisionId: string;
}

export interface AnalysisRunCompletedEvent extends AnalysisBaseEvent {
  type: "analysis.run.completed";
  variant: "baseline" | "candidate";
  p95Ms: number;
}

export interface AnalysisRunFailedEvent extends AnalysisBaseEvent {
  type: "analysis.run.failed";
  variant: "baseline" | "candidate";
  reason: string;
}

export interface AnalysisMetricNormalizedEvent extends AnalysisBaseEvent {
  type: "analysis.metric.normalized";
  variant: "baseline" | "candidate";
  p95Ms: number;
  monthlyCostUsd: number;
}

export interface AnalysisBottleneckDetectedEvent extends AnalysisBaseEvent {
  type: "analysis.bottleneck.detected";
  componentId: string;
  limitingResource: string;
}

export interface AnalysisReliabilityRiskDetectedEvent extends AnalysisBaseEvent {
  type: "analysis.reliability.risk.detected";
  componentId: string;
  kind: "spof" | "common_cause";
}

export interface AnalysisFailurePropagatedEvent extends AnalysisBaseEvent {
  type: "analysis.failure.propagated";
  componentId: string;
  impact: string;
}

export interface AnalysisConstraintViolatedEvent extends AnalysisBaseEvent {
  type: "analysis.constraint.violated";
  variant: "baseline" | "candidate";
  constraintId: string;
}

export interface AnalysisTradeoffEvaluatedEvent extends AnalysisBaseEvent {
  type: "analysis.tradeoff.evaluated";
  dimensionA: string;
  dimensionB: string;
}

export interface AnalysisRecommendationGeneratedEvent extends AnalysisBaseEvent {
  type: "analysis.recommendation.generated";
  recommendationId: string;
}

export interface AnalysisRecommendationValidatedEvent extends AnalysisBaseEvent {
  type: "analysis.recommendation.validated";
  recommendationId: string;
  outcome: "validated_improved" | "validated_neutral" | "validated_regressed";
}

export interface AnalysisAdrCreatedEvent extends AnalysisBaseEvent {
  type: "analysis.adr.created";
  adrId: string;
}

export interface AnalysisReportGeneratedEvent extends AnalysisBaseEvent {
  type: "analysis.report.generated";
  experimentId: string;
}

export type AnalysisExecutionEvent =
  | AnalysisExperimentCreatedEvent
  | AnalysisRunStartedEvent
  | AnalysisRunCompletedEvent
  | AnalysisRunFailedEvent
  | AnalysisMetricNormalizedEvent
  | AnalysisBottleneckDetectedEvent
  | AnalysisReliabilityRiskDetectedEvent
  | AnalysisFailurePropagatedEvent
  | AnalysisConstraintViolatedEvent
  | AnalysisTradeoffEvaluatedEvent
  | AnalysisRecommendationGeneratedEvent
  | AnalysisRecommendationValidatedEvent
  | AnalysisAdrCreatedEvent
  | AnalysisReportGeneratedEvent;

