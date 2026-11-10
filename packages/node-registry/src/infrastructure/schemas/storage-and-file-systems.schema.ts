import { z } from "zod";
import { SharedInfrastructureConfigSchema } from "./clients.schema";

// 01 — Object Storage
export const ObjectStorageConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("object-storage"),
  storageProviderCategory: z
    .enum(["s3-compatible", "aws-s3", "gcp-gcs", "azure-blob", "minio", "ceph-rgw"])
    .default("s3-compatible"),
  bucketName: z.string().min(1).default("assets-production-bucket"),
  region: z.string().default("us-east-1"),
  storageClass: z
    .enum(["standard", "infrequent-access", "glacier-archive", "intelligent-tiering"])
    .default("standard"),
  versioningEnabled: z.boolean().default(true),
  lifecyclePolicy: z
    .enum(["none", "transition-to-cold-30d", "delete-after-90d", "multipart-cleanup"])
    .default("transition-to-cold-30d"),
  maxObjectSizeBytes: z.number().int().min(1024).max(5497558138880).default(5368709120), // 5 GB
  encryptionAtRest: z
    .enum(["sse-s3-aes256", "sse-kms", "client-side-rsa", "none"])
    .default("sse-s3-aes256"),
  accessControlModel: z
    .enum(["iam-bucket-policy", "acl-private", "presigned-urls", "public-read"])
    .default("iam-bucket-policy"),
  crossRegionReplication: z.boolean().default(false),
  assumedCapacityTb: z.number().min(0.1).max(100000).default(50),
});
export type ObjectStorageConfig = z.infer<typeof ObjectStorageConfigSchema>;

// 02 — Block Storage
export const BlockStorageConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("block-storage"),
  volumeType: z
    .enum([
      "nvme-ssd",
      "provisioned-iops-ssd",
      "general-purpose-ssd",
      "throughput-optimized-hdd",
      "cold-hdd",
    ])
    .default("general-purpose-ssd"),
  capacityGb: z.number().int().min(1).max(65536).default(500),
  provisionedIops: z.number().int().min(100).max(256000).default(3000),
  throughputMbSec: z.number().int().min(10).max(4000).default(250),
  attachmentMode: z
    .enum(["single-host-exclusive", "multi-attach-clustered", "read-only-shared"])
    .default("single-host-exclusive"),
  filesystemType: z
    .enum(["ext4", "xfs", "btrfs", "ntfs", "zfs", "raw-block"])
    .default("ext4"),
  snapshotPolicy: z
    .enum(["hourly-rolling", "daily-snapshots", "manual-only", "disabled"])
    .default("daily-snapshots"),
  encryptionEnabled: z.boolean().default(true),
  availabilityZone: z.string().default("us-east-1a"),
  assumedLatencyMs: z.number().min(0.1).max(100).default(1.2),
});
export type BlockStorageConfig = z.infer<typeof BlockStorageConfigSchema>;

// 03 — File Storage
export const FileStorageConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("file-storage"),
  filesystemType: z
    .enum(["managed-nfs", "managed-smb", "lustre", "gpfs", "zfs-appliance"])
    .default("managed-nfs"),
  accessProtocol: z
    .enum(["nfs-v4", "nfs-v3", "smb-3.0", "posix-native", "dual-protocol"])
    .default("nfs-v4"),
  mountPath: z.string().default("/mnt/shared-data"),
  capacityGb: z.number().int().min(10).max(1048576).default(2048),
  permissionsModel: z
    .enum(["posix-uid-gid", "acl-active-directory", "root-squash-only"])
    .default("posix-uid-gid"),
  fileLocking: z
    .enum(["posix-fcntl", "byte-range-locking", "opportunistic-locks", "disabled"])
    .default("posix-fcntl"),
  snapshotPolicy: z
    .enum(["daily-retention-7d", "hourly-rolling", "manual", "disabled"])
    .default("daily-retention-7d"),
  backupPolicy: z
    .enum(["nightly-incremental", "continuous-vault", "snapshot-mirror", "disabled"])
    .default("nightly-incremental"),
  assumedThroughputMbSec: z.number().int().min(10).max(10240).default(500),
});
export type FileStorageConfig = z.infer<typeof FileStorageConfigSchema>;

