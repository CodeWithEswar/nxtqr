import { z } from "zod";
import { SharedInfrastructureConfigSchema } from "./clients.schema";

// 01 — Web Server
export const WebServerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("web-server"),
  serverCategory: z
    .enum(["nginx", "caddy", "apache-httpd", "envoy", "lighttpd"])
    .default("nginx"),
  httpPort: z.number().int().min(1).max(65535).default(80),
  httpsPort: z.number().int().min(1).max(65535).default(443),
  tlsTermination: z.boolean().default(true),
  staticFileServing: z.boolean().default(true),
  keepAliveTimeoutSeconds: z.number().int().min(1).max(300).default(65),
  connectionTimeoutMs: z.number().int().min(100).max(60000).default(5000),
  maxRequestBodyMb: z.number().int().min(1).max(512).default(10),
  workerProcesses: z.number().int().min(1).max(64).default(4),
  upstreamServiceRef: z.string().min(1).max(128).default("app-cluster.internal:8080"),
});
export type WebServerConfig = z.infer<typeof WebServerConfigSchema>;

// 02 — Application Server
export const ApplicationServerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("application-server"),
  runtimePlatform: z
    .enum(["nodejs", "python-wsgi-asgi", "jvm-spring-quarkus", "golang-binary", "dotnet-core", "ruby-puma"])
    .default("nodejs"),
  applicationFramework: z.string().min(1).max(64).default("NestJS / Express"),
  instanceCount: z.number().int().min(1).max(100).default(3),
  workerModel: z
    .enum(["event-loop-async", "multi-threaded", "pre-fork-process", "hybrid"])
    .default("event-loop-async"),
  concurrencyLimit: z.number().int().min(1).max(50000).default(1000),
  memoryAllocationMb: z.number().int().min(128).max(131072).default(2048),
  cpuCores: z.number().min(0.25).max(64).default(2),
  requestTimeoutMs: z.number().int().min(500).max(120000).default(15000),
  healthCheckEndpoint: z.string().min(1).max(128).default("/healthz"),
});
export type ApplicationServerConfig = z.infer<typeof ApplicationServerConfigSchema>;

// 03 — Backend Service
export const BackendServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("backend-service"),
  serviceProtocol: z
    .enum(["REST-HTTP", "gRPC-HTTP2", "GraphQL", "Thrift", "tRPC"])
    .default("REST-HTTP"),
  apiInterfaceType: z
    .enum(["internal-private", "partner-facing", "public-api"])
    .default("internal-private"),
  runtime: z.string().min(1).max(64).default("Go 1.23 / Fiber"),
  instanceCount: z.number().int().min(1).max(200).default(4),
  authRequirement: z
    .enum(["mutual-tls-spiffe", "jwt-bearer", "api-key", "vpc-trusted-internal"])
    .default("mutual-tls-spiffe"),
  timeoutMs: z.number().int().min(100).max(60000).default(8000),
  retryPolicy: z
    .enum(["exponential-backoff", "constant-retry", "circuit-breaker-failfast", "no-retry"])
    .default("exponential-backoff"),
  healthCheckStrategy: z
    .enum(["liveness-readiness-http", "tcp-socket", "grpc-health-v1"])
    .default("grpc-health-v1"),
  assumedRps: z.number().int().min(1).max(500000).default(5000),
});
export type BackendServiceConfig = z.infer<typeof BackendServiceConfigSchema>;

// 04 — Microservice
export const MicroserviceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("microservice"),
  serviceName: z.string().min(1).max(64).default("order-management-service"),
  boundedContext: z.string().min(1).max(128).default("Orders & Checkout Domain"),
  runtime: z.string().min(1).max(64).default("Node 22 / TypeScript"),
  apiProtocol: z.enum(["gRPC", "REST-JSON", "GraphQL"]).default("gRPC"),
  deploymentStrategy: z
    .enum(["rolling-update", "blue-green", "canary", "recreate"])
    .default("canary"),
  replicaCount: z.number().int().min(1).max(128).default(3),
  serviceDiscoveryRegistered: z.boolean().default(true),
  memoryLimitMb: z.number().int().min(64).max(65536).default(1024),
  cpuLimitCores: z.number().min(0.1).max(32).default(1),
});
export type MicroserviceConfig = z.infer<typeof MicroserviceConfigSchema>;

