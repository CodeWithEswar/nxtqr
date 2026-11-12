import type {
  MeshProxyConfig,
  MeshServiceDefinition,
  MeshServiceInstanceConfig,
  ServiceMeshScenario,
} from "./service-mesh-schemas";

export const SERVICE_MESH_PRESET_METADATA = [
  {
    id: "basic_service_request",
    label: "Basic Service Request",
    description: "API -> Orders -> Payments synchronous call graph with causal spans.",
  },
  {
    id: "service_discovery",
    label: "Service Discovery & Propagation",
    description: "Delayed registry convergence keeps crashed endpoint cached until expiry.",
  },
  {
    id: "sidecar_proxy_traversal",
    label: "Sidecar Proxy Traversal",
    description: "Explicit outbound and inbound sidecar proxies intercept every hop.",
  },
  {
    id: "mtls_success",
    label: "mTLS Mutual Authentication",
    description: "Strict SPIFFE identity verification and logical TLS handshake pass.",
  },
  {
    id: "mtls_failure",
    label: "mTLS Certificate Expiration Failure",
    description: "Expired peer certificate fails strict mTLS handshake at destination proxy.",
  },
  {
    id: "authorization_denial",
    label: "Mesh Authorization Denial",
    description: "RBAC deny policy blocks unauthorized service operation (no retries bypass).",
  },
  {
    id: "round_robin_routing",
    label: "Round-Robin Load Balancing",
    description: "Distributes calls sequentially across healthy replicas.",
  },
  {
    id: "least_active_routing",
    label: "Least-Active Load Balancing",
    description: "Routes concurrent calls toward instances with fewest active requests.",
  },
  {
    id: "request_timeout",
    label: "Request Attempt Timeout",
    description: "Downstream latency spike exceeds configured per-attempt timeout.",
  },
  {
    id: "retry_with_backoff",
    label: "Retry with Exponential Backoff",
    description: "Transient failure recovers after jittered exponential backoff retry.",
  },
  {
    id: "retry_exhaustion",
    label: "Retry Exhaustion",
    description: "Persistent downstream errors exhaust all attempts and fail upstream.",
  },
  {
    id: "retry_storm",
    label: "Retry Amplification Storm",
    description: "Nested API -> Orders -> Payments retries multiply downstream call load.",
  },
  {
    id: "circuit_breaker_opening",
    label: "Circuit Breaker Opening",
    description: "Rolling failure rate crosses threshold; circuit opens to fail fast.",
  },
  {
    id: "half_open_recovery",
    label: "Circuit Half-Open Recovery",
    description: "After open window elapses, limited probes verify recovery and close circuit.",
  },
  {
    id: "bulkhead_saturation",
    label: "Bulkhead Saturation & Isolation",
    description: "8 concurrent requests test maxActive=3 + queue=2 bulkhead limit.",
  },
  {
    id: "connection_pool_exhaustion",
    label: "Connection Pool Exhaustion",
    description: "Concurrent burst saturates proxy maxConnections pool cap.",
  },
  {
    id: "weighted_traffic_split",
    label: "Weighted Traffic Split (90/10)",
    description: "Deterministic 90% v1 / 10% v2 traffic splitting across revisions.",
  },
  {
    id: "canary_promotion",
    label: "Canary Staged Promotion",
    description: "Healthy v2 canary clears sample gates and promotes 5% -> 20% -> 50% -> 100%.",
  },
  {
    id: "canary_rollback",
    label: "Canary Automatic Rollback",
    description: "Degraded v2 canary exceeds error threshold and rolls back to 100% v1.",
  },
  {
    id: "cascading_failure",
    label: "Cascading Dependency Failure",
    description: "Fraud service outage cascades upstream through Payments, Orders, and API.",
  },
  {
    id: "graceful_degradation",
    label: "Graceful Fallback Degradation",
    description: "Configured cached/static fallback shields caller from downstream outage.",
  },
  {
    id: "partial_response",
    label: "Partial Fan-Out Response",
    description: "Product Page fan-out succeeds with Catalog & Recs while skipping failed Reviews.",
  },
  {
    id: "regional_service_outage",
    label: "Regional Zone Outage Failover",
    description: "US-East instance outage shifts mesh traffic seamlessly to EU-West replica.",
  },
  {
    id: "proxy_failure",
    label: "Sidecar Proxy Failure",
    description: "Unhealthy destination inbound proxy returns 502 Bad Gateway before app execution.",
  },
  {
    id: "combined_retry_circuit_breaker",
    label: "Combined Retry + Circuit Breaker",
    description: "Retries attempt recovery while circuit breaker trips to protect failing service.",
  },
  {
    id: "deadline_propagation",
    label: "End-to-End Deadline Propagation",
    description: "Remaining deadline across API -> Orders -> Payments caps downstream retries.",
  },
] as const;

export type ServiceMeshPresetId =
  (typeof SERVICE_MESH_PRESET_METADATA)[number]["id"];

