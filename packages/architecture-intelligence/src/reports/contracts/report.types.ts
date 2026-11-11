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
  kind: "node" | "edge" | "finding" | "recommendation" | "comparison" | "capacity" | "cost" | "simulation" | "observability" | "benchmark" | "deployment" | "lineage" | "api_contract" | "messaging" | "cache" | "governance" | "migration" | "adr" | "doc";
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
  | "simulation"
  | "observability"
  | "benchmark"
  | "deployment"
  | "lineage"
  | "api_contracts"
  | "messaging_systems"
  | "caching_and_state"
  | "database_architecture"
  | "network_and_traffic"
  | "governance_and_compliance"
  | "migration_and_evolution"
  | "operational_readiness_and_dr"
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

export interface SimulationSection extends BaseReportSection {
  kind: "simulation";
  content: {
    scenarioName: string;
    description: string;
    durationMs: number;
    blastRadiusScore: number;
    unaffectedRatio: number;
    journeyStatusSummary: Record<string, "available" | "degraded" | "unavailable">;
    cascadingFailureRisksCount: number;
    injections: Array<{
      targetId: string;
      targetLabel: string;
      type: string;
      startMs: number;
      durationMs: number;
    }>;
    findings: Array<{
      severity: "critical" | "high" | "medium" | "low";
      title: string;
      description: string;
      mitigationRecommendation: string;
    }>;
  };
}

export interface ObservabilitySection extends BaseReportSection {
  kind: "observability";
  content: {
    telemetrySource: string;
    totalMonitoredComponents: number;
    healthyCount: number;
    degradedCount: number;
    criticalCount: number;
    unknownCount: number;
    topologyDriftCount: number;
    topDriftFindings: Array<{
      type: string;
      title: string;
      severity: string;
      evidence: string;
    }>;
    observedVsModeledDeltas: Array<{
      componentLabel: string;
      observedRps?: number;
      modeledRps?: number;
      observedLatencyP95Ms?: number;
      modeledLatencyP95Ms?: number;
    }>;
  };
}

export interface BenchmarkSection extends BaseReportSection {
  kind: "benchmark";
  content: {
    testName: string;
    testType: string;
    workloadModel: string;
    environmentName: string;
    totalRequests: number;
    achievedRps: number;
    offeredRps: number;
    errorRatePct: number;
    p50LatencyMs: number;
    p90LatencyMs: number;
    p95LatencyMs: number;
    p99LatencyMs: number;
    droppedIterations: number;
    dataQualityScore: number;
    targetResults: Array<{
      targetName: string;
      metric: string;
      status: "passed" | "warn" | "failed" | "unknown";
      reason: string;
    }>;
    regressions: Array<{
      metric: string;
      delta: number;
      percentChange: number;
      severity: string;
      explanation: string;
    }>;
    calibrationProposals: Array<{
      componentLabel: string;
      parameterName: string;
      modeledValue: number;
      measuredValue: number;
      recommendedCalibration: number;
    }>;
  };
}

export interface DeploymentSection extends BaseReportSection {
  kind: "deployment";
  content: {
    environmentName: string;
    environmentCategory: string;
    totalResources: number;
    totalMappings: number;
    unmappedCount: number;
    multiAzScore: number;
    overallReliabilityScore: number;
    resources: Array<{
      id: string;
      name: string;
      type: string;
      provider: string;
      region?: string;
      zone?: string;
      cidr?: string;
    }>;
    failureDomains: Array<{
      name: string;
      type: string;
      riskLevel: string;
      description: string;
    }>;
    findings: Array<{
      title: string;
      severity: string;
      description: string;
      remediation: string;
    }>;
  };
}

export interface LineageSection extends BaseReportSection {
  kind: "lineage";
  content: {
    totalAssets: number;
    totalFlows: number;
    totalTransformations: number;
    retentionCoveragePct: number;
    privacyFindingsCount: number;
    assets: Array<{
      id: string;
      name: string;
      classificationLevel: string;
      categories: string[];
      storageCount: number;
      hasRetention: boolean;
    }>;
    privacyFindings: Array<{
      id: string;
      title: string;
      severity: string;
      category: string;
      remediation: string;
    }>;
    crossBorderTransfers: Array<{
      flowId: string;
      sourceComponent: string;
      destinationComponent: string;
      sourceCountry?: string;
      destinationCountry?: string;
      isThirdParty: boolean;
      recipientName?: string;
    }>;
  };
}

