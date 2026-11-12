import {
  CapacityScenarioSchema,
  type CapacityScenario,
} from "./capacity-schemas";

export type CapacityPresetId =
  | "healthy_steady_state"
  | "cap_cpu_saturation"
  | "memory_saturation"
  | "worker_pool_saturation"
  | "db_connection_exhaustion"
  | "queue_buildup"
  | "cap_queue_overflow"
  | "mm1_stable"
  | "mm1_unstable"
  | "mmc_queue"
  | "littles_law_demo"
  | "head_of_line_blocking"
  | "cap_sudden_traffic_spike"
  | "gradual_traffic_ramp"
  | "diurnal_workload"
  | "bursty_traffic"
  | "cap_hpa_scale_out"
  | "cap_hpa_scale_in"
  | "scaling_stabilization"
  | "scaling_cooldown"
  | "slow_replica_startup"
  | "cold_start"
  | "insufficient_cluster_capacity"
  | "cluster_autoscaling"
  | "resource_fragmentation"
  | "vpa_recommendation"
  | "predictive_scaling"
  | "reactive_vs_predictive"
  | "cap_retry_amplification"
  | "thundering_herd"
  | "backpressure_cap"
  | "load_shedding_cap"
  | "noisy_neighbor"
  | "multi_tenant_fairness"
  | "regional_capacity_imbalance"
  | "dr_capacity_surge"
  | "overprovisioning"
  | "underprovisioning"
  | "right_sizing"
  | "cost_optimization"
  | "latency_vs_cost"
  | "availability_vs_cost"
  | "pareto_frontier"
  | "capacity_recommendation"
  | "cap_strategy_comparison";

export interface CapacityPresetMetadata {
  id: CapacityPresetId;
  label: string;
  category:
    | "Saturation & Resources"
    | "Queueing Theory"
    | "Workloads & Autoscaling"
    | "Overload, Fairness & DR"
    | "Cost, Right-Sizing & Pareto";
  description: string;
}

