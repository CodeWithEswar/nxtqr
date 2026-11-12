import type { TrafficControlScenario } from "./traffic-control-schemas";

export interface TrafficControlPresetMeta {
  id: TrafficControlPresetId;
  label: string;
  description: string;
  category:
    | "algorithms"
    | "distributed"
    | "queueing"
    | "overload"
    | "resilience";
}

export type TrafficControlPresetId =
  | "fixed_window_boundary_burst"
  | "sliding_window_log"
  | "sliding_window_counter"
  | "token_bucket_burst"
  | "token_bucket_refill"
  | "leaky_bucket_smoothing"
  | "hierarchical_limits"
  | "per_tenant_limits"
  | "per_user_limits"
  | "global_distributed_limiter"
  | "local_limiter_overshoot"
  | "central_limiter_failure"
  | "fail_open_behavior"
  | "fail_closed_behavior"
  | "concurrency_saturation"
  | "queue_overflow"
  | "queue_timeout"
  | "backpressure_propagation"
  | "load_shedding"
  | "priority_scheduling"
  | "tenant_fairness"
  | "retry_storm"
  | "retry_budget_protection"
  | "circuit_breaker_open"
  | "circuit_breaker_recovery"
  | "adaptive_concurrency"
  | "flash_crowd"
  | "slow_downstream_service"
  | "recovery_after_overload"
  | "deadline_expiration";

export const TRAFFIC_CONTROL_PRESET_METADATA: TrafficControlPresetMeta[] = [
  {
    id: "fixed_window_boundary_burst",
    label: "Fixed Window Boundary Burst",
    description: "Adjacent window reset allows up to 2x limit around window edge.",
    category: "algorithms",
  },
  {
    id: "sliding_window_log",
    label: "Sliding Window Log",
    description: "Exact timestamp eviction prevents boundary bursts over sliding window.",
    category: "algorithms",
  },
  {
    id: "sliding_window_counter",
    label: "Sliding Window Counter (Approx)",
    description: "Weighted overlap counter approximates sliding intervals with O(1) memory.",
    category: "algorithms",
  },
  {
    id: "token_bucket_burst",
    label: "Token Bucket Burst & Drain",
    description: "Full bucket absorbs immediate burst before draining to refill rate.",
    category: "algorithms",
  },
  {
    id: "token_bucket_refill",
    label: "Token Bucket Virtual Refill",
    description: "Deterministic elapsed-time token refill resumes admission after exhaustion.",
    category: "algorithms",
  },
  {
    id: "leaky_bucket_smoothing",
    label: "Leaky Bucket Traffic Smoothing",
    description: "Bounded FIFO drain bucket caps outflow while rejecting queue overflow.",
    category: "algorithms",
  },
  {
    id: "hierarchical_limits",
    label: "Hierarchical Multi-Tier Limits",
    description: "Atomic reservation across Global -> Tenant -> Route limits prevents partial quota loss.",
    category: "algorithms",
  },
  {
    id: "per_tenant_limits",
    label: "Per-Tenant Rate Isolation",
    description: "Tenant A exhaustion leaves Tenant B quota untouched.",
    category: "algorithms",
  },
  {
    id: "per_user_limits",
    label: "Per-User Rate Isolation",
    description: "Synthetic user identity scopes enforce fair per-actor quotas.",
    category: "algorithms",
  },
  {
    id: "global_distributed_limiter",
    label: "Centralized Distributed Limiter",
    description: "Multiple gateways enforce strict global cap via shared central store (+RTT).",
    category: "distributed",
  },
  {
    id: "local_limiter_overshoot",
    label: "Local Limiter Aggregate Overshoot",
    description: "Independent local limits allow Gateways 1 & 2 to overshoot global target.",
    category: "distributed",
  },
  {
    id: "central_limiter_failure",
    label: "Central Store Outage Impact",
    description: "Centralized coordination outage triggers configured failure policy.",
    category: "distributed",
  },
  {
    id: "fail_open_behavior",
    label: "Distributed Fail-Open Fallback",
    description: "Central store outage fails open to preserve availability with overload risk.",
    category: "distributed",
  },
  {
    id: "fail_closed_behavior",
    label: "Distributed Fail-Closed Protection",
    description: "Central store outage fails closed to protect downstream capacity.",
    category: "distributed",
  },
  {
    id: "concurrency_saturation",
    label: "In-Flight Concurrency Saturation",
    description: "Slow service exhausts concurrency permits even below RPS rate limits.",
    category: "queueing",
  },
  {
    id: "queue_overflow",
    label: "Bounded Queue Overflow",
    description: "Strict queue capacity rejects excess arrivals once depth reaches cap.",
    category: "queueing",
  },
  {
    id: "queue_timeout",
    label: "Queue Max-Wait Timeout",
    description: "Stalled work expires in queue and is discarded without executing.",
    category: "queueing",
  },
  {
    id: "backpressure_propagation",
    label: "Hysteresis Backpressure Signal",
    description: "Queue pressure signals producer slow-down until queue drains below exit threshold.",
    category: "overload",
  },
  {
    id: "load_shedding",
    label: "Priority Load Shedding",
    description: "Sheds background requests at queue threshold to protect critical traffic.",
    category: "overload",
  },
  {
    id: "priority_scheduling",
    label: "Priority Queue with Aging",
    description: "Dispatches critical work first while aging prevents low-priority starvation.",
    category: "queueing",
  },
  {
    id: "tenant_fairness",
    label: "Weighted Fair Queueing (Tenants)",
    description: "WFQ approximation prevents noisy Tenant A from starving Tenant B.",
    category: "queueing",
  },
  {
    id: "retry_storm",
    label: "Unbounded Retry Amplification Storm",
    description: "Aggressive client retries without strict budget amplify outage load.",
    category: "resilience",
  },
  {
    id: "retry_budget_protection",
    label: "Retry Budget Protection",
    description: "Retry budget caps storm amplification and suppresses excess retries.",
    category: "resilience",
  },
  {
    id: "circuit_breaker_open",
    label: "Circuit Breaker Fast-Fail Trip",
    description: "Consecutive downstream errors trip breaker OPEN to shed failing calls immediately.",
    category: "resilience",
  },
  {
    id: "circuit_breaker_recovery",
    label: "Circuit Breaker Half-Open Recovery",
    description: "Downstream heals -> half-open probe succeeds -> breaker returns to CLOSED.",
    category: "resilience",
  },
  {
    id: "adaptive_concurrency",
    label: "Adaptive Concurrency Controller",
    description: "Bounded AIMD latency controller lowers concurrency under spike and restores cleanly.",
    category: "overload",
  },
  {
    id: "flash_crowd",
    label: "Synthetic Flash Crowd Surge",
    description: "Sudden 3x mid-run spike exercises rate limiting, queueing, and load shedding together.",
    category: "overload",
  },
  {
    id: "slow_downstream_service",
    label: "Slow Downstream Cascade",
    description: "4x latency spike fills concurrency and triggers queue overflow.",
    category: "overload",
  },
  {
    id: "recovery_after_overload",
    label: "Overload Surge & Recovery",
    description: "Monitors surge -> queue build -> backpressure -> drainage -> steady recovery.",
    category: "overload",
  },
  {
    id: "deadline_expiration",
    label: "End-to-End Request Deadlines",
    description: "Propagated deadlines prune stale requests before wasted execution.",
    category: "queueing",
  },
];

