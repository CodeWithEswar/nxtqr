import type { BaseExecutionEvent } from "../domain/execution-event";
import type {
  PracticeInterviewPhase,
  PracticeMode,
} from "./practice-schemas";

export interface PracticeEventEnvelope extends BaseExecutionEvent {
  sessionId: string;
  actor: "candidate" | "interviewer" | "evaluator" | "system";
  payloadVersion: 1;
  causalRef?: string;
}

export interface PracticeSessionCreatedEvent extends PracticeEventEnvelope {
  type: "practice.session.created";
  challengeId: string;
  challengeVersion: number;
  mode: PracticeMode;
}

export interface PracticeSessionStartedEvent extends PracticeEventEnvelope {
  type: "practice.session.started";
  durationLimitMinutes: number;
}

export interface PracticePhaseChangedEvent extends PracticeEventEnvelope {
  type: "practice.phase.changed";
  fromPhase: PracticeInterviewPhase;
  toPhase: PracticeInterviewPhase;
}

export interface PracticeRequirementDiscoveredEvent extends PracticeEventEnvelope {
  type: "practice.requirement.discovered";
  requirementId: string;
  requirementCode: string;
  questionText: string;
}

export interface PracticeEstimationUpdatedEvent extends PracticeEventEnvelope {
  type: "practice.estimation.updated";
  averageRps: number;
  peakRps: number;
  replicatedStorageBytes: number;
}

export interface PracticeApiUpdatedEvent extends PracticeEventEnvelope {
  type: "practice.api.updated";
  endpointCount: number;
}

export interface PracticeDataModelUpdatedEvent extends PracticeEventEnvelope {
  type: "practice.data_model.updated";
  entityCount: number;
}

export interface PracticeArchitectureUpdatedEvent extends PracticeEventEnvelope {
  type: "practice.architecture.updated";
  revisionId: string;
  contentHash: string;
  componentCount: number;
}

export interface PracticeQuestionAskedEvent extends PracticeEventEnvelope {
  type: "practice.question.asked";
  questionId: string;
  prompt: string;
}

export interface PracticeAnswerSubmittedEvent extends PracticeEventEnvelope {
  type: "practice.answer.submitted";
  questionId: string;
}

export interface PracticeHintRevealedEvent extends PracticeEventEnvelope {
  type: "practice.hint.revealed";
  hintId: string;
  level: number;
}

export interface PracticeSimulationStartedEvent extends PracticeEventEnvelope {
  type: "practice.simulation.started";
  scenarioId: string;
  workloadRps: number;
}

export interface PracticeSimulationCompletedEvent extends PracticeEventEnvelope {
  type: "practice.simulation.completed";
  scenarioId: string;
  simulationRunId: string;
  p95Ms: number;
  availabilityPct: number;
}

export interface PracticeSubmissionCreatedEvent extends PracticeEventEnvelope {
  type: "practice.submission.created";
  submissionId: string;
  idempotencyKey: string;
}

export interface PracticeEvaluationStartedEvent extends PracticeEventEnvelope {
  type: "practice.evaluation.started";
  rubricId: string;
  rubricVersion: number;
}

export interface PracticeEvaluationCompletedEvent extends PracticeEventEnvelope {
  type: "practice.evaluation.completed";
  evaluationId: string;
  evaluatedWeightedScore: number;
  status: "pending" | "partial" | "completed" | "failed";
}

export interface PracticeLabStepCompletedEvent extends PracticeEventEnvelope {
  type: "practice.lab.step.completed";
  labId: string;
  stepId: string;
}

export interface PracticeLabCompletedEvent extends PracticeEventEnvelope {
  type: "practice.lab.completed";
  labId: string;
  attemptId: string;
}

export interface PracticeProgressUpdatedEvent extends PracticeEventEnvelope {
  type: "practice.progress.updated";
  challengeId: string;
  attempts: number;
  completed: boolean;
}

export type PracticeExecutionEvent =
  | PracticeSessionCreatedEvent
  | PracticeSessionStartedEvent
  | PracticePhaseChangedEvent
  | PracticeRequirementDiscoveredEvent
  | PracticeEstimationUpdatedEvent
  | PracticeApiUpdatedEvent
  | PracticeDataModelUpdatedEvent
  | PracticeArchitectureUpdatedEvent
  | PracticeQuestionAskedEvent
  | PracticeAnswerSubmittedEvent
  | PracticeHintRevealedEvent
  | PracticeSimulationStartedEvent
  | PracticeSimulationCompletedEvent
  | PracticeSubmissionCreatedEvent
  | PracticeEvaluationStartedEvent
  | PracticeEvaluationCompletedEvent
  | PracticeLabStepCompletedEvent
  | PracticeLabCompletedEvent
  | PracticeProgressUpdatedEvent;

