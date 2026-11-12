import { z } from "zod";
import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import type {
  AnalysisNormalizedMetrics,
  AnalysisRevision,
  AnalysisRevisionDiff,
} from "../analysis/analysis-schemas";

// ========================
// 1. Core Enums & Metadata
// ========================

export const TEMPLATE_SCHEMA_VERSION = 1 as const;
export const SUPPORTED_TEMPLATE_SCHEMA_VERSIONS = [1, 2] as const;

export const TemplateDifficultySchema = z.enum([
  "beginner",
  "intermediate",
  "advanced",
  "expert",
]);
export type TemplateDifficulty = z.infer<typeof TemplateDifficultySchema>;

export const TemplateVisibilitySchema = z.enum([
  "system",
  "private",
  "workspace",
  "public",
]);
export type TemplateVisibility = z.infer<typeof TemplateVisibilitySchema>;

export const TemplatePublicationStatusSchema = z.enum([
  "DRAFT",
  "VALIDATING",
  "REJECTED",
  "READY",
  "PUBLISHED",
  "DEPRECATED",
]);
export type TemplatePublicationStatus = z.infer<
  typeof TemplatePublicationStatusSchema
>;

export const TemplateSourceSchema = z.enum([
  "builtin",
  "user",
  "workspace",
  "imported",
]);
export type TemplateSource = z.infer<typeof TemplateSourceSchema>;

export const TemplateCategoryIdSchema = z.enum([
  "foundational",
  "web-application",
  "backend",
  "database",
  "caching",
  "messaging",
  "event-driven",
  "microservices",
  "distributed-storage",
  "high-availability",
  "multi-region",
  "cloud-native",
  "security",
  "observability",
  "real-time",
  "data-platform",
  "ai-application",
  "ecommerce",
  "saas",
  "infrastructure",
]);
export type TemplateCategoryId = z.infer<typeof TemplateCategoryIdSchema>;

export interface TemplateCategoryDefinition {
  id: TemplateCategoryId;
  name: string;
  description: string;
  order: number;
}

export const TemplateScenarioCategorySchema = z.enum([
  "normal-traffic",
  "peak-traffic",
  "traffic-spike",
  "read-heavy",
  "write-heavy",
  "database-outage",
  "cache-outage",
  "network-partition",
  "queue-overload",
  "retry-storm",
  "node-failure",
  "regional-outage",
  "scaling-event",
  "deployment-failure",
  "security-attack",
  "disaster-recovery",
  "cost-optimization",
]);
export type TemplateScenarioCategory = z.infer<
  typeof TemplateScenarioCategorySchema
>;

// ========================
// 2. Requirements, Assumptions, Constraints & Explanations
// ========================

export const TemplateRequirementSchema = z.object({
  id: z.string().min(1),
  kind: z.enum([
    "functional",
    "nonfunctional",
    "workload",
    "data",
    "reliability",
    "security",
  ]),
  title: z.string().min(1),
  description: z.string().min(1),
  targetMetric: z.string().optional(),
});
export type TemplateRequirement = z.infer<typeof TemplateRequirementSchema>;

export const TemplateAssumptionSchema = z.object({
  id: z.string().min(1),
  statement: z.string().min(1),
  impact: z.string().min(1),
});
export type TemplateAssumption = z.infer<typeof TemplateAssumptionSchema>;

export const TemplateConstraintSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  maxLatencyMs: z.number().positive().optional(),
  minThroughputRps: z.number().positive().optional(),
  maxMonthlyCostUsd: z.number().positive().optional(),
  minAvailability: z.number().min(0.5).max(0.99999).optional(),
  maxRecoveryTimeSec: z.number().nonnegative().optional(),
  consistencyModel: z
    .enum(["strong", "eventual", "read-your-writes", "bounded-staleness"])
    .optional(),
  dataResidency: z.string().optional(),
});
export type TemplateConstraint = z.infer<typeof TemplateConstraintSchema>;

