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

// 1. Git Repository Schema
export const gitRepositoryConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("git-repository").default("git-repository"),
  repositoryName: z.string().min(1).max(128).default("nxtqr-platform"),
  defaultBranch: z.string().min(1).max(64).default("main"),
  branchProtectionRule: z
    .enum(["require-pr-reviews", "require-status-checks", "require-signed-commits", "strict-lockdown", "none"])
    .default("require-status-checks"),
  hostingModel: z
    .enum(["cloud-hosted", "self-hosted-enterprise", "isolated-bare-git", "hybrid-mirrored"])
    .default("cloud-hosted"),
  webhookTriggerEvents: z
    .enum(["push-and-pr", "push-only", "pr-only", "tag-release-only"])
    .default("push-and-pr"),
  retentionDays: z.number().int().min(1).max(3650).default(90),
});
export type GitRepositoryConfig = z.infer<typeof gitRepositoryConfigSchema>;

// 2. CI Pipeline Schema
export const ciPipelineConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("ci-pipeline").default("ci-pipeline"),
  pipelineTrigger: z
    .enum(["webhook-push", "pull-request-open", "scheduled-cron", "manual-dispatch"])
    .default("webhook-push"),
  testParallelism: z.number().int().min(1).max(64).default(4),
  buildTimeoutMinutes: z.number().int().min(1).max(720).default(30),
  artifactCachingStrategy: z
    .enum(["content-addressable-cache", "remote-s3-cache", "ephemeral-layer-cache", "disabled"])
    .default("content-addressable-cache"),
  failFast: z.boolean().default(true),
  concurrencyLimit: z.number().int().min(1).max(100).default(10),
});
export type CiPipelineConfig = z.infer<typeof ciPipelineConfigSchema>;

// 3. CD Pipeline Schema
export const cdPipelineConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("cd-pipeline").default("cd-pipeline"),
  targetEnvironment: z
    .enum(["production", "staging", "development", "canary-slice", "multi-region"])
    .default("staging"),
  deploymentStrategy: z
    .enum(["rolling-update", "blue-green", "canary-progressive", "recreate-downtime"])
    .default("rolling-update"),
  approvalGatePolicy: z
    .enum(["automated-metrics-gate", "manual-peer-approval", "scheduled-change-window", "zero-gate-continuous"])
    .default("automated-metrics-gate"),
  autoRollbackOnError: z.boolean().default(true),
  timeoutMinutes: z.number().int().min(1).max(120).default(20),
});
export type CdPipelineConfig = z.infer<typeof cdPipelineConfigSchema>;

// 4. Build Server Schema
export const buildServerConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("build-server").default("build-server"),
  executorType: z
    .enum(["ephemeral-container", "isolated-bare-metal", "kubernetes-pod-runner", "serverless-microvm"])
    .default("ephemeral-container"),
  cpuCores: z.number().int().min(1).max(128).default(8),
  memoryGb: z.number().int().min(1).max(512).default(16),
  diskStorageGb: z.number().int().min(10).max(2000).default(100),
  autoscalingMinRunners: z.number().int().min(0).max(50).default(1),
  autoscalingMaxRunners: z.number().int().min(1).max(500).default(20),
});
export type BuildServerConfig = z.infer<typeof buildServerConfigSchema>;

// 5. Artifact Registry Schema
export const artifactRegistryConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("artifact-registry").default("artifact-registry"),
  packageFormat: z
    .enum(["npm-node", "maven-jar", "pypi-wheel", "nuget-csharp", "generic-binary", "helm-chart"])
    .default("npm-node"),
  immutabilityPolicy: z
    .enum(["immutable-strict", "allow-snapshot-overwrite", "semver-enforced"])
    .default("immutable-strict"),
  vulnerabilityScanning: z
    .enum(["on-push-and-scheduled", "on-push-only", "disabled"])
    .default("on-push-and-scheduled"),
  storageCapacityGb: z.number().int().min(1).max(100000).default(500),
  retentionPolicyDays: z.number().int().min(7).max(3650).default(180),
});
export type ArtifactRegistryConfig = z.infer<typeof artifactRegistryConfigSchema>;

// 6. Container Registry Schema
export const containerRegistryConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("container-registry").default("container-registry"),
  ociCompliance: z.literal(true).default(true),
  tagImmutability: z.boolean().default(true),
  cveScanningEngine: z
    .enum(["trivy-scanner", "clair-scanner", "native-cloud-inspector", "disabled"])
    .default("trivy-scanner"),
  geoReplication: z
    .enum(["multi-region-active", "single-region", "edge-replicated"])
    .default("single-region"),
  maxImageSizeMb: z.number().int().min(50).max(10000).default(2048),
  cleanRetentionDays: z.number().int().min(7).max(730).default(90),
});
export type ContainerRegistryConfig = z.infer<typeof containerRegistryConfigSchema>;

// 7. Deployment Controller Schema
export const deploymentControllerConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("deployment-controller").default("deployment-controller"),
  reconciliationLoop: z
    .enum(["gitops-pull-reconcile", "push-triggered-webhook", "continuous-sync", "manual-sync"])
    .default("gitops-pull-reconcile"),
  syncIntervalSeconds: z.number().int().min(5).max(3600).default(60),
  driftDetectionStrategy: z
    .enum(["auto-remediate", "alert-only", "block-pipeline", "ignore"])
    .default("auto-remediate"),
  healthCheckStrategy: z
    .enum(["custom-readiness-probes", "http-endpoint-ping", "synthetic-canary", "pod-ready-ratio"])
    .default("custom-readiness-probes"),
  pruneOrphanedResources: z.boolean().default(true),
});
export type DeploymentControllerConfig = z.infer<typeof deploymentControllerConfigSchema>;