// 04 — Distributed File System
export const DistributedFileSystemConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("distributed-file-system"),
  architecture: z
    .enum(["hdfs", "ceph-cephfs", "glusterfs", "seaweedfs", "moosefs"])
    .default("ceph-cephfs"),
  nodeCount: z.number().int().min(3).max(10000).default(9),
  replicationFactor: z.number().int().min(1).max(10).default(3),
  erasureCodingEnabled: z.boolean().default(true),
  dataPlacementPolicy: z
    .enum(["rack-aware", "multi-az-distributed", "crush-map", "locality-first"])
    .default("crush-map"),
  consistencyModel: z
    .enum(["strong-posix", "eventual-consistency", "append-only-strong"])
    .default("strong-posix"),
  metadataManagement: z
    .enum([
      "dedicated-active-standby",
      "distributed-metadata-mds",
      "hash-ring-metadata",
    ])
    .default("distributed-metadata-mds"),
  failureTolerance: z
    .enum(["n-minus-1", "n-minus-2", "erasure-coded-k-plus-m"])
    .default("erasure-coded-k-plus-m"),
  aggregateCapacityTb: z.number().min(1).max(500000).default(500),
});
export type DistributedFileSystemConfig = z.infer<typeof DistributedFileSystemConfigSchema>;

// 05 — Blob Storage
export const BlobStorageConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("blob-storage"),
  containerName: z.string().default("binary-data-container"),
  storageTier: z.enum(["hot", "cool", "cold", "archive"]).default("hot"),
  maxBlobSizeBytes: z.number().int().min(1024).max(5497558138880).default(5368709120),
  blobType: z.enum(["block-blob", "append-blob", "page-blob"]).default("block-blob"),
  encryption: z
    .enum(["platform-managed-key", "customer-managed-hsm", "double-encryption"])
    .default("platform-managed-key"),
  immutabilityWorm: z.boolean().default(false),
  versioningEnabled: z.boolean().default(true),
  lifecycleTransitionDays: z.number().int().min(0).max(3650).default(30),
  redundancy: z
    .enum(["lrs-locally-redundant", "zrs-zone-redundant", "grs-geo-redundant", "ra-grs"])
    .default("zrs-zone-redundant"),
  assumedObjectCount: z.number().int().min(1).max(1000000000).default(1000000),
});
export type BlobStorageConfig = z.infer<typeof BlobStorageConfigSchema>;

// 06 — Media Storage
export const MediaStorageConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("media-storage"),
  supportedMediaCategories: z
    .enum([
      "images",
      "streaming-video",
      "audio-podcasts",
      "raw-footage",
      "multi-asset-catalog",
    ])
    .default("multi-asset-catalog"),
  storageBackend: z
    .enum(["object-store-backed", "fast-ssd-tier", "hybrid-tier"])
    .default("object-store-backed"),
  assetOrganization: z
    .enum([
      "hash-sharded-prefixes",
      "tenant-date-tree",
      "media-id-flat",
      "hls-dash-manifest",
    ])
    .default("hash-sharded-prefixes"),
  metadataStrategy: z
    .enum(["embedded-exif-xmp", "sidecar-json", "database-indexed"])
    .default("database-indexed"),
  renditionStorage: z
    .enum([
      "automatic-thumbnails-pregenerated",
      "on-demand-edge-rendered",
      "multi-bitrate-variants",
    ])
    .default("automatic-thumbnails-pregenerated"),
  accessPolicy: z
    .enum(["signed-token-cdn", "public-authenticated-cors", "private-origin-only"])
    .default("signed-token-cdn"),
  retentionDays: z.number().int().min(1).max(7300).default(365),
  cdnOriginShieldEnabled: z.boolean().default(true),
  assumedAssetVolumeGb: z.number().min(1).max(5000000).default(25000),
});
export type MediaStorageConfig = z.infer<typeof MediaStorageConfigSchema>;

// 07 — Backup Storage
export const BackupStorageConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("backup-storage"),
  backupType: z
    .enum([
      "full-image",
      "incremental-forever",
      "differential",
      "transaction-log-wal",
      "synthetic-full",
    ])
    .default("incremental-forever"),
  backupFrequency: z
    .enum(["continuous-cdc", "hourly", "daily", "weekly", "custom-cron"])
    .default("daily"),
  retentionDays: z.number().int().min(1).max(36500).default(90),
  backupDestination: z
    .enum([
      "isolated-vault-account",
      "cross-region-s3",
      "immutable-worm-bucket",
      "secondary-datacenter",
    ])
    .default("isolated-vault-account"),
  encryptionStandard: z
    .enum(["aes-256-gcm", "kms-enveloped", "zero-knowledge-passphrase"])
    .default("kms-enveloped"),
  immutabilityLockEnabled: z.boolean().default(true),
  restoreStrategy: z
    .enum(["instant-mount-clone", "full-bare-metal-recovery", "granular-item-level"])
    .default("instant-mount-clone"),
  recoveryPointObjectiveMinutes: z.number().int().min(0).max(43200).default(60),
  recoveryTimeObjectiveMinutes: z.number().int().min(1).max(43200).default(120),
  assumedBackupSizeGb: z.number().min(1).max(10000000).default(10000),
});
export type BackupStorageConfig = z.infer<typeof BackupStorageConfigSchema>;

