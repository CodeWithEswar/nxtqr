import { z } from "zod";

export const SchedulingPolicySchema = z.enum([
  "balanced_allocation",
  "most_available",
  "bin_pack",
]);
export type SchedulingPolicy = z.infer<typeof SchedulingPolicySchema>;

export const TaintEffectSchema = z.enum(["NoSchedule", "PreferNoSchedule", "NoExecute"]);
export type TaintEffect = z.infer<typeof TaintEffectSchema>;

export const NodeTaintSchema = z.object({
  key: z.string().min(1),
  value: z.string().default(""),
  effect: TaintEffectSchema,
});
export type NodeTaint = z.infer<typeof NodeTaintSchema>;

export const TolerationSchema = z.object({
  key: z.string().min(1),
  operator: z.enum(["Equal", "Exists"]).default("Equal"),
  value: z.string().optional(),
  effect: TaintEffectSchema.optional(),
});
export type Toleration = z.infer<typeof TolerationSchema>;

export const NodeAffinityTermSchema = z.object({
  key: z.string().min(1),
  operator: z.enum(["In", "NotIn", "Exists"]),
  values: z.array(z.string()).default([]),
});
export type NodeAffinityTerm = z.infer<typeof NodeAffinityTermSchema>;

export const ClusterNodeStatusSchema = z.enum(["ready", "not_ready", "unavailable"]);
export type ClusterNodeStatus = z.infer<typeof ClusterNodeStatusSchema>;

export const ClusterNodeSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  cpuMillicores: z.number().int().positive(),
  memoryMiB: z.number().int().positive(),
  allocatableCpuMillicores: z.number().int().positive().optional(),
  allocatableMemoryMiB: z.number().int().positive().optional(),
  reservedCpuMillicores: z.number().int().min(0).default(0),
  reservedMemoryMiB: z.number().int().min(0).default(0),
  maxPods: z.number().int().positive().default(110),
  zone: z.string().default("zone-a"),
  labels: z.record(z.string()).default({}),
  taints: z.array(NodeTaintSchema).default([]),
  status: ClusterNodeStatusSchema.default("ready"),
  conditions: z
    .object({
      memoryPressure: z.boolean().default(false),
      diskPressure: z.boolean().default(false),
      networkUnavailable: z.boolean().default(false),
    })
    .default({}),
  scheduledPodIds: z.array(z.string()).default([]),
});
export type ClusterNode = z.infer<typeof ClusterNodeSchema>;

export const ResourceRequirementsSchema = z.object({
  cpuMillicores: z.number().int().min(1),
  memoryMiB: z.number().int().min(1),
});
export type ResourceRequirements = z.infer<typeof ResourceRequirementsSchema>;

export const ProbeBehaviorSchema = z.enum([
  "always_pass",
  "always_fail",
  "fail_first_n",
  "fail_after_n",
  "intermittent",
]);
export type ProbeBehavior = z.infer<typeof ProbeBehaviorSchema>;

export const ProbeConfigSchema = z.object({
  enabled: z.boolean().default(true),
  initialDelayMs: z.number().int().min(0).default(100),
  periodMs: z.number().int().positive().default(200),
  timeoutMs: z.number().int().positive().default(100),
  successThreshold: z.number().int().positive().default(1),
  failureThreshold: z.number().int().positive().default(3),
  modeledBehavior: ProbeBehaviorSchema.default("always_pass"),
  failCountTarget: z.number().int().min(0).default(0),
});
export type ProbeConfig = z.infer<typeof ProbeConfigSchema>;

export const PodTemplateSchema = z.object({
  revision: z.number().int().positive().default(1),
  image: z.string().min(1).default("nxtqr/api-service:v1.0.0"),
  cpuRequestMillicores: z.number().int().positive().default(250),
  memoryRequestMiB: z.number().int().positive().default(256),
  cpuLimitMillicores: z.number().int().positive().default(500),
  memoryLimitMiB: z.number().int().positive().default(512),
  startupDelayMs: z.number().int().min(10).default(150),
  modeledCpuUsageMillicores: z.number().int().min(0).default(120),
  modeledMemoryUsageMiB: z.number().int().min(0).default(180),
  nodeSelector: z.record(z.string()).default({}),
  requiredNodeAffinity: z.array(NodeAffinityTermSchema).default([]),
  preferredNodeAffinity: z.array(NodeAffinityTermSchema).default([]),
  tolerations: z.array(TolerationSchema).default([]),
  podAntiAffinityKey: z.string().optional(),
  topologySpreadKey: z.string().optional(),
  startupProbe: ProbeConfigSchema.default({ enabled: false }),
  readinessProbe: ProbeConfigSchema.default({ enabled: true }),
  livenessProbe: ProbeConfigSchema.default({ enabled: true }),
  restartPolicy: z.enum(["Always", "OnFailure", "Never"]).default("Always"),
});
export type PodTemplate = z.infer<typeof PodTemplateSchema>;