// 8. Infrastructure as Code Schema
export const infrastructureAsCodeConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("infrastructure-as-code").default("infrastructure-as-code"),
  iacFramework: z
    .enum(["terraform-opentofu", "pulumi-ts", "aws-cdk", "kubernetes-crds", "ansible-playbook"])
    .default("terraform-opentofu"),
  stateStorageBackend: z
    .enum(["s3-dynamodb-locking", "terraform-cloud", "gcs-bucket", "azurerm-blob", "consul-kv"])
    .default("s3-dynamodb-locking"),
  driftDetectionIntervalHours: z.number().int().min(1).max(168).default(24),
  policyAsCodeValidation: z
    .enum(["opa-rego-strict", "checkov-security", "sentinel-enterprise", "disabled"])
    .default("opa-rego-strict"),
  autoApply: z.boolean().default(false),
});
export type InfrastructureAsCodeConfig = z.infer<typeof infrastructureAsCodeConfigSchema>;

// 9. Feature Flag Service Schema
export const featureFlagServiceConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("feature-flag-service").default("feature-flag-service"),
  evaluationModel: z
    .enum(["client-side-cached", "server-side-evaluated", "edge-worker-evaluated", "hybrid-streaming"])
    .default("server-side-evaluated"),
  rolloutStrategy: z
    .enum(["percentage-canary", "user-attribute-targeting", "ring-deployment", "boolean-kill-switch"])
    .default("percentage-canary"),
  auditLoggingEnabled: z.boolean().default(true),
  cacheTtlMilliseconds: z.number().int().min(100).max(60000).default(5000),
  activeFlagsCount: z.number().int().min(1).max(10000).default(50),
});
export type FeatureFlagServiceConfig = z.infer<typeof featureFlagServiceConfigSchema>;

// 10. Configuration Service Schema
export const configurationServiceConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("configuration-service").default("configuration-service"),
  storageBackend: z
    .enum(["git-backed-store", "distributed-etcd", "consul-kv-tree", "cloud-app-config"])
    .default("distributed-etcd"),
  deliveryProtocol: z
    .enum(["grpc-streaming-push", "http-polling", "websocket-sync", "agent-sidecar-watcher"])
    .default("grpc-streaming-push"),
  schemaValidationEnforced: z.boolean().default(true),
  dynamicReloadSupported: z.boolean().default(true),
  pollIntervalSeconds: z.number().int().min(1).max(300).default(15),
});
export type ConfigurationServiceConfig = z.infer<typeof configurationServiceConfigSchema>;

// 11. Secrets Injection Service Schema
export const secretsInjectionServiceConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("secrets-injection-service").default("secrets-injection-service"),
  injectionMechanism: z
    .enum(["sidecar-agent-volume", "init-container-env", "csi-driver-mount", "ephemeral-env-variable"])
    .default("csi-driver-mount"),
  secretLeaseRotationHours: z.number().int().min(1).max(720).default(24),
  encryptionTransitStandard: z
    .enum(["tls-1-3-aes-gcm", "mutual-tls-spiffe", "wireguard-tunnel"])
    .default("tls-1-3-aes-gcm"),
  zeroDiskPersistence: z.boolean().default(true),
  auditAccessLog: z.boolean().default(true),
});
export type SecretsInjectionServiceConfig = z.infer<typeof secretsInjectionServiceConfigSchema>;

// 12. Release Manager Schema
export const releaseManagerConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("release-manager").default("release-manager"),
  versioningScheme: z
    .enum(["semver-strict", "calver-date", "git-commit-sha", "monotonic-build-counter"])
    .default("semver-strict"),
  promotionPolicy: z
    .enum(["dev-stage-prod-gate", "direct-continuous-trunk", "ring-canary-staged"])
    .default("dev-stage-prod-gate"),
  changelogGeneration: z
    .enum(["conventional-commits-auto", "manual-markdown-entry", "jira-ticket-linked"])
    .default("conventional-commits-auto"),
  freezeWindowEnforced: z.boolean().default(false),
  maximumReleaseWindowMinutes: z.number().int().min(5).max(480).default(60),
});
export type ReleaseManagerConfig = z.infer<typeof releaseManagerConfigSchema>;

// Discriminated union of all Category 15 schemas
export const devopsAndDeploymentComponentSchema = z.discriminatedUnion("componentType", [
  gitRepositoryConfigSchema,
  ciPipelineConfigSchema,
  cdPipelineConfigSchema,
  buildServerConfigSchema,
  artifactRegistryConfigSchema,
  containerRegistryConfigSchema,
  deploymentControllerConfigSchema,
  infrastructureAsCodeConfigSchema,
  featureFlagServiceConfigSchema,
  configurationServiceConfigSchema,
  secretsInjectionServiceConfigSchema,
  releaseManagerConfigSchema,
]);

export type DevopsAndDeploymentComponentConfig = z.infer<typeof devopsAndDeploymentComponentSchema>;
