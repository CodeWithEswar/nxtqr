import type { BaseExecutionEvent } from "../domain/execution-event";
import type { DeploymentStrategy, GateOutcome } from "./deployment-schemas";

export interface DeployCreatedEvent extends BaseExecutionEvent {
  type: "deployment.created";
  deploymentId: string;
  serviceId: string;
  strategy: DeploymentStrategy;
}

export interface DeployValidatedEvent extends BaseExecutionEvent {
  type: "deployment.validated";
  deploymentId: string;
}

export interface DeployStartedEvent extends BaseExecutionEvent {
  type: "deployment.started";
  deploymentId: string;
  strategy: DeploymentStrategy;
}

export interface DeployReplicaScheduledEvent extends BaseExecutionEvent {
  type: "deployment.replica.scheduled";
  deploymentId: string;
  replicaId: string;
  revisionId: string;
}

export interface DeployReplicaStartedEvent extends BaseExecutionEvent {
  type: "deployment.replica.started";
  replicaId: string;
  revisionId: string;
}

export interface DeployReplicaReadyEvent extends BaseExecutionEvent {
  type: "deployment.replica.ready";
  replicaId: string;
  revisionId: string;
}

export interface DeployReplicaUnreadyEvent extends BaseExecutionEvent {
  type: "deployment.replica.unready";
  replicaId: string;
  revisionId: string;
  reason: string;
}

export interface DeployReplicaFailedEvent extends BaseExecutionEvent {
  type: "deployment.replica.failed";
  replicaId: string;
  revisionId: string;
  reason: string;
}

export interface DeployTrafficShiftedEvent extends BaseExecutionEvent {
  type: "deployment.traffic.shifted";
  deploymentId: string;
  serviceId: string;
  candidateWeightPct: number;
}

export interface DeployGateEvaluatedEvent extends BaseExecutionEvent {
  type: "deployment.gate.evaluated";
  deploymentId: string;
  gateId: string;
  outcome: GateOutcome;
}

export interface DeployStagePromotedEvent extends BaseExecutionEvent {
  type: "deployment.stage.promoted";
  deploymentId: string;
  stageId: string;
  newWeightPct: number;
}

export interface DeployPausedEvent extends BaseExecutionEvent {
  type: "deployment.paused";
  deploymentId: string;
  reason: string;
}

export interface DeployResumedEvent extends BaseExecutionEvent {
  type: "deployment.resumed";
  deploymentId: string;
}

export interface DeployRollbackRequestedEvent extends BaseExecutionEvent {
  type: "deployment.rollback.requested";
  deploymentId: string;
  reason: string;
}

export interface DeployRollbackStartedEvent extends BaseExecutionEvent {
  type: "deployment.rollback.started";
  deploymentId: string;
  fromRevisionId: string;
  toRevisionId: string;
}

export interface DeployRollbackCompletedEvent extends BaseExecutionEvent {
  type: "deployment.rollback.completed";
  deploymentId: string;
  toRevisionId: string;
}

export interface DeployRollbackFailedEvent extends BaseExecutionEvent {
  type: "deployment.rollback.failed";
  deploymentId: string;
  reason: string;
}

export interface DeployCompletedEvent extends BaseExecutionEvent {
  type: "deployment.completed";
  deploymentId: string;
  activeRevisionId: string;
}

export interface DeployFailedEvent extends BaseExecutionEvent {
  type: "deployment.failed";
  deploymentId: string;
  reason: string;
}

export interface DeployCancelledEvent extends BaseExecutionEvent {
  type: "deployment.cancelled";
  deploymentId: string;
}

export type DeploymentExecutionEvent =
  | DeployCreatedEvent
  | DeployValidatedEvent
  | DeployStartedEvent
  | DeployReplicaScheduledEvent
  | DeployReplicaStartedEvent
  | DeployReplicaReadyEvent
  | DeployReplicaUnreadyEvent
  | DeployReplicaFailedEvent
  | DeployTrafficShiftedEvent
  | DeployGateEvaluatedEvent
  | DeployStagePromotedEvent
  | DeployPausedEvent
  | DeployResumedEvent
  | DeployRollbackRequestedEvent
  | DeployRollbackStartedEvent
  | DeployRollbackCompletedEvent
  | DeployRollbackFailedEvent
  | DeployCompletedEvent
  | DeployFailedEvent
  | DeployCancelledEvent;

