import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { FailureScenario, FaultDefinition } from "./fault-schemas";

export type ResiliencePresetId =
  | "database_outage"
  | "service_crash"
  | "latency_spike"
  | "disconnection"
  | "packet_loss"
  | "retry_storm"
  | "circuit_breaker"
  | "failover"
  | "consumer_failure"
  | "queue_backlog";

export interface ResiliencePresetInfo {
  id: ResiliencePresetId;
  name: string;
  description: string;
  category: "Component" | "Network" | "Resilience Policy" | "Asynchronous";
  primaryFaultType: string;
  keyObservation: string;
}

export const RESILIENCE_PRESET_DEFINITIONS: ResiliencePresetInfo[] = [
  {
    id: "database_outage",
    name: "Primary Database Outage",
    description: "Primary database crashes; downstream transactions fail fast or timeout, testing application persistence resilience.",
    category: "Component",
    primaryFaultType: "component.outage",
    keyObservation: "Observe cascading read/write timeouts, caller 500 errors, and connection pool exhaustion.",
  },
  {
    id: "service_crash",
    name: "Downstream Service Crash",
    description: "Microservice abruptly terminates; upstream callers encounter connection refused (RST) and trigger retries.",
    category: "Component",
    primaryFaultType: "service.connection_refused",
    keyObservation: "Upstream services execute exponential backoff retries to absorb transient downtime.",
  },
  {
    id: "latency_spike",
    name: "Inter-Service Latency Spike",
    description: "Network transit link experiences an 800ms delay spike, violating upstream SLA deadlines and causing request timeouts.",
    category: "Network",
    primaryFaultType: "network.latency",
    keyObservation: "Requests exceed virtual deadline threshold (1200ms) resulting in timeout aborts.",
  },
  {
    id: "disconnection",
    name: "Network Partition / Disconnection",
    description: "Transit link completely severed between gateway and upstream services, testing partition tolerance.",
    category: "Network",
    primaryFaultType: "network.disconnected",
    keyObservation: "Traversals immediately fail with network_disconnected status without reaching target.",
  },
  {
    id: "packet_loss",
    name: "50% Network Packet Loss",
    description: "Unstable network link drops half of all packets, triggering retransmissions and jittered delays.",
    category: "Network",
    primaryFaultType: "network.packet_loss",
    keyObservation: "Deterministic packet drops cause retry loops until packet succeeds or attempts exhaust.",
  },
  {
    id: "retry_storm",
    name: "Unbounded Retry Storm",
    description: "Upstream clients retry rapidly without exponential backoff or jitter, overwhelming target capacity.",
    category: "Resilience Policy",
    primaryFaultType: "service.transient_failure",
    keyObservation: "Simultaneous retries amplify load on degraded components, illustrating retry storm hazards.",
  },
  {
    id: "circuit_breaker",
    name: "3-State Circuit Breaker Trip & Probe",
    description: "Downstream errors trip the circuit to OPEN (fast-failing subsequent calls) before testing with a HALF-OPEN probe.",
    category: "Resilience Policy",
    primaryFaultType: "component.degraded",
    keyObservation: "After 3 failures, circuit transitions from CLOSED -> OPEN -> HALF-OPEN -> CLOSED upon recovery.",
  },
  {
    id: "failover",
    name: "Automated Standby Failover",
    description: "Primary service becomes unavailable; failover routing dynamically diverts traffic to healthy standby replica.",
    category: "Resilience Policy",
    primaryFaultType: "component.outage",
    keyObservation: "Zero downtime achieved as callers switch seamlessly from primary to secondary route.",
  },
  {
    id: "consumer_failure",
    name: "Queue Consumer Worker Crash",
    description: "Worker node processing queue messages goes offline; incoming messages queue up indefinitely.",
    category: "Asynchronous",
    primaryFaultType: "consumer.unavailable",
    keyObservation: "Message queue backlog accumulates in runtime state without ACKs or delivery.",
  },
  {
    id: "queue_backlog",
    name: "Poison Pill / DLQ Processing Failure",
    description: "Consumer encounters poison pill message; repeated processing failures route message to Dead Letter Queue (DLQ).",
    category: "Asynchronous",
    primaryFaultType: "consumer.processing_failure",
    keyObservation: "Failed message reaches max delivery attempts and is routed to DLQ with deadlettered event.",
  },
];