export const CAPACITY_PRESET_METADATA: CapacityPresetMetadata[] = [
  { id: "healthy_steady_state", label: "Healthy Steady State", category: "Saturation & Resources", description: "Balanced utilization around 50-65% with ample headroom and zero SLO breaches." },
  { id: "cap_cpu_saturation", label: "CPU Saturation & Throttling", category: "Saturation & Resources", description: "CPU demand exceeds CFS limit causing throttling and tail-latency growth." },
  { id: "memory_saturation", label: "Memory Pressure & OOM Risk", category: "Saturation & Resources", description: "Memory leak pressure drives MiB utilization above 88% OOM risk threshold." },
  { id: "worker_pool_saturation", label: "Worker Pool Saturation", category: "Saturation & Resources", description: "Per-replica worker concurrency exhausted even while CPU headroom remains." },
  { id: "db_connection_exhaustion", label: "DB Connection Pool Exhaustion", category: "Saturation & Resources", description: "Downstream DB connections saturate upstream API replicas despite scaling." },
  { id: "queue_buildup", label: "Bounded Queue Buildup", category: "Queueing Theory", description: "Sustained arrival surge builds bounded waiting queue increasing p95 latency." },
  { id: "cap_queue_overflow", label: "Queue Overflow & Drops", category: "Queueing Theory", description: "Incoming traffic exceeds max queue depth causing immediate tail drops." },
  { id: "mm1_stable", label: "M/M/1 Stable Queue (rho < 1)", category: "Queueing Theory", description: "Single-server Poisson queue well below saturation demonstrating Wq and Lq." },
  { id: "mm1_unstable", label: "M/M/1 Unstable (rho >= 1)", category: "Queueing Theory", description: "Arrival rate meets/exceeds capacity; analytical M/M/1 steady state invalid." },
  { id: "mmc_queue", label: "M/M/c Multi-Server Erlang-C", category: "Queueing Theory", description: "Exact c-server Erlang-C queueing showing lower wait vs c separate M/M/1 queues." },
  { id: "littles_law_demo", label: "Little's Law (L = lambda * W)", category: "Queueing Theory", description: "Verifies average concurrency in system equals arrival rate times average residence time." },
  { id: "head_of_line_blocking", label: "Head-of-Line Queue Blocking", category: "Queueing Theory", description: "FIFO queue stalled behind heavy requests degrading fast-request tail latency." },
  { id: "cap_sudden_traffic_spike", label: "Sudden Step Traffic Spike", category: "Workloads & Autoscaling", description: "Abrupt 4x step jump tests queue buffering and reactive scale-out speed." },
  { id: "gradual_traffic_ramp", label: "Gradual Linear Traffic Ramp", category: "Workloads & Autoscaling", description: "Smooth ramp allows HPA target utilization tracking across intervals." },
  { id: "diurnal_workload", label: "Diurnal Periodic Wave", category: "Workloads & Autoscaling", description: "Sinusoidal traffic wave demonstrating scale-out followed by stabilized scale-in." },
  { id: "bursty_traffic", label: "Bursty On-Off Microbursts", category: "Workloads & Autoscaling", description: "Spiky on-off arrivals testing headroom buffer vs oscillation." },
  { id: "cap_hpa_scale_out", label: "HPA Reactive Scale-Out", category: "Workloads & Autoscaling", description: "Standard target-CPU reactive HPA scaling replicas out toward demand." },
  { id: "cap_hpa_scale_in", label: "HPA Stabilized Scale-In", category: "Workloads & Autoscaling", description: "Low traffic triggers gradual scale-in bounded by stabilization window." },
  { id: "scaling_stabilization", label: "Stabilization Window Anti-Thrash", category: "Workloads & Autoscaling", description: "Long stabilization window filters transient dips to avoid thrashing." },
  { id: "scaling_cooldown", label: "Cooldown Gated Scaling", category: "Workloads & Autoscaling", description: "Extended cooldown interval enforces waiting period between consecutive actions." },
  { id: "slow_replica_startup", label: "Slow Replica Startup & Readiness", category: "Workloads & Autoscaling", description: "New replicas take 220ms+ to pass readiness probes; zero capacity until READY." },
  { id: "cold_start", label: "Cold-Start Latency Penalty", category: "Workloads & Autoscaling", description: "Newly provisioned instances incur initial cold-start latency spike." },
  { id: "insufficient_cluster_capacity", label: "Insufficient Cluster Node Capacity", category: "Workloads & Autoscaling", description: "Cluster nodes full without Cluster Autoscaler; pods remain PENDING_CAPACITY." },
  { id: "cluster_autoscaling", label: "Cluster Autoscaler Node Provisioning", category: "Workloads & Autoscaling", description: "Pending replicas trigger new virtual cluster node provisioning after delay." },
  { id: "resource_fragmentation", label: "Node Bin-Packing Fragmentation", category: "Workloads & Autoscaling", description: "Aggregate free CPU exists across nodes, but fragmented layout blocks large pods." },
  { id: "vpa_recommendation", label: "VPA Vertical Right-Sizing", category: "Workloads & Autoscaling", description: "Generates CPU/memory request recommendations for over-allocated containers." },
  { id: "predictive_scaling", label: "Predictive Scaling (Zero Leakage)", category: "Workloads & Autoscaling", description: "Exponential smoothing forecasts ramp ahead using strictly past observations." },
  { id: "reactive_vs_predictive", label: "Reactive vs Predictive Benchmark", category: "Workloads & Autoscaling", description: "High-ramp workload designed for side-by-side reactive vs predictive comparison." },
  { id: "cap_retry_amplification", label: "Retry Amplification Overload", category: "Overload, Fairness & DR", description: "2.5x client retry multiplier compounds effective load during transient saturation." },
  { id: "thundering_herd", label: "Thundering Herd Cache/Expiry Surge", category: "Overload, Fairness & DR", description: "Synchronized burst fault floods worker pools and queues simultaneously." },
  { id: "backpressure_cap", label: "Queue Backpressure Control", category: "Overload, Fairness & DR", description: "Signals upstream slow-down at 85% queue occupancy to protect core workers." },
  { id: "load_shedding_cap", label: "Graceful Load Shedding", category: "Overload, Fairness & DR", description: "Explicitly sheds excess arrivals above bounded queue depth to protect p95 SLO." },
  { id: "noisy_neighbor", label: "Noisy Neighbor Tenant Surge", category: "Overload, Fairness & DR", description: "High-weight tenant traffic surge contends for shared multi-tenant pool." },
  { id: "multi_tenant_fairness", label: "Multi-Tenant WFQ Isolation", category: "Overload, Fairness & DR", description: "Weighted Fair Queueing protects standard tenant against aggressive burst tenant." },
  { id: "regional_capacity_imbalance", label: "Regional Capacity Imbalance", category: "Overload, Fairness & DR", description: "Traffic concentrates in us-east-1 while secondary regional capacity sits idle." },
  { id: "dr_capacity_surge", label: "DR Failover Capacity Surge", category: "Overload, Fairness & DR", description: "Region failover redirects 1.85x traffic into surviving region headroom." },
  { id: "overprovisioning", label: "Overprovisioned Idle Fleet", category: "Cost, Right-Sizing & Pareto", description: "12 replicas running at <15% utilization wasting synthetic monthly compute budget." },
  { id: "underprovisioning", label: "Underprovisioned Fleet SLO Breach", category: "Cost, Right-Sizing & Pareto", description: "Fixed 1 replica overloaded with chronic queue saturation and SLO failure." },
  { id: "right_sizing", label: "Fleet Right-Sizing Optimization", category: "Cost, Right-Sizing & Pareto", description: "Balances utilization near 65-70% target to cut waste without violating p95." },
  { id: "cost_optimization", label: "Budget-Constrained Cost Minimization", category: "Cost, Right-Sizing & Pareto", description: "Evaluates minimum replica footprint staying within monthly synthetic budget." },
  { id: "latency_vs_cost", label: "Latency vs Cost Trade-Off Curve", category: "Cost, Right-Sizing & Pareto", description: "Explores marginal p95 latency reduction per additional monthly replica dollar." },
  { id: "availability_vs_cost", label: "Headroom/Failover Reserve vs Cost", category: "Cost, Right-Sizing & Pareto", description: "Compares N+2 resilience buffer cost against bare minimum N capacity." },
  { id: "pareto_frontier", label: "Multi-Objective Pareto Frontier", category: "Cost, Right-Sizing & Pareto", description: "Computes non-dominated replica configurations across cost, latency, and headroom." },
  { id: "capacity_recommendation", label: "Evidence-Backed Recommendations", category: "Cost, Right-Sizing & Pareto", description: "Produces grounded scaling, resource, and downstream tuning recommendations." },
  { id: "cap_strategy_comparison", label: "Fixed vs HPA vs Predictive Matrix", category: "Cost, Right-Sizing & Pareto", description: "Baseline workload configured for multi-strategy comparison matrix evaluation." },
];