// 08 — Archive Storage
export const ArchiveStorageConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("archive-storage"),
  archiveTier: z
    .enum([
      "flexible-retrieval",
      "deep-archive",
      "cold-tape-emulation",
      "instant-retrieval",
    ])
    .default("deep-archive"),
  retentionYears: z.number().int().min(1).max(100).default(7),
  retrievalLatency: z
    .enum(["minutes-expedited", "hours-standard", "12-to-48-hours-bulk"])
    .default("hours-standard"),
  retrievalCostCategory: z
    .enum(["high-access-penalty", "predictable-bulk-cost", "free-allowance-tier"])
    .default("predictable-bulk-cost"),
  immutabilityWormLock: z.boolean().default(true),
  legalHoldEnabled: z.boolean().default(false),
  encryptionStandard: z
    .enum(["hardware-security-module", "aes-256-envelope", "fips-140-3"])
    .default("aes-256-envelope"),
  lifecycleTransitionRule: z
    .enum([
      "auto-archive-from-standard",
      "direct-to-deep-archive",
      "compliance-scheduled",
    ])
    .default("auto-archive-from-standard"),
  assumedArchiveVolumeTb: z.number().min(1).max(500000).default(200),
});
export type ArchiveStorageConfig = z.infer<typeof ArchiveStorageConfigSchema>;

// 09 — Storage Gateway
export const StorageGatewayConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("storage-gateway"),
  gatewayType: z
    .enum(["file-gateway", "volume-gateway", "tape-gateway", "object-api-bridge"])
    .default("file-gateway"),
  clientProtocol: z
    .enum(["nfs-v4.1", "smb-3.1", "iscsi", "s3-rest-proxy"])
    .default("nfs-v4.1"),
  backendStorageType: z
    .enum(["s3-object", "azure-blob", "cloud-block-store", "multi-cloud-pool"])
    .default("s3-object"),
  cacheMode: z
    .enum(["read-write-local-cache", "read-through-cache", "pass-through-buffer"])
    .default("read-write-local-cache"),
  synchronizationStrategy: z
    .enum(["async-scheduled-upload", "realtime-event-driven", "write-through-flush"])
    .default("realtime-event-driven"),
  cacheSizeGb: z.number().int().min(10).max(65536).default(2048),
  encryptionInTransit: z.enum(["tls-1.3", "ipsec-vpn", "private-peering"]).default("tls-1.3"),
  failoverMode: z
    .enum(["active-standby", "stateless-load-balanced", "local-read-only-fallback"])
    .default("active-standby"),
  assumedThroughputMbSec: z.number().int().min(10).max(5000).default(450),
});
export type StorageGatewayConfig = z.infer<typeof StorageGatewayConfigSchema>;

// 10 — Content Repository
export const ContentRepositoryConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("content-repository"),
  repositoryModel: z
    .enum([
      "headless-cms-repository",
      "enterprise-ecm",
      "digital-asset-management",
      "versioned-doc-store",
    ])
    .default("headless-cms-repository"),
  contentTypes: z
    .enum([
      "structured-json-content",
      "rich-documents-pdf-office",
      "source-code-artifacts",
      "hybrid-multimedia",
    ])
    .default("structured-json-content"),
  metadataSchemaStrategy: z
    .enum(["schema-enforced-json", "dynamic-facet-tags", "dublin-core-standard"])
    .default("schema-enforced-json"),
  versioningModel: z
    .enum([
      "linear-immutable-commits",
      "semantic-major-minor",
      "draft-published-states",
    ])
    .default("draft-published-states"),
  accessControlModel: z
    .enum(["rbac-team-roles", "abac-attribute-scoped", "workspace-level-grant"])
    .default("rbac-team-roles"),
  searchIndexingBackend: z
    .enum(["elasticsearch-vector", "opensearch-bm25", "embedded-fulltext"])
    .default("elasticsearch-vector"),
  workflowEngineEnabled: z.boolean().default(true),
  retentionPolicy: z
    .enum(["indefinite", "audit-7-years", "ephemeral-project-lifecycle"])
    .default("indefinite"),
  assumedContentCount: z.number().int().min(10).max(100000000).default(250000),
});
export type ContentRepositoryConfig = z.infer<typeof ContentRepositoryConfigSchema>;

// Union of all Storage & File Systems Config Schemas
export const AnyStorageAndFileSystemsConfigSchema = z.discriminatedUnion(
  "componentType",
  [
    ObjectStorageConfigSchema,
    BlockStorageConfigSchema,
    FileStorageConfigSchema,
    DistributedFileSystemConfigSchema,
    BlobStorageConfigSchema,
    MediaStorageConfigSchema,
    BackupStorageConfigSchema,
    ArchiveStorageConfigSchema,
    StorageGatewayConfigSchema,
    ContentRepositoryConfigSchema,
  ]
);
export type AnyStorageAndFileSystemsConfig = z.infer<
  typeof AnyStorageAndFileSystemsConfigSchema
>;

