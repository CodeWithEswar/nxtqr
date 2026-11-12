import type {
  DataLossClassification,
  FailbackLifecycleState,
  FailoverLifecycleState,
  RegionHealthState,
  RestoreLifecycleState,
} from "./disaster-recovery-schemas";
import type { ModeledRuntimeState } from "../domain/runtime-state";

export interface DisasterRecoveryBaseEvent {
  id: string;
  sequence: number;
  atMs: number;
  durationMs: number;
  explanation: string;
  stateSnapshot?: ModeledRuntimeState;
}

export interface RecoveryRegionDegradedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.region.degraded";
  regionId: string;
  newState: RegionHealthState;
  reason: string;
}

export interface RecoveryRegionUnavailableEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.region.unavailable";
  regionId: string;
  newState: RegionHealthState;
  reason: string;
}

export interface RecoveryFailureDetectedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.failure.detected";
  regionId: string;
  detectionDelayMs: number;
}

export interface RecoveryFailoverRequestedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.failover.requested";
  fromRegionId: string;
  toRegionId: string;
  mode: "automatic" | "manual";
}

export interface RecoveryPrimaryFencedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.primary.fenced";
  regionId: string;
  epoch: number;
  success: boolean;
}

export interface RecoverySecondaryValidatedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.secondary.validated";
  regionId: string;
  eligible: boolean;
}

export interface RecoverySecondaryPromotedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.secondary.promoted";
  regionId: string;
  epoch: number;
}

export interface RecoveryRoutingUpdatedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.routing.updated";
  strategy: "dns_failover" | "global_lb";
  weightsPct: Record<string, number>;
}

export interface RecoveryRoutingConvergedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.routing.converged";
  targetRegionId: string;
  convergenceTimeMs: number;
}

export interface RecoveryBackupStartedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.backup.started";
  backupId: string;
  backupType: "full" | "incremental" | "differential";
  storageRegionId: string;
}

export interface RecoveryBackupCompletedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.backup.completed";
  backupId: string;
  includedLogPosition: number;
  integrity: "valid" | "corrupt" | "unknown";
}

export interface RecoveryBackupFailedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.backup.failed";
  backupId: string;
  reason: string;
}

export interface RecoveryRestoreStartedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.restore.started";
  restoreId: string;
  backupId: string;
  targetRegionId: string;
}

export interface RecoveryRestoreProgressedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.restore.progressed";
  restoreId: string;
  state: RestoreLifecycleState;
  recordsRestored: number;
}

export interface RecoveryRestoreCompletedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.restore.completed";
  restoreId: string;
  logsAppliedLsn: number;
}

export interface RecoveryRestoreFailedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.restore.failed";
  restoreId: string;
  reason: string;
}

export interface RecoveryDataVerifiedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.data.verified";
  achievedRpoMs: number | null;
  missingAcknowledgedWrites: number;
  classification: DataLossClassification;
}

export interface RecoveryServiceVerifiedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.service.verified";
  serviceId: string;
  minimumViable: boolean;
  fullRecovery: boolean;
}

export interface RecoveryObjectiveEvaluatedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.objective.evaluated";
  objectiveId: string;
  rpoMet: boolean;
  rtoMet: boolean;
}

export interface RecoveryFailoverCompletedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.failover.completed";
  state: FailoverLifecycleState;
  achievedRtoMs: number | null;
}

export interface RecoveryFailbackStartedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.failback.started";
  originalRegionId: string;
}

export interface RecoveryFailbackCompletedEvent extends DisasterRecoveryBaseEvent {
  type: "recovery.failback.completed";
  state: FailbackLifecycleState;
  originalRegionId: string;
}

export type DisasterRecoveryExecutionEvent =
  | RecoveryRegionDegradedEvent
  | RecoveryRegionUnavailableEvent
  | RecoveryFailureDetectedEvent
  | RecoveryFailoverRequestedEvent
  | RecoveryPrimaryFencedEvent
  | RecoverySecondaryValidatedEvent
  | RecoverySecondaryPromotedEvent
  | RecoveryRoutingUpdatedEvent
  | RecoveryRoutingConvergedEvent
  | RecoveryBackupStartedEvent
  | RecoveryBackupCompletedEvent
  | RecoveryBackupFailedEvent
  | RecoveryRestoreStartedEvent
  | RecoveryRestoreProgressedEvent
  | RecoveryRestoreCompletedEvent
  | RecoveryRestoreFailedEvent
  | RecoveryDataVerifiedEvent
  | RecoveryServiceVerifiedEvent
  | RecoveryObjectiveEvaluatedEvent
  | RecoveryFailoverCompletedEvent
  | RecoveryFailbackStartedEvent
  | RecoveryFailbackCompletedEvent;