// 05 — Monolithic Application
export const MonolithicApplicationConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("monolithic-application"),
  runtime: z
    .enum(["java-spring-boot", "django-python", "rails-ruby", "dotnet-enterprise", "laravel-php"])
    .default("java-spring-boot"),
  applicationModules: z
    .string()
    .min(1)
    .max(256)
    .default("Auth, Billing, Catalog, Notification, Admin"),
  deploymentUnit: z
    .enum(["single-fat-jar", "single-docker-image", "bare-metal-rpm", "systemd-service"])
    .default("single-docker-image"),
  instanceCount: z.number().int().min(1).max(32).default(2),
  databaseIntegration: z
    .enum(["shared-relational-single-db", "primary-replica-pool", "multiple-schemas"])
    .default("primary-replica-pool"),
  scalingStrategy: z
    .enum(["vertical-upsizing", "horizontal-replicated-stateless", "scheduled-burst"])
    .default("horizontal-replicated-stateless"),
  sessionManagement: z
    .enum(["distributed-redis-session", "jwt-stateless-cookie", "sticky-in-memory"])
    .default("distributed-redis-session"),
  memoryAllocationGb: z.number().int().min(1).max(256).default(8),
  cpuAllocationCores: z.number().int().min(1).max(64).default(4),
});
export type MonolithicApplicationConfig = z.infer<typeof MonolithicApplicationConfigSchema>;

// 06 — Serverless Function
export const ServerlessFunctionConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("serverless-function"),
  runtime: z
    .enum(["nodejs20.x", "python3.12", "golang1.x", "java21", "dotnet8", "rust-custom"])
    .default("nodejs20.x"),
  triggerType: z
    .enum(["http-api-gateway", "eventbridge-pubsub", "sqs-queue-poll", "s3-blob-event", "cron-timer"])
    .default("http-api-gateway"),
  timeoutSeconds: z.number().int().min(1).max(900).default(30),
  memoryAllocationMb: z.number().int().min(128).max(10240).default(512),
  maxConcurrentExecutions: z.number().int().min(1).max(10000).default(100),
  provisionedConcurrency: z.number().int().min(0).max(1000).default(0),
  retryAttempts: z.number().int().min(0).max(5).default(2),
  region: z.string().min(1).max(32).default("us-east-1"),
});
export type ServerlessFunctionConfig = z.infer<typeof ServerlessFunctionConfigSchema>;

// 07 — Container
export const ContainerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("container"),
  imageReference: z
    .string()
    .min(1)
    .max(256)
    .default("registry.infra.local/apps/payment-worker"),
  imageTag: z.string().min(1).max(64).default("v2.4.1"),
  cpuLimitCores: z.number().min(0.1).max(64).default(1.0),
  memoryLimitMb: z.number().int().min(32).max(131072).default(1024),
  containerPort: z.number().int().min(1).max(65535).default(8080),
  volumeMountPath: z.string().min(1).max(128).default("/mnt/data"),
  restartPolicy: z
    .enum(["always", "unless-stopped", "on-failure", "no"])
    .default("unless-stopped"),
  networkMode: z.enum(["bridge", "host", "overlay", "none"]).default("bridge"),
});
export type ContainerConfig = z.infer<typeof ContainerConfigSchema>;

// 08 — Container Cluster
export const ContainerClusterConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("container-cluster"),
  orchestratorCategory: z
    .enum(["kubernetes", "amazon-ecs", "nomad", "docker-swarm", "openshift"])
    .default("kubernetes"),
  nodeCount: z.number().int().min(1).max(1000).default(6),
  schedulingStrategy: z
    .enum(["bin-packing", "spread-anti-affinity", "taints-and-tolerations", "round-robin"])
    .default("spread-anti-affinity"),
  autoScalingPolicy: z
    .enum(["cluster-autoscaler-hpa", "keda-event-driven", "fixed-capacity"])
    .default("cluster-autoscaler-hpa"),
  clusterCidr: z.string().min(9).max(18).default("10.244.0.0/16"),
  storageIntegration: z
    .enum(["csi-persistent-volume", "ephemeral-local", "nfs-mount", "none"])
    .default("csi-persistent-volume"),
  multiAzEnabled: z.boolean().default(true),
});
export type ContainerClusterConfig = z.infer<typeof ContainerClusterConfigSchema>;

// 09 — Kubernetes Pod
export const KubernetesPodConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("kubernetes-pod"),
  namespace: z.string().min(1).max(63).default("default"),
  primaryContainerImage: z.string().min(1).max(256).default("service:latest"),
  sidecarCount: z.number().int().min(0).max(5).default(1),
  cpuRequestCores: z.number().min(0.05).max(32).default(0.5),
  cpuLimitCores: z.number().min(0.1).max(64).default(1.0),
  memoryRequestMb: z.number().int().min(32).max(65536).default(512),
  memoryLimitMb: z.number().int().min(64).max(131072).default(1024),
  restartPolicy: z.enum(["Always", "OnFailure", "Never"]).default("Always"),
  readinessProbeType: z.enum(["httpGet", "tcpSocket", "execCommand"]).default("httpGet"),
});
export type KubernetesPodConfig = z.infer<typeof KubernetesPodConfigSchema>;

