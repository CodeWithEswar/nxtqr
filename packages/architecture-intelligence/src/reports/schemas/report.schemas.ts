import { z } from "zod";
import { ArchitectureDecisionRecordSchema } from "./adr.schemas";

export const ReportAudienceSchema = z.enum([
  "engineering",
  "technical_leadership",
  "architecture_review",
  "security_review",
  "operations",
  "executive_overview",
]);

export const ReportStatusSchema = z.enum(["draft", "verified", "published", "archived"]);

export const ReportEvidenceReferenceSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "node",
    "edge",
    "finding",
    "recommendation",
    "comparison",
    "capacity",
    "cost",
    "simulation",
    "adr",
    "doc",
  ]),
  title: z.string().min(1),
  sourceEngine: z.string().min(1),
  summary: z.string(),
  severity: z.enum(["critical", "high", "medium", "low", "info"]).optional(),
  elementId: z.string().optional(),
});

export const EvidenceReferenceSchema = ReportEvidenceReferenceSchema;

export const ReportSectionKindSchema = z.enum([
  "overview",
  "diagram",
  "components",
  "dependencies",
  "data_flows",
  "validation",
  "health",
  "bottlenecks",
  "spof",
  "security",
  "scalability",
  "reliability",
  "recommendations",
  "comparison",
  "capacity",
  "cost",
  "simulation",
  "adrs",
  "text",
]);

const BaseSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().optional(),
  evidenceIds: z.array(z.string()).optional(),
  isEnabled: z.boolean(),
  order: z.number().int().min(0),
});

export const OverviewSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("overview"),
  content: z.object({
    systemName: z.string(),
    description: z.string(),
    primaryPurpose: z.string(),
    subsystems: z.array(
      z.object({
        name: z.string(),
        description: z.string(),
        nodeCount: z.number().int(),
      })
    ),
    communicationPatterns: z.array(z.string()),
    criticalCapabilities: z.array(z.string()),
    keyAssumptions: z.array(z.string()),
  }),
});

export const DiagramSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("diagram"),
  content: z.object({
    scope: z.enum(["full", "subsystem", "boundary", "critical_path"]),
    subsystemId: z.string().optional(),
    svgContent: z.string(),
    nodeCount: z.number().int().min(0),
    edgeCount: z.number().int().min(0),
    viewportDimensions: z.object({
      width: z.number().min(0),
      height: z.number().min(0),
    }),
    legendItems: z.array(
      z.object({
        label: z.string(),
        description: z.string(),
        category: z.string().optional(),
      })
    ),
  }),
});

export const ComponentsSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("components"),
  content: z.object({
    totalComponents: z.number().int().min(0),
    categoryCounts: z.record(z.number().int()),
    components: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        type: z.string(),
        category: z.string(),
        subsystem: z.string().optional(),
        replicas: z.number().int().min(1),
        technology: z.string().optional(),
        configSummary: z.array(z.string()),
        findingsCount: z.number().int().min(0),
      })
    ),
  }),
});

export const DependenciesSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("dependencies"),
  content: z.object({
    totalDependencies: z.number().int().min(0),
    dependencies: z.array(
      z.object({
        id: z.string(),
        sourceId: z.string(),
        sourceLabel: z.string(),
        targetId: z.string(),
        targetLabel: z.string(),
        protocol: z.string().optional(),
        relationshipType: z.enum(["runtime", "containment", "annotation"]),
        criticality: z.enum(["critical", "high", "medium", "low"]),
        failureBehavior: z.string().optional(),
      })
    ),
  }),
});

export const DataFlowsSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("data_flows"),
  content: z.object({
    totalFlows: z.number().int().min(0),
    flows: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        pathNodeIds: z.array(z.string()),
        pathNodeLabels: z.array(z.string()),
        protocol: z.string(),
        crossesTrustBoundary: z.boolean(),
        description: z.string(),
      })
    ),
  }),
});

export const ValidationSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("validation"),
  content: z.object({
    status: z.enum(["valid", "warning", "error"]),
    errorCount: z.number().int().min(0),
    warningCount: z.number().int().min(0),
    findings: z.array(
      z.object({
        id: z.string(),
        ruleId: z.string(),
        severity: z.enum(["error", "warning"]),
        message: z.string(),
        affectedElements: z.array(z.string()),
        remediationSuggestion: z.string().optional(),
      })
    ),
  }),
});

export const HealthSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("health"),
  content: z.object({
    overallScore: z.number().min(0).max(100),
    status: z.enum(["healthy", "at_risk", "critical"]),
    pillarScores: z.object({
      reliability: z.number().min(0).max(100),
      scalability: z.number().min(0).max(100),
      security: z.number().min(0).max(100),
      performance: z.number().min(0).max(100),
      maintainability: z.number().min(0).max(100),
      operations: z.number().min(0).max(100),
    }),
    findingsCount: z.number().int().min(0),
    keyHighlights: z.array(z.string()),
  }),
});

