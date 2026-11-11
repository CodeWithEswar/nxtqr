/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Runtime Zod Validation Schemas
 */

import { z } from "zod";

export const MigrationProjectStatusSchema = z.enum([
  "draft",
  "planning",
  "in_review",
  "approved",
  "in_progress",
  "completed",
  "cancelled",
]);

export const MigrationTaskStatusSchema = z.enum([
  "planned",
  "ready",
  "in_progress",
  "blocked",
  "verification_pending",
  "completed",
  "cancelled",
]);

export const MigrationWaveStatusSchema = z.enum([
  "planned",
  "active",
  "completed",
  "rolled_back",
]);

export const MigrationStrategyIdSchema = z.enum([
  "rehost",
  "replatform",
  "refactor",
  "rearchitect",
  "replace",
  "retire",
  "retain",
  "strangler_fig",
  "parallel_run",
  "blue_green",
  "progressive_cutover",
]);

export const MigrationStrategySchema = z.object({
  id: MigrationStrategyIdSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  complexity: z.enum(["low", "medium", "high", "extreme"]),
  suitableScenarios: z.array(z.string()),
  tradeOffs: z.object({
    advantages: z.array(z.string()),
    disadvantages: z.array(z.string()),
  }),
  recommendedPatterns: z.array(z.string()),
});

export const MigrationRequirementCategorySchema = z.enum([
  "service_extraction",
  "database_migration",
  "api_replacement",
  "messaging_evolution",
  "network_routing",
  "infrastructure_modernization",
  "security_transition",
  "data_synchronization",
  "decommissioning",
]);

export const MigrationRequirementSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: MigrationRequirementCategorySchema,
  sourceNodeIds: z.array(z.string()),
  targetNodeIds: z.array(z.string()),
  affectedEdgeIds: z.array(z.string()).optional(),
  status: z.enum(["candidate", "accepted", "rejected", "in_progress", "verified"]),
  priority: z.enum(["critical", "high", "medium", "low"]),
  estimatedEffortHours: z.number().min(0),
  rationale: z.string().min(1),
});

export const MigrationDependencyTypeSchema = z.enum([
  "finish_to_start",
  "start_to_start",
  "verification_prerequisite",
  "data_prerequisite",
  "contract_prerequisite",
  "security_prerequisite",
  "infrastructure_prerequisite",
]);

export const MigrationDependencySchema = z.object({
  id: z.string().min(1),
  sourceTaskId: z.string().min(1),
  targetTaskId: z.string().min(1),
  dependencyType: MigrationDependencyTypeSchema,
  isBlocking: z.boolean(),
  rationale: z.string().optional(),
});

export const MigrationTaskTypeSchema = z.enum([
  "provision_infrastructure",
  "deploy_facade",
  "extract_service",
  "schema_expand",
  "backfill_data",
  "setup_dual_write",
  "reconcile_data",
  "route_canary",
  "route_full_cutover",
  "schema_contract",
  "decommission_legacy",
  "security_boundary_update",
  "verification_checkpoint",
]);

export const MigrationTaskSchema = z.object({
  id: z.string().min(1),
  waveId: z.string().min(1),
  requirementId: z.string().optional(),
  title: z.string().min(1),
  description: z.string().min(1),
  componentId: z.string().optional(),
  taskType: MigrationTaskTypeSchema,
  estimatedHours: z.number().min(0),
  dependsOnTaskIds: z.array(z.string()),
  verificationGateIds: z.array(z.string()),
  isPointOfNoReturn: z.boolean(),
  rollbackProcedure: z.string().min(1),
  status: MigrationTaskStatusSchema,
});

export const VerificationGateTypeSchema = z.enum([
  "manual_approval",
  "automated_evidence",
  "contract_verification",
  "data_reconciliation",
  "performance_benchmark",
  "security_audit",
  "reliability_slo",
]);

export const VerificationGateStatusSchema = z.enum([
  "passed",
  "failed",
  "unknown",
  "not_applicable",
]);

export const VerificationGateSchema = z.object({
  id: z.string().min(1),
  waveId: z.string().optional(),
  title: z.string().min(1),
  gateType: VerificationGateTypeSchema,
  status: VerificationGateStatusSchema,
  requiredEvidenceType: z.string().min(1),
  actualEvidenceId: z.string().optional(),
  evaluatorVersion: z.string().min(1),
  evaluatedAt: z.string().optional(),
  evaluationNotes: z.string(),
});

export const MigrationWaveSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  waveNumber: z.number().int().positive(),
  title: z.string().min(1),
  description: z.string().min(1),
  objective: z.string().min(1),
  taskIds: z.array(z.string()),
  targetIntermediateSnapshotId: z.string().optional(),
  prerequisites: z.array(z.string()),
  completionCriteria: z.array(z.string()),
  rollbackStrategy: z.string().min(1),
  riskIds: z.array(z.string()),
  verificationGateIds: z.array(z.string()),
  status: MigrationWaveStatusSchema,
});

export const IntermediateArchitectureSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  waveId: z.string().min(1),
  waveNumber: z.number().int().positive(),
  title: z.string().min(1),
  snapshot: z.any(),
  reachabilityVerified: z.boolean(),
  securityScore: z.number().min(0).max(100),
  availabilityScore: z.number().min(0).max(100),
  validationStatus: z.enum(["valid", "degraded", "blocked"]),
  validationNotes: z.array(z.string()),
});

export const CutoverTypeSchema = z.enum([
  "immediate",
  "weighted_shift",
  "canary",
  "blue_green",
  "regional",
  "tenant",
]);

