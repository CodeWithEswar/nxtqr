import type { KubernetesScenario, PodTemplate } from "./kubernetes-schemas";

export type KubernetesScenarioPresetId =
  | "basic_pod_scheduling"
  | "insufficient_cpu"
  | "insufficient_memory"
  | "node_selector_mismatch"
  | "taint_without_toleration"
  | "pod_anti_affinity"
  | "deployment_reconciliation"
  | "readiness_failure"
  | "liveness_restart"
  | "crash_loop_backoff"
  | "oom_killed"
  | "service_no_endpoints"
  | "hpa_scale_out"
  | "hpa_scale_in"
  | "rolling_update"
  | "failed_rollout"
  | "deployment_rollback"
  | "pod_failure_recovery"
  | "node_failure_recovery"
  | "resource_pressure_eviction";

export interface KubernetesPresetMetadata {
  id: KubernetesScenarioPresetId;
  label: string;
  category:
    | "Scheduling & Placement"
    | "Probes & Restarts"
    | "Scaling & Reconciliation"
    | "Rollouts & Services"
    | "Failures & Eviction";
  description: string;
}

export const KUBERNETES_PRESET_METADATA: KubernetesPresetMetadata[] = [
  {
    id: "basic_pod_scheduling",
    label: "Basic Pod Scheduling",
    category: "Scheduling & Placement",
    description: "Scheduler filters 2 nodes, scores balanced capacity, binds Pod, and updates Service endpoints.",
  },
  {
    id: "insufficient_cpu",
    label: "Insufficient CPU (Pending)",
    category: "Scheduling & Placement",
    description: "Pod requests more CPU millicores than any cluster node has allocatable; remains Pending.",
  },
  {
    id: "insufficient_memory",
    label: "Insufficient Memory (Pending)",
    category: "Scheduling & Placement",
    description: "Pod requests 8192 MiB RAM on 4096 MiB nodes; Scheduler rejects all candidates with clear reasons.",
  },
  {
    id: "node_selector_mismatch",
    label: "Node Selector Mismatch",
    category: "Scheduling & Placement",
    description: "Pod requires gpu=true label not present on standard compute nodes; stays Pending.",
  },
  {
    id: "taint_without_toleration",
    label: "Taint Without Toleration",
    category: "Scheduling & Placement",
    description: "Node B carries dedicated=gpu:NoSchedule taint; Pod schedules onto untainted Node A only.",
  },
  {
    id: "pod_anti_affinity",
    label: "Pod Anti-Affinity Spread",
    category: "Scheduling & Placement",
    description: "3 replicas with PodAntiAffinity across 2 nodes: 2 place cleanly, 3rd remains Pending.",
  },
  {
    id: "deployment_reconciliation",
    label: "Deployment Reconciliation & Scale",
    category: "Scaling & Reconciliation",
    description: "Starts at 2 replicas, scales to 4 via desired-state reconciliation loop.",
  },
  {
    id: "readiness_failure",
    label: "Readiness Probe Exclusion",
    category: "Probes & Restarts",
    description: "Container runs normally, fails initial readiness checks (excluded from Service), then recovers.",
  },
  {
    id: "liveness_restart",
    label: "Liveness Probe Restart",
    category: "Probes & Restarts",
    description: "Repeated liveness probe failures hit failureThreshold=3 and restart the container cleanly.",
  },
  {
    id: "crash_loop_backoff",
    label: "CrashLoopBackOff",
    category: "Probes & Restarts",
    description: "Broken container crashes repeatedly, triggering exponential restart delays and CrashLoopBackOff state.",
  },
  {
    id: "oom_killed",
    label: "OOMKilled Memory Limit Violation",
    category: "Probes & Restarts",
    description: "Memory spike exceeds 512 MiB limit, terminating container with OOMKilled (Exit 137).",
  },
  {
    id: "service_no_endpoints",
    label: "Service Without Ready Endpoints",
    category: "Rollouts & Services",
    description: "All backend Pods fail readiness probes; Service reports 0 eligible endpoints and rejects routed requests.",
  },
  {
    id: "hpa_scale_out",
    label: "HPA Scale-Out Under Load",
    category: "Scaling & Reconciliation",
    description: "Traffic surge drives CPU above 70% target; HPA scales Deployment from 2 to 4 replicas with scheduling delay.",
  },
  {
    id: "hpa_scale_in",
    label: "HPA Scale-In & Stabilization",
    category: "Scaling & Reconciliation",
    description: "Traffic drops; HPA respects stabilization window before safely scaling excess Pods down.",
  },
  {
    id: "rolling_update",
    label: "Zero-Downtime Rolling Update",
    category: "Rollouts & Services",
    description: "v1 -> v2 rollout with maxSurge=1, maxUnavailable=0; waits for new Pods to be Ready before terminating old Pods.",
  },
  {
    id: "failed_rollout",
    label: "Failed Rollout (Deadline / Bad Image)",
    category: "Rollouts & Services",
    description: "v2 Pods fail readiness probes; Deployment protects v1 availability and marks rollout Failed.",
  },
  {
    id: "deployment_rollback",
    label: "Deployment Revision Rollback",
    category: "Rollouts & Services",
    description: "Rolling update stalls on unhealthy v2, triggering automatic/explicit Rollback back to revision 1.",
  },
  {
    id: "pod_failure_recovery",
    label: "Pod Failure & Controller Recovery",
    category: "Failures & Eviction",
    description: "Healthy Pod crashes mid-run; ReplicaSet controller detects deficit and schedules a fresh replacement Pod.",
  },
  {
    id: "node_failure_recovery",
    label: "Node Failure & Rescheduling",
    category: "Failures & Eviction",
    description: "Worker Node A fails; controller detects node loss and schedules replacement Pods onto healthy nodes.",
  },
  {
    id: "resource_pressure_eviction",
    label: "Memory Pressure & NoExecute Eviction",
    category: "Failures & Eviction",
    description: "Node experiences MemoryPressure/NoExecute taint; Pods are evicted cleanly and rescheduled.",
  },
];

