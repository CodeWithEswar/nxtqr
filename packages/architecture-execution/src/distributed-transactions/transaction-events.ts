import type { BaseExecutionEvent } from "../domain/execution-event";

export interface DistributedTxStartedEvent extends BaseExecutionEvent {
  type: "distributed_tx.started";
  transactionId: string;
  protocol: "two_phase_commit" | "saga_orchestration" | "saga_choreography";
}

export interface TransactionParticipantEnlistedEvent extends BaseExecutionEvent {
  type: "transaction.participant.enlisted";
  transactionId: string;
  participantId: string;
}

export interface TransactionPrepareSentEvent extends BaseExecutionEvent {
  type: "transaction.prepare.sent";
  transactionId: string;
  participantId: string;
}

export interface TransactionVoteYesEvent extends BaseExecutionEvent {
  type: "transaction.vote.yes";
  transactionId: string;
  participantId: string;
}

export interface TransactionVoteNoEvent extends BaseExecutionEvent {
  type: "transaction.vote.no";
  transactionId: string;
  participantId: string;
  reason: string;
}

export interface TransactionDecisionCommittedEvent extends BaseExecutionEvent {
  type: "transaction.decision.committed";
  transactionId: string;
}

export interface TransactionDecisionAbortedEvent extends BaseExecutionEvent {
  type: "transaction.decision.aborted";
  transactionId: string;
  reason: string;
}

export interface TransactionParticipantCommittedEvent extends BaseExecutionEvent {
  type: "transaction.participant.committed";
  transactionId: string;
  participantId: string;
}

export interface TransactionParticipantAbortedEvent extends BaseExecutionEvent {
  type: "transaction.participant.aborted";
  transactionId: string;
  participantId: string;
}

export interface TransactionInDoubtEvent extends BaseExecutionEvent {
  type: "transaction.in_doubt";
  transactionId: string;
  participantId: string;
  reason: string;
}

export interface TransactionRecoveryStartedEvent extends BaseExecutionEvent {
  type: "transaction.recovery.started";
  componentId: string;
  transactionId: string;
}

export interface TransactionRecoveryCompletedEvent extends BaseExecutionEvent {
  type: "transaction.recovery.completed";
  componentId: string;
  transactionId: string;
  outcome: string;
}

export interface SagaStartedEvent extends BaseExecutionEvent {
  type: "saga.started";
  sagaId: string;
  mode: "orchestration" | "choreography";
  workflowVersion: number;
}

export interface SagaStepStartedEvent extends BaseExecutionEvent {
  type: "saga.step.started";
  sagaId: string;
  stepId: string;
  participantId: string;
  attempt: number;
}

export interface SagaStepCompletedEvent extends BaseExecutionEvent {
  type: "saga.step.completed";
  sagaId: string;
  stepId: string;
  participantId: string;
}

export interface SagaStepFailedEvent extends BaseExecutionEvent {
  type: "saga.step.failed";
  sagaId: string;
  stepId: string;
  participantId: string;
  reason: string;
}

export interface SagaCompensationStartedEvent extends BaseExecutionEvent {
  type: "saga.compensation.started";
  sagaId: string;
  stepId: string;
  participantId: string;
}

export interface SagaCompensationCompletedEvent extends BaseExecutionEvent {
  type: "saga.compensation.completed";
  sagaId: string;
  stepId: string;
  participantId: string;
}

export interface SagaCompensationFailedEvent extends BaseExecutionEvent {
  type: "saga.compensation.failed";
  sagaId: string;
  stepId: string;
  participantId: string;
  reason: string;
}

export interface SagaCompletedEvent extends BaseExecutionEvent {
  type: "saga.completed";
  sagaId: string;
  finalState: string;
}

export interface SagaManualInterventionRequiredEvent extends BaseExecutionEvent {
  type: "saga.manual_intervention.required";
  sagaId: string;
  stepId: string;
  reason: string;
}

export interface TransactionLockContendedEvent extends BaseExecutionEvent {
  type: "transaction.lock.contended";
  transactionId: string;
  ownerTxId: string;
  resourceKey: string;
}

export interface TransactionOutboxEvent extends BaseExecutionEvent {
  type: "transaction.outbox.event";
  recordId: string;
  participantId: string;
  status: string;
}

export interface TransactionInboxDeduplicatedEvent extends BaseExecutionEvent {
  type: "transaction.inbox.deduplicated";
  messageId: string;
  consumerId: string;
}

export interface TransactionIdempotencyHitEvent extends BaseExecutionEvent {
  type: "transaction.idempotency.hit";
  operationId: string;
  participantId: string;
}

export type DistributedTransactionEvent =
  | DistributedTxStartedEvent
  | TransactionParticipantEnlistedEvent
  | TransactionPrepareSentEvent
  | TransactionVoteYesEvent
  | TransactionVoteNoEvent
  | TransactionDecisionCommittedEvent
  | TransactionDecisionAbortedEvent
  | TransactionParticipantCommittedEvent
  | TransactionParticipantAbortedEvent
  | TransactionInDoubtEvent
  | TransactionRecoveryStartedEvent
  | TransactionRecoveryCompletedEvent
  | SagaStartedEvent
  | SagaStepStartedEvent
  | SagaStepCompletedEvent
  | SagaStepFailedEvent
  | SagaCompensationStartedEvent
  | SagaCompensationCompletedEvent
  | SagaCompensationFailedEvent
  | SagaCompletedEvent
  | SagaManualInterventionRequiredEvent
  | TransactionLockContendedEvent
  | TransactionOutboxEvent
  | TransactionInboxDeduplicatedEvent
  | TransactionIdempotencyHitEvent;
