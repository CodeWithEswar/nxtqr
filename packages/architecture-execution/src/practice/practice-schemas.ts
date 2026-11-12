import { z } from "zod";
import {
  AnalysisComponentConfigSchema,
  AnalysisEdgeConfigSchema,
  AnalysisFaultInjectionSchema,
  type AnalysisComponentConfig,
  type AnalysisEdgeConfig,
  type AnalysisFaultInjection,
  type AnalysisNormalizedMetrics,
} from "../analysis/analysis-schemas";

export const PracticeModeSchema = z.enum([
  "learn",
  "practice",
  "mock-interview",
  "engineering-lab",
]);
export type PracticeMode = z.infer<typeof PracticeModeSchema>;

export const ChallengeDifficultySchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);
export type ChallengeDifficulty = z.infer<typeof ChallengeDifficultySchema>;

export const PracticeSessionStatusSchema = z.enum([
  "created",
  "active",
  "paused",
  "submitted",
  "evaluating",
  "completed",
  "evaluation_failed",
  "abandoned",
]);
export type PracticeSessionStatus = z.infer<typeof PracticeSessionStatusSchema>;

export const PracticePressureModeSchema = z.enum(["relaxed", "standard", "strict"]);
export type PracticePressureMode = z.infer<typeof PracticePressureModeSchema>;

export const PracticeInterviewPhaseSchema = z.enum([
  "problem_understanding",
  "requirements_discovery",
  "capacity_estimation",
  "api_design",
  "data_modeling",
  "high_level_architecture",
  "detailed_component_design",
  "scalability_analysis",
  "reliability_analysis",
  "security_analysis",
  "tradeoff_discussion",
  "final_review",
]);
export type PracticeInterviewPhase = z.infer<typeof PracticeInterviewPhaseSchema>;

export const ChallengeCategorySchema = z.enum([
  "url_shortening",
  "social_media",
  "messaging",
  "video_streaming",
  "search",
  "e_commerce",
  "payments",
  "notifications",
  "ride_sharing",
  "file_storage",
  "collaboration",
  "analytics",
  "monitoring",
  "scheduling",
  "distributed_databases",
  "real_time_systems",
  "content_delivery",
  "recommendation_systems",
  "multi_tenant_saas",
  "infrastructure_systems",
]);
export type ChallengeCategory = z.infer<typeof ChallengeCategorySchema>;

export const RequirementClassificationSchema = z.enum([
  "functional",
  "nonfunctional",
  "constraint",
  "assumption",
  "out_of_scope",
]);
export type RequirementClassification = z.infer<typeof RequirementClassificationSchema>;

export const ChallengeRequirementSchema = z.object({
  id: z.string().min(1),
  code: z.string().min(1),
  kind: RequirementClassificationSchema,
  title: z.string().min(1),
  description: z.string().min(1),
  discoveredByDefault: z.boolean().default(false),
  metricTarget: z.string().optional(),
  requiredComponentKinds: z.array(z.string()).default([]),
  testScenarioId: z.string().optional(),
});
export type ChallengeRequirement = z.infer<typeof ChallengeRequirementSchema>;

export const RequirementDiscoveryRuleSchema = z.object({
  id: z.string().min(1),
  triggerKeywords: z.array(z.string().min(1)).min(1),
  promptSample: z.string().min(1),
  revealsRequirementIds: z.array(z.string().min(1)).min(1),
  interviewerResponse: z.string().min(1),
});
export type RequirementDiscoveryRule = z.infer<typeof RequirementDiscoveryRuleSchema>;

export const ChallengeConstraintSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  metric: z.enum([
    "max_p95_ms",
    "max_p99_ms",
    "min_availability_pct",
    "min_throughput_rps",
    "max_monthly_cost_usd",
    "max_critical_spofs",
  ]),
  operator: z.enum(["lte", "gte", "eq"]),
  threshold: z.number(),
  unit: z.string(),
});
export type ChallengeConstraint = z.infer<typeof ChallengeConstraintSchema>;

export const ChallengeWorkloadSchema = z.object({
  dailyActiveUsers: z.number().positive(),
  requestsPerUserPerDay: z.number().positive(),
  peakMultiplier: z.number().min(1),
  readWriteRatio: z.number().min(0.01),
  avgPayloadBytes: z.number().positive(),
  retentionDays: z.number().int().positive(),
  replicationFactor: z.number().int().min(1),
});
export type ChallengeWorkload = z.infer<typeof ChallengeWorkloadSchema>;

