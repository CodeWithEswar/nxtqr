import { z } from "zod";
import { SharedInfrastructureConfigSchema } from "./clients.schema";

// 01 — Model Serving
export const ModelServingConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("model-serving"),
  servingRuntime: z
    .enum(["vllm", "triton-inference-server", "text-generation-inference", "onnx-runtime", "tensorrt-llm"])
    .default("vllm"),
  modelPrecision: z
    .enum(["fp16", "bf16", "fp8", "int8", "int4-awq", "int4-gptq"])
    .default("bf16"),
  maxBatchSize: z.number().int().min(1).max(2048).default(64),
  kvCacheMemoryRatio: z.number().min(0.1).max(0.95).default(0.85),
  pagedAttentionEnabled: z.boolean().default(true),
  tensorParallelSize: z.number().int().min(1).max(32).default(2),
  speculativeDecoding: z.boolean().default(false),
  maxModelLengthTokens: z.number().int().min(512).max(1048576).default(8192),
});
export type ModelServingConfig = z.infer<typeof ModelServingConfigSchema>;

// 02 — Feature Store
export const FeatureStoreConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("feature-store"),
  onlineStoreEngine: z
    .enum(["redis-cluster", "dynamodb", "cassandra", "aerospike"])
    .default("redis-cluster"),
  offlineStoreEngine: z
    .enum(["delta-lake-s3", "bigquery", "snowflake", "parquet-iceberg"])
    .default("delta-lake-s3"),
  onlineReadTtlSeconds: z.number().int().min(60).max(31536000).default(86400),
  timeTravelEnabled: z.boolean().default(true),
  entityKeyField: z.string().default("entity_id"),
  syncFrequencyCron: z.string().default("*/15 * * * *"),
  materializationMode: z
    .enum(["continuous-streaming", "micro-batch", "scheduled-batch"])
    .default("continuous-streaming"),
});
export type FeatureStoreConfig = z.infer<typeof FeatureStoreConfigSchema>;

// 03 — Vector Embedding Pipeline
export const VectorEmbeddingPipelineConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("vector-embedding-pipeline"),
  chunkingStrategy: z
    .enum(["recursive-character", "token-boundary", "markdown-structure", "semantic-similarity", "sliding-window"])
    .default("recursive-character"),
  chunkSize: z.number().int().min(64).max(8192).default(512),
  chunkOverlap: z.number().int().min(0).max(1024).default(64),
  embeddingModel: z
    .enum(["text-embedding-3-small", "text-embedding-3-large", "bge-m3", "e5-mistral-7b", "cohere-embed-v3"])
    .default("text-embedding-3-small"),
  vectorDimensions: z.number().int().min(64).max(4096).default(1536),
  batchProcessingSize: z.number().int().min(1).max(1024).default(128),
  normalizationEnabled: z.boolean().default(true),
});
export type VectorEmbeddingPipelineConfig = z.infer<typeof VectorEmbeddingPipelineConfigSchema>;

// 04 — GPU Cluster
export const GpuClusterConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("gpu-cluster"),
  acceleratorType: z
    .enum(["nvidia-h100-sxm", "nvidia-a100-80gb", "nvidia-l40s", "nvidia-h200", "amd-mi300x"])
    .default("nvidia-h100-sxm"),
  nodeCount: z.number().int().min(1).max(512).default(4),
  gpusPerNode: z.number().int().min(1).max(16).default(8),
  interconnectFabric: z
    .enum(["nvlink-4-nvsymmetric", "infiniband-ndr-400gbps", "roce-v2-ethernet", "pcie-gen5"])
    .default("nvlink-4-nvsymmetric"),
  gpudirectStorageEnabled: z.boolean().default(true),
  coolingInfrastructure: z
    .enum(["direct-to-chip-liquid", "immersion-cooled", "rear-door-heat-exchanger", "forced-air"])
    .default("direct-to-chip-liquid"),
});
export type GpuClusterConfig = z.infer<typeof GpuClusterConfigSchema>;

// 05 — Inference Cache
export const InferenceCacheConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("inference-cache"),
  similarityThreshold: z.number().min(0.5).max(0.99).default(0.88),
  distanceMetric: z
    .enum(["cosine", "euclidean", "inner-product"])
    .default("cosine"),
  storageBackend: z
    .enum(["redis-vector-search", "milvus-embedded", "qdrant-cache", "in-memory-lru"])
    .default("redis-vector-search"),
  ttlHours: z.number().int().min(1).max(720).default(48),
  exactMatchBypass: z.boolean().default(true),
  evictionPolicy: z
    .enum(["least-recently-used", "least-frequently-used", "score-weighted-decay"])
    .default("least-recently-used"),
});
export type InferenceCacheConfig = z.infer<typeof InferenceCacheConfigSchema>;