export function createTrafficControlPresetScenario(
  presetId: TrafficControlPresetId
): TrafficControlScenario {
  const base: TrafficControlScenario = {
    version: 1,
    id: presetId,
    presetId,
    label:
      TRAFFIC_CONTROL_PRESET_METADATA.find((p) => p.id === presetId)?.label ??
      presetId,
    architectureRevisionId: "rev_001",
    seed: 42,
    evaluationMode: "all_required",
    sources: [
      {
        id: "src-a",
        label: "Client A",
        tenantId: "tenant-a",
        userId: "user-1",
        apiKeyId: "key-alpha",
        clientIp: "198.51.100.10",
        route: "/api/orders",
        method: "POST",
        pattern: "constant",
        requestsPerSecond: 25,
        burstSize: 5,
        priority: "standard",
        cost: 1,
        startAtMs: 0,
        endAtMs: 500,
        tenantWeight: 1,
      },
    ],
    policies: [
      {
        id: "pol-primary",
        label: "Token Bucket Limiter",
        algorithm: "token_bucket",
        scope: "global",
        limit: 8,
        windowMs: 250,
        capacity: 6,
        refillTokensPerSecond: 10,
        drainRatePerSecond: 10,
      },
    ],
    distributed: {
      mode: "single_node",
      gateways: [{ id: "gw-1", label: "Gateway 1", clockOffsetMs: 0 }],
      centralLatencyMs: 6,
      syncIntervalMs: 100,
      failBehavior: "fail_closed",
    },
    concurrency: {
      enabled: true,
      maxConcurrent: 6,
      adaptive: {
        enabled: false,
        minLimit: 2,
        maxLimit: 10,
        targetLatencyMs: 40,
        adjustIntervalMs: 80,
      },
    },
    queue: {
      enabled: true,
      capacity: 8,
      policy: "fifo",
      maxWaitMs: 350,
      agingBoostMs: 100,
    },
    serviceCapacity: {
      baseServiceTimeMs: 30,
      distribution: "constant",
      failureRateBase: 0,
      overloadFailureRate: 0,
    },
    overload: {
      backpressureEnabled: false,
      enterQueueThreshold: 0.75,
      exitQueueThreshold: 0.35,
      loadSheddingEnabled: false,
      shedPolicy: "priority",
      shedQueueRatio: 0.6,
      shedProbability: 0.5,
    },
    retries: {
      enabled: false,
      maxAttempts: 3,
      baseBackoffMs: 25,
      exponentialBackoff: true,
      jitterRatio: 0.1,
      budgetRatio: 0.25,
      budgetMinTokens: 3,
      honorRetryAfter: true,
    },
    circuitBreaker: {
      enabled: false,
      failureThreshold: 3,
      openDurationMs: 150,
      halfOpenMaxProbes: 1,
    },
    faults: [],
    limits: {
      maxSources: 100,
      maxRequests: 1000,
      maxEvents: 3000,
      maxVirtualDurationMs: 3000,
      maxQueueDepth: 200,
    },
  };

  switch (presetId) {
    case "fixed_window_boundary_burst":
      base.policies = [
        {
          id: "pol-fixed",
          label: "Fixed Window 4/200ms",
          algorithm: "fixed_window",
          scope: "global",
          limit: 4,
          windowMs: 200,
          capacity: 4,
          refillTokensPerSecond: 10,
          drainRatePerSecond: 10,
        },
      ];
      base.sources[0]!.pattern = "bursty";
      base.sources[0]!.burstSize = 5;
      base.sources[0]!.startAtMs = 180;
      base.sources[0]!.endAtMs = 450;
      return base;

    case "sliding_window_log":
      base.policies = [
        {
          id: "pol-swlog",
          label: "Sliding Window Log 5/200ms",
          algorithm: "sliding_window_log",
          scope: "global",
          limit: 5,
          windowMs: 200,
          capacity: 5,
          refillTokensPerSecond: 10,
          drainRatePerSecond: 10,
        },
      ];
      base.sources[0]!.pattern = "bursty";
      base.sources[0]!.burstSize = 4;
      base.sources[0]!.requestsPerSecond = 35;
      return base;

    case "sliding_window_counter":
      base.policies = [
        {
          id: "pol-swcnt",
          label: "Sliding Counter Approx 5/200ms",
          algorithm: "sliding_window_counter",
          scope: "global",
          limit: 5,
          windowMs: 200,
          capacity: 5,
          refillTokensPerSecond: 10,
          drainRatePerSecond: 10,
        },
      ];
      base.sources[0]!.pattern = "bursty";
      base.sources[0]!.burstSize = 4;
      base.sources[0]!.startAtMs = 150;
      base.sources[0]!.endAtMs = 500;
      return base;

    case "token_bucket_burst":
      base.policies[0]!.capacity = 6;
      base.policies[0]!.refillTokensPerSecond = 4;
      base.sources[0]!.pattern = "bursty";
      base.sources[0]!.burstSize = 9;
      return base;

    case "token_bucket_refill":
      base.policies[0]!.capacity = 4;
      base.policies[0]!.refillTokensPerSecond = 12;
      base.sources[0]!.requestsPerSecond = 20;
      base.sources[0]!.endAtMs = 700;
      return base;

    case "leaky_bucket_smoothing":
      base.policies = [
        {
          id: "pol-leaky",
          label: "Leaky Bucket Cap=4 Drain=8/s",
          algorithm: "leaky_bucket",
          scope: "global",
          limit: 4,
          windowMs: 200,
          capacity: 4,
          refillTokensPerSecond: 8,
          drainRatePerSecond: 8,
        },
      ];
      base.sources[0]!.pattern = "bursty";
      base.sources[0]!.burstSize = 7;
      base.sources[0]!.requestsPerSecond = 35;
      return base;

    case "hierarchical_limits":
      base.evaluationMode = "hierarchical";
      base.policies = [
        {
          id: "pol-global",
          label: "Global Bucket Cap=10",
          algorithm: "token_bucket",
          scope: "global",
          limit: 10,
          windowMs: 200,
          capacity: 10,
          refillTokensPerSecond: 15,
          drainRatePerSecond: 15,
        },
        {
          id: "pol-tenant-a",
          label: "Tenant A Cap=3",
          algorithm: "token_bucket",
          scope: "tenant",
          scopeMatch: "tenant-a",
          parentPolicyId: "pol-global",
          limit: 3,
          windowMs: 200,
          capacity: 3,
          refillTokensPerSecond: 4,
          drainRatePerSecond: 4,
        },
      ];
      base.sources[0]!.requestsPerSecond = 30;
      return base;

    case "per_tenant_limits":
      base.policies = [
        {
          id: "pol-per-tenant",
          label: "Per-Tenant 3/250ms",
          algorithm: "fixed_window",
          scope: "tenant",
          limit: 3,
          windowMs: 250,
          capacity: 3,
          refillTokensPerSecond: 5,
          drainRatePerSecond: 5,
        },
      ];
      base.sources = [
        { ...base.sources[0]!, id: "src-ta", tenantId: "tenant-a", requestsPerSecond: 40 },
        { ...base.sources[0]!, id: "src-tb", tenantId: "tenant-b", requestsPerSecond: 8 },
      ];
      return base;

    case "per_user_limits":
      base.policies = [
        {
          id: "pol-per-user",
          label: "Per-User Token Bucket",
          algorithm: "token_bucket",
          scope: "user",
          limit: 3,
          windowMs: 200,
          capacity: 3,
          refillTokensPerSecond: 3,
          drainRatePerSecond: 3,
        },
      ];
      base.sources = [
        { ...base.sources[0]!, id: "src-u1", userId: "alice", requestsPerSecond: 35 },
        { ...base.sources[0]!, id: "src-u2", userId: "bob", requestsPerSecond: 8 },
      ];
      return base;

    case "global_distributed_limiter":
      base.distributed = {
        mode: "centralized",
        gateways: [
          { id: "gw-1", label: "Edge US-East", clockOffsetMs: 0 },
          { id: "gw-2", label: "Edge EU-West", clockOffsetMs: 12 },
        ],
        centralLatencyMs: 8,
        syncIntervalMs: 100,
        failBehavior: "fail_closed",
      };
      base.policies = [
        {
          id: "pol-dist-global",
          label: "Shared Central Cap=5",
          algorithm: "fixed_window",
          scope: "global",
          limit: 5,
          windowMs: 300,
          capacity: 5,
          refillTokensPerSecond: 8,
          drainRatePerSecond: 8,
        },
      ];
      base.sources[0]!.requestsPerSecond = 35;
      return base;

    case "local_limiter_overshoot":
      base.distributed = {
        mode: "local_independent",
        gateways: [
          { id: "gw-1", label: "Gateway 1", clockOffsetMs: 0 },
          { id: "gw-2", label: "Gateway 2", clockOffsetMs: 0 },
        ],
        centralLatencyMs: 0,
        syncIntervalMs: 100,
        failBehavior: "fail_open",
      };
      base.policies = [
        {
          id: "pol-local-each",
          label: "Local Budget 4/gw (Target=4 global)",
          algorithm: "fixed_window",
          scope: "global",
          limit: 4,
          windowMs: 500,
          capacity: 4,
          refillTokensPerSecond: 8,
          drainRatePerSecond: 8,
        },
      ];
      base.sources[0]!.requestsPerSecond = 40;
      base.sources[0]!.endAtMs = 300;
      return base;

    case "central_limiter_failure":
    case "fail_closed_behavior":
      base.distributed = {
        mode: "centralized",
        gateways: [{ id: "gw-1", label: "Gateway 1", clockOffsetMs: 0 }],
        centralLatencyMs: 5,
        syncIntervalMs: 100,
        failBehavior: "fail_closed",
      };
      base.faults = [
        {
          id: "f-store-down",
          type: "central_store_down",
          atMs: 120,
          description: "Central Redis limiter unreachable -> fail closed",
        },
      ];
      return base;

    case "fail_open_behavior":
      base.distributed = {
        mode: "centralized",
        gateways: [{ id: "gw-1", label: "Gateway 1", clockOffsetMs: 0 }],
        centralLatencyMs: 5,
        syncIntervalMs: 100,
        failBehavior: "fail_open",
      };
      base.faults = [
        {
          id: "f-store-down",
          type: "central_store_down",
          atMs: 100,
          description: "Central store unreachable -> fail open prioritizes availability",
        },
      ];
      return base;

    case "concurrency_saturation":
      base.policies = [];
      base.concurrency.maxConcurrent = 3;
      base.queue.enabled = false;
      base.queue.capacity = 0;
      base.serviceCapacity.baseServiceTimeMs = 150;
      base.sources[0]!.requestsPerSecond = 40;
      return base;

    case "queue_overflow":
      base.policies = [];
      base.concurrency.maxConcurrent = 2;
      base.queue.enabled = true;
      base.queue.capacity = 4;
      base.serviceCapacity.baseServiceTimeMs = 160;
      base.sources[0]!.requestsPerSecond = 50;
      return base;

    case "queue_timeout":
      base.policies = [];
      base.concurrency.maxConcurrent = 1;
      base.queue.capacity = 10;
      base.queue.maxWaitMs = 90;
      base.serviceCapacity.baseServiceTimeMs = 120;
      base.sources[0]!.requestsPerSecond = 40;
      base.sources[0]!.endAtMs = 350;
      return base;

    case "backpressure_propagation":
      base.policies = [];
      base.concurrency.maxConcurrent = 2;
      base.queue.capacity = 5;
      base.serviceCapacity.baseServiceTimeMs = 110;
      base.overload.backpressureEnabled = true;
      base.overload.enterQueueThreshold = 0.6;
      base.overload.exitQueueThreshold = 0.2;
      base.sources[0]!.requestsPerSecond = 45;
      base.sources[0]!.endAtMs = 400;
      return base;

    case "load_shedding":
      base.policies = [];
      base.concurrency.maxConcurrent = 2;
      base.queue.capacity = 6;
      base.serviceCapacity.baseServiceTimeMs = 140;
      base.overload.loadSheddingEnabled = true;
      base.overload.shedPolicy = "priority";
      base.overload.shedQueueRatio = 0.3;
      base.sources = [
        { ...base.sources[0]!, id: "src-crit", tenantId: "vip", priority: "critical", requestsPerSecond: 15 },
        { ...base.sources[0]!, id: "src-bg", tenantId: "bulk", priority: "background", requestsPerSecond: 40 },
      ];
      return base;

    case "priority_scheduling":
      base.policies = [];
      base.concurrency.maxConcurrent = 2;
      base.queue.capacity = 14;
      base.queue.policy = "priority";
      base.serviceCapacity.baseServiceTimeMs = 80;
      base.sources = [
        { ...base.sources[0]!, id: "src-bg", tenantId: "batch", priority: "background", requestsPerSecond: 25 },
        { ...base.sources[0]!, id: "src-crit", tenantId: "checkout", priority: "critical", requestsPerSecond: 15, startAtMs: 30 },
      ];
      return base;

    case "tenant_fairness":
      base.policies = [];
      base.concurrency.maxConcurrent = 2;
      base.queue.capacity = 16;
      base.queue.policy = "wfq";
      base.serviceCapacity.baseServiceTimeMs = 70;
      base.sources = [
        { ...base.sources[0]!, id: "src-noisy", tenantId: "noisy-tenant", tenantWeight: 1, requestsPerSecond: 50 },
        { ...base.sources[0]!, id: "src-fair", tenantId: "steady-tenant", tenantWeight: 3, requestsPerSecond: 12 },
      ];
      return base;

    case "retry_storm":
      base.policies = [
        {
          id: "pol-storm",
          label: "Bucket Cap=3",
          algorithm: "token_bucket",
          scope: "global",
          limit: 3,
          windowMs: 200,
          capacity: 3,
          refillTokensPerSecond: 2,
          drainRatePerSecond: 2,
        },
      ];
      base.retries = {
        enabled: true,
        maxAttempts: 4,
        baseBackoffMs: 15,
        exponentialBackoff: false,
        jitterRatio: 0.1,
        budgetRatio: 3,
        budgetMinTokens: 40,
        honorRetryAfter: false,
      };
      base.sources[0]!.requestsPerSecond = 35;
      base.sources[0]!.endAtMs = 300;
      return base;

    case "retry_budget_protection":
      base.policies = [
        {
          id: "pol-budget",
          label: "Bucket Cap=3",
          algorithm: "token_bucket",
          scope: "global",
          limit: 3,
          windowMs: 200,
          capacity: 3,
          refillTokensPerSecond: 2,
          drainRatePerSecond: 2,
        },
      ];
      base.retries = {
        enabled: true,
        maxAttempts: 4,
        baseBackoffMs: 15,
        exponentialBackoff: true,
        jitterRatio: 0.2,
        budgetRatio: 0.2,
        budgetMinTokens: 2,
        honorRetryAfter: true,
      };
      base.sources[0]!.requestsPerSecond = 35;
      base.sources[0]!.endAtMs = 300;
      return base;

    case "circuit_breaker_open":
      base.policies = [];
      base.circuitBreaker = {
        enabled: true,
        failureThreshold: 3,
        openDurationMs: 400,
        halfOpenMaxProbes: 1,
      };
      base.faults = [
        {
          id: "f-err",
          type: "downstream_error",
          atMs: 0,
          description: "Downstream dependency returns 503 errors",
        },
      ];
      base.sources[0]!.requestsPerSecond = 25;
      base.sources[0]!.endAtMs = 450;
      return base;

    case "circuit_breaker_recovery":
      base.policies = [];
      base.circuitBreaker = {
        enabled: true,
        failureThreshold: 2,
        openDurationMs: 150,
        halfOpenMaxProbes: 1,
      };
      base.faults = [
        {
          id: "f-err",
          type: "downstream_error",
          atMs: 0,
          description: "Initial outage trips circuit OPEN",
        },
        {
          id: "f-rec",
          type: "downstream_recover",
          atMs: 220,
          description: "Dependency recovers before half-open probe",
        },
      ];
      base.sources[0]!.requestsPerSecond = 20;
      base.sources[0]!.endAtMs = 600;
      return base;

    case "adaptive_concurrency":
      base.policies = [];
      base.concurrency = {
        enabled: true,
        maxConcurrent: 6,
        adaptive: {
          enabled: true,
          minLimit: 2,
          maxLimit: 10,
          targetLatencyMs: 40,
          adjustIntervalMs: 80,
        },
      };
      base.faults = [
        {
          id: "f-slow",
          type: "downstream_slow",
          atMs: 80,
          multiplier: 4,
          description: "Latencies jump 4x, tightening adaptive concurrency limit",
        },
      ];
      base.sources[0]!.requestsPerSecond = 35;
      base.sources[0]!.endAtMs = 500;
      return base;

    case "flash_crowd":
      base.policies[0]!.capacity = 8;
      base.policies[0]!.refillTokensPerSecond = 15;
      base.overload.loadSheddingEnabled = true;
      base.overload.shedPolicy = "priority";
      base.overload.shedQueueRatio = 0.5;
      base.sources = [
        { ...base.sources[0]!, id: "src-flash-crit", priority: "critical", pattern: "flash_crowd", requestsPerSecond: 20, endAtMs: 600 },
        { ...base.sources[0]!, id: "src-flash-bg", priority: "background", pattern: "flash_crowd", requestsPerSecond: 30, endAtMs: 600 },
      ];
      return base;

    case "slow_downstream_service":
      base.policies = [];
      base.concurrency.maxConcurrent = 2;
      base.queue.capacity = 5;
      base.faults = [
        {
          id: "f-slow-ds",
          type: "downstream_slow",
          atMs: 40,
          multiplier: 5,
          description: "Downstream latency spikes 5x causing concurrency pile-up",
        },
      ];
      base.sources[0]!.requestsPerSecond = 35;
      return base;

    case "recovery_after_overload":
      base.policies = [];
      base.concurrency.maxConcurrent = 3;
      base.queue.capacity = 8;
      base.serviceCapacity.baseServiceTimeMs = 90;
      base.overload.backpressureEnabled = true;
      base.overload.enterQueueThreshold = 0.5;
      base.overload.exitQueueThreshold = 0.25;
      base.sources[0]!.pattern = "bursty";
      base.sources[0]!.burstSize = 10;
      base.sources[0]!.endAtMs = 250;
      return base;

    case "deadline_expiration":
      base.policies = [];
      base.concurrency.maxConcurrent = 1;
      base.queue.capacity = 10;
      base.queue.policy = "edf";
      base.serviceCapacity.baseServiceTimeMs = 80;
      base.sources = [
        { ...base.sources[0]!, id: "src-tight", deadlineMs: 110, requestsPerSecond: 25, endAtMs: 350 },
      ];
      return base;
  }
}