// 10 — Kubernetes Service
export const KubernetesServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("kubernetes-service"),
  namespace: z.string().min(1).max(63).default("default"),
  serviceType: z
    .enum(["ClusterIP", "NodePort", "LoadBalancer", "ExternalName"])
    .default("ClusterIP"),
  port: z.number().int().min(1).max(65535).default(80),
  targetPort: z.number().int().min(1).max(65535).default(8080),
  protocol: z.enum(["TCP", "UDP", "SCTP"]).default("TCP"),
  selectorAppLabel: z.string().min(1).max(63).default("app=order-service"),
  sessionAffinity: z.enum(["None", "ClientIP"]).default("None"),
  internalTrafficPolicy: z.enum(["Cluster", "Local"]).default("Cluster"),
});
export type KubernetesServiceConfig = z.infer<typeof KubernetesServiceConfigSchema>;

// 11 — Virtual Machine
export const VirtualMachineConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("virtual-machine"),
  operatingSystem: z
    .enum(["ubuntu-linux-24-04", "rhel-9", "debian-12", "amazon-linux-2023", "windows-server-2022"])
    .default("ubuntu-linux-24-04"),
  instanceFamily: z.string().min(1).max(32).default("c7g.2xlarge"),
  cpuAllocationVcpus: z.number().int().min(1).max(128).default(8),
  memoryAllocationGb: z.number().int().min(1).max(512).default(16),
  storageAllocationGb: z.number().int().min(10).max(16384).default(100),
  virtualizationPlatform: z
    .enum(["kvm-qemu", "aws-nitro", "vmware-esxi", "hyper-v", "gcp-kvm"])
    .default("aws-nitro"),
  availabilityZone: z.string().min(1).max(32).default("us-east-1a"),
  bootDiskType: z
    .enum(["gp3-nvme-ssd", "io2-high-iops", "standard-hdd"])
    .default("gp3-nvme-ssd"),
});
export type VirtualMachineConfig = z.infer<typeof VirtualMachineConfigSchema>;

// 12 — Background Worker
export const BackgroundWorkerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("background-worker"),
  workerRuntime: z
    .enum(["celery-python", "bullmq-nodejs", "sidekiq-ruby", "temporal-go", "kafka-streams-jvm"])
    .default("bullmq-nodejs"),
  queueSubscription: z.string().min(1).max(128).default("notifications.email.dispatch"),
  workerConcurrency: z.number().int().min(1).max(256).default(16),
  batchSize: z.number().int().min(1).max(500).default(10),
  retryPolicy: z
    .enum(["exponential-backoff", "fixed-interval", "dead-letter-immediate"])
    .default("exponential-backoff"),
  taskTimeoutSeconds: z.number().int().min(1).max(3600).default(120),
  deadLetterQueueRef: z.string().min(1).max(128).default("notifications.email.dlq"),
  scalingTrigger: z
    .enum(["queue-depth-lag", "cpu-utilization", "fixed-capacity"])
    .default("queue-depth-lag"),
});
export type BackgroundWorkerConfig = z.infer<typeof BackgroundWorkerConfigSchema>;

// 13 — Scheduled Job
export const ScheduledJobConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("scheduled-job"),
  scheduleExpression: z.string().min(5).max(64).default("0 2 * * *"),
  timeZone: z.string().min(1).max(64).default("UTC"),
  executionTarget: z.string().min(1).max(128).default("db-backup-cleaner.sh"),
  concurrencyPolicy: z.enum(["Allow", "Forbid", "Replace"]).default("Forbid"),
  retryPolicy: z
    .enum(["retry-once", "exponential-backoff-3x", "no-retry"])
    .default("retry-once"),
  timeoutSeconds: z.number().int().min(5).max(86400).default(1800),
  misfireBehavior: z
    .enum(["run-immediately", "skip-and-wait", "fire-all-missed"])
    .default("run-immediately"),
});
export type ScheduledJobConfig = z.infer<typeof ScheduledJobConfigSchema>;

// 14 — Batch Processor
export const BatchProcessorConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("batch-processor"),
  processingMode: z
    .enum(["chunked-microbatch", "bulk-dataset-etl", "distributed-mapreduce", "streaming-window"])
    .default("chunked-microbatch"),
  inputSource: z.string().min(1).max(128).default("s3://data-lake-raw/events/"),
  outputDestination: z.string().min(1).max(128).default("s3://data-warehouse/curated/"),
  batchRecordSize: z.number().int().min(100).max(10000000).default(50000),
  parallelismSlots: z.number().int().min(1).max(256).default(8),
  checkpointIntervalSeconds: z.number().int().min(10).max(3600).default(300),
  failureHandling: z
    .enum(["fail-pipeline", "skip-corrupt-records", "quarantine-to-s3"])
    .default("quarantine-to-s3"),
  assumedThroughputRecordsPerSec: z.number().int().min(10).max(1000000).default(10000),
});
export type BatchProcessorConfig = z.infer<typeof BatchProcessorConfigSchema>;

