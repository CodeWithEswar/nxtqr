import { infrastructureRegistry } from "@nxtqr/node-registry";
import type {
  ArchitectureTemplate,
  GuidedWalkthrough,
  TemplateAlternative,
  TemplateAssumption,
  TemplateCategoryDefinition,
  TemplateCategoryId,
  TemplateComponentExplanation,
  TemplateConstraint,
  TemplateDependency,
  TemplateDesignDecision,
  TemplateDifficulty,
  TemplateEdgeConfiguration,
  TemplateLearningPath,
  TemplateNodeConfiguration,
  TemplateRequirement,
  TemplateScenario,
  TemplateScenarioCategory,
} from "./template-schemas";
import {
  computeTemplateContentHash,
  resolveTemplateTopology,
  validateTemplateDefinition,
} from "./template-validation";

export const TEMPLATE_CATEGORIES: TemplateCategoryDefinition[] = [
  { id: "foundational", name: "Foundational Architectures", description: "Core topologies: client-server, three-tier, monoliths, load balancers, caches, queues, and gateways.", order: 1 },
  { id: "web-application", name: "Web Applications", description: "Interactive web delivery with reverse proxies, edge routing, and stateless application tiers.", order: 2 },
  { id: "backend", name: "Backend Systems", description: "API gateways, backend services, worker pools, scheduled jobs, and outbox pipelines.", order: 3 },
  { id: "database", name: "Database Architectures", description: "Primary-replica, read scaling, sharding, multi-primary, distributed KV, CQRS, event sourcing, and sagas.", order: 4 },
  { id: "caching", name: "Caching Architectures", description: "Cache-aside, read/write-through, write-behind, distributed cache, CDN origin shields, stampede protection.", order: 5 },
  { id: "messaging", name: "Messaging Systems", description: "Queues, pub/sub, Kafka partitions, consumer groups, DLQs, retry backoff, and transactional outbox.", order: 6 },
  { id: "event-driven", name: "Event-Driven Systems", description: "Asynchronous pipelines, streaming processors, webhooks, and CDC connectors.", order: 7 },
  { id: "microservices", name: "Microservices & Mesh", description: "Decomposed service boundaries, service discovery, circuit breakers, bulkheads, and mTLS meshes.", order: 8 },
  { id: "distributed-storage", name: "Distributed Storage", description: "Partitioned object stores, multi-copy KV stores, cloud file storage, and archive tiers.", order: 9 },
  { id: "high-availability", name: "High Availability & Reliability", description: "Active-passive, active-active, multi-AZ, rate limiting, load shedding, and disaster recovery.", order: 10 },
  { id: "multi-region", name: "Multi-Region Architectures", description: "Global traffic routing, geo-replicated stores, regional failover, and active-active topologies.", order: 11 },
  { id: "cloud-native", name: "Cloud-Native & Deployment", description: "Kubernetes workloads, HPA autoscaling, blue-green, canary, rolling updates, serverless, and edge.", order: 12 },
  { id: "security", name: "Security & Zero Trust", description: "Auth gateways, OAuth/OIDC, Zero Trust policy enforcement, mTLS, WAF, KMS, and secrets management.", order: 13 },
  { id: "observability", name: "Observability & Telemetry", description: "Centralized logging, metrics collectors, distributed tracing, OpenTelemetry, SLOs, and alerting.", order: 14 },
  { id: "real-time", name: "Real-Time Systems", description: "WebSocket fan-out, chat presence, live streaming media, notifications, and collaborative sync.", order: 15 },
  { id: "data-platform", name: "Data Engineering Platforms", description: "Batch/streaming ETL, CDC pipelines, data lakes, warehouses, lakehouses, and analytics engines.", order: 16 },
  { id: "ai-application", name: "AI & Inference Systems", description: "RAG pipelines, vector search, LLM inference gateways, model serving, guardrails, and agents.", order: 17 },
  { id: "ecommerce", name: "E-Commerce & Payments", description: "High-integrity checkout, inventory reservation, payment ledgers, and webhook reconciliation.", order: 18 },
  { id: "saas", name: "Multi-Tenant SaaS", description: "Tenant isolation, RBAC authorization, metering, billing pipelines, and uptime monitoring.", order: 19 },
  { id: "infrastructure", name: "Core Infrastructure", description: "DNS resolution, firewalls, VPC routing, backup restoration, and global content delivery.", order: 20 },
];

