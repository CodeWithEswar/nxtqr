import { z } from "zod";

// Base shared infrastructure fields
const baseInfrastructureFields = {
  label: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  environment: z.enum(["development", "staging", "production", "edge", "local"]).default("production"),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(1024).optional(),
  enabled: z.boolean().default(true),
};

// Reusable cloud resource metadata sub-schema
export const cloudResourceMetadataSchema = z.object({
  provider: z.enum(["aws", "azure", "gcp", "cloudflare", "other"]).default("aws"),
  accountAlias: z.string().max(64).optional(),
  region: z.string().max(64).default("us-east-1"),
  availabilityZone: z.string().max(64).optional(),
  resourceClass: z.string().max(64).optional(),
  managed: z.boolean().default(true),
});
export type CloudResourceMetadata = z.infer<typeof cloudResourceMetadataSchema>;

// 1. Cloud Region Schema
export const cloudRegionConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("cloud-region").default("cloud-region"),
  provider: z.enum(["aws", "azure", "gcp", "cloudflare", "other"]).default("aws"),
  regionIdentifier: z.string().min(1).max(64).default("us-east-1"),
  geographicLocationLabel: z.string().min(1).max(128).default("N. Virginia, North America"),
  availabilityZoneCount: z.number().int().min(1).max(12).default(3),
  dataResidencyRequirement: z
    .enum(["strict-jurisdiction", "regional-replicated", "global-distributed"])
    .default("strict-jurisdiction"),
  disasterRecoveryStrategy: z
    .enum(["active-passive-warm", "active-active-multi-region", "pilot-light", "backup-restore"])
    .default("active-active-multi-region"),
  interRegionLatencyMs: z.number().int().min(1).max(1000).default(45),
});
export type CloudRegionConfig = z.infer<typeof cloudRegionConfigSchema>;

// 2. Availability Zone Schema
export const availabilityZoneConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("availability-zone").default("availability-zone"),
  parentRegion: z.string().min(1).max(64).default("us-east-1"),
  zoneIdentifier: z.string().min(1).max(64).default("us-east-1a"),
  isolationType: z
    .enum(["independent-power-cooling-network", "logical-datacenter", "edge-zone"])
    .default("independent-power-cooling-network"),
  datacenterCount: z.number().int().min(1).max(10).default(2),
  failureDomainSeparation: z.boolean().default(true),
  zonalCapacityClass: z
    .enum(["full-service-capacity", "compute-optimized", "edge-constrained"])
    .default("full-service-capacity"),
});
export type AvailabilityZoneConfig = z.infer<typeof availabilityZoneConfigSchema>;

// 3. Compute Instance Schema
export const computeInstanceConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("compute-instance").default("compute-instance"),
  instanceFamily: z
    .enum(["general-purpose", "compute-optimized", "memory-optimized", "accelerated-gpu", "arm-graviton"])
    .default("general-purpose"),
  vCpuCount: z.number().int().min(1).max(128).default(4),
  memoryGb: z.number().int().min(1).max(1024).default(16),
  storageAttachmentType: z
    .enum(["ebs-nvme-ssd", "local-ephemeral-scratch", "network-nfs-mount"])
    .default("ebs-nvme-ssd"),
  storageSizeGb: z.number().int().min(10).max(16384).default(100),
  operatingSystem: z
    .enum(["linux-ubuntu", "linux-debian", "linux-al2023", "windows-server"])
    .default("linux-ubuntu"),
  autoscalingGroupMember: z.boolean().default(true),
  placementZone: z.string().min(1).max(64).default("us-east-1a"),
});
export type ComputeInstanceConfig = z.infer<typeof computeInstanceConfigSchema>;

// 4. Managed Database Schema
export const managedDatabaseConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("managed-database").default("managed-database"),
  databaseEngine: z
    .enum(["postgresql-aurora", "mysql-cloud", "documentdb-nosql", "dynamodb-spanner", "redis-memorydb"])
    .default("postgresql-aurora"),
  engineVersion: z.string().min(1).max(32).default("16.2"),
  instanceClass: z
    .enum(["db.r6g.xlarge", "db.m6g.large", "db.t4g.medium", "serverless-v2"])
    .default("serverless-v2"),
  storageAllocatedGb: z.number().int().min(20).max(65536).default(200),
  backupRetentionDays: z.number().int().min(1).max(35).default(14),
  highAvailabilityModel: z
    .enum(["multi-az-synchronous", "read-replica-async", "single-az-dev", "global-active-active"])
    .default("multi-az-synchronous"),
  encryptionAtRest: z.boolean().default(true),
  publiclyAccessible: z.boolean().default(false),
});
export type ManagedDatabaseConfig = z.infer<typeof managedDatabaseConfigSchema>;

