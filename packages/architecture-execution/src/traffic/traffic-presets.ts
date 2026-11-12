import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { TrafficScenario } from "./traffic-schemas";

export type TrafficPresetId =
  | "low_steady_traffic"
  | "moderate_steady_traffic"
  | "sudden_traffic_spike"
  | "gradual_ramp_up"
  | "flash_sale"
  | "api_overload"
  | "slow_database"
  | "queue_saturation"
  | "autoscaling_recovery"
  | "retry_amplification";

export interface TrafficPresetInfo {
  id: TrafficPresetId;
  name: string;
  description: string;
  category: "Steady State" | "Burst & Spike" | "Protection & Scaling" | "Bottleneck";
  workloadSummary: string;
  keyObservation: string;
}

export const TRAFFIC_PRESET_DEFINITIONS: TrafficPresetInfo[] = [
  {
    id: "low_steady_traffic",
    name: "Low Steady Traffic (50 RPS)",
    description: "Predictable, low-volume steady state traffic well within baseline service capacity.",
    category: "Steady State",
    workloadSummary: "Constant 50 req/s arrival rate",
    keyObservation: "Low worker utilization (<30%), 0 queueing delay, flat P95 latency.",
  },
  {
    id: "moderate_steady_traffic",
    name: "Moderate Enterprise Load (250 RPS)",
    description: "Realistic multi-instance production workload testing load balancing across instances.",
    category: "Steady State",
    workloadSummary: "Constant 250 req/s arrival rate",
    keyObservation: "Balanced load distribution across 3 instances, 60% worker occupancy.",
  },
  {
    id: "sudden_traffic_spike",
    name: "Sudden Traffic Spike (80 ➔ 750 RPS)",
    description: "Traffic abruptly jumps by 10x during virtual time t=3s to t=7s, stressing queues.",
    category: "Burst & Spike",
    workloadSummary: "80 req/s baseline, 750 req/s burst for 4000ms",
    keyObservation: "Worker occupancy reaches 100%, queue depth swells, P95 latency spikes.",
  },
  {
    id: "gradual_ramp_up",
    name: "Gradual Ramp-Up (20 ➔ 600 RPS)",
    description: "Continuously increasing demand over 15 seconds to identify the exact saturation point.",
    category: "Burst & Spike",
    workloadSummary: "Linear ramp from 20 to 600 req/s over 15s",
    keyObservation: "Pinpoints transition from sub-saturated linear throughput to saturated queueing.",
  },
  {
    id: "flash_sale",
    name: "Flash Sale Tsunami (1,500 RPS)",
    description: "Extreme arrival surge exceeding worker pools and queue limits, triggering rejections.",
    category: "Burst & Spike",
    workloadSummary: "100 req/s baseline, 1,500 req/s flash surge",
    keyObservation: "Queue overflow leads to deterministic admissions drops; highlights need for rate limiting.",
  },
  {
    id: "api_overload",
    name: "API Gateway Rate Limiter (Token Bucket)",
    description: "Gateway enforces token bucket rate limiting (200 cap, 100 refill/s), rejecting excess calls.",
    category: "Protection & Scaling",
    workloadSummary: "Burst traffic testing gateway bucket exhaustion",
    keyObservation: "Rate limiter sheds load fast with HTTP 429, protecting downstream microservices.",
  },
  {
    id: "slow_database",
    name: "Restricted Database Bottleneck",
    description: "Downstream database instance has only 2 workers, creating an upstream pile-up.",
    category: "Bottleneck",
    workloadSummary: "200 req/s arrival against 80 req/s database capacity",
    keyObservation: "Database identified as critical bottleneck; queue wait time dominates end-to-end latency.",
  },
  {
    id: "queue_saturation",
    name: "Worker Queue Overflow & Backpressure",
    description: "Queue capacity set to 30 requests; sustained arrivals trigger queue_full rejections.",
    category: "Bottleneck",
    workloadSummary: "Incoming arrival rate exceeds dequeue drain rate",
    keyObservation: "Bounded FIFO queues reject excess arrivals with explicit rejection events.",
  },
  {
    id: "autoscaling_recovery",
    name: "Dynamic Autoscaling Recovery (2 ➔ 6 Inst)",
    description: "Load triggers scale-out evaluation; new instances provision after 1500ms delay.",
    category: "Protection & Scaling",
    workloadSummary: "High load triggering scale-out threshold (75%)",
    keyObservation: "Capacity expands from 2 to 6 instances, draining queue backlog and lowering P95 latency.",
  },
  {
    id: "retry_amplification",
    name: "Retry Storm Traffic Amplification",
    description: "Callers retry unadmitted requests rapidly, multiplying total requests hitting the cluster.",
    category: "Bottleneck",
    workloadSummary: "Failed requests trigger immediate re-arrivals",
    keyObservation: "Demonstrates death-spiral amplification when retries lack exponential backoff.",
  },
];