export const TEMPLATE_LEARNING_PATHS: TemplateLearningPath[] = [
  {
    id: "path_backend_fundamentals",
    title: "Backend & Web Fundamentals",
    description: "Progress from basic client-server request routing to load-balanced stateless services with caching and queues.",
    difficulty: "beginner",
    prerequisitePathIds: [],
    orderedTemplateIds: [
      "tpl_001_client_server",
      "tpl_002_three_tier_web",
      "tpl_004_load_balanced_app",
      "tpl_005_stateless_cluster",
      "tpl_007_app_with_cache",
      "tpl_008_app_with_queue",
      "tpl_009_api_gateway",
    ],
    requiredWalkthroughIds: ["wt_tpl_001_client_server", "wt_tpl_004_load_balanced_app", "wt_tpl_009_api_gateway"],
    recommendedLabIds: ["lab_01_client_server", "lab_02_load_balancer", "lab_05_add_cache"],
    relatedChallengeIds: ["ch_01_url_shortener", "ch_13_api_gateway"],
  },
  {
    id: "path_database_scaling",
    title: "Database Scaling & Consistency",
    description: "Master primary-replica reads, sharding, distributed SQL, CQRS, event sourcing, and distributed transactions.",
    difficulty: "intermediate",
    prerequisitePathIds: ["path_backend_fundamentals"],
    orderedTemplateIds: [
      "tpl_006_app_with_rdbms",
      "tpl_011_primary_replica_db",
      "tpl_012_read_replica",
      "tpl_013_database_sharding",
      "tpl_017_cqrs",
      "tpl_019_saga_orchestration",
    ],
    requiredWalkthroughIds: ["wt_tpl_011_primary_replica_db", "wt_tpl_013_database_sharding"],
    recommendedLabIds: ["lab_04_read_replicas", "lab_12_db_conn_exhaustion", "lab_18_consistency_strategies"],
    relatedChallengeIds: ["ch_28_distributed_database", "ch_19_payment_platform"],
  },
  {
    id: "path_distributed_systems",
    title: "Distributed Caching & Messaging",
    description: "Combine Redis caching patterns with Kafka partitioned streams, consumer groups, DLQs, and outbox guarantees.",
    difficulty: "intermediate",
    prerequisitePathIds: ["path_backend_fundamentals"],
    orderedTemplateIds: [
      "tpl_021_cache_aside",
      "tpl_028_cache_stampede_protection",
      "tpl_029_producer_consumer_queue",
      "tpl_032_kafka_partitioned_stream",
      "tpl_034_dead_letter_queue",
      "tpl_036_transactional_outbox",
    ],
    requiredWalkthroughIds: ["wt_tpl_028_cache_stampede_protection", "wt_tpl_032_kafka_partitioned_stream"],
    recommendedLabIds: ["lab_06_cache_misses", "lab_07_cache_stampede", "lab_08_async_queue", "lab_09_consumer_lag"],
    relatedChallengeIds: ["ch_14_distributed_cache", "ch_15_job_queue"],
  },
  {
    id: "path_cloud_native",
    title: "Cloud-Native & Progressive Delivery",
    description: "Operate Kubernetes clusters with HPA autoscaling, service meshes, canary/blue-green rollouts, and edge compute.",
    difficulty: "advanced",
    prerequisitePathIds: ["path_backend_fundamentals"],
    orderedTemplateIds: [
      "tpl_049_k8s_app_deployment",
      "tpl_050_k8s_autoscaling",
      "tpl_051_service_mesh",
      "tpl_052_blue_green_deployment",
      "tpl_053_canary_deployment",
      "tpl_058_global_traffic_distribution",
    ],
    requiredWalkthroughIds: ["wt_tpl_050_k8s_autoscaling", "wt_tpl_053_canary_deployment"],
    recommendedLabIds: ["lab_03_scale_replicas", "lab_10_rate_limiting"],
    relatedChallengeIds: ["ch_10_cdn", "ch_29_multi_region_app"],
  },
  {
    id: "path_reliability_engineering",
    title: "Reliability, Security & Observability",
    description: "Engineer multi-region disaster recovery, Zero Trust boundaries, distributed tracing, and SLO alerting.",
    difficulty: "advanced",
    prerequisitePathIds: ["path_distributed_systems"],
    orderedTemplateIds: [
      "tpl_039_active_passive_failover",
      "tpl_042_multi_region",
      "tpl_043_circuit_breaker",
      "tpl_046_rate_limiting_shedding",
      "tpl_061_zero_trust_comm",
      "tpl_069_distributed_tracing",
      "tpl_072_slo_monitoring",
    ],
    requiredWalkthroughIds: ["wt_tpl_042_multi_region", "wt_tpl_061_zero_trust_comm"],
    recommendedLabIds: ["lab_14_single_point_of_failure", "lab_16_circuit_breakers", "lab_19_regional_failover"],
    relatedChallengeIds: ["ch_02_rate_limiter", "ch_30_high_availability_arch"],
  },
  {
    id: "path_system_design_interviews",
    title: "Real-World System Design Interviews",
    description: "Practice full-scale production designs for URL shorteners, chat, social feeds, checkout, payments, and search.",
    difficulty: "intermediate",
    prerequisitePathIds: ["path_backend_fundamentals", "path_database_scaling"],
    orderedTemplateIds: [
      "tpl_073_url_shortener",
      "tpl_074_chat_application",
      "tpl_075_social_media_feed",
      "tpl_077_ecommerce_checkout",
      "tpl_078_payment_processing",
      "tpl_082_search_autocomplete",
    ],
    requiredWalkthroughIds: ["wt_tpl_073_url_shortener", "wt_tpl_078_payment_processing"],
    recommendedLabIds: ["lab_13_p95_p99_latency", "lab_20_optimize_capacity_cost"],
    relatedChallengeIds: ["ch_01_url_shortener", "ch_06_chat_app", "ch_17_ecommerce_checkout", "ch_19_payment_platform"],
  },
  {
    id: "path_data_engineering",
    title: "Data Platforms & Streaming Analytics",
    description: "Design CDC replication, streaming ETL, data lakes, analytical warehouses, and lakehouse governance.",
    difficulty: "advanced",
    prerequisitePathIds: ["path_distributed_systems"],
    orderedTemplateIds: [
      "tpl_091_batch_etl",
      "tpl_092_streaming_etl",
      "tpl_093_data_lake",
      "tpl_094_data_warehouse",
      "tpl_095_lakehouse",
      "tpl_096_cdc_pipeline",
    ],
    requiredWalkthroughIds: ["wt_tpl_092_streaming_etl", "wt_tpl_095_lakehouse"],
    recommendedLabIds: ["lab_08_async_queue", "lab_09_consumer_lag"],
    relatedChallengeIds: ["ch_24_distributed_logging", "ch_26_metrics_collection"],
  },
  {
    id: "path_ai_infrastructure",
    title: "AI & LLM Serving Infrastructure",
    description: "Build low-latency inference gateways, RAG pipelines, semantic caching, guardrails, and scalable GPU serving.",
    difficulty: "advanced",
    prerequisitePathIds: ["path_cloud_native"],
    orderedTemplateIds: [
      "tpl_101_rag_pipeline",
      "tpl_102_vector_search",
      "tpl_103_ai_inference_gateway",
      "tpl_104_model_serving",
      "tpl_106_ai_agent_orchestration",
      "tpl_110_scalable_inference",
    ],
    requiredWalkthroughIds: ["wt_tpl_101_rag_pipeline", "wt_tpl_110_scalable_inference"],
    recommendedLabIds: ["lab_10_rate_limiting", "lab_13_p95_p99_latency"],
    relatedChallengeIds: ["ch_12_search_autocomplete", "ch_13_api_gateway"],
  },
];

