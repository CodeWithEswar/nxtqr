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
    "observability",
    "benchmark",
    "deployment",
    "lineage",
    "api_contract",
    "messaging",
    "cache",
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
  "observability",
  "benchmark",
  "deployment",
  "lineage",
  "api_contracts",
  "messaging_systems",
  "caching_and_state",
  "database_architecture",
  "network_and_traffic",
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

export const ObservabilitySectionSchema = BaseSectionSchema.extend({
  kind: z.literal("observability"),
  content: z.object({
    telemetrySource: z.string(),
    totalMonitoredComponents: z.number().int().min(0),
    healthyCount: z.number().int().min(0),
    degradedCount: z.number().int().min(0),
    criticalCount: z.number().int().min(0),
    unknownCount: z.number().int().min(0),
    topologyDriftCount: z.number().int().min(0),
    topDriftFindings: z.array(
      z.object({
        type: z.string(),
        title: z.string(),
        severity: z.string(),
        evidence: z.string(),
      })
    ),
    observedVsModeledDeltas: z.array(
      z.object({
        componentLabel: z.string(),
        observedRps: z.number().optional(),
        modeledRps: z.number().optional(),
        observedLatencyP95Ms: z.number().optional(),
        modeledLatencyP95Ms: z.number().optional(),
      })
    ),
  }),
});

export const BenchmarkSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("benchmark"),
  content: z.object({
    testName: z.string(),
    testType: z.string(),
    workloadModel: z.string(),
    environmentName: z.string(),
    totalRequests: z.number().nonnegative(),
    achievedRps: z.number().nonnegative(),
    offeredRps: z.number().nonnegative(),
    errorRatePct: z.number().nonnegative(),
    p50LatencyMs: z.number().nonnegative(),
    p90LatencyMs: z.number().nonnegative(),
    p95LatencyMs: z.number().nonnegative(),
    p99LatencyMs: z.number().nonnegative(),
    droppedIterations: z.number().nonnegative(),
    dataQualityScore: z.number().min(0).max(100),
    targetResults: z.array(
      z.object({
        targetName: z.string(),
        metric: z.string(),
        status: z.enum(["passed", "warn", "failed", "unknown"]),
        reason: z.string(),
      })
    ),
    regressions: z.array(
      z.object({
        metric: z.string(),
        delta: z.number(),
        percentChange: z.number(),
        severity: z.string(),
        explanation: z.string(),
      })
    ),
    calibrationProposals: z.array(
      z.object({
        componentLabel: z.string(),
        parameterName: z.string(),
        modeledValue: z.number(),
        measuredValue: z.number(),
        recommendedCalibration: z.number(),
      })
    ),
  }),
});

export const DeploymentSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("deployment"),
  content: z.object({
    environmentName: z.string(),
    environmentCategory: z.string(),
    totalResources: z.number().int().min(0),
    totalMappings: z.number().int().min(0),
    unmappedCount: z.number().int().min(0),
    multiAzScore: z.number().min(0).max(100),
    overallReliabilityScore: z.number().min(0).max(100),
    resources: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        provider: z.string(),
        region: z.string().optional(),
        zone: z.string().optional(),
        cidr: z.string().optional(),
      })
    ),
    failureDomains: z.array(
      z.object({
        name: z.string(),
        type: z.string(),
        riskLevel: z.string(),
        description: z.string(),
      })
    ),
    findings: z.array(
      z.object({
        title: z.string(),
        severity: z.string(),
        description: z.string(),
        remediation: z.string(),
      })
    ),
  }),
});

export const LineageSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("lineage"),
  content: z.object({
    totalAssets: z.number().int().min(0),
    totalFlows: z.number().int().min(0),
    totalTransformations: z.number().int().min(0),
    retentionCoveragePct: z.number().min(0).max(100),
    privacyFindingsCount: z.number().int().min(0),
    assets: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        classificationLevel: z.string(),
        categories: z.array(z.string()),
        storageCount: z.number().int().min(0),
        hasRetention: z.boolean(),
      })
    ),
    privacyFindings: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        severity: z.string(),
        category: z.string(),
        remediation: z.string(),
      })
    ),
    crossBorderTransfers: z.array(
      z.object({
        flowId: z.string(),
        sourceComponent: z.string(),
        destinationComponent: z.string(),
        sourceCountry: z.string().optional(),
        destinationCountry: z.string().optional(),
        isThirdParty: z.boolean(),
        recipientName: z.string().optional(),
      })
    ),
  }),
});

export const APIContractsSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("api_contracts"),
  content: z.object({
    totalContracts: z.number().int().min(0),
    totalOperations: z.number().int().min(0),
    totalConsumerDependencies: z.number().int().min(0),
    coveragePercentage: z.number().min(0).max(100),
    contracts: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        protocol: z.string(),
        format: z.string(),
        providerServiceId: z.string(),
        lifecycleStatus: z.string(),
        exposure: z.string(),
        operationsCount: z.number().int().min(0),
      })
    ),
    breakingChanges: z.array(
      z.object({
        contractName: z.string(),
        ruleId: z.string(),
        explanation: z.string(),
        affectedOperations: z.array(z.string()),
        affectedConsumers: z.array(z.string()),
        remediation: z.string(),
      })
    ),
  }),
});

