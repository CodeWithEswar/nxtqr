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

// Reusable pattern classification and common metadata
export const distributedPatternMetadataSchema = z.object({
  patternClassification: z
    .enum(["resilience-pattern", "coordination-pattern", "orchestration-service", "coordination-service", "registry-service"])
    .default("resilience-pattern"),
  scopeBoundary: z.enum(["in-process", "sidecar-proxy", "service-mesh", "centralized-service", "cluster-consensus"]).default("sidecar-proxy"),
  failureMode: z.enum(["fail-fast", "fallback-degraded", "queue-retry", "circuit-opened", "quorum-unavailable"]).default("fallback-degraded"),
  observabilityExport: z.enum(["prometheus-metrics", "distributed-traces", "structured-audit-logs", "all"]).default("all"),
});
export type DistributedPatternMetadata = z.infer<typeof distributedPatternMetadataSchema>;

// 1. Circuit Breaker Schema
export const circuitBreakerConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("circuit-breaker").default("circuit-breaker"),
  patternClassification: z.literal("resilience-pattern").default("resilience-pattern"),
  failureThresholdPercentage: z.number().int().min(1).max(100).default(50),
  slidingWindowType: z.enum(["count-based", "time-based"]).default("count-based"),
  slidingWindowSize: z.number().int().min(10).max(10000).default(100),
  minimumRequestVolume: z.number().int().min(1).max(1000).default(20),
  openStateDurationSeconds: z.number().int().min(1).max(3600).default(30),
  halfOpenProbeLimit: z.number().int().min(1).max(50).default(5),
  failureClassification: z
    .enum(["5xx-and-timeouts", "all-non-2xx", "network-exceptions-only", "custom-status-codes"])
    .default("5xx-and-timeouts"),
  fallbackBehavior: z
    .enum(["return-cached-data", "degraded-stub", "fail-fast-error", "secondary-service"])
    .default("fail-fast-error"),
  timeoutMs: z.number().int().min(50).max(60000).default(3000),
});
export type CircuitBreakerConfig = z.infer<typeof circuitBreakerConfigSchema>;

// 2. Bulkhead Schema
export const bulkheadConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("bulkhead").default("bulkhead"),
  patternClassification: z.literal("resilience-pattern").default("resilience-pattern"),
  isolationStrategy: z
    .enum(["thread-pool", "semaphore", "worker-pool", "connection-pool"])
    .default("thread-pool"),
  resourcePoolCount: z.number().int().min(1).max(32).default(3),
  maxConcurrentCalls: z.number().int().min(1).max(5000).default(50),
  queueCapacity: z.number().int().min(0).max(10000).default(100),
  rejectionStrategy: z
    .enum(["fail-fast", "circuit-breaker-fallback", "queue-with-timeout", "caller-runs"])
    .default("fail-fast"),
  callTimeoutMs: z.number().int().min(50).max(60000).default(2000),
  failureContainmentDomain: z.string().max(64).default("critical-path-isolation"),
});
export type BulkheadConfig = z.infer<typeof bulkheadConfigSchema>;

// 3. Retry Controller Schema
export const retryControllerConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("retry-controller").default("retry-controller"),
  patternClassification: z.literal("resilience-pattern").default("resilience-pattern"),
  maxAttempts: z.number().int().min(1).max(20).default(3),
  backoffStrategy: z
    .enum(["exponential-backoff", "fixed-interval", "decorrelated-jitter", "fibonacci"])
    .default("exponential-backoff"),
  initialDelayMs: z.number().int().min(10).max(60000).default(200),
  maxDelayMs: z.number().int().min(100).max(300000).default(5000),
  jitterFactor: z.number().min(0).max(1).default(0.2),
  overallDeadlineMs: z.number().int().min(500).max(600000).default(10000),
  retryableErrorClasses: z
    .array(z.enum(["5xx-server-error", "network-timeout", "rate-limited-429", "connection-reset", "conflict-409"]))
    .min(1)
    .default(["5xx-server-error", "network-timeout", "rate-limited-429"]),
  requiresIdempotencyKey: z.boolean().default(true),
  retryBudgetPercentage: z.number().int().min(0).max(100).default(20),
});
export type RetryControllerConfig = z.infer<typeof retryControllerConfigSchema>;

