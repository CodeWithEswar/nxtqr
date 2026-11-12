import { z } from "zod";

// ========================
// Core Enums & Config Schemas
// ========================

export const AnalysisComponentKindSchema = z.enum([
  "gateway",
  "service",
  "database",
  "cache",
  "queue",
  "storage",
  "external",
]);
export type AnalysisComponentKind = z.infer<typeof AnalysisComponentKindSchema>;

export const AnalysisFailureDomainLevelSchema = z.enum([
  "pod",
  "node",
  "az",
  "region",
  "global_shared",
]);
export type AnalysisFailureDomainLevel = z.infer<
  typeof AnalysisFailureDomainLevelSchema
>;

export const AnalysisComponentConfigSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  kind: AnalysisComponentKindSchema,
  failureDomain: AnalysisFailureDomainLevelSchema.default("az"),
  region: z.string().default("us-east-1"),
  zone: z.string().default("us-east-1a"),
  multiAz: z.boolean().default(false),
  replicas: z.number().int().min(1).default(2),
  capacityPerReplicaRps: z.number().min(1).default(150),
  baseLatencyMs: z.number().min(0.5).default(15),
  maxConnectionsPerReplica: z.number().int().min(1).default(40),
  mtbfHours: z.number().min(1).default(2000),
  mttrMinutes: z.number().min(0.1).default(15),
  replicationMode: z.enum(["none", "sync", "async", "quorum"]).default("none"),
  replicationLagSec: z.number().min(0).default(0),
  cacheStrategy: z
    .enum(["none", "cache_aside", "read_through", "write_through", "write_behind"])
    .default("none"),
  cacheHitRatio: z.number().min(0).max(0.99).default(0),
  monthlyCostPerReplicaUsd: z.number().min(0).default(45),
  hasBackup: z.boolean().default(true),
  dependencyIds: z.array(z.string()).default([]),
});
export type AnalysisComponentConfig = z.infer<
  typeof AnalysisComponentConfigSchema
>;

export const AnalysisEdgeConfigSchema = z.object({
  id: z.string().min(1),
  source: z.string().min(1),
  target: z.string().min(1),
  communicationMode: z
    .enum(["sync_http", "async_queue", "replication"])
    .default("sync_http"),
  retryFactor: z.number().min(1).max(5).default(1),
});
export type AnalysisEdgeConfig = z.infer<typeof AnalysisEdgeConfigSchema>;

export const AnalysisRevisionSchema = z.object({
  revisionId: z.string().min(1),
  contentHash: z.string().default(""),
  label: z.string().min(1),
  parentRevisionId: z.string().optional(),
  routingPolicy: z
    .enum([
      "round_robin",
      "least_connections",
      "weighted",
      "consistent_hashing",
      "region_aware",
    ])
    .default("least_connections"),
  scalingMode: z
    .enum(["fixed", "hpa_reactive", "predictive"])
    .default("hpa_reactive"),
  maxReplicas: z.number().int().min(1).default(20),
  components: z.array(AnalysisComponentConfigSchema).min(1),
  edges: z.array(AnalysisEdgeConfigSchema).default([]),
});
export type AnalysisRevision = z.infer<typeof AnalysisRevisionSchema>;

export const AnalysisConstraintSchema = z.object({
  id: z.string().min(1),
  label: z.string(),
  maxP95LatencyMs: z.number().min(5).optional(),
  minAvailability: z.number().min(0.5).max(0.99999).optional(),
  maxMonthlyCostUsd: z.number().min(1).optional(),
  maxRtoSec: z.number().min(1).optional(),
  zeroDataLossRequired: z.boolean().default(false),
});
export type AnalysisConstraint = z.infer<typeof AnalysisConstraintSchema>;

export const AnalysisObjectiveSchema = z.object({
  id: z.string().min(1),
  dimension: z.enum([
    "performance",
    "reliability",
    "capacity",
    "cost",
    "recovery",
    "consistency",
    "complexity",
  ]),
  weight: z.number().min(0).max(1).default(0.2),
  targetDirection: z.enum(["minimize", "maximize"]).default("minimize"),
});
export type AnalysisObjective = z.infer<typeof AnalysisObjectiveSchema>;

export const AnalysisFaultInjectionSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "none",
    "service_crash",
    "db_outage",
    "az_outage",
    "region_outage",
    "network_partition",
    "cache_stampede",
    "retry_storm",
    "queue_overload",
  ]),
  targetComponentId: z.string().default("orders-db"),
  atMs: z.number().min(0).default(160),
  durationMs: z.number().min(10).default(220),
});
export type AnalysisFaultInjection = z.infer<typeof AnalysisFaultInjectionSchema>;

export const AnalysisExperimentSchema = z.object({
  version: z.literal(1).default(1),
  id: z.string().min(1),
  projectId: z.string().default("proj_default"),
  presetId: z.string().optional(),
  label: z.string().default("Architecture Trade-Off Experiment"),
  architectureRevisionId: z.string().default("rev_baseline"),
  workloadRps: z.number().min(10).max(10000).default(600),
  durationMs: z.number().min(100).max(30000).default(600),
  seed: z.number().int().default(42),
  seedSet: z.array(z.number().int()).optional(),
  scoringEnabled: z.boolean().default(true),
  baselineRevision: AnalysisRevisionSchema,
  candidateRevision: AnalysisRevisionSchema,
  fault: AnalysisFaultInjectionSchema.default({ id: "f_none", type: "none" }),
  constraints: z.array(AnalysisConstraintSchema).default([]),
  objectives: z.array(AnalysisObjectiveSchema).default([]),
  proposedFixLabel: z.string().optional(),
});
export type AnalysisExperiment = z.infer<typeof AnalysisExperimentSchema>;

// ========================
// Normalized Runtime Models
// ========================

export interface AnalysisEvidence {
  id: string;
  runId: string;
  sourceEventIds: string[];
  metricIds: string[];
  componentIds: string[];
  timeRangeMs: [number, number];
  kind:
    | "performance"
    | "reliability"
    | "capacity"
    | "cost"
    | "consistency"
    | "recovery";
  summary: string;
}

export interface AnalysisNormalizedMetrics {
  runId: string;
  revisionId: string;
  contentHash: string;
  offeredRps: number;
  acceptedRps: number;
  completedRps: number;
  rejectedRps: number;
  timedOutRequests: number;
  backloggedQueueDepth: number;
  errorRate: number; // fraction 0..1
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  latencyAttributionMs: {
    network: number;
    queue: number;
    compute: number;
    database: number;
    cache: number;
    retries: number;
  };
  criticalPathComponentIds: string[];
  effectiveCapacityRps: number;
  utilizationPct: number;
  simulatedAvailability: number; // fraction 0..1
  analyticalAvailability: number | null; // null if assumptions invalidated
  availabilityAssumptionsHeld: boolean;
  availabilityCaveat: string;
  errorBudgetRemainingPct: number;
  estimatedMonthlyCostUsd: number;
  costPerSuccessfulRequestUsd: number | null;
  costProvenanceLabel: string;
  achievedRpoSec: number | null;
  achievedRtoSec: number | null;
  consistencyGuarantee: string;
  complexityScore: number;
  complexityDimensions: {
    componentsCount: number;
    edgesCount: number;
    regionsCount: number;
    statefulCount: number;
  };
}

export interface AnalysisRevisionDiff {
  baselineHash: string;
  candidateHash: string;
  addedComponents: string[];
  removedComponents: string[];
  modifiedComponents: Array<{
    componentId: string;
    changes: string[];
  }>;
  changedEdges: string[];
  policyChanges: string[];
  summary: string;
}

export interface AnalysisBottleneckFinding {
  id: string;
  componentId: string;
  limitingResource:
    | "cpu_compute"
    | "database"
    | "connection_pool"
    | "queue"
    | "cache_miss"
    | "network_retry"
    | "downstream_dependency";
  role: "primary_root_cause" | "secondary_symptom";
  severity: "critical" | "high" | "medium" | "low";
  saturationPct: number;
  affectedRps: number;
  latencyImpactMs: number;
  rankingScore: number;
  evidenceIds: string[];
  explanation: string;
}

export interface AnalysisSpofFinding {
  id: string;
  componentId: string;
  failureDomain: AnalysisFailureDomainLevel;
  dependentComponentIds: string[];
  mitigationPath: string;
  evidenceIds: string[];
  severity: "critical" | "high" | "medium";
  explanation: string;
}