export const TrafficShiftStepSchema = z.object({
  stepNumber: z.number().int().positive(),
  weightPercent: z.number().min(0).max(100),
  soakDurationMinutes: z.number().min(0),
  healthCriteria: z.string().min(1),
});

export const CutoverPlanSchema = z.object({
  id: z.string().min(1),
  waveId: z.string().min(1),
  cutoverType: CutoverTypeSchema,
  sourceTarget: z.string().min(1),
  destinationTarget: z.string().min(1),
  trafficScope: z.string().min(1),
  steps: z.array(TrafficShiftStepSchema),
  rollbackTriggers: z.array(z.string()),
  owner: z.string().min(1),
});

export const RollbackFeasibilityStatusSchema = z.enum([
  "fully_reversible",
  "partially_reversible",
  "irreversible",
  "unknown",
]);

export const RollbackPlanSchema = z.object({
  id: z.string().min(1),
  waveId: z.string().min(1),
  isFeasible: z.boolean(),
  feasibilityStatus: RollbackFeasibilityStatusSchema,
  rollbackTriggerConditions: z.array(z.string()),
  recoveryProcedureSteps: z.array(z.string()),
  dataReconciliationSteps: z.array(z.string()),
  trafficRestorationSteps: z.array(z.string()),
  pointOfNoReturnStepIndex: z.number().int().optional(),
  pointOfNoReturnWarning: z.string().optional(),
  responsibleOwner: z.string().min(1),
  notes: z.string(),
});

export const MigrationRiskCategorySchema = z.enum([
  "data_loss",
  "service_disruption",
  "contract_breakage",
  "dual_write_inconsistency",
  "latency_spike",
  "security_exposure",
  "rollback_failure",
]);

export const MigrationRiskSchema = z.object({
  id: z.string().min(1),
  waveId: z.string().min(1),
  affectedComponentIds: z.array(z.string()),
  failureMode: z.string().min(1),
  category: MigrationRiskCategorySchema,
  severity: z.enum(["critical", "high", "medium", "low"]),
  likelihood: z.enum(["high", "medium", "low"]),
  mitigationPlan: z.string().min(1),
  owner: z.string().min(1),
  status: z.enum(["identified", "mitigated", "accepted"]),
});

export const MigrationMilestoneSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  waveId: z.string().min(1),
  targetStateDescription: z.string().min(1),
  targetDate: z.string().optional(),
  isDelivered: z.boolean(),
});

export const MigrationEvolutionRoadmapSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  totalWaves: z.number().int().min(0),
  milestones: z.array(MigrationMilestoneSchema),
  criticalPathTaskIds: z.array(z.string()),
  estimatedTotalHours: z.number().min(0),
  hasScheduleGaps: z.boolean(),
});

export const MigrationDriftItemSchema = z.object({
  id: z.string().min(1),
  driftType: z.enum([
    "unplanned_change",
    "missing_prerequisite",
    "scope_creep",
    "contract_drift",
    "unmitigated_dependency",
  ]),
  description: z.string().min(1),
  severity: z.enum(["critical", "high", "medium", "low"]),
  detectedAt: z.string(),
});

export const MigrationDriftSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  baselineRevision: z.string().min(1),
  currentRevision: z.string().min(1),
  driftItems: z.array(MigrationDriftItemSchema),
  hasRegressions: z.boolean(),
  analyzedAt: z.string(),
});

export const MigrationProjectSchema = z.object({
  id: z.string().min(1),
  architectureId: z.string().min(1),
  title: z.string().min(1),
  description: z.string(),
  sourceRevisionId: z.string().min(1),
  targetRevisionId: z.string().min(1),
  strategyId: MigrationStrategyIdSchema,
  status: MigrationProjectStatusSchema,
  sourceSnapshot: z.any(),
  targetSnapshot: z.any(),
  waves: z.array(MigrationWaveSchema),
  tasks: z.array(MigrationTaskSchema),
  dependencies: z.array(MigrationDependencySchema),
  requirements: z.array(MigrationRequirementSchema),
  gates: z.array(VerificationGateSchema),
  cutoverPlans: z.array(CutoverPlanSchema),
  rollbackPlans: z.array(RollbackPlanSchema),
  risks: z.array(MigrationRiskSchema),
  intermediateStates: z.array(IntermediateArchitectureSchema),
  createdBy: z.string().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const MigrationAnalysisSummarySchema = z.object({
  totalRequirementsCount: z.number().int().min(0),
  acceptedRequirementsCount: z.number().int().min(0),
  totalTasksCount: z.number().int().min(0),
  totalWavesCount: z.number().int().min(0),
  completedTasksCount: z.number().int().min(0),
  blockedTasksCount: z.number().int().min(0),
  criticalRisksCount: z.number().int().min(0),
  highRisksCount: z.number().int().min(0),
  irreversibleWavesCount: z.number().int().min(0),
  passedGatesCount: z.number().int().min(0),
  failedGatesCount: z.number().int().min(0),
  unknownGatesCount: z.number().int().min(0),
  estimatedTotalEffortHours: z.number().min(0),
  hasBlockingIssues: z.boolean(),
});

export const MigrationAnalysisResultSchema = z.object({
  projectId: z.string().min(1),
  summary: MigrationAnalysisSummarySchema,
  project: MigrationProjectSchema,
  roadmap: MigrationEvolutionRoadmapSchema,
  drift: MigrationDriftSchema.optional(),
  analyzedAt: z.string(),
});

// CamelCase aliases
export const migrationAnalysisResultSchema = MigrationAnalysisResultSchema;
export const migrationProjectSchema = MigrationProjectSchema;
export const migrationWaveSchema = MigrationWaveSchema;
export const migrationTaskSchema = MigrationTaskSchema;
export const migrationRequirementSchema = MigrationRequirementSchema;

