import { z } from "zod";
import { SharedInfrastructureConfigSchema } from "./clients.schema";

// 01 — Relational Database
export const RelationalDatabaseConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("relational-database"),
  engineCategory: z
    .enum(["postgresql", "mysql", "mariadb", "oracle", "sql-server", "sqlite"])
    .default("postgresql"),
  sqlDialect: z
    .enum(["ansi-standard", "postgres-extended", "t-sql", "pl-sql"])
    .default("postgres-extended"),
  storageCapacityGb: z.number().int().min(10).max(65536).default(250),
  transactionSupport: z.enum(["acid-full", "eventual-consistent"]).default("acid-full"),
  isolationLevel: z
    .enum(["read-committed", "repeatable-read", "serializable", "read-uncommitted"])
    .default("read-committed"),
  indexingStrategy: z
    .enum(["b-tree-primary", "hash-index", "composite-covering", "gin-gist"])
    .default("b-tree-primary"),
  maxConnections: z.number().int().min(10).max(10000).default(500),
  backupRetentionDays: z.number().int().min(1).max(365).default(30),
  assumedQps: z.number().int().min(1).max(500000).default(5000),
});
export type RelationalDatabaseConfig = z.infer<typeof RelationalDatabaseConfigSchema>;

// 02 — PostgreSQL
export const PostgresqlConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("postgresql"),
  version: z.enum(["17", "16", "15", "14"]).default("16"),
  deploymentModel: z
    .enum(["managed-rds-aurora", "cloud-native-operator", "bare-metal-ha", "single-instance"])
    .default("managed-rds-aurora"),
  instanceClass: z.string().min(1).max(64).default("db.r6g.2xlarge"),
  connectionPoolSize: z.number().int().min(10).max(5000).default(200),
  replicationMode: z
    .enum(["streaming-async", "streaming-sync", "logical-replication", "none"])
    .default("streaming-async"),
  walLevel: z.enum(["replica", "logical", "minimal"]).default("replica"),
  storageGb: z.number().int().min(20).max(65536).default(500),
  extensions: z.string().min(0).max(256).default("pgcrypto, pg_stat_statements, uuid-ossp, vector"),
  highAvailability: z.boolean().default(true),
});
export type PostgresqlConfig = z.infer<typeof PostgresqlConfigSchema>;

// 03 — MySQL
export const MysqlConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("mysql"),
  version: z.enum(["8.4-lts", "8.0", "5.7"]).default("8.4-lts"),
  storageEngine: z.enum(["InnoDB", "NDB-Cluster", "MyISAM", "Memory"]).default("InnoDB"),
  deploymentModel: z
    .enum(["managed-cloud", "group-replication-cluster", "source-replica", "standalone"])
    .default("managed-cloud"),
  maxConnections: z.number().int().min(10).max(10000).default(300),
  replicationMode: z
    .enum(["row-based-binlog", "gtid-semisync", "group-replication-paxos", "statement-based"])
    .default("gtid-semisync"),
  innodbBufferPoolSizeMb: z.number().int().min(512).max(524288).default(16384),
  storageGb: z.number().int().min(20).max(65536).default(500),
  backupStrategy: z
    .enum(["automated-daily-snapshot", "point-in-time-binlog", "mysqldump-export"])
    .default("automated-daily-snapshot"),
  multiAz: z.boolean().default(true),
});
export type MysqlConfig = z.infer<typeof MysqlConfigSchema>;

// 04 — Distributed SQL Database
export const DistributedSqlDatabaseConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("distributed-sql-database"),
  distributionArchitecture: z
    .enum(["cockroachdb", "yugabytedb", "google-spanner", "tidb"])
    .default("cockroachdb"),
  nodeCount: z.number().int().min(3).max(100).default(6),
  replicationFactor: z.number().int().min(3).max(9).default(3),
  consistencyModel: z
    .enum(["strict-serializable-paxos", "raft-linearizable", "external-consistency-truetime"])
    .default("strict-serializable-paxos"),
  shardingStrategy: z
    .enum(["range-based", "hash-partitioned", "geo-partitioned"])
    .default("range-based"),
  regionCount: z.number().int().min(1).max(10).default(3),
  transactionGuarantees: z
    .enum(["distributed-2pc", "raft-per-range-commit"])
    .default("raft-per-range-commit"),
  failureTolerance: z.enum(["node-level", "rack-level", "region-level"]).default("region-level"),
});
export type DistributedSqlDatabaseConfig = z.infer<typeof DistributedSqlDatabaseConfigSchema>;

// 05 — Document Database
export const DocumentDatabaseConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("document-database"),
  documentModel: z
    .enum(["mongodb-bson", "couchbase-json", "aws-documentdb", "dynamodb-doc"])
    .default("mongodb-bson"),
  collectionCount: z.number().int().min(1).max(500).default(12),
  indexingStrategy: z
    .enum(["compound-multikey", "text-search", "geospatial-2dsphere", "wildcard"])
    .default("compound-multikey"),
  shardingMode: z
    .enum(["ranged-shard-key", "hashed-shard-key", "zone-sharded", "unsharded"])
    .default("hashed-shard-key"),
  replicaSetMembers: z.number().int().min(1).max(15).default(3),
  readPreference: z
    .enum(["primary", "primaryPreferred", "secondary", "secondaryPreferred", "nearest"])
    .default("primaryPreferred"),
  schemaValidation: z
    .enum(["json-schema-strict", "json-schema-moderate", "disabled"])
    .default("json-schema-strict"),
  maxDocumentSizeKb: z.number().int().min(16).max(16384).default(16),
});
export type DocumentDatabaseConfig = z.infer<typeof DocumentDatabaseConfigSchema>;