// 4. Saga Orchestrator Schema
export const sagaOrchestratorConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("saga-orchestrator").default("saga-orchestrator"),
  patternClassification: z.literal("orchestration-service").default("orchestration-service"),
  sagaType: z.enum(["orchestration", "choreography"]).default("orchestration"),
  statePersistence: z
    .enum(["event-sourced", "relational-db", "distributed-log", "in-memory"])
    .default("relational-db"),
  stepTimeoutSeconds: z.number().int().min(1).max(600).default(30),
  compensationStrategy: z
    .enum(["backward-recovery", "forward-recovery", "manual-escalation"])
    .default("backward-recovery"),
  maxConcurrentSagas: z.number().int().min(1).max(10000).default(200),
  idempotentStepsEnforced: z.boolean().default(true),
  sagaDefinitionFormat: z.enum(["json-state-machine", "bpmn-xml", "code-dsl", "temporal-workflow"]).default("json-state-machine"),
});
export type SagaOrchestratorConfig = z.infer<typeof sagaOrchestratorConfigSchema>;

// 5. Leader Election Schema
export const leaderElectionConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("leader-election").default("leader-election"),
  patternClassification: z.literal("coordination-pattern").default("coordination-pattern"),
  electionMechanism: z
    .enum(["raft-consensus", "lease-lock-etcd", "zookeeper-ephemeral", "database-pessimistic", "bully-algorithm"])
    .default("lease-lock-etcd"),
  leaderLeaseDurationMs: z.number().int().min(500).max(60000).default(10000),
  heartbeatIntervalMs: z.number().int().min(100).max(10000).default(2000),
  failureDetectionThresholdMs: z.number().int().min(200).max(30000).default(5000),
  splitBrainPrevention: z
    .enum(["strict-quorum", "fencing-token", "witness-node", "stonith"])
    .default("strict-quorum"),
  termEpochTracking: z.boolean().default(true),
  participantCount: z.number().int().min(2).max(64).default(3),
});
export type LeaderElectionConfig = z.infer<typeof leaderElectionConfigSchema>;

// 6. Distributed Lock Schema
export const distributedLockConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("distributed-lock").default("distributed-lock"),
  patternClassification: z.literal("coordination-service").default("coordination-service"),
  lockScope: z.enum(["fine-grained-key", "table-partition", "cluster-wide"]).default("fine-grained-key"),
  lockProvider: z
    .enum(["redis-redlock", "etcd-key-lease", "consul-session", "postgres-advisory", "zookeeper-znode"])
    .default("redis-redlock"),
  leaseDurationMs: z.number().int().min(500).max(300000).default(15000),
  autoRenewal: z.boolean().default(true),
  fencingTokenEnabled: z.boolean().default(true),
  acquireTimeoutMs: z.number().int().min(100).max(60000).default(5000),
  contentionPolicy: z
    .enum(["spin-with-backoff", "queue-fifo", "fail-immediately"])
    .default("spin-with-backoff"),
  redlockNodeQuorum: z.number().int().min(1).max(9).default(3),
});
export type DistributedLockConfig = z.infer<typeof distributedLockConfigSchema>;

// 7. Consensus Coordinator Schema
export const consensusCoordinatorConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("consensus-coordinator").default("consensus-coordinator"),
  patternClassification: z.literal("coordination-pattern").default("coordination-pattern"),
  consensusAlgorithm: z
    .enum(["raft", "multi-paxos", "zab", "viewstamped-replication", "pbft"])
    .default("raft"),
  replicaNodeCount: z.number().int().min(3).max(15).default(5),
  quorumSize: z.number().int().min(2).max(8).default(3),
  leaderModel: z.enum(["strong-leader", "leaderless", "rotating-proposer"]).default("strong-leader"),
  logCompactionStrategy: z.enum(["snapshotting", "log-pruning", "checkpoint-only"]).default("snapshotting"),
  commitLatencyTargetMs: z.number().int().min(1).max(1000).default(10),
  membershipReconfiguration: z.enum(["joint-consensus", "single-server-change", "static-membership"]).default("joint-consensus"),
});
export type ConsensusCoordinatorConfig = z.infer<typeof consensusCoordinatorConfigSchema>;