export const MessagingSystemsSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("messaging_systems"),
  content: z.object({
    brokerCount: z.number().int().min(0),
    destinationCount: z.number().int().min(0),
    producerCount: z.number().int().min(0),
    consumerCount: z.number().int().min(0),
    consumerGroupCount: z.number().int().min(0),
    sagaCount: z.number().int().min(0),
    brokers: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        technology: z.string(),
        clusterMode: z.string(),
        isMultiRegion: z.boolean(),
      })
    ),
    destinations: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        deliverySemantics: z.string(),
        orderingScope: z.string(),
        partitionCount: z.number().int().optional(),
      })
    ),
    criticalFindingsCount: z.number().int().min(0),
    stormRiskCount: z.number().int().min(0),
    unboundedGrowthCount: z.number().int().min(0),
    uncompensatedSagasCount: z.number().int().min(0),
    findings: z.array(
      z.object({
        id: z.string(),
        category: z.string(),
        severity: z.string(),
        title: z.string(),
        explanation: z.string(),
        remediation: z.string(),
      })
    ),
  }),
});

export const CachingAndStateSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("caching_and_state"),
  content: z.object({
    cacheLayerCount: z.number().int().min(0),
    sourceOfTruthCount: z.number().int().min(0),
    invalidationRuleCount: z.number().int().min(0),
    replicaGroupCount: z.number().int().min(0),
    stateOwnerCount: z.number().int().min(0),
    netOffloadPercentage: z.number().min(0).max(100),
    cacheLayers: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        cacheType: z.string(),
        technology: z.string(),
        strategy: z.string(),
        tierOrder: z.number().int(),
        allocatedMemoryMb: z.number(),
        defaultTtlSeconds: z.number(),
      })
    ),
    sourcesOfTruth: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        type: z.string(),
        isAuthoritativeMaster: z.boolean(),
      })
    ),
    criticalFindingsCount: z.number().int().min(0),
    stampedeRiskCount: z.number().int().min(0),
    staleReadRiskCount: z.number().int().min(0),
    unfencedLockCount: z.number().int().min(0),
    findings: z.array(
      z.object({
        id: z.string(),
        category: z.string(),
        severity: z.string(),
        title: z.string(),
        explanation: z.string(),
        remediation: z.string(),
      })
    ),
  }),
});

export const DatabaseArchitectureSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("database_architecture"),
  content: z.object({
    assetCount: z.number().int().min(0),
    tableCount: z.number().int().min(0),
    indexCount: z.number().int().min(0),
    workloadCount: z.number().int().min(0),
    planCount: z.number().int().min(0),
    transactionCount: z.number().int().min(0),
    unindexedForeignKeysCount: z.number().int().min(0),
    redundantIndexCount: z.number().int().min(0),
    deadlockRiskCount: z.number().int().min(0),
    breakingMigrationCount: z.number().int().min(0),
    criticalFindingsCount: z.number().int().min(0),
    assets: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        family: z.string(),
        technology: z.string(),
        environment: z.string(),
        maxConnectionsAllocated: z.number().int().min(0),
      })
    ),
    tables: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        columnCount: z.number().int().min(0),
        indexCount: z.number().int().min(0),
        estimatedRowCount: z.number().int().min(0),
        tableSizeBytes: z.number().nonnegative().optional(),
      })
    ),
    storageForecast: z
      .object({
        currentTotalMb: z.number().nonnegative(),
        projectedMonthlyGrowthMb: z.number().nonnegative(),
        projectedSaturationMonths: z.number().positive().optional(),
        totalIopsModeled: z.number().nonnegative(),
        iopsCapacitySaturationRatio: z.number().nonnegative(),
      })
      .optional(),
    keyFindings: z.array(
      z.object({
        id: z.string(),
        severity: z.string(),
        category: z.string(),
        title: z.string(),
        explanation: z.string(),
        remediation: z.string(),
      })
    ),
  }),
});

export const NetworkAndTrafficSectionSchema = BaseSectionSchema.extend({
  kind: z.literal("network_and_traffic"),
  content: z.object({
    dnsZoneCount: z.number().int().min(0),
    dnsRecordCount: z.number().int().min(0),
    cdnCount: z.number().int().min(0),
    loadBalancerCount: z.number().int().min(0),
    gatewayCount: z.number().int().min(0),
    routeCount: z.number().int().min(0),
    poolCount: z.number().int().min(0),
    boundaryCount: z.number().int().min(0),
    criticalFindingsCount: z.number().int().min(0),
    hasPlaintextExposure: z.boolean(),
    hasRoutingLoops: z.boolean(),
    hasBlackHoles: z.boolean(),
    hasSingleIngressSpof: z.boolean(),
    gateways: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        gatewayType: z.string(),
        technology: z.string(),
        routeCount: z.number().int().min(0),
        hasAuthRequired: z.boolean(),
        hasRateLimiting: z.boolean(),
      })
    ),
    routes: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        gatewayName: z.string(),
        pathMatch: z.string(),
        methods: z.array(z.string()).optional(),
        targetUpstreamPoolId: z.string(),
        hasTrafficSplit: z.boolean(),
      })
    ),
    trafficPaths: z.array(
      z.object({
        id: z.string(),
        scenarioName: z.string(),
        hopCount: z.number().int().min(0),
        totalModeledLatencyMs: z.number().min(0),
        hasPlaintextHop: z.boolean(),
        hasCrossRegionHop: z.boolean(),
        isReachable: z.boolean(),
      })
    ),
    keyFindings: z.array(
      z.object({
        id: z.string(),
        severity: z.string(),
        category: z.string(),
        title: z.string(),
        explanation: z.string(),
        remediation: z.string(),
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
  ObservabilitySectionSchema,
  BenchmarkSectionSchema,
  DeploymentSectionSchema,
  LineageSectionSchema,
  APIContractsSectionSchema,
  MessagingSystemsSectionSchema,
  CachingAndStateSectionSchema,
  DatabaseArchitectureSectionSchema,
  NetworkAndTrafficSectionSchema,
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
