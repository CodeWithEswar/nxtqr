import type { ArchitectureDecisionRecord } from "./adr.types";

export type ReportAudience =
  | "engineering"
  | "technical_leadership"
  | "architecture_review"
  | "security_review"
  | "operations"
  | "executive_overview";

export type ReportStatus = "draft" | "verified" | "published" | "archived";

export interface EvidenceReference {
  id: string;
  kind: "node" | "edge" | "finding" | "recommendation" | "comparison" | "capacity" | "cost" | "adr" | "doc";
  title: string;
  sourceEngine: string;
  summary: string;
  severity?: "critical" | "high" | "medium" | "low" | "info";
  elementId?: string;
}

export type ReportEvidenceReference = EvidenceReference;

export type ReportSectionKind =
  | "overview"
  | "diagram"
  | "components"
  | "dependencies"
  | "data_flows"
  | "validation"
  | "health"
  | "bottlenecks"
  | "spof"
  | "security"
  | "scalability"
  | "reliability"
  | "recommendations"
  | "comparison"
  | "capacity"
  | "cost"
  | "adrs"
  | "text";

export interface BaseReportSection {
  id: string;
  kind: ReportSectionKind;
  title: string;
  description?: string;
  evidenceIds?: string[];
  isEnabled: boolean;
  order: number;
}

export interface OverviewSection extends BaseReportSection {
  kind: "overview";
  content: {
    systemName: string;
    description: string;
    primaryPurpose: string;
    subsystems: Array<{ name: string; description: string; nodeCount: number }>;
    communicationPatterns: string[];
    criticalCapabilities: string[];
    keyAssumptions: string[];
  };
}

export interface DiagramSection extends BaseReportSection {
  kind: "diagram";
  content: {
    scope: "full" | "subsystem" | "boundary" | "critical_path";
    subsystemId?: string;
    svgContent: string;
    nodeCount: number;
    edgeCount: number;
    viewportDimensions: { width: number; height: number };
    legendItems: Array<{ label: string; description: string; category?: string }>;
  };
}

export interface ComponentsSection extends BaseReportSection {
  kind: "components";
  content: {
    totalComponents: number;
    categoryCounts: Record<string, number>;
    components: Array<{
      id: string;
      label: string;
      type: string;
      category: string;
      subsystem?: string;
      replicas: number;
      technology?: string;
      configSummary: string[];
      findingsCount: number;
    }>;
  };
}

export interface DependenciesSection extends BaseReportSection {
  kind: "dependencies";
  content: {
    totalDependencies: number;
    dependencies: Array<{
      id: string;
      sourceId: string;
      sourceLabel: string;
      targetId: string;
      targetLabel: string;
      protocol?: string;
      relationshipType: "runtime" | "containment" | "annotation";
      criticality: "critical" | "high" | "medium" | "low";
      failureBehavior?: string;
    }>;
  };
}

export interface DataFlowsSection extends BaseReportSection {
  kind: "data_flows";
  content: {
    totalFlows: number;
    flows: Array<{
      id: string;
      name: string;
      pathNodeIds: string[];
      pathNodeLabels: string[];
      protocol: string;
      crossesTrustBoundary: boolean;
      description: string;
    }>;
  };
}

export interface ValidationSection extends BaseReportSection {
  kind: "validation";
  content: {
    status: "valid" | "warning" | "error";
    errorCount: number;
    warningCount: number;
    findings: Array<{
      id: string;
      ruleId: string;
      severity: "error" | "warning";
      message: string;
      affectedElements: string[];
      remediationSuggestion?: string;
    }>;
  };
}

export interface HealthSection extends BaseReportSection {
  kind: "health";
  content: {
    overallScore: number;
    status: "healthy" | "at_risk" | "critical";
    pillarScores: {
      reliability: number;
      scalability: number;
      security: number;
      performance: number;
      maintainability: number;
      operations: number;
    };
    findingsCount: number;
    keyHighlights: string[];
  };
}

export interface BottlenecksSection extends BaseReportSection {
  kind: "bottlenecks";
  content: {
    bottleneckCount: number;
    workloadScenarioId: string;
    criticalPaths: Array<{
      pathId: string;
      bottleneckNodeId: string;
      bottleneckLabel: string;
      throughputLimitRps: number;
      utilizationPercent: number;
      mitigationStrategy: string;
    }>;
  };
}

export interface SpofSection extends BaseReportSection {
  kind: "spof";
  content: {
    spofCount: number;
    criticalComponents: Array<{
      nodeId: string;
      nodeLabel: string;
      category: string;
      blastRadiusScore: number;
      dependentNodesCount: number;
      redundancyStatus: string;
      recommendedMitigation: string;
    }>;
  };
}

