import type { ObservabilityScenario } from "./observability-schemas";

export interface ObservabilityPresetMeta {
  id: ObservabilityPresetId;
  label: string;
  description: string;
  category:
    | "telemetry"
    | "infrastructure"
    | "reliability"
    | "incidents";
}

export type ObservabilityPresetId =
  | "healthy_baseline"
  | "high_request_latency"
  | "increased_error_rate"
  | "cpu_saturation"
  | "memory_pressure"
  | "queue_saturation"
  | "database_slowdown"
  | "cache_failure"
  | "network_partition"
  | "dns_resolution_failure"
  | "cdn_origin_failure"
  | "kafka_consumer_lag"
  | "k8s_pod_crash"
  | "service_mesh_retry_storm"
  | "circuit_breaker_activation"
  | "distributed_tx_blocking"
  | "storage_replica_lag"
  | "rate_limit_rejection_spike"
  | "load_shedding_incident"
  | "deployment_regression"
  | "slo_breach"
  | "error_budget_burn"
  | "alert_flapping"
  | "missing_telemetry"
  | "trace_sampling_gap"
  | "multi_service_cascading_failure"
  | "root_cause_investigation"
  | "successful_mitigation"
  | "incomplete_recovery"
  | "incident_postmortem";

export const OBS_PRESET_METADATA: ObservabilityPresetMeta[] = [
  {
    id: "healthy_baseline",
    label: "Healthy Baseline",
    description: "Checkout, Inventory, and Payment services operate within SLO targets.",
    category: "telemetry",
  },
  {
    id: "high_request_latency",
    label: "High Request Latency",
    description: "Tail latency spike in Payment triggers latency alert and trace exemplars.",
    category: "telemetry",
  },
  {
    id: "increased_error_rate",
    label: "Increased Error Rate",
    description: "5xx error surge violates error-rate alert and correlates structured ERROR logs.",
    category: "telemetry",
  },
  {
    id: "cpu_saturation",
    label: "CPU Saturation",
    description: "Compute pool hits >90% CPU saturation causing USE metric alerts and queueing.",
    category: "infrastructure",
  },
  {
    id: "memory_pressure",
    label: "Memory Pressure",
    description: "Heap utilization climbs toward OOM threshold degrading Inventory latency.",
    category: "infrastructure",
  },
  {
    id: "queue_saturation",
    label: "Async Queue Saturation",
    description: "Worker queue backlog grows, delaying async consumer span links.",
    category: "infrastructure",
  },
  {
    id: "database_slowdown",
    label: "Database Slowdown Cascade",
    description: "Payment DB latency spike cascades upward into Checkout SLO violation.",
    category: "incidents",
  },
  {
    id: "cache_failure",
    label: "Cache Failure Stampede",
    description: "Cache outage pushes cache-miss load directly onto Inventory DB.",
    category: "infrastructure",
  },
  {
    id: "network_partition",
    label: "Network Partition",
    description: "Inter-zone link split isolates Payment from Checkout.",
    category: "infrastructure",
  },
  {
    id: "dns_resolution_failure",
    label: "DNS Resolution Failure",
    description: "Edge DNS lookup failures fail upstream requests before reaching backend.",
    category: "infrastructure",
  },
  {
    id: "cdn_origin_failure",
    label: "CDN Origin Failure",
    description: "Origin timeout causes edge cache misses to fail.",
    category: "infrastructure",
  },
  {
    id: "kafka_consumer_lag",
    label: "Kafka Consumer Lag",
    description: "Async broker offset lag delays consumer span completion.",
    category: "infrastructure",
  },
  {
    id: "k8s_pod_crash",
    label: "Kubernetes Pod CrashLoop",
    description: "Pod crash spikes errors until simulated restart mitigation stabilizes.",
    category: "infrastructure",
  },
  {
    id: "service_mesh_retry_storm",
    label: "Service Mesh Retry Storm",
    description: "Retries multiply request rate against struggling Payment dependency.",
    category: "incidents",
  },
  {
    id: "circuit_breaker_activation",
    label: "Circuit Breaker Activation",
    description: "Open breaker fast-fails calls cleanly with isolated error logs.",
    category: "incidents",
  },
  {
    id: "distributed_tx_blocking",
    label: "Distributed Tx Blocking",
    description: "Uncertain 2PC participant holds locks, spiking downstream wait spans.",
    category: "incidents",
  },
  {
    id: "storage_replica_lag",
    label: "Storage Replica Lag",
    description: "Stale follower replica lag degrades freshness SLI.",
    category: "infrastructure",
  },
  {
    id: "rate_limit_rejection_spike",
    label: "Rate Limit Rejection Spike",
    description: "Token exhaustion triggers 429 burst visible cleanly in edge telemetry.",
    category: "telemetry",
  },
  {
    id: "load_shedding_incident",
    label: "Load Shedding Incident",
    description: "Admitted critical spans stay healthy while background load is shed.",
    category: "incidents",
  },
  {
    id: "deployment_regression",
    label: "Deployment Version Regression",
    description: "New deployment introduces 40% error regression until simulated rollback.",
    category: "incidents",
  },
  {
    id: "slo_breach",
    label: "Availability SLO Breach",
    description: "Sustained errors push rolling availability below 99% SLO target.",
    category: "reliability",
  },
  {
    id: "error_budget_burn",
    label: "Rapid Error Budget Burn",
    description: "High burn-rate alert fires before full window exhaustion.",
    category: "reliability",
  },
  {
    id: "alert_flapping",
    label: "Threshold Alert Flapping",
    description: "Oscillating failure bursts demonstrate repeated FIRING/RESOLVED noise.",
    category: "reliability",
  },
  {
    id: "missing_telemetry",
    label: "Collector Outage / Missing Telemetry",
    description: "Collector gap invokes explicit no_data / retain_previous policy without zeroing metrics.",
    category: "reliability",
  },
  {
    id: "trace_sampling_gap",
    label: "Head Sampling Blind Spot",
    description: "Low 20% head sampling hides rare errors from trace list unless full logs inspected.",
    category: "telemetry",
  },
  {
    id: "multi_service_cascading_failure",
    label: "Multi-Service Cascading Failure",
    description: "Root fault in Payment DB propagates across Payment, Inventory, and Checkout.",
    category: "incidents",
  },
  {
    id: "root_cause_investigation",
    label: "Investigation vs Explanation Mode",
    description: "Starts in Investigation Mode hiding injected fault origin until toggled to Explanation.",
    category: "incidents",
  },
  {
    id: "successful_mitigation",
    label: "Successful Mitigation & Verification",
    description: "Restart/rollback mitigation restores metrics, resolves alert, and closes incident.",
    category: "incidents",
  },
  {
    id: "incomplete_recovery",
    label: "Incomplete Recovery Warning",
    description: "Partial mitigation reduces errors temporarily without resolving underlying DB latency.",
    category: "incidents",
  },
  {
    id: "incident_postmortem",
    label: "Automated Fact-Only Postmortem",
    description: "Full incident lifecycle compiled into structured postmortem without fabricated claims.",
    category: "incidents",
  },
];

