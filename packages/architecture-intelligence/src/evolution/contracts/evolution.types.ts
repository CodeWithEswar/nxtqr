/**
 * NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
 * Core Domain Contracts & Type Definitions
 */

import type { ArchitectureSnapshot } from "../../comparison/contracts/comparison.types";

// 1. Lifecycle Statuses
export type MigrationProjectStatus =
  | "draft"
  | "planning"
  | "in_review"
  | "approved"
  | "in_progress"
  | "completed"
  | "cancelled";

export type MigrationTaskStatus =
  | "planned"
  | "ready"
  | "in_progress"
  | "blocked"
  | "verification_pending"
  | "completed"
  | "cancelled";

export type MigrationWaveStatus =
  | "planned"
  | "active"
  | "completed"
  | "rolled_back";

// 2. Migration Strategies (The 7 R's + Modern Strangler & Cutover Patterns)
export type MigrationStrategyId =
  | "rehost"
  | "replatform"
  | "refactor"
  | "rearchitect"
  | "replace"
  | "retire"
  | "retain"
  | "strangler_fig"
  | "parallel_run"
  | "blue_green"
  | "progressive_cutover";

export interface MigrationStrategy {
  id: MigrationStrategyId;
  name: string;
  description: string;
  complexity: "low" | "medium" | "high" | "extreme";
  suitableScenarios: string[];
  tradeOffs: {
    advantages: string[];
    disadvantages: string[];
  };
  recommendedPatterns: string[];
}

// 3. Migration Requirements
export type MigrationRequirementCategory =
  | "service_extraction"
  | "database_migration"
  | "api_replacement"
  | "messaging_evolution"
  | "network_routing"
  | "infrastructure_modernization"
  | "security_transition"
  | "data_synchronization"
  | "decommissioning";

export interface MigrationRequirement {
  id: string;
  projectId: string;
  title: string;
  description: string;
  category: MigrationRequirementCategory;
  sourceNodeIds: string[];
  targetNodeIds: string[];
  affectedEdgeIds?: string[];
  status: "candidate" | "accepted" | "rejected" | "in_progress" | "verified";
  priority: "critical" | "high" | "medium" | "low";
  estimatedEffortHours: number;
  rationale: string;
}

// 4. Migration Dependencies & Prerequisite Graph
export type MigrationDependencyType =
  | "finish_to_start"
  | "start_to_start"
  | "verification_prerequisite"
  | "data_prerequisite"
  | "contract_prerequisite"
  | "security_prerequisite"
  | "infrastructure_prerequisite";

export interface MigrationDependency {
  id: string;
  sourceTaskId: string; // The prerequisite task
  targetTaskId: string; // The dependent task
  dependencyType: MigrationDependencyType;
  isBlocking: boolean;
  rationale?: string;
}

// 5. Migration Tasks
export type MigrationTaskType =
  | "provision_infrastructure"
  | "deploy_facade"
  | "extract_service"
  | "schema_expand"
  | "backfill_data"
  | "setup_dual_write"
  | "reconcile_data"
  | "route_canary"
  | "route_full_cutover"
  | "schema_contract"
  | "decommission_legacy"
  | "security_boundary_update"
  | "verification_checkpoint";

export interface MigrationTask {
  id: string;
  waveId: string;
  requirementId?: string;
  title: string;
  description: string;
  componentId?: string;
  taskType: MigrationTaskType;
  estimatedHours: number;
  dependsOnTaskIds: string[];
  verificationGateIds: string[];
  isPointOfNoReturn: boolean;
  rollbackProcedure: string;
  status: MigrationTaskStatus;
}

// 6. Verification Gates
export type VerificationGateType =
  | "manual_approval"
  | "automated_evidence"
  | "contract_verification"
  | "data_reconciliation"
  | "performance_benchmark"
  | "security_audit"
  | "reliability_slo";

export type VerificationGateStatus =
  | "passed"
  | "failed"
  | "unknown"
  | "not_applicable";

export interface VerificationGate {
  id: string;
  waveId?: string;
  title: string;
  gateType: VerificationGateType;
  status: VerificationGateStatus;
  requiredEvidenceType: string;
  actualEvidenceId?: string;
  evaluatorVersion: string;
  evaluatedAt?: string;
  evaluationNotes: string;
}

// 7. Migration Waves
export interface MigrationWave {
  id: string;
  projectId: string;
  waveNumber: number;
  title: string;
  description: string;
  objective: string;
  taskIds: string[];
  targetIntermediateSnapshotId?: string;
  prerequisites: string[]; // e.g. "Wave 1 complete", "Data backup verified"
  completionCriteria: string[];
  rollbackStrategy: string;
  riskIds: string[];
  verificationGateIds: string[];
  status: MigrationWaveStatus;
}