export class TrafficPresetFactory {
  public static createPreset(
    presetId: TrafficPresetId,
    nodes: BaseNode[],
    edges: BaseEdge[]
  ): TrafficScenario {
    return this.createScenario(presetId, nodes, edges);
  }

  /**
   * Intelligently builds a TrafficScenario customized to the given nodes and edges.
   */
  public static createScenario(
    presetId: TrafficPresetId,
    nodes: BaseNode[],
    _edges: BaseEdge[]
  ): TrafficScenario {
    // Discovery
    const findByType = (types: string[]) =>
      nodes.find((n) => {
        const ct = String((n.data as any)?.componentType || n.type || "").toLowerCase();
        return types.some((t) => ct.includes(t));
      });

    const clientOrGateway = findByType(["client", "gateway", "ingress", "input"]) || nodes[0];
    const service = findByType(["service", "worker", "process", "api", "backend"]) || nodes[Math.floor(nodes.length / 2)] || nodes[0];
    const database = findByType(["db", "database", "postgres", "storage", "sql", "output"]) || nodes[nodes.length - 1];

    const entryNodeId = clientOrGateway?.id || "node_entry";
    const serviceNodeId = service?.id || "node_service";
    const dbNodeId = database?.id || "node_database";

    const baseScenario: TrafficScenario = {
      version: 1,
      id: `traffic_${presetId}_${Date.now()}`,
      name: TRAFFIC_PRESET_DEFINITIONS.find((p) => p.id === presetId)?.name || presetId,
      description: TRAFFIC_PRESET_DEFINITIONS.find((p) => p.id === presetId)?.description,
      entryNodeId,
      durationMs: 12000,
      mode: "open_loop",
      workload: { type: "constant", requestsPerSecond: 50 },
      capacities: {},
      rateLimiters: {},
      autoscaling: {},
      seed: 42,
      limits: {
        maxRequests: 3000,
        maxEvents: 10000,
        maxVirtualDurationMs: 40000,
        metricSamplingIntervalMs: 500,
      },
    };

    switch (presetId) {
      case "low_steady_traffic": {
        baseScenario.workload = { type: "constant", requestsPerSecond: 50 };
        baseScenario.capacities[serviceNodeId] = {
          serviceNodeId,
          initialInstances: 2,
          workersPerInstance: 4,
          baseProcessingTimeMs: 40,
          processingDistribution: "constant",
          queueCapacity: 100,
          admissionPolicy: "reject_when_full",
          loadBalancing: "round_robin",
        };
        break;
      }

      case "moderate_steady_traffic": {
        baseScenario.workload = { type: "constant", requestsPerSecond: 250 };
        baseScenario.capacities[serviceNodeId] = {
          serviceNodeId,
          initialInstances: 3,
          workersPerInstance: 4,
          baseProcessingTimeMs: 35,
          processingDistribution: "uniform",
          queueCapacity: 200,
          admissionPolicy: "reject_when_full",
          loadBalancing: "least_active",
        };
        break;
      }

      case "sudden_traffic_spike": {
        baseScenario.workload = {
          type: "burst",
          baselineRps: 80,
          burstRps: 750,
          startAtMs: 3000,
          durationMs: 4000,
        };
        baseScenario.capacities[serviceNodeId] = {
          serviceNodeId,
          initialInstances: 2,
          workersPerInstance: 4,
          baseProcessingTimeMs: 30,
          processingDistribution: "uniform",
          queueCapacity: 300,
          admissionPolicy: "reject_when_full",
          loadBalancing: "least_active",
        };
        break;
      }

      case "gradual_ramp_up": {
        baseScenario.workload = {
          type: "ramp",
          startRps: 20,
          endRps: 600,
          durationMs: 12000,
        };
        baseScenario.capacities[serviceNodeId] = {
          serviceNodeId,
          initialInstances: 2,
          workersPerInstance: 4,
          baseProcessingTimeMs: 35,
          processingDistribution: "constant",
          queueCapacity: 150,
          admissionPolicy: "reject_when_full",
          loadBalancing: "round_robin",
        };
        break;
      }

      case "flash_sale": {
        baseScenario.workload = {
          type: "burst",
          baselineRps: 100,
          burstRps: 1500,
          startAtMs: 2500,
          durationMs: 5000,
        };
        baseScenario.capacities[serviceNodeId] = {
          serviceNodeId,
          initialInstances: 3,
          workersPerInstance: 4,
          baseProcessingTimeMs: 40,
          processingDistribution: "uniform",
          queueCapacity: 80, // tight queue forces drops
          admissionPolicy: "reject_when_full",
          loadBalancing: "least_active",
        };
        break;
      }

      case "api_overload": {
        baseScenario.workload = {
          type: "burst",
          baselineRps: 80,
          burstRps: 600,
          startAtMs: 2000,
          durationMs: 4000,
        };
        baseScenario.rateLimiters[entryNodeId] = {
          nodeId: entryNodeId,
          algorithm: "token_bucket",
          capacity: 150,
          refillRatePerSec: 80,
          windowMs: 1000,
          rejectStatusCode: 429,
        };
        baseScenario.capacities[serviceNodeId] = {
          serviceNodeId,
          initialInstances: 2,
          workersPerInstance: 4,
          baseProcessingTimeMs: 40,
          processingDistribution: "constant",
          queueCapacity: 200,
          admissionPolicy: "reject_when_full",
          loadBalancing: "round_robin",
        };
        break;
      }

      case "slow_database": {
        baseScenario.workload = { type: "constant", requestsPerSecond: 200 };
        baseScenario.capacities[serviceNodeId] = {
          serviceNodeId,
          initialInstances: 4,
          workersPerInstance: 6,
          baseProcessingTimeMs: 20,
          processingDistribution: "constant",
          queueCapacity: 300,
          admissionPolicy: "reject_when_full",
          loadBalancing: "round_robin",
        };
        // Database has very few workers and slower processing time
        baseScenario.capacities[dbNodeId] = {
          serviceNodeId: dbNodeId,
          initialInstances: 1,
          workersPerInstance: 2,
          baseProcessingTimeMs: 80,
          processingDistribution: "exponential",
          queueCapacity: 50,
          admissionPolicy: "reject_when_full",
          loadBalancing: "round_robin",
        };
        break;
      }

      case "queue_saturation": {
        baseScenario.workload = { type: "constant", requestsPerSecond: 400 };
        baseScenario.capacities[serviceNodeId] = {
          serviceNodeId,
          initialInstances: 1,
          workersPerInstance: 2,
          baseProcessingTimeMs: 50,
          processingDistribution: "constant",
          queueCapacity: 25, // very small queue
          admissionPolicy: "reject_when_full",
          loadBalancing: "round_robin",
        };
        break;
      }

      case "autoscaling_recovery": {
        baseScenario.workload = {
          type: "burst",
          baselineRps: 50,
          burstRps: 500,
          startAtMs: 2000,
          durationMs: 7000,
        };
        baseScenario.capacities[serviceNodeId] = {
          serviceNodeId,
          initialInstances: 2,
          workersPerInstance: 3,
          baseProcessingTimeMs: 35,
          processingDistribution: "constant",
          queueCapacity: 250,
          admissionPolicy: "reject_when_full",
          loadBalancing: "least_active",
        };
        baseScenario.autoscaling[serviceNodeId] = {
          serviceNodeId,
          enabled: true,
          minInstances: 2,
          maxInstances: 6,
          scaleOutThresholdPercent: 70,
          scaleInThresholdPercent: 25,
          provisioningDelayMs: 1500,
          cooldownMs: 3000,
        };
        break;
      }

      case "retry_amplification": {
        baseScenario.workload = { type: "constant", requestsPerSecond: 200 };
        baseScenario.capacities[serviceNodeId] = {
          serviceNodeId,
          initialInstances: 1,
          workersPerInstance: 3,
          baseProcessingTimeMs: 40,
          processingDistribution: "constant",
          queueCapacity: 30,
          admissionPolicy: "reject_when_full",
          loadBalancing: "round_robin",
        };
        break;
      }
    }

    return baseScenario;
  }
}