type ScenarioOverrides = {
  id: string;
  label: string;
  initialReplicas?: number;
  minReplicas?: number;
  maxReplicas?: number;
  baseServiceTimeMs?: number;
  workerConcurrencyPerReplica?: number;
  maxDbConnectionsPerReplica?: number;
  cpuRequestMillicores?: number;
  cpuLimitMillicores?: number;
  memoryRequestMiB?: number;
  memoryLimitMiB?: number;
  startupDelayMs?: number;
  readinessDelayMs?: number;
  coldStartPenaltyMs?: number;
  includeDownstreamDb?: boolean;
  arrivalModel?: CapacityScenario["workloads"][number]["arrivalModel"];
  baseRps?: number;
  peakRps?: number;
  retryFactor?: number;
  scalingMode?: CapacityScenario["scalingPolicies"][number]["mode"];
  targetCpuPct?: number;
  cooldownMs?: number;
  stabilizationUpMs?: number;
  stabilizationDownMs?: number;
  clusterAutoScaleEnabled?: boolean;
  queueDiscipline?: CapacityScenario["queueingPolicies"][number]["discipline"];
  maxQueueDepth?: number;
  overloadAction?: CapacityScenario["queueingPolicies"][number]["overloadAction"];
  nodeCount?: number;
  fragmentedLayout?: boolean;
  maxP95LatencyMs?: number;
  maxMonthlyBudgetUsd?: number;
  faults?: CapacityScenario["faults"];
  multiTenant?: boolean;
};