// 8. Intermediate Architecture Snapshots
export interface IntermediateArchitecture {
  id: string;
  projectId: string;
  waveId: string;
  waveNumber: number;
  title: string;
  snapshot: ArchitectureSnapshot;
  reachabilityVerified: boolean;
  securityScore: number;
  availabilityScore: number;
  validationStatus: "valid" | "degraded" | "blocked";
  validationNotes: string[];
}

// 9. Traffic Cutover Planning
export type CutoverType =
  | "immediate"
  | "weighted_shift"
  | "canary"
  | "blue_green"
  | "regional"
  | "tenant";

export interface TrafficShiftStep {
  stepNumber: number;
  weightPercent: number; // e.g. 5, 25, 50, 100
  soakDurationMinutes: number;
  healthCriteria: string;
}

export interface CutoverPlan {
  id: string;
  waveId: string;
  cutoverType: CutoverType;
  sourceTarget: string; // e.g. "legacy-monolith-billing"
  destinationTarget: string; // e.g. "microservice-billing-v2"
  trafficScope: string; // e.g. "GET /api/v1/billing/*"
  steps: TrafficShiftStep[];
  rollbackTriggers: string[]; // e.g. "Error rate > 1%", "P99 latency > 250ms"
  owner: string;
}

// 10. Rollback & Roll-Forward Planning
export type RollbackFeasibilityStatus =
  | "fully_reversible"
  | "partially_reversible"
  | "irreversible"
  | "unknown";

export interface RollbackPlan {
  id: string;
  waveId: string;
  isFeasible: boolean;
  feasibilityStatus: RollbackFeasibilityStatus;
  rollbackTriggerConditions: string[];
  recoveryProcedureSteps: string[];
  dataReconciliationSteps: string[];
  trafficRestorationSteps: string[];
  pointOfNoReturnStepIndex?: number;
  pointOfNoReturnWarning?: string;
  responsibleOwner: string;
  notes: string;
}

// 11. Migration Risk Registry
export type MigrationRiskCategory =
  | "data_loss"
  | "service_disruption"
  | "contract_breakage"
  | "dual_write_inconsistency"
  | "latency_spike"
  | "security_exposure"
  | "rollback_failure";

export interface MigrationRisk {
  id: string;
  waveId: string;
  affectedComponentIds: string[];
  failureMode: string;
  category: MigrationRiskCategory;
  severity: "critical" | "high" | "medium" | "low";
  likelihood: "high" | "medium" | "low";
  mitigationPlan: string;
  owner: string;
  status: "identified" | "mitigated" | "accepted";
}

// 12. Architecture Evolution Roadmap
export interface MigrationMilestone {
  id: string;
  title: string;
  waveId: string;
  targetStateDescription: string;
  targetDate?: string;
  isDelivered: boolean;
}

export interface MigrationEvolutionRoadmap {
  id: string;
  projectId: string;
  totalWaves: number;
  milestones: MigrationMilestone[];
  criticalPathTaskIds: string[];
  estimatedTotalHours: number;
  hasScheduleGaps: boolean;
}

// 13. Migration Drift Detection
export interface MigrationDriftItem {
  id: string;
  driftType:
    | "unplanned_change"
    | "missing_prerequisite"
    | "scope_creep"
    | "contract_drift"
    | "unmitigated_dependency";
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  detectedAt: string;
}

export interface MigrationDrift {
  id: string;
  projectId: string;
  baselineRevision: string;
  currentRevision: string;
  driftItems: MigrationDriftItem[];
  hasRegressions: boolean;
  analyzedAt: string;
}

// 14. Migration Project & Master Aggregate Result
export interface MigrationProject {
  id: string;
  architectureId: string;
  title: string;
  description: string;
  sourceRevisionId: string;
  targetRevisionId: string;
  strategyId: MigrationStrategyId;
  status: MigrationProjectStatus;
  sourceSnapshot: ArchitectureSnapshot;
  targetSnapshot: ArchitectureSnapshot;
  waves: MigrationWave[];
  tasks: MigrationTask[];
  dependencies: MigrationDependency[];
  requirements: MigrationRequirement[];
  gates: VerificationGate[];
  cutoverPlans: CutoverPlan[];
  rollbackPlans: RollbackPlan[];
  risks: MigrationRisk[];
  intermediateStates: IntermediateArchitecture[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface MigrationAnalysisSummary {
  totalRequirementsCount: number;
  acceptedRequirementsCount: number;
  totalTasksCount: number;
  totalWavesCount: number;
  completedTasksCount: number;
  blockedTasksCount: number;
  criticalRisksCount: number;
  highRisksCount: number;
  irreversibleWavesCount: number;
  passedGatesCount: number;
  failedGatesCount: number;
  unknownGatesCount: number;
  estimatedTotalEffortHours: number;
  hasBlockingIssues: boolean;
}

export interface MigrationAnalysisResult {
  projectId: string;
  summary: MigrationAnalysisSummary;
  project: MigrationProject;
  roadmap: MigrationEvolutionRoadmap;
  drift?: MigrationDrift;
  analyzedAt: string;
}