export interface BlueprintNodeSpec {
  id: string;
  componentType: string;
  label?: string;
  description?: string;
  analysisKind?: TemplateNodeConfiguration["analysisKind"];
  replicas?: number;
  capacityPerReplicaRps?: number;
  baseLatencyMs?: number;
  maxConnectionsPerReplica?: number;
  multiAz?: boolean;
  failureDomain?: TemplateNodeConfiguration["analysisProfile"]["failureDomain"];
  region?: string;
  replicationMode?: TemplateNodeConfiguration["analysisProfile"]["replicationMode"];
  replicationLagSec?: number;
  cacheStrategy?: TemplateNodeConfiguration["analysisProfile"]["cacheStrategy"];
  cacheHitRatio?: number;
  monthlyCostPerReplicaUsd?: number;
  responsibility?: string;
  whyUsed?: string;
}

export interface BlueprintEdgeSpec {
  id: string;
  source: string;
  target: string;
  label: string;
  protocol?: string;
  communicationMode?: "sync_http" | "async_queue" | "replication";
  retryFactor?: number;
  relationship?: TemplateDependency["relationship"];
}

export interface TemplateBlueprintInput {
  number: number;
  id: string;
  slug: string;
  title: string;
  summary: string;
  difficulty: TemplateDifficulty;
  categoryIds: TemplateCategoryId[];
  conceptIds: string[];
  estimatedLearningMinutes: number;
  problemSolved: string;
  requestFlowSummary: string;
  dataFlowSummary: string;
  consistencyGuarantees: string;
  failureBehaviorSummary: string;
  securityBoundariesSummary?: string;
  tradeOffsSummary: string[];
  operationalLimitations?: string[];
  decisions: Array<{
    question: string;
    decision: string;
    rationale: string;
    tradeOffs: string[];
  }>;
  alternative?: {
    title: string;
    summary: string;
    advantages: string[];
    disadvantages: string[];
    complexityDelta: "lower" | "similar" | "higher";
    performanceImpact: string;
    reliabilityImpact: string;
    costImpact: string;
  };
  constraints?: {
    maxLatencyMs?: number;
    minThroughputRps?: number;
    maxMonthlyCostUsd?: number;
    minAvailability?: number;
    consistencyModel?: TemplateConstraint["consistencyModel"];
  };
  nodes: BlueprintNodeSpec[];
  edges: BlueprintEdgeSpec[];
  normalScenario?: {
    title?: string;
    workloadRps?: number;
    maxP95Ms?: number;
    minAvailability?: number;
  };
  stressScenario?: {
    title?: string;
    category?: TemplateScenarioCategory;
    workloadRps?: number;
    faultType?: "node_down" | "az_outage" | "region_outage" | "db_slowdown" | "cache_flush" | "queue_backlog" | "network_partition" | "retry_storm";
    faultTargetId?: string;
    expectedMaxP95Ms?: number;
    expectedMinAvailability?: number;
  };
  relatedTemplateIds?: string[];
  relatedChallengeIds?: string[];
  relatedLabIds?: string[];
  simulationCapabilities?: string[];
  unsupportedCapabilities?: string[];
}