export const RollingUpdateStrategySchema = z.object({
  type: z.enum(["RollingUpdate", "Recreate"]).default("RollingUpdate"),
  maxSurge: z.union([z.number().int().min(0), z.string()]).default(1),
  maxUnavailable: z.union([z.number().int().min(0), z.string()]).default(0),
  progressDeadlineMs: z.number().int().positive().default(5000),
});
export type RollingUpdateStrategy = z.infer<typeof RollingUpdateStrategySchema>;

export const KubernetesHpaPolicySchema = z.object({
  enabled: z.boolean().default(false),
  minReplicas: z.number().int().min(1).default(1),
  maxReplicas: z.number().int().min(1).default(10),
  targetCpuUtilizationPct: z.number().int().min(10).max(200).default(70),
  evaluationIntervalMs: z.number().int().positive().default(500),
  stabilizationWindowMs: z.number().int().min(0).default(1500),
});
export type KubernetesHpaPolicy = z.infer<typeof KubernetesHpaPolicySchema>;

export const DeploymentConfigurationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  namespace: z.string().default("default"),
  desiredReplicas: z.number().int().min(0).default(1),
  labels: z.record(z.string()).default({}),
  template: PodTemplateSchema,
  strategy: RollingUpdateStrategySchema.default({}),
  updateToRevision: z
    .object({
      atMs: z.number().int().min(0),
      newTemplate: PodTemplateSchema,
    })
    .optional(),
  rollbackToRevision: z
    .object({
      atMs: z.number().int().min(0),
      targetRevision: z.number().int().positive(),
    })
    .optional(),
  scaleReplicasAtMs: z
    .object({
      atMs: z.number().int().min(0),
      newReplicas: z.number().int().min(0),
    })
    .optional(),
  hpa: KubernetesHpaPolicySchema.optional(),
});
export type DeploymentConfiguration = z.infer<typeof DeploymentConfigurationSchema>;

export const ServiceConfigurationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(["ClusterIP", "NodePort", "LoadBalancer"]).default("ClusterIP"),
  virtualIp: z.string().default("10.96.0.10"),
  nodePort: z.number().int().min(30000).max(32767).optional(),
  selector: z.record(z.string()),
  dnsResolutionDelayMs: z.number().int().min(0).default(15),
});
export type ServiceConfiguration = z.infer<typeof ServiceConfigurationSchema>;

export const ClusterConfigurationSchema = z.object({
  clusterId: z.string().min(1),
  name: z.string().min(1),
  schedulingPolicy: SchedulingPolicySchema.default("balanced_allocation"),
  controllerSyncIntervalMs: z.number().int().positive().default(200),
  nodeFailureDetectionMs: z.number().int().min(0).default(400),
  evictionGracePeriodMs: z.number().int().min(0).default(150),
});
export type ClusterConfiguration = z.infer<typeof ClusterConfigurationSchema>;

export const InjectedClusterFaultSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "pod_crash",
    "node_not_ready",
    "node_unavailable",
    "node_memory_pressure",
    "node_taint_no_execute",
    "oom_spike",
  ]),
  targetId: z.string().min(1),
  atMs: z.number().int().min(0),
  recoveryAtMs: z.number().int().min(0).optional(),
  description: z.string().default(""),
});
export type InjectedClusterFault = z.infer<typeof InjectedClusterFaultSchema>;

export const TrafficLoadStepSchema = z.object({
  atMs: z.number().int().min(0),
  requestsPerSec: z.number().min(0),
  cpuPerRequestMillicores: z.number().min(0),
});
export type TrafficLoadStep = z.infer<typeof TrafficLoadStepSchema>;

export const KubernetesScenarioSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  architectureRevisionId: z.string().min(1).default("rev-1"),
  presetId: z.string().optional(),
  cluster: ClusterConfigurationSchema,
  nodes: z.array(ClusterNodeSchema).min(1),
  deployments: z.array(DeploymentConfigurationSchema),
  services: z.array(ServiceConfigurationSchema).default([]),
  faults: z.array(InjectedClusterFaultSchema).default([]),
  trafficProfile: z.array(TrafficLoadStepSchema).default([]),
  limits: z.object({
    maxPods: z.number().int().positive().default(200),
    maxEvents: z.number().int().positive().default(1200),
    maxVirtualDurationMs: z.number().int().positive().default(10000),
  }),
});
export type KubernetesScenario = z.infer<typeof KubernetesScenarioSchema>;

// Runtime Types

export interface SchedulerDecision {
  podId: string;
  podName: string;
  atMs: number;
  eligibleNodeIds: string[];
  rejectedNodes: Array<{
    nodeId: string;
    nodeName: string;
    reasons: string[];
  }>;
  scoredNodes: Array<{
    nodeId: string;
    nodeName: string;
    score: number;
    reason: string;
  }>;
  selectedNodeId?: string;
  selectedNodeName?: string;
  explanation: string;
}