function makeCapScenario(o: ScenarioOverrides): CapacityScenario {
  const services: CapacityScenario["services"] = [
    {
      id: "api-service",
      label: "Checkout API Service",
      kind: "application",
      region: "us-east-1",
      initialReplicas: o.initialReplicas ?? 3,
      minReplicas: o.minReplicas ?? 1,
      maxReplicas: o.maxReplicas ?? 16,
      cpuRequestMillicores: o.cpuRequestMillicores ?? 500,
      cpuLimitMillicores: o.cpuLimitMillicores ?? 1000,
      memoryRequestMiB: o.memoryRequestMiB ?? 512,
      memoryLimitMiB: o.memoryLimitMiB ?? 1024,
      workerConcurrencyPerReplica: o.workerConcurrencyPerReplica ?? 16,
      maxDbConnectionsPerReplica: o.maxDbConnectionsPerReplica ?? 25,
      baseServiceTimeMs: o.baseServiceTimeMs ?? 20,
      cpuCostPerRequestMillicores: 7,
      memoryPerRequestMiB: 3,
      startupDelayMs: o.startupDelayMs ?? 40,
      readinessDelayMs: o.readinessDelayMs ?? 20,
      coldStartPenaltyMs: o.coldStartPenaltyMs ?? 0,
      dependencyIds: o.includeDownstreamDb ? ["orders-db"] : [],
      reservedFailoverReplicas: 0,
    },
  ];

  const scalingPolicies: CapacityScenario["scalingPolicies"] = [
    {
      id: "pol_api",
      serviceId: "api-service",
      mode: o.scalingMode ?? "hpa_reactive",
      targetCpuUtilizationPct: o.targetCpuPct ?? 70,
      targetMemoryUtilizationPct: 80,
      evaluationIntervalMs: 40,
      scaleUpStabilizationMs: o.stabilizationUpMs ?? 20,
      scaleDownStabilizationMs: o.stabilizationDownMs ?? 120,
      cooldownMs: o.cooldownMs ?? 40,
      tolerancePct: 10,
      maxScaleUpStepReplicas: 4,
      maxScaleDownStepReplicas: 2,
      forecastModel: "exponential_smoothing",
      clusterAutoScaleEnabled: o.clusterAutoScaleEnabled ?? false,
    },
  ];

  const queueingPolicies: CapacityScenario["queueingPolicies"] = [
    {
      id: "qp_api",
      serviceId: "api-service",
      discipline: o.queueDiscipline ?? "fifo",
      maxQueueDepth: o.maxQueueDepth ?? 90,
      requestTimeoutMs: 250,
      overloadAction: o.overloadAction ?? "load_shed",
    },
  ];

  const objectives: CapacityScenario["objectives"] = [
    {
      id: "obj_api",
      serviceId: "api-service",
      maxP95LatencyMs: o.maxP95LatencyMs ?? 120,
      maxErrorRate: 0.02,
      maxMonthlyBudgetUsd: o.maxMonthlyBudgetUsd ?? 1000,
      minHeadroomPct: 15,
      optimizationGoal: "balanced_pareto",
    },
  ];

  if (o.includeDownstreamDb) {
    services.push({
      id: "orders-db",
      label: "Orders Primary DB",
      kind: "database",
      region: "us-east-1",
      initialReplicas: 1,
      minReplicas: 1,
      maxReplicas: 1,
      cpuRequestMillicores: 1000,
      cpuLimitMillicores: 1500,
      memoryRequestMiB: 2048,
      memoryLimitMiB: 4096,
      workerConcurrencyPerReplica: 12,
      maxDbConnectionsPerReplica: 10,
      baseServiceTimeMs: 35,
      cpuCostPerRequestMillicores: 8,
      memoryPerRequestMiB: 6,
      startupDelayMs: 60,
      readinessDelayMs: 20,
      coldStartPenaltyMs: 0,
      dependencyIds: [],
      reservedFailoverReplicas: 0,
    });
    scalingPolicies.push({
      id: "pol_db",
      serviceId: "orders-db",
      mode: "fixed",
      targetCpuUtilizationPct: 70,
      targetMemoryUtilizationPct: 80,
      evaluationIntervalMs: 80,
      scaleUpStabilizationMs: 40,
      scaleDownStabilizationMs: 120,
      cooldownMs: 80,
      tolerancePct: 10,
      maxScaleUpStepReplicas: 1,
      maxScaleDownStepReplicas: 1,
      forecastModel: "moving_average",
      clusterAutoScaleEnabled: false,
    });
    queueingPolicies.push({
      id: "qp_db",
      serviceId: "orders-db",
      discipline: "fifo",
      maxQueueDepth: 60,
      requestTimeoutMs: 300,
      overloadAction: "queue",
    });
  }

  const workloads: CapacityScenario["workloads"] = [
    {
      id: "wl_primary",
      targetServiceId: "api-service",
      arrivalModel: o.arrivalModel ?? "constant",
      baseRequestsPerSecond: o.baseRps ?? 140,
      peakRequestsPerSecond: o.peakRps,
      startMs: 0,
      durationMs: 800,
      heavyRequestRatio: 0.1,
      retryAmplificationFactor: o.retryFactor ?? 1,
      tenantId: "tenant-standard",
      tenantWeight: 1,
      region: "us-east-1",
    },
  ];

  if (o.multiTenant) {
    workloads.push({
      id: "wl_noisy",
      targetServiceId: "api-service",
      arrivalModel: "bursty",
      baseRequestsPerSecond: 90,
      peakRequestsPerSecond: 260,
      startMs: 0,
      durationMs: 800,
      heavyRequestRatio: 0.3,
      retryAmplificationFactor: 1,
      tenantId: "tenant-bulk-export",
      tenantWeight: 3,
      region: "us-east-1",
    });
  }

  return CapacityScenarioSchema.parse({
    version: 1,
    id: `cap_${o.id}`,
    presetId: o.id,
    label: o.label,
    architectureRevisionId: "rev_capacity_01",
    seed: 42,
    services,
    workloads,
    scalingPolicies,
    queueingPolicies,
    costModels: [{ id: "cost_default" }],
    cluster: {
      nodeCount: o.nodeCount ?? 4,
      cpuPerNodeMillicores: 4000,
      memoryPerNodeMiB: 8192,
      maxNodes: 10,
      nodeProvisionDelayMs: 120,
      fragmentedLayout: o.fragmentedLayout ?? false,
    },
    objectives,
    faults: o.faults ?? [],
    limits: {
      maxServices: 100,
      maxReplicas: 200,
      maxRequests: 8000,
      maxQueueEntries: 1000,
      maxScalingEvents: 100,
      maxEvents: 2500,
      maxVirtualDurationMs: 640,
    },
  });
}

