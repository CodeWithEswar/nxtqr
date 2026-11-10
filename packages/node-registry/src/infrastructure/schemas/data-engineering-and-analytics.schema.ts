import { z } from "zod";
import { SharedInfrastructureConfigSchema } from "./clients.schema";

// 01 — ETL Pipeline
export const EtlPipelineConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("etl-pipeline"),
  extractionMode: z.enum(["batch", "incremental", "streaming"]).default("batch"),
  transformationStrategy: z
    .enum(["in-memory-spark", "map-reduce", "stream-filter-enrich", "sql-dbt", "python-pandas"])
    .default("in-memory-spark"),
  loadStrategy: z
    .enum(["bulk-append", "upsert-merge", "full-overwrite", "scd-type-2"])
    .default("upsert-merge"),
  batchSize: z.number().int().min(100).max(10000000).default(50000),
  scheduleCron: z.string().default("0 2 * * *"),
  retryPolicy: z
    .enum(["exponential-backoff", "fixed-interval", "dead-letter-spill", "no-retry"])
    .default("exponential-backoff"),
  errorHandling: z
    .enum(["abort-on-error", "quarantine-records", "skip-and-log"])
    .default("quarantine-records"),
  targetThroughputRecordsPerSec: z.number().int().min(10).max(1000000).default(5000),
});
export type EtlPipelineConfig = z.infer<typeof EtlPipelineConfigSchema>;

// 02 — ELT Pipeline
export const EltPipelineConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("elt-pipeline"),
  loadingStrategy: z
    .enum(["raw-dump", "micro-batch-append", "direct-stage-copy", "zero-copy-clone"])
    .default("direct-stage-copy"),
  inDestinationTransformation: z
    .enum(["sql-dbt-models", "stored-procedures", "dynamic-views", "materialized-tables"])
    .default("sql-dbt-models"),
  transformationEngine: z
    .enum(["snowflake-virtual-warehouse", "bigquery-slots", "databricks-photon", "redshift-cluster", "duckdb"])
    .default("snowflake-virtual-warehouse"),
  incrementalModel: z
    .enum(["append-only", "merge-key", "delete-insert", "timestamp-watermark"])
    .default("timestamp-watermark"),
  scheduleCron: z.string().default("*/30 * * * *"),
  retryPolicy: z
    .enum(["exponential-backoff", "immediate-retry", "circuit-breaker"])
    .default("exponential-backoff"),
  assumedProcessingVolumeGb: z.number().int().min(1).max(100000).default(250),
});
export type EltPipelineConfig = z.infer<typeof EltPipelineConfigSchema>;

// 03 — Data Lake
export const DataLakeConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("data-lake"),
  storageBackend: z
    .enum(["s3-compatible", "azure-adls-gen2", "google-cloud-storage", "hdfs", "minio"])
    .default("s3-compatible"),
  dataFormats: z
    .array(z.enum(["parquet", "orc", "avro", "json", "csv", "delta"]))
    .default(["parquet", "json"]),
  partitioningStrategy: z
    .enum(["date-hierarchical", "hash-bucketed", "category-nested", "composite"])
    .default("date-hierarchical"),
  dataZones: z
    .array(z.enum(["raw-bronze", "cleaned-silver", "curated-gold"]))
    .default(["raw-bronze", "cleaned-silver", "curated-gold"]),
  metadataCatalog: z
    .enum(["aws-glue", "hive-metastore", "unity-catalog", "polaris", "nessie"])
    .default("aws-glue"),
  retentionDays: z.number().int().min(1).max(3650).default(365),
  accessControlModel: z
    .enum(["iam-role-based", "fine-grained-tag-based", "posix-acls"])
    .default("iam-role-based"),
  encryptionAtRest: z
    .enum(["sse-kms", "customer-managed-keys", "aes-256"])
    .default("sse-kms"),
  assumedCapacityTb: z.number().int().min(1).max(50000).default(100),
});
export type DataLakeConfig = z.infer<typeof DataLakeConfigSchema>;