export interface APIContractsSection extends BaseReportSection {
  kind: "api_contracts";
  content: {
    totalContracts: number;
    totalOperations: number;
    totalConsumerDependencies: number;
    coveragePercentage: number;
    contracts: Array<{
      id: string;
      name: string;
      protocol: string;
      format: string;
      providerServiceId: string;
      lifecycleStatus: string;
      exposure: string;
      operationsCount: number;
    }>;
    breakingChanges: Array<{
      contractName: string;
      ruleId: string;
      explanation: string;
      affectedOperations: string[];
      affectedConsumers: string[];
      remediation: string;
    }>;
  };
}

export interface MessagingSystemsSection extends BaseReportSection {
  kind: "messaging_systems";
  content: {
    brokerCount: number;
    destinationCount: number;
    producerCount: number;
    consumerCount: number;
    consumerGroupCount: number;
    sagaCount: number;
    brokers: Array<{
      id: string;
      name: string;
      technology: string;
      clusterMode: string;
      isMultiRegion: boolean;
    }>;
    destinations: Array<{
      id: string;
      name: string;
      type: string;
      deliverySemantics: string;
      orderingScope: string;
      partitionCount?: number;
    }>;
    criticalFindingsCount: number;
    stormRiskCount: number;
    unboundedGrowthCount: number;
    uncompensatedSagasCount: number;
    findings: Array<{
      id: string;
      category: string;
      severity: string;
      title: string;
      explanation: string;
      remediation: string;
    }>;
  };
}

export interface CachingAndStateSection extends BaseReportSection {
  kind: "caching_and_state";
  content: {
    cacheLayerCount: number;
    sourceOfTruthCount: number;
    invalidationRuleCount: number;
    replicaGroupCount: number;
    stateOwnerCount: number;
    netOffloadPercentage: number;
    cacheLayers: Array<{
      id: string;
      name: string;
      cacheType: string;
      technology: string;
      strategy: string;
      tierOrder: number;
      allocatedMemoryMb: number;
      defaultTtlSeconds: number;
    }>;
    sourcesOfTruth: Array<{
      id: string;
      name: string;
      type: string;
      isAuthoritativeMaster: boolean;
    }>;
    criticalFindingsCount: number;
    stampedeRiskCount: number;
    staleReadRiskCount: number;
    unfencedLockCount: number;
    findings: Array<{
      id: string;
      category: string;
      severity: string;
      title: string;
      explanation: string;
      remediation: string;
    }>;
  };
}

export interface DatabaseArchitectureSection extends BaseReportSection {
  kind: "database_architecture";
  content: {
    assetCount: number;
    tableCount: number;
    indexCount: number;
    workloadCount: number;
    planCount: number;
    transactionCount: number;
    unindexedForeignKeysCount: number;
    redundantIndexCount: number;
    deadlockRiskCount: number;
    breakingMigrationCount: number;
    criticalFindingsCount: number;
    assets: Array<{
      id: string;
      name: string;
      family: string;
      technology: string;
      environment: string;
      maxConnectionsAllocated: number;
    }>;
    tables: Array<{
      id: string;
      name: string;
      columnCount: number;
      indexCount: number;
      estimatedRowCount: number;
      tableSizeBytes?: number;
    }>;
    storageForecast?: {
      currentTotalMb: number;
      projectedMonthlyGrowthMb: number;
      projectedSaturationMonths?: number;
      totalIopsModeled: number;
      iopsCapacitySaturationRatio: number;
    };
    keyFindings: Array<{
      id: string;
      severity: string;
      category: string;
      title: string;
      explanation: string;
      remediation: string;
    }>;
  };
}

