import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import type { ArchitectureDecisionRecord } from "./adr.types";
import type {
  ArchitectureReport,
  ReportAudience,
  ReportSectionKind,
} from "./report.types";

import type { HealthAssessmentReport } from "../../contracts/health.types";
import type { BottleneckReport } from "../../bottlenecks/contracts/bottleneck.types";
import type { FailureAnalysisReport } from "../../failure-analysis/contracts/failure.types";
import type { SecurityAnalysisReport } from "../../security-analysis/contracts/security.types";
import type { ReliabilityAnalysisReport } from "../../reliability/contracts/reliability.types";
import type { ScalabilityAnalysisReport } from "../../scalability/contracts/scalability.types";
import type { UnifiedRecommendationReport } from "../../recommendations/contracts/recommendations.types";
import type { ArchitectureComparisonResult } from "../../comparison/contracts/comparison.types";
import type { CapacityPlanningReport } from "../../capacity-planning/contracts/capacity.types";
import type { CostEstimate, CostOptimizationOpportunity } from "../../cost/contracts/cost.types";
import type { SimulationResult } from "../../simulation/contracts/simulation.types";
import type {
  ServiceHealthIndicator,
  TopologyDriftFinding,
  ObservedVsModeledComparison,
} from "../../observability/contracts/observability.types";
import type {
  BenchmarkRun,
  BenchmarkComparisonResult,
} from "../../performance/contracts/performance.types";
import type {
  DeploymentTopology,
  FailureDomainItem,
  TopologyValidationFinding,
} from "../../deployment/contracts/deployment.types";
import type { DeploymentReliabilityMetrics } from "../../deployment/analysis/deployment-reliability";
import type { ArchitectureDataLineageModel } from "../../lineage/contracts/lineage.types";

export interface ReportAnalysisContext {
  health?: HealthAssessmentReport;
  bottlenecks?: BottleneckReport;
  spof?: FailureAnalysisReport;
  security?: SecurityAnalysisReport;
  reliability?: ReliabilityAnalysisReport;
  scalability?: ScalabilityAnalysisReport;
  recommendations?: UnifiedRecommendationReport;
  comparison?: ArchitectureComparisonResult;
  capacity?: CapacityPlanningReport;
  cost?: CostEstimate;
  costOptimizations?: CostOptimizationOpportunity[];
  simulation?: SimulationResult;
  observability?: {
    sourceName?: string;
    healthIndicators: Record<string, ServiceHealthIndicator>;
    driftFindings: TopologyDriftFinding[];
    comparisons: ObservedVsModeledComparison[];
  };
  benchmark?: {
    run: BenchmarkRun;
    comparison?: BenchmarkComparisonResult;
  };
  deployment?: {
    topology: DeploymentTopology;
    failureDomains?: FailureDomainItem[];
    reliability?: DeploymentReliabilityMetrics;
    findings?: TopologyValidationFinding[];
  };
  lineage?: ArchitectureDataLineageModel;
}

export interface GenerateReportInput {
  id?: string;
  projectId: string;
  architectureId: string;
  sourceSnapshotId?: string;
  graphRevision?: string;
  title?: string;
  subtitle?: string;
  templateId?: string;
  audience?: ReportAudience;
  author?: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  decisions?: ArchitectureDecisionRecord[];
  assumptions?: string[];
  enabledSections?: ReportSectionKind[];
  analysisContext?: ReportAnalysisContext;
  diagramSvg?: string;
  versionNumber?: number;
}

export interface ReportValidationIssue {
  code: string;
  message: string;
  severity: "error" | "warning" | "info";
  sectionId?: string;
  sectionKind?: ReportSectionKind;
}

export interface ReportValidationResult {
  isValid: boolean;
  issues: ReportValidationIssue[];
  checkedSectionsCount: number;
  evidenceReferencesCount: number;
}

export interface RegenerateReportInput {
  existingReport: ArchitectureReport;
  nodes: BaseNode[];
  edges: BaseEdge[];
  newRevision?: string;
  changeSummary?: string;
  updatedAnalysisContext?: ReportAnalysisContext;
}
