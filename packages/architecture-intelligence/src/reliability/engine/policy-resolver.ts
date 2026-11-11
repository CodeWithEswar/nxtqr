import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { NodeReliabilityProfile } from "../schemas/reliability.schemas";

export class PolicyResolver {
  public static resolveProfiles(
    nodes: BaseNode[],
    edges: BaseEdge[]
  ): Record<string, NodeReliabilityProfile> {
    const profiles: Record<string, NodeReliabilityProfile> = {};

    // Map to check if a circuit-breaker node or fallback edge connects to a node
    const circuitBreakerTargets = new Set<string>();
    const fallbackTargets = new Set<string>();

    for (const node of nodes) {
      const data = (node.data || {}) as Record<string, unknown>;
      if (data.componentType === "circuit-breaker" || node.type === "circuit-breaker") {
        for (const e of edges) {
          if (e.source === node.id) circuitBreakerTargets.add(e.target);
          if (e.target === node.id) circuitBreakerTargets.add(e.source);
        }
      }
    }

    for (const edge of edges) {
      const data = (edge.data || {}) as Record<string, unknown>;
      if (data.isFallback === true || data.relationshipKind === "fallback") {
        fallbackTargets.add(edge.source);
      }
    }

    for (const node of nodes) {
      const raw = (node.data || {}) as Record<string, unknown>;
      const componentType = String(raw.componentType || node.type || "");
      const provenance: Record<string, "configured" | "derived" | "unknown" | "not-applicable"> = {};

      // 1. Criticality
      let criticality: "mission-critical" | "business-critical" | "supporting" | "optional" = "business-critical";
      if (raw.criticality && ["mission-critical", "business-critical", "supporting", "optional"].includes(String(raw.criticality))) {
        criticality = raw.criticality as any;
        provenance.criticality = "configured";
      } else {
        // Derive from component role
        if (
          componentType.includes("payment") ||
          componentType.includes("auth") ||
          componentType.includes("database") ||
          raw.isPaymentGateway === true ||
          raw.isAuthService === true
        ) {
          criticality = "mission-critical";
          provenance.criticality = "derived";
        } else if (
          componentType.includes("telemetry") ||
          componentType.includes("analytics") ||
          componentType.includes("recommendation") ||
          componentType.includes("notification")
        ) {
          criticality = "optional";
          provenance.criticality = "derived";
        } else {
          criticality = "business-critical";
          provenance.criticality = "derived";
        }
      }

      // 2. Idempotency
      let isIdempotent = false;
      if (raw.isIdempotent !== undefined) {
        isIdempotent = Boolean(raw.isIdempotent);
        provenance.isIdempotent = "configured";
      } else if (raw.idempotencyEnabled !== undefined) {
        isIdempotent = Boolean(raw.idempotencyEnabled);
        provenance.isIdempotent = "configured";
      } else {
        // Derived: pure read stores and caches are naturally idempotent
        if (
          componentType.includes("cache") ||
          componentType.includes("cdn") ||
          raw.readOnly === true
        ) {
          isIdempotent = true;
          provenance.isIdempotent = "derived";
        } else {
          isIdempotent = false;
          provenance.isIdempotent = "unknown";
        }
      }

      // 3. Circuit Breaker
      let hasCircuitBreaker = false;
      if (raw.hasCircuitBreaker !== undefined || raw.circuitBreakerEnabled !== undefined) {
        hasCircuitBreaker = Boolean(raw.hasCircuitBreaker ?? raw.circuitBreakerEnabled);
        provenance.hasCircuitBreaker = "configured";
      } else if (circuitBreakerTargets.has(node.id)) {
        hasCircuitBreaker = true;
        provenance.hasCircuitBreaker = "derived";
      } else {
        hasCircuitBreaker = false;
        provenance.hasCircuitBreaker = "unknown";
      }

      // 4. Bulkhead Isolation
      let hasBulkhead = false;
      if (raw.hasBulkhead !== undefined || raw.bulkheadEnabled !== undefined || raw.isolatedPools !== undefined) {
        hasBulkhead = Boolean(raw.hasBulkhead ?? raw.bulkheadEnabled ?? raw.isolatedPools);
        provenance.hasBulkhead = "configured";
      } else {
        hasBulkhead = false;
        provenance.hasBulkhead = "unknown";
      }

      // 5. Fallback
      let hasFallback = false;
      if (raw.hasFallback !== undefined || raw.fallbackEnabled !== undefined) {
        hasFallback = Boolean(raw.hasFallback ?? raw.fallbackEnabled);
        provenance.hasFallback = "configured";
      } else if (fallbackTargets.has(node.id) || raw.fallbackNodeId) {
        hasFallback = true;
        provenance.hasFallback = "derived";
      } else {
        hasFallback = false;
        provenance.hasFallback = "unknown";
      }

      // 6. Rate Limiting / Admission Control
      let hasRateLimit = false;
      if (raw.hasRateLimit !== undefined || raw.rateLimitingEnabled !== undefined) {
        hasRateLimit = Boolean(raw.hasRateLimit ?? raw.rateLimitingEnabled);
        provenance.hasRateLimit = "configured";
      } else {
        hasRateLimit = false;
        provenance.hasRateLimit = "unknown";
      }

      // 7. Dead Letter Queue
      let hasDeadLetterQueue = false;
      if (raw.hasDeadLetterQueue !== undefined || raw.dlqEnabled !== undefined || raw.dlqConfigured !== undefined) {
        hasDeadLetterQueue = Boolean(raw.hasDeadLetterQueue ?? raw.dlqEnabled ?? raw.dlqConfigured);
        provenance.hasDeadLetterQueue = "configured";
      } else {
        hasDeadLetterQueue = false;
        provenance.hasDeadLetterQueue = componentType.includes("queue") || componentType.includes("broker") ? "unknown" : "not-applicable";
      }

      // 8. Declared Timeout
      let declaredTimeoutMs: number | null = null;
      const rawTimeout = raw.timeoutMs ?? raw.requestTimeoutMs ?? raw.timeout;
      if (typeof rawTimeout === "number" && rawTimeout > 0) {
        declaredTimeoutMs = rawTimeout;
        provenance.declaredTimeoutMs = "configured";
      } else {
        declaredTimeoutMs = null;
        provenance.declaredTimeoutMs = "unknown";
      }

      // 9. Max Retry Attempts
      let maxRetryAttempts: number | null = null;
      const rawRetries = raw.maxRetries ?? raw.retries ?? raw.retryAttempts;
      if (typeof rawRetries === "number" && rawRetries >= 0) {
        maxRetryAttempts = rawRetries;
        provenance.maxRetryAttempts = "configured";
      } else {
        maxRetryAttempts = null;
        provenance.maxRetryAttempts = "unknown";
      }

      profiles[node.id] = {
        nodeId: node.id,
        criticality,
        isIdempotent,
        hasCircuitBreaker,
        hasBulkhead,
        hasFallback,
        hasRateLimit,
        hasDeadLetterQueue,
        declaredTimeoutMs,
        maxRetryAttempts,
        provenance,
      };
    }

    return profiles;
  }
}