export interface NetworkAndTrafficSection extends BaseReportSection {
  kind: "network_and_traffic";
  content: {
    dnsZoneCount: number;
    dnsRecordCount: number;
    cdnCount: number;
    loadBalancerCount: number;
    gatewayCount: number;
    routeCount: number;
    poolCount: number;
    boundaryCount: number;
    criticalFindingsCount: number;
    hasPlaintextExposure: boolean;
    hasRoutingLoops: boolean;
    hasBlackHoles: boolean;
    hasSingleIngressSpof: boolean;
    gateways: Array<{
      id: string;
      name: string;
      gatewayType: string;
      technology: string;
      routeCount: number;
      hasAuthRequired: boolean;
      hasRateLimiting: boolean;
    }>;
    routes: Array<{
      id: string;
      name: string;
      gatewayName: string;
      pathMatch: string;
      methods?: string[];
      targetUpstreamPoolId: string;
      hasTrafficSplit: boolean;
    }>;
    trafficPaths: Array<{
      id: string;
      scenarioName: string;
      hopCount: number;
      totalModeledLatencyMs: number;
      hasPlaintextHop: boolean;
      hasCrossRegionHop: boolean;
      isReachable: boolean;
    }>;
    keyFindings: Array<{
      id: string;
      severity: string;
      category: string;
      title: string;
      explanation: string;
      remediation: string;
    }>;
  };
}

export interface GovernanceAndComplianceSection extends BaseReportSection {
  kind: "governance_and_compliance";
  content: {
    totalPoliciesCount: number;
    activePoliciesCount: number;
    evaluatedRulesCount: number;
    passedCount: number;
    failedCount: number;
    unknownCount: number;
    notApplicableCount: number;
    criticalViolationsCount: number;
    activeExceptionsCount: number;
    expiredExceptionsCount: number;
    staleEvidenceCount: number;
    hasBlockingViolations: boolean;
    evaluations: Array<{
      policyId: string;
      policyTitle: string;
      category: string;
      severity: string;
      status: string;
      explanation: string;
      hasActiveException: boolean;
      exceptionId?: string;
    }>;
    activeExceptions: Array<{
      id: string;
      policyId: string;
      justification: string;
      expirationDate: string;
      status: string;
    }>;
    frameworkCoverage: Array<{
      frameworkName: string;
      controlsCount: number;
      supportStrength: string;
    }>;
    disclaimer: string;
  };
}

export interface MigrationAndEvolutionSection extends BaseReportSection {
  kind: "migration_and_evolution";
  content: {
    projectId: string;
    strategyId: string;
    strategyName: string;
    strategyComplexity: string;
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
    estimatedTotalEffortHours: number;
    hasBlockingIssues: boolean;
    waves: Array<{
      waveNumber: number;
      title: string;
      objective: string;
      tasksCount: number;
      status: string;
      rollbackStrategy: string;
      isIrreversible: boolean;
    }>;
    criticalPathTaskIds: string[];
    risks: Array<{
      id: string;
      category: string;
      severity: string;
      failureMode: string;
      mitigationPlan: string;
    }>;
    rollbackPlans: Array<{
      waveId: string;
      feasibilityStatus: string;
      isFeasible: boolean;
      warning?: string;
    }>;
  };
}

export interface OperationalReadinessAndDRSection extends BaseReportSection {
  kind: "operational_readiness_and_dr";
  content: {
    overallReadinessStatus: string;
    overallScorePercent: number;
    totalScenarios: number;
    totalRunbooks: number;
    tier1RunbookCoveragePercent: number;
    criticalPathSeconds: number;
    hasRecoveryCycles: boolean;
    dimensionScores: Array<{
      dimension: string;
      status: string;
      coveragePercent: number;
      note: string;
    }>;
    scenarios: Array<{
      id: string;
      title: string;
      category: string;
      severity: string;
      blastRadiusScore: number;
    }>;
    recoveryObjectives: Array<{
      serviceName: string;
      rtoTargetSeconds: number;
      rpoTargetSeconds: number;
      isRtoVerified: boolean;
      isRpoVerified: boolean;
    }>;
    findings: Array<{
      id: string;
      category: string;
      severity: string;
      title: string;
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
  | SimulationSection
  | ObservabilitySection
  | BenchmarkSection
  | DeploymentSection
  | LineageSection
  | APIContractsSection
  | MessagingSystemsSection
  | CachingAndStateSection
  | DatabaseArchitectureSection
  | NetworkAndTrafficSection
  | GovernanceAndComplianceSection
  | MigrationAndEvolutionSection
  | OperationalReadinessAndDRSection
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
