import type { AnalysisComponentConfig, AnalysisEdgeConfig } from "../analysis/analysis-schemas";
import { getChallengeById } from "./challenges/challenge-registry";
import { SYSTEM_DESIGN_CHALLENGES } from "./challenges/challenge-library";
import { ENGINEERING_LABS, getEngineeringLabById } from "./labs/engineering-labs";
import type {
  PracticeInterviewPhase,
  PracticeMode,
  PracticePressureMode,
  PracticeScenario,
} from "./practice-schemas";

export interface PracticePresetMetadata {
  id: PracticePresetId;
  label: string;
  description: string;
  mode: PracticeMode;
  challengeId: string;
  labId?: string;
}

export type PracticePresetId =
  | "prac_beginner_url_shortener"
  | "prac_mock_45_url_shortener"
  | "prac_advanced_60_payment"
  | "prac_requirements_drill_chat"
  | "prac_estimation_drill_video"
  | "prac_api_drill_ecommerce"
  | "prac_db_drill_timeline"
  | "prac_reliability_drill_ha"
  | "prac_scalability_drill_rate_limiter"
  | "prac_security_drill_multi_tenant"
  | "prac_tradeoff_drill_cache"
  | "prac_debug_drill_checkout"
  | "prac_failover_drill_multi_region"
  | "prac_cost_drill_metrics";

export const PRACTICE_PRESET_METADATA: PracticePresetMetadata[] = [
  {
    id: "prac_beginner_url_shortener",
    label: "Learn: URL Shortener Guided Practice",
    description: "Beginner-friendly guided URL Shortener session with progressive hints and full simulation verification.",
    mode: "learn",
    challengeId: "ch_01_url_shortener",
  },
  {
    id: "prac_mock_45_url_shortener",
    label: "Mock Interview (45m): URL Shortener",
    description: "Timed 45-minute standard-pressure interview with requirement discovery, follow-ups, and evidence scoring.",
    mode: "mock-interview",
    challengeId: "ch_01_url_shortener",
  },
  {
    id: "prac_advanced_60_payment",
    label: "Mock Interview (60m Strict): Payment Platform",
    description: "Advanced 60-minute strict mock interview testing idempotent ledgers, AZ failover, and bounded hints.",
    mode: "mock-interview",
    challengeId: "ch_19_payment_platform",
  },
  {
    id: "prac_requirements_drill_chat",
    label: "Drill: Requirements Discovery (Chat App)",
    description: "Practice clarifying DAU, presence latency, offline sync, and consistency targets.",
    mode: "practice",
    challengeId: "ch_06_chat_app",
  },
  {
    id: "prac_estimation_drill_video",
    label: "Drill: Capacity & Storage Estimation (Video Platform)",
    description: "Practice throughput, payload, and multi-replica retention math at 10M DAU.",
    mode: "practice",
    challengeId: "ch_09_video_streaming",
  },
  {
    id: "prac_api_drill_ecommerce",
    label: "Drill: Idempotent API Design (Checkout)",
    description: "Design idempotent order creation, auth checks, and clean error contracts.",
    mode: "practice",
    challengeId: "ch_17_ecommerce_checkout",
  },
  {
    id: "prac_db_drill_timeline",
    label: "Drill: Data Modeling (Social Timeline)",
    description: "Evaluate partition keys, secondary access indexes, and replication choices.",
    mode: "practice",
    challengeId: "ch_08_social_timeline",
  },
  {
    id: "prac_reliability_drill_ha",
    label: "Lab: Eliminate SPOFs & High Availability",
    description: "Guided engineering lab eliminating single-AZ and un-replicated database failure domains.",
    mode: "engineering-lab",
    challengeId: "ch_30_high_availability_arch",
    labId: "lab_14_single_point_of_failure",
  },
  {
    id: "prac_scalability_drill_rate_limiter",
    label: "Lab: Configure Edge Rate Limiting",
    description: "Protect backend tiers at the gateway using distributed token buckets under burst load.",
    mode: "engineering-lab",
    challengeId: "ch_02_rate_limiter",
    labId: "lab_10_rate_limiting",
  },
  {
    id: "prac_security_drill_multi_tenant",
    label: "Practice: Multi-Tenant Security Boundaries",
    description: "Verify zero-trust edge boundaries, RLS data entities, and noisy-neighbor isolation.",
    mode: "practice",
    challengeId: "ch_27_multi_tenant_saas",
  },
  {
    id: "prac_tradeoff_drill_cache",
    label: "Lab: Handle Cache Stampede & Consistency",
    description: "Inspect origin DB protection under simulated cache stampede faults.",
    mode: "engineering-lab",
    challengeId: "ch_14_distributed_cache",
    labId: "lab_07_cache_stampede",
  },
  {
    id: "prac_debug_drill_checkout",
    label: "Lab: Circuit Breakers & Retry Storms",
    description: "Bound edge retry multipliers cleanly during simulated primary failover.",
    mode: "engineering-lab",
    challengeId: "ch_17_ecommerce_checkout",
    labId: "lab_16_circuit_breakers",
  },
  {
    id: "prac_failover_drill_multi_region",
    label: "Lab: Multi-Region Failover & RPO/RTO",
    description: "Validate surviving capacity across regional AZ outage simulation.",
    mode: "engineering-lab",
    challengeId: "ch_29_multi_region_app",
    labId: "lab_19_regional_failover",
  },
  {
    id: "prac_cost_drill_metrics",
    label: "Lab: Optimize Capacity & Monthly Cost",
    description: "Achieve <= 80ms p95 latency within strict monthly infrastructure spend limits.",
    mode: "engineering-lab",
    challengeId: "ch_26_metrics_collection",
    labId: "lab_20_optimize_capacity_cost",
  },
];