// 04 — Data Lakehouse
export const DataLakehouseConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("data-lakehouse"),
  tableFormat: z.enum(["apache-iceberg", "delta-lake", "apache-hudi"]).default("apache-iceberg"),
  storageBackend: z
    .enum(["s3-compatible", "azure-adls-gen2", "google-cloud-storage", "minio"])
    .default("s3-compatible"),
  metadataCatalog: z
    .enum(["nessie", "unity-catalog", "aws-glue", "rest-catalog", "hive-metastore"])
    .default("rest-catalog"),
  transactionIsolation: z
    .enum(["snapshot-isolation", "serializable", "read-committed"])
    .default("snapshot-isolation"),
  schemaEvolution: z
    .enum(["full-additive", "strict-backward", "relaxed-type-promotion"])
    .default("full-additive"),
  partitionEvolution: z.boolean().default(true),
  compactionStrategy: z
    .enum(["bin-pack", "sort-z-order", "auto-optimize"])
    .default("bin-pack"),
  queryEngineSupport: z
    .array(z.enum(["trino", "spark", "duckdb", "flink", "presto"]))
    .default(["trino", "spark"]),
  assumedDataVolumeTb: z.number().int().min(1).max(50000).default(50),
});
export type DataLakehouseConfig = z.infer<typeof DataLakehouseConfigSchema>;

// 05 — Data Pipeline
export const DataPipelineConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("data-pipeline"),
  processingMode: z
    .enum(["batch", "streaming", "hybrid-lambda", "hybrid-kappa"])
    .default("hybrid-kappa"),
  streamingEngine: z
    .enum(["apache-flink", "spark-structured-streaming", "beam-dataflow", "kafka-streams"])
    .default("apache-flink"),
  transformationStrategy: z
    .enum(["windowed-aggregation", "stateful-enrichment", "stateless-map-filter", "event-dedup"])
    .default("stateful-enrichment"),
  checkpointIntervalSeconds: z.number().int().min(1).max(3600).default(30),
  backpressureStrategy: z
    .enum(["buffer-spill", "rate-throttle", "reactive-pull", "drop-oldest"])
    .default("rate-throttle"),
  deadLetterQueueEnabled: z.boolean().default(true),
  targetThroughputRecordsPerSec: z.number().int().min(100).max(5000000).default(25000),
});
export type DataPipelineConfig = z.infer<typeof DataPipelineConfigSchema>;

// 06 — Data Ingestion Service
export const DataIngestionServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("data-ingestion-service"),
  sourceProtocols: z
    .array(z.enum(["rest-http", "grpc", "mqtt", "webhook", "sftp-poll", "database-cdc"]))
    .default(["rest-http", "webhook"]),
  deliveryStrategy: z
    .enum(["at-least-once", "at-most-once", "exactly-once"])
    .default("at-least-once"),
  bufferingEngine: z
    .enum(["in-memory-ring-buffer", "disk-backed-wal", "redis-streams"])
    .default("in-memory-ring-buffer"),
  batchFlushTimeoutMs: z.number().int().min(50).max(60000).default(1000),
  batchMaxRecords: z.number().int().min(10).max(50000).default(2000),
  schemaValidation: z
    .enum(["json-schema", "protobuf", "avro-registry", "none"])
    .default("json-schema"),
  deduplicationWindowSeconds: z.number().int().min(0).max(86400).default(300),
  targetIngestionRateRecordsPerSec: z.number().int().min(100).max(2000000).default(10000),
});
export type DataIngestionServiceConfig = z.infer<typeof DataIngestionServiceConfigSchema>;