// 5. Managed Kubernetes Schema
export const managedKubernetesConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("managed-kubernetes").default("managed-kubernetes"),
  kubernetesVersion: z.string().min(1).max(32).default("1.30"),
  controlPlaneModel: z
    .enum(["fully-managed-ha", "dedicated-enterprise", "serverless-fargate-autopilot"])
    .default("fully-managed-ha"),
  clusterNetworkingCni: z
    .enum(["aws-vpc-cni", "calico-overlay", "cilium-ebpf", "azure-cni"])
    .default("cilium-ebpf"),
  workloadIdentityEnabled: z.boolean().default(true),
  clusterAutoscalerEnabled: z.boolean().default(true),
  ingressControllerStrategy: z
    .enum(["cloud-alb-controller", "traefik-gateway-api", "nginx-ingress", "envoy-gateway"])
    .default("cloud-alb-controller"),
  defaultNodePoolCount: z.number().int().min(1).max(100).default(3),
});
export type ManagedKubernetesConfig = z.infer<typeof managedKubernetesConfigSchema>;

// 6. Managed Queue Schema
export const managedQueueConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("managed-queue").default("managed-queue"),
  queueModel: z
    .enum(["standard-high-throughput", "fifo-strictly-ordered", "priority-deadletter", "delayed-scheduled"])
    .default("standard-high-throughput"),
  deliverySemantics: z
    .enum(["at-least-once", "exactly-once", "at-most-once"])
    .default("at-least-once"),
  messageRetentionHours: z.number().int().min(1).max(336).default(96),
  visibilityTimeoutSeconds: z.number().int().min(1).max(43200).default(30),
  maxMessageSizeBytes: z.number().int().min(1024).max(262144).default(262144),
  deadLetterTargetQueue: z.string().max(128).default("nxtqr-dlq"),
  maxReceiveCountBeforeDq: z.number().int().min(1).max(20).default(5),
});
export type ManagedQueueConfig = z.infer<typeof managedQueueConfigSchema>;

// 7. Managed Cache Schema
export const managedCacheConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("managed-cache").default("managed-cache"),
  cacheEngine: z
    .enum(["redis-cluster", "memcached-multithread", "valkey-managed", "hazelcast-in-memory"])
    .default("redis-cluster"),
  clusterTopology: z
    .enum(["primary-replica-sharded", "single-node-standalone", "multi-region-global-datastore"])
    .default("primary-replica-sharded"),
  memoryAllocationGb: z.number().int().min(1).max(1000).default(32),
  evictionStrategy: z
    .enum(["volatile-lru", "allkeys-lru", "volatile-lfu", "noeviction"])
    .default("allkeys-lru"),
  dataPersistenceModel: z
    .enum(["rdb-snapshots-aof", "aof-every-sec", "pure-in-memory"])
    .default("rdb-snapshots-aof"),
  automaticFailoverEnabled: z.boolean().default(true),
});
export type ManagedCacheConfig = z.infer<typeof managedCacheConfigSchema>;

// 8. Cloud Function Schema
export const cloudFunctionConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("cloud-function").default("cloud-function"),
  runtimeEnvironment: z
    .enum(["nodejs-20", "python-3-12", "golang-1-22", "java-21", "rust-custom"])
    .default("nodejs-20"),
  memoryAllocationMb: z.number().int().min(128).max(10240).default(1024),
  executionTimeoutSeconds: z.number().int().min(1).max(900).default(30),
  concurrencyProvisioning: z
    .enum(["on-demand-dynamic", "provisioned-warm-concurrency", "reserved-concurrency-cap"])
    .default("on-demand-dynamic"),
  concurrencyLimit: z.number().int().min(1).max(10000).default(500),
  vpcNetworkingAttached: z.boolean().default(true),
  triggerMechanism: z
    .enum(["http-api-gateway", "queue-event-source", "storage-object-created", "cloudwatch-cron"])
    .default("http-api-gateway"),
});
export type CloudFunctionConfig = z.infer<typeof cloudFunctionConfigSchema>;