function coreServices(): MeshServiceDefinition[] {
  return [
    {
      id: "api",
      name: "API Gateway",
      namespace: "production",
      protocol: "http",
      proxyMode: "sidecar",
      identity: "spiffe://example.local/ns/production/sa/api",
      defaultTimeoutMs: 1200,
      baseProcessingMs: 10,
      dependencies: [
        {
          targetServiceId: "orders",
          operation: "POST /orders",
          protocol: "http",
          required: true,
          fallbackMode: "none",
        },
      ],
      operations: ["POST /api/orders"],
      fallbackMode: "none",
    },
    {
      id: "orders",
      name: "Order Service",
      namespace: "production",
      protocol: "http",
      proxyMode: "sidecar",
      identity: "spiffe://example.local/ns/production/sa/orders",
      defaultTimeoutMs: 900,
      baseProcessingMs: 18,
      dependencies: [
        {
          targetServiceId: "payments",
          operation: "ChargeCard",
          protocol: "grpc",
          required: true,
          fallbackMode: "none",
        },
      ],
      operations: ["POST /orders"],
      fallbackMode: "none",
    },
    {
      id: "payments",
      name: "Payment Service",
      namespace: "production",
      protocol: "grpc",
      proxyMode: "sidecar",
      identity: "spiffe://example.local/ns/production/sa/payments",
      defaultTimeoutMs: 600,
      baseProcessingMs: 25,
      dependencies: [],
      operations: ["ChargeCard"],
      fallbackMode: "none",
    },
  ];
}

function coreInstances(): MeshServiceInstanceConfig[] {
  return [
    {
      id: "api-v1-a",
      serviceId: "api",
      revision: "v1",
      region: "us-east",
      weight: 100,
      healthy: true,
      ready: true,
      capacityRps: 200,
      maxConcurrent: 32,
      baseLatencyMs: 10,
      certificateValid: true,
      trustDomain: "example.local",
    },
    {
      id: "orders-v1-a",
      serviceId: "orders",
      revision: "v1",
      region: "us-east",
      weight: 100,
      healthy: true,
      ready: true,
      capacityRps: 150,
      maxConcurrent: 24,
      baseLatencyMs: 16,
      certificateValid: true,
      trustDomain: "example.local",
    },
    {
      id: "payments-v1-a",
      serviceId: "payments",
      revision: "v1",
      region: "us-east",
      weight: 100,
      healthy: true,
      ready: true,
      capacityRps: 120,
      maxConcurrent: 16,
      baseLatencyMs: 22,
      certificateValid: true,
      trustDomain: "example.local",
    },
  ];
}

function coreProxies(): MeshProxyConfig[] {
  return [
    {
      id: "proxy-api",
      mode: "sidecar",
      attachedServiceId: "api",
      healthy: true,
      proxyOverheadMs: 3,
      maxConnections: 24,
      connectionTimeoutMs: 250,
    },
    {
      id: "proxy-orders",
      mode: "sidecar",
      attachedServiceId: "orders",
      healthy: true,
      proxyOverheadMs: 3,
      maxConnections: 24,
      connectionTimeoutMs: 250,
    },
    {
      id: "proxy-payments",
      mode: "sidecar",
      attachedServiceId: "payments",
      healthy: true,
      proxyOverheadMs: 3,
      maxConnections: 24,
      connectionTimeoutMs: 250,
    },
  ];
}

function baseScenario(
  presetId: ServiceMeshPresetId,
  name: string,
  description: string
): ServiceMeshScenario {
  return {
    version: 1,
    id: `mesh-${presetId}`,
    name,
    description,
    architectureRevisionId: "rev-1",
    presetId,
    seed: 42,
    services: coreServices(),
    instances: coreInstances(),
    proxies: coreProxies(),
    discovery: {
      cacheEnabled: true,
      cacheTtlMs: 5000,
      propagationDelayMs: 0,
      lookupLatencyMs: 2,
    },
    routing: [],
    resilience: [],
    security: {
      mtlsMode: "strict",
      trustDomain: "example.local",
      handshakeLatencyMs: 4,
      defaultAllow: true,
      authorizationRules: [],
    },
    workload: [
      {
        id: "wl-1",
        atMs: 0,
        entryServiceId: "api",
        operation: "POST /api/orders",
        protocol: "http",
        headers: {},
        path: "/api/orders",
        concurrentCount: 1,
      },
    ],
    failures: [],
    limits: {
      maxRequests: 1000,
      maxAttemptsPerRequest: 6,
      maxEvents: 4000,
      maxVirtualDurationMs: 30000,
    },
  };
}

