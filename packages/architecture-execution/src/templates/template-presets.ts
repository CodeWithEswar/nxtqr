import { templateRegistry } from "./template-registry";
import type { TemplateCategoryId, TemplateDifficulty, TemplateScenarioRunInput } from "./template-schemas";

export interface TemplatePresetMetadata {
  id: TemplatePresetId;
  label: string;
  description: string;
  templateId: string;
  categoryId: TemplateCategoryId;
  difficulty: TemplateDifficulty;
}

export type TemplatePresetId =
  | "tpl_client_server_baseline"
  | "tpl_url_shortener_scale"
  | "tpl_rate_limited_api_gateway"
  | "tpl_kafka_event_streaming"
  | "tpl_k8s_microservices_mesh"
  | "tpl_multi_region_active_active"
  | "tpl_rag_ai_assistant"
  | "tpl_distributed_kv_quorum"
  | "tpl_ecommerce_checkout_saga"
  | "tpl_zero_trust_api_boundary"
  | "tpl_cqrs_event_sourcing"
  | "tpl_cache_aside_read_heavy"
  | "tpl_cdc_analytics_pipeline"
  | "tpl_realtime_websocket_chat"
  | "tpl_canary_progressive_delivery"
  | "tpl_multi_tenant_saas_isolation";

export const TEMPLATE_PRESET_METADATA: TemplatePresetMetadata[] = [
  {
    id: "tpl_client_server_baseline",
    label: "Template: Three-Tier Client-Server Web App",
    description: "Foundational DNS, Load Balancer, stateless API tier, cache, and primary SQL database.",
    templateId: "tpl_002_three_tier_web",
    categoryId: "foundational",
    difficulty: "beginner",
  },
  {
    id: "tpl_url_shortener_scale",
    label: "Template: High-Throughput URL Shortener",
    description: "Read-heavy short-link redirect pipeline with CDN/Redis absorption and partitioned lookup DB.",
    templateId: "tpl_073_url_shortener",
    categoryId: "web-application",
    difficulty: "intermediate",
  },
  {
    id: "tpl_rate_limited_api_gateway",
    label: "Template: Rate Limiting & Load Shedding Gateway",
    description: "Edge gateway backed by distributed Redis token buckets, backpressure queues, and load shedding.",
    templateId: "tpl_046_rate_limiting_shedding",
    categoryId: "high-availability",
    difficulty: "intermediate",
  },
  {
    id: "tpl_kafka_event_streaming",
    label: "Template: Event-Driven Kafka Partitioned Stream",
    description: "Partitioned log ingestion with consumer-group fan-out, DLQ handling, and materialized state.",
    templateId: "tpl_032_kafka_partitioned_stream",
    categoryId: "messaging",
    difficulty: "intermediate",
  },
  {
    id: "tpl_k8s_microservices_mesh",
    label: "Template: Kubernetes Microservices & Service Mesh",
    description: "Envoy sidecar mTLS mesh with HPA autoscaling, circuit breakers, and distributed tracing.",
    templateId: "tpl_051_service_mesh",
    categoryId: "microservices",
    difficulty: "advanced",
  },
  {
    id: "tpl_multi_region_active_active",
    label: "Template: Active-Active Multi-Region Platform",
    description: "Geo-DNS + anycast routing across regional compute and replicated distributed storage.",
    templateId: "tpl_040_active_active",
    categoryId: "multi-region",
    difficulty: "expert",
  },
  {
    id: "tpl_rag_ai_assistant",
    label: "Template: Enterprise RAG AI Search & Inference",
    description: "Embedding pipeline, vector database retrieval, prompt cache, and guarded LLM inference.",
    templateId: "tpl_101_rag_pipeline",
    categoryId: "ai-application",
    difficulty: "advanced",
  },
  {
    id: "tpl_distributed_kv_quorum",
    label: "Template: Distributed Key-Value Store & Quorum",
    description: "Consistent-hashed storage cluster with tunable quorum replication and leader rebalancing.",
    templateId: "tpl_015_distributed_kv",
    categoryId: "distributed-storage",
    difficulty: "expert",
  },
  {
    id: "tpl_ecommerce_checkout_saga",
    label: "Template: Idempotent E-Commerce Checkout Saga",
    description: "Orchestrated order, inventory reservation, and payment ledger workflow with compensating rollbacks.",
    templateId: "tpl_077_ecommerce_checkout",
    categoryId: "ecommerce",
    difficulty: "advanced",
  },
  {
    id: "tpl_zero_trust_api_boundary",
    label: "Template: Zero-Trust Service Communication",
    description: "OIDC token verification, OPA policy enforcement, WAF inspection, and mutual TLS east-west hops.",
    templateId: "tpl_061_zero_trust_comm",
    categoryId: "security",
    difficulty: "advanced",
  },
  {
    id: "tpl_cqrs_event_sourcing",
    label: "Template: CQRS & Event-Sourced Ledger",
    description: "Append-only event log separated from asynchronous read projections for independent write/read scaling.",
    templateId: "tpl_017_cqrs",
    categoryId: "event-driven",
    difficulty: "advanced",
  },
  {
    id: "tpl_cache_aside_read_heavy",
    label: "Template: Cache-Aside with Read Replicas",
    description: "Multi-layer Redis read-through cache plus primary-replica database split eliminating read hot spots.",
    templateId: "tpl_021_cache_aside",
    categoryId: "caching",
    difficulty: "beginner",
  },
  {
    id: "tpl_cdc_analytics_pipeline",
    label: "Template: Change Data Capture (CDC) Pipeline",
    description: "WAL streaming from OLTP database through Kafka into analytical lakehouse without query contention.",
    templateId: "tpl_096_cdc_pipeline",
    categoryId: "data-platform",
    difficulty: "advanced",
  },
  {
    id: "tpl_realtime_websocket_chat",
    label: "Template: Real-Time WebSocket Chat & Presence",
    description: "Stateful WebSocket gateway cluster fan-out via Redis pub/sub and durable message history storage.",
    templateId: "tpl_074_chat_application",
    categoryId: "real-time",
    difficulty: "intermediate",
  },
  {
    id: "tpl_canary_progressive_delivery",
    label: "Template: Canary Progressive Rollout Pipeline",
    description: "Weighted traffic splitting across stable and canary deployments with automated SLO rollback gates.",
    templateId: "tpl_053_canary_deployment",
    categoryId: "cloud-native",
    difficulty: "intermediate",
  },
  {
    id: "tpl_multi_tenant_saas_isolation",
    label: "Template: Multi-Tenant SaaS Control & Data Plane",
    description: "Tenant-aware routing, per-tenant quota enforcement, and noisy-neighbor isolation.",
    templateId: "tpl_086_multi_tenant_saas",
    categoryId: "saas",
    difficulty: "advanced",
  },
];

export function createTemplatePresetScenario(
  presetId: TemplatePresetId,
  seed = 1
): TemplateScenarioRunInput {
  const meta =
    TEMPLATE_PRESET_METADATA.find((p) => p.id === presetId) ||
    TEMPLATE_PRESET_METADATA[0];
  const tpl =
    templateRegistry.getById(meta.templateId) || templateRegistry.listAll()[0];

  return {
    id: `tpl_run_${meta.id}_${seed}`,
    templateId: tpl.manifest.id,
    templateVersion: tpl.versionRecord.version,
    scenarioId: tpl.scenarios[0]?.id || "sc_baseline",
    walkthroughId: tpl.walkthroughs[0]?.id,
    walkthroughStepIndex: 0,
    seed,
  };
}
