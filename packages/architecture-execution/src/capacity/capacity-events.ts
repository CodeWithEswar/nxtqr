import type { ModeledRuntimeState } from "../domain/runtime-state";
import type { CapBottleneckRuntime } from "./capacity-schemas";

export interface CapacityBaseEvent {
  id: string;
  sequence: number;
  atMs: number;
  durationMs: number;
  explanation: string;
  stateSnapshot?: ModeledRuntimeState;
}

export interface CapacityWorkloadChangedEvent extends CapacityBaseEvent {
  type: "capacity.workload.changed";
  serviceId: string;
  incomingRps: number;
}

export interface CapacityUtilizationUpdatedEvent extends CapacityBaseEvent {
  type: "capacity.utilization.updated";
  serviceId: string;
  cpuPct: number;
  memoryPct: number;
}

export interface CapacityQueueGrowingEvent extends CapacityBaseEvent {
  type: "capacity.queue.growing";
  serviceId: string;
  queueDepth: number;
}

export interface CapacitySaturationDetectedEvent extends CapacityBaseEvent {
  type: "capacity.saturation.detected";
  serviceId: string;
  resource: string;
  utilizationPct: number;
}

export interface CapacityBottleneckDetectedEvent extends CapacityBaseEvent {
  type: "capacity.bottleneck.detected";
  bottleneck: CapBottleneckRuntime;
}

export interface CapacityScalingEvaluatedEvent extends CapacityBaseEvent {
  type: "capacity.scaling.evaluated";
  serviceId: string;
  desiredReplicas: number;
  currentReplicas: number;
}

export interface CapacityScaleRequestedEvent extends CapacityBaseEvent {
  type: "capacity.scale.requested";
  serviceId: string;
  fromReplicas: number;
  toReplicas: number;
}

export interface CapacityReplicaScheduledEvent extends CapacityBaseEvent {
  type: "capacity.replica.scheduled";
  replicaId: string;
  nodeId: string;
}

export interface CapacityReplicaReadyEvent extends CapacityBaseEvent {
  type: "capacity.replica.ready";
  replicaId: string;
  serviceId: string;
}

export interface CapacityScaleCompletedEvent extends CapacityBaseEvent {
  type: "capacity.scale.completed";
  serviceId: string;
  readyReplicas: number;
}

export interface CapacityScaleFailedEvent extends CapacityBaseEvent {
  type: "capacity.scale.failed";
  serviceId: string;
  reason: string;
}

export interface CapacityLoadShedEvent extends CapacityBaseEvent {
  type: "capacity.load.shed";
  serviceId: string;
  rejectedCount: number;
}

export interface CapacitySloViolatedEvent extends CapacityBaseEvent {
  type: "capacity.slo.violated";
  serviceId: string;
  p95Ms: number;
  targetP95Ms: number;
}

export interface CapacityCostUpdatedEvent extends CapacityBaseEvent {
  type: "capacity.cost.updated";
  projectedMonthlyCostUsd: number;
}

export interface CapacityRecommendationGeneratedEvent extends CapacityBaseEvent {
  type: "capacity.recommendation.generated";
  recommendationId: string;
  summary: string;
}

export type CapacityExecutionEvent =
  | CapacityWorkloadChangedEvent
  | CapacityUtilizationUpdatedEvent
  | CapacityQueueGrowingEvent
  | CapacitySaturationDetectedEvent
  | CapacityBottleneckDetectedEvent
  | CapacityScalingEvaluatedEvent
  | CapacityScaleRequestedEvent
  | CapacityReplicaScheduledEvent
  | CapacityReplicaReadyEvent
  | CapacityScaleCompletedEvent
  | CapacityScaleFailedEvent
  | CapacityLoadShedEvent
  | CapacitySloViolatedEvent
  | CapacityCostUpdatedEvent
  | CapacityRecommendationGeneratedEvent;

