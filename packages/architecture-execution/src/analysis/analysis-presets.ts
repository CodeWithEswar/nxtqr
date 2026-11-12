import {
  AnalysisExperimentSchema,
  type AnalysisComponentConfig,
  type AnalysisEdgeConfig,
  type AnalysisExperiment,
  type AnalysisRevision,
} from "./analysis-schemas";
import { withComputedRevisionHash } from "./revisions/revision-diff-engine";

export type AnalysisPresetId =
  | "ana_monolith_vs_replicated"
  | "ana_monolith_vs_microservices"
  | "ana_single_db_vs_read_replicas"
  | "ana_single_db_vs_sharding"
  | "ana_cache_vs_no_cache"
  | "ana_sync_vs_async"
  | "ana_queue_vs_direct"
  | "ana_fixed_vs_autoscaling"
  | "ana_single_region_vs_multi_region"
  | "ana_active_passive_vs_active_active"
  | "ana_sync_vs_async_replication"
  | "ana_round_robin_vs_least_connections"
  | "ana_api_gateway_bottleneck"
  | "ana_database_bottleneck"
  | "ana_connection_pool_exhaustion"
  | "ana_cache_stampede"
  | "ana_queue_overload"
  | "ana_retry_storm"
  | "ana_cascading_failure"
  | "ana_shared_dependency_failure"
  | "ana_single_point_of_failure"
  | "ana_az_outage"
  | "ana_regional_outage"
  | "ana_quorum_loss"
  | "ana_split_brain_risk"
  | "ana_capacity_shortfall"
  | "ana_insufficient_failover_capacity"
  | "ana_high_latency"
  | "ana_high_cost"
  | "ana_overprovisioning"
  | "ana_underprovisioning"
  | "ana_slo_violation"
  | "ana_rto_violation"
  | "ana_consistency_vs_latency"
  | "ana_availability_vs_cost"
  | "ana_throughput_vs_cost"
  | "ana_complexity_vs_scalability"
  | "ana_bottleneck_migration"
  | "ana_architecture_optimization"
  | "ana_architecture_decision_record";

export interface AnalysisPresetMetadata {
  id: AnalysisPresetId;
  label: string;
  category:
    | "Topology & Patterns"
    | "Bottlenecks & Saturation"
    | "Reliability & Failure Domains"
    | "Trade-Offs, Cost & ADRs";
  description: string;
}