export function buildCapacityPresetScenario(
  presetId: CapacityPresetId
): CapacityScenario {
  switch (presetId) {
    case "healthy_steady_state":
      return makeCapScenario({ id: presetId, label: "Healthy Steady State", initialReplicas: 4, baseRps: 140, scalingMode: "fixed" });
    case "cap_cpu_saturation":
      return makeCapScenario({ id: presetId, label: "CPU Saturation & Throttling", initialReplicas: 2, baseRps: 340, cpuLimitMillicores: 450, scalingMode: "fixed" });
    case "memory_saturation":
      return makeCapScenario({
        id: presetId, label: "Memory Pressure & OOM Risk", initialReplicas: 2, baseRps: 160, memoryLimitMiB: 512, scalingMode: "fixed",
        faults: [{ id: "f_mem", atMs: 100, durationMs: 500, type: "memory_leak_pressure", targetServiceId: "api-service", description: "Heap growth leak" }],
      });
    case "worker_pool_saturation":
      return makeCapScenario({ id: presetId, label: "Worker Pool Saturation", initialReplicas: 2, workerConcurrencyPerReplica: 4, baseServiceTimeMs: 40, baseRps: 260, scalingMode: "fixed" });
    case "db_connection_exhaustion":
      return makeCapScenario({
        id: presetId, label: "DB Connection Pool Exhaustion", initialReplicas: 4, baseRps: 240, includeDownstreamDb: true, scalingMode: "hpa_reactive",
        faults: [{ id: "f_db", atMs: 80, durationMs: 520, type: "downstream_db_saturation", targetServiceId: "orders-db", description: "DB lock/pool contention" }],
      });
    case "queue_buildup":
      return makeCapScenario({ id: presetId, label: "Bounded Queue Buildup", initialReplicas: 2, baseRps: 260, maxQueueDepth: 160, overloadAction: "queue", scalingMode: "fixed" });
    case "cap_queue_overflow":
      return makeCapScenario({ id: presetId, label: "Queue Overflow & Drops", initialReplicas: 1, baseRps: 420, maxQueueDepth: 20, overloadAction: "load_shed", scalingMode: "fixed" });
    case "mm1_stable":
      return makeCapScenario({ id: presetId, label: "M/M/1 Stable Queue", initialReplicas: 1, workerConcurrencyPerReplica: 20, baseServiceTimeMs: 25, baseRps: 110, arrivalModel: "poisson", scalingMode: "fixed" });
    case "mm1_unstable":
      return makeCapScenario({ id: presetId, label: "M/M/1 Unstable (rho >= 1)", initialReplicas: 1, workerConcurrencyPerReplica: 10, baseServiceTimeMs: 40, baseRps: 360, arrivalModel: "poisson", scalingMode: "fixed" });
    case "mmc_queue":
      return makeCapScenario({ id: presetId, label: "M/M/c Multi-Server Erlang-C", initialReplicas: 5, workerConcurrencyPerReplica: 14, baseServiceTimeMs: 30, baseRps: 260, arrivalModel: "poisson", scalingMode: "fixed" });
    case "littles_law_demo":
      return makeCapScenario({ id: presetId, label: "Little's Law Demonstration", initialReplicas: 3, baseRps: 180, arrivalModel: "constant", scalingMode: "fixed" });
    case "head_of_line_blocking":
      return makeCapScenario({ id: presetId, label: "Head-of-Line Queue Blocking", initialReplicas: 2, baseRps: 240, queueDiscipline: "head_of_line_demo", scalingMode: "fixed" });
    case "cap_sudden_traffic_spike":
      return makeCapScenario({ id: presetId, label: "Sudden Step Traffic Spike", initialReplicas: 2, arrivalModel: "step", baseRps: 110, peakRps: 460, scalingMode: "hpa_reactive" });
    case "gradual_traffic_ramp":
      return makeCapScenario({ id: presetId, label: "Gradual Linear Traffic Ramp", initialReplicas: 2, arrivalModel: "ramp", baseRps: 90, peakRps: 420, scalingMode: "hpa_reactive" });
    case "diurnal_workload":
      return makeCapScenario({ id: presetId, label: "Diurnal Periodic Wave", initialReplicas: 3, arrivalModel: "periodic", baseRps: 100, peakRps: 380, scalingMode: "hpa_reactive" });
    case "bursty_traffic":
      return makeCapScenario({ id: presetId, label: "Bursty On-Off Microbursts", initialReplicas: 3, arrivalModel: "bursty", baseRps: 120, peakRps: 480, scalingMode: "hpa_reactive" });
    case "cap_hpa_scale_out":
      return makeCapScenario({ id: presetId, label: "HPA Reactive Scale-Out", initialReplicas: 2, arrivalModel: "ramp", baseRps: 120, peakRps: 440, scalingMode: "hpa_reactive", targetCpuPct: 65 });
    case "cap_hpa_scale_in":
      return makeCapScenario({ id: presetId, label: "HPA Stabilized Scale-In", initialReplicas: 8, minReplicas: 2, arrivalModel: "constant", baseRps: 70, scalingMode: "hpa_reactive", stabilizationDownMs: 120 });
    case "scaling_stabilization":
      return makeCapScenario({ id: presetId, label: "Stabilization Window Anti-Thrash", initialReplicas: 4, arrivalModel: "bursty", baseRps: 130, peakRps: 340, scalingMode: "hpa_reactive", stabilizationUpMs: 80, stabilizationDownMs: 240 });
    case "scaling_cooldown":
      return makeCapScenario({ id: presetId, label: "Cooldown Gated Scaling", initialReplicas: 2, arrivalModel: "step", baseRps: 120, peakRps: 420, scalingMode: "hpa_reactive", cooldownMs: 160 });
    case "slow_replica_startup":
      return makeCapScenario({ id: presetId, label: "Slow Replica Startup & Readiness", initialReplicas: 2, arrivalModel: "step", baseRps: 120, peakRps: 400, startupDelayMs: 180, readinessDelayMs: 60, scalingMode: "hpa_reactive" });
    case "cold_start":
      return makeCapScenario({
        id: presetId, label: "Cold-Start Latency Penalty", initialReplicas: 2, arrivalModel: "step", baseRps: 120, peakRps: 360, coldStartPenaltyMs: 75, scalingMode: "hpa_reactive",
        faults: [{ id: "f_cold", atMs: 160, durationMs: 200, type: "cold_start_surge", targetServiceId: "api-service", description: "New instance cold start JIT/cache warm" }],
      });
    case "insufficient_cluster_capacity":
      return makeCapScenario({ id: presetId, label: "Insufficient Cluster Node Capacity", initialReplicas: 2, nodeCount: 1, cpuRequestMillicores: 1000, memoryRequestMiB: 2048, arrivalModel: "step", baseRps: 120, peakRps: 450, scalingMode: "hpa_reactive", clusterAutoScaleEnabled: false });
    case "cluster_autoscaling":
      return makeCapScenario({ id: presetId, label: "Cluster Autoscaler Node Provisioning", initialReplicas: 2, nodeCount: 1, cpuRequestMillicores: 1000, memoryRequestMiB: 2048, arrivalModel: "step", baseRps: 120, peakRps: 450, scalingMode: "cluster_autoscale", clusterAutoScaleEnabled: true });
    case "resource_fragmentation":
      return makeCapScenario({ id: presetId, label: "Node Bin-Packing Fragmentation", initialReplicas: 3, nodeCount: 2, cpuRequestMillicores: 1200, memoryRequestMiB: 2048, fragmentedLayout: true, arrivalModel: "ramp", baseRps: 150, peakRps: 420, scalingMode: "hpa_reactive" });
    case "vpa_recommendation":
      return makeCapScenario({ id: presetId, label: "VPA Vertical Right-Sizing", initialReplicas: 6, cpuRequestMillicores: 1200, memoryRequestMiB: 2048, baseRps: 110, scalingMode: "vpa_recommend" });
    case "predictive_scaling":
      return makeCapScenario({ id: presetId, label: "Predictive Scaling (Zero Leakage)", initialReplicas: 2, arrivalModel: "ramp", baseRps: 100, peakRps: 440, scalingMode: "predictive" });
    case "reactive_vs_predictive":
      return makeCapScenario({ id: presetId, label: "Reactive vs Predictive Benchmark", initialReplicas: 2, arrivalModel: "step", baseRps: 100, peakRps: 450, scalingMode: "hpa_reactive" });
    case "cap_retry_amplification":
      return makeCapScenario({ id: presetId, label: "Retry Amplification Overload", initialReplicas: 2, baseRps: 190, retryFactor: 2.5, scalingMode: "hpa_reactive" });
    case "thundering_herd":
      return makeCapScenario({
        id: presetId, label: "Thundering Herd Surge", initialReplicas: 3, baseRps: 180, scalingMode: "hpa_reactive",
        faults: [{ id: "f_herd", atMs: 140, durationMs: 260, type: "thundering_herd", targetServiceId: "api-service", description: "Simultaneous token expiry thundering herd" }],
      });
    case "backpressure_cap":
      return makeCapScenario({ id: presetId, label: "Queue Backpressure Control", initialReplicas: 2, baseRps: 360, overloadAction: "backpressure", maxQueueDepth: 80, scalingMode: "fixed" });
    case "load_shedding_cap":
      return makeCapScenario({ id: presetId, label: "Graceful Load Shedding", initialReplicas: 2, baseRps: 390, overloadAction: "load_shed", maxQueueDepth: 45, scalingMode: "fixed" });
    case "noisy_neighbor":
      return makeCapScenario({
        id: presetId, label: "Noisy Neighbor Tenant Surge", initialReplicas: 3, baseRps: 150, multiTenant: true, scalingMode: "hpa_reactive",
        faults: [{ id: "f_nn", atMs: 120, durationMs: 360, type: "noisy_neighbor_tenant", targetServiceId: "api-service", description: "Tenant bulk export burst" }],
      });
    case "multi_tenant_fairness":
      return makeCapScenario({ id: presetId, label: "Multi-Tenant WFQ Isolation", initialReplicas: 4, baseRps: 160, multiTenant: true, queueDiscipline: "wfq", scalingMode: "hpa_reactive" });
    case "regional_capacity_imbalance":
      return makeCapScenario({ id: presetId, label: "Regional Capacity Imbalance", initialReplicas: 2, baseRps: 320, scalingMode: "fixed" });
    case "dr_capacity_surge":
      return makeCapScenario({
        id: presetId, label: "DR Failover Capacity Surge", initialReplicas: 3, baseRps: 210, scalingMode: "hpa_reactive",
        faults: [{ id: "f_dr", atMs: 120, durationMs: 420, type: "region_failover_surge", targetServiceId: "api-service", description: "Secondary region traffic drained into primary" }],
      });
    case "overprovisioning":
      return makeCapScenario({ id: presetId, label: "Overprovisioned Idle Fleet", initialReplicas: 12, minReplicas: 8, baseRps: 80, scalingMode: "fixed", maxMonthlyBudgetUsd: 350 });
    case "underprovisioning":
      return makeCapScenario({ id: presetId, label: "Underprovisioned Fleet SLO Breach", initialReplicas: 1, baseRps: 360, scalingMode: "fixed" });
    case "right_sizing":
      return makeCapScenario({ id: presetId, label: "Fleet Right-Sizing Optimization", initialReplicas: 8, minReplicas: 1, baseRps: 180, scalingMode: "hpa_reactive" });
    case "cost_optimization":
      return makeCapScenario({ id: presetId, label: "Budget-Constrained Cost Minimization", initialReplicas: 5, minReplicas: 1, baseRps: 160, scalingMode: "hpa_reactive", maxMonthlyBudgetUsd: 300 });
    case "latency_vs_cost":
      return makeCapScenario({ id: presetId, label: "Latency vs Cost Trade-Off Curve", initialReplicas: 3, baseRps: 240, maxP95LatencyMs: 65, scalingMode: "hpa_reactive" });
    case "availability_vs_cost":
      return makeCapScenario({ id: presetId, label: "Headroom/Failover Reserve vs Cost", initialReplicas: 4, baseRps: 200, scalingMode: "hpa_reactive" });
    case "pareto_frontier":
      return makeCapScenario({ id: presetId, label: "Multi-Objective Pareto Frontier", initialReplicas: 4, baseRps: 250, scalingMode: "hpa_reactive" });
    case "capacity_recommendation":
      return makeCapScenario({ id: presetId, label: "Evidence-Backed Recommendations", initialReplicas: 2, baseRps: 310, scalingMode: "fixed" });
    case "cap_strategy_comparison":
      return makeCapScenario({ id: presetId, label: "Fixed vs HPA vs Predictive Matrix", initialReplicas: 2, arrivalModel: "ramp", baseRps: 110, peakRps: 420, scalingMode: "hpa_reactive" });
  }
}