export const BottlenecksSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("bottlenecks"),
  content: z.object({
    bottleneckCount: z.number().int().min(0),
    workloadScenarioId: z.string(),
    criticalPaths: z.array(
      z.object({
        pathId: z.string(),
        bottleneckNodeId: z.string(),
        bottleneckLabel: z.string(),
        throughputLimitRps: z.number().min(0),
        utilizationPercent: z.number().min(0),
        mitigationStrategy: z.string(),
      })
    ),
  }),
});

export const SpofSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("spof"),
  content: z.object({
    spofCount: z.number().int().min(0),
    criticalComponents: z.array(
      z.object({
        nodeId: z.string(),
        nodeLabel: z.string(),
        category: z.string(),
        blastRadiusScore: z.number().min(0),
        dependentNodesCount: z.number().int().min(0),
        redundancyStatus: z.string(),
        recommendedMitigation: z.string(),
      })
    ),
  }),
});

export const SecuritySectionSchema = BaseSectionSchema.extend({
  kind: z.literal("security"),
  content: z.object({
    trustBoundariesCount: z.number().int().min(0),
    exposedComponentsCount: z.number().int().min(0),
    unencryptedFlowsCount: z.number().int().min(0),
    topFindings: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        severity: z.enum(["critical", "high", "medium", "low"]),
        category: z.string(),
        description: z.string(),
        affectedNodeIds: z.array(z.string()),
        remediation: z.string(),
      })
    ),
  }),
});

export const ScalabilitySectionSchema = BaseSectionSchema.extend({
  kind: z.literal("scalability"),
  content: z.object({
    scalingConstraintsCount: z.number().int().min(0),
    horizontalScalingOptions: z.array(z.string()),
    verticalScalingOptions: z.array(z.string()),
    recommendedStrategies: z.array(
      z.object({
        title: z.string(),
        category: z.string(),
        impact: z.string(),
        tradeoffs: z.array(z.string()),
      })
    ),
  }),
});

export const ReliabilitySectionSchema = BaseSectionSchema.extend({
  kind: z.literal("reliability"),
  content: z.object({
    missingCircuitBreakersCount: z.number().int().min(0),
    missingRetriesCount: z.number().int().min(0),
    recoveryReadinessScore: z.number().min(0).max(100),
    resilienceFindings: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        category: z.string(),
        severity: z.enum(["critical", "high", "medium", "low"]),
        recommendation: z.string(),
      })
    ),
  }),
});

export const RecommendationsSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("recommendations"),
  content: z.object({
    totalRecommendations: z.number().int().min(0),
    criticalCount: z.number().int().min(0),
    highCount: z.number().int().min(0),
    items: z.array(
      z.object({
        id: z.string(),
        strategyId: z.string(),
        title: z.string(),
        priority: z.enum(["critical", "high", "medium", "low"]),
        feasibility: z.enum(["applicable", "conditional", "complex"]),
        summary: z.string(),
        prerequisites: z.array(z.string()),
        tradeoffs: z.array(z.string()),
      })
    ),
  }),
});

export const ComparisonSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("comparison"),
  content: z.object({
    baselineRevision: z.string(),
    candidateRevision: z.string(),
    addedComponentsCount: z.number().int().min(0),
    removedComponentsCount: z.number().int().min(0),
    modifiedComponentsCount: z.number().int().min(0),
    connectionChangesCount: z.number().int().min(0),
    netMonthlySavings: z.string().optional(),
    summary: z.string(),
    componentDiffs: z.array(
      z.object({
        nodeLabel: z.string(),
        changeType: z.enum(["added", "removed", "modified"]),
        details: z.string(),
      })
    ),
  }),
});

export const CapacitySectionSchema = BaseSectionSchema.extend({
  kind: z.literal("capacity"),
  content: z.object({
    scenarioName: z.string(),
    growthModel: z.string(),
    horizonMonths: z.number().int().min(1),
    baselineRps: z.number().min(0),
    projectedPeakRps: z.number().min(0),
    firstSaturationInterval: z.string().optional(),
    saturatedComponents: z.array(
      z.object({
        nodeLabel: z.string(),
        category: z.string(),
        saturationInterval: z.string(),
        headroomPercent: z.number(),
        scalingThresholdRps: z.number().min(0),
      })
    ),
  }),
});