export class ResiliencePresetFactory {
  /**
   * Intelligently creates a FailureScenario tailored to the given nodes and edges.
   */
  public static createScenario(
    presetId: ResiliencePresetId,
    nodes: BaseNode[],
    edges: BaseEdge[]
  ): FailureScenario {
    // Component discovery helpers
    const findByType = (types: string[]) =>
      nodes.find((n) => {
        const ct = String((n.data as any)?.componentType || n.type || "").toLowerCase();
        return types.some((t) => ct.includes(t));
      });

    const dbNode = findByType(["db", "database", "postgres", "storage", "sql", "output"]) || nodes[nodes.length - 1];
    const serviceNode = findByType(["service", "worker", "process", "api", "backend"]) || nodes[Math.floor(nodes.length / 2)] || nodes[0];
    const clientOrGatewayNode = findByType(["client", "gateway", "ingress", "input"]) || nodes[0];
    const secondaryServiceNode = nodes.find((n) => n.id !== serviceNode?.id && n.id !== clientOrGatewayNode?.id) || serviceNode;
    const targetEdge = edges[0] || { id: "edge_default", source: clientOrGatewayNode?.id || "node_1", target: serviceNode?.id || "node_2" };

    const baseScenario: FailureScenario = {
      version: 1,
      id: `resilience_${presetId}_preset`,
      name: RESILIENCE_PRESET_DEFINITIONS.find((p) => p.id === presetId)?.name || presetId,
      description: RESILIENCE_PRESET_DEFINITIONS.find((p) => p.id === presetId)?.description,
      seed: 42,
      faults: [],
      recoveryPolicies: [],
      retryPolicies: {},
      circuitBreakers: {},
      failoverPolicies: {},
      healthChecks: {},
      limits: {
        maxEvents: 350,
        maxVirtualDurationMs: 45000,
        maxRetryAttempts: 3,
      },
    };

    switch (presetId) {
      case "database_outage": {
        const targetId = dbNode?.id || "db_primary";
        const fault: FaultDefinition = {
          id: `fault_db_outage_preset`,
          name: "PostgreSQL Database Engine Crash",
          type: "component.outage",
          target: { type: "node", targetId, targetLabel: dbNode?.label || targetId },
          startAtMs: 250,
          durationMs: 8000,
          parameters: { reason: "Kernel OOM Killer terminated PostgreSQL process" },
        };
        baseScenario.faults = [fault];
        baseScenario.recoveryPolicies = [
          {
            faultId: fault.id,
            type: "auto_duration",
            durationMs: 8000,
          },
        ];
        break;
      }

      case "service_crash": {
        const targetId = serviceNode?.id || "service_target";
        const fault: FaultDefinition = {
          id: `fault_svc_crash_preset`,
          name: "Microservice Process Crash (RST)",
          type: "service.connection_refused",
          target: { type: "node", targetId, targetLabel: serviceNode?.label || targetId, port: 8080 },
          startAtMs: 150,
          durationMs: 5000,
          parameters: { reason: "Uncaught fatal exception; socket closed" },
        };
        baseScenario.faults = [fault];
        baseScenario.retryPolicies[clientOrGatewayNode?.id || "caller"] = {
          maxAttempts: 3,
          strategy: "exponential",
          initialDelayMs: 200,
          maxDelayMs: 2000,
          multiplier: 2,
          jitter: true,
          retryableFailures: ["connection_refused", "timeout", "503"],
          idempotent: false,
        };
        break;
      }

      case "latency_spike": {
        const edgeId = targetEdge.id;
        const fault: FaultDefinition = {
          id: `fault_latency_spike_preset`,
          name: "Cross-AZ Fiber Congestion (+800ms)",
          type: "network.latency",
          target: { type: "edge", targetId: edgeId, targetLabel: `Edge ${edgeId}` },
          startAtMs: 100,
          durationMs: 6000,
          parameters: { additionalLatencyMs: 850, jitterMs: 50 },
        };
        const timeoutFault: FaultDefinition = {
          id: `fault_req_timeout_preset`,
          name: "Upstream SLA Deadline Enforced (1200ms)",
          type: "request.timeout",
          target: { type: "node", targetId: clientOrGatewayNode?.id || "caller" },
          startAtMs: 0,
          parameters: { deadlineMs: 1200, cancelDownstream: true },
        };
        baseScenario.faults = [fault, timeoutFault];
        break;
      }

      case "disconnection": {
        const edgeId = targetEdge.id;
        const fault: FaultDefinition = {
          id: `fault_partition_preset`,
          name: "Inter-VPC Network Partition",
          type: "network.disconnected",
          target: { type: "edge", targetId: edgeId, targetLabel: `Edge ${edgeId}` },
          startAtMs: 150,
          durationMs: 7500,
          parameters: { bidirectional: true, reason: "BGP route flap severed tunnel" },
        };
        baseScenario.faults = [fault];
        break;
      }

      case "packet_loss": {
        const edgeId = targetEdge.id;
        const fault: FaultDefinition = {
          id: `fault_packet_loss_preset`,
          name: "Unstable Link 50% Packet Drop",
          type: "network.packet_loss",
          target: { type: "edge", targetId: edgeId, targetLabel: `Edge ${edgeId}` },
          startAtMs: 0,
          durationMs: 10000,
          parameters: { lossRate: 0.5, mode: "both" },
        };
        baseScenario.faults = [fault];
        baseScenario.retryPolicies[clientOrGatewayNode?.id || "caller"] = {
          maxAttempts: 4,
          strategy: "exponential",
          initialDelayMs: 100,
          maxDelayMs: 1500,
          multiplier: 1.5,
          jitter: true,
          retryableFailures: ["packet_loss", "timeout"],
          idempotent: false,
        };
        break;
      }

      case "retry_storm": {
        const targetId = serviceNode?.id || "service_target";
        const fault: FaultDefinition = {
          id: `fault_transient_preset`,
          name: "Temporary Rate Limiter Throttling (429/503)",
          type: "service.transient_failure",
          target: { type: "node", targetId, targetLabel: serviceNode?.label || targetId },
          startAtMs: 100,
          durationMs: 6000,
          parameters: { failureCount: 4, errorStatus: 503 },
        };
        baseScenario.faults = [fault];
        baseScenario.retryPolicies[clientOrGatewayNode?.id || "caller"] = {
          maxAttempts: 5,
          strategy: "fixed",
          initialDelayMs: 50,
          maxDelayMs: 100,
          multiplier: 1,
          jitter: false, // No jitter causes synchronized retry storm
          retryableFailures: ["503", "service_transient", "timeout"],
          idempotent: false,
        };
        break;
      }

      case "circuit_breaker": {
        const targetId = serviceNode?.id || "service_target";
        const fault: FaultDefinition = {
          id: `fault_degraded_preset`,
          name: "Dependency Degradation & 500 Spike",
          type: "component.degraded",
          target: { type: "node", targetId, targetLabel: serviceNode?.label || targetId },
          startAtMs: 100,
          durationMs: 4000,
          parameters: { latencyMultiplier: 4, errorRate: 0.9, capacityPercent: 20 },
        };
        baseScenario.faults = [fault];
        baseScenario.circuitBreakers[targetId] = {
          targetNodeId: targetId,
          failureThreshold: 3,
          observationWindowMs: 10000,
          openDurationMs: 3000,
          halfOpenProbeLimit: 1,
          successThreshold: 2,
          fallbackAction: "fail_fast",
          fallbackMessage: "Fast fail: Circuit breaker open on target microservice",
        };
        break;
      }

      case "failover": {
        const primaryId = serviceNode?.id || "primary_service";
        const secondaryId = secondaryServiceNode?.id !== primaryId ? secondaryServiceNode.id : "replica_service";
        const fault: FaultDefinition = {
          id: `fault_primary_outage_preset`,
          name: "Primary Host Hard Failure",
          type: "component.outage",
          target: { type: "node", targetId: primaryId, targetLabel: serviceNode?.label || primaryId },
          startAtMs: 100,
          durationMs: 9000,
          parameters: { reason: "Hardware motherboard panic" },
        };
        baseScenario.faults = [fault];
        baseScenario.failoverPolicies[primaryId] = {
          primaryTargetId: primaryId,
          secondaryTargetIds: [secondaryId],
          eligibilityConditions: ["target.healthy"],
          healthCheckRequired: false,
          maxFailoverAttempts: 2,
          recoveryPreference: "revert_to_primary",
        };
        break;
      }

      case "consumer_failure": {
        const workerId = serviceNode?.id || "queue_worker";
        const fault: FaultDefinition = {
          id: `fault_worker_offline_preset`,
          name: "Asynchronous Worker Node Offline",
          type: "consumer.unavailable",
          target: { type: "consumer", targetId: workerId, targetLabel: serviceNode?.label || workerId },
          startAtMs: 100,
          durationMs: 12000,
          parameters: { reason: "Worker pod evicted by Kubernetes scheduler" },
        };
        baseScenario.faults = [fault];
        break;
      }

      case "queue_backlog": {
        const workerId = serviceNode?.id || "queue_worker";
        const fault: FaultDefinition = {
          id: `fault_poison_pill_preset`,
          name: "Poison Pill Exception (Dead-Letter Routing)",
          type: "consumer.processing_failure",
          target: { type: "consumer", targetId: workerId, targetLabel: serviceNode?.label || workerId },
          startAtMs: 150,
          durationMs: 8000,
          parameters: { nack: true, requeue: false, reason: "Malformed serialized payload schema" },
        };
        baseScenario.faults = [fault];
        break;
      }
    }

    return baseScenario;
  }
}