export const TemplateDesignDecisionSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  decision: z.string().min(1),
  rationale: z.string().min(1),
  tradeOffs: z.array(z.string().min(1)).min(1),
});
export type TemplateDesignDecision = z.infer<
  typeof TemplateDesignDecisionSchema
>;

export const TemplateAlternativeSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  advantages: z.array(z.string().min(1)).min(1),
  disadvantages: z.array(z.string().min(1)).min(1),
  complexityDelta: z.enum(["lower", "similar", "higher"]),
  performanceImpact: z.string().min(1),
  reliabilityImpact: z.string().min(1),
  costImpact: z.string().min(1),
});
export type TemplateAlternative = z.infer<typeof TemplateAlternativeSchema>;

export const TemplateComponentExplanationSchema = z.object({
  nodeId: z.string().min(1),
  componentType: z.string().min(1),
  responsibility: z.string().min(1),
  whyUsed: z.string().min(1),
  dataOwnership: z.string().min(1),
  scalingBehavior: z.string().min(1),
  failureBehavior: z.string().min(1),
  securityBoundary: z.string().optional(),
  relatedConcepts: z.array(z.string()).default([]),
});
export type TemplateComponentExplanation = z.infer<
  typeof TemplateComponentExplanationSchema
>;

// ========================
// 3. Topology, Nodes, Edges & Dependencies
// ========================

export const TemplateNodeConfigurationSchema = z.object({
  id: z.string().min(1),
  componentType: z.string().min(1),
  label: z.string().min(1).max(140),
  description: z.string().min(1).max(500),
  position: z.object({ x: z.number(), y: z.number() }),
  groupId: z.string().optional(),
  environment: z.string().default("production"),
  config: z.record(z.unknown()).default({}),
  analysisKind: z.enum([
    "gateway",
    "service",
    "database",
    "cache",
    "queue",
    "storage",
    "external",
  ]),
  analysisProfile: z.object({
    replicas: z.number().int().min(1).default(2),
    capacityPerReplicaRps: z.number().min(1).default(300),
    baseLatencyMs: z.number().min(0.5).default(10),
    maxConnectionsPerReplica: z.number().int().min(1).default(50),
    failureDomain: z
      .enum(["pod", "node", "az", "region", "global_shared"])
      .default("az"),
    region: z.string().default("us-east-1"),
    zone: z.string().default("us-east-1a"),
    multiAz: z.boolean().default(true),
    mtbfHours: z.number().min(1).default(2400),
    mttrMinutes: z.number().min(0.1).default(12),
    replicationMode: z.enum(["none", "sync", "async", "quorum"]).default("none"),
    replicationLagSec: z.number().min(0).default(0),
    cacheStrategy: z
      .enum([
        "none",
        "cache_aside",
        "read_through",
        "write_through",
        "write_behind",
      ])
      .default("none"),
    cacheHitRatio: z.number().min(0).max(0.99).default(0),
    monthlyCostPerReplicaUsd: z.number().min(0).default(55),
    hasBackup: z.boolean().default(true),
  }),
});
export type TemplateNodeConfiguration = z.infer<
  typeof TemplateNodeConfigurationSchema
>;

export const TemplateEdgeConfigurationSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  sourcePortId: z.string().optional(),
  targetPortId: z.string().optional(),
  label: z.string().min(1).max(120),
  protocol: z.string().default("HTTPS"),
  communicationMode: z
    .enum(["sync_http", "async_queue", "replication"])
    .default("sync_http"),
  retryFactor: z.number().min(1).max(5).default(1.1),
  edgeType: z.enum(["straight", "smoothstep", "bezier", "step"]).default("bezier"),
});
export type TemplateEdgeConfiguration = z.infer<
  typeof TemplateEdgeConfigurationSchema
>;

export const TemplateDependencySchema = z.object({
  fromNodeId: z.string().min(1),
  toNodeId: z.string().min(1),
  relationship: z.enum([
    "routes_to",
    "reads_from",
    "writes_to",
    "publishes_to",
    "subscribes_to",
    "replicates_to",
    "protects",
    "observes",
  ]),
  critical: z.boolean().default(true),
});
export type TemplateDependency = z.infer<typeof TemplateDependencySchema>;

