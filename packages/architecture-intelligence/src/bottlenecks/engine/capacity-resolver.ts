import type { BaseNode } from "@nxtqr/graph-schema";
import type { WorkloadScenario, UtilizationStatus } from "../contracts/bottleneck.types";

export interface ResolvedComponentCapacity {
  nodeId: string;
  capacityRps?: number;
  capacityOps?: number;
  capacityMsgPerSec?: number;
  bandwidthMbps?: number;
  concurrencyLimit?: number;
  processingTimeMs: number;
  source: "scenario_override" | "node_data" | "component_baseline";
}

export class CapacityResolver {
  public static getUtilizationStatus(ratio?: number): UtilizationStatus {
    if (ratio === undefined || isNaN(ratio) || !isFinite(ratio)) {
      return "unknown";
    }
    if (ratio > 1.0) return "exceeding_capacity";
    if (ratio >= 0.9) return "near_saturation";
    if (ratio >= 0.7) return "approaching_capacity";
    return "optimal";
  }

  public static resolveNodeCapacity(
    node: BaseNode,
    scenario: WorkloadScenario
  ): ResolvedComponentCapacity {
    const scenarioOverride = scenario.parameters.componentAssumptions?.[node.id];
    const data = node.data || {};
    const replicas = Math.max(1, Number(data.replicas || 1));
    const type = node.type.toLowerCase();

    // 1. Scenario override has top priority
    if (scenarioOverride?.declaredCapacityRps || scenarioOverride?.declaredCapacityOps) {
      return {
        nodeId: node.id,
        capacityRps: scenarioOverride.declaredCapacityRps ? Math.max(0, scenarioOverride.declaredCapacityRps) : undefined,
        capacityOps: scenarioOverride.declaredCapacityOps ? Math.max(0, scenarioOverride.declaredCapacityOps) : undefined,
        capacityMsgPerSec: scenarioOverride.declaredCapacityMsgPerSec,
        bandwidthMbps: scenarioOverride.declaredBandwidthMbps,
        concurrencyLimit: scenarioOverride.concurrencyLimit,
        processingTimeMs: scenarioOverride.processingTimeMs ?? (Number(data.processingTimeMs) || 10),
        source: "scenario_override",
      };
    }

    // 2. Node explicit data configuration
    if (
      data.capacityRps ||
      data.declaredCapacityRps ||
      data.maxRps ||
      data.capacityOps ||
      data.declaredCapacityOps ||
      data.capacityMsgPerSec ||
      data.declaredCapacityMsgPerSec
    ) {
      const explicitRps =
        data.capacityRps || data.declaredCapacityRps || data.maxRps
          ? Number(data.capacityRps || data.declaredCapacityRps || data.maxRps)
          : undefined;
      const explicitOps =
        data.capacityOps || data.declaredCapacityOps
          ? Number(data.capacityOps || data.declaredCapacityOps)
          : undefined;
      const explicitMsg =
        data.capacityMsgPerSec || data.declaredCapacityMsgPerSec
          ? Number(data.capacityMsgPerSec || data.declaredCapacityMsgPerSec)
          : undefined;

      return {
        nodeId: node.id,
        capacityRps: explicitRps !== undefined ? Math.max(0, explicitRps * replicas) : undefined,
        capacityOps: explicitOps !== undefined ? Math.max(0, explicitOps * replicas) : undefined,
        capacityMsgPerSec: explicitMsg !== undefined ? Math.max(0, explicitMsg * replicas) : undefined,
        processingTimeMs: Number(data.processingTimeMs || data.latencyMs || 10),
        concurrencyLimit: data.concurrencyLimit ? Number(data.concurrencyLimit) * replicas : undefined,
        bandwidthMbps: data.bandwidthMbps ? Number(data.bandwidthMbps) : undefined,
        source: "node_data",
      };
    }

    // 3. Realistic, conservative baselines derived from component type & replica multiplier
    let baselineRps: number | undefined;
    let baselineOps: number | undefined;
    let baselineMsg: number | undefined;
    let processingTimeMs = 10;

    if (type.includes("api-gateway") || type.includes("load-balancer") || type.includes("reverse-proxy")) {
      baselineRps = 10000 * replicas;
      processingTimeMs = 2;
    } else if (type.includes("cache") || type.includes("redis") || type.includes("memcached")) {
      baselineOps = 30000 * replicas;
      processingTimeMs = 1;
    } else if (type.includes("queue") || type.includes("kafka") || type.includes("topic") || type.includes("rabbitmq")) {
      baselineMsg = 15000 * replicas;
      processingTimeMs = 5;
    } else if (type.includes("relational") || type.includes("database") || type.includes("sql") || type.includes("postgres")) {
      // Relational database: baseline throughput influenced by multi-AZ and read replicas
      const readReplicas = Number(data.readReplicas || 0);
      baselineOps = 2000 + readReplicas * 1500;
      processingTimeMs = 8;
    } else if (type.includes("nosql") || type.includes("document-database") || type.includes("key-value")) {
      baselineOps = 8000 * replicas;
      processingTimeMs = 4;
    } else if (type.includes("storage") || type.includes("bucket")) {
      baselineRps = 5000;
      processingTimeMs = 15;
    } else if (type.includes("worker") || type.includes("service") || type.includes("container") || type.includes("microservice")) {
      baselineRps = 800 * replicas;
      processingTimeMs = 15;
    } else if (type.includes("model-serving") || type.includes("gpu-cluster") || type.includes("ai-inference")) {
      baselineRps = 50 * replicas;
      processingTimeMs = 120; // heavy inference processing time
    }

    return {
      nodeId: node.id,
      capacityRps: baselineRps,
      capacityOps: baselineOps,
      capacityMsgPerSec: baselineMsg,
      bandwidthMbps: data.bandwidthMbps ? Number(data.bandwidthMbps) : 1000, // default 1 Gbps
      concurrencyLimit: data.concurrencyLimit ? Number(data.concurrencyLimit) : (baselineRps ? baselineRps / 10 : undefined),
      processingTimeMs: Number(data.processingTimeMs || data.latencyMs || processingTimeMs),
      source: "component_baseline",
    };
  }
}