function makeComp(
  partial: Partial<AnalysisComponentConfig> & {
    id: string;
    label: string;
    kind: AnalysisComponentConfig["kind"];
  }
): AnalysisComponentConfig {
  const isCache = partial.kind === "cache";
  return {
    failureDomain: "az",
    region: "us-east-1",
    zone: "us-east-1a",
    multiAz: true,
    replicas: 2,
    capacityPerReplicaRps: 1500,
    baseLatencyMs: isCache ? 2 : partial.kind === "database" ? 9 : 5,
    maxConnectionsPerReplica: 60,
    mtbfHours: 2400,
    mttrMinutes: 10,
    replicationMode: partial.kind === "database" ? "sync" : "none",
    replicationLagSec: 0,
    cacheStrategy: isCache ? "cache_aside" : "none",
    cacheHitRatio: isCache ? 0.85 : 0,
    monthlyCostPerReplicaUsd: 75,
    hasBackup: true,
    dependencyIds: [],
    ...partial,
  };
}

function buildReferenceComponentsForChallenge(
  requiredCaps: string[],
  peakRps: number
): { components: AnalysisComponentConfig[]; edges: AnalysisEdgeConfig[] } {
  const needed = new Set<string>(requiredCaps);
  const cappedRps = Math.min(8000, Math.max(400, peakRps));
  const replicasForLoad = Math.min(8, Math.max(2, Math.ceil(cappedRps / 1500) + 1));

  const components: AnalysisComponentConfig[] = [
    makeComp({
      id: "gateway",
      label: "API Gateway & L7 LB",
      kind: "gateway",
      replicas: replicasForLoad,
      capacityPerReplicaRps: Math.max(2500, Math.ceil((cappedRps * 2) / replicasForLoad)),
      baseLatencyMs: 3,
      monthlyCostPerReplicaUsd: 60,
    }),
    makeComp({
      id: "service",
      label: "Application Tier",
      kind: "service",
      replicas: Math.max(3, replicasForLoad),
      capacityPerReplicaRps: Math.max(1500, Math.ceil((cappedRps * 2) / Math.max(3, replicasForLoad))),
      baseLatencyMs: 7,
      monthlyCostPerReplicaUsd: 75,
    }),
  ];

  if (needed.has("cache") || needed.has("cdn")) {
    components.push(
      makeComp({
        id: "cache",
        label: "Redis Cache Cluster",
        kind: "cache",
        replicas: 3,
        capacityPerReplicaRps: Math.max(2500, cappedRps),
        baseLatencyMs: 2,
        cacheHitRatio: 0.85,
        monthlyCostPerReplicaUsd: 90,
      })
    );
  }

  if (needed.has("queue")) {
    components.push(
      makeComp({
        id: "queue",
        label: "Async Message Queue",
        kind: "queue",
        replicas: 2,
        capacityPerReplicaRps: Math.max(2000, cappedRps),
        baseLatencyMs: 3,
        monthlyCostPerReplicaUsd: 80,
      })
    );
  }

  components.push(
    makeComp({
      id: "database",
      label: "Multi-AZ Primary DB",
      kind: "database",
      replicas: 3,
      capacityPerReplicaRps: Math.max(1600, Math.ceil((cappedRps * 1.6) / 2)),
      baseLatencyMs: 9,
      monthlyCostPerReplicaUsd: 150,
    })
  );

  if (needed.has("object_storage")) {
    components.push(
      makeComp({
        id: "storage",
        label: "Object Store",
        kind: "storage",
        replicas: 3,
        capacityPerReplicaRps: Math.max(3000, cappedRps),
        baseLatencyMs: 8,
        monthlyCostPerReplicaUsd: 50,
      })
    );
  }

  const edges: AnalysisEdgeConfig[] = [];
  for (let i = 0; i < components.length - 1; i++) {
    edges.push({
      id: `edge_${i + 1}`,
      source: components[i].id,
      target: components[i + 1].id,
      communicationMode: components[i + 1].kind === "queue" ? "async_queue" : "sync_http",
      retryFactor: 1.15,
    });
  }

  return { components, edges };
}