export const ChallengeScenarioSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: z.enum([
    "normal_traffic",
    "peak_traffic",
    "ten_x_traffic",
    "database_outage",
    "cache_outage",
    "network_latency",
    "queue_overload",
    "regional_failure",
    "unauthorized_request",
    "retry_storm",
  ]),
  workloadRps: z.number().positive(),
  faultType: AnalysisFaultInjectionSchema.shape.type.default("none"),
  faultTargetId: z.string().optional(),
  latencyInflationMs: z.number().min(0).default(0),
});
export type ChallengeScenario = z.infer<typeof ChallengeScenarioSchema>;

export const HintDefinitionSchema = z.object({
  id: z.string().min(1),
  challengeId: z.string().min(1),
  level: z.number().int().min(1).max(5),
  phase: PracticeInterviewPhaseSchema,
  title: z.string().min(1),
  content: z.string().min(1),
  prerequisiteHintIds: z.array(z.string()).default([]),
});
export type HintDefinition = z.infer<typeof HintDefinitionSchema>;

export const HintRevealSchema = z.object({
  hintId: z.string().min(1),
  level: z.number().int().min(1).max(5),
  revealedAtMs: z.number().nonnegative(),
  mode: PracticeModeSchema,
});
export type HintReveal = z.infer<typeof HintRevealSchema>;

export const RubricCriterionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  dimension: z.enum([
    "requirements_discovery",
    "capacity_estimation",
    "api_design",
    "data_modeling",
    "architecture_correctness",
    "scalability",
    "reliability",
    "security",
    "tradeoff_reasoning",
    "technical_communication",
  ]),
  weight: z.number().positive().max(100),
  evaluationType: z.enum([
    "deterministic",
    "simulation",
    "human-review",
    "ai-assisted",
  ]),
  evidenceRequirements: z.array(z.string()).min(1),
  scoringLevels: z
    .array(
      z.object({
        score: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
        label: z.enum([
          "not_demonstrated",
          "partially_demonstrated",
          "meets_expectations",
          "exceeds_expectations",
        ]),
        description: z.string().min(1),
      })
    )
    .length(4),
});
export type RubricCriterion = z.infer<typeof RubricCriterionSchema>;

export const EvaluationRubricSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().min(1),
  title: z.string().min(1),
  normalized: z.boolean().default(true),
  criteria: z.array(RubricCriterionSchema).min(3),
});
export type EvaluationRubric = z.infer<typeof EvaluationRubricSchema>;

export const ChallengeAuthoringStatusSchema = z.enum([
  "draft",
  "validated",
  "published",
  "deprecated",
]);
export type ChallengeAuthoringStatus = z.infer<typeof ChallengeAuthoringStatusSchema>;

export const SystemDesignChallengeSchema = z.object({
  version: z.number().int().min(1),
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  status: ChallengeAuthoringStatusSchema.default("published"),
  difficulty: ChallengeDifficultySchema,
  categories: z.array(ChallengeCategorySchema).min(1),
  estimatedMinutes: z.number().int().min(15).max(120),
  publicPrompt: z.string().min(1),
  concepts: z.array(z.string()).min(1),
  requirements: z.array(ChallengeRequirementSchema).min(3),
  discoveryRules: z.array(RequirementDiscoveryRuleSchema).min(2),
  constraints: z.array(ChallengeConstraintSchema).min(2),
  referenceWorkload: ChallengeWorkloadSchema,
  scenarios: z.array(ChallengeScenarioSchema).min(2),
  rubricId: z.string().min(1),
  starterArchitectureId: z.string().optional(),
  hints: z.array(HintDefinitionSchema).min(2),
  commonMistakes: z.array(z.string()).min(2),
  alternativeApproaches: z.array(z.string()).min(1),
  learningObjectives: z.array(z.string()).min(2),
  // Evaluator-only metadata (must never be sent directly to learner public payload before evaluation)
  evaluatorOnly: z.object({
    expectedPeakRpsMin: z.number().positive(),
    expectedPeakRpsMax: z.number().positive(),
    requiredComponentCapabilities: z.array(z.string()).min(1),
    requiredApiCapabilities: z.array(z.string()).min(1),
    requiredEntityConcepts: z.array(z.string()).min(1),
  }),
});
export type SystemDesignChallenge = z.infer<typeof SystemDesignChallengeSchema>;

