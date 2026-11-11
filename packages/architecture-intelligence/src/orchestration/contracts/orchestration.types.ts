/**
 * NXTQR — Phase 05.3.29: Architecture Intelligence Orchestration & Unified Analysis Engine
 * Domain Contracts, Typed Specifications & Orchestration Models
 */

import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";

// 1. Analyzer Domain & Categories
export type AnalyzerCategory =
  | "foundation"
  | "risk"
  | "optimization"
  | "data"
  | "interface"
  | "operations"
  | "governance"
  | "evolution"
  | "quality";

export type ExecutionMode = "local" | "server";

export type AnalyzerExecutionStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "skipped"
  | "blocked"
  | "cached";

export type AssessmentCompleteness = "completed" | "partial" | "failed" | "cancelled";

// 2. Analyzer Definition & Contract
export interface AnalyzerDefinition {
  id: string;
  version: string;
  name: string;
  description: string;
  category: AnalyzerCategory;
  /** Explicit upstream analyzer IDs that must complete before this analyzer */
  dependencies: string[];
  /** Data elements required from context (e.g. "nodes", "edges", "evidence", "scenarios") */
  inputSelectors: string[];
  outputKinds: string[];
  executionMode: ExecutionMode;
  deterministic: boolean;
  timeoutMs: number;
  requiresEvidence?: boolean;
}

// 3. Normalized Findings
export type FindingSeverity = "critical" | "high" | "medium" | "low" | "informational";

export interface NormalizedFinding {
  id: string;
  sourceAnalyzerId: string;
  category: string;
  severity: FindingSeverity;
  title: string;
  description: string;
  affectedComponentIds: string[];
  evidenceIds: string[];
  confidence: "verified" | "modeled" | "assumed" | "unknown";
  remediationRecommendation?: string;
  fingerprint: string;
}

// 4. Normalized Evidence Reference
export interface NormalizedEvidenceReference {
  id: string;
  source: string;
  type: string;
  owner: string;
  observedAt: string;
  importedAt: string;
  contentHash: string;
  freshnessWindowHours: number;
  isVerified: boolean;
  metadata?: Record<string, any>;
}

// 5. Canonical Analysis Context
export interface OrchestrationConfiguration {
  maxConcurrency: number;
  overallTimeoutMs: number;
  enableCache: boolean;
  failFast: boolean;
}

export interface CanonicalAnalysisContext {
  projectId: string;
  architectureId: string;
  revisionId: string;
  revisionHash: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  graphIndex: GraphIndex;
  evidenceCatalog: NormalizedEvidenceReference[];
  scenarioInputs?: Record<string, any>;
  configuration: OrchestrationConfiguration;
  /** Shared findings dictionary populated progressively as upstream analyzers complete */
  sharedFindings: Map<string, NormalizedFinding[]>;
}

// 6. Analyzer Result Envelope
export interface AnalyzerResultEnvelope<T = any> {
  analyzerId: string;
  analyzerVersion: string;
  architectureRevisionId: string;
  status: "completed" | "partial" | "failed";
  output?: T;
  findings: NormalizedFinding[];
  evidenceIds: string[];
  durationMs: number;
  errorMessage?: string;
  executedAt: string;
}

// 7. Analyzer Execution Interface
export interface ArchitectureAnalyzer<TOutput = any> {
  definition: AnalyzerDefinition;
  analyze(
    context: CanonicalAnalysisContext,
    signal?: AbortSignal
  ): Promise<AnalyzerResultEnvelope<TOutput>>;
}

// 8. Execution Plan & Waves
export interface ExecutionWave {
  waveIndex: number;
  analyzerIds: string[];
}

export interface ExecutionPlan {
  id: string;
  architectureRevisionId: string;
  requestedAnalyzerIds: string[];
  resolvedExecutionOrder: string[];
  waves: ExecutionWave[];
  cachedAnalyzerIds: string[];
  totalEstimatedAnalyzers: number;
  createdAt: string;
}

// 9. Analyzer Run Record
export interface AnalyzerRunRecord {
  analyzerId: string;
  status: AnalyzerExecutionStatus;
  startedAt?: string;
  completedAt?: string;
  durationMs: number;
  findingsCount: number;
  errorMessage?: string;
  isCached: boolean;
}

// 10. Finding Correlation & Contradiction
export interface CorrelationGroup {
  id: string;
  title: string;
  primaryCategory: string;
  sharedComponentIds: string[];
  findingIds: string[];
  findingsCount: number;
  findings: NormalizedFinding[];
  candidateRootCause: string;
  recommendedUnifiedAction: string;
}

export type ContradictionType =
  | "topology_mismatch"
  | "redundancy_conflict"
  | "rto_verification_gap"
  | "security_boundary_conflict"
  | "scenario_assumption_conflict";

export interface ContradictionRecord {
  id: string;
  type: ContradictionType;
  description: string;
  involvedAnalyzerIds: string[];
  involvedFindingIds: string[];
  affectedComponentIds: string[];
  explanation: string;
  resolutionGuidance: string;
}

// 11. Unified Recommendation Item
export interface OrchestratedRecommendation {
  id: string;
  title: string;
  category: string;
  severity: FindingSeverity;
  description: string;
  affectedComponentIds: string[];
  correlatedFindingIds: string[];
  remediationSteps: string[];
  effort: "low" | "medium" | "high";
  prerequisiteRecommendationIds?: string[];
}

// 12. Complete Unified Architecture Assessment
export interface UnifiedArchitectureAssessment {
  id: string;
  architectureRevisionId: string;
  completenessStatus: AssessmentCompleteness;
  analyzersRun: number;
  analyzersCompleted: number;
  analyzersFailed: number;
  analyzersBlocked: number;
  analyzersCached: number;
  executionDurationMs: number;
  analyzerRuns: AnalyzerRunRecord[];
  totalFindingsCount: number;
  criticalFindingsCount: number;
  highFindingsCount: number;
  mediumFindingsCount: number;
  lowFindingsCount: number;
  findings: NormalizedFinding[];
  correlationGroups: CorrelationGroup[];
  contradictions: ContradictionRecord[];
  recommendations: OrchestratedRecommendation[];
  healthScore?: number;
  evaluatedAt: string;
}