export function createPracticePresetScenario(
  presetId: PracticePresetId,
  overrideMode?: PracticeMode
): PracticeScenario {
  const meta =
    PRACTICE_PRESET_METADATA.find((m) => m.id === presetId) ||
    PRACTICE_PRESET_METADATA[0];

  const challenge =
    getChallengeById(meta.challengeId) || SYSTEM_DESIGN_CHALLENGES[0];
  const lab = meta.labId
    ? getEngineeringLabById(meta.labId) || ENGINEERING_LABS[0]
    : undefined;
  const mode = overrideMode || meta.mode;

  const pressureMode: PracticePressureMode =
    presetId === "prac_advanced_60_payment"
      ? "strict"
      : mode === "mock-interview"
      ? "standard"
      : "relaxed";

  const durationLimitMinutes =
    presetId === "prac_advanced_60_payment" ? 60 : challenge.estimatedMinutes;

  const avgRps = Math.round(
    (challenge.referenceWorkload.dailyActiveUsers *
      challenge.referenceWorkload.requestsPerUserPerDay) /
      86_400
  );
  const peakRps = avgRps * challenge.referenceWorkload.peakMultiplier;

  const topo = lab
    ? {
        components: lab.starterRevision.components,
        edges: lab.starterRevision.edges,
      }
    : buildReferenceComponentsForChallenge(
        challenge.evaluatorOnly.requiredComponentCapabilities,
        peakRps
      );

  const phase: PracticeInterviewPhase =
    presetId === "prac_requirements_drill_chat"
      ? "requirements_discovery"
      : presetId === "prac_estimation_drill_video"
      ? "capacity_estimation"
      : presetId === "prac_api_drill_ecommerce"
      ? "api_design"
      : presetId === "prac_db_drill_timeline"
      ? "data_modeling"
      : "tradeoff_discussion";

  return {
    id: meta.id,
    name: meta.label,
    description: meta.description,
    architectureRevisionId: `${meta.id}_rev_v1`,
    mode,
    pressureMode,
    challengeId: challenge.id,
    challengeVersion: challenge.version,
    labId: lab?.id,
    durationLimitMinutes,
    monotonicElapsedMs: 12 * 60_000,
    currentPhase: phase,
    clarificationQuestions: [
      "What are the expected DAU, peak RPS, read/write ratio, and p95 latency targets?",
      "Which core API workflows and data retention windows are in scope for v1?",
      "What availability SLA, consistency guarantees, and monthly cost ceiling apply under failures?",
    ],
    estimationInput: {
      dailyActiveUsers: challenge.referenceWorkload.dailyActiveUsers,
      requestsPerUserPerDay: challenge.referenceWorkload.requestsPerUserPerDay,
      peakMultiplier: challenge.referenceWorkload.peakMultiplier,
      readWriteRatio: challenge.referenceWorkload.readWriteRatio,
      avgPayloadSize: challenge.referenceWorkload.avgPayloadBytes,
      payloadUnit: "bytes",
      retentionDays: challenge.referenceWorkload.retentionDays,
      replicationFactor: challenge.referenceWorkload.replicationFactor,
      assumptionsNote: `3x peak window over 24h average; ${challenge.referenceWorkload.replicationFactor}-way multi-AZ replication.`,
    },
    apiDesign: {
      endpoints: [
        {
          id: "ep_write",
          method: "POST",
          path: `/v1/${challenge.slug}/items`,
          purpose: challenge.requirements[0]?.title || "Create primary domain resource",
          authRequired: true,
          idempotent: true,
          paginated: false,
          rateLimited: true,
          requestSchemaSummary: "{ idempotencyKey: string, payload: object }",
          responseSchemaSummary: "{ id: string, status: string }",
          errorCodes: [400, 401, 409, 429, 500],
        },
        {
          id: "ep_read",
          method: "GET",
          path: `/v1/${challenge.slug}/items`,
          purpose: challenge.requirements[1]?.title || "Query domain state with cursor pagination",
          authRequired: true,
          idempotent: true,
          paginated: true,
          rateLimited: true,
          requestSchemaSummary: "?cursor=string&limit=50",
          responseSchemaSummary: "{ items: object[], nextCursor?: string }",
          errorCodes: [400, 401, 404, 429, 500],
        },
        {
          id: "ep_put",
          method: "PUT",
          path: `/v1/${challenge.slug}/items/:id`,
          purpose: "Idempotent state update / upsert",
          authRequired: true,
          idempotent: true,
          paginated: false,
          rateLimited: true,
          requestSchemaSummary: "{ version: number, state: object }",
          responseSchemaSummary: "{ id: string, version: number }",
          errorCodes: [400, 401, 409, 500],
        },
      ],
      notes: "Edge API gateway enforces bearer auth, per-tenant token bucket limits, and Idempotency-Key deduplication on mutations.",
    },
    dataModel: {
      entities: [
        {
          id: "ent_primary",
          name: challenge.evaluatorOnly.requiredEntityConcepts[0] || "primary_record",
          storageKind: "sql",
          primaryKey: "id (UUIDv7)",
          partitionKey: "tenant_or_shard_id",
          indexes: ["idx_lookup_key", "idx_created_at_desc"],
          relationships: ["references secondary_state via foreign_key"],
          retentionPolicy: "365d hot + archived",
          replicationMode: "leader_follower",
        },
        {
          id: "ent_secondary",
          name: challenge.evaluatorOnly.requiredEntityConcepts[1] || "audit_event_log",
          storageKind: "nosql_kv",
          primaryKey: "entity_key",
          partitionKey: "hash(entity_key)",
          indexes: ["gsi_status_updated_at"],
          relationships: ["1:N from primary_record"],
          retentionPolicy: "90d TTL",
          replicationMode: "quorum",
        },
      ],
      notes: "Partition key aligns with primary read/write shard key; secondary indexes cover time-ordered listing queries.",
    },
    architectureComponents: topo.components,
    architectureEdges: topo.edges,
    fault: {
      id: `f_${meta.id}`,
      type: lab?.fault.type || challenge.scenarios[challenge.scenarios.length - 1]?.faultType || "none",
      targetComponentId: "database",
      atMs: 160,
      durationMs: 220,
    },
    tradeOffExplanation: `Prioritized ${challenge.constraints[0]?.label || "low p95 latency"} and zero critical SPOFs across 3 AZs while keeping monthly infrastructure cost bounded; traded multi-region active-active write complexity until cross-continent latency requires it.`,
    followUpAnswers: {
      [`${challenge.id}_q_10x`]:
        "Stateless API servers auto-scale behind the L7 load balancer while Redis cache offload protects database connections during bursts.",
      [`${challenge.id}_q_tradeoff`]:
        "Chose leader-follower multi-AZ replication over single-node simplicity to eliminate SPOFs while keeping operational complexity manageable.",
    },
    revealHintUpToLevel: mode === "learn" ? 2 : 0,
    completedLabStepIds: lab ? lab.steps.map((s) => s.id) : [],
    seed: 20261112,
    userId: "user_practice_local",
  };
}