// 9. Cloud Storage Bucket Schema
export const cloudStorageBucketConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("cloud-storage-bucket").default("cloud-storage-bucket"),
  storageTier: z
    .enum(["standard-hot-frequent", "infrequent-access-cool", "archive-glacier-deep", "intelligent-tiering"])
    .default("standard-hot-frequent"),
  versioningStatus: z.enum(["enabled", "suspended", "disabled"]).default("enabled"),
  lifecycleTransitionDays: z.number().int().min(1).max(3650).default(90),
  encryptionStandard: z
    .enum(["sse-kms-customer-managed", "sse-s3-provider-managed", "client-side-rsa"])
    .default("sse-kms-customer-managed"),
  blockPublicAccess: z.boolean().default(true),
  crossRegionReplication: z.boolean().default(false),
  objectLockWormEnabled: z.boolean().default(false),
});
export type CloudStorageBucketConfig = z.infer<typeof cloudStorageBucketConfigSchema>;

// 10. Cloud Load Balancer Schema
export const cloudLoadBalancerConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("cloud-load-balancer").default("cloud-load-balancer"),
  loadBalancerType: z
    .enum(["layer-7-application", "layer-4-network", "gateway-load-balancer", "global-anycast-proxy"])
    .default("layer-7-application"),
  listenerProtocols: z
    .enum(["https-tls13", "http2-grpc", "tcp-udp-dual", "quic-http3"])
    .default("https-tls13"),
  scheme: z.enum(["internet-facing-public", "internal-private-vpc"]).default("internet-facing-public"),
  crossZoneBalancing: z.boolean().default(true),
  connectionDrainingTimeoutSeconds: z.number().int().min(1).max(3600).default(300),
  sslTerminationEnabled: z.boolean().default(true),
  targetGroupHealthCheckPath: z.string().min(1).max(128).default("/healthz"),
});
export type CloudLoadBalancerConfig = z.infer<typeof cloudLoadBalancerConfigSchema>;

// 11. Cloud Network Schema
export const cloudNetworkConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("cloud-network").default("cloud-network"),
  networkAddressCidr: z
    .string()
    .regex(/^([0-9]{1,3}\.){3}[0-9]{1,3}\/([0-9]|[1-2][0-9]|3[0-2])$/, "Invalid IPv4 CIDR notation")
    .default("10.0.0.0/16"),
  subnetSegmentationStrategy: z
    .enum(["dual-tier-public-private", "three-tier-web-app-db", "zero-trust-microsegmentation"])
    .default("three-tier-web-app-db"),
  internetGatewayAttached: z.boolean().default(true),
  natGatewayStrategy: z
    .enum(["managed-per-az", "single-shared-cost-saver", "egress-only-ipv6", "none"])
    .default("managed-per-az"),
  flowLogsEnabled: z.boolean().default(true),
  dnsHostnamesResolution: z.boolean().default(true),
});
export type CloudNetworkConfig = z.infer<typeof cloudNetworkConfigSchema>;

// 12. Cloud IAM Schema
export const cloudIamConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("cloud-iam").default("cloud-iam"),
  principalScope: z
    .enum(["workload-service-account", "human-developer-sso", "cross-account-federation", "ec2-instance-profile"])
    .default("workload-service-account"),
  accessControlModel: z
    .enum(["rbac-role-based", "abac-attribute-tags", "least-privilege-inline"])
    .default("rbac-role-based"),
  mfaRequirement: z
    .enum(["strictly-enforced", "risk-adaptive", "exempt-automation"])
    .default("strictly-enforced"),
  sessionDurationHours: z.number().int().min(1).max(12).default(4),
  temporaryCredentialModel: z
    .enum(["sts-assume-role", "oidc-federation-token", "instance-metadata-v2"])
    .default("sts-assume-role"),
  auditTrailsLogging: z.boolean().default(true),
});
export type CloudIamConfig = z.infer<typeof cloudIamConfigSchema>;

// Discriminated union of all Category 16 schemas
export const cloudInfrastructureComponentSchema = z.discriminatedUnion("componentType", [
  cloudRegionConfigSchema,
  availabilityZoneConfigSchema,
  computeInstanceConfigSchema,
  managedDatabaseConfigSchema,
  managedKubernetesConfigSchema,
  managedQueueConfigSchema,
  managedCacheConfigSchema,
  cloudFunctionConfigSchema,
  cloudStorageBucketConfigSchema,
  cloudLoadBalancerConfigSchema,
  cloudNetworkConfigSchema,
  cloudIamConfigSchema,
]);

export type CloudInfrastructureComponentConfig = z.infer<typeof cloudInfrastructureComponentSchema>;