function createDefaultTemplate(overrides: Partial<PodTemplate> = {}): PodTemplate {
  return {
    revision: 1,
    image: "nxtqr/api-service:v1.0.0",
    cpuRequestMillicores: 250,
    memoryRequestMiB: 256,
    cpuLimitMillicores: 500,
    memoryLimitMiB: 512,
    startupDelayMs: 120,
    modeledCpuUsageMillicores: 100,
    modeledMemoryUsageMiB: 180,
    nodeSelector: {},
    requiredNodeAffinity: [],
    preferredNodeAffinity: [],
    tolerations: [],
    startupProbe: {
      enabled: false,
      initialDelayMs: 50,
      periodMs: 150,
      timeoutMs: 80,
      successThreshold: 1,
      failureThreshold: 3,
      modeledBehavior: "always_pass",
      failCountTarget: 0,
    },
    readinessProbe: {
      enabled: true,
      initialDelayMs: 100,
      periodMs: 200,
      timeoutMs: 80,
      successThreshold: 1,
      failureThreshold: 3,
      modeledBehavior: "always_pass",
      failCountTarget: 0,
    },
    livenessProbe: {
      enabled: true,
      initialDelayMs: 150,
      periodMs: 250,
      timeoutMs: 80,
      successThreshold: 1,
      failureThreshold: 3,
      modeledBehavior: "always_pass",
      failCountTarget: 0,
    },
    restartPolicy: "Always",
    ...overrides,
  };
}