function inferAnalysisKind(
  componentType: string
): TemplateNodeConfiguration["analysisKind"] {
  if (
    componentType.includes("cache") ||
    componentType === "rate-limit-store" ||
    componentType === "cdn" ||
    componentType === "media-cdn"
  ) {
    return "cache";
  }
  if (
    componentType.includes("database") ||
    componentType === "postgresql" ||
    componentType === "mysql" ||
    componentType === "read-replica" ||
    componentType === "data-warehouse" ||
    componentType === "data-lakehouse" ||
    componentType === "feature-store"
  ) {
    return "database";
  }
  if (
    componentType.includes("queue") ||
    componentType.includes("broker") ||
    componentType.includes("kafka") ||
    componentType.includes("rabbitmq") ||
    componentType.includes("event-bus") ||
    componentType.includes("event-stream") ||
    componentType.includes("pub-sub")
  ) {
    return "queue";
  }
  if (
    componentType.includes("storage") ||
    componentType.includes("bucket") ||
    componentType.includes("data-lake") ||
    componentType.includes("content-repository")
  ) {
    return "storage";
  }
  if (
    componentType.includes("gateway") ||
    componentType.includes("load-balancer") ||
    componentType.includes("proxy") ||
    componentType.includes("dns") ||
    componentType.includes("firewall") ||
    componentType.includes("traffic-manager") ||
    componentType.includes("ingress") ||
    componentType.includes("edge-") ||
    componentType.includes("guardrail") ||
    componentType.includes("ddos")
  ) {
    return "gateway";
  }
  if (
    componentType.includes("browser") ||
    componentType.includes("mobile") ||
    componentType.includes("client") ||
    componentType.includes("device") ||
    componentType.includes("external-") ||
    componentType.includes("provider") ||
    componentType.includes("oauth-integration")
  ) {
    return "external";
  }
  return "service";
}

function defaultLatencyForKind(
  kind: TemplateNodeConfiguration["analysisKind"]
): number {
  switch (kind) {
    case "cache":
      return 2;
    case "database":
      return 12;
    case "queue":
      return 4;
    case "storage":
      return 16;
    case "gateway":
      return 4;
    case "external":
      return 5;
    case "service":
    default:
      return 8;
  }
}

