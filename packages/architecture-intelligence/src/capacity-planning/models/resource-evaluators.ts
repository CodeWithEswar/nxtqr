import type { BaseNode } from "@nxtqr/graph-schema";
import type { ResourceCategory } from "../contracts/capacity.types";

export interface SizingRecommendationResult {
  currentCapacityRps?: number;
  recommendedInstancesCount?: number;
  scalingEfficiency: number;
  notes: string;
}

export class ResourceEvaluator {
  /**
   * Identifies the primary resource category of an infrastructure component.
   */
  public static categorizeComponent(node: BaseNode): ResourceCategory {
    const type = node.type.toLowerCase();
    const data = (node.data || {}) as Record<string, unknown>;
    const categoryId = String(data.categoryId || "").toLowerCase();

    if (type.includes("database") || type.includes("sql") || type.includes("postgres") || type.includes("mysql") || type.includes("mongo")) {
      return "database";
    }
    if (type.includes("cache") || type.includes("redis") || type.includes("memcached")) {
      return "cache";
    }
    if (type.includes("queue") || type.includes("broker") || type.includes("kafka") || type.includes("pubsub") || type.includes("sqs")) {
      return "messaging";
    }
    if (type.includes("storage") || type.includes("s3") || type.includes("blob") || type.includes("bucket")) {
      return "storage";
    }
    if (type.includes("gateway") || type.includes("load-balancer") || type.includes("dns") || type.includes("cdn") || type.includes("router")) {
      return "network";
    }
    if (type.includes("third-party") || type.includes("external") || type.includes("stripe") || type.includes("twilio")) {
      return "external_api";
    }
    if (categoryId.includes("data") || categoryId.includes("persistence")) {
      return "database";
    }

    return "compute";
  }

  /**
   * Sizing calculations for Compute Services.
   * Accounts for Amdahl's scaling efficiency (not assuming 100% linear scale-out).
   */
  public static evaluateComputeSizing(
    node: BaseNode,
    peakDemandRps: number,
    baseCapacityPerInstance?: number
  ): SizingRecommendationResult {
    const data = (node.data || {}) as Record<string, unknown>;
    const currentInstances = Math.max(1, Number(data.replicas || 1));
    const scalingEfficiency = Number(data.scalingEfficiency) || 0.85; // 85% default efficiency

    if (!baseCapacityPerInstance && !data.maxRps && !data.capacityRps) {
      return {
        scalingEfficiency,
        notes: "Undeclared per-instance capacity; instance sizing requires explicit capacity configuration.",
      };
    }

    const perInstanceRps = baseCapacityPerInstance || Number(data.maxRps || data.capacityRps || 200);

    // Effective cluster capacity with non-linear scaling overhead
    const effectiveCapacity = Math.round(perInstanceRps * Math.pow(currentInstances, scalingEfficiency));

    // Required instances to safely satisfy peak demand with 15% headroom buffer
    const targetDemand = peakDemandRps * 1.15;
    const requiredInstances = Math.max(
      currentInstances,
      Math.ceil(Math.pow(targetDemand / perInstanceRps, 1 / scalingEfficiency))
    );

    return {
      currentCapacityRps: effectiveCapacity,
      recommendedInstancesCount: requiredInstances,
      scalingEfficiency,
      notes: `Evaluated with ${Math.round(scalingEfficiency * 100)}% scaling efficiency. Cluster requires ${requiredInstances} instances for peak demand.`,
    };
  }

  /**
   * Sizing calculations for Databases.
   * Explicitly distinguishes read capacity (scaleable via replicas) from write capacity (primary bound).
   */
  public static evaluateDatabaseSizing(
    node: BaseNode,
    readDemandRps: number,
    writeDemandRps: number
  ): SizingRecommendationResult {
    const data = (node.data || {}) as Record<string, unknown>;
    const maxWriteRps = Number(data.maxWriteRps ?? (data.maxRps ? Number(data.maxRps) * 0.3 : 300));
    const maxReadRpsPerInstance = Number(data.maxReadRps ?? (data.maxRps ? Number(data.maxRps) * 0.7 : 700));
    const readReplicas = Math.max(0, Number(data.readOnlyReplicas || 0));

    const totalReadCapacity = maxReadRpsPerInstance * (1 + readReplicas);
    const totalWriteCapacity = maxWriteRps; // Note: Read replicas NEVER increase primary write capacity!

    let notes = `Database read capacity: ${totalReadCapacity} RPS, write capacity: ${totalWriteCapacity} RPS.`;

    if (writeDemandRps > totalWriteCapacity) {
      notes += ` [CRITICAL] Primary write demand (${Math.round(writeDemandRps)} RPS) exceeds single-instance write throughput limit (${totalWriteCapacity} RPS). Partitioning or queue decoupling required; read replicas will not resolve write saturation.`;
    }

    const requiredReadReplicas = Math.ceil(Math.max(0, readDemandRps - maxReadRpsPerInstance) / maxReadRpsPerInstance);

    return {
      currentCapacityRps: totalReadCapacity + totalWriteCapacity,
      recommendedInstancesCount: 1 + requiredReadReplicas,
      scalingEfficiency: 0.9,
      notes,
    };
  }

  /**
   * Sizing calculations for Queues and Asynchronous Worker Pools.
   */
  public static evaluateQueueWorkerSizing(
    queueNode: BaseNode,
    arrivalRateMsgPerSec: number,
    processingDurationMs = 25
  ): SizingRecommendationResult {
    const data = (queueNode.data || {}) as Record<string, unknown>;
    const workersCount = Math.max(1, Number(data.workers || data.replicas || 2));
    const duration = Number(data.processingTimeMs) || processingDurationMs;

    const perWorkerThroughput = 1000 / Math.max(1, duration);
    const totalProcessingCapacity = Math.round(workersCount * perWorkerThroughput);

    const requiredWorkers = Math.ceil(arrivalRateMsgPerSec / perWorkerThroughput);

    let notes = `Queue workers (${workersCount}) support ${totalProcessingCapacity} msg/sec at ${duration}ms processing duration.`;
    if (arrivalRateMsgPerSec > totalProcessingCapacity) {
      notes += ` [WARNING] Sustained arrival rate (${Math.round(arrivalRateMsgPerSec)} msg/sec) exceeds processing capacity. Backlog will accumulate continuously unless scaled to ${requiredWorkers} workers.`;
    }

    return {
      currentCapacityRps: totalProcessingCapacity,
      recommendedInstancesCount: Math.max(workersCount, requiredWorkers),
      scalingEfficiency: 0.95,
      notes,
    };
  }

  /**
   * Evaluates network bandwidth requirements in Mbps.
   */
  public static calculateBandwidthDemand(
    demandRps: number,
    avgRequestSizeBytes = 2048,
    avgResponseSizeBytes = 8192
  ): number {
    const totalBytesPerSec = demandRps * (avgRequestSizeBytes + avgResponseSizeBytes);
    // Convert to Megabits per second (8 bits / 1,000,000 bits per Mbit)
    return Math.round((totalBytesPerSec * 8) / 1_000_000 * 10) / 10;
  }
}
