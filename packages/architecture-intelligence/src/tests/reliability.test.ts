import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { reliabilityEngine } from "../index";

describe("Reliability & Resilience Analysis Engine (Phase 05.3.7)", () => {
  it("detects retry storm and non-idempotent mutation retry risks", () => {
    const nodes: BaseNode[] = [
      {
        id: "checkout_svc",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "compute-instance",
          label: "Checkout Service",
          maxRetries: 7, // excessive retries (> 5)
          retryEnabled: true,
          backoffType: "fixed", // missing exponential backoff with jitter
        },
      },
      {
        id: "payment_gw",
        type: "infrastructure",
        position: { x: 200, y: 0 },
        data: {
          componentType: "payment-gateway",
          label: "Payment Gateway",
          isMutating: true,
          isIdempotent: false,
          retryEnabled: true,
          maxRetries: 2,
          // missing idempotencyKey
        },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "checkout_svc", target: "payment_gw", data: { protocol: "https" } },
    ];

    const report = reliabilityEngine.analyzeGraph(nodes, edges);

    const excessiveRetry = report.findings.find((f) => f.ruleId === "REL-RETRY-001");
    expect(excessiveRetry).toBeDefined();
    expect(excessiveRetry?.severity).toBe("high");

    const fixedBackoff = report.findings.find((f) => f.ruleId === "REL-RETRY-002");
    expect(fixedBackoff).toBeDefined();

    const nonIdempotentRetry = report.findings.find((f) => f.ruleId === "REL-RETRY-004");
    expect(nonIdempotentRetry).toBeDefined();
    expect(nonIdempotentRetry?.severity).toBe("critical");
  });

  it("detects deadline inversion and missing remote timeouts", () => {
    const nodes: BaseNode[] = [
      {
        id: "api_gateway",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "api-gateway",
          label: "API Gateway",
          timeoutMs: 500, // caller deadline: 500ms
        },
      },
      {
        id: "order_svc",
        type: "infrastructure",
        position: { x: 200, y: 0 },
        data: {
          componentType: "compute-instance",
          label: "Order Service",
          timeoutMs: 2000, // callee timeout: 2000ms -> Deadline Inversion!
        },
      },
      {
        id: "unshielded_db",
        type: "infrastructure",
        position: { x: 400, y: 0 },
        data: {
          componentType: "relational-database",
          label: "Database",
          criticality: "mission-critical",
          // missing timeout
        },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "api_gateway", target: "order_svc", data: { isSynchronous: true } },
      { id: "e2", source: "order_svc", target: "unshielded_db", data: { isSynchronous: true } },
    ];

    const report = reliabilityEngine.analyzeGraph(nodes, edges);

    // Deadline Inversion
    const deadlineInversion = report.findings.find((f) => f.ruleId === "REL-TIME-002");
    expect(deadlineInversion).toBeDefined();
    expect(deadlineInversion?.affectedNodeIds).toContain("api_gateway");
    expect(deadlineInversion?.affectedNodeIds).toContain("order_svc");

    // Missing Timeout
    const missingTimeout = report.findings.find(
      (f) => f.ruleId === "REL-TIME-001" && f.affectedNodeIds.includes("unshielded_db")
    );
    expect(missingTimeout).toBeDefined();
  });

  it("evaluates circuit breaker protection on mission-critical dependencies", () => {
    const nodes: BaseNode[] = [
      {
        id: "web_app",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: { componentType: "web-server", label: "Web Server" },
      },
      {
        id: "auth_provider",
        type: "infrastructure",
        position: { x: 200, y: 0 },
        data: {
          componentType: "external-service",
          label: "External Auth Provider",
          criticality: "mission-critical",
          hasCircuitBreaker: false,
        },
      },
      {
        id: "payment_processor",
        type: "infrastructure",
        position: { x: 200, y: 100 },
        data: {
          componentType: "payment-gateway",
          label: "Stripe Gateway",
          hasCircuitBreaker: true,
          hasFallback: false, // Breaker without fallback!
        },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "web_app", target: "auth_provider", data: { isSynchronous: true } },
      { id: "e2", source: "web_app", target: "payment_processor", data: { isSynchronous: true } },
    ];

    const report = reliabilityEngine.analyzeGraph(nodes, edges);

    // Unprotected critical dependency
    const unprotected = report.findings.find(
      (f) => f.ruleId === "REL-CB-001" && f.affectedNodeIds.includes("auth_provider")
    );
    expect(unprotected).toBeDefined();

    // Breaker without fallback
    const noFallback = report.findings.find(
      (f) => f.ruleId === "REL-CB-002" && f.affectedNodeIds.includes("payment_processor")
    );
    expect(noFallback).toBeDefined();
  });

  it("evaluates bulkhead isolation on heterogeneous caller workloads", () => {
    const nodes: BaseNode[] = [
      {
        id: "app_core",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "compute-instance",
          label: "Core App",
          hasBulkhead: false, // Shared thread pool
        },
      },
      {
        id: "payment_api",
        type: "infrastructure",
        position: { x: 200, y: -50 },
        data: { componentType: "payment-gateway", criticality: "mission-critical" },
      },
      {
        id: "analytics_api",
        type: "infrastructure",
        position: { x: 200, y: 50 },
        data: { componentType: "analytics-engine", criticality: "optional" },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "app_core", target: "payment_api", data: {} },
      { id: "e2", source: "app_core", target: "analytics_api", data: {} },
    ];

    const report = reliabilityEngine.analyzeGraph(nodes, edges);

    const bulkheadFinding = report.findings.find((f) => f.ruleId === "REL-BULK-001");
    expect(bulkheadFinding).toBeDefined();
    expect(bulkheadFinding?.affectedNodeIds).toContain("app_core");
  });

  it("evaluates messaging guarantees (missing DLQ and at-least-once deduplication)", () => {
    const nodes: BaseNode[] = [
      {
        id: "order_queue",
        type: "infrastructure",
        position: { x: 0, y: 0 },
        data: {
          componentType: "message-queue",
          label: "Order Queue",
          hasDeadLetterQueue: false, // Missing DLQ
        },
      },
      {
        id: "order_worker",
        type: "infrastructure",
        position: { x: 200, y: 0 },
        data: {
          componentType: "container-service",
          label: "Order Worker",
          isIdempotent: false, // Un-deduplicated consumer
        },
      },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "order_queue", target: "order_worker", data: {} },
    ];

    const report = reliabilityEngine.analyzeGraph(nodes, edges);

    const missingDlq = report.findings.find((f) => f.ruleId === "REL-MSG-001");
    expect(missingDlq).toBeDefined();

    const nonIdempotentConsumer = report.findings.find((f) => f.ruleId === "REL-MSG-002");
    expect(nonIdempotentConsumer).toBeDefined();
  });

  it("evaluates graceful degradation (flags crash on optional and unsafe financial fallback)", () => {
    const nodes: BaseNode[] = [
      { id: "portal", type: "infrastructure", position: { x: 0, y: 0 }, data: { componentType: "web-server" } },
      { id: "recommendations", type: "infrastructure", position: { x: 200, y: 0 }, data: { componentType: "recommendation-service", criticality: "optional", hasFallback: false } },
      { id: "billing", type: "infrastructure", position: { x: 200, y: 100 }, data: { componentType: "payment-gateway", isPaymentGateway: true } },
    ];

    const edges: BaseEdge[] = [
      { id: "e_rec", source: "portal", target: "recommendations", data: {} },
      { id: "e_bill", source: "portal", target: "billing", data: { fallbackAction: "approve" } }, // Catastrophic unsafe fallback!
    ];

    const report = reliabilityEngine.analyzeGraph(nodes, edges);

    const missingOptionalFallback = report.findings.find((f) => f.ruleId === "REL-DEGR-001");
    expect(missingOptionalFallback).toBeDefined();

    const unsafePaymentFallback = report.findings.find((f) => f.ruleId === "REL-DEGR-002");
    expect(unsafePaymentFallback).toBeDefined();
    expect(unsafePaymentFallback?.severity).toBe("critical");
  });

  it("traces cascading failure propagation chains and flags uncontained paths", () => {
    const nodes: BaseNode[] = [
      { id: "ingress", type: "infrastructure", position: { x: 0, y: 0 }, data: { componentType: "api-gateway", label: "Ingress GW" } },
      { id: "service_a", type: "infrastructure", position: { x: 150, y: 0 }, data: { componentType: "compute-instance", label: "Service A", hasCircuitBreaker: false } },
      { id: "service_b", type: "infrastructure", position: { x: 300, y: 0 }, data: { componentType: "compute-instance", label: "Service B", hasCircuitBreaker: false } },
      { id: "legacy_db", type: "infrastructure", position: { x: 450, y: 0 }, data: { componentType: "relational-database", label: "Legacy DB" } },
    ];

    const edges: BaseEdge[] = [
      { id: "e1", source: "ingress", target: "service_a", data: { isSynchronous: true } },
      { id: "e2", source: "service_a", target: "service_b", data: { isSynchronous: true } },
      { id: "e3", source: "service_b", target: "legacy_db", data: { isSynchronous: true } },
    ];

    const report = reliabilityEngine.analyzeGraph(nodes, edges);

    const cascading = report.findings.find((f) => f.ruleId === "REL-CASC-001");
    expect(cascading).toBeDefined();
    expect(cascading?.propagationChain).toEqual(["ingress", "service_a", "service_b", "legacy_db"]);
  });
});