export const ANALYSIS_PRESET_METADATA: AnalysisPresetMetadata[] = [
  { id: "ana_monolith_vs_replicated", label: "Monolith vs Replicated Service", category: "Topology & Patterns", description: "Compares single-instance app against load-balanced multi-replica deployment." },
  { id: "ana_monolith_vs_microservices", label: "Monolith vs Microservices Split", category: "Topology & Patterns", description: "Evaluates added RPC hop & complexity cost against independent failure isolation." },
  { id: "ana_single_db_vs_read_replicas", label: "Single DB vs Read Replicas", category: "Topology & Patterns", description: "Compares read throughput scaling via read replicas vs primary-only DB." },
  { id: "ana_single_db_vs_sharding", label: "Single DB vs Sharded DB", category: "Topology & Patterns", description: "Demonstrates horizontal write & capacity scaling via sharded database partitions." },
  { id: "ana_cache_vs_no_cache", label: "Cache-Aside vs Direct DB", category: "Topology & Patterns", description: "Shows how an 80% cache hit ratio relieves downstream DB saturation and p95." },
  { id: "ana_sync_vs_async", label: "Synchronous vs Asynchronous Calls", category: "Topology & Patterns", description: "Decouples synchronous fan-out latency with async queue buffering." },
  { id: "ana_queue_vs_direct", label: "Queue Buffer vs Direct Write", category: "Topology & Patterns", description: "Smooths burst spikes through a bounded queue to prevent DB connection drops." },
  { id: "ana_fixed_vs_autoscaling", label: "Fixed Replicas vs HPA Autoscaling", category: "Topology & Patterns", description: "Contrasts static fleet headroom against reactive HPA replica elasticity." },
  { id: "ana_single_region_vs_multi_region", label: "Single Region vs Multi-Region", category: "Topology & Patterns", description: "Compares regional resilience & failover survival vs cross-region coordination cost." },
  { id: "ana_active_passive_vs_active_active", label: "Active-Passive vs Active-Active", category: "Topology & Patterns", description: "Evaluates RTO standby promotion delay against full active-active cost." },
  { id: "ana_sync_vs_async_replication", label: "Sync vs Async Replication", category: "Topology & Patterns", description: "Contrasts RPO=0s sync write latency against fast async writes with lag risk." },
  { id: "ana_round_robin_vs_least_connections", label: "Round Robin vs Least Connections", category: "Topology & Patterns", description: "Compares load balancing strategies under heterogeneous service times." },
  { id: "ana_api_gateway_bottleneck", label: "API Gateway Bottleneck", category: "Bottlenecks & Saturation", description: "Gateway ingress saturates before backend services reach 50% capacity." },
  { id: "ana_database_bottleneck", label: "Database Primary Bottleneck", category: "Bottlenecks & Saturation", description: "Primary database locks/CPU saturate while upstream stateless workers wait." },
  { id: "ana_connection_pool_exhaustion", label: "Connection Pool Exhaustion", category: "Bottlenecks & Saturation", description: "Replica count outgrows DB connection limits unless pooled/cached." },
  { id: "ana_cache_stampede", label: "Cache Stampede Fallback", category: "Bottlenecks & Saturation", description: "Cold cache expiry dumps 100% of load directly onto the primary database." },
  { id: "ana_queue_overload", label: "Unbounded Queue Backlog", category: "Bottlenecks & Saturation", description: "Consumer lag causes deep queue waits exceeding request timeout SLO." },
  { id: "ana_retry_storm", label: "Retry Storm Amplification", category: "Bottlenecks & Saturation", description: "High retry multiplier triples arrival pressure; bounded retries stabilize recovery." },
  { id: "ana_cascading_failure", label: "Cascading Dependency Failure", category: "Bottlenecks & Saturation", description: "Downstream slowdown propagates upstream without queue/circuit isolation." },
  { id: "ana_shared_dependency_failure", label: "Shared Dependency Common-Cause Failure", category: "Bottlenecks & Saturation", description: "Two services appear redundant but fail together on shared DB." },
  { id: "ana_single_point_of_failure", label: "Single Point of Failure (SPOF) Elimination", category: "Reliability & Failure Domains", description: "Detects un-replicated components and verifies multi-AZ candidate recovery." },
  { id: "ana_az_outage", label: "Availability-Zone Outage Survival", category: "Reliability & Failure Domains", description: "Demonstrates why single-AZ replicas fail together vs multi-AZ placement." },
  { id: "ana_regional_outage", label: "Regional Outage Survival", category: "Reliability & Failure Domains", description: "Simulates full us-east-1 loss comparing single-region outage vs multi-region." },
  { id: "ana_quorum_loss", label: "Quorum Loss Under Partition", category: "Reliability & Failure Domains", description: "Shows quorum DB durability stalling minority partition vs 3-AZ quorum." },
  { id: "ana_split_brain_risk", label: "Split-Brain Replication Risk", category: "Reliability & Failure Domains", description: "Contrasts fencing + quorum against unsafe async dual-primary failover." },
  { id: "ana_capacity_shortfall", label: "Peak Load Capacity Shortfall", category: "Reliability & Failure Domains", description: "Traffic exceeds baseline capacity causing tail rejection until scaled." },
  { id: "ana_insufficient_failover_capacity", label: "Insufficient Failover Headroom", category: "Reliability & Failure Domains", description: "Surviving zone saturates after single-AZ loss due to thin headroom." },
  { id: "ana_high_latency", label: "Tail Latency Reduction Experiment", category: "Reliability & Failure Domains", description: "Identifies queue + DB critical path contributors above 150ms p95 budget." },
  { id: "ana_high_cost", label: "Monthly Infrastructure Cost Reduction", category: "Trade-Offs, Cost & ADRs", description: "Prunes excess replicas while staying below max p95 constraint." },
  { id: "ana_overprovisioning", label: "Overprovisioned Idle Fleet Audit", category: "Trade-Offs, Cost & ADRs", description: "Flags <20% utilization waste and right-sizes candidate fleet." },
  { id: "ana_underprovisioning", label: "Underprovisioned SLO Breach", category: "Trade-Offs, Cost & ADRs", description: "Flags chronic overload & high rejection rate on thin single-replica tier." },
  { id: "ana_slo_violation", label: "Availability & Latency SLO Violation", category: "Trade-Offs, Cost & ADRs", description: "Demonstrates hard SLO constraint failure vs compliant candidate." },
  { id: "ana_rto_violation", label: "Recovery Objective (RTO) Violation", category: "Trade-Offs, Cost & ADRs", description: "Compares backup-only 600s RTO against multi-AZ 25s failover readiness." },
  { id: "ana_consistency_vs_latency", label: "Consistency vs Write Latency", category: "Trade-Offs, Cost & ADRs", description: "Compares sync zero-RPO durability penalty against fast async replication." },
  { id: "ana_availability_vs_cost", label: "Availability vs Standby Cost", category: "Trade-Offs, Cost & ADRs", description: "Measures marginal monthly dollar cost per nine of simulated availability." },
  { id: "ana_throughput_vs_cost", label: "Throughput vs Compute Cost", category: "Trade-Offs, Cost & ADRs", description: "Explores completed RPS/dollar efficiency across scaling tiers." },
  { id: "ana_complexity_vs_scalability", label: "Structural Complexity vs Scalability", category: "Trade-Offs, Cost & ADRs", description: "Weighs extra cache/queue/replica nodes against sustainable throughput gain." },
  { id: "ana_bottleneck_migration", label: "Counterfactual Bottleneck Migration", category: "Trade-Offs, Cost & ADRs", description: "Scaling app replicas shifts primary saturation downstream to orders-db." },
  { id: "ana_architecture_optimization", label: "End-to-End Architecture Optimization", category: "Trade-Offs, Cost & ADRs", description: "Multi-seed comparison of tuned cache + replicas + sync DB under SLO budget." },
  { id: "ana_architecture_decision_record", label: "Architecture Decision Record (ADR) Flow", category: "Trade-Offs, Cost & ADRs", description: "Complete evidence-linked Proposed ADR comparing two immutable revisions." },
];