export interface PublicSystemDesignChallenge {
  version: number;
  id: string;
  slug: string;
  title: string;
  description: string;
  difficulty: ChallengeDifficulty;
  categories: ChallengeCategory[];
  estimatedMinutes: number;
  publicPrompt: string;
  concepts: string[];
  /** Only default-visible requirements or requirements explicitly unlocked in session */
  visibleRequirements: ChallengeRequirement[];
  constraints: ChallengeConstraint[];
  scenarios: ChallengeScenario[];
  rubricId: string;
  starterArchitectureId?: string;
  /** Suggested starter questions for discovery */
  sampleClarificationPrompts: string[];
  learningObjectives: string[];
}

export const EstimationInputSchema = z.object({
  dailyActiveUsers: z.number().nonnegative(),
  requestsPerUserPerDay: z.number().nonnegative(),
  peakMultiplier: z.number().positive().default(3),
  readWriteRatio: z.number().positive().default(10),
  avgPayloadSize: z.number().nonnegative(),
  payloadUnit: z.enum(["bytes", "KB", "MB"]).default("KB"),
  retentionDays: z.number().nonnegative(),
  replicationFactor: z.number().int().min(1).default(3),
  assumptionsNote: z.string().default(""),
});
export type EstimationInput = z.infer<typeof EstimationInputSchema>;

export interface EstimationArtifact {
  input: EstimationInput;
  averageRps: number;
  peakRps: number;
  dailyWriteRequests: number;
  dailyStorageBytes: number;
  retentionStorageBytes: number;
  replicatedStorageBytes: number;
  bandwidthMbps: number;
  formattedStorageGb: number;
  formattedReplicatedTb: number;
  warnings: string[];
  valid: boolean;
  caveat: string;
}

export const ApiEndpointSpecSchema = z.object({
  id: z.string().min(1),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  path: z.string().min(1),
  purpose: z.string().min(1),
  authRequired: z.boolean().default(true),
  idempotent: z.boolean().default(false),
  paginated: z.boolean().default(false),
  rateLimited: z.boolean().default(true),
  requestSchemaSummary: z.string().default("{}"),
  responseSchemaSummary: z.string().default("{}"),
  errorCodes: z.array(z.number().int()).default([400, 401, 429, 500]),
});
export type ApiEndpointSpec = z.infer<typeof ApiEndpointSpecSchema>;

export interface ApiDesignArtifact {
  endpoints: ApiEndpointSpec[];
  notes: string;
}

export const DataEntitySpecSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  storageKind: z.enum(["sql", "nosql_kv", "wide_column", "object_store", "time_series", "cache"]),
  primaryKey: z.string().min(1),
  partitionKey: z.string().optional(),
  indexes: z.array(z.string()).default([]),
  relationships: z.array(z.string()).default([]),
  retentionPolicy: z.string().default("365d"),
  replicationMode: z.enum(["single", "leader_follower", "multi_leader", "quorum"]).default("leader_follower"),
});
export type DataEntitySpec = z.infer<typeof DataEntitySpecSchema>;

export interface DataModelArtifact {
  entities: DataEntitySpec[];
  notes: string;
}

export interface ArchitectureArtifact {
  revisionId: string;
  revisionLabel: string;
  contentHash: string;
  components: AnalysisComponentConfig[];
  edges: AnalysisEdgeConfig[];
  designNotes: string;
}

export interface InterviewMessage {
  id: string;
  role: "interviewer" | "candidate" | "system";
  phase: PracticeInterviewPhase;
  content: string;
  atMs: number;
  revealedRequirementIds?: string[];
  questionId?: string;
}

export interface InterviewQuestion {
  id: string;
  phase: PracticeInterviewPhase;
  prompt: string;
  targetCriterion: RubricCriterion["dimension"];
  difficulty: ChallengeDifficulty;
  reason: string;
}

export interface InterviewAnswer {
  questionId: string;
  content: string;
  atMs: number;
}

export interface InterviewSession {
  id: string;
  userId: string;
  challengeId: string;
  challengeVersion: number;
  mode: PracticeMode;
  pressureMode: PracticePressureMode;
  status: PracticeSessionStatus;
  startedAtIso: string;
  submittedAtIso?: string;
  completedAtIso?: string;
  durationLimitMinutes: number;
  monotonicElapsedMs: number;
  currentPhase: PracticeInterviewPhase;
  discoveredRequirementIds: string[];
  requirementClassifications: Record<string, RequirementClassification>;
  architectureRevisionId?: string;
  evaluationId?: string;
}