export interface SecuritySection extends BaseReportSection {
  kind: "security";
  content: {
    trustBoundariesCount: number;
    exposedComponentsCount: number;
    unencryptedFlowsCount: number;
    topFindings: Array<{
      id: string;
      title: string;
      severity: "critical" | "high" | "medium" | "low";
      category: string;
      description: string;
      affectedNodeIds: string[];
      remediation: string;
    }>;
  };
}

export interface ScalabilitySection extends BaseReportSection {
  kind: "scalability";
  content: {
    scalingConstraintsCount: number;
    horizontalScalingOptions: string[];
    verticalScalingOptions: string[];
    recommendedStrategies: Array<{
      title: string;
      category: string;
      impact: string;
      tradeoffs: string[];
    }>;
  };
}

export interface ReliabilitySection extends BaseReportSection {
  kind: "reliability";
  content: {
    missingCircuitBreakersCount: number;
    missingRetriesCount: number;
    recoveryReadinessScore: number;
    resilienceFindings: Array<{
      id: string;
      title: string;
      category: string;
      severity: "critical" | "high" | "medium" | "low";
      recommendation: string;
    }>;
  };
}

export interface RecommendationsSection extends BaseReportSection {
  kind: "recommendations";
  content: {
    totalRecommendations: number;
    criticalCount: number;
    highCount: number;
    items: Array<{
      id: string;
      strategyId: string;
      title: string;
      priority: "critical" | "high" | "medium" | "low";
      feasibility: "applicable" | "conditional" | "complex";
      summary: string;
      prerequisites: string[];
      tradeoffs: string[];
    }>;
  };
}

export interface ComparisonSection extends BaseReportSection {
  kind: "comparison";
  content: {
    baselineRevision: string;
    candidateRevision: string;
    addedComponentsCount: number;
    removedComponentsCount: number;
    modifiedComponentsCount: number;
    connectionChangesCount: number;
    netMonthlySavings?: string;
    summary: string;
    componentDiffs: Array<{
      nodeLabel: string;
      changeType: "added" | "removed" | "modified";
      details: string;
    }>;
  };
}

export interface CapacitySection extends BaseReportSection {
  kind: "capacity";
  content: {
    scenarioName: string;
    growthModel: string;
    horizonMonths: number;
    baselineRps: number;
    projectedPeakRps: number;
    firstSaturationInterval?: string;
    saturatedComponents: Array<{
      nodeLabel: string;
      category: string;
      saturationInterval: string;
      headroomPercent: number;
      scalingThresholdRps: number;
    }>;
  };
}

export interface CostSection extends BaseReportSection {
  kind: "cost";
  content: {
    providerId: string;
    currency: string;
    totalMonthlyCost: string;
    totalAnnualCost: string;
    fixedMonthlyCost: string;
    variableMonthlyCost: string;
    unpricedResourcesCount: number;
    categoryBreakdown: Record<string, string>;
    topSavingsOpportunities: Array<{
      title: string;
      estimatedMonthlySavings: string;
    }>;
  };
}

export interface ADRsSection extends BaseReportSection {
  kind: "adrs";
  content: {
    totalDecisions: number;
    adrs: ArchitectureDecisionRecord[];
  };
}

export interface TextSection extends BaseReportSection {
  kind: "text";
  content: {
    markdownContent: string;
    isAIAssisted?: boolean;
    verifiedEvidenceIds?: string[];
  };
}

export type ReportSection =
  | OverviewSection
  | DiagramSection
  | ComponentsSection
  | DependenciesSection
  | DataFlowsSection
  | ValidationSection
  | HealthSection
  | BottlenecksSection
  | SpofSection
  | SecuritySection
  | ScalabilitySection
  | ReliabilitySection
  | RecommendationsSection
  | ComparisonSection
  | CapacitySection
  | CostSection
  | ADRsSection
  | TextSection;

export interface ReportTemplate {
  id: string;
  version: number;
  name: string;
  description: string;
  intendedAudience: ReportAudience;
  requiredSections: ReportSectionKind[];
  optionalSections: ReportSectionKind[];
  defaultSectionOrder: ReportSectionKind[];
}

export interface ArchitectureReport {
  id: string;
  projectId: string;
  architectureId: string;
  sourceSnapshotId: string;
  graphRevision: string;
  templateId: string;
  templateVersion: number;
  audience: ReportAudience;
  title: string;
  subtitle?: string;
  status: ReportStatus;
  sections: ReportSection[];
  evidence: EvidenceReference[];
  assumptions: string[];
  decisions: ArchitectureDecisionRecord[];
  generatedAt: string;
  author: string;
  versionNumber: number;
  exportArtifacts?: Record<string, string>; // format -> artifactUrl or base64 key
}

export interface ReportVersion {
  id: string;
  reportId: string;
  versionNumber: number;
  graphRevision: string;
  sourceSnapshotId: string;
  title: string;
  templateId: string;
  audience: ReportAudience;
  sectionCount: number;
  generatedAt: string;
  author: string;
  changeSummary?: string;
}
