import type {
  InfrastructureCategoryDefinition,
  InfrastructureComponentDefinition,
} from "../types";
import {
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
  type GitRepositoryConfig,
  type CiPipelineConfig,
  type CdPipelineConfig,
  type BuildServerConfig,
  type ArtifactRegistryConfig,
  type ContainerRegistryConfig,
  type DeploymentControllerConfig,
  type InfrastructureAsCodeConfig,
  type FeatureFlagServiceConfig,
  type ConfigurationServiceConfig,
  type SecretsInjectionServiceConfig,
  type ReleaseManagerConfig,
} from "../schemas/devops-and-deployment.schema";

export const DEVOPS_AND_DEPLOYMENT_CATEGORY_ID = "devops-and-deployment";

export const devopsAndDeploymentCategoryDefinition: InfrastructureCategoryDefinition = {
  id: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  name: "DevOps & Deployment",
  description:
    "Source control, continuous integration, automated delivery, artifact repositories, container registries, GitOps controllers, and release orchestration.",
  iconSlug: "git-repository",
  order: 15,
};

// 1. Git Repository Definition
export const gitRepositoryDefinition: InfrastructureComponentDefinition<GitRepositoryConfig> = {
  id: "git-repository",
  version: 1,
  categoryId: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  display: {
    name: "Git Repository",
    shortName: "Git Repo",
    description: "Distributed version control repository hosting source code, branches, and commit histories with webhook automation triggers.",
    keywords: ["git", "repository", "source", "vcs", "branch", "pr", "commit"],
    iconSlug: "git-repository",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: gitRepositoryConfigSchema,
  defaultConfig: {
    label: "Git Repository",
    environment: "production",
    enabled: true,
    tags: ["vcs", "source-code"],
    componentType: "git-repository",
    repositoryName: "nxtqr-platform",
    defaultBranch: "main",
    branchProtectionRule: "require-status-checks",
    hostingModel: "cloud-hosted",
    webhookTriggerEvents: "push-and-pr",
    retentionDays: 90,
  },
  ports: [
    { id: "developer-push-in", name: "Dev Push", type: "input", dataType: "Git_Push_Event", capacity: 32 },
    { id: "webhook-event-out", name: "Webhook Event", type: "output", dataType: "Webhook_Payload", capacity: 16 },
    { id: "source-pull-out", name: "Source Clone", type: "output", dataType: "Git_Clone_Stream", capacity: 16 },
  ],
  capabilities: ["source-versioning", "branch-protection", "webhook-triggers"],
  inspector: [
    {
      id: "git-general",
      title: "Repository Settings",
      fields: [
        { path: "repositoryName", label: "Repository Name", type: "text" },
        { path: "defaultBranch", label: "Default Branch", type: "text" },
        {
          path: "branchProtectionRule",
          label: "Branch Protection Rule",
          type: "select",
          options: [
            { label: "Require Status Checks", value: "require-status-checks" },
            { label: "Require PR Reviews", value: "require-pr-reviews" },
            { label: "Require Signed Commits", value: "require-signed-commits" },
            { label: "Strict Lockdown", value: "strict-lockdown" },
            { label: "None", value: "none" },
          ],
        },
        {
          path: "hostingModel",
          label: "Hosting Model",
          type: "select",
          options: [
            { label: "Cloud Hosted", value: "cloud-hosted" },
            { label: "Self-Hosted Enterprise", value: "self-hosted-enterprise" },
            { label: "Isolated Bare Git", value: "isolated-bare-git" },
            { label: "Hybrid Mirrored", value: "hybrid-mirrored" },
          ],
        },
      ],
    },
  ],
};

// 2. CI Pipeline Definition
export const ciPipelineDefinition: InfrastructureComponentDefinition<CiPipelineConfig> = {
  id: "ci-pipeline",
  version: 1,
  categoryId: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  display: {
    name: "CI Pipeline",
    shortName: "CI Pipeline",
    description: "Automated continuous integration workflow orchestrating linting, unit tests, security scans, and build artifact generation.",
    keywords: ["ci", "pipeline", "continuous-integration", "lint", "test", "automation", "build"],
    iconSlug: "ci-pipeline",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: ciPipelineConfigSchema,
  defaultConfig: {
    label: "CI Pipeline",
    environment: "production",
    enabled: true,
    tags: ["ci", "testing"],
    componentType: "ci-pipeline",
    pipelineTrigger: "webhook-push",
    testParallelism: 4,
    buildTimeoutMinutes: 30,
    artifactCachingStrategy: "content-addressable-cache",
    failFast: true,
    concurrencyLimit: 10,
  },
  ports: [
    { id: "trigger-event-in", name: "Trigger Event", type: "input", dataType: "Webhook_Payload", capacity: 8 },
    { id: "build-runner-out", name: "Runner Dispatch", type: "output", dataType: "Build_Job_Task", capacity: 16 },
    { id: "test-status-out", name: "Status Checks", type: "output", dataType: "Commit_Status_Context", capacity: 8 },
  ],
  capabilities: ["automated-testing", "parallel-execution", "fail-fast-guard"],
  inspector: [
    {
      id: "ci-settings",
      title: "CI Pipeline Settings",
      fields: [
        {
          path: "pipelineTrigger",
          label: "Pipeline Trigger",
          type: "select",
          options: [
            { label: "Webhook Push", value: "webhook-push" },
            { label: "Pull Request Open", value: "pull-request-open" },
            { label: "Scheduled Cron", value: "scheduled-cron" },
            { label: "Manual Dispatch", value: "manual-dispatch" },
          ],
        },
        { path: "testParallelism", label: "Test Parallelism", type: "number" },
        { path: "buildTimeoutMinutes", label: "Timeout (Minutes)", type: "number" },
      ],
    },
  ],
};

// 3. CD Pipeline Definition
export const cdPipelineDefinition: InfrastructureComponentDefinition<CdPipelineConfig> = {
  id: "cd-pipeline",
  version: 1,
  categoryId: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  display: {
    name: "CD Pipeline",
    shortName: "CD Pipeline",
    description: "Continuous delivery and deployment pipeline automating progressive staging, approval gates, canary rollouts, and rollback triggers.",
    keywords: ["cd", "pipeline", "continuous-deployment", "delivery", "canary", "blue-green", "rollout"],
    iconSlug: "cd-pipeline",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: cdPipelineConfigSchema,
  defaultConfig: {
    label: "CD Pipeline",
    environment: "staging",
    enabled: true,
    tags: ["cd", "deployment"],
    componentType: "cd-pipeline",
    targetEnvironment: "staging",
    deploymentStrategy: "rolling-update",
    approvalGatePolicy: "automated-metrics-gate",
    autoRollbackOnError: true,
    timeoutMinutes: 20,
  },
  ports: [
    { id: "artifact-input-in", name: "Artifact In", type: "input", dataType: "Release_Artifact", capacity: 8 },
    { id: "deploy-target-out", name: "Deploy Command", type: "output", dataType: "Deployment_Directive", capacity: 8 },
    { id: "rollback-out", name: "Auto Rollback", type: "output", dataType: "Rollback_Signal", capacity: 4 },
  ],
  capabilities: ["progressive-rollout", "canary-analysis", "automated-rollback"],
  inspector: [
    {
      id: "cd-settings",
      title: "CD Deployment Settings",
      fields: [
        {
          path: "deploymentStrategy",
          label: "Deployment Strategy",
          type: "select",
          options: [
            { label: "Rolling Update", value: "rolling-update" },
            { label: "Blue-Green", value: "blue-green" },
            { label: "Canary Progressive", value: "canary-progressive" },
            { label: "Recreate (Downtime)", value: "recreate-downtime" },
          ],
        },
        {
          path: "approvalGatePolicy",
          label: "Approval Gate Policy",
          type: "select",
          options: [
            { label: "Automated Metrics Gate", value: "automated-metrics-gate" },
            { label: "Manual Peer Approval", value: "manual-peer-approval" },
            { label: "Scheduled Change Window", value: "scheduled-change-window" },
            { label: "Zero-Gate Continuous", value: "zero-gate-continuous" },
          ],
        },
      ],
    },
  ],
};

// 4. Build Server Definition
export const buildServerDefinition: InfrastructureComponentDefinition<BuildServerConfig> = {
  id: "build-server",
  version: 1,
  categoryId: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  display: {
    name: "Build Server",
    shortName: "Build Server",
    description: "Dedicated computation host running ephemeral container runners, compiling binaries, and assembling production application bundles.",
    keywords: ["build", "server", "runner", "compiler", "executor", "ci-agent"],
    iconSlug: "build-server",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: buildServerConfigSchema,
  defaultConfig: {
    label: "Build Server",
    environment: "production",
    enabled: true,
    tags: ["build", "runner"],
    componentType: "build-server",
    executorType: "ephemeral-container",
    cpuCores: 8,
    memoryGb: 16,
    diskStorageGb: 100,
    autoscalingMinRunners: 1,
    autoscalingMaxRunners: 20,
  },
  ports: [
    { id: "job-queue-in", name: "Job Queue In", type: "input", dataType: "Build_Job_Task", capacity: 16 },
    { id: "binary-export-out", name: "Binary Export", type: "output", dataType: "Compiled_Binary", capacity: 8 },
  ],
  capabilities: ["parallel-compilation", "ephemeral-isolation", "auto-scaling-runners"],
  inspector: [
    {
      id: "build-compute",
      title: "Compute Specification",
      fields: [
        {
          path: "executorType",
          label: "Executor Type",
          type: "select",
          options: [
            { label: "Ephemeral Container", value: "ephemeral-container" },
            { label: "Isolated Bare Metal", value: "isolated-bare-metal" },
            { label: "Kubernetes Pod Runner", value: "kubernetes-pod-runner" },
            { label: "Serverless MicroVM", value: "serverless-microvm" },
          ],
        },
        { path: "cpuCores", label: "CPU Cores", type: "number" },
        { path: "memoryGb", label: "Memory (GB)", type: "number" },
      ],
    },
  ],
};

// 5. Artifact Registry Definition
export const artifactRegistryDefinition: InfrastructureComponentDefinition<ArtifactRegistryConfig> = {
  id: "artifact-registry",
  version: 1,
  categoryId: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  display: {
    name: "Artifact Registry",
    shortName: "Artifact Repo",
    description: "Secure versioned storage repository for package dependencies, JAR/wheel libraries, binaries, and Helm charts with vulnerability auditing.",
    keywords: ["artifact", "registry", "npm", "maven", "pypi", "binaries", "helm", "packages"],
    iconSlug: "artifact-registry",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: artifactRegistryConfigSchema,
  defaultConfig: {
    label: "Artifact Registry",
    environment: "production",
    enabled: true,
    tags: ["packages", "artifacts"],
    componentType: "artifact-registry",
    packageFormat: "npm-node",
    immutabilityPolicy: "immutable-strict",
    vulnerabilityScanning: "on-push-and-scheduled",
    storageCapacityGb: 500,
    retentionPolicyDays: 180,
  },
  ports: [
    { id: "publish-artifact-in", name: "Publish In", type: "input", dataType: "Package_Archive", capacity: 16 },
    { id: "download-artifact-out", name: "Download Out", type: "output", dataType: "Package_Download_Stream", capacity: 32 },
  ],
  capabilities: ["immutable-versions", "cve-audit", "multi-format-support"],
  inspector: [
    {
      id: "artifact-settings",
      title: "Package Management",
      fields: [
        {
          path: "packageFormat",
          label: "Package Format",
          type: "select",
          options: [
            { label: "NPM (Node)", value: "npm-node" },
            { label: "Maven (JAR)", value: "maven-jar" },
            { label: "PyPI (Wheel)", value: "pypi-wheel" },
            { label: "NuGet (.NET)", value: "nuget-csharp" },
            { label: "Helm Charts", value: "helm-chart" },
            { label: "Generic Binary", value: "generic-binary" },
          ],
        },
        {
          path: "immutabilityPolicy",
          label: "Immutability Policy",
          type: "select",
          options: [
            { label: "Strictly Immutable", value: "immutable-strict" },
            { label: "Allow Snapshot Overwrite", value: "allow-snapshot-overwrite" },
            { label: "SemVer Enforced", value: "semver-enforced" },
          ],
        },
      ],
    },
  ],
};

// 6. Container Registry Definition
export const containerRegistryDefinition: InfrastructureComponentDefinition<ContainerRegistryConfig> = {
  id: "container-registry",
  version: 1,
  categoryId: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  display: {
    name: "Container Registry",
    shortName: "Container Reg",
    description: "High-performance OCI-compliant registry managing container images, multi-arch manifests, vulnerability scanning, and signed attestations.",
    keywords: ["container", "registry", "docker", "oci", "image", "manifest", "cve-scan"],
    iconSlug: "container-registry",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: containerRegistryConfigSchema,
  defaultConfig: {
    label: "Container Registry",
    environment: "production",
    enabled: true,
    tags: ["containers", "oci-registry"],
    componentType: "container-registry",
    ociCompliance: true,
    tagImmutability: true,
    cveScanningEngine: "trivy-scanner",
    geoReplication: "single-region",
    maxImageSizeMb: 2048,
    cleanRetentionDays: 90,
  },
  ports: [
    { id: "docker-push-in", name: "Image Push", type: "input", dataType: "OCI_Image_Layer", capacity: 16 },
    { id: "docker-pull-out", name: "Image Pull", type: "output", dataType: "OCI_Manifest_Stream", capacity: 64 },
  ],
  capabilities: ["oci-compliance", "immutable-tags", "vulnerability-scan", "geo-replication"],
  inspector: [
    {
      id: "container-registry-settings",
      title: "Registry Security",
      fields: [
        {
          path: "cveScanningEngine",
          label: "CVE Scanner",
          type: "select",
          options: [
            { label: "Trivy Scanner", value: "trivy-scanner" },
            { label: "Clair Scanner", value: "clair-scanner" },
            { label: "Native Cloud Inspector", value: "native-cloud-inspector" },
            { label: "Disabled", value: "disabled" },
          ],
        },
        { path: "tagImmutability", label: "Tag Immutability", type: "boolean" },
      ],
    },
  ],
};

// 7. Deployment Controller Definition
export const deploymentControllerDefinition: InfrastructureComponentDefinition<DeploymentControllerConfig> = {
  id: "deployment-controller",
  version: 1,
  categoryId: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  display: {
    name: "Deployment Controller",
    shortName: "Deploy Control",
    description: "GitOps orchestrator maintaining continuous reconciliation loops between desired Git manifests and live cluster infrastructure state.",
    keywords: ["deployment", "controller", "gitops", "argocd", "flux", "reconcile", "drift"],
    iconSlug: "deployment-controller",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: deploymentControllerConfigSchema,
  defaultConfig: {
    label: "Deployment Controller",
    environment: "production",
    enabled: true,
    tags: ["gitops", "reconciliation"],
    componentType: "deployment-controller",
    reconciliationLoop: "gitops-pull-reconcile",
    syncIntervalSeconds: 60,
    driftDetectionStrategy: "auto-remediate",
    healthCheckStrategy: "custom-readiness-probes",
    pruneOrphanedResources: true,
  },
  ports: [
    { id: "git-manifests-in", name: "Git Manifests", type: "input", dataType: "K8s_Manifest_Bundle", capacity: 8 },
    { id: "cluster-sync-out", name: "Cluster Sync", type: "output", dataType: "K8s_Apply_Directive", capacity: 16 },
    { id: "drift-alert-out", name: "Drift Alert", type: "output", dataType: "Drift_Telemetry", capacity: 4 },
  ],
  capabilities: ["continuous-reconciliation", "drift-detection", "auto-pruning"],
  inspector: [
    {
      id: "gitops-reconciliation",
      title: "Reconciliation Engine",
      fields: [
        {
          path: "reconciliationLoop",
          label: "Reconciliation Model",
          type: "select",
          options: [
            { label: "GitOps Pull Reconcile", value: "gitops-pull-reconcile" },
            { label: "Push Triggered Webhook", value: "push-triggered-webhook" },
            { label: "Continuous Sync", value: "continuous-sync" },
            { label: "Manual Sync", value: "manual-sync" },
          ],
        },
        {
          path: "driftDetectionStrategy",
          label: "Drift Detection",
          type: "select",
          options: [
            { label: "Auto Remediate", value: "auto-remediate" },
            { label: "Alert Only", value: "alert-only" },
            { label: "Block Pipeline", value: "block-pipeline" },
            { label: "Ignore", value: "ignore" },
          ],
        },
      ],
    },
  ],
};

// 8. Infrastructure as Code Definition
export const infrastructureAsCodeDefinition: InfrastructureComponentDefinition<InfrastructureAsCodeConfig> = {
  id: "infrastructure-as-code",
  version: 1,
  categoryId: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  display: {
    name: "Infrastructure as Code",
    shortName: "IaC Engine",
    description: "Declarative infrastructure automation engine provisioning cloud topology, VPCs, databases, and policies via versioned state.",
    keywords: ["iac", "terraform", "opentofu", "pulumi", "provisioning", "state"],
    iconSlug: "infrastructure-as-code",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: infrastructureAsCodeConfigSchema,
  defaultConfig: {
    label: "Infrastructure as Code",
    environment: "production",
    enabled: true,
    tags: ["iac", "provisioning"],
    componentType: "infrastructure-as-code",
    iacFramework: "terraform-opentofu",
    stateStorageBackend: "s3-dynamodb-locking",
    driftDetectionIntervalHours: 24,
    policyAsCodeValidation: "opa-rego-strict",
    autoApply: false,
  },
  ports: [
    { id: "hcl-code-in", name: "IaC Code In", type: "input", dataType: "HCL_Code_Module", capacity: 8 },
    { id: "cloud-provision-out", name: "Cloud API Calls", type: "output", dataType: "Cloud_Resource_API", capacity: 32 },
    { id: "state-sync-out", name: "State Backend", type: "output", dataType: "Statefile_Snapshot", capacity: 4 },
  ],
  capabilities: ["declarative-state", "plan-execution", "policy-as-code"],
  inspector: [
    {
      id: "iac-framework",
      title: "IaC Orchestration",
      fields: [
        {
          path: "iacFramework",
          label: "IaC Framework",
          type: "select",
          options: [
            { label: "Terraform / OpenTofu", value: "terraform-opentofu" },
            { label: "Pulumi (TS/Python)", value: "pulumi-ts" },
            { label: "AWS CDK", value: "aws-cdk" },
            { label: "Kubernetes CRDs", value: "kubernetes-crds" },
            { label: "Ansible Playbook", value: "ansible-playbook" },
          ],
        },
        {
          path: "policyAsCodeValidation",
          label: "Policy as Code",
          type: "select",
          options: [
            { label: "OPA Rego (Strict)", value: "opa-rego-strict" },
            { label: "Checkov Security", value: "checkov-security" },
            { label: "Sentinel Enterprise", value: "sentinel-enterprise" },
            { label: "Disabled", value: "disabled" },
          ],
        },
      ],
    },
  ],
};

// 9. Feature Flag Service Definition
export const featureFlagServiceDefinition: InfrastructureComponentDefinition<FeatureFlagServiceConfig> = {
  id: "feature-flag-service",
  version: 1,
  categoryId: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  display: {
    name: "Feature Flag Service",
    shortName: "Flags Service",
    description: "Dynamic feature toggling and experimentation service enabling progressive percentage rollouts, user targeting, and emergency kill switches.",
    keywords: ["feature-flags", "toggles", "canary", "rollout", "kill-switch", "launchdarkly", "experimentation"],
    iconSlug: "feature-flag-service",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: featureFlagServiceConfigSchema,
  defaultConfig: {
    label: "Feature Flag Service",
    environment: "production",
    enabled: true,
    tags: ["flags", "experimentation"],
    componentType: "feature-flag-service",
    evaluationModel: "server-side-evaluated",
    rolloutStrategy: "percentage-canary",
    auditLoggingEnabled: true,
    cacheTtlMilliseconds: 5000,
    activeFlagsCount: 50,
  },
  ports: [
    { id: "flag-admin-in", name: "Flag Config", type: "input", dataType: "Flag_Rule_Mutation", capacity: 8 },
    { id: "app-eval-out", name: "Evaluations", type: "output", dataType: "Flag_Evaluation_Result", capacity: 32 },
  ],
  capabilities: ["dynamic-toggles", "percentage-rollout", "kill-switch-guard"],
  inspector: [
    {
      id: "flags-settings",
      title: "Feature Flag Configuration",
      fields: [
        {
          path: "evaluationModel",
          label: "Evaluation Model",
          type: "select",
          options: [
            { label: "Server-Side Evaluated", value: "server-side-evaluated" },
            { label: "Client-Side Cached", value: "client-side-cached" },
            { label: "Edge Worker Evaluated", value: "edge-worker-evaluated" },
            { label: "Hybrid Streaming", value: "hybrid-streaming" },
          ],
        },
        {
          path: "rolloutStrategy",
          label: "Rollout Strategy",
          type: "select",
          options: [
            { label: "Percentage Canary", value: "percentage-canary" },
            { label: "User Attribute Targeting", value: "user-attribute-targeting" },
            { label: "Ring Deployment", value: "ring-deployment" },
            { label: "Boolean Kill Switch", value: "boolean-kill-switch" },
          ],
        },
      ],
    },
  ],
};

// 10. Configuration Service Definition
export const configurationServiceDefinition: InfrastructureComponentDefinition<ConfigurationServiceConfig> = {
  id: "configuration-service",
  version: 1,
  categoryId: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  display: {
    name: "Configuration Service",
    shortName: "Config Service",
    description: "Centralized configuration registry providing validated hierarchical parameters, environment overrides, and dynamic live hot-reloading.",
    keywords: ["configuration", "config", "parameters", "environment", "hot-reload", "consul", "etcd"],
    iconSlug: "configuration-service",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: configurationServiceConfigSchema,
  defaultConfig: {
    label: "Configuration Service",
    environment: "production",
    enabled: true,
    tags: ["configuration", "parameters"],
    componentType: "configuration-service",
    storageBackend: "distributed-etcd",
    deliveryProtocol: "grpc-streaming-push",
    schemaValidationEnforced: true,
    dynamicReloadSupported: true,
    pollIntervalSeconds: 15,
  },
  ports: [
    { id: "config-write-in", name: "Config Update", type: "input", dataType: "Config_Key_Value", capacity: 8 },
    { id: "config-stream-out", name: "Config Stream", type: "output", dataType: "Live_Config_Snapshot", capacity: 32 },
  ],
  capabilities: ["hot-reload", "schema-validation", "hierarchical-overrides"],
  inspector: [
    {
      id: "config-settings",
      title: "Config Delivery",
      fields: [
        {
          path: "storageBackend",
          label: "Storage Backend",
          type: "select",
          options: [
            { label: "Distributed etcd", value: "distributed-etcd" },
            { label: "Git-Backed Store", value: "git-backed-store" },
            { label: "Consul KV Tree", value: "consul-kv-tree" },
            { label: "Cloud AppConfig", value: "cloud-app-config" },
          ],
        },
        { path: "dynamicReloadSupported", label: "Live Hot Reloading", type: "boolean" },
      ],
    },
  ],
};

// 11. Secrets Injection Service Definition
export const secretsInjectionServiceDefinition: InfrastructureComponentDefinition<SecretsInjectionServiceConfig> = {
  id: "secrets-injection-service",
  version: 1,
  categoryId: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  display: {
    name: "Secrets Injection Service",
    shortName: "Secrets Inject",
    description: "Ephemeral runtime secrets delivery system injecting short-lived credentials into workload memory via CSI drivers without disk persistence.",
    keywords: ["secrets", "injection", "csi-driver", "vault", "sidecar", "ephemeral-credentials"],
    iconSlug: "secrets-injection-service",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: secretsInjectionServiceConfigSchema,
  defaultConfig: {
    label: "Secrets Injection Service",
    environment: "production",
    enabled: true,
    tags: ["secrets", "security", "credentials"],
    componentType: "secrets-injection-service",
    injectionMechanism: "csi-driver-mount",
    secretLeaseRotationHours: 24,
    encryptionTransitStandard: "tls-1-3-aes-gcm",
    zeroDiskPersistence: true,
    auditAccessLog: true,
  },
  ports: [
    { id: "vault-sync-in", name: "Vault In", type: "input", dataType: "Vault_Lease_Token", capacity: 4 },
    { id: "workload-inject-out", name: "RAM Inject", type: "output", dataType: "In_Memory_Secret_Mount", capacity: 32 },
  ],
  capabilities: ["zero-disk-persistence", "short-lived-leases", "audit-traceability"],
  inspector: [
    {
      id: "secrets-injection",
      title: "Secrets Delivery",
      fields: [
        {
          path: "injectionMechanism",
          label: "Injection Mechanism",
          type: "select",
          options: [
            { label: "CSI Driver Mount (RAM)", value: "csi-driver-mount" },
            { label: "Sidecar Agent Volume", value: "sidecar-agent-volume" },
            { label: "Init Container Env", value: "init-container-env" },
            { label: "Ephemeral Env Variable", value: "ephemeral-env-variable" },
          ],
        },
        { path: "secretLeaseRotationHours", label: "Lease Rotation (Hours)", type: "number" },
      ],
    },
  ],
};

// 12. Release Manager Definition
export const releaseManagerDefinition: InfrastructureComponentDefinition<ReleaseManagerConfig> = {
  id: "release-manager",
  version: 1,
  categoryId: DEVOPS_AND_DEPLOYMENT_CATEGORY_ID,
  display: {
    name: "Release Manager",
    shortName: "Release Mgr",
    description: "Release coordination coordinator managing SemVer promotions, change-freeze schedules, database migrations, and release trains.",
    keywords: ["release", "semver", "promotion", "changelog", "freeze-window", "orchestrator"],
    iconSlug: "release-manager",
  },
  node: { variant: "compact", minWidth: 180, minHeight: 88 },
  configSchema: releaseManagerConfigSchema,
  defaultConfig: {
    label: "Release Manager",
    environment: "production",
    enabled: true,
    tags: ["release", "governance"],
    componentType: "release-manager",
    versioningScheme: "semver-strict",
    promotionPolicy: "dev-stage-prod-gate",
    changelogGeneration: "conventional-commits-auto",
    freezeWindowEnforced: false,
    maximumReleaseWindowMinutes: 60,
  },
  ports: [
    { id: "release-candidate-in", name: "Candidate In", type: "input", dataType: "Release_Candidate_Package", capacity: 8 },
    { id: "approved-release-out", name: "Promote Out", type: "output", dataType: "Promoted_Release_Tag", capacity: 8 },
  ],
  capabilities: ["version-promotion", "release-train", "change-freeze-governance"],
  inspector: [
    {
      id: "release-governance",
      title: "Release Policy",
      fields: [
        {
          path: "versioningScheme",
          label: "Versioning Scheme",
          type: "select",
          options: [
            { label: "Strict SemVer (vX.Y.Z)", value: "semver-strict" },
            { label: "Calendar Versioning (CalVer)", value: "calver-date" },
            { label: "Git Commit SHA", value: "git-commit-sha" },
            { label: "Monotonic Build Counter", value: "monotonic-build-counter" },
          ],
        },
        { path: "freezeWindowEnforced", label: "Enforce Release Freeze", type: "boolean" },
      ],
    },
  ],
};

export const ALL_DEVOPS_AND_DEPLOYMENT_DEFINITIONS: InfrastructureComponentDefinition<any>[] = [
  gitRepositoryDefinition,
  ciPipelineDefinition,
  cdPipelineDefinition,
  buildServerDefinition,
  artifactRegistryDefinition,
  containerRegistryDefinition,
  deploymentControllerDefinition,
  infrastructureAsCodeDefinition,
  featureFlagServiceDefinition,
  configurationServiceDefinition,
  secretsInjectionServiceDefinition,
  releaseManagerDefinition,
];