function baseRevision(
  id: string,
  label: string,
  overrides?: {
    gatewayReplicas?: number;
    appReplicas?: number;
    appMultiAz?: boolean;
    appCap?: number;
    dbReplicas?: number;
    dbMultiAz?: boolean;
    dbCap?: number;
    dbRepl?: AnalysisComponentConfig["replicationMode"];
    dbBackup?: boolean;
    includeCache?: boolean;
    cacheHit?: number;
    includeQueue?: boolean;
    extraMicroservice?: boolean;
    multiRegion?: boolean;
    retryFactor?: number;
    routingPolicy?: AnalysisRevision["routingPolicy"];
    scalingMode?: AnalysisRevision["scalingMode"];
  }
): AnalysisRevision {
  const o = overrides ?? {};
  const comps: AnalysisComponentConfig[] = [
    {
      id: "edge-gateway",
      label: "API Gateway",
      kind: "gateway",
      failureDomain: o.multiRegion ? "region" : o.appMultiAz ? "az" : "pod",
      region: "us-east-1",
      zone: "us-east-1a",
      multiAz: o.appMultiAz ?? false,
      replicas: o.gatewayReplicas ?? 2,
      capacityPerReplicaRps: 500,
      baseLatencyMs: 6,
      maxConnectionsPerReplica: 200,
      mtbfHours: 4000,
      mttrMinutes: 10,
      replicationMode: "none",
      replicationLagSec: 0,
      cacheStrategy: "none",
      cacheHitRatio: 0,
      monthlyCostPerReplicaUsd: 35,
      hasBackup: true,
      dependencyIds: ["orders-api"],
    },
    {
      id: "orders-api",
      label: "Orders Service",
      kind: "service",
      failureDomain: o.multiRegion ? "region" : "az",
      region: o.multiRegion ? "multi-region" : "us-east-1",
      zone: o.appMultiAz ? "multi-az" : "us-east-1a",
      multiAz: o.appMultiAz ?? false,
      replicas: o.appReplicas ?? 2,
      capacityPerReplicaRps: o.appCap ?? 280,
      baseLatencyMs: 18,
      maxConnectionsPerReplica: 60,
      mtbfHours: 2400,
      mttrMinutes: 12,
      replicationMode: "none",
      replicationLagSec: 0,
      cacheStrategy: "none",
      cacheHitRatio: 0,
      monthlyCostPerReplicaUsd: 55,
      hasBackup: true,
      dependencyIds: [
        ...(o.includeCache ? ["redis-cache"] : []),
        ...(o.includeQueue ? ["orders-queue"] : []),
        ...(o.extraMicroservice ? ["inventory-svc"] : []),
        "orders-db",
      ],
    },
  ];

  const edges: AnalysisEdgeConfig[] = [
    {
      id: "e_gw_api",
      source: "edge-gateway",
      target: "orders-api",
      communicationMode: "sync_http",
      retryFactor: 1,
    },
  ];

  if (o.includeCache) {
    comps.push({
      id: "redis-cache",
      label: "Redis Cache",
      kind: "cache",
      failureDomain: o.appMultiAz ? "az" : "node",
      region: "us-east-1",
      zone: o.appMultiAz ? "multi-az" : "us-east-1a",
      multiAz: o.appMultiAz ?? false,
      replicas: o.appMultiAz ? 2 : 1,
      capacityPerReplicaRps: 900,
      baseLatencyMs: 3,
      maxConnectionsPerReplica: 300,
      mtbfHours: 3500,
      mttrMinutes: 8,
      replicationMode: o.appMultiAz ? "async" : "none",
      replicationLagSec: 1,
      cacheStrategy: "cache_aside",
      cacheHitRatio: o.cacheHit ?? 0.78,
      monthlyCostPerReplicaUsd: 40,
      hasBackup: false,
      dependencyIds: [],
    });
    edges.push({
      id: "e_api_cache",
      source: "orders-api",
      target: "redis-cache",
      communicationMode: "sync_http",
      retryFactor: 1,
    });
  }

  if (o.extraMicroservice) {
    comps.push({
      id: "inventory-svc",
      label: "Inventory Microservice",
      kind: "service",
      failureDomain: "az",
      region: "us-east-1",
      zone: o.appMultiAz ? "multi-az" : "us-east-1a",
      multiAz: o.appMultiAz ?? false,
      replicas: o.appReplicas ?? 2,
      capacityPerReplicaRps: 320,
      baseLatencyMs: 14,
      maxConnectionsPerReplica: 50,
      mtbfHours: 2400,
      mttrMinutes: 12,
      replicationMode: "none",
      replicationLagSec: 0,
      cacheStrategy: "none",
      cacheHitRatio: 0,
      monthlyCostPerReplicaUsd: 50,
      hasBackup: true,
      dependencyIds: ["orders-db"],
    });
    edges.push({
      id: "e_api_inv",
      source: "orders-api",
      target: "inventory-svc",
      communicationMode: "sync_http",
      retryFactor: o.retryFactor ?? 1,
    });
  }

  if (o.includeQueue) {
    comps.push({
      id: "orders-queue",
      label: "Async Orders Queue",
      kind: "queue",
      failureDomain: "az",
      region: "us-east-1",
      zone: "multi-az",
      multiAz: true,
      replicas: 3,
      capacityPerReplicaRps: 600,
      baseLatencyMs: 5,
      maxConnectionsPerReplica: 200,
      mtbfHours: 5000,
      mttrMinutes: 5,
      replicationMode: "quorum",
      replicationLagSec: 0,
      cacheStrategy: "none",
      cacheHitRatio: 0,
      monthlyCostPerReplicaUsd: 30,
      hasBackup: true,
      dependencyIds: ["orders-db"],
    });
    edges.push({
      id: "e_api_queue",
      source: "orders-api",
      target: "orders-queue",
      communicationMode: "async_queue",
      retryFactor: 1,
    });
    edges.push({
      id: "e_queue_db",
      source: "orders-queue",
      target: "orders-db",
      communicationMode: "async_queue",
      retryFactor: 1,
    });
  } else {
    edges.push({
      id: "e_api_db",
      source: "orders-api",
      target: "orders-db",
      communicationMode: "sync_http",
      retryFactor: o.retryFactor ?? 1,
    });
  }

  comps.push({
    id: "orders-db",
    label: "Orders PostgreSQL",
    kind: "database",
    failureDomain: o.multiRegion ? "region" : o.dbMultiAz ? "az" : "global_shared",
    region: o.multiRegion ? "multi-region" : "us-east-1",
    zone: o.dbMultiAz ? "multi-az" : "us-east-1a",
    multiAz: o.dbMultiAz ?? false,
    replicas: o.dbReplicas ?? 1,
    capacityPerReplicaRps: o.dbCap ?? 450,
    baseLatencyMs: 22,
    maxConnectionsPerReplica: 50,
    mtbfHours: 3200,
    mttrMinutes: 25,
    replicationMode: o.dbRepl ?? "none",
    replicationLagSec: o.dbRepl === "async" ? 12 : 0,
    cacheStrategy: "none",
    cacheHitRatio: 0,
    monthlyCostPerReplicaUsd: 120,
    hasBackup: o.dbBackup ?? true,
    dependencyIds: [],
  });

  return withComputedRevisionHash({
    revisionId: id,
    contentHash: "",
    label,
    routingPolicy: o.routingPolicy ?? "least_connections",
    scalingMode: o.scalingMode ?? "hpa_reactive",
    maxReplicas: 20,
    components: comps,
    edges,
  });
}