export const TemplateLayoutMetadataSchema = z.object({
  direction: z.enum(["LR", "TB", "RL", "BT"]).default("LR"),
  useAutoLayout: z.boolean().default(false),
  groups: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        nodeIds: z.array(z.string().min(1)),
      })
    )
    .default([]),
  viewport: z.object({
    x: z.number().default(0),
    y: z.number().default(0),
    zoom: z.number().min(0.1).max(3).default(0.9),
  }),
});
export type TemplateLayoutMetadata = z.infer<typeof TemplateLayoutMetadataSchema>;

export interface TemplateTopology {
  nodes: TemplateNodeConfiguration[];
  edges: TemplateEdgeConfiguration[];
  dependencies: TemplateDependency[];
  layout: TemplateLayoutMetadata;
  resolvedNodes: BaseNode[];
  resolvedEdges: BaseEdge[];
  analysisRevision: AnalysisRevision;
}

// ========================
// 4. Simulation Scenarios & Walkthroughs
// ========================

export const ScenarioParameterSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  value: z.union([z.number(), z.string(), z.boolean()]),
  unit: z.string().optional(),
});
export type ScenarioParameter = z.infer<typeof ScenarioParameterSchema>;

export const ScenarioExpectedObservationSchema = z.object({
  id: z.string().min(1),
  metric: z.enum([
    "throughputRps",
    "p95LatencyMs",
    "errorRate",
    "availability",
    "dropRate",
    "queueDepth",
    "cacheHitRatio",
    "monthlyCostUsd",
    "criticalSpofCount",
    "recoveryTimeSec",
  ]),
  operator: z.enum(["lt", "lte", "gt", "gte", "between"]),
  targetValue: z.number(),
  upperValue: z.number().optional(),
  unit: z.string().optional(),
  description: z.string().min(1),
});
export type ScenarioExpectedObservation = z.infer<
  typeof ScenarioExpectedObservationSchema
>;

export const TemplateScenarioWorkloadSchema = z.object({
  workloadRps: z.number().positive().max(2_000_000),
  readWriteRatio: z.string().default("80:20"),
  routingPolicy: z
    .enum([
      "round_robin",
      "least_connections",
      "weighted",
      "consistent_hashing",
      "region_aware",
    ])
    .default("least_connections"),
  scalingMode: z.enum(["fixed", "hpa_reactive", "predictive"]).default("hpa_reactive"),
  maxReplicas: z.number().int().min(1).max(500).default(16),
});

export const TemplateScenarioFaultSchema = z.object({
  type: z.enum([
    "none",
    "node_down",
    "az_outage",
    "region_outage",
    "db_slowdown",
    "cache_flush",
    "queue_backlog",
    "network_partition",
    "retry_storm",
  ]),
  targetId: z.string().optional(),
  atMs: z.number().nonnegative().default(0),
});

export const TemplateScenarioSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  templateVersionId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  category: TemplateScenarioCategorySchema,
  durationMs: z.number().int().min(100).max(120_000),
  seed: z.number().int().nonnegative(),
  workloadConfig: TemplateScenarioWorkloadSchema,
  faultSchedule: z.array(TemplateScenarioFaultSchema).min(1),
  configurationOverrides: z
    .record(
      z.object({
        replicas: z.number().int().min(1).optional(),
        capacityPerReplicaRps: z.number().min(1).optional(),
        cacheHitRatio: z.number().min(0).max(0.99).optional(),
        multiAz: z.boolean().optional(),
      })
    )
    .default({}),
  parameters: z.array(ScenarioParameterSchema).default([]),
  expectedObservations: z.array(ScenarioExpectedObservationSchema).min(1),
  validationRuleIds: z.array(z.string().min(1)).default([]),
});
export type TemplateScenario = z.infer<typeof TemplateScenarioSchema>;