// 07 — Analytics Engine
export const AnalyticsEngineConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("analytics-engine"),
  queryModel: z
    .enum(["distributed-sql", "dataframe-api", "map-reduce", "vectorized-columnar"])
    .default("vectorized-columnar"),
  executionEngine: z
    .enum(["trino", "duckdb", "clickhouse", "spark-sql", "presto"])
    .default("trino"),
  aggregationCapabilities: z
    .array(z.enum(["hyperloglog", "t-digest-percentiles", "window-functions", "cube-rollup"]))
    .default(["window-functions", "hyperloglog"]),
  maxConcurrentQueries: z.number().int().min(1).max(500).default(32),
  memoryLimitPerQueryGb: z.number().int().min(1).max(512).default(16),
  cachingStrategy: z
    .enum(["result-set-cache", "data-fragment-cache", "none"])
    .default("result-set-cache"),
  targetP95QueryLatencyMs: z.number().int().min(10).max(60000).default(250),
});
export type AnalyticsEngineConfig = z.infer<typeof AnalyticsEngineConfigSchema>;

// 08 — OLAP Engine
export const OlapEngineConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("olap-engine"),
  olapArchitecture: z.enum(["rolap", "molap", "holap"]).default("rolap"),
  storageEngine: z
    .enum(["clickhouse-merge-tree", "apache-pinot", "apache-druid", "starrocks"])
    .default("clickhouse-merge-tree"),
  cubeMaterialization: z
    .enum(["real-time-aggregates", "precomputed-segments", "projection-views"])
    .default("projection-views"),
  partitioningKey: z
    .enum(["time-bucket", "entity-hash", "composite-geo"])
    .default("time-bucket"),
  queryConcurrencyLimit: z.number().int().min(1).max(1000).default(64),
  refreshPolicy: z
    .enum(["streaming-continuous", "micro-batch-1m", "scheduled-hourly"])
    .default("streaming-continuous"),
  targetQueryRateQps: z.number().int().min(1).max(10000).default(500),
});
export type OlapEngineConfig = z.infer<typeof OlapEngineConfigSchema>;

// 09 — CDC Connector
export const CdcConnectorConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("cdc-connector"),
  sourceDatabaseType: z
    .enum(["postgresql-wal", "mysql-binlog", "mongodb-oplog", "oracle-goldengate", "sqlserver-cdc"])
    .default("postgresql-wal"),
  captureMethod: z
    .enum(["transaction-log", "native-change-stream", "trigger-based", "polling"])
    .default("transaction-log"),
  changeEventFormat: z
    .enum(["debezium-json", "avro-confluent", "cloudevents-json", "raw-json"])
    .default("debezium-json"),
  initialSnapshotStrategy: z
    .enum(["initial-then-stream", "stream-only", "snapshot-never"])
    .default("initial-then-stream"),
  checkpointStrategy: z
    .enum(["kafka-offset", "zookeeper-state", "database-slot", "local-file"])
    .default("database-slot"),
  deliverySemantics: z
    .enum(["at-least-once", "exactly-once-transactional"])
    .default("at-least-once"),
  schemaEvolutionHandling: z
    .enum(["forward-compatible", "auto-register-new-version", "block-pipeline"])
    .default("auto-register-new-version"),
  assumedEventRatePerSec: z.number().int().min(10).max(500000).default(2500),
});
export type CdcConnectorConfig = z.infer<typeof CdcConnectorConfigSchema>;

// 10 — Workflow Orchestrator
export const WorkflowOrchestratorConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("workflow-orchestrator"),
  orchestratorEngine: z
    .enum(["apache-airflow", "temporal", "prefect", "dagster", "argo-workflows"])
    .default("apache-airflow"),
  workflowType: z
    .enum(["dag-batch", "event-triggered", "long-running-saga", "micro-orchestration"])
    .default("dag-batch"),
  scheduleCron: z.string().default("0 * * * *"),
  maxActiveDagRuns: z.number().int().min(1).max(100).default(8),
  taskConcurrencyLimit: z.number().int().min(1).max(1000).default(64),
  taskRetryLimit: z.number().int().min(0).max(20).default(3),
  timeoutSeconds: z.number().int().min(10).max(86400).default(3600),
  failureHandling: z
    .enum(["fail-fast", "continue-on-failure", "trigger-compensation-dag"])
    .default("fail-fast"),
  backfillSupported: z.boolean().default(true),
});
export type WorkflowOrchestratorConfig = z.infer<typeof WorkflowOrchestratorConfigSchema>;