export const CostSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("cost"),
  content: z.object({
    providerId: z.string(),
    currency: z.string(),
    totalMonthlyCost: z.string(),
    totalAnnualCost: z.string(),
    fixedMonthlyCost: z.string(),
    variableMonthlyCost: z.string(),
    unpricedResourcesCount: z.number().int().min(0),
    categoryBreakdown: z.record(z.string()),
    topSavingsOpportunities: z.array(
      z.object({
        title: z.string(),
        estimatedMonthlySavings: z.string(),
      })
    ),
  }),
});

export const SimulationSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("simulation"),
  content: z.object({
    scenarioName: z.string(),
    description: z.string(),
    durationMs: z.number().min(0),
    blastRadiusScore: z.number().min(0).max(100),
    unaffectedRatio: z.number().min(0).max(1),
    journeyStatusSummary: z.record(z.enum(["available", "degraded", "unavailable"])),
    cascadingFailureRisksCount: z.number().int().min(0),
    injections: z.array(
      z.object({
        targetId: z.string(),
        targetLabel: z.string(),
        type: z.string(),
        startMs: z.number().min(0),
        durationMs: z.number().min(0),
      })
    ),
    findings: z.array(
      z.object({
        severity: z.enum(["critical", "high", "medium", "low"]),
        title: z.string(),
        description: z.string(),
        mitigationRecommendation: z.string(),
      })
    ),
  }),
});

export const ADRsSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("adrs"),
  content: z.object({
    totalDecisions: z.number().int().min(0),
    adrs: z.array(ArchitectureDecisionRecordSchema),
  }),
});

export const TextSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("text"),
  content: z.object({
    markdownContent: z.string(),
    isAIAssisted: z.boolean().optional(),
    verifiedEvidenceIds: z.array(z.string()).optional(),
  }),
});

export const ReportSectionSchema = z.discriminatedUnion("kind", [
  OverviewSectionSchema,
  DiagramSectionSchema,
  ComponentsSectionSchema,
  DependenciesSectionSchema,
  DataFlowsSectionSchema,
  ValidationSectionSchema,
  HealthSectionSchema,
  BottlenecksSectionSchema,
  SpofSectionSchema,
  SecuritySectionSchema,
  ScalabilitySectionSchema,
  ReliabilitySectionSchema,
  RecommendationsSectionSchema,
  ComparisonSectionSchema,
  CapacitySectionSchema,
  CostSectionSchema,
  SimulationSectionSchema,
  ADRsSectionSchema,
  TextSectionSchema,
]);

export const ReportTemplateSchema = z.object({
  id: z.string().min(1),
  version: z.number().int().min(1),
  name: z.string().min(1),
  description: z.string(),
  intendedAudience: ReportAudienceSchema,
  requiredSections: z.array(ReportSectionKindSchema),
  optionalSections: z.array(ReportSectionKindSchema),
  defaultSectionOrder: z.array(ReportSectionKindSchema),
});

export const ArchitectureReportSchema = z.object({
  id: z.string().min(1),
  projectId: z.string().min(1),
  architectureId: z.string().min(1),
  sourceSnapshotId: z.string().min(1),
  graphRevision: z.string().min(1),
  templateId: z.string().min(1),
  templateVersion: z.number().int().min(1),
  audience: ReportAudienceSchema,
  title: z.string().min(1),
  subtitle: z.string().optional(),
  status: ReportStatusSchema,
  sections: z.array(ReportSectionSchema),
  evidence: z.array(EvidenceReferenceSchema),
  assumptions: z.array(z.string()),
  decisions: z.array(ArchitectureDecisionRecordSchema),
  generatedAt: z.string(),
  author: z.string().min(1),
  versionNumber: z.number().int().min(1),
  exportArtifacts: z.record(z.string()).optional(),
});

export const ReportVersionSchema = z.object({
  id: z.string().min(1),
  reportId: z.string().min(1),
  versionNumber: z.number().int().min(1),
  graphRevision: z.string().min(1),
  sourceSnapshotId: z.string().min(1),
  title: z.string().min(1),
  templateId: z.string().min(1),
  audience: ReportAudienceSchema,
  sectionCount: z.number().int().min(0),
  generatedAt: z.string(),
  author: z.string().min(1),
  changeSummary: z.string().optional(),
});

export const ReportExportFormatSchema = z.enum(["pdf", "markdown", "html", "json", "docx"]);

export const ReportExportOptionsSchema = z.object({
  format: ReportExportFormatSchema,
  pageSize: z.enum(["a4", "letter"]).optional(),
  orientation: z.enum(["portrait", "landscape"]).optional(),
  includeVectorDiagrams: z.boolean().optional(),
  includeCoverPage: z.boolean().optional(),
  includeTableOfContents: z.boolean().optional(),
  redactSensitiveData: z.boolean().optional(),
  theme: z.enum(["light", "dark", "print"]).optional(),
  customWatermark: z.string().optional(),
  metadata: z.record(z.string()).optional(),
});