export interface ScenarioObservationComparison {
  observationId: string;
  metric: ScenarioExpectedObservation["metric"];
  description: string;
  expectedSummary: string;
  observedValue: number | null;
  status: "matched" | "deviated" | "unsupported";
  detail: string;
}

export interface TemplateScenarioExecutionResult {
  scenarioId: string;
  templateId: string;
  templateVersion: string;
  seed: number;
  deterministicHash: string;
  durationMs: number;
  supportedCapabilities: string[];
  unsupportedCapabilities: string[];
  summary: AnalysisNormalizedMetrics;
  queueDepthPeak: number;
  effectiveCacheHitRatio: number;
  recoveryTimeSec: number;
  observations: ScenarioObservationComparison[];
  allExpectedMatched: boolean;
}

export const WalkthroughStepTypeSchema = z.enum([
  "focus-component",
  "highlight-connection",
  "explain-request-flow",
  "explain-data-flow",
  "inspect-configuration",
  "run-simulation",
  "inject-fault",
  "inspect-metric",
  "answer-question",
  "compare-alternatives",
]);
export type WalkthroughStepType = z.infer<typeof WalkthroughStepTypeSchema>;

export const WalkthroughStepSchema = z.object({
  id: z.string().min(1),
  order: z.number().int().min(1),
  type: WalkthroughStepTypeSchema,
  title: z.string().min(1),
  explanation: z.string().min(1),
  accessibilitySummary: z.string().min(1),
  focusNodeId: z.string().optional(),
  highlightEdgeId: z.string().optional(),
  scenarioId: z.string().optional(),
  metricKey: z.string().optional(),
  promptQuestion: z.string().optional(),
  suggestedAnswer: z.string().optional(),
});
export type WalkthroughStep = z.infer<typeof WalkthroughStepSchema>;

export const GuidedWalkthroughSchema = z.object({
  id: z.string().min(1),
  templateVersionId: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  steps: z.array(WalkthroughStepSchema).min(2).max(40),
});
export type GuidedWalkthrough = z.infer<typeof GuidedWalkthroughSchema>;

export interface WalkthroughProgressState {
  walkthroughId: string;
  templateId: string;
  currentStepIndex: number;
  completedStepIds: string[];
  selectedNodeId?: string;
  selectedEdgeId?: string;
  timelinePositionMs: number;
  status: "idle" | "in_progress" | "completed" | "exited";
}

// ========================
// 5. Manifest, Template, Versioning & Publication
// ========================

export const ArchitectureTemplateManifestSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  slug: z
    .string()
    .min(2)
    .max(96)
    .regex(/^[a-z0-9-]+$/),
  title: z.string().min(3).max(160),
  summary: z.string().min(10).max(400),
  description: z.string().min(20).max(4000),
  categoryIds: z.array(TemplateCategoryIdSchema).min(1),
  conceptIds: z.array(z.string().min(1)).min(1),
  difficulty: TemplateDifficultySchema,
  estimatedLearningMinutes: z.number().int().min(5).max(180),
  architectureRevisionId: z.string().min(1),
  scenarioIds: z.array(z.string().min(1)).min(1),
  walkthroughIds: z.array(z.string().min(1)).min(1),
  requirements: z.array(TemplateRequirementSchema).min(2),
  assumptions: z.array(TemplateAssumptionSchema).min(1),
  visibility: TemplateVisibilitySchema,
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
});
export type ArchitectureTemplateManifest = z.infer<
  typeof ArchitectureTemplateManifestSchema
>;

export interface TemplatePermission {
  ownerId: string;
  workspaceId?: string | null;
  visibility: TemplateVisibility;
  canView: boolean;
  canEdit: boolean;
  canPublish: boolean;
  canDelete: boolean;
  canExport: boolean;
  canShareToWorkspace: boolean;
}

export interface TemplatePublication {
  status: TemplatePublicationStatus;
  publishedAtIso?: string;
  deprecatedAtIso?: string;
  deprecationReason?: string;
  qualityGatePassed: boolean;
  validationErrors: string[];
  validationWarnings: string[];
}