export function createAnalysisPresetExperiment(
  presetId: AnalysisPresetId
): AnalysisExperiment {
  const defaultConstraints: AnalysisExperiment["constraints"] = [
    {
      id: "c_slo",
      label: "Primary Latency & Budget",
      maxP95LatencyMs: 140,
      minAvailability: 0.99,
      maxMonthlyCostUsd: 900,
      maxRtoSec: 120,
      zeroDataLossRequired: false,
    },
  ];

  let baseline = baseRevision("rev_base", "Baseline (Single-AZ Monolith)", {
    appReplicas: 1,
    appMultiAz: false,
    dbReplicas: 1,
    dbMultiAz: false,
    dbRepl: "none",
  });
  let candidate = baseRevision("rev_cand", "Candidate (Replicated Multi-AZ)", {
    appReplicas: 3,
    appMultiAz: true,
    dbReplicas: 2,
    dbMultiAz: true,
    dbRepl: "sync",
    includeCache: true,
  });
  let workloadRps = 620;
  let fault: AnalysisExperiment["fault"] = {
    id: "f_none",
    type: "none",
    targetComponentId: "orders-db",
    atMs: 160,
    durationMs: 220,
  };
  let constraints = defaultConstraints;
  let seedSet: number[] | undefined;

  switch (presetId) {
    case "ana_monolith_vs_replicated":
      baseline = baseRevision("rev_mono", "Single Instance Monolith", { appReplicas: 1, appCap: 350, dbReplicas: 1 });
      candidate = baseRevision("rev_rep", "Load-Balanced Replicas (3x)", { appReplicas: 3, appMultiAz: true, appCap: 350, dbReplicas: 2, dbMultiAz: true, dbRepl: "sync" });
      workloadRps = 550;
      break;
    case "ana_monolith_vs_microservices":
      baseline = baseRevision("rev_mono", "Modular Monolith", { appReplicas: 2, appMultiAz: true, dbReplicas: 2, dbMultiAz: true, dbRepl: "sync" });
      candidate = baseRevision("rev_ms", "Split Orders + Inventory Microservices", { appReplicas: 2, appMultiAz: true, extraMicroservice: true, dbReplicas: 2, dbMultiAz: true, dbRepl: "sync" });
      workloadRps = 500;
      break;
    case "ana_single_db_vs_read_replicas":
      baseline = baseRevision("rev_1db", "Single Primary DB", { appReplicas: 3, appMultiAz: true, dbReplicas: 1, dbCap: 420 });
      candidate = baseRevision("rev_rrep", "Primary + Async Read Replica", { appReplicas: 3, appMultiAz: true, dbReplicas: 2, dbMultiAz: true, dbCap: 420, dbRepl: "async" });
      workloadRps = 720;
      break;
    case "ana_single_db_vs_sharding":
      baseline = baseRevision("rev_1db", "Unsharded DB", { appReplicas: 4, appMultiAz: true, dbReplicas: 1, dbCap: 400 });
      candidate = baseRevision("rev_shard", "4-Shard Partitioned DB", { appReplicas: 4, appMultiAz: true, dbReplicas: 4, dbMultiAz: true, dbCap: 400, dbRepl: "quorum" });
      workloadRps = 1100;
      break;
    case "ana_cache_vs_no_cache":
      baseline = baseRevision("rev_nocache", "Direct DB (No Cache)", { appReplicas: 3, appMultiAz: true, dbReplicas: 1, dbCap: 380, includeCache: false });
      candidate = baseRevision("rev_cache", "Redis Cache-Aside (78% Hit)", { appReplicas: 3, appMultiAz: true, dbReplicas: 1, dbCap: 380, includeCache: true, cacheHit: 0.78, dbMultiAz: true, dbRepl: "sync" });
      workloadRps = 750;
      break;
    case "ana_sync_vs_async":
    case "ana_queue_vs_direct":
      baseline = baseRevision("rev_sync", "Synchronous Direct Writes", { appReplicas: 3, dbReplicas: 1, dbCap: 400, includeQueue: false });
      candidate = baseRevision("rev_async", "Buffered Async Queue", { appReplicas: 3, appMultiAz: true, dbReplicas: 2, dbMultiAz: true, dbRepl: "sync", dbCap: 400, includeQueue: true });
      workloadRps = 680;
      fault = { id: "f_q", type: "queue_overload", targetComponentId: "orders-db", atMs: 140, durationMs: 220 };
      break;
    case "ana_fixed_vs_autoscaling":
      baseline = baseRevision("rev_fixed", "Fixed 2x Replicas", { appReplicas: 2, scalingMode: "fixed" });
      candidate = baseRevision("rev_hpa", "HPA 4x Scaled Multi-AZ", { appReplicas: 4, appMultiAz: true, dbReplicas: 2, dbMultiAz: true, dbRepl: "sync", scalingMode: "hpa_reactive" });
      workloadRps = 700;
      break;
    case "ana_single_region_vs_multi_region":
    case "ana_regional_outage":
      baseline = baseRevision("rev_1reg", "Single Region (us-east-1)", { appReplicas: 3, appMultiAz: true, dbReplicas: 2, dbMultiAz: true, dbRepl: "sync", multiRegion: false });
      candidate = baseRevision("rev_2reg", "Multi-Region Distributed", { appReplicas: 4, appMultiAz: true, dbReplicas: 3, dbMultiAz: true, dbRepl: "quorum", multiRegion: true });
      workloadRps = 650;
      fault = { id: "f_reg", type: "region_outage", targetComponentId: "orders-db", atMs: 150, durationMs: 260 };
      break;
    case "ana_active_passive_vs_active_active":
      baseline = baseRevision("rev_ap", "Active-Passive Async Standby", { appReplicas: 2, appMultiAz: true, dbReplicas: 2, dbMultiAz: true, dbRepl: "async", multiRegion: true });
      candidate = baseRevision("rev_aa", "Active-Active Quorum", { appReplicas: 4, appMultiAz: true, dbReplicas: 3, dbMultiAz: true, dbRepl: "quorum", multiRegion: true });
      workloadRps = 800;
      break;
    case "ana_sync_vs_async_replication":
    case "ana_consistency_vs_latency":
      baseline = baseRevision("rev_async_r", "Async Replication (RPO ~12s)", { appReplicas: 3, appMultiAz: true, dbReplicas: 2, dbMultiAz: true, dbRepl: "async" });
      candidate = baseRevision("rev_sync_r", "Sync Replication (RPO=0s)", { appReplicas: 3, appMultiAz: true, dbReplicas: 2, dbMultiAz: true, dbRepl: "sync" });
      constraints = [{ id: "c_rpo0", label: "Zero Data Loss RPO", maxP95LatencyMs: 160, zeroDataLossRequired: true }];
      break;
    case "ana_round_robin_vs_least_connections":
      baseline = baseRevision("rev_rr", "Round Robin Routing", { appReplicas: 3, routingPolicy: "round_robin" });
      candidate = baseRevision("rev_lc", "Least-Connections Routing", { appReplicas: 3, appMultiAz: true, dbReplicas: 2, dbMultiAz: true, dbRepl: "sync", routingPolicy: "least_connections" });
      break;
    case "ana_api_gateway_bottleneck":
      baseline = baseRevision("rev_gw1", "Thin Gateway (1x)", { gatewayReplicas: 1, appReplicas: 4, dbReplicas: 2, dbMultiAz: true, dbRepl: "sync" });
      candidate = baseRevision("rev_gw3", "Scaled Gateway (3x)", { gatewayReplicas: 3, appReplicas: 4, appMultiAz: true, dbReplicas: 2, dbMultiAz: true, dbRepl: "sync" });
      workloadRps = 620;
      break;
    case "ana_database_bottleneck":
    case "ana_connection_pool_exhaustion":
    case "ana_bottleneck_migration":
      baseline = baseRevision("rev_app_only", "Scaled App (5x) -> Saturated DB (1x)", { appReplicas: 5, appMultiAz: true, dbReplicas: 1, dbCap: 350, dbRepl: "none" });
      candidate = baseRevision("rev_cached_db", "Add Cache + DB Replicas", { appReplicas: 5, appMultiAz: true, includeCache: true, cacheHit: 0.8, dbReplicas: 2, dbMultiAz: true, dbCap: 350, dbRepl: "sync" });
      workloadRps = 820;
      break;
    case "ana_cache_stampede":
      baseline = baseRevision("rev_stampede", "Cache Stampede (Zero Backing Headroom)", { appReplicas: 3, includeCache: true, dbReplicas: 1, dbCap: 320 });
      candidate = baseRevision("rev_hardened", "Hardened DB + Cache Multi-AZ", { appReplicas: 3, appMultiAz: true, includeCache: true, dbReplicas: 3, dbMultiAz: true, dbCap: 450, dbRepl: "quorum" });
      fault = { id: "f_st", type: "cache_stampede", targetComponentId: "redis-cache", atMs: 120, durationMs: 250 };
      workloadRps = 680;
      break;
    case "ana_retry_storm":
      baseline = baseRevision("rev_retry", "Unbounded 3x Retries", { appReplicas: 2, dbReplicas: 1, retryFactor: 3 });
      candidate = baseRevision("rev_bounded", "Bounded 1.1x Retries + Async Queue", { appReplicas: 3, appMultiAz: true, dbReplicas: 2, dbMultiAz: true, dbRepl: "sync", includeQueue: true, retryFactor: 1.1 });
      fault = { id: "f_rt", type: "retry_storm", targetComponentId: "orders-api", atMs: 140, durationMs: 200 };
      break;
    case "ana_az_outage":
    case "ana_single_point_of_failure":
    case "ana_shared_dependency_failure":
    case "ana_cascading_failure":
    case "ana_quorum_loss":
    case "ana_split_brain_risk":
      baseline = baseRevision("rev_spof", "Single-AZ Colocated SPOF", { appReplicas: 3, appMultiAz: false, dbReplicas: 1, dbMultiAz: false, dbRepl: "none" });
      candidate = baseRevision("rev_multi_az", "Multi-AZ Quorum Fault-Isolated", { appReplicas: 4, appMultiAz: true, dbReplicas: 3, dbMultiAz: true, dbRepl: "quorum", includeQueue: true });
      fault = { id: "f_az", type: "az_outage", targetComponentId: "orders-db", atMs: 150, durationMs: 240 };
      workloadRps = 540;
      break;
    case "ana_overprovisioning":
    case "ana_high_cost":
      baseline = baseRevision("rev_over", "Overprovisioned 10x Replicas ($900+)", { gatewayReplicas: 4, appReplicas: 10, appMultiAz: true, dbReplicas: 3, dbMultiAz: true, dbRepl: "sync" });
      candidate = baseRevision("rev_right", "Right-Sized 3x Fleet", { gatewayReplicas: 2, appReplicas: 3, appMultiAz: true, dbReplicas: 2, dbMultiAz: true, dbRepl: "sync" });
      workloadRps = 260;
      constraints = [{ id: "c_budget", label: "Tight Cost Ceiling", maxMonthlyCostUsd: 650, maxP95LatencyMs: 140, zeroDataLossRequired: false }];
      break;
    case "ana_architecture_optimization":
    case "ana_architecture_decision_record":
      seedSet = [42, 43, 44, 45];
      break;
    default:
      workloadRps = 620;
      break;
  }

  return AnalysisExperimentSchema.parse({
    version: 1,
    id: `exp_${presetId}`,
    projectId: "proj_nxtqr",
    presetId,
    label:
      ANALYSIS_PRESET_METADATA.find((m) => m.id === presetId)?.label ?? presetId,
    architectureRevisionId: baseline.revisionId,
    workloadRps,
    durationMs: 600,
    seed: 42,
    seedSet,
    scoringEnabled: true,
    baselineRevision: baseline,
    candidateRevision: candidate,
    fault,
    constraints,
    objectives: [
      { id: "o_perf", dimension: "performance", weight: 0.3, targetDirection: "maximize" },
      { id: "o_rel", dimension: "reliability", weight: 0.3, targetDirection: "maximize" },
      { id: "o_cap", dimension: "capacity", weight: 0.2, targetDirection: "maximize" },
      { id: "o_cost", dimension: "cost", weight: 0.2, targetDirection: "maximize" },
    ],
  });
}