export function createObservabilityPresetScenario(
  presetId: ObservabilityPresetId
): ObservabilityScenario {
  const base: ObservabilityScenario = {
    version: 1,
    id: presetId,
    presetId,
    label: OBS_PRESET_METADATA.find((p) => p.id === presetId)?.label ?? presetId,
    architectureRevisionId: "rev_001",
    simulationRunId: `run_${presetId}`,
    seed: 42,
    investigationMode: "investigation",
    telemetry: {
      samplingMode: "none",
      samplingRate: 1,
      tailSlowThresholdMs: 110,
      logRetentionLimit: 300,
      droppedLogRate: 0,
      delayedMetricMs: 0,
    },
    services: [
      {
        id: "checkout",
        label: "Checkout API",
        kind: "gateway",
        region: "us-east-1",
        zone: "az-1",
        version: "v2.3.0",
        capacityRps: 100,
        dependencies: [
          { targetId: "inventory", type: "sync", baseLatencyMs: 22, errorRateBase: 0 },
          { targetId: "payment", type: "sync", baseLatencyMs: 30, errorRateBase: 0 },
          { targetId: "order-events", type: "async", baseLatencyMs: 12, errorRateBase: 0 },
        ],
      },
      {
        id: "inventory",
        label: "Inventory Service",
        kind: "service",
        region: "us-east-1",
        zone: "az-2",
        version: "v1.9.1",
        capacityRps: 120,
        dependencies: [
          { targetId: "cache-redis", type: "storage", baseLatencyMs: 6, errorRateBase: 0 },
        ],
      },
      {
        id: "cache-redis",
        label: "Inventory Cache",
        kind: "cache",
        region: "us-east-1",
        zone: "az-2",
        version: "v7.2",
        capacityRps: 400,
        dependencies: [],
      },
      {
        id: "payment",
        label: "Payment Service",
        kind: "service",
        region: "us-east-1",
        zone: "az-1",
        version: "v3.1.0",
        capacityRps: 90,
        dependencies: [
          { targetId: "payment-db", type: "storage", baseLatencyMs: 25, errorRateBase: 0 },
        ],
      },
      {
        id: "payment-db",
        label: "Payment DB",
        kind: "database",
        region: "us-east-1",
        zone: "az-1",
        version: "pg16",
        capacityRps: 150,
        dependencies: [],
      },
      {
        id: "order-events",
        label: "Order Broker",
        kind: "broker",
        region: "us-east-1",
        zone: "az-3",
        version: "kafka-3",
        capacityRps: 300,
        dependencies: [],
      },
    ],
    entryServiceId: "checkout",
    traffic: {
      requestsPerSecond: 20,
      startAtMs: 0,
      endAtMs: 700,
    },
    faults: [],
    mitigations: [],
    slos: [
      {
        id: "slo-checkout-avail",
        name: "Checkout 99% Availability",
        sliType: "availability",
        targetServiceId: "checkout",
        target: 0.99,
        windowMs: 1000,
        windowType: "rolling",
      },
      {
        id: "slo-checkout-lat",
        name: "Checkout <120ms Latency",
        sliType: "latency",
        targetServiceId: "checkout",
        target: 0.95,
        latencyThresholdMs: 120,
        windowMs: 1000,
        windowType: "rolling",
      },
    ],
    alerts: [
      {
        id: "alert-checkout-err",
        name: "Checkout Error Rate > 5%",
        serviceId: "checkout",
        metric: "error_rate",
        operator: ">",
        threshold: 0.05,
        evaluationIntervalMs: 80,
        pendingDurationMs: 0,
        recoveryDurationMs: 80,
        missingDataPolicy: "no_data",
      },
      {
        id: "alert-payment-lat",
        name: "Payment p95 Latency > 100ms",
        serviceId: "payment",
        metric: "p95_latency_ms",
        operator: ">",
        threshold: 100,
        evaluationIntervalMs: 80,
        pendingDurationMs: 0,
        recoveryDurationMs: 80,
        missingDataPolicy: "no_data",
      },
    ],
    limits: {
      maxTraces: 250,
      maxSpans: 2000,
      maxLogs: 600,
      maxMetricPoints: 500,
      maxIncidents: 10,
      maxEvents: 2500,
      maxVirtualDurationMs: 2500,
    },
  };

  switch (presetId) {
    case "healthy_baseline":
      return base;

    case "high_request_latency":
    case "database_slowdown":
    case "multi_service_cascading_failure":
    case "root_cause_investigation":
      base.faults = [
        {
          id: "f-db-slow",
          type: "latency_spike",
          targetServiceId: "payment-db",
          atMs: 120,
          latencyMultiplier: 6,
          errorRate: 0.25,
          saturationPct: 92,
          description: "Payment DB lock contention adds 6x query latency",
        },
      ];
      return base;

    case "increased_error_rate":
    case "slo_breach":
    case "error_budget_burn":
      base.faults = [
        {
          id: "f-pay-err",
          type: "error_surge",
          targetServiceId: "payment",
          atMs: 100,
          latencyMultiplier: 2,
          errorRate: 0.55,
          saturationPct: 78,
          description: "Payment service throws downstream 503 exceptions",
        },
      ];
      return base;

    case "cpu_saturation":
    case "memory_pressure":
      base.faults = [
        {
          id: "f-sat",
          type: presetId === "cpu_saturation" ? "cpu_saturation" : "memory_pressure",
          targetServiceId: "inventory",
          atMs: 120,
          latencyMultiplier: 4,
          errorRate: 0.2,
          saturationPct: 96,
          description: `${presetId === "cpu_saturation" ? "CPU" : "Memory"} pressure saturates Inventory workers`,
        },
      ];
      return base;

    case "queue_saturation":
    case "kafka_consumer_lag":
      base.faults = [
        {
          id: "f-broker",
          type: presetId === "queue_saturation" ? "queue_backlog" : "consumer_lag",
          targetServiceId: "order-events",
          atMs: 100,
          latencyMultiplier: 8,
          errorRate: 0.15,
          saturationPct: 91,
          description: "Async broker backlog increases consumer delay",
        },
      ];
      return base;

    case "cache_failure":
      base.faults = [
        {
          id: "f-cache",
          type: "error_surge",
          targetServiceId: "cache-redis",
          atMs: 110,
          latencyMultiplier: 5,
          errorRate: 0.7,
          saturationPct: 95,
          description: "Inventory cache unavailable; read amplification hits Inventory",
        },
      ];
      return base;

    case "network_partition":
    case "dns_resolution_failure":
    case "cdn_origin_failure":
      base.faults = [
        {
          id: "f-net",
          type:
            presetId === "network_partition"
              ? "network_partition"
              : presetId === "dns_resolution_failure"
                ? "dns_failure"
                : "cdn_origin_fail",
          targetServiceId: presetId === "network_partition" ? "payment" : "checkout",
          atMs: 100,
          latencyMultiplier: 4,
          errorRate: 0.85,
          saturationPct: 60,
          description: "Connectivity failure between caller and target dependency",
        },
      ];
      return base;

    case "k8s_pod_crash":
      base.faults = [
        {
          id: "f-pod",
          type: "pod_crash",
          targetServiceId: "inventory",
          atMs: 100,
          durationMs: 280,
          latencyMultiplier: 3,
          errorRate: 0.65,
          saturationPct: 88,
          description: "Inventory pod crash loop until restart",
        },
      ];
      base.mitigations = [
        {
          id: "mit-restart",
          atMs: 380,
          action: "restart_component",
          targetServiceId: "inventory",
          description: "Simulated Kubernetes pod rollout/restart cleared crash loop",
        },
      ];
      return base;

    case "service_mesh_retry_storm":
    case "circuit_breaker_activation":
    case "distributed_tx_blocking":
    case "storage_replica_lag":
    case "rate_limit_rejection_spike":
    case "load_shedding_incident":
    case "deployment_regression":
      base.faults = [
        {
          id: `f-${presetId}`,
          type:
            presetId === "deployment_regression"
              ? "deploy_regression"
              : presetId === "storage_replica_lag"
                ? "replica_lag"
                : presetId === "rate_limit_rejection_spike"
                  ? "rate_limit_spike"
                  : presetId === "load_shedding_incident"
                    ? "load_shed"
                    : "error_surge",
          targetServiceId: "payment",
          atMs: 100,
          latencyMultiplier: 4,
          errorRate: 0.45,
          saturationPct: 85,
          description: `${base.label} fault active on Payment`,
        },
      ];
      if (presetId === "deployment_regression") {
        base.mitigations = [
          {
            id: "mit-rollback",
            atMs: 380,
            action: "rollback_deploy",
            targetServiceId: "payment",
            description: "Rolled back Payment v3.1.0 regression",
          },
        ];
      }
      return base;

    case "alert_flapping":
      base.alerts[0]!.pendingDurationMs = 0;
      base.alerts[0]!.recoveryDurationMs = 0;
      base.faults = [
        {
          id: "f-flap-1",
          type: "error_surge",
          targetServiceId: "payment",
          atMs: 60,
          durationMs: 90,
          latencyMultiplier: 2,
          errorRate: 0.7,
          saturationPct: 80,
          description: "Intermittent burst 1",
        },
        {
          id: "f-flap-2",
          type: "error_surge",
          targetServiceId: "payment",
          atMs: 380,
          durationMs: 120,
          latencyMultiplier: 2,
          errorRate: 0.7,
          saturationPct: 80,
          description: "Intermittent burst 2 causes alert re-fire",
        },
      ];
      return base;

    case "missing_telemetry":
      base.telemetry.collectorOutageWindow = { startAtMs: 180, endAtMs: 420 };
      base.alerts[0]!.missingDataPolicy = "no_data";
      base.faults = [
        {
          id: "f-miss-err",
          type: "error_surge",
          targetServiceId: "payment",
          atMs: 100,
          latencyMultiplier: 2,
          errorRate: 0.4,
          saturationPct: 70,
          description: "Error surge masked mid-run by telemetry collector outage",
        },
      ];
      return base;

    case "trace_sampling_gap":
      base.telemetry.samplingMode = "head";
      base.telemetry.samplingRate = 0.2;
      base.telemetry.droppedLogRate = 0.1;
      base.faults = [
        {
          id: "f-rare",
          type: "error_surge",
          targetServiceId: "inventory",
          atMs: 120,
          latencyMultiplier: 2,
          errorRate: 0.25,
          saturationPct: 65,
          description: "20% head sampling leaves sampled trace blind spots",
        },
      ];
      return base;

    case "successful_mitigation":
    case "incident_postmortem":
      base.investigationMode = "explanation";
      base.faults = [
        {
          id: "f-mit-db",
          type: "latency_spike",
          targetServiceId: "payment-db",
          atMs: 100,
          latencyMultiplier: 6,
          errorRate: 0.4,
          saturationPct: 93,
          description: "Payment DB slowdown spikes Checkout latency & error rate",
        },
      ];
      base.mitigations = [
        {
          id: "mit-scale-db",
          atMs: 360,
          action: "scale_capacity",
          targetServiceId: "payment-db",
          description: "Scaled Payment DB pool & cleared lock contention",
        },
      ];
      return base;

    case "incomplete_recovery":
      base.faults = [
        {
          id: "f-inc-db",
          type: "error_surge",
          targetServiceId: "payment-db",
          atMs: 100,
          latencyMultiplier: 5,
          errorRate: 0.5,
          saturationPct: 90,
          description: "Primary DB fault persists across partial app restart",
        },
      ];
      base.mitigations = [
        {
          id: "mit-partial",
          atMs: 360,
          action: "restart_component",
          targetServiceId: "checkout",
          description: "Restarted Checkout without addressing Payment DB root fault",
        },
      ];
      return base;
  }
}