export interface DesignSubmission {
  id: string;
  idempotencyKey: string;
  sessionId: string;
  challengeId: string;
  challengeVersion: number;
  submittedAtIso: string;
  estimation: EstimationArtifact;
  apiDesign: ApiDesignArtifact;
  dataModel: DataModelArtifact;
  architecture: ArchitectureArtifact;
  tradeOffExplanation: string;
  answers: InterviewAnswer[];
  hintsUsed: HintReveal[];
}

export interface EvaluationEvidence {
  id: string;
  source: "deterministic_check" | "simulation_run" | "user_artifact" | "interview_qa";
  scenarioId?: string;
  simulationRunId?: string;
  architectureRevisionId?: string;
  seed?: number;
  metricSummary: string;
  metrics?: AnalysisNormalizedMetrics;
  passed: boolean;
  limitation?: string;
}

export interface CriterionResult {
  criterionId: string;
  title: string;
  dimension: RubricCriterion["dimension"];
  evaluationType: RubricCriterion["evaluationType"];
  weight: number;
  status: "evaluated" | "pending";
  /** 0..3 matching RubricCriterion scoringLevels, undefined when pending human review */
  score?: 0 | 1 | 2 | 3;
  normalizedScorePct?: number;
  evidenceIds: string[];
  rationale: string;
}

export interface EvaluationFinding {
  id: string;
  criterionId: string;
  severity: "info" | "warning" | "critical";
  observedIssue: string;
  supportingEvidenceId: string;
  explanation: string;
  suggestedImprovement: string;
  confidence: "high" | "medium" | "qualitative";
  limitations: string;
}

export interface FeedbackSummary {
  whatWorked: string[];
  whatIsMissing: string[];
  criticalIssues: string[];
  performanceFindings: string[];
  reliabilityFindings: string[];
  securityFindings: string[];
  tradeOffObservations: string[];
  recommendedImprovements: string[];
  nextLearningSteps: string[];
}

export interface EvaluationResult {
  id: string;
  sessionId: string;
  submissionId: string;
  rubricId: string;
  rubricVersion: number;
  status: "pending" | "partial" | "completed" | "failed";
  criterionResults: CriterionResult[];
  /** Weighted deterministic+simulation score across evaluated criteria only */
  evaluatedWeightedScore: number;
  /** Undefined when human-review criteria remain pending */
  finalNormalizedScore?: number;
  evaluatedWeightPct: number;
  pendingWeightPct: number;
  evidences: EvaluationEvidence[];
  findings: EvaluationFinding[];
  feedback: FeedbackSummary;
  confidenceSummary: {
    evaluatedCriteriaCount: number;
    pendingCriteriaCount: number;
    missingEvidenceCount: number;
    unsupportedCapabilities: string[];
    qualitativeDisclaimer: string;
  };
  evaluatedAtIso: string;
}

export const LabStepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().min(1),
  kind: z.enum([
    "read_explanation",
    "inspect_component",
    "add_component",
    "remove_component",
    "configure_property",
    "connect_components",
    "run_simulation",
    "inspect_metric",
    "answer_question",
    "compare_outcomes",
  ]),
  title: z.string().min(1),
  instruction: z.string().min(1),
  expectedObservation: z.string().min(1),
  questionPrompt: z.string().optional(),
});
export type LabStep = z.infer<typeof LabStepSchema>;

export const LabCompletionRuleSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1),
  predicate: z.enum([
    "has_component_kind",
    "has_min_total_replicas",
    "has_cache_component",
    "has_queue_or_async",
    "has_rate_limit_or_auth",
    "has_circuit_breaker_or_retry_bounded",
    "has_multi_az_or_region",
    "simulation_p95_lte",
    "simulation_availability_gte",
    "simulation_max_spofs_lte",
    "simulation_cost_lte",
    "steps_completed",
  ]),
  targetString: z.string().optional(),
  targetNumber: z.number().optional(),
});
export type LabCompletionRule = z.infer<typeof LabCompletionRuleSchema>;