export interface ContainerRuntimeState {
  id: string;
  name: string;
  image: string;
  state: "waiting" | "running" | "terminated";
  startedAtMs?: number;
  terminatedAtMs?: number;
  terminationReason?:
    | "Completed"
    | "Error"
    | "OOMKilled"
    | "LivenessProbeFailed"
    | "Evicted"
    | "NodeLost"
    | "RolloutReplaced";
  exitCode?: number;
  restartCount: number;
  inCrashLoopBackOff: boolean;
  nextRestartAtMs?: number;
  cpuThrottled: boolean;
}

export interface ProbeRuntimeState {
  startupPassed: boolean;
  startupAttempts: number;
  startupSuccessStreak: number;
  startupFailureStreak: number;
  readinessAttempts: number;
  readinessSuccessStreak: number;
  readinessFailureStreak: number;
  livenessAttempts: number;
  livenessFailureStreak: number;
}

export type PodPhase = "Pending" | "Running" | "Succeeded" | "Failed" | "Unknown";

export interface Pod {
  id: string;
  name: string;
  namespace: string;
  labels: Record<string, string>;
  ownerDeploymentId?: string;
  ownerReplicaSetId?: string;
  revision: number;
  assignedNodeId?: string;
  phase: PodPhase;
  ready: boolean;
  deletionTimestampMs?: number;
  evictionReason?: string;
  schedulerDecision?: SchedulerDecision;
  container: ContainerRuntimeState;
  probeState: ProbeRuntimeState;
  requests: ResourceRequirements;
  limits: ResourceRequirements;
  template: PodTemplate;
  createdAtMs: number;
  scheduledAtMs?: number;
  readyAtMs?: number;
  lastReconciledAtMs: number;
}

export interface ReplicaSet {
  id: string;
  deploymentId: string;
  revision: number;
  desiredReplicas: number;
  currentReplicas: number;
  readyReplicas: number;
  podIds: string[];
  template: PodTemplate;
  createdAtMs: number;
}

export interface DeploymentStatus {
  id: string;
  name: string;
  namespace: string;
  desiredReplicas: number;
  currentReplicas: number;
  readyReplicas: number;
  availableReplicas: number;
  updatedReplicas: number;
  currentRevision: number;
  activeReplicaSetIds: string[];
  rolloutState: "stable" | "progressing" | "paused" | "failed" | "rolled_back";
  rolloutFailureReason?: string;
  rolloutStartedAtMs?: number;
  rolloutCompletedAtMs?: number;
}

export interface ServiceRuntimeState {
  id: string;
  name: string;
  type: "ClusterIP" | "NodePort" | "LoadBalancer";
  virtualIp: string;
  nodePort?: number;
  dnsResolutionDelayMs: number;
  selector: Record<string, string>;
  eligibleEndpointPodIds: string[];
  nonReadyPodIds: string[];
  routedRequestCount: number;
  failedNoEndpointCount: number;
  roundRobinCursor: number;
}

export interface HpaRuntimeState {
  deploymentId: string;
  enabled: boolean;
  currentReplicas: number;
  desiredReplicas: number;
  recommendedReplicas: number;
  observedCpuUtilizationPct: number;
  targetCpuUtilizationPct: number;
  minReplicas: number;
  maxReplicas: number;
  lastScaleAtMs?: number;
  stabilizationActive: boolean;
  lastDecisionReason: string;
}

export interface ClusterMetrics {
  desiredReplicas: number;
  currentReplicas: number;
  readyReplicas: number;
  availableReplicas: number;
  pendingPods: number;
  failedPods: number;
  evictedPods: number;
  totalRestartCount: number;
  cpuCapacityMillicores: number;
  cpuRequestedMillicores: number;
  memoryCapacityMiB: number;
  memoryRequestedMiB: number;
  nodeUtilizationPct: number;
  serviceEndpointCount: number;
  schedulingFailures: number;
  routedRequests: number;
  noEndpointErrors: number;
  rolloutDurationMs?: number;
  recoveryDurationMs?: number;
}

export interface RolloutHistoryEntry {
  revision: number;
  atMs: number;
  action: "initial" | "rollout" | "rollback" | "rollout_failed";
  image: string;
  summary: string;
}

export interface ModeledKubernetesRuntimeState {
  cluster: ClusterConfiguration;
  nodes: Record<string, ClusterNode>;
  pods: Record<string, Pod>;
  deployments: Record<string, DeploymentStatus>;
  replicaSets: Record<string, ReplicaSet>;
  services: Record<string, ServiceRuntimeState>;
  hpas: Record<string, HpaRuntimeState>;
  recentDecisions: SchedulerDecision[];
  rolloutHistory: Record<string, RolloutHistoryEntry[]>;
  metrics: ClusterMetrics;
  virtualTimeMs: number;
}
