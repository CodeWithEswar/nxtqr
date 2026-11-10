import type { EvidenceReference, HealthSeverity, HealthConfidence } from "../../contracts/health.types";

export type WorkloadUnit =
  | "req/s"
  | "ops/s"
  | "msg/s"
  | "bytes/s"
  | "kb/s"
  | "mb/s"
  | "concurrency"
  | "connections"
  | "ms"
  | "s"
  | "percent"
  | "ratio";

export interface WorkloadAssumption {
  id: string;
  targetComponentId?: string;
  name: string;
  metric: string;
  value: number;
  unit: string;
  source: "user" | "imported" | "scenario" | "derived";
  confidence?: HealthConfidence;
  explanation?: string;
}

export interface ComponentWorkloadConfig {
  declaredCapacityRps?: number;
  declaredCapacityOps?: number;
  declaredCapacityMsgPerSec?: number;
  declaredBandwidthMbps?: number;
  processingTimeMs?: number;
  concurrencyLimit?: number;
  connectionPoolSize?: number;
  rateLimitRps?: number;
  cacheHitRate?: number;
  cacheTtlSeconds?: number;
}

export interface WorkloadScenario {
  id: string;
  name: string;
  description: string;
  isDefault?: boolean;
  parameters: {
    activeUsers?: number;
    concurrentUsers?: number;
    ingressRps: number;
    peakMultiplier: number;
    readRatio: number; // 0.0 - 1.0 (e.g. 0.8 = 80% read)
    avgRequestSizeBytes: number;
    avgResponseSizeBytes: number;
    cacheHitRate: number; // 0.0 - 1.0
    fanOutFactor?: number;
    retryAmplificationFactor?: number;
    componentAssumptions?: Record<string, Partial<ComponentWorkloadConfig>>;
  };
}

export interface CalculationReference {
  formula: string;
  variables: Record<string, number | string>;
  result: number | string;
  unit: string;
  explanation: string;
}

export type BottleneckType =
  | "service_saturation"
  | "queue_backlog"
  | "database_contention"
  | "cache_miss_amplification"
  | "network_bandwidth"
  | "external_quota"
  | "latency_critical_path"
  | "fan_out_amplification";

export interface BottleneckFinding {
  id: string;
  ruleId: string;
  bottleneckType: BottleneckType;
  severity: HealthSeverity;
  title: string;
  explanation: string;
  affectedNodeIds: string[];
  affectedEdgeIds: string[];
  evidence: EvidenceReference[];
  assumptions: string[];
  calculations: CalculationReference[];
  recommendationIds: string[];
  confidence: HealthConfidence;
  tradeOffs: string[];
}

export type UtilizationStatus =
  | "optimal"
  | "approaching_capacity"
  | "near_saturation"
  | "exceeding_capacity"
  | "unknown";

export interface NodeUtilization {
  nodeId: string;
  demandRps: number;
  demandReadRps: number;
  demandWriteRps: number;
  declaredCapacityRps?: number;
  utilizationRatio?: number;
  status: UtilizationStatus;
  concurrencyDemand?: number;
  bandwidthDemandMbps?: number;
  details: string;
}

export interface QueueMetrics {
  queueId: string;
  arrivalRateMsgPerSec: number;
  processingCapacityMsgPerSec?: number;
  netBacklogGrowthMsgPerSec?: number;
  isSaturating: boolean;
}

export interface CriticalPathMetrics {
  pathNodeIds: string[];
  depth: number;
  estimatedLatencyMs: number;
  latencyBudgetMs?: number;
  exceedsBudget: boolean;
  bottleneckNodeId?: string;
}

export interface BottleneckReport {
  id: string;
  timestamp: string;
  graphRevision: string;
  scenario: WorkloadScenario;
  findings: BottleneckFinding[];
  nodeUtilization: Record<string, NodeUtilization>;
  queueMetrics: Record<string, QueueMetrics>;
  criticalPaths: CriticalPathMetrics[];
  metrics: {
    analyzedNodesCount: number;
    bottlenecksDetectedCount: number;
    criticalCount: number;
    highCount: number;
    executionTimeMs: number;
  };
}