export const EngineeringLabSchema = z.object({
  version: z.number().int().min(1),
  id: z.string().min(1),
  slug: z.string().min(1),
  number: z.number().int().min(1).max(20),
  title: z.string().min(1),
  difficulty: ChallengeDifficultySchema,
  topic: z.string().min(1),
  learningObjectives: z.array(z.string()).min(1),
  explanation: z.string().min(1),
  starterRevision: z.object({
    id: z.string().min(1),
    label: z.string().min(1),
    components: z.array(AnalysisComponentConfigSchema),
    edges: z.array(AnalysisEdgeConfigSchema),
  }),
  allowedModifications: z.array(z.string()).min(1),
  workloadRps: z.number().positive(),
  fault: z.object({
    type: AnalysisFaultInjectionSchema.shape.type,
    targetId: z.string().optional(),
  }),
  steps: z.array(LabStepSchema).min(2),
  completionRules: z.array(LabCompletionRuleSchema).min(2),
});
export type EngineeringLab = z.infer<typeof EngineeringLabSchema>;

export interface LabAttemptState {
  attemptId: string;
  labId: string;
  labVersion: number;
  completedStepIds: string[];
  inspectedMetrics: boolean;
  reasoningAnswers: Record<string, string>;
  simulationRunIds: string[];
  validationResults: Array<{
    ruleId: string;
    description: string;
    passed: boolean;
    observedDetail: string;
  }>;
  completed: boolean;
  completedAtIso?: string;
}

export interface ChallengeAttempt {
  id: string;
  sessionId: string;
  userId: string;
  challengeId: string;
  challengeVersion: number;
  mode: PracticeMode;
  architectureRevisionId: string;
  rubricVersion: number;
  submittedAtIso: string;
  elapsedSeconds: number;
  hintsUsedCount: number;
  evaluation: EvaluationResult;
}

export interface LearningProgress {
  userId: string;
  challengeId: string;
  attempts: number;
  completed: boolean;
  bestEvaluatedScore?: number;
  lastAttemptAtIso?: string;
  masteredCriteria: string[];
  improvementAreas: string[];
  masteryExplanation: string;
}

export interface SessionReport {
  generatedAtIso: string;
  challengeId: string;
  challengeTitle: string;
  difficulty: ChallengeDifficulty;
  mode: PracticeMode;
  durationSeconds: number;
  discoveredRequirements: ChallengeRequirement[];
  estimation: EstimationArtifact;
  apiEndpointsCount: number;
  dataEntitiesCount: number;
  architectureRevisionId: string;
  evaluatedWeightedScore: number;
  evaluationStatus: EvaluationResult["status"];
  strengths: string[];
  weaknesses: string[];
  findingsCount: number;
  followUpQuestionsAsked: number;
  recommendedNextChallenges: string[];
  markdown: string;
  jsonPayload: string;
}

export interface PracticeInvariantResult {
  passed: boolean;
  violations: Array<{
    code: string;
    message: string;
    severity: "warning" | "critical";
  }>;
}

export interface PracticeScenario {
  id: string;
  name: string;
  description: string;
  architectureRevisionId: string;
  mode: PracticeMode;
  pressureMode: PracticePressureMode;
  challengeId: string;
  challengeVersion: number;
  labId?: string;
  durationLimitMinutes: number;
  monotonicElapsedMs: number;
  currentPhase: PracticeInterviewPhase;
  clarificationQuestions: string[];
  estimationInput: EstimationInput;
  apiDesign: ApiDesignArtifact;
  dataModel: DataModelArtifact;
  architectureComponents: AnalysisComponentConfig[];
  architectureEdges: AnalysisEdgeConfig[];
  fault: AnalysisFaultInjection;
  tradeOffExplanation: string;
  followUpAnswers: Record<string, string>;
  revealHintUpToLevel: number;
  completedLabStepIds: string[];
  seed: number;
  previousAttempts?: ChallengeAttempt[];
  priorLabAttempts?: LabAttemptState[];
  userId: string;
}

export interface ModeledPracticeRuntimeState {
  scenarioId: string;
  mode: PracticeMode;
  session: InterviewSession;
  publicChallenge: PublicSystemDesignChallenge;
  rubric: EvaluationRubric;
  estimation: EstimationArtifact;
  apiDesign: ApiDesignArtifact;
  dataModel: DataModelArtifact;
  architecture: ArchitectureArtifact;
  messages: InterviewMessage[];
  activeQuestions: InterviewQuestion[];
  revealedHints: HintReveal[];
  availableHints: HintDefinition[];
  submission: DesignSubmission;
  evaluation: EvaluationResult;
  activeLab?: EngineeringLab;
  labAttempt?: LabAttemptState;
  attemptRecord: ChallengeAttempt;
  learningProgress: LearningProgress;
  recommendedChallengeIds: string[];
  report: SessionReport;
  invariants: PracticeInvariantResult;
}