// 06 — Key-Value Database
export const KeyValueDatabaseConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("key-value-database"),
  engineCategory: z
    .enum(["redis-kv", "aws-dynamodb-kv", "rocksdb-embedded", "aerospike"])
    .default("redis-kv"),
  keyStructure: z.string().min(1).max(64).default("namespace:entity:id"),
  persistenceStrategy: z
    .enum(["aof-everysec", "rdb-snapshot", "hybrid-aof-rdb", "memory-only"])
    .default("hybrid-aof-rdb"),
  ttlSupported: z.boolean().default(true),
  evictionPolicy: z
    .enum(["volatile-lru", "allkeys-lru", "volatile-lfu", "noeviction"])
    .default("allkeys-lru"),
  clusterShards: z.number().int().min(1).max(1024).default(3),
  consistencyModel: z
    .enum(["eventual-read", "strongly-consistent-read"])
    .default("strongly-consistent-read"),
  assumedOpsPerSecond: z.number().int().min(100).max(5000000).default(50000),
});
export type KeyValueDatabaseConfig = z.infer<typeof KeyValueDatabaseConfigSchema>;

// 07 — Wide-Column Database
export const WideColumnDatabaseConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("wide-column-database"),
  columnModel: z
    .enum(["apache-cassandra", "scylladb", "google-bigtable", "apache-hbase"])
    .default("apache-cassandra"),
  partitionKeyStrategy: z.string().min(1).max(64).default("tenant_id, bucket_epoch"),
  replicationFactor: z.number().int().min(1).max(7).default(3),
  consistencyLevel: z
    .enum(["QUORUM", "LOCAL_QUORUM", "ONE", "ALL"])
    .default("LOCAL_QUORUM"),
  compactionStrategy: z
    .enum(["SizeTieredCompaction", "LeveledCompaction", "TimeWindowCompaction"])
    .default("LeveledCompaction"),
  nodeCount: z.number().int().min(3).max(200).default(9),
  datacenterPlacement: z
    .enum(["single-dc", "multi-dc-active-active"])
    .default("multi-dc-active-active"),
});
export type WideColumnDatabaseConfig = z.infer<typeof WideColumnDatabaseConfigSchema>;

// 08 — Graph Database
export const GraphDatabaseConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("graph-database"),
  graphModel: z
    .enum(["labeled-property-graph", "rdf-triple-store"])
    .default("labeled-property-graph"),
  queryLanguage: z.enum(["Cypher", "Gremlin", "SPARQL", "GQL"]).default("Cypher"),
  engineCategory: z
    .enum(["neo4j", "amazon-neptune", "memgraph", "arangodb"])
    .default("neo4j"),
  indexType: z
    .enum(["schema-index-btrees", "fulltext-search", "vector-graph"])
    .default("schema-index-btrees"),
  traversalDepthLimit: z.number().int().min(1).max(20).default(5),
  clusteringMode: z
    .enum(["causal-cluster", "standalone", "replicated-read"])
    .default("causal-cluster"),
  assumedNodeCountMillions: z.number().min(0.1).max(5000).default(10),
});
export type GraphDatabaseConfig = z.infer<typeof GraphDatabaseConfigSchema>;

// 09 — Time-Series Database
export const TimeSeriesDatabaseConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("time-series-database"),
  engineCategory: z
    .enum(["timescaledb", "influxdb", "clickhouse-ts", "prometheus"])
    .default("timescaledb"),
  timestampPrecision: z
    .enum(["nanoseconds", "microseconds", "milliseconds", "seconds"])
    .default("milliseconds"),
  retentionDays: z.number().int().min(1).max(3650).default(90),
  partitionChunkIntervalDays: z.number().int().min(1).max(30).default(7),
  compressionEnabled: z.boolean().default(true),
  downsamplingPolicy: z
    .enum(["continuous-aggregate-1h", "daily-rollups", "none"])
    .default("continuous-aggregate-1h"),
  ingestionRatePerSecond: z.number().int().min(100).max(5000000).default(25000),
});
export type TimeSeriesDatabaseConfig = z.infer<typeof TimeSeriesDatabaseConfigSchema>;