// 8. Idempotency Service Schema
export const idempotencyServiceConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("idempotency-service").default("idempotency-service"),
  patternClassification: z.literal("coordination-service").default("coordination-service"),
  idempotencyKeyStrategy: z
    .enum(["header-idempotency-key", "request-hash-sha256", "jwt-jti-token", "payload-composite"])
    .default("header-idempotency-key"),
  keyScope: z.enum(["per-user", "per-tenant", "global-api"]).default("per-tenant"),
  storageBackend: z
    .enum(["redis-cluster", "dynamodb-ttl", "postgres-unique", "distributed-cache"])
    .default("redis-cluster"),
  retentionHours: z.number().int().min(1).max(720).default(24),
  duplicateResponseStrategy: z
    .enum(["cached-response", "replay-in-progress-409", "acknowledge-noop"])
    .default("cached-response"),
  concurrencyResolution: z
    .enum(["atomic-set-nx", "two-phase-commit", "optimistic-lock"])
    .default("atomic-set-nx"),
  enforceRequestFingerprinting: z.boolean().default(true),
});
export type IdempotencyServiceConfig = z.infer<typeof idempotencyServiceConfigSchema>;

// 9. Distributed Scheduler Schema
export const distributedSchedulerConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("distributed-scheduler").default("distributed-scheduler"),
  patternClassification: z.literal("orchestration-service").default("orchestration-service"),
  scheduleFormat: z
    .enum(["cron-expression", "fixed-rate-interval", "one-time-delayed", "dag-dependency"])
    .default("cron-expression"),
  cronExpressionSample: z.string().max(64).default("0 */5 * * * *"),
  leaderLeaseCoordination: z
    .enum(["distributed-lock-lease", "database-polling-skip-locked", "raft-scheduler-group"])
    .default("distributed-lock-lease"),
  misfirePolicy: z
    .enum(["fire-immediately", "ignore-misfire", "reschedule-next-cycle"])
    .default("fire-immediately"),
  jobExecutionTimeoutSeconds: z.number().int().min(10).max(86400).default(300),
  concurrencyControl: z
    .enum(["allow-concurrent", "forbid-concurrent", "replace-existing"])
    .default("forbid-concurrent"),
  workerAssignmentStrategy: z
    .enum(["round-robin", "least-loaded", "consistent-hash", "competing-consumer"])
    .default("competing-consumer"),
});
export type DistributedSchedulerConfig = z.infer<typeof distributedSchedulerConfigSchema>;

// 10. Service Registry Schema
export const serviceRegistryConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("service-registry").default("service-registry"),
  patternClassification: z.literal("registry-service").default("registry-service"),
  registryEngine: z
    .enum(["consul-agent", "etcd-cluster", "eureka-server", "zookeeper-ensemble", "dns-srv"])
    .default("consul-agent"),
  registrationModel: z
    .enum(["self-registration", "sidecar-registrar", "platform-orchestrator"])
    .default("sidecar-registrar"),
  healthCheckIntervalSeconds: z.number().int().min(1).max(300).default(10),
  instanceTtlSeconds: z.number().int().min(5).max(600).default(30),
  deregistrationCriticalTimeoutSeconds: z.number().int().min(10).max(1800).default(90),
  consistencyModel: z
    .enum(["eventual-gossip", "strong-raft", "read-your-writes"])
    .default("strong-raft"),
  subscriptionWatchSupported: z.boolean().default(true),
  maxRegisteredInstancesEstimate: z.number().int().min(1).max(50000).default(500),
});
export type ServiceRegistryConfig = z.infer<typeof serviceRegistryConfigSchema>;

// Discriminated union of all Category 18 configuration schemas
export const distributedSystemsPatternsConfigSchema = z.discriminatedUnion("componentType", [
  circuitBreakerConfigSchema,
  bulkheadConfigSchema,
  retryControllerConfigSchema,
  sagaOrchestratorConfigSchema,
  leaderElectionConfigSchema,
  distributedLockConfigSchema,
  consensusCoordinatorConfigSchema,
  idempotencyServiceConfigSchema,
  distributedSchedulerConfigSchema,
  serviceRegistryConfigSchema,
]);
export type DistributedSystemsPatternsConfig = z.infer<typeof distributedSystemsPatternsConfigSchema>;