export function createKubernetesPresetScenario(
  presetId: KubernetesScenarioPresetId
): KubernetesScenario {
  const baseNodes = [
    {
      id: "node-a",
      name: "worker-node-a",
      cpuMillicores: 2000,
      memoryMiB: 4096,
      allocatableCpuMillicores: 1800,
      allocatableMemoryMiB: 3584,
      reservedCpuMillicores: 0,
      reservedMemoryMiB: 0,
      maxPods: 20,
      zone: "us-east-1a",
      labels: { "kubernetes.io/hostname": "worker-node-a", tier: "compute", zone: "us-east-1a" },
      taints: [],
      status: "ready" as const,
      conditions: { memoryPressure: false, diskPressure: false, networkUnavailable: false },
      scheduledPodIds: [],
    },
    {
      id: "node-b",
      name: "worker-node-b",
      cpuMillicores: 2000,
      memoryMiB: 4096,
      allocatableCpuMillicores: 1800,
      allocatableMemoryMiB: 3584,
      reservedCpuMillicores: 0,
      reservedMemoryMiB: 0,
      maxPods: 20,
      zone: "us-east-1b",
      labels: { "kubernetes.io/hostname": "worker-node-b", tier: "compute", zone: "us-east-1b" },
      taints: [],
      status: "ready" as const,
      conditions: { memoryPressure: false, diskPressure: false, networkUnavailable: false },
      scheduledPodIds: [],
    },
  ];

  const baseService = {
    id: "svc-api",
    name: "api-gateway-svc",
    type: "ClusterIP" as const,
    virtualIp: "10.96.42.10",
    selector: { app: "api-service" },
    dnsResolutionDelayMs: 15,
  };

  const baseCluster = {
    clusterId: "cluster-nxtqr-sim",
    name: "nxtqr-prod-sim",
    schedulingPolicy: "balanced_allocation" as const,
    controllerSyncIntervalMs: 200,
    nodeFailureDetectionMs: 400,
    evictionGracePeriodMs: 150,
  };

  const baseLimits = {
    maxPods: 100,
    maxEvents: 1000,
    maxVirtualDurationMs: 4500,
  };

  switch (presetId) {
    case "basic_pod_scheduling":
      return {
        version: 1,
        id: "k8s-basic-scheduling",
        name: "Basic Pod Scheduling",
        description: "Deployment with 3 replicas scheduled across 2 balanced worker nodes.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 3,
            labels: { app: "api-service" },
            template: createDefaultTemplate({
              cpuRequestMillicores: 400,
              memoryRequestMiB: 512,
            }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [{ atMs: 600, requestsPerSec: 120, cpuPerRequestMillicores: 2 }],
        limits: baseLimits,
      };

    case "insufficient_cpu":
      return {
        version: 1,
        id: "k8s-insufficient-cpu",
        name: "Insufficient CPU",
        description: "Pod requests 2500m CPU on 1800m allocatable nodes; Scheduler rejects all candidates.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-heavy-cpu",
            name: "ml-inference",
            namespace: "default",
            desiredReplicas: 1,
            labels: { app: "api-service" },
            template: createDefaultTemplate({
              image: "nxtqr/ml-worker:v1.0.0",
              cpuRequestMillicores: 2500,
              cpuLimitMillicores: 3000,
              memoryRequestMiB: 512,
            }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [],
        limits: { ...baseLimits, maxVirtualDurationMs: 2500 },
      };

    case "insufficient_memory":
      return {
        version: 1,
        id: "k8s-insufficient-memory",
        name: "Insufficient Memory",
        description: "Pod requests 8192 MiB RAM on 3584 MiB allocatable nodes.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-heavy-mem",
            name: "in-memory-grid",
            namespace: "default",
            desiredReplicas: 1,
            labels: { app: "api-service" },
            template: createDefaultTemplate({
              memoryRequestMiB: 8192,
              memoryLimitMiB: 8192,
            }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [],
        limits: { ...baseLimits, maxVirtualDurationMs: 2500 },
      };

    case "node_selector_mismatch":
      return {
        version: 1,
        id: "k8s-node-selector-mismatch",
        name: "Node Selector Mismatch",
        description: "Deployment specifies nodeSelector { gpu: nvidia-a100 } but no nodes match.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-gpu",
            name: "cuda-runner",
            namespace: "default",
            desiredReplicas: 1,
            labels: { app: "api-service" },
            template: createDefaultTemplate({
              nodeSelector: { gpu: "nvidia-a100" },
            }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [],
        limits: { ...baseLimits, maxVirtualDurationMs: 2500 },
      };

    case "taint_without_toleration":
      return {
        version: 1,
        id: "k8s-taint-no-toleration",
        name: "Taint Without Toleration",
        description: "Node B is tainted dedicated=gpu:NoSchedule; all 2 Pods land exclusively on Node A.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: [
          baseNodes[0]!,
          {
            ...baseNodes[1]!,
            taints: [{ key: "dedicated", value: "gpu", effect: "NoSchedule" }],
          },
        ],
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 2,
            labels: { app: "api-service" },
            template: createDefaultTemplate(),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [],
        limits: { ...baseLimits, maxVirtualDurationMs: 3000 },
      };

    case "pod_anti_affinity":
      return {
        version: 1,
        id: "k8s-pod-anti-affinity",
        name: "Pod Anti-Affinity",
        description: "3 replicas enforce strict PodAntiAffinity across 2 nodes: 2 place, 3rd remains Pending.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "singleton-per-node",
            namespace: "default",
            desiredReplicas: 3,
            labels: { app: "api-service" },
            template: createDefaultTemplate({
              podAntiAffinityKey: "app",
            }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [],
        limits: { ...baseLimits, maxVirtualDurationMs: 3000 },
      };

    case "deployment_reconciliation":
      return {
        version: 1,
        id: "k8s-reconciliation",
        name: "Deployment Reconciliation",
        description: "Reconciles 2 replicas initially, then scales desiredReplicas to 4 at +1200ms.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 2,
            labels: { app: "api-service" },
            template: createDefaultTemplate(),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
            scaleReplicasAtMs: { atMs: 1200, newReplicas: 4 },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [],
        limits: baseLimits,
      };

    case "readiness_failure":
      return {
        version: 1,
        id: "k8s-readiness-failure",
        name: "Readiness Probe Failure",
        description: "Readiness probe fails first 3 checks, removing Pod from Service endpoints until recovery.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 2,
            labels: { app: "api-service" },
            template: createDefaultTemplate({
              readinessProbe: {
                enabled: true,
                initialDelayMs: 100,
                periodMs: 250,
                timeoutMs: 80,
                successThreshold: 1,
                failureThreshold: 2,
                modeledBehavior: "fail_first_n",
                failCountTarget: 3,
              },
            }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [{ atMs: 400, requestsPerSec: 60, cpuPerRequestMillicores: 2 }],
        limits: baseLimits,
      };

    case "liveness_restart":
      return {
        version: 1,
        id: "k8s-liveness-restart",
        name: "Liveness Probe Restart",
        description: "Liveness failures hit threshold=3, triggering container termination and clean restart.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 1,
            labels: { app: "api-service" },
            template: createDefaultTemplate({
              livenessProbe: {
                enabled: true,
                initialDelayMs: 100,
                periodMs: 200,
                timeoutMs: 80,
                successThreshold: 1,
                failureThreshold: 3,
                modeledBehavior: "fail_first_n",
                failCountTarget: 3,
              },
            }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [],
        limits: baseLimits,
      };

    case "crash_loop_backoff":
      return {
        version: 1,
        id: "k8s-crash-loop-backoff",
        name: "CrashLoopBackOff",
        description: "Continuous liveness failure forces repeated restarts with exponential CrashLoopBackOff.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-broken",
            name: "misconfigured-worker",
            namespace: "default",
            desiredReplicas: 1,
            labels: { app: "api-service" },
            template: createDefaultTemplate({
              image: "nxtqr/broken-app:v0.9.1",
              livenessProbe: {
                enabled: true,
                initialDelayMs: 50,
                periodMs: 150,
                timeoutMs: 50,
                successThreshold: 1,
                failureThreshold: 2,
                modeledBehavior: "always_fail",
                failCountTarget: 0,
              },
            }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [],
        limits: baseLimits,
      };

    case "oom_killed":
      return {
        version: 1,
        id: "k8s-oom-killed",
        name: "OOMKilled Limit Exceeded",
        description: "Memory spike at +800ms pushes container usage beyond 512 MiB limit, triggering Exit 137.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "memory-leaky-service",
            namespace: "default",
            desiredReplicas: 1,
            labels: { app: "api-service" },
            template: createDefaultTemplate({
              memoryRequestMiB: 256,
              memoryLimitMiB: 512,
              modeledMemoryUsageMiB: 320,
            }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [
          {
            id: "fault-oom",
            type: "oom_spike",
            targetId: "dep-api",
            atMs: 800,
            description: "Memory usage spikes to 768 MiB > 512 MiB limit.",
          },
        ],
        trafficProfile: [],
        limits: baseLimits,
      };

    case "service_no_endpoints":
      return {
        version: 1,
        id: "k8s-service-no-endpoints",
        name: "Service Without Endpoints",
        description: "All Pods fail readiness checks; Service reports 0 eligible endpoints during incoming traffic.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 2,
            labels: { app: "api-service" },
            template: createDefaultTemplate({
              readinessProbe: {
                enabled: true,
                initialDelayMs: 50,
                periodMs: 200,
                timeoutMs: 80,
                successThreshold: 1,
                failureThreshold: 2,
                modeledBehavior: "always_fail",
                failCountTarget: 0,
              },
            }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [{ atMs: 500, requestsPerSec: 100, cpuPerRequestMillicores: 2 }],
        limits: { ...baseLimits, maxVirtualDurationMs: 3000 },
      };

    case "hpa_scale_out":
      return {
        version: 1,
        id: "k8s-hpa-scale-out",
        name: "HPA Scale-Out",
        description: "Traffic surges to 1000m demand against 2x250m Pods; HPA scales from 2 to 6 replicas.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: {
          ...baseCluster,
          controllerSyncIntervalMs: 200,
        },
        nodes: [
          baseNodes[0]!,
          baseNodes[1]!,
          {
            ...baseNodes[0]!,
            id: "node-c",
            name: "worker-node-c",
            zone: "us-east-1c",
            labels: { "kubernetes.io/hostname": "worker-node-c", tier: "compute", zone: "us-east-1c" },
          },
        ],
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 2,
            labels: { app: "api-service" },
            template: createDefaultTemplate({
              cpuRequestMillicores: 250,
              cpuLimitMillicores: 500,
              startupDelayMs: 100,
            }),
            strategy: { type: "RollingUpdate", maxSurge: 2, maxUnavailable: 0, progressDeadlineMs: 5000 },
            hpa: {
              enabled: true,
              minReplicas: 2,
              maxReplicas: 6,
              targetCpuUtilizationPct: 60,
              evaluationIntervalMs: 400,
              stabilizationWindowMs: 1200,
            },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [
          { atMs: 0, requestsPerSec: 50, cpuPerRequestMillicores: 3 },
          { atMs: 700, requestsPerSec: 320, cpuPerRequestMillicores: 3 },
        ],
        limits: baseLimits,
      };

    case "hpa_scale_in":
      return {
        version: 1,
        id: "k8s-hpa-scale-in",
        name: "HPA Scale-In & Stabilization",
        description: "High initial load tapers down at +600ms; HPA waits through stabilization before scaling in.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 4,
            labels: { app: "api-service" },
            template: createDefaultTemplate({
              cpuRequestMillicores: 250,
              startupDelayMs: 80,
            }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
            hpa: {
              enabled: true,
              minReplicas: 2,
              maxReplicas: 6,
              targetCpuUtilizationPct: 70,
              evaluationIntervalMs: 400,
              stabilizationWindowMs: 1000,
            },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [
          { atMs: 0, requestsPerSec: 250, cpuPerRequestMillicores: 2.5 },
          { atMs: 600, requestsPerSec: 40, cpuPerRequestMillicores: 2 },
        ],
        limits: baseLimits,
      };

    case "rolling_update":
      return {
        version: 1,
        id: "k8s-rolling-update",
        name: "Rolling Update (v1 -> v2)",
        description: "3 replicas roll forward with maxSurge=1, maxUnavailable=0 preserving 100% readiness.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 3,
            labels: { app: "api-service" },
            template: createDefaultTemplate({ revision: 1, image: "nxtqr/api-service:v1.0.0" }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
            updateToRevision: {
              atMs: 800,
              newTemplate: createDefaultTemplate({ revision: 2, image: "nxtqr/api-service:v2.0.0" }),
            },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [{ atMs: 500, requestsPerSec: 120, cpuPerRequestMillicores: 2 }],
        limits: baseLimits,
      };

    case "failed_rollout":
      return {
        version: 1,
        id: "k8s-failed-rollout",
        name: "Failed Rollout (Deadline Exceeded)",
        description: "v2 fails readiness probe cleanly; maxUnavailable=0 keeps all 3 v1 Pods serving traffic.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 3,
            labels: { app: "api-service" },
            template: createDefaultTemplate({ revision: 1, image: "nxtqr/api-service:v1.0.0" }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 1200 },
            updateToRevision: {
              atMs: 800,
              newTemplate: createDefaultTemplate({
                revision: 2,
                image: "nxtqr/api-service:v2.0.0-broken",
                readinessProbe: {
                  enabled: true,
                  initialDelayMs: 100,
                  periodMs: 200,
                  timeoutMs: 80,
                  successThreshold: 1,
                  failureThreshold: 2,
                  modeledBehavior: "always_fail",
                  failCountTarget: 0,
                },
              }),
            },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [],
        limits: baseLimits,
      };

    case "deployment_rollback":
      return {
        version: 1,
        id: "k8s-deployment-rollback",
        name: "Deployment Rollback",
        description: "Rolls out broken v2 at +700ms, detects failure, and rolls back to stable v1 at +2200ms.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 2,
            labels: { app: "api-service" },
            template: createDefaultTemplate({ revision: 1, image: "nxtqr/api-service:v1.0.0" }),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 1000 },
            updateToRevision: {
              atMs: 700,
              newTemplate: createDefaultTemplate({
                revision: 2,
                image: "nxtqr/api-service:v2.0.0-bad",
                readinessProbe: {
                  enabled: true,
                  initialDelayMs: 80,
                  periodMs: 150,
                  timeoutMs: 50,
                  successThreshold: 1,
                  failureThreshold: 2,
                  modeledBehavior: "always_fail",
                  failCountTarget: 0,
                },
              }),
            },
            rollbackToRevision: {
              atMs: 2200,
              targetRevision: 1,
            },
          },
        ],
        services: [baseService],
        faults: [],
        trafficProfile: [],
        limits: baseLimits,
      };

    case "pod_failure_recovery":
      return {
        version: 1,
        id: "k8s-pod-failure-recovery",
        name: "Pod Failure & Recovery",
        description: "Pod crash at +1000ms triggers ReplicaSet deficit detection, new Pod creation, and rescheduling.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 2,
            labels: { app: "api-service" },
            template: createDefaultTemplate(),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [
          {
            id: "fault-pod-crash",
            type: "pod_crash",
            targetId: "dep-api",
            atMs: 1000,
            description: "Unexpected container process crash on active Pod.",
          },
        ],
        trafficProfile: [{ atMs: 600, requestsPerSec: 80, cpuPerRequestMillicores: 2 }],
        limits: baseLimits,
      };

    case "node_failure_recovery":
      return {
        version: 1,
        id: "k8s-node-failure-recovery",
        name: "Node Failure & Rescheduling",
        description: "worker-node-a goes Unavailable at +1000ms; Pods reschedule onto surviving Nodes B & C.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: {
          ...baseCluster,
          nodeFailureDetectionMs: 300,
        },
        nodes: [
          baseNodes[0]!,
          baseNodes[1]!,
          {
            ...baseNodes[0]!,
            id: "node-c",
            name: "worker-node-c",
            zone: "us-east-1c",
            labels: { "kubernetes.io/hostname": "worker-node-c", tier: "compute", zone: "us-east-1c" },
          },
        ],
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 3,
            labels: { app: "api-service" },
            template: createDefaultTemplate(),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [
          {
            id: "fault-node-a",
            type: "node_unavailable",
            targetId: "node-a",
            atMs: 1000,
            description: "worker-node-a lost heartbeat / hardware failure.",
          },
        ],
        trafficProfile: [{ atMs: 500, requestsPerSec: 120, cpuPerRequestMillicores: 2 }],
        limits: baseLimits,
      };

    case "resource_pressure_eviction":
      return {
        version: 1,
        id: "k8s-resource-pressure-eviction",
        name: "Memory Pressure & Eviction",
        description: "worker-node-a enters MemoryPressure and gets NoExecute taint; Pods evict and reschedule to Node B.",
        architectureRevisionId: "rev-1",
        presetId,
        cluster: baseCluster,
        nodes: baseNodes,
        deployments: [
          {
            id: "dep-api",
            name: "api-service",
            namespace: "default",
            desiredReplicas: 2,
            labels: { app: "api-service" },
            template: createDefaultTemplate(),
            strategy: { type: "RollingUpdate", maxSurge: 1, maxUnavailable: 0, progressDeadlineMs: 4000 },
          },
        ],
        services: [baseService],
        faults: [
          {
            id: "fault-mem-pressure",
            type: "node_memory_pressure",
            targetId: "node-a",
            atMs: 900,
            description: "Kubelet signals MemoryPressure and applies NoExecute taint on worker-node-a.",
          },
        ],
        trafficProfile: [],
        limits: baseLimits,
      };
  }
}