export function createServiceMeshPresetScenario(
  presetId: ServiceMeshPresetId
): ServiceMeshScenario {
  const meta =
    SERVICE_MESH_PRESET_METADATA.find((p) => p.id === presetId) ??
    SERVICE_MESH_PRESET_METADATA[0];
  const s = baseScenario(presetId, meta.label, meta.description);

  switch (presetId) {
    case "basic_service_request":
    case "sidecar_proxy_traversal":
    case "mtls_success":
      return s;

    case "service_discovery": {
      s.discovery.cacheTtlMs = 2000;
      s.discovery.propagationDelayMs = 400;
      s.instances.push({
        id: "payments-v1-b",
        serviceId: "payments",
        revision: "v1",
        region: "us-east",
        weight: 100,
        healthy: true,
        ready: true,
        capacityRps: 120,
        maxConcurrent: 16,
        baseLatencyMs: 22,
        certificateValid: true,
        trustDomain: "example.local",
      });
      s.failures = [
        {
          id: "f-crash-a",
          type: "instance_crash",
          targetId: "payments-v1-a",
          atMs: 150,
          description: "payments-v1-a crashes; stays cached briefly until propagation/eviction.",
        },
      ];
      s.resilience = [
        {
          serviceId: "payments",
          attemptTimeoutMs: 400,
          overallDeadlineMs: 1500,
          retry: {
            enabled: true,
            maxAttempts: 2,
            initialBackoffMs: 40,
            maxBackoffMs: 150,
            exponentialFactor: 2,
            jitterRatio: 0,
            retryBudgetPct: 200,
            retryableHttpStatuses: [502, 503, 504],
            retryableGrpcStatuses: ["UNAVAILABLE", "DEADLINE_EXCEEDED"],
          },
          circuitBreaker: {
            enabled: false,
            scope: "destination_service",
            rollingWindowMs: 5000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1000,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 8, queueCapacity: 4, queueTimeoutMs: 50 },
        },
      ];
      s.workload = [
        {
          id: "wl-1",
          atMs: 0,
          entryServiceId: "api",
          operation: "POST /api/orders",
          protocol: "http",
          headers: {},
          path: "/api/orders",
          concurrentCount: 1,
        },
        {
          id: "wl-2",
          atMs: 300,
          entryServiceId: "api",
          operation: "POST /api/orders",
          protocol: "http",
          headers: {},
          path: "/api/orders",
          concurrentCount: 1,
        },
      ];
      return s;
    }

    case "mtls_failure": {
      s.failures = [
        {
          id: "f-cert",
          type: "cert_expired",
          targetId: "payments-v1-a",
          atMs: 0,
          description: "Payments SPIFFE X.509 certificate expired.",
        },
      ];
      return s;
    }

    case "authorization_denial": {
      s.security.authorizationRules = [
        {
          id: "deny-orders-to-payments",
          sourceIdentityPattern: "spiffe://example.local/ns/production/sa/orders",
          destinationServiceId: "payments",
          operationPattern: "ChargeCard",
          effect: "deny",
        },
      ];
      s.resilience = [
        {
          serviceId: "payments",
          attemptTimeoutMs: 500,
          overallDeadlineMs: 1500,
          retry: {
            enabled: true,
            maxAttempts: 3,
            initialBackoffMs: 50,
            maxBackoffMs: 200,
            exponentialFactor: 2,
            jitterRatio: 0,
            retryBudgetPct: 200,
            retryableHttpStatuses: [500, 503],
            retryableGrpcStatuses: ["UNAVAILABLE"],
          },
          circuitBreaker: {
            enabled: false,
            scope: "destination_service",
            rollingWindowMs: 5000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1000,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 8, queueCapacity: 4, queueTimeoutMs: 50 },
        },
      ];
      return s;
    }

    case "round_robin_routing": {
      s.instances.push(
        {
          id: "payments-v1-b",
          serviceId: "payments",
          revision: "v1",
          region: "us-east",
          weight: 100,
          healthy: true,
          ready: true,
          capacityRps: 120,
          maxConcurrent: 16,
          baseLatencyMs: 22,
          certificateValid: true,
          trustDomain: "example.local",
        },
        {
          id: "payments-v1-c",
          serviceId: "payments",
          revision: "v1",
          region: "us-east",
          weight: 100,
          healthy: true,
          ready: true,
          capacityRps: 120,
          maxConcurrent: 16,
          baseLatencyMs: 22,
          certificateValid: true,
          trustDomain: "example.local",
        }
      );
      s.routing = [
        {
          id: "rr-payments",
          destinationServiceId: "payments",
          matchHeaders: {},
          splits: [],
          loadBalancing: "round_robin",
        },
      ];
      s.workload = Array.from({ length: 6 }, (_, i) => ({
        id: `wl-${i + 1}`,
        atMs: i * 150,
        entryServiceId: "api",
        operation: "POST /api/orders",
        protocol: "http" as const,
        headers: {},
        path: "/api/orders",
        concurrentCount: 1,
      }));
      return s;
    }

    case "least_active_routing": {
      s.instances.push({
        id: "payments-v1-b",
        serviceId: "payments",
        revision: "v1",
        region: "us-east",
        weight: 100,
        healthy: true,
        ready: true,
        capacityRps: 120,
        maxConcurrent: 16,
        baseLatencyMs: 22,
        certificateValid: true,
        trustDomain: "example.local",
      });
      s.routing = [
        {
          id: "la-payments",
          destinationServiceId: "payments",
          matchHeaders: {},
          splits: [],
          loadBalancing: "least_active",
        },
      ];
      s.workload = [
        {
          id: "wl-burst",
          atMs: 0,
          entryServiceId: "api",
          operation: "POST /api/orders",
          protocol: "http",
          headers: {},
          path: "/api/orders",
          concurrentCount: 4,
        },
      ];
      return s;
    }

    case "request_timeout": {
      s.resilience = [
        {
          serviceId: "payments",
          attemptTimeoutMs: 120,
          overallDeadlineMs: 500,
          retry: {
            enabled: false,
            maxAttempts: 1,
            initialBackoffMs: 50,
            maxBackoffMs: 200,
            exponentialFactor: 2,
            jitterRatio: 0,
            retryBudgetPct: 100,
            retryableHttpStatuses: [504],
            retryableGrpcStatuses: ["DEADLINE_EXCEEDED"],
          },
          circuitBreaker: {
            enabled: false,
            scope: "destination_service",
            rollingWindowMs: 5000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1000,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 8, queueCapacity: 4, queueTimeoutMs: 50 },
        },
      ];
      s.failures = [
        {
          id: "f-slow-payments",
          type: "latency_spike",
          targetId: "payments",
          atMs: 0,
          addedLatencyMs: 280,
          description: "Payments processing stalls past attempt timeout.",
        },
      ];
      return s;
    }

    case "retry_with_backoff": {
      s.resilience = [
        {
          serviceId: "payments",
          attemptTimeoutMs: 400,
          overallDeadlineMs: 1500,
          retry: {
            enabled: true,
            maxAttempts: 3,
            initialBackoffMs: 80,
            maxBackoffMs: 300,
            exponentialFactor: 2,
            jitterRatio: 0.1,
            retryBudgetPct: 300,
            retryableHttpStatuses: [503, 504],
            retryableGrpcStatuses: ["UNAVAILABLE", "DEADLINE_EXCEEDED"],
          },
          circuitBreaker: {
            enabled: false,
            scope: "destination_service",
            rollingWindowMs: 5000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1000,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 8, queueCapacity: 4, queueTimeoutMs: 50 },
        },
      ];
      s.failures = [
        {
          id: "f-transient",
          type: "packet_loss",
          targetId: "payments",
          atMs: 0,
          recoveryAtMs: 90,
          grpcErrorCode: "UNAVAILABLE",
          description: "Transient network drop recovers before retry attempt completes.",
        },
      ];
      return s;
    }

    case "retry_exhaustion": {
      s.resilience = [
        {
          serviceId: "payments",
          attemptTimeoutMs: 400,
          overallDeadlineMs: 2000,
          retry: {
            enabled: true,
            maxAttempts: 3,
            initialBackoffMs: 60,
            maxBackoffMs: 200,
            exponentialFactor: 2,
            jitterRatio: 0,
            retryBudgetPct: 500,
            retryableHttpStatuses: [503, 504],
            retryableGrpcStatuses: ["UNAVAILABLE", "DEADLINE_EXCEEDED"],
          },
          circuitBreaker: {
            enabled: false,
            scope: "destination_service",
            rollingWindowMs: 5000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1000,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 8, queueCapacity: 4, queueTimeoutMs: 50 },
        },
      ];
      s.failures = [
        {
          id: "f-persistent",
          type: "connection_reset",
          targetId: "payments",
          atMs: 0,
          grpcErrorCode: "UNAVAILABLE",
          description: "Persistent downstream failure exhausts all 3 retry attempts.",
        },
      ];
      return s;
    }

    case "retry_storm": {
      const retryCfg = {
        enabled: true,
        maxAttempts: 3,
        initialBackoffMs: 30,
        maxBackoffMs: 120,
        exponentialFactor: 2,
        jitterRatio: 0,
        retryBudgetPct: 1500,
        retryableHttpStatuses: [500, 502, 503, 504],
        retryableGrpcStatuses: ["UNAVAILABLE", "DEADLINE_EXCEEDED"],
      };
      s.resilience = [
        {
          serviceId: "orders",
          attemptTimeoutMs: 600,
          overallDeadlineMs: 2500,
          retry: retryCfg,
          circuitBreaker: {
            enabled: false,
            scope: "destination_service",
            rollingWindowMs: 5000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1000,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 10, queueCapacity: 4, queueTimeoutMs: 50 },
        },
        {
          serviceId: "payments",
          attemptTimeoutMs: 500,
          overallDeadlineMs: 2500,
          retry: retryCfg,
          circuitBreaker: {
            enabled: false,
            scope: "destination_service",
            rollingWindowMs: 5000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1000,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 10, queueCapacity: 4, queueTimeoutMs: 50 },
        },
      ];
      s.failures = [
        {
          id: "f-storm",
          type: "packet_loss",
          targetId: "payments",
          atMs: 0,
          grpcErrorCode: "UNAVAILABLE",
          description: "Persistent failure amplifies nested retries across Orders and Payments.",
        },
      ];
      return s;
    }

    case "circuit_breaker_opening": {
      s.resilience = [
        {
          serviceId: "payments",
          attemptTimeoutMs: 400,
          overallDeadlineMs: 1500,
          retry: {
            enabled: false,
            maxAttempts: 1,
            initialBackoffMs: 50,
            maxBackoffMs: 200,
            exponentialFactor: 2,
            jitterRatio: 0,
            retryBudgetPct: 100,
            retryableHttpStatuses: [503],
            retryableGrpcStatuses: ["UNAVAILABLE"],
          },
          circuitBreaker: {
            enabled: true,
            scope: "destination_service",
            rollingWindowMs: 10000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1500,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 8, queueCapacity: 4, queueTimeoutMs: 50 },
        },
      ];
      s.failures = [
        {
          id: "f-cb-fail",
          type: "connection_reset",
          targetId: "payments",
          atMs: 0,
          grpcErrorCode: "UNAVAILABLE",
          description: "Payments fails; trips circuit breaker OPEN after 4 requests.",
        },
      ];
      s.workload = Array.from({ length: 7 }, (_, i) => ({
        id: `wl-${i + 1}`,
        atMs: i * 100,
        entryServiceId: "api",
        operation: "POST /api/orders",
        protocol: "http" as const,
        headers: {},
        path: "/api/orders",
        concurrentCount: 1,
      }));
      return s;
    }

    case "half_open_recovery": {
      s.resilience = [
        {
          serviceId: "payments",
          attemptTimeoutMs: 400,
          overallDeadlineMs: 1500,
          retry: {
            enabled: false,
            maxAttempts: 1,
            initialBackoffMs: 50,
            maxBackoffMs: 200,
            exponentialFactor: 2,
            jitterRatio: 0,
            retryBudgetPct: 100,
            retryableHttpStatuses: [503],
            retryableGrpcStatuses: ["UNAVAILABLE"],
          },
          circuitBreaker: {
            enabled: true,
            scope: "destination_service",
            rollingWindowMs: 10000,
            minimumRequests: 3,
            failureRateThresholdPct: 50,
            openDurationMs: 500,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 8, queueCapacity: 4, queueTimeoutMs: 50 },
        },
      ];
      s.failures = [
        {
          id: "f-outage-window",
          type: "connection_reset",
          targetId: "payments",
          atMs: 0,
          recoveryAtMs: 700,
          grpcErrorCode: "UNAVAILABLE",
          description: "Payments fails until +700ms; circuit probes in HALF_OPEN then closes.",
        },
      ];
      s.workload = [0, 100, 200, 400, 950, 1050, 1150].map((t, i) => ({
        id: `wl-${i + 1}`,
        atMs: t,
        entryServiceId: "api",
        operation: "POST /api/orders",
        protocol: "http" as const,
        headers: {},
        path: "/api/orders",
        concurrentCount: 1,
      }));
      return s;
    }

    case "bulkhead_saturation": {
      s.resilience = [
        {
          serviceId: "payments",
          attemptTimeoutMs: 800,
          overallDeadlineMs: 2000,
          retry: {
            enabled: false,
            maxAttempts: 1,
            initialBackoffMs: 50,
            maxBackoffMs: 200,
            exponentialFactor: 2,
            jitterRatio: 0,
            retryBudgetPct: 100,
            retryableHttpStatuses: [503],
            retryableGrpcStatuses: ["UNAVAILABLE"],
          },
          circuitBreaker: {
            enabled: false,
            scope: "destination_service",
            rollingWindowMs: 5000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1000,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: {
            enabled: true,
            maxActive: 3,
            queueCapacity: 2,
            queueTimeoutMs: 40,
          },
        },
      ];
      s.workload = [
        {
          id: "wl-burst",
          atMs: 0,
          entryServiceId: "api",
          operation: "POST /api/orders",
          protocol: "http",
          headers: {},
          path: "/api/orders",
          concurrentCount: 8,
        },
      ];
      return s;
    }

    case "connection_pool_exhaustion": {
      s.proxies[1]!.maxConnections = 3; // proxy-orders -> payments pool max 3
      s.workload = [
        {
          id: "wl-pool-burst",
          atMs: 0,
          entryServiceId: "api",
          operation: "POST /api/orders",
          protocol: "http",
          headers: {},
          path: "/api/orders",
          concurrentCount: 6,
        },
      ];
      return s;
    }

    case "weighted_traffic_split": {
      s.instances.push({
        id: "payments-v2-a",
        serviceId: "payments",
        revision: "v2",
        region: "us-east",
        weight: 100,
        healthy: true,
        ready: true,
        capacityRps: 120,
        maxConcurrent: 16,
        baseLatencyMs: 18,
        certificateValid: true,
        trustDomain: "example.local",
      });
      s.routing = [
        {
          id: "split-payments",
          destinationServiceId: "payments",
          matchHeaders: {},
          splits: [
            { revision: "v1", weight: 90 },
            { revision: "v2", weight: 10 },
          ],
          loadBalancing: "round_robin",
        },
      ];
      s.workload = Array.from({ length: 10 }, (_, i) => ({
        id: `wl-${i + 1}`,
        atMs: i * 100,
        entryServiceId: "api",
        operation: "POST /api/orders",
        protocol: "http" as const,
        headers: {},
        path: "/api/orders",
        concurrentCount: 1,
      }));
      return s;
    }

    case "canary_promotion": {
      s.instances.push({
        id: "payments-v2-a",
        serviceId: "payments",
        revision: "v2",
        region: "us-east",
        weight: 100,
        healthy: true,
        ready: true,
        capacityRps: 120,
        maxConcurrent: 16,
        baseLatencyMs: 16,
        certificateValid: true,
        trustDomain: "example.local",
      });
      s.canary = {
        enabled: true,
        serviceId: "payments",
        stableRevision: "v1",
        canaryRevision: "v2",
        stagesPct: [50, 100],
        evaluationIntervalMs: 400,
        minSamples: 2,
        maxErrorRatePct: 20,
      };
      s.workload = Array.from({ length: 10 }, (_, i) => ({
        id: `wl-${i + 1}`,
        atMs: i * 70,
        entryServiceId: "api",
        operation: "POST /api/orders",
        protocol: "http" as const,
        headers: {},
        path: "/api/orders",
        concurrentCount: 1,
      }));
      return s;
    }

    case "canary_rollback": {
      s.instances.push({
        id: "payments-v2-buggy",
        serviceId: "payments",
        revision: "v2",
        region: "us-east",
        weight: 100,
        healthy: true,
        ready: true,
        capacityRps: 120,
        maxConcurrent: 16,
        baseLatencyMs: 95,
        certificateValid: true,
        trustDomain: "example.local",
      });
      s.canary = {
        enabled: true,
        serviceId: "payments",
        stableRevision: "v1",
        canaryRevision: "v2",
        stagesPct: [50, 100],
        evaluationIntervalMs: 350,
        minSamples: 2,
        maxErrorRatePct: 10,
      };
      // Simulate v2 latency + tight timeout causing high error rate -> automatic rollback
      s.resilience = [
        {
          serviceId: "payments",
          attemptTimeoutMs: 45,
          overallDeadlineMs: 1500,
          retry: {
            enabled: false,
            maxAttempts: 1,
            initialBackoffMs: 50,
            maxBackoffMs: 200,
            exponentialFactor: 2,
            jitterRatio: 0,
            retryBudgetPct: 100,
            retryableHttpStatuses: [504],
            retryableGrpcStatuses: ["DEADLINE_EXCEEDED"],
          },
          circuitBreaker: {
            enabled: false,
            scope: "destination_service",
            rollingWindowMs: 5000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1000,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 8, queueCapacity: 4, queueTimeoutMs: 50 },
        },
      ];
      s.workload = Array.from({ length: 8 }, (_, i) => ({
        id: `wl-${i + 1}`,
        atMs: i * 60,
        entryServiceId: "api",
        operation: "POST /api/orders",
        protocol: "http" as const,
        headers: {},
        path: "/api/orders",
        concurrentCount: 1,
      }));
      return s;
    }

    case "cascading_failure": {
      s.services.push({
        id: "fraud",
        name: "Fraud Service",
        namespace: "production",
        protocol: "grpc",
        proxyMode: "sidecar",
        identity: "spiffe://example.local/ns/production/sa/fraud",
        defaultTimeoutMs: 400,
        baseProcessingMs: 20,
        dependencies: [],
        operations: ["ScoreRisk"],
        fallbackMode: "none",
      });
      s.services[2]!.dependencies = [
        {
          targetServiceId: "fraud",
          operation: "ScoreRisk",
          protocol: "grpc",
          required: true,
          fallbackMode: "none",
        },
      ];
      s.instances.push({
        id: "fraud-v1-a",
        serviceId: "fraud",
        revision: "v1",
        region: "us-east",
        weight: 100,
        healthy: true,
        ready: true,
        capacityRps: 100,
        maxConcurrent: 16,
        baseLatencyMs: 20,
        certificateValid: true,
        trustDomain: "example.local",
      });
      s.proxies.push({
        id: "proxy-fraud",
        mode: "sidecar",
        attachedServiceId: "fraud",
        healthy: true,
        proxyOverheadMs: 2,
        maxConnections: 16,
        connectionTimeoutMs: 200,
      });
      s.failures = [
        {
          id: "f-fraud-outage",
          type: "connection_reset",
          targetId: "fraud",
          atMs: 0,
          grpcErrorCode: "UNAVAILABLE",
          description: "Fraud outage cascades up Payments -> Orders -> API.",
        },
      ];
      return s;
    }

    case "graceful_degradation": {
      s.services[1]!.dependencies[0]!.fallbackMode = "cached";
      s.failures = [
        {
          id: "f-pay-down",
          type: "connection_reset",
          targetId: "payments",
          atMs: 0,
          grpcErrorCode: "UNAVAILABLE",
          description: "Orders falls back to degraded response rather than hard 503.",
        },
      ];
      return s;
    }

    case "partial_response": {
      s.services = [
        {
          id: "product-page",
          name: "Product Page BFF",
          namespace: "production",
          protocol: "http",
          proxyMode: "sidecar",
          identity: "spiffe://example.local/ns/production/sa/product-page",
          defaultTimeoutMs: 1000,
          baseProcessingMs: 12,
          dependencies: [
            {
              targetServiceId: "catalog",
              operation: "GetProduct",
              protocol: "grpc",
              required: true,
              parallelGroup: "page-fanout",
              fallbackMode: "none",
            },
            {
              targetServiceId: "reviews",
              operation: "ListReviews",
              protocol: "grpc",
              required: false,
              parallelGroup: "page-fanout",
              fallbackMode: "skip_optional",
            },
            {
              targetServiceId: "recs",
              operation: "GetRecommendations",
              protocol: "grpc",
              required: false,
              parallelGroup: "page-fanout",
              fallbackMode: "skip_optional",
            },
          ],
          operations: ["GET /products/42"],
          fallbackMode: "partial",
        },
        {
          id: "catalog",
          name: "Catalog Service",
          namespace: "production",
          protocol: "grpc",
          proxyMode: "sidecar",
          identity: "spiffe://example.local/ns/production/sa/catalog",
          defaultTimeoutMs: 400,
          baseProcessingMs: 25,
          dependencies: [],
          operations: ["GetProduct"],
          fallbackMode: "none",
        },
        {
          id: "reviews",
          name: "Reviews Service",
          namespace: "production",
          protocol: "grpc",
          proxyMode: "sidecar",
          identity: "spiffe://example.local/ns/production/sa/reviews",
          defaultTimeoutMs: 400,
          baseProcessingMs: 30,
          dependencies: [],
          operations: ["ListReviews"],
          fallbackMode: "none",
        },
        {
          id: "recs",
          name: "Recommendations Service",
          namespace: "production",
          protocol: "grpc",
          proxyMode: "sidecar",
          identity: "spiffe://example.local/ns/production/sa/recs",
          defaultTimeoutMs: 400,
          baseProcessingMs: 45,
          dependencies: [],
          operations: ["GetRecommendations"],
          fallbackMode: "none",
        },
      ];
      s.instances = [
        {
          id: "product-v1",
          serviceId: "product-page",
          revision: "v1",
          region: "us-east",
          weight: 100,
          healthy: true,
          ready: true,
          capacityRps: 100,
          maxConcurrent: 16,
          baseLatencyMs: 12,
          certificateValid: true,
          trustDomain: "example.local",
        },
        {
          id: "catalog-v1",
          serviceId: "catalog",
          revision: "v1",
          region: "us-east",
          weight: 100,
          healthy: true,
          ready: true,
          capacityRps: 100,
          maxConcurrent: 16,
          baseLatencyMs: 25,
          certificateValid: true,
          trustDomain: "example.local",
        },
        {
          id: "reviews-v1",
          serviceId: "reviews",
          revision: "v1",
          region: "us-east",
          weight: 100,
          healthy: true,
          ready: true,
          capacityRps: 100,
          maxConcurrent: 16,
          baseLatencyMs: 30,
          certificateValid: true,
          trustDomain: "example.local",
        },
        {
          id: "recs-v1",
          serviceId: "recs",
          revision: "v1",
          region: "us-east",
          weight: 100,
          healthy: true,
          ready: true,
          capacityRps: 100,
          maxConcurrent: 16,
          baseLatencyMs: 45,
          certificateValid: true,
          trustDomain: "example.local",
        },
      ];
      s.proxies = [];
      s.workload = [
        {
          id: "wl-page",
          atMs: 0,
          entryServiceId: "product-page",
          operation: "GET /products/42",
          protocol: "http",
          headers: {},
          path: "/products/42",
          concurrentCount: 1,
        },
      ];
      s.failures = [
        {
          id: "f-reviews-down",
          type: "connection_reset",
          targetId: "reviews",
          atMs: 0,
          grpcErrorCode: "UNAVAILABLE",
          description: "Optional Reviews service down; Product Page serves partial response.",
        },
      ];
      return s;
    }

    case "regional_service_outage": {
      s.instances.push({
        id: "payments-eu-a",
        serviceId: "payments",
        revision: "v1",
        region: "eu-west",
        weight: 100,
        healthy: true,
        ready: true,
        capacityRps: 120,
        maxConcurrent: 16,
        baseLatencyMs: 28,
        certificateValid: true,
        trustDomain: "example.local",
      });
      s.discovery.cacheEnabled = false;
      s.failures = [
        {
          id: "f-us-east-out",
          type: "regional_outage",
          targetId: "us-east",
          atMs: 100,
          description: "US-East outage shifts Payments traffic to eu-west replica.",
        },
      ];
      s.instances.push(
        {
          id: "api-eu-a",
          serviceId: "api",
          revision: "v1",
          region: "eu-west",
          weight: 100,
          healthy: true,
          ready: true,
          capacityRps: 120,
          maxConcurrent: 16,
          baseLatencyMs: 14,
          certificateValid: true,
          trustDomain: "example.local",
        },
        {
          id: "orders-eu-a",
          serviceId: "orders",
          revision: "v1",
          region: "eu-west",
          weight: 100,
          healthy: true,
          ready: true,
          capacityRps: 120,
          maxConcurrent: 16,
          baseLatencyMs: 18,
          certificateValid: true,
          trustDomain: "example.local",
        }
      );
      s.workload = [
        {
          id: "wl-1",
          atMs: 0,
          entryServiceId: "api",
          operation: "POST /api/orders",
          protocol: "http",
          headers: {},
          path: "/api/orders",
          concurrentCount: 1,
        },
        {
          id: "wl-2",
          atMs: 250,
          entryServiceId: "api",
          operation: "POST /api/orders",
          protocol: "http",
          headers: {},
          path: "/api/orders",
          concurrentCount: 1,
        },
      ];
      return s;
    }

    case "proxy_failure": {
      s.failures = [
        {
          id: "f-proxy-pay",
          type: "proxy_failure",
          targetId: "proxy-payments",
          atMs: 0,
          description: "Payments inbound sidecar proxy crashes before forwarding to app.",
        },
      ];
      return s;
    }

    case "combined_retry_circuit_breaker": {
      s.resilience = [
        {
          serviceId: "payments",
          attemptTimeoutMs: 300,
          overallDeadlineMs: 2000,
          retry: {
            enabled: true,
            maxAttempts: 2,
            initialBackoffMs: 40,
            maxBackoffMs: 100,
            exponentialFactor: 2,
            jitterRatio: 0,
            retryBudgetPct: 400,
            retryableHttpStatuses: [503],
            retryableGrpcStatuses: ["UNAVAILABLE"],
          },
          circuitBreaker: {
            enabled: true,
            scope: "destination_service",
            rollingWindowMs: 10000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1500,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 8, queueCapacity: 4, queueTimeoutMs: 50 },
        },
      ];
      s.failures = [
        {
          id: "f-pay-down",
          type: "connection_reset",
          targetId: "payments",
          atMs: 0,
          grpcErrorCode: "UNAVAILABLE",
          description: "Retries quickly trip circuit breaker OPEN so later requests fail fast.",
        },
      ];
      s.workload = Array.from({ length: 5 }, (_, i) => ({
        id: `wl-${i + 1}`,
        atMs: i * 120,
        entryServiceId: "api",
        operation: "POST /api/orders",
        protocol: "http" as const,
        headers: {},
        path: "/api/orders",
        concurrentCount: 1,
      }));
      return s;
    }

    case "deadline_propagation": {
      s.resilience = [
        {
          serviceId: "api",
          attemptTimeoutMs: 320,
          overallDeadlineMs: 320,
          retry: {
            enabled: false,
            maxAttempts: 1,
            initialBackoffMs: 50,
            maxBackoffMs: 200,
            exponentialFactor: 2,
            jitterRatio: 0,
            retryBudgetPct: 100,
            retryableHttpStatuses: [504],
            retryableGrpcStatuses: ["DEADLINE_EXCEEDED"],
          },
          circuitBreaker: {
            enabled: false,
            scope: "destination_service",
            rollingWindowMs: 5000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1000,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 8, queueCapacity: 4, queueTimeoutMs: 50 },
        },
        {
          serviceId: "payments",
          attemptTimeoutMs: 500,
          overallDeadlineMs: 1200,
          retry: {
            enabled: true,
            maxAttempts: 3,
            initialBackoffMs: 120,
            maxBackoffMs: 400,
            exponentialFactor: 2,
            jitterRatio: 0,
            retryBudgetPct: 300,
            retryableHttpStatuses: [504],
            retryableGrpcStatuses: ["DEADLINE_EXCEEDED"],
          },
          circuitBreaker: {
            enabled: false,
            scope: "destination_service",
            rollingWindowMs: 5000,
            minimumRequests: 4,
            failureRateThresholdPct: 50,
            openDurationMs: 1000,
            halfOpenProbeLimit: 2,
            successThreshold: 2,
          },
          bulkhead: { enabled: false, maxActive: 8, queueCapacity: 4, queueTimeoutMs: 50 },
        },
      ];
      s.failures = [
        {
          id: "f-slow-deadline",
          type: "latency_spike",
          targetId: "payments",
          atMs: 0,
          addedLatencyMs: 260,
          description: "Inherited overall API deadline stops Payments retries once budget depletes.",
        },
      ];
      return s;
    }
  }
}