export interface TemplateVersion {
  id: string;
  templateId: string;
  version: string;
  changelog: string;
  immutable: boolean;
  contentHash: string;
  createdAtIso: string;
  status: TemplatePublicationStatus;
}

export interface ArchitectureTemplate {
  manifest: ArchitectureTemplateManifest;
  source: TemplateSource;
  ownerId: string;
  workspaceId?: string | null;
  publication: TemplatePublication;
  versionRecord: TemplateVersion;
  createdAtIso: string;
  updatedAtIso: string;

  // Five Core Educational Pillars
  problemSolved: string;
  learningObjectives: string[];
  requestFlowSummary: string;
  dataFlowSummary: string;
  consistencyGuarantees: string;
  failureBehaviorSummary: string;
  securityBoundariesSummary: string;
  operationalLimitations: string[];
  tradeOffsSummary: string[];

  constraints: TemplateConstraint[];
  componentExplanations: TemplateComponentExplanation[];
  designDecisions: TemplateDesignDecision[];
  alternatives: TemplateAlternative[];

  topology: TemplateTopology;
  scenarios: TemplateScenario[];
  walkthroughs: GuidedWalkthrough[];

  simulationCapabilities: string[];
  unsupportedCapabilities: string[];

  relatedTemplateIds: string[];
  relatedChallengeIds: string[];
  relatedLabIds: string[];
  learningPathIds: string[];
  sourceAttribution?: {
    sourceTemplateId: string;
    sourceTemplateSlug: string;
    sourceTemplateVersion: string;
  };
}

// ========================
// 6. Instantiation, Variants, Comparison & Import/Export
// ========================

export interface TemplateInstantiation {
  instantiationId: string;
  idempotencyKey?: string;
  templateId: string;
  templateVersionId: string;
  templateVersion: string;
  targetProjectId: string;
  targetDocumentId: string;
  architectureRevisionId: string;
  createdByUserId: string;
  createdAtIso: string;
  sourceAttribution: {
    sourceTemplateId: string;
    sourceTemplateSlug: string;
    sourceTemplateTitle: string;
    sourceTemplateVersion: string;
    sourceContentHash: string;
  };
  nodes: BaseNode[];
  edges: BaseEdge[];
  analysisRevision: AnalysisRevision;
}

export interface TemplateVariant {
  variantId: string;
  name: string;
  baseTemplateId: string;
  baseTemplateVersion: string;
  ownerId: string;
  createdAtIso: string;
  updatedAtIso: string;
  nodes: BaseNode[];
  edges: BaseEdge[];
  analysisRevision: AnalysisRevision;
}

export interface TemplateDiffReport {
  addedNodes: string[];
  removedNodes: string[];
  changedNodes: Array<{ nodeId: string; changes: string[] }>;
  addedEdges: string[];
  removedEdges: string[];
  revisionDiff: AnalysisRevisionDiff;
}

export interface TemplateComparison {
  baselineLabel: string;
  candidateLabel: string;
  diff: TemplateDiffReport;
  baselineMetrics?: AnalysisNormalizedMetrics;
  candidateMetrics?: AnalysisNormalizedMetrics;
  performanceDeltaPct?: number;
  costDeltaUsd?: number;
  reliabilityDelta?: number;
  complexityDelta: number;
  summary: string;
}

export interface TemplateExport {
  exportSchemaVersion: 1 | 2;
  exportedAtIso: string;
  integrityHash: string;
  manifest: ArchitectureTemplateManifest;
  educationalMetadata: {
    problemSolved: string;
    learningObjectives: string[];
    requestFlowSummary: string;
    dataFlowSummary: string;
    consistencyGuarantees: string;
    failureBehaviorSummary: string;
    securityBoundariesSummary: string;
    operationalLimitations: string[];
    tradeOffsSummary: string[];
    constraints: TemplateConstraint[];
    componentExplanations: TemplateComponentExplanation[];
    designDecisions: TemplateDesignDecision[];
    alternatives: TemplateAlternative[];
    relatedTemplateIds: string[];
    relatedChallengeIds: string[];
    relatedLabIds: string[];
  };
  topology: {
    nodes: TemplateNodeConfiguration[];
    edges: TemplateEdgeConfiguration[];
    dependencies: TemplateDependency[];
    layout: TemplateLayoutMetadata;
  };
  scenarios: TemplateScenario[];
  walkthroughs: GuidedWalkthrough[];
}