export interface AnalysisFailurePropagationStep {
  sequence: number;
  atMs: number;
  componentId: string;
  impact: string;
  cumulativeAffectedRps: number;
}

export interface AnalysisConstraintCheck {
  constraintId: string;
  label: string;
  passed: boolean;
  actualValue: string;
  requiredValue: string;
}

export interface AnalysisTradeOffEntry {
  id: string;
  dimensionA: string;
  dimensionB: string;
  baselineSummary: string;
  candidateSummary: string;
  evidenceIds: string[];
  summary: string;
  assumptions: string[];
  limitations: string[];
}

export interface AnalysisScorecard {
  scoringEnabled: boolean;
  formulaDescription: string;
  weights: Record<string, number>;
  baselineDimensionScores: Record<string, number | null>;
  candidateDimensionScores: Record<string, number | null>;
  baselineComposite: number | null;
  candidateComposite: number | null;
  baselineConstraintsPassed: boolean;
  candidateConstraintsPassed: boolean;
}

export interface AnalysisRecommendation {
  id: string;
  title: string;
  category:
    | "performance"
    | "reliability"
    | "capacity"
    | "cost"
    | "consistency"
    | "recovery";
  affectedComponentIds: string[];
  evidenceIds: string[];
  observedProblem: string;
  proposedChangeDescription: string;
  expectedEffect: string;
  tradeOff: string;
  uncertainty: string;
  validationStatus:
    | "pending"
    | "validated_improved"
    | "validated_neutral"
    | "validated_regressed";
}

export interface AnalysisAdrRecord {
  id: string;
  title: string;
  status: "Proposed" | "Accepted" | "Rejected" | "Superseded";
  createdAt: string;
  experimentId: string;
  baselineRevisionHash: string;
  candidateRevisionHash: string;
  evidenceIds: string[];
  findingIds: string[];
  recommendationIds: string[];
  markdownText: string;
}

export interface AnalysisCapabilityAdapterInfo {
  id: string;
  name: string;
  supportedNodeKinds: AnalysisComponentKind[];
  determinismSupported: boolean;
  available: boolean;
  limitations: string;
}

export interface AnalysisStatisticalSummary {
  seedCount: number;
  seeds: number[];
  candidateP95MeanMs: number;
  candidateP95MedianMs: number;
  candidateP95StdDevMs: number;
  candidateAvailabilityMean: number;
}

export interface AnalysisInvariantReport {
  allPassed: boolean;
  baselineImmutableOk: boolean;
  candidateVersionedOk: boolean;
  unitsNormalizedOk: boolean;
  noFabricatedMetricsOk: boolean;
  findingsHaveEvidenceOk: boolean;
  recommendationsHaveEvidenceOk: boolean;
  sharedDependenciesNotIndependentOk: boolean;
  constraintsNotHiddenOk: boolean;
  adrLinksValidOk: boolean;
  violations: string[];
}

export interface ModeledAnalysisRuntimeState {
  virtualTimeMs: number;
  activeViewVariant: "baseline" | "candidate";
  experimentId: string;
  baselineMetrics: AnalysisNormalizedMetrics;
  candidateMetrics: AnalysisNormalizedMetrics;
  diff: AnalysisRevisionDiff;
  evidences: AnalysisEvidence[];
  bottlenecks: AnalysisBottleneckFinding[];
  spofs: AnalysisSpofFinding[];
  failurePropagation: AnalysisFailurePropagationStep[];
  blastRadiusComponentIds: string[];
  baselineConstraintChecks: AnalysisConstraintCheck[];
  candidateConstraintChecks: AnalysisConstraintCheck[];
  tradeOffs: AnalysisTradeOffEntry[];
  scorecard: AnalysisScorecard;
  recommendations: AnalysisRecommendation[];
  adr: AnalysisAdrRecord;
  executiveReportMarkdown: string;
  capabilities: AnalysisCapabilityAdapterInfo[];
  statisticalSummary?: AnalysisStatisticalSummary;
  fairnessWarnings: string[];
  invariants: AnalysisInvariantReport;
}

