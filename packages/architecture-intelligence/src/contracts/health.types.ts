import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { GraphValidationResult } from "@nxtqr/architecture-validation";

export type HealthDimension =
  | "reliability"
  | "scalability"
  | "security"
  | "performance"
  | "maintainability"
  | "operations";

export type HealthSeverity = "critical" | "high" | "medium" | "low" | "info";

export type HealthConfidence = "high" | "medium" | "low";

export type AssessmentStatus = "assessed" | "insufficient-evidence" | "not-assessed";

export type HealthGrade = "A" | "B" | "C" | "D" | "F" | "N/A";

export interface EvidenceReference {
  kind: "node" | "edge" | "property" | "boundary" | "capability" | "metric";
  elementId?: string;
  propertyKey?: string;
  expectedValue?: unknown;
  actualValue?: unknown;
  description: string;
}

export interface HealthRecommendation {
  id: string;
  title: string;
  description: string;
  dimension: HealthDimension;
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
  actionableStep: string;
  suggestedComponentTypes?: string[];
  suggestedConfigChanges?: Record<string, unknown>;
}

export interface HealthFinding {
  id: string;
  ruleId: string;
  dimension: HealthDimension;
  severity: HealthSeverity;
  title: string;
  explanation: string;
  evidence: EvidenceReference[];
  affectedNodeIds: string[];
  affectedEdgeIds: string[];
  assumptions: string[];
  confidence: HealthConfidence;
  recommendationIds: string[];
  documentationId?: string;
  deductionWeight?: number;
}

export interface DimensionAssessment {
  dimension: HealthDimension;
  status: AssessmentStatus;
  score: number | null; // 0-100 or null if insufficient evidence
  grade: HealthGrade;
  findings: HealthFinding[];
  findingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  evidenceCoveragePercent: number; // 0-100% of required architecture properties modeled
  summary: string;
  assumptionsEvaluated: string[];
  deductions: {
    reason: string;
    points: number;
    ruleId: string;
  }[];
}

export interface AssessmentMetrics {
  totalComponents: number;
  totalConnections: number;
  totalBoundaries: number;
  criticalPathsCount: number;
  cyclesDetectedCount: number;
  articulationPointsCount: number;
  executionTimeMs: number;
}

export interface HealthAssessmentReport {
  id: string;
  timestamp: string;
  graphRevision: string;
  rulesetVersion: string;
  scoringPolicyVersion: string;
  overallScore: number | null;
  overallGrade: HealthGrade;
  status: "assessed" | "insufficient-evidence" | "partial";
  dimensions: Record<HealthDimension, DimensionAssessment>;
  allFindings: HealthFinding[];
  findingsByNode: Record<string, HealthFinding[]>;
  findingsByEdge: Record<string, HealthFinding[]>;
  metrics: AssessmentMetrics;
  validationPassed: boolean;
  validationErrorsCount: number;
}

export interface ScoringPolicy {
  version: string;
  dimensionWeights: Record<HealthDimension, number>;
  severityDeductions: Record<HealthSeverity, number>;
  maxDeductionPerRule: number;
  minComponentsForScoring: number;
  confidenceMultipliers: Record<HealthConfidence, number>;
}

export interface AnalyzerContext {
  graphRevision: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  validationResult: GraphValidationResult;
  index: any; // GraphIndex
  scoringPolicy: ScoringPolicy;
  userAssumptions?: Record<string, unknown>;
}

export interface HealthAnalyzer {
  dimension: HealthDimension;
  name: string;
  description: string;
  analyze(context: AnalyzerContext): Promise<DimensionAssessment> | DimensionAssessment;
}