export interface TemplateImportPreview {
  valid: boolean;
  migratedFromVersion?: number;
  title: string;
  slug: string;
  nodeCount: number;
  edgeCount: number;
  scenarioCount: number;
  walkthroughCount: number;
  validationErrors: string[];
  compatibilityWarnings: string[];
}

export interface TemplateImportResult {
  accepted: boolean;
  idempotentReplay: boolean;
  preview: TemplateImportPreview;
  template?: ArchitectureTemplate;
}

export interface TemplateValidationResult {
  valid: boolean;
  publicationStatus: TemplatePublicationStatus;
  errors: string[];
  warnings: string[];
  unsupportedCapabilities: string[];
  missingReferences: string[];
  checks: {
    manifestValid: boolean;
    schemaValid: boolean;
    topologyValid: boolean;
    configsValid: boolean;
    scenariosValid: boolean;
    walkthroughsValid: boolean;
    simulationCompatible: boolean;
    qualityGatePassed: boolean;
  };
}

// ========================
// 7. Learning Paths, Search & Runtime State
// ========================

export interface TemplateLearningPath {
  id: string;
  title: string;
  description: string;
  difficulty: TemplateDifficulty;
  prerequisitePathIds: string[];
  orderedTemplateIds: string[];
  requiredWalkthroughIds: string[];
  recommendedLabIds: string[];
  relatedChallengeIds: string[];
}

export interface TemplateSearchQuery {
  query?: string;
  categoryId?: TemplateCategoryId | "all";
  difficulty?: TemplateDifficulty | "all";
  patternConcept?: string;
  componentType?: string;
  simulationCapability?: string;
  maxLearningMinutes?: number;
  ownership?: "all" | "system" | "personal" | "workspace";
  completionFilter?: "all" | "completed" | "incomplete";
  completedTemplateIds?: string[];
  sortBy?: "recommended" | "recent" | "alphabetical" | "difficulty" | "duration";
  offset?: number;
  limit?: number;
  userId?: string;
  workspaceIds?: string[];
}

export interface TemplateSearchResult {
  items: ArchitectureTemplateManifest[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export interface TemplateUsageMetrics {
  templateId: string;
  opensCount: number;
  instantiationsCount: number;
  scenarioRunsCount: number;
  walkthroughCompletionsCount: number;
  labLaunchesCount: number;
}

export interface TemplateScenarioRunInput {
  id: string;
  templateId: string;
  templateVersion?: string;
  scenarioId: string;
  walkthroughId?: string;
  walkthroughStepIndex?: number;
  seed?: number;
  instantiateIntoProjectId?: string;
  variantComponentOverrides?: Array<{
    componentId: string;
    replicas?: number;
    capacityPerReplicaRps?: number;
    cacheHitRatio?: number;
  }>;
  userId?: string;
}

export interface TemplateInvariantResult {
  passed: boolean;
  violations: Array<{
    code: string;
    message: string;
    severity: "warning" | "critical";
  }>;
}

export interface ModeledTemplateRuntimeState {
  runId: string;
  template: ArchitectureTemplate;
  validation: TemplateValidationResult;
  activeScenario: TemplateScenario;
  scenarioResult: TemplateScenarioExecutionResult;
  walkthrough: GuidedWalkthrough;
  walkthroughProgress: WalkthroughProgressState;
  instantiation?: TemplateInstantiation;
  comparisonWithBaseline?: TemplateComparison;
  invariants: TemplateInvariantResult;
}
