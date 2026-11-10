import type {
  InfrastructureCategoryDefinition,
  InfrastructureComponentDefinition,
} from "../types";
import {
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
  type CloudRegionConfig,
  type AvailabilityZoneConfig,
  type ComputeInstanceConfig,
  type ManagedDatabaseConfig,
  type ManagedKubernetesConfig,
  type ManagedQueueConfig,
  type ManagedCacheConfig,
  type CloudFunctionConfig,
  type CloudStorageBucketConfig,
  type CloudLoadBalancerConfig,
  type CloudNetworkConfig,
  type CloudIamConfig,
} from "../schemas/cloud-infrastructure.schema";

export const CLOUD_INFRASTRUCTURE_CATEGORY_ID = "cloud-infrastructure";

export const cloudInfrastructureCategoryDefinition: InfrastructureCategoryDefinition = {
  id: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  name: "Cloud Infrastructure",
  description:
    "Geographic cloud regions, availability zones, virtual compute, managed databases, Kubernetes clusters, queues, caches, serverless functions, storage buckets, networks, and IAM.",
  iconSlug: "cloud-region",
  order: 16,
};

// 1. Cloud Region Definition
export const cloudRegionDefinition: InfrastructureComponentDefinition<CloudRegionConfig> = {
  id: "cloud-region",
  version: 1,
  categoryId: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  display: {
    name: "Cloud Region",
    shortName: "Region",
    description: "Geographically isolated cloud deployment perimeter containing multiple redundant availability zones, backbone fiber, and compliance boundaries.",
    keywords: ["cloud", "region", "geographic", "zones", "multi-region", "datacenter", "perimeter"],
    iconSlug: "cloud-region",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: cloudRegionConfigSchema,
  defaultConfig: {
    label: "Cloud Region",
    environment: "production",
    enabled: true,
    tags: ["cloud", "regional-boundary"],
    componentType: "cloud-region",
    provider: "aws",
    regionIdentifier: "us-east-1",
    geographicLocationLabel: "N. Virginia, North America",
    availabilityZoneCount: 3,
    dataResidencyRequirement: "strict-jurisdiction",
    disasterRecoveryStrategy: "active-active-multi-region",
    interRegionLatencyMs: 45,
  },
  ports: [
    { id: "inter-region-sync-in", name: "Inter-Region In", type: "input", dataType: "Inter_Region_Sync", capacity: 8 },
    { id: "regional-contain-out", name: "Zonal Bus", type: "output", dataType: "Zone_Containment_Bus", capacity: 16 },
    { id: "replication-out", name: "Replication", type: "output", dataType: "Cross_Region_Replication", capacity: 8 },
  ],
  capabilities: ["multi-zone-containment", "cross-region-replication", "data-sovereignty-compliance"],
  inspector: [
    {
      id: "region-settings",
      title: "Geographic Placement",
      fields: [
        {
          path: "provider",
          label: "Cloud Provider",
          type: "select",
          options: [
            { label: "AWS (Amazon Web Services)", value: "aws" },
            { label: "Google Cloud Platform", value: "gcp" },
            { label: "Microsoft Azure", value: "azure" },
            { label: "Cloudflare Global Network", value: "cloudflare" },
            { label: "Other / Hybrid Cloud", value: "other" },
          ],
        },
        { path: "regionIdentifier", label: "Region ID", type: "text" },
        { path: "geographicLocationLabel", label: "Location", type: "text" },
        { path: "availabilityZoneCount", label: "Zone Count", type: "number" },
        {
          path: "disasterRecoveryStrategy",
          label: "DR Strategy",
          type: "select",
          options: [
            { label: "Active-Active Multi-Region", value: "active-active-multi-region" },
            { label: "Active-Passive (Warm Standby)", value: "active-passive-warm" },
            { label: "Pilot Light", value: "pilot-light" },
            { label: "Backup & Restore", value: "backup-restore" },
          ],
        },
      ],
    },
  ],
};

// 2. Availability Zone Definition
export const availabilityZoneDefinition: InfrastructureComponentDefinition<AvailabilityZoneConfig> = {
  id: "availability-zone",
  version: 1,
  categoryId: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  display: {
    name: "Availability Zone",
    shortName: "AZ Zone",
    description: "Physically separated, fault-tolerant datacenter cluster within a cloud region engineered with independent power, cooling, and low-latency networking.",
    keywords: ["zone", "az", "datacenter", "fault-domain", "isolation", "high-availability"],
    iconSlug: "availability-zone",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: availabilityZoneConfigSchema,
  defaultConfig: {
    label: "Availability Zone",
    environment: "production",
    enabled: true,
    tags: ["cloud", "zonal-isolation"],
    componentType: "availability-zone",
    parentRegion: "us-east-1",
    zoneIdentifier: "us-east-1a",
    isolationType: "independent-power-cooling-network",
    datacenterCount: 2,
    failureDomainSeparation: true,
    zonalCapacityClass: "full-service-capacity",
  },
  ports: [
    { id: "parent-region-in", name: "Region Bus", type: "input", dataType: "Zone_Containment_Bus", capacity: 4 },
    { id: "zonal-workloads-out", name: "Zonal Hosts", type: "output", dataType: "Zonal_Workload_Placement", capacity: 32 },
  ],
  capabilities: ["fault-domain-isolation", "independent-power-cooling", "sub-millisecond-interconnect"],
  inspector: [
    {
      id: "zone-isolation",
      title: "Fault Domain Configuration",
      fields: [
        { path: "parentRegion", label: "Parent Region", type: "text" },
        { path: "zoneIdentifier", label: "Zone Identifier", type: "text" },
        {
          path: "isolationType",
          label: "Isolation Type",
          type: "select",
          options: [
            { label: "Independent Power & Cooling", value: "independent-power-cooling-network" },
            { label: "Logical Datacenter", value: "logical-datacenter" },
            { label: "Edge Zone", value: "edge-zone" },
          ],
        },
        { path: "failureDomainSeparation", label: "Fault Domain Separation", type: "boolean" },
      ],
    },
  ],
};

// 3. Compute Instance Definition
export const computeInstanceDefinition: InfrastructureComponentDefinition<ComputeInstanceConfig> = {
  id: "compute-instance",
  version: 1,
  categoryId: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  display: {
    name: "Compute Instance",
    shortName: "Compute VM",
    description: "Configurable cloud virtual machine instance providing on-demand vCPUs, memory, attached SSD volumes, and virtual network interfaces.",
    keywords: ["compute", "instance", "ec2", "vm", "virtual-machine", "cpu", "cloud-server"],
    iconSlug: "compute-instance",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: computeInstanceConfigSchema,
  defaultConfig: {
    label: "Compute Instance",
    environment: "production",
    enabled: true,
    tags: ["compute", "virtual-machine"],
    componentType: "compute-instance",
    instanceFamily: "general-purpose",
    vCpuCount: 4,
    memoryGb: 16,
    storageAttachmentType: "ebs-nvme-ssd",
    storageSizeGb: 100,
    operatingSystem: "linux-ubuntu",
    autoscalingGroupMember: true,
    placementZone: "us-east-1a",
  },
  ports: [
    { id: "network-ingress-in", name: "VPC Ingress", type: "input", dataType: "TCP_Packet_Stream", capacity: 16 },
    { id: "database-client-out", name: "DB Client", type: "output", dataType: "Database_Connection", capacity: 8 },
    { id: "cache-client-out", name: "Cache Client", type: "output", dataType: "Cache_Connection", capacity: 8 },
  ],
  capabilities: ["hardware-virtualization", "attached-ssd-storage", "autoscaling-membership"],
  inspector: [
    {
      id: "instance-specs",
      title: "Hardware Sizing",
      fields: [
        {
          path: "instanceFamily",
          label: "Instance Family",
          type: "select",
          options: [
            { label: "General Purpose (m-class)", value: "general-purpose" },
            { label: "Compute Optimized (c-class)", value: "compute-optimized" },
            { label: "Memory Optimized (r-class)", value: "memory-optimized" },
            { label: "Accelerated GPU (g-class)", value: "accelerated-gpu" },
            { label: "ARM Graviton", value: "arm-graviton" },
          ],
        },
        { path: "vCpuCount", label: "vCPUs", type: "number" },
        { path: "memoryGb", label: "RAM (GB)", type: "number" },
        { path: "storageSizeGb", label: "SSD Storage (GB)", type: "number" },
        {
          path: "operatingSystem",
          label: "Operating System",
          type: "select",
          options: [
            { label: "Ubuntu Linux", value: "linux-ubuntu" },
            { label: "Debian Linux", value: "linux-debian" },
            { label: "Amazon Linux 2023", value: "linux-al2023" },
            { label: "Windows Server", value: "windows-server" },
          ],
        },
      ],
    },
  ],
};

// 4. Managed Database Definition
export const managedDatabaseDefinition: InfrastructureComponentDefinition<ManagedDatabaseConfig> = {
  id: "managed-database",
  version: 1,
  categoryId: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  display: {
    name: "Managed Database",
    shortName: "Cloud DB",
    description: "Fully managed cloud database cluster with automated provisioning, multi-AZ synchronous replication, point-in-time recovery, and encryption.",
    keywords: ["database", "rds", "aurora", "cloud-sql", "managed-db", "sql", "postgres"],
    iconSlug: "managed-database",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: managedDatabaseConfigSchema,
  defaultConfig: {
    label: "Managed Database",
    environment: "production",
    enabled: true,
    tags: ["database", "cloud-storage"],
    componentType: "managed-database",
    databaseEngine: "postgresql-aurora",
    engineVersion: "16.2",
    instanceClass: "serverless-v2",
    storageAllocatedGb: 200,
    backupRetentionDays: 14,
    highAvailabilityModel: "multi-az-synchronous",
    encryptionAtRest: true,
    publiclyAccessible: false,
  },
  ports: [
    { id: "sql-connection-in", name: "App Queries", type: "input", dataType: "SQL_Query_Stream", capacity: 64 },
    { id: "read-replica-out", name: "Replicas", type: "output", dataType: "Async_Replication_Stream", capacity: 16 },
    { id: "backup-snapshot-out", name: "Snapshots", type: "output", dataType: "Snapshot_Image", capacity: 4 },
  ],
  capabilities: ["automated-failover", "point-in-time-restore", "multi-az-replication"],
  inspector: [
    {
      id: "database-cluster",
      title: "Engine & High Availability",
      fields: [
        {
          path: "databaseEngine",
          label: "Database Engine",
          type: "select",
          options: [
            { label: "PostgreSQL (Aurora / Cloud SQL)", value: "postgresql-aurora" },
            { label: "MySQL (Aurora / Managed)", value: "mysql-cloud" },
            { label: "DocumentDB (NoSQL Mongo)", value: "documentdb-nosql" },
            { label: "DynamoDB / Cloud Spanner", value: "dynamodb-spanner" },
            { label: "MemoryDB (In-Memory)", value: "redis-memorydb" },
          ],
        },
        {
          path: "highAvailabilityModel",
          label: "High Availability",
          type: "select",
          options: [
            { label: "Multi-AZ Synchronous", value: "multi-az-synchronous" },
            { label: "Read Replica Async", value: "read-replica-async" },
            { label: "Global Active-Active", value: "global-active-active" },
            { label: "Single-AZ (Dev Only)", value: "single-az-dev" },
          ],
        },
        { path: "storageAllocatedGb", label: "Storage (GB)", type: "number" },
        { path: "backupRetentionDays", label: "Backup Retention (Days)", type: "number" },
      ],
    },
  ],
};

// 5. Managed Kubernetes Definition
export const managedKubernetesDefinition: InfrastructureComponentDefinition<ManagedKubernetesConfig> = {
  id: "managed-kubernetes",
  version: 1,
  categoryId: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  display: {
    name: "Managed Kubernetes",
    shortName: "Managed K8s",
    description: "Enterprise managed container orchestration platform with automated control-plane upgrades, node-pool scaling, and cloud networking CNI integration.",
    keywords: ["kubernetes", "k8s", "eks", "gke", "aks", "containers", "cluster", "control-plane"],
    iconSlug: "managed-kubernetes",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: managedKubernetesConfigSchema,
  defaultConfig: {
    label: "Managed Kubernetes",
    environment: "production",
    enabled: true,
    tags: ["kubernetes", "cluster"],
    componentType: "managed-kubernetes",
    kubernetesVersion: "1.30",
    controlPlaneModel: "fully-managed-ha",
    clusterNetworkingCni: "cilium-ebpf",
    workloadIdentityEnabled: true,
    clusterAutoscalerEnabled: true,
    ingressControllerStrategy: "cloud-alb-controller",
    defaultNodePoolCount: 3,
  },
  ports: [
    { id: "kubectl-api-in", name: "Kube API", type: "input", dataType: "K8s_API_Call", capacity: 16 },
    { id: "pod-network-out", name: "Worker Workloads", type: "output", dataType: "K8s_Pod_Traffic", capacity: 64 },
    { id: "service-mesh-out", name: "Service Mesh", type: "output", dataType: "mTLS_Mesh_Transit", capacity: 16 },
  ],
  capabilities: ["ha-control-plane", "auto-node-provisioning", "ebpf-cni-security"],
  inspector: [
    {
      id: "k8s-platform",
      title: "Cluster Architecture",
      fields: [
        { path: "kubernetesVersion", label: "K8s Version", type: "text" },
        {
          path: "controlPlaneModel",
          label: "Control Plane",
          type: "select",
          options: [
            { label: "Fully Managed High-Availability", value: "fully-managed-ha" },
            { label: "Dedicated Enterprise", value: "dedicated-enterprise" },
            { label: "Serverless (Fargate / Autopilot)", value: "serverless-fargate-autopilot" },
          ],
        },
        {
          path: "clusterNetworkingCni",
          label: "Networking CNI",
          type: "select",
          options: [
            { label: "Cilium eBPF", value: "cilium-ebpf" },
            { label: "AWS VPC CNI", value: "aws-vpc-cni" },
            { label: "Azure CNI", value: "azure-cni" },
            { label: "Calico Overlay", value: "calico-overlay" },
          ],
        },
        { path: "clusterAutoscalerEnabled", label: "Autoscaler Enabled", type: "boolean" },
      ],
    },
  ],
};

// 6. Managed Queue Definition
export const managedQueueDefinition: InfrastructureComponentDefinition<ManagedQueueConfig> = {
  id: "managed-queue",
  version: 1,
  categoryId: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  display: {
    name: "Managed Queue",
    shortName: "Cloud Queue",
    description: "Fully managed distributed message queuing service providing high-throughput asynchronous decoupling, FIFO guarantees, and dead-letter handling.",
    keywords: ["queue", "sqs", "pubsub", "messaging", "fifo", "async", "dlq"],
    iconSlug: "managed-queue",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: managedQueueConfigSchema,
  defaultConfig: {
    label: "Managed Queue",
    environment: "production",
    enabled: true,
    tags: ["messaging", "async-queue"],
    componentType: "managed-queue",
    queueModel: "standard-high-throughput",
    deliverySemantics: "at-least-once",
    messageRetentionHours: 96,
    visibilityTimeoutSeconds: 30,
    maxMessageSizeBytes: 262144,
    deadLetterTargetQueue: "nxtqr-dlq",
    maxReceiveCountBeforeDq: 5,
  },
  ports: [
    { id: "producer-publish-in", name: "Publish In", type: "input", dataType: "Queue_Message_Envelope", capacity: 32 },
    { id: "consumer-poll-out", name: "Consume Out", type: "output", dataType: "Queue_Message_Envelope", capacity: 32 },
    { id: "dlq-forward-out", name: "DLQ Route", type: "output", dataType: "Dead_Letter_Message", capacity: 4 },
  ],
  capabilities: ["infinite-scale-throughput", "dead-letter-redirection", "strict-fifo-ordering"],
  inspector: [
    {
      id: "queue-properties",
      title: "Queue Policies",
      fields: [
        {
          path: "queueModel",
          label: "Queue Model",
          type: "select",
          options: [
            { label: "Standard High-Throughput", value: "standard-high-throughput" },
            { label: "FIFO Strictly Ordered", value: "fifo-strictly-ordered" },
            { label: "Priority Dead-Letter", value: "priority-deadletter" },
            { label: "Delayed Scheduled", value: "delayed-scheduled" },
          ],
        },
        { path: "messageRetentionHours", label: "Retention (Hours)", type: "number" },
        { path: "visibilityTimeoutSeconds", label: "Visibility Timeout (Sec)", type: "number" },
      ],
    },
  ],
};

// 7. Managed Cache Definition
export const managedCacheDefinition: InfrastructureComponentDefinition<ManagedCacheConfig> = {
  id: "managed-cache",
  version: 1,
  categoryId: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  display: {
    name: "Managed Cache",
    shortName: "Cloud Cache",
    description: "In-memory caching cluster delivering sub-millisecond data retrieval, multi-AZ automatic failover, Redis/Memcached compatibility, and sharding.",
    keywords: ["cache", "elasticache", "redis", "memcached", "in-memory", "low-latency"],
    iconSlug: "managed-cache",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: managedCacheConfigSchema,
  defaultConfig: {
    label: "Managed Cache",
    environment: "production",
    enabled: true,
    tags: ["caching", "in-memory"],
    componentType: "managed-cache",
    cacheEngine: "redis-cluster",
    clusterTopology: "primary-replica-sharded",
    memoryAllocationGb: 32,
    evictionStrategy: "allkeys-lru",
    dataPersistenceModel: "rdb-snapshots-aof",
    automaticFailoverEnabled: true,
  },
  ports: [
    { id: "cache-read-write-in", name: "Cache Access", type: "input", dataType: "Cache_Command", capacity: 64 },
    { id: "replica-sync-out", name: "Cross-Zone Sync", type: "output", dataType: "Cache_Replication", capacity: 16 },
  ],
  capabilities: ["sub-millisecond-latency", "cluster-sharding", "automatic-failover"],
  inspector: [
    {
      id: "cache-topology",
      title: "Cluster Architecture",
      fields: [
        {
          path: "cacheEngine",
          label: "Cache Engine",
          type: "select",
          options: [
            { label: "Redis Cluster", value: "redis-cluster" },
            { label: "Memcached Multi-Thread", value: "memcached-multithread" },
            { label: "Valkey Managed", value: "valkey-managed" },
            { label: "Hazelcast In-Memory", value: "hazelcast-in-memory" },
          ],
        },
        { path: "memoryAllocationGb", label: "Memory (GB)", type: "number" },
        {
          path: "evictionStrategy",
          label: "Eviction Policy",
          type: "select",
          options: [
            { label: "allkeys-lru", value: "allkeys-lru" },
            { label: "volatile-lru", value: "volatile-lru" },
            { label: "volatile-lfu", value: "volatile-lfu" },
            { label: "noeviction", value: "noeviction" },
          ],
        },
      ],
    },
  ],
};

// 8. Cloud Function Definition
export const cloudFunctionDefinition: InfrastructureComponentDefinition<CloudFunctionConfig> = {
  id: "cloud-function",
  version: 1,
  categoryId: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  display: {
    name: "Cloud Function",
    shortName: "Serverless Fn",
    description: "Event-driven serverless compute unit executing code on demand with granular auto-scaling, millisecond billing, and managed runtime isolation.",
    keywords: ["function", "serverless", "lambda", "cloud-function", "event-driven", "faas"],
    iconSlug: "cloud-function",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: cloudFunctionConfigSchema,
  defaultConfig: {
    label: "Cloud Function",
    environment: "production",
    enabled: true,
    tags: ["serverless", "faas"],
    componentType: "cloud-function",
    runtimeEnvironment: "nodejs-20",
    memoryAllocationMb: 1024,
    executionTimeoutSeconds: 30,
    concurrencyProvisioning: "on-demand-dynamic",
    concurrencyLimit: 500,
    vpcNetworkingAttached: true,
    triggerMechanism: "http-api-gateway",
  },
  ports: [
    { id: "event-trigger-in", name: "Event In", type: "input", dataType: "Event_Trigger_Payload", capacity: 16 },
    { id: "db-or-queue-out", name: "DB / Queue Out", type: "output", dataType: "Downstream_Dispatch", capacity: 16 },
    { id: "storage-access-out", name: "S3 Read/Write", type: "output", dataType: "Blob_Stream", capacity: 8 },
  ],
  capabilities: ["zero-server-maintenance", "event-triggered", "sub-second-scaling"],
  inspector: [
    {
      id: "serverless-execution",
      title: "Runtime Environment",
      fields: [
        {
          path: "runtimeEnvironment",
          label: "Runtime Environment",
          type: "select",
          options: [
            { label: "Node.js 20 LTS", value: "nodejs-20" },
            { label: "Python 3.12", value: "python-3-12" },
            { label: "Go 1.22", value: "golang-1-22" },
            { label: "Java 21 LTS", value: "java-21" },
            { label: "Rust (Custom Runtime)", value: "rust-custom" },
          ],
        },
        { path: "memoryAllocationMb", label: "Memory (MB)", type: "number" },
        { path: "executionTimeoutSeconds", label: "Timeout (Sec)", type: "number" },
      ],
    },
  ],
};

// 9. Cloud Storage Bucket Definition
export const cloudStorageBucketDefinition: InfrastructureComponentDefinition<CloudStorageBucketConfig> = {
  id: "cloud-storage-bucket",
  version: 1,
  categoryId: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  display: {
    name: "Cloud Storage Bucket",
    shortName: "Storage Bucket",
    description: "Scalable object storage container hosting unstructured media, datasets, backups, and static assets with 99.999999999% durability.",
    keywords: ["storage", "bucket", "s3", "blob", "gcs", "object-storage", "durability"],
    iconSlug: "cloud-storage-bucket",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: cloudStorageBucketConfigSchema,
  defaultConfig: {
    label: "Cloud Storage Bucket",
    environment: "production",
    enabled: true,
    tags: ["storage", "object-store"],
    componentType: "cloud-storage-bucket",
    storageTier: "standard-hot-frequent",
    versioningStatus: "enabled",
    lifecycleTransitionDays: 90,
    encryptionStandard: "sse-kms-customer-managed",
    blockPublicAccess: true,
    crossRegionReplication: false,
    objectLockWormEnabled: false,
  },
  ports: [
    { id: "object-upload-in", name: "Put Object", type: "input", dataType: "Binary_Upload_Stream", capacity: 32 },
    { id: "object-read-out", name: "Get Object", type: "output", dataType: "Binary_Download_Stream", capacity: 64 },
    { id: "event-notification-out", name: "Object Event", type: "output", dataType: "Bucket_Object_Event", capacity: 8 },
  ],
  capabilities: ["eleven-nines-durability", "versioned-worm-lock", "lifecycle-transitions"],
  inspector: [
    {
      id: "bucket-policies",
      title: "Storage Class & Security",
      fields: [
        {
          path: "storageTier",
          label: "Storage Tier",
          type: "select",
          options: [
            { label: "Standard Hot (Frequent)", value: "standard-hot-frequent" },
            { label: "Infrequent Access (Cool)", value: "infrequent-access-cool" },
            { label: "Glacier Deep Archive", value: "archive-glacier-deep" },
            { label: "Intelligent Tiering", value: "intelligent-tiering" },
          ],
        },
        {
          path: "encryptionStandard",
          label: "Encryption Standard",
          type: "select",
          options: [
            { label: "KMS Customer-Managed (SSE-KMS)", value: "sse-kms-customer-managed" },
            { label: "S3 Provider-Managed (SSE-S3)", value: "sse-s3-provider-managed" },
            { label: "Client-Side RSA Keys", value: "client-side-rsa" },
          ],
        },
        { path: "blockPublicAccess", label: "Block Public Access", type: "boolean" },
      ],
    },
  ],
};

// 10. Cloud Load Balancer Definition
export const cloudLoadBalancerDefinition: InfrastructureComponentDefinition<CloudLoadBalancerConfig> = {
  id: "cloud-load-balancer",
  version: 1,
  categoryId: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  display: {
    name: "Cloud Load Balancer",
    shortName: "Cloud LB",
    description: "Managed high-availability traffic distributor handling Layer 4/7 routing, TLS certificate offloading, path-based rules, and health checks.",
    keywords: ["load-balancer", "alb", "nlb", "traffic", "proxy", "tls", "ingress", "gateway"],
    iconSlug: "cloud-load-balancer",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: cloudLoadBalancerConfigSchema,
  defaultConfig: {
    label: "Cloud Load Balancer",
    environment: "production",
    enabled: true,
    tags: ["networking", "load-balancing"],
    componentType: "cloud-load-balancer",
    loadBalancerType: "layer-7-application",
    listenerProtocols: "https-tls13",
    scheme: "internet-facing-public",
    crossZoneBalancing: true,
    connectionDrainingTimeoutSeconds: 300,
    sslTerminationEnabled: true,
    targetGroupHealthCheckPath: "/healthz",
  },
  ports: [
    { id: "client-traffic-in", name: "Client TLS In", type: "input", dataType: "HTTPS_Request_Stream", capacity: 64 },
    { id: "target-group-out", name: "Backend Targets", type: "output", dataType: "Reverse_Proxy_Dispatch", capacity: 32 },
  ],
  capabilities: ["tls-termination", "path-routing", "cross-zone-balancing", "health-checks"],
  inspector: [
    {
      id: "alb-settings",
      title: "Load Balancer Routing",
      fields: [
        {
          path: "loadBalancerType",
          label: "Load Balancer Type",
          type: "select",
          options: [
            { label: "Layer 7 Application (ALB)", value: "layer-7-application" },
            { label: "Layer 4 Network (NLB)", value: "layer-4-network" },
            { label: "Gateway Load Balancer", value: "gateway-load-balancer" },
            { label: "Global Anycast Proxy", value: "global-anycast-proxy" },
          ],
        },
        {
          path: "scheme",
          label: "Scheme",
          type: "select",
          options: [
            { label: "Internet-Facing (Public)", value: "internet-facing-public" },
            { label: "Internal (Private VPC)", value: "internal-private-vpc" },
          ],
        },
        { path: "targetGroupHealthCheckPath", label: "Health Check Path", type: "text" },
      ],
    },
  ],
};

// 11. Cloud Network Definition
export const cloudNetworkDefinition: InfrastructureComponentDefinition<CloudNetworkConfig> = {
  id: "cloud-network",
  version: 1,
  categoryId: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  display: {
    name: "Cloud Network",
    shortName: "Cloud VPC",
    description: "Logically isolated software-defined virtual private cloud containing CIDR blocks, tiered public/private subnets, NAT, and route tables.",
    keywords: ["network", "vpc", "vnet", "cidr", "subnet", "nat", "routing", "isolation"],
    iconSlug: "cloud-network",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: cloudNetworkConfigSchema,
  defaultConfig: {
    label: "Cloud Network",
    environment: "production",
    enabled: true,
    tags: ["networking", "vpc"],
    componentType: "cloud-network",
    networkAddressCidr: "10.0.0.0/16",
    subnetSegmentationStrategy: "three-tier-web-app-db",
    internetGatewayAttached: true,
    natGatewayStrategy: "managed-per-az",
    flowLogsEnabled: true,
    dnsHostnamesResolution: true,
  },
  ports: [
    { id: "internet-gateway-in", name: "IGW Egress", type: "input", dataType: "Internet_Traffic", capacity: 8 },
    { id: "subnet-membership-out", name: "Subnet Bus", type: "output", dataType: "Subnet_Route_Transit", capacity: 32 },
    { id: "peering-connection-out", name: "VPC Peering", type: "output", dataType: "Peered_VPC_Bridge", capacity: 8 },
  ],
  capabilities: ["cidr-partitioning", "private-subnets", "flow-logs-telemetry"],
  inspector: [
    {
      id: "vpc-topology",
      title: "CIDR & Subnet Segmentation",
      fields: [
        { path: "networkAddressCidr", label: "Network CIDR", type: "text" },
        {
          path: "subnetSegmentationStrategy",
          label: "Subnet Strategy",
          type: "select",
          options: [
            { label: "Three-Tier (Web, App, DB)", value: "three-tier-web-app-db" },
            { label: "Dual-Tier (Public & Private)", value: "dual-tier-public-private" },
            { label: "Zero-Trust Microsegmentation", value: "zero-trust-microsegmentation" },
          ],
        },
        {
          path: "natGatewayStrategy",
          label: "NAT Gateway",
          type: "select",
          options: [
            { label: "Managed per-AZ (High Availability)", value: "managed-per-az" },
            { label: "Single Shared (Cost Saver)", value: "single-shared-cost-saver" },
            { label: "Egress-Only IPv6", value: "egress-only-ipv6" },
            { label: "None / Air-Gapped", value: "none" },
          ],
        },
      ],
    },
  ],
};

// 12. Cloud IAM Definition
export const cloudIamDefinition: InfrastructureComponentDefinition<CloudIamConfig> = {
  id: "cloud-iam",
  version: 1,
  categoryId: CLOUD_INFRASTRUCTURE_CATEGORY_ID,
  display: {
    name: "Cloud IAM",
    shortName: "Cloud IAM",
    description: "Cloud identity, access policies, workload role federation, short-lived temporary tokens, and least-privilege boundary enforcement.",
    keywords: ["iam", "identity", "roles", "policies", "permissions", "rbac", "least-privilege"],
    iconSlug: "cloud-iam",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: cloudIamConfigSchema,
  defaultConfig: {
    label: "Cloud IAM",
    environment: "production",
    enabled: true,
    tags: ["security", "iam"],
    componentType: "cloud-iam",
    principalScope: "workload-service-account",
    accessControlModel: "rbac-role-based",
    mfaRequirement: "strictly-enforced",
    sessionDurationHours: 4,
    temporaryCredentialModel: "sts-assume-role",
    auditTrailsLogging: true,
  },
  ports: [
    { id: "identity-principal-in", name: "Principal In", type: "input", dataType: "Principal_Assertion", capacity: 16 },
    { id: "role-grant-out", name: "Policy Grant", type: "output", dataType: "STS_Assumed_Role_Token", capacity: 32 },
  ],
  capabilities: ["least-privilege-enforcement", "sts-temporary-tokens", "audit-trail-provenance"],
  inspector: [
    {
      id: "iam-policy",
      title: "Access Control & Temporary Credentials",
      fields: [
        {
          path: "principalScope",
          label: "Principal Scope",
          type: "select",
          options: [
            { label: "Workload Service Account", value: "workload-service-account" },
            { label: "Human SSO Developer", value: "human-developer-sso" },
            { label: "Cross-Account Federation", value: "cross-account-federation" },
            { label: "Compute Instance Profile", value: "ec2-instance-profile" },
          ],
        },
        {
          path: "accessControlModel",
          label: "Access Model",
          type: "select",
          options: [
            { label: "Role-Based Access Control (RBAC)", value: "rbac-role-based" },
            { label: "Attribute-Based Access Control (ABAC)", value: "abac-attribute-tags" },
            { label: "Least-Privilege Inline Policy", value: "least-privilege-inline" },
          ],
        },
        { path: "sessionDurationHours", label: "Session Duration (Hours)", type: "number" },
      ],
    },
  ],
};

export const ALL_CLOUD_INFRASTRUCTURE_DEFINITIONS: InfrastructureComponentDefinition<any>[] = [
  cloudRegionDefinition,
  availabilityZoneDefinition,
  computeInstanceDefinition,
  managedDatabaseDefinition,
  managedKubernetesDefinition,
  managedQueueDefinition,
  managedCacheDefinition,
  cloudFunctionDefinition,
  cloudStorageBucketDefinition,
  cloudLoadBalancerDefinition,
  cloudNetworkDefinition,
  cloudIamDefinition,
];