// 10 — Vector Database
export const VectorDatabaseConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("vector-database"),
  engineCategory: z
    .enum(["pinecone", "milvus", "qdrant", "weaviate", "pgvector"])
    .default("qdrant"),
  embeddingDimensions: z.number().int().min(64).max(8192).default(1536),
  distanceMetric: z.enum(["cosine", "euclidean-l2", "dot-product"]).default("cosine"),
  indexAlgorithm: z.enum(["hnsw", "ivf-flat", "scann", "flat"]).default("hnsw"),
  metadataFilteringSupported: z.boolean().default(true),
  quantizationMode: z
    .enum(["scalar-quantization-int8", "product-quantization", "fp32-uncompressed"])
    .default("scalar-quantization-int8"),
  assumedVectorCountThousands: z.number().int().min(1).max(500000).default(1000),
});
export type VectorDatabaseConfig = z.infer<typeof VectorDatabaseConfigSchema>;

// 11 — In-Memory Database
export const InMemoryDatabaseConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("in-memory-database"),
  engineCategory: z
    .enum(["redis", "memcached", "valkey", "hazelcast", "dragonfly"])
    .default("redis"),
  memoryCapacityGb: z.number().int().min(1).max(1024).default(32),
  persistenceMode: z
    .enum(["rdb-snapshot-and-aof", "aof-only", "snapshot-only", "ephemeral-none"])
    .default("rdb-snapshot-and-aof"),
  evictionStrategy: z
    .enum(["volatile-lru", "allkeys-lru", "volatile-ttl", "noeviction"])
    .default("volatile-lru"),
  highAvailabilityMode: z
    .enum(["redis-sentinel", "redis-cluster", "single-node"])
    .default("redis-sentinel"),
  replicaCount: z.number().int().min(0).max(8).default(2),
});
export type InMemoryDatabaseConfig = z.infer<typeof InMemoryDatabaseConfigSchema>;

// 12 — Database Primary
export const DatabasePrimaryConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("database-primary"),
  databaseEngine: z.enum(["postgresql", "mysql", "distributed-sql"]).default("postgresql"),
  writeRole: z
    .enum(["read-write-primary", "active-active-master"])
    .default("read-write-primary"),
  replicationSyncMode: z
    .enum(["synchronous", "asynchronous", "semi-synchronous"])
    .default("asynchronous"),
  configuredReplicasCount: z.number().int().min(1).max(16).default(2),
  failoverStrategy: z
    .enum(["automated-patroni-raft", "cloud-managed-failover", "manual-operator"])
    .default("automated-patroni-raft"),
  storageAllocationGb: z.number().int().min(50).max(65536).default(500),
  assumedWriteIops: z.number().int().min(100).max(100000).default(5000),
});
export type DatabasePrimaryConfig = z.infer<typeof DatabasePrimaryConfigSchema>;

// 13 — Read Replica
export const ReadReplicaConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("read-replica"),
  primaryReference: z.string().min(1).max(128).default("db-primary.production.internal"),
  replicationMode: z
    .enum(["async-streaming", "sync-replica", "cascading-replica"])
    .default("async-streaming"),
  failoverEligible: z.boolean().default(true),
  readRoutingPolicy: z
    .enum(["round-robin-reader", "least-lagged-first", "geo-routed"])
    .default("least-lagged-first"),
  storageAllocationGb: z.number().int().min(50).max(65536).default(500),
  assumedReadQps: z.number().int().min(100).max(500000).default(12000),
});
export type ReadReplicaConfig = z.infer<typeof ReadReplicaConfigSchema>;

// 14 — Database Cluster
export const DatabaseClusterConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("database-cluster"),
  clusterTopology: z
    .enum(["primary-multi-replica", "multi-master-galera", "sharded-cluster-patroni", "raft-consensus-quorum"])
    .default("primary-multi-replica"),
  nodeCount: z.number().int().min(2).max(64).default(5),
  replicationFactor: z.number().int().min(2).max(7).default(3),
  leaderElectionStrategy: z
    .enum(["etcd-raft", "consul-sessions", "kubernetes-leases", "internal-paxos"])
    .default("etcd-raft"),
  autoFailoverSeconds: z.number().int().min(5).max(120).default(15),
  connectionRouter: z
    .enum(["pgbouncer-pool", "proxysql", "haproxy", "built-in"])
    .default("pgbouncer-pool"),
  multiAz: z.boolean().default(true),
});
export type DatabaseClusterConfig = z.infer<typeof DatabaseClusterConfigSchema>;

// 15 — Data Warehouse
export const DataWarehouseConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("data-warehouse"),
  analyticalEngine: z
    .enum(["snowflake", "bigquery", "redshift-serverless", "clickhouse-olap", "databricks-sql"])
    .default("snowflake"),
  storageModel: z
    .enum(["cloud-object-parquet", "native-columnar-compressed", "delta-lake-format"])
    .default("cloud-object-parquet"),
  computeClusterSize: z
    .string()
    .min(1)
    .max(64)
    .default("Medium (4-Node Virtual Warehouse)"),
  partitioningColumn: z.string().min(1).max(64).default("event_date"),
  ingestionPipeline: z
    .enum(["micro-batch-snowpipe", "cdc-debezium-stream", "scheduled-nightly-etl"])
    .default("micro-batch-snowpipe"),
  concurrencyLimit: z.number().int().min(1).max(128).default(16),
  assumedDataVolumeTb: z.number().min(0.5).max(10000).default(25),
});
export type DataWarehouseConfig = z.infer<typeof DataWarehouseConfigSchema>;

