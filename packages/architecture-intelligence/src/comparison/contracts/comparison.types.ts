import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { UnifiedEvidenceReference } from "../../recommendations/contracts/recommendations.types";
import type { WorkloadScenario } from "../../bottlenecks/contracts/bottleneck.types";
import type { HealthAssessmentReport } from "../../contracts/health.types";
import type { BottleneckReport } from "../../bottlenecks/contracts/bottleneck.types";
import type { FailureAnalysisReport } from "../../failure-analysis/contracts/failure.types";
import type { SecurityAnalysisReport } from "../../security-analysis/schemas/security.schemas";
import type { ScalabilityAnalysisReport } from "../../scalability/schemas/scalability.schemas";
import type { ReliabilityAnalysisReport } from "../../reliability/schemas/reliability.schemas";
import type { UnifiedRecommendationReport } from "../../recommendations/contracts/recommendations.types";

export type ChangeKind = "added" | "removed" | "modified" | "unchanged";
export type EntityType = "node" | "edge" | "configuration";

export type ChangeCategory =
  | "topology"
  | "configuration"
  | "dependency"
  | "deployment"
  | "security"
  | "reliability"
  | "scalability"
  | "capacity"
  | "data-flow"
  | "operational"
  | "visual-only";

export type RegressionClassification =
  | "supported-regression"
  | "potential-regression"
  | "insufficient-evidence";

export interface ArchitectureSnapshot {
  id: string;
  projectId?: string | null;
  architectureId?: string;
  title: string;
  revision: string;
  schemaVersion: number;
  nodes: BaseNode[];
  edges: BaseEdge[];
  metadata?: Record<string, unknown>;
  workloadScenario?: WorkloadScenario;
  createdAt: string;
  provenance: "current-draft" | "saved-version" | "what-if-proposal" | "imported" | "preset";
}

export interface FieldDelta {
  fieldPath: string;
  baselineValue?: unknown;
  candidateValue?: unknown;
  unit?: string;
  isNormalized?: boolean;
}

export interface ChangeImpact {
  directlyAffectedNodeIds: string[];
  indirectlyAffectedNodeIds: string[];
  affectedEdgeIds: string[];
  reliabilityImplications: string[];
  securityImplications: string[];
  scalabilityImplications: string[];
  capacityDeltaRps?: number;
}

export interface ArchitectureChange {
  id: string;
  kind: ChangeKind;
  entityType: EntityType;
  baselineId?: string;
  candidateId?: string;
  nodeType?: string;
  label?: string;
  changedFields: string[];
  fieldDeltas: FieldDelta[];
  categories: ChangeCategory[];
  impact: ChangeImpact;
  evidence: UnifiedEvidenceReference[];
}

export interface ArchitecturalRegression {
  id: string;
  ruleId: string;
  title: string;
  explanation: string;
  category: "security" | "reliability" | "scalability" | "resilience" | "capacity";
  severity: "critical" | "high" | "medium" | "low";
  classification: RegressionClassification;
  affectedNodeIds: string[];
  affectedEdgeIds: string[];
  evidence: UnifiedEvidenceReference[];
}

export interface HealthComparison {
  baselineScore: number;
  candidateScore: number;
  scoreDelta: number;
  introducedFindingCount: number;
  resolvedFindingCount: number;
}

export interface BottleneckComparison {
  baselineCriticalCount: number;
  candidateCriticalCount: number;
  resolvedBottlenecks: string[];
  newBottlenecks: string[];
  capacityHeadroomMultiplier: number;
}

export interface SpofComparison {
  baselineSpofCount: number;
  candidateSpofCount: number;
  eliminatedSpofNodeIds: string[];
  newSpofNodeIds: string[];
  blastRadiusDelta: number;
}

export interface SecurityComparison {
  baselineVulnerabilityCount: number;
  candidateVulnerabilityCount: number;
  resolvedSecurityIssues: string[];
  newSecurityRisks: string[];
  unprotectedExposureAdded: boolean;
}

export interface ScalabilityComparison {
  baselineHeadroomRps: number;
  candidateHeadroomRps: number;
  capacityGainRatio: number;
  newScalingConstraints: string[];
}

export interface ReliabilityComparison {
  baselineResilienceScore: number;
  candidateResilienceScore: number;
  newCascadingRisks: string[];
  resolvedCascadingRisks: string[];
  retryAmplificationEliminated: boolean;
}

export interface RecommendationComparison {
  newRecommendations: string[];
  resolvedRecommendations: string[];
  unchangedRecommendations: string[];
}

export interface EngineAnalysisComparison {
  health?: HealthComparison;
  bottlenecks?: BottleneckComparison;
  spof?: SpofComparison;
  security?: SecurityComparison;
  scalability?: ScalabilityComparison;
  reliability?: ReliabilityComparison;
  recommendations?: RecommendationComparison;
}

export interface ComparisonSummary {
  addedNodesCount: number;
  removedNodesCount: number;
  modifiedNodesCount: number;
  unchangedNodesCount: number;
  addedEdgesCount: number;
  removedEdgesCount: number;
  modifiedEdgesCount: number;
  configurationChangesCount: number;
  introducedFindingsCount: number;
  resolvedFindingsCount: number;
  regressionsCount: number;
  supportedRegressionsCount: number;
  keyTradeoffs: string[];
  overallAssessment: "improved" | "regressed" | "mixed" | "neutral";
}

export interface ArchitectureComparisonResult {
  id: string;
  baselineSnapshot: ArchitectureSnapshot;
  candidateSnapshot: ArchitectureSnapshot;
  changes: ArchitectureChange[];
  regressions: ArchitecturalRegression[];
  analysisComparison: EngineAnalysisComparison;
  summary: ComparisonSummary;
  comparedAt: string;
  isCompatibleScenarios: boolean;
  notes: string[];
}

export interface NodeMatchCandidate {
  baselineNodeId: string;
  candidateNodeId: string;
  confidence: "exact" | "high" | "heuristic" | "uncertain";
  similarityScore: number;
  matchCriteria: string[];
}

export interface MatchResolution {
  matchedNodePairs: Map<string, string>; // baselineNodeId -> candidateNodeId
  matchedEdgePairs: Map<string, string>; // baselineEdgeId -> candidateEdgeId
  unmatchedBaselineNodeIds: string[];
  unmatchedCandidateNodeIds: string[];
  unmatchedBaselineEdgeIds: string[];
  unmatchedCandidateEdgeIds: string[];
  uncertainNodeMatches: NodeMatchCandidate[];
}

export interface MultiEngineAnalysisBundle {
  health?: HealthAssessmentReport;
  bottlenecks?: BottleneckReport;
  spof?: FailureAnalysisReport;
  security?: SecurityAnalysisReport;
  scalability?: ScalabilityAnalysisReport;
  reliability?: ReliabilityAnalysisReport;
  recommendations?: UnifiedRecommendationReport;
}