export function buildReferenceTemplate(
  bp: TemplateBlueprintInput
): ArchitectureTemplate {
  const versionStr = "1.0.0";
  const versionId = `${bp.id}_v${versionStr}`;
  const revisionId = `${bp.id}_rev_v1`;

  const resolvedNodeConfigs: TemplateNodeConfiguration[] = bp.nodes.map(
    (spec, idx) => {
      const reg = infrastructureRegistry.getComponent(spec.componentType);
      const kind = spec.analysisKind ?? inferAnalysisKind(spec.componentType);
      const col = idx % 4;
      const row = Math.floor(idx / 4);
      const isDatabase = kind === "database";
      const isCache = kind === "cache";
      const label = spec.label ?? reg?.display.name ?? spec.componentType;
      const description =
        spec.description ??
        reg?.display.description ??
        `${label} component in ${bp.title}.`;

      return {
        id: spec.id,
        componentType: spec.componentType,
        label,
        description,
        position: { x: 80 + col * 260, y: 100 + row * 140 },
        environment: "production",
        config: {
          ...(reg?.defaultConfig ?? {}),
          label,
        },
        analysisKind: kind,
        analysisProfile: {
          replicas: spec.replicas ?? (kind === "external" ? 2 : 2),
          capacityPerReplicaRps:
            spec.capacityPerReplicaRps ?? (isDatabase ? 350 : isCache ? 2500 : 600),
          baseLatencyMs: spec.baseLatencyMs ?? defaultLatencyForKind(kind),
          maxConnectionsPerReplica: spec.maxConnectionsPerReplica ?? (isDatabase ? 80 : 120),
          failureDomain: spec.failureDomain ?? "az",
          region: spec.region ?? "us-east-1",
          zone: spec.multiAz === false ? "us-east-1a" : "us-east-1a/b",
          multiAz: spec.multiAz ?? true,
          mtbfHours: 2400,
          mttrMinutes: isDatabase ? 15 : 8,
          replicationMode: spec.replicationMode ?? (isDatabase ? "sync" : "none"),
          replicationLagSec: spec.replicationLagSec ?? 0,
          cacheStrategy: spec.cacheStrategy ?? (isCache ? "cache_aside" : "none"),
          cacheHitRatio: spec.cacheHitRatio ?? (isCache ? 0.85 : 0),
          monthlyCostPerReplicaUsd:
            spec.monthlyCostPerReplicaUsd ?? (isDatabase ? 120 : isCache ? 65 : 55),
          hasBackup: true,
        },
      };
    }
  );

  // Pick valid ports automatically for each edge using registry ports
  const portCursorByNode = new Map<string, number>();
  const resolvedEdgeConfigs: TemplateEdgeConfiguration[] = bp.edges.map((e) => {
    const srcSpec = bp.nodes.find((n) => n.id === e.source);
    const tgtSpec = bp.nodes.find((n) => n.id === e.target);
    const srcReg = srcSpec
      ? infrastructureRegistry.getComponent(srcSpec.componentType)
      : undefined;
    const tgtReg = tgtSpec
      ? infrastructureRegistry.getComponent(tgtSpec.componentType)
      : undefined;

    const srcCandidatePorts =
      srcReg?.ports.filter((p) => p.type === "output" || p.type === "bidirectional") ??
      [];
    const tgtCandidatePorts =
      tgtReg?.ports.filter((p) => p.type === "input" || p.type === "bidirectional") ??
      [];

    const srcCursor = portCursorByNode.get(`out:${e.source}`) ?? 0;
    const tgtCursor = portCursorByNode.get(`in:${e.target}`) ?? 0;
    portCursorByNode.set(`out:${e.source}`, srcCursor + 1);
    portCursorByNode.set(`in:${e.target}`, tgtCursor + 1);

    const srcPort =
      srcCandidatePorts[srcCursor % Math.max(1, srcCandidatePorts.length)];
    const tgtPort =
      tgtCandidatePorts[tgtCursor % Math.max(1, tgtCandidatePorts.length)];

    return {
      id: e.id,
      source: e.source,
      target: e.target,
      sourcePortId: srcPort?.id,
      targetPortId: tgtPort?.id,
      label: e.label,
      protocol: e.protocol ?? (e.communicationMode === "async_queue" ? "AMQP/Kafka" : "HTTPS"),
      communicationMode: e.communicationMode ?? "sync_http",
      retryFactor: e.retryFactor ?? (e.communicationMode === "async_queue" ? 1.05 : 1.15),
      edgeType: "bezier",
    };
  });

  const dependencies: TemplateDependency[] = bp.edges.map((e) => ({
    fromNodeId: e.source,
    toNodeId: e.target,
    relationship:
      e.relationship ??
      (e.communicationMode === "async_queue"
        ? "publishes_to"
        : e.communicationMode === "replication"
          ? "replicates_to"
          : "routes_to"),
    critical: e.communicationMode !== "async_queue",
  }));

  const topology = resolveTemplateTopology({
    revisionId,
    title: bp.title,
    nodes: resolvedNodeConfigs,
    edges: resolvedEdgeConfigs,
    dependencies,
    layout: {
      direction: "LR",
      useAutoLayout: false,
      groups: [],
      viewport: { x: 0, y: 0, zoom: 0.9 },
    },
  });

  const maxLatencyConstraint = bp.constraints?.maxLatencyMs ?? 120;
  const minThroughputConstraint = bp.constraints?.minThroughputRps ?? 350;
  const minAvailabilityConstraint = bp.constraints?.minAvailability ?? 0.99;

  const requirements: TemplateRequirement[] = [
    {
      id: `${bp.id}_req_func`,
      kind: "functional",
      title: `Primary ${bp.title} workflow`,
      description: bp.problemSolved,
    },
    {
      id: `${bp.id}_req_perf`,
      kind: "nonfunctional",
      title: "Bounded tail latency under nominal load",
      description: `Sustain <= ${maxLatencyConstraint}ms p95 end-to-end latency at ${minThroughputConstraint}+ req/s.`,
      targetMetric: `p95 <= ${maxLatencyConstraint}ms`,
    },
    {
      id: `${bp.id}_req_rel`,
      kind: "reliability",
      title: "Fault resilience and availability",
      description: bp.failureBehaviorSummary,
      targetMetric: `availability >= ${(minAvailabilityConstraint * 100).toFixed(2)}%`,
    },
  ];

  const assumptions: TemplateAssumption[] = [
    {
      id: `${bp.id}_assump_workload`,
      statement: `Simulated request envelope assumes steady-state payload distribution across ${bp.nodes.length} participating components.`,
      impact: "Tail amplification under extreme payload sizes requires dedicated sizing checks.",
    },
    {
      id: `${bp.id}_assump_clock`,
      statement: "Deterministic virtual clock and fixed seeded randomness control fault arrival timing.",
      impact: "Guarantees bit-for-bit reproducible scenario comparison across runs.",
    },
  ];

  const constraints: TemplateConstraint[] = [
    {
      id: `${bp.id}_con_sla`,
      label: `${bp.title} Baseline SLO`,
      maxLatencyMs: maxLatencyConstraint,
      minThroughputRps: minThroughputConstraint,
      maxMonthlyCostUsd: bp.constraints?.maxMonthlyCostUsd ?? 2500,
      minAvailability: minAvailabilityConstraint,
      consistencyModel: bp.constraints?.consistencyModel ?? "read-your-writes",
    },
  ];

  const scNormalId = `sc_${bp.id}_normal`;
  const scStressId = `sc_${bp.id}_stress`;
  const defaultFaultTarget =
    bp.stressScenario?.faultTargetId ??
    resolvedNodeConfigs.find((n) => n.analysisKind !== "external")?.id ??
    resolvedNodeConfigs[0].id;

  const normalRps = bp.normalScenario?.workloadRps ?? 280;
  const stressRps = bp.stressScenario?.workloadRps ?? 620;

  const scenarios: TemplateScenario[] = [
    {
      schemaVersion: 1,
      id: scNormalId,
      templateVersionId: versionId,
      title: bp.normalScenario?.title ?? "Nominal Production Traffic",
      description: `Executes steady ${normalRps} req/s traffic against ${bp.title} with zero injected faults to verify baseline latency, throughput, and utilization.`,
      category: "normal-traffic",
      durationMs: 600,
      seed: 100 + bp.number,
      workloadConfig: {
        workloadRps: normalRps,
        readWriteRatio: "80:20",
        routingPolicy: "least_connections",
        scalingMode: "hpa_reactive",
        maxReplicas: 16,
      },
      faultSchedule: [{ type: "none", atMs: 0 }],
      configurationOverrides: {},
      parameters: [
        { key: "workloadRps", label: "Workload", value: normalRps, unit: "req/s" },
        { key: "fault", label: "Fault Injection", value: "None" },
      ],
      expectedObservations: [
        {
          id: `${scNormalId}_obs_p95`,
          metric: "p95LatencyMs",
          operator: "lte",
          targetValue: bp.normalScenario?.maxP95Ms ?? Math.max(150, maxLatencyConstraint * 1.4),
          unit: "ms",
          description: "End-to-end p95 latency remains bounded under nominal demand.",
        },
        {
          id: `${scNormalId}_obs_avail`,
          metric: "availability",
          operator: "gte",
          targetValue: bp.normalScenario?.minAvailability ?? 0.985,
          description: "Healthy availability above 98.5% during normal execution.",
        },
      ],
      validationRuleIds: ["topology-connected", "bounds-latency", "bounds-availability"],
    },
    {
      schemaVersion: 1,
      id: scStressId,
      templateVersionId: versionId,
      title: bp.stressScenario?.title ?? "Peak Load & Component Fault Drill",
      description: `Injects ${bp.stressScenario?.faultType ?? "node_down"} on "${defaultFaultTarget}" under ${stressRps} req/s load to observe degradation, queue pressure, and blast radius.`,
      category: bp.stressScenario?.category ?? "node-failure",
      durationMs: 700,
      seed: 2000 + bp.number,
      workloadConfig: {
        workloadRps: stressRps,
        readWriteRatio: "75:25",
        routingPolicy: "least_connections",
        scalingMode: "hpa_reactive",
        maxReplicas: 20,
      },
      faultSchedule: [
        {
          type: bp.stressScenario?.faultType ?? "node_down",
          targetId: defaultFaultTarget,
          atMs: 180,
        },
      ],
      configurationOverrides: {},
      parameters: [
        { key: "workloadRps", label: "Peak Load", value: stressRps, unit: "req/s" },
        {
          key: "faultType",
          label: "Fault",
          value: bp.stressScenario?.faultType ?? "node_down",
        },
      ],
      expectedObservations: [
        {
          id: `${scStressId}_obs_throughput`,
          metric: "throughputRps",
          operator: "gt",
          targetValue: 0,
          unit: "req/s",
          description: "Architecture continues serving surviving traffic paths cleanly.",
        },
        {
          id: `${scStressId}_obs_cost`,
          metric: "monthlyCostUsd",
          operator: "gt",
          targetValue: 0,
          unit: "USD",
          description: "Synthetic monthly infrastructure cost quantified transparently.",
        },
      ],
      validationRuleIds: ["topology-connected", "fault-target-exists"],
    },
  ];

  const n0 = resolvedNodeConfigs[0];
  const n1 = resolvedNodeConfigs[1] ?? resolvedNodeConfigs[0];
  const nLast = resolvedNodeConfigs[resolvedNodeConfigs.length - 1];
  const e0 = resolvedEdgeConfigs[0];

  const wtId = `wt_${bp.id}`;
  const walkthroughs: GuidedWalkthrough[] = [
    {
      id: wtId,
      templateVersionId: versionId,
      title: `${bp.title} Guided Walkthrough`,
      description: `Step-by-step interactive tour of ${bp.title}: topology, data flow, simulation, and trade-offs.`,
      steps: [
        {
          id: `${wtId}_s1`,
          order: 1,
          type: "focus-component",
          title: `1. Entry Point — ${n0.label}`,
          explanation: `${n0.label} receives inbound workload and enforces the entry boundary for ${bp.title}.`,
          accessibilitySummary: `Focus node ${n0.label}: entry boundary of ${bp.title}.`,
          focusNodeId: n0.id,
        },
        {
          id: `${wtId}_s2`,
          order: 2,
          type: "highlight-connection",
          title: `2. Request Hop — ${e0.label}`,
          explanation: `${bp.requestFlowSummary}`,
          accessibilitySummary: `Highlight connection ${e0.label} illustrating request flow.`,
          focusNodeId: n1.id,
          highlightEdgeId: e0.id,
        },
        {
          id: `${wtId}_s3`,
          order: 3,
          type: "explain-data-flow",
          title: `3. State & Consistency — ${nLast.label}`,
          explanation: `${bp.dataFlowSummary} Consistency: ${bp.consistencyGuarantees}`,
          accessibilitySummary: `Focus node ${nLast.label} to inspect state storage and consistency.`,
          focusNodeId: nLast.id,
        },
        {
          id: `${wtId}_s4`,
          order: 4,
          type: "run-simulation",
          title: `4. Execute & Inspect Stress Simulation`,
          explanation: `Run "${scenarios[1].title}" to measure tail latency, fault blast radius, and trade-offs (${bp.tradeOffsSummary[0]}).`,
          accessibilitySummary: `Execute simulation scenario ${scenarios[1].title} and review metrics.`,
          focusNodeId: defaultFaultTarget,
          scenarioId: scStressId,
          metricKey: "p95LatencyMs",
        },
      ],
    },
  ];

  const componentExplanations: TemplateComponentExplanation[] = bp.nodes.map(
    (spec, idx) => {
      const cfg = resolvedNodeConfigs[idx];
      return {
        nodeId: cfg.id,
        componentType: cfg.componentType,
        responsibility:
          spec.responsibility ??
          `${cfg.label} handles ${cfg.analysisKind} execution within ${bp.title}.`,
        whyUsed:
          spec.whyUsed ??
          `Selected to satisfy ${bp.categoryIds[0]} reliability and throughput guarantees.`,
        dataOwnership:
          cfg.analysisKind === "database" || cfg.analysisKind === "storage"
            ? "Authoritative durable state owner for its partition."
            : cfg.analysisKind === "cache"
              ? "Ephemeral accelerator synchronized against downstream source of truth."
              : "Stateless or bounded transient state only.",
        scalingBehavior: `Scales horizontally across replicas (baseline=${cfg.analysisProfile.replicas}, ${cfg.analysisProfile.capacityPerReplicaRps} req/s per replica).`,
        failureBehavior: cfg.analysisProfile.multiAz
          ? `Multi-AZ (${cfg.analysisProfile.zone}) isolates single-zone loss; failover MTTR ~${cfg.analysisProfile.mttrMinutes}m.`
          : "Single availability zone placement creates localized blast radius on failure.",
        relatedConcepts: bp.conceptIds.slice(0, 3),
      };
    }
  );

  const designDecisions: TemplateDesignDecision[] = bp.decisions.map(
    (d, i) => ({
      id: `${bp.id}_dec_${i + 1}`,
      ...d,
    })
  );

  const alternatives: TemplateAlternative[] = [
    bp.alternative
      ? { id: `${bp.id}_alt_1`, ...bp.alternative }
      : {
          id: `${bp.id}_alt_1`,
          title: `Simpler Consolidated Variant`,
          summary: `Folds intermediate decoupling layers of ${bp.title} into fewer coarse-grained nodes for lower operational overhead.`,
          advantages: ["Lower component count and initial cloud cost", "Fewer network hops at small scale"],
          disadvantages: ["Higher blast radius on failure", "Limited independent horizontal scaling"],
          complexityDelta: "lower",
          performanceImpact: "Lower hop count under low traffic, faster saturation under spikes.",
          reliabilityImpact: "Reduced isolation when downstream components stall.",
          costImpact: "15-35% lower baseline monthly compute bill.",
        },
  ];

  const manifest = {
    schemaVersion: 1 as const,
    id: bp.id,
    slug: bp.slug,
    title: bp.title,
    summary: bp.summary,
    description: `${bp.problemSolved} Request flow: ${bp.requestFlowSummary} Trade-offs: ${bp.tradeOffsSummary.join(" ")}`,
    categoryIds: bp.categoryIds,
    conceptIds: bp.conceptIds,
    difficulty: bp.difficulty,
    estimatedLearningMinutes: bp.estimatedLearningMinutes,
    architectureRevisionId: revisionId,
    scenarioIds: scenarios.map((s) => s.id),
    walkthroughIds: walkthroughs.map((w) => w.id),
    requirements,
    assumptions,
    visibility: "system" as const,
    version: versionStr,
  };

  const contentHash = computeTemplateContentHash({
    manifest,
    nodes: resolvedNodeConfigs,
    edges: resolvedEdgeConfigs,
    scenarios,
    walkthroughs,
  });

  const matchingPaths = TEMPLATE_LEARNING_PATHS.filter((lp) =>
    lp.orderedTemplateIds.includes(bp.id)
  ).map((lp) => lp.id);

  const nowIso = "2026-11-12T00:00:00.000Z";

  const tpl: ArchitectureTemplate = {
    manifest,
    source: "builtin",
    ownerId: "system",
    workspaceId: null,
    publication: {
      status: "PUBLISHED",
      publishedAtIso: nowIso,
      qualityGatePassed: true,
      validationErrors: [],
      validationWarnings: [],
    },
    versionRecord: {
      id: versionId,
      templateId: bp.id,
      version: versionStr,
      changelog: "Initial validated reference release",
      immutable: true,
      contentHash,
      createdAtIso: nowIso,
      status: "PUBLISHED",
    },
    createdAtIso: nowIso,
    updatedAtIso: nowIso,
    problemSolved: bp.problemSolved,
    learningObjectives: [
      `Explain component roles and request routing inside ${bp.title}.`,
      `Evaluate latency, availability, and cost behavior under fault injection.`,
      `Articulate key architectural trade-offs and scaling limits.`,
    ],
    requestFlowSummary: bp.requestFlowSummary,
    dataFlowSummary: bp.dataFlowSummary,
    consistencyGuarantees: bp.consistencyGuarantees,
    failureBehaviorSummary: bp.failureBehaviorSummary,
    securityBoundariesSummary:
      bp.securityBoundariesSummary ??
      "Enforce authenticated ingress boundaries, TLS transport, and least-privilege east-west access.",
    operationalLimitations:
      bp.operationalLimitations ?? [
        "Capacity ceilings require proactive saturation monitoring and horizontal scaling rules.",
        "Distributed state hops increase operational observability requirements.",
      ],
    tradeOffsSummary: bp.tradeOffsSummary,
    constraints,
    componentExplanations,
    designDecisions,
    alternatives,
    topology,
    scenarios,
    walkthroughs,
    simulationCapabilities: bp.simulationCapabilities ?? [
      "latency",
      "throughput",
      "availability",
      "fault-injection",
      "spof-analysis",
      "cost",
    ],
    unsupportedCapabilities: bp.unsupportedCapabilities ?? [],
    relatedTemplateIds: bp.relatedTemplateIds ?? [],
    relatedChallengeIds: bp.relatedChallengeIds ?? [],
    relatedLabIds: bp.relatedLabIds ?? [],
    learningPathIds: matchingPaths,
  };

  // Validate built-in quality gates immediately
  const report = validateTemplateDefinition(tpl);
  if (!report.checks.qualityGatePassed) {
    tpl.publication = {
      ...tpl.publication,
      status: "REJECTED",
      qualityGatePassed: false,
      validationErrors: report.errors,
      validationWarnings: report.warnings,
    };
  }
  return tpl;
}