// 06 — Fine-Tuning Job
export const FineTuningJobConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("fine-tuning-job"),
  tuningMethod: z
    .enum(["lora", "qlora", "full-weight-sft", "dpo-direct-preference", "rlhf-ppo"])
    .default("lora"),
  baseModelIdentifier: z.string().default("meta-llama/Llama-3.1-8B-Instruct"),
  loraRank: z.number().int().min(1).max(256).default(32),
  loraAlpha: z.number().int().min(1).max(512).default(64),
  learningRate: z.number().min(0.000001).max(0.01).default(0.0002),
  epochs: z.number().int().min(1).max(100).default(3),
  optimizerType: z
    .enum(["paged-adamw-8bit", "adamw-32bit", "lion-8bit", "galore"])
    .default("paged-adamw-8bit"),
  checkpointSaveFrequencySteps: z.number().int().min(10).max(5000).default(250),
});
export type FineTuningJobConfig = z.infer<typeof FineTuningJobConfigSchema>;

// 07 — Model Registry
export const ModelRegistryConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("model-registry"),
  backendArtifactStore: z
    .enum(["s3-versioned-bucket", "gcs-artifact-registry", "azure-blob-storage", "oci-registry"])
    .default("s3-versioned-bucket"),
  defaultDeploymentStage: z
    .enum(["staging", "production", "shadow-canary", "archived"])
    .default("staging"),
  artifactFormat: z
    .enum(["safetensors", "gguf-quantized", "onnx-graph", "torchscript"])
    .default("safetensors"),
  immutableTagsEnabled: z.boolean().default(true),
  vulnerabilityScanOnPush: z.boolean().default(true),
  lineageAuditTracking: z.boolean().default(true),
});
export type ModelRegistryConfig = z.infer<typeof ModelRegistryConfigSchema>;

// 08 — Evaluation Gateway
export const EvaluationGatewayConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("evaluation-gateway"),
  evaluationFramework: z
    .enum(["ragas-eval", "deepeval-suite", "custom-llm-judge", "prometheus-eval", "truera"])
    .default("ragas-eval"),
  metricsMonitored: z
    .array(z.enum(["faithfulness", "answer-relevancy", "context-precision", "hallucination-score", "toxicity", "latency-p99"]))
    .default(["faithfulness", "answer-relevancy", "hallucination-score"]),
  judgeModelIdentifier: z.string().default("gpt-4o-mini"),
  sampleRatePercent: z.number().int().min(1).max(100).default(20),
  alertScoreThreshold: z.number().min(0.1).max(1.0).default(0.75),
});
export type EvaluationGatewayConfig = z.infer<typeof EvaluationGatewayConfigSchema>;

// 09 — Guardrail Proxy
export const GuardrailProxyConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("guardrail-proxy"),
  promptInjectionDefense: z
    .enum(["strict-neural-classifier", "balanced-heuristics", "permissive-logging-only"])
    .default("strict-neural-classifier"),
  piiAction: z
    .enum(["redact-with-tokens", "mask-hash", "block-request"])
    .default("redact-with-tokens"),
  toxicityThreshold: z.number().min(0.1).max(1.0).default(0.7),
  enforceJsonSchemaOutput: z.boolean().default(true),
  jailbreakHeuristicsEnabled: z.boolean().default(true),
  auditViolationSink: z
    .enum(["security-siem", "cloudwatch-logs", "datadog-events", "slack-alert-webhook"])
    .default("security-siem"),
});
export type GuardrailProxyConfig = z.infer<typeof GuardrailProxyConfigSchema>;

// 10 — Agent Orchestrator
export const AgentOrchestratorConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("agent-orchestrator"),
  orchestrationPattern: z
    .enum(["react-loop", "plan-and-execute", "hierarchical-multi-agent", "swarm-decentralized"])
    .default("react-loop"),
  maxExecutionSteps: z.number().int().min(1).max(100).default(25),
  statePersistenceBackend: z
    .enum(["postgresql-checkpoint", "redis-session-store", "dynamodb-thread", "in-memory"])
    .default("postgresql-checkpoint"),
  executionTimeoutSeconds: z.number().int().min(5).max(1800).default(120),
  humanInTheLoopApproval: z.boolean().default(true),
  toolCallParallelization: z.boolean().default(true),
});
export type AgentOrchestratorConfig = z.infer<typeof AgentOrchestratorConfigSchema>;
