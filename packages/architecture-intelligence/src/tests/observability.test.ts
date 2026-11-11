import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { SsrfValidator, TelemetryRedactor } from "../observability/gateway/ssrf-protection";
import { MetricNormalizer } from "../observability/telemetry/metric-normalizer";
import { ServiceIdentityMapper } from "../observability/mapping/service-identity-mapper";
import { ServiceHealthEvaluator } from "../observability/analysis/service-health-evaluator";
import { TopologyDriftDetector } from "../observability/analysis/topology-drift-detector";
import { ObservedModeledComparator } from "../observability/analysis/observed-modeled-comparator";
import { SloEvaluator } from "../observability/slo/slo-evaluator";
import { PrometheusAdapter } from "../observability/connectors/prometheus-adapter";
import { OpenTelemetryAdapter } from "../observability/connectors/opentelemetry-adapter";
import { MockTelemetryAdapter } from "../observability/connectors/mock-telemetry-adapter";
import { TelemetryConnectorRegistry } from "../observability/connectors/connector-registry";
import type {
  DiscoveredService,
  TelemetryServiceMapping,
  MetricDataPoint,
  MetricSeries,
  SloDefinition,
  TraceSpan,
} from "../observability/contracts/observability.types";

describe("Architecture Observability - SSRF Gateway Protection", () => {
  it("allows valid public HTTPS and HTTP domains", () => {
    expect(SsrfValidator.validateEndpoint("https://prometheus.mycorp.internal.example.com").isValid).toBe(true);
    expect(SsrfValidator.validateEndpoint("https://telemetry.eu-west-1.datadoghq.com/api").isValid).toBe(true);
    expect(SsrfValidator.validateEndpoint("http://metrics.corp.example.org:9090").isValid).toBe(true);
  });

  it("blocks dangerous loopback addresses (127.0.0.1, localhost, ::1)", () => {
    const res1 = SsrfValidator.validateEndpoint("http://localhost:9090");
    expect(res1.isValid).toBe(false);
    expect(res1.reason?.toLowerCase()).toContain("blocked loopback address");

    const res2 = SsrfValidator.validateEndpoint("http://127.0.0.1:8080/metrics");
    expect(res2.isValid).toBe(false);
    expect(res2.reason?.toLowerCase()).toContain("blocked loopback address");

    const res3 = SsrfValidator.validateEndpoint("http://[::1]:9090");
    expect(res3.isValid).toBe(false);
    expect(res3.reason?.toLowerCase()).toContain("blocked loopback address");
  });

  it("blocks AWS / GCP / Azure IMDS instance metadata (169.254.169.254)", () => {
    const res = SsrfValidator.validateEndpoint("http://169.254.169.254/latest/meta-data/");
    expect(res.isValid).toBe(false);
    expect(res.reason).toContain("link-local / cloud metadata service");
  });

  it("blocks non-HTTP/HTTPS protocols (file://, ftp://, gopher://)", () => {
    expect(SsrfValidator.validateEndpoint("file:///etc/passwd").isValid).toBe(false);
    expect(SsrfValidator.validateEndpoint("gopher://127.0.0.1:70").isValid).toBe(false);
    expect(SsrfValidator.validateEndpoint("ftp://ftp.example.com").isValid).toBe(false);
  });
});

describe("Architecture Observability - Telemetry Redactor", () => {
  it("masks Bearer tokens and Authorization headers", () => {
    const text = "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.t-ID";
    const redacted = TelemetryRedactor.redactText(text);
    expect(redacted).not.toContain("eyJhbGciOiJIUzI1Ni");
    expect(redacted).toContain("Bearer [REDACTED]");
  });

  it("masks sensitive query params (apiKey, secret, token)", () => {
    const text = "https://metrics.internal?apiKey=abcdef1234567890&user=alice";
    const redacted = TelemetryRedactor.redactText(text);
    expect(redacted).not.toContain("abcdef1234567890");
    expect(redacted).toContain("apiKey=[REDACTED]");
    expect(redacted).toContain("user=alice");
  });

  it("masks credit card numbers and SSNs", () => {
    const text = "Customer card 4111-2222-3333-4444 failed transaction with SSN 123-45-6789";
    const redacted = TelemetryRedactor.redactText(text);
    expect(redacted).not.toContain("4111-2222-3333-4444");
    expect(redacted).not.toContain("123-45-6789");
    expect(redacted).toContain("[REDACTED-CARD]");
    expect(redacted).toContain("[REDACTED-SSN]");
  });

  it("deeply redacts object payloads", () => {
    const payload = {
      user: "dev",
      password: "SuperSecretPassword123!",
      token: "secret-abc",
      metadata: {
        authorization: "Bearer 987654321",
        creditCard: "4532 0150 1234 5678",
      },
    };
    const redacted = TelemetryRedactor.redactObject(payload);
    expect(redacted.password).toBe("[REDACTED]");
    expect(redacted.token).toBe("[REDACTED]");
    expect(redacted.metadata.authorization).toBe("[REDACTED]");
    expect(redacted.metadata.creditCard).toContain("[REDACTED-CARD]");
  });
});

describe("Architecture Observability - Metric Normalizer", () => {
  it("computes per-second counter rate accurately for monotonic increasing series", () => {
    const series: MetricDataPoint[] = [
      { timestampMs: 1000, value: 100 },
      { timestampMs: 2000, value: 150 }, // delta 50 over 1s = 50 req/s
      { timestampMs: 4000, value: 250 }, // delta 100 over 2s = 50 req/s
    ];

    const rateSeries = MetricNormalizer.computeCounterRate(series);
    expect(rateSeries).toHaveLength(2);
    expect(rateSeries[0].value).toBe(50);
    expect(rateSeries[1].value).toBe(50);
  });

  it("handles counter reset (e.g. process restart) cleanly without producing negative rates", () => {
    const series: MetricDataPoint[] = [
      { timestampMs: 1000, value: 1000 },
      { timestampMs: 2000, value: 1100 }, // delta 100 in 1s = 100
      { timestampMs: 3000, value: 20 },   // Reset! (pod restarted, value dropped from 1100 to 20)
      { timestampMs: 4000, value: 60 },   // delta 40 in 1s = 40
    ];

    const rateSeries = MetricNormalizer.computeCounterRate(series);
    expect(rateSeries).toHaveLength(3);
    expect(rateSeries[0].value).toBe(100);
    expect(rateSeries[1].value).toBe(20); // Reset treated as 0 -> 20 = 20
    expect(rateSeries[2].value).toBe(40);
  });

  it("computes histogram quantiles via linear interpolation between bucket bounds", () => {
    // Buckets: <= 10: 10, <= 25: 40, <= 50: 80, <= 100: 100
    const buckets = [
      { le: 10, count: 10 },
      { le: 25, count: 40 },
      { le: 50, count: 80 },
      { le: 100, count: 100 },
    ];

    // Median (0.50): rank 50 is in bucket (25, 50], count span 40->80 (40 items).
    // offset = 50 - 40 = 10; fraction = 10/40 = 0.25; value = 25 + 0.25 * (50 - 25) = 25 + 6.25 = 31.25 ms.
    const p50 = MetricNormalizer.calculateHistogramQuantile(buckets, 0.5);
    expect(p50).toBeCloseTo(31.25, 1);

    // 95th percentile (0.95): rank 95 is in bucket (50, 100], count span 80->100 (20 items).
    // offset = 95 - 80 = 15; fraction = 15/20 = 0.75; value = 50 + 0.75 * 50 = 87.5 ms.
    const p95 = MetricNormalizer.calculateHistogramQuantile(buckets, 0.95);
    expect(p95).toBeCloseTo(87.5, 1);
  });

  it("normalizes latency units into milliseconds (ms)", () => {
    const secSeries: MetricSeries = {
      metricName: "http_duration_seconds",
      metricType: "gauge",
      labels: {},
      unit: "s",
      datapoints: [{ timestampMs: 1000, value: 0.15 }],
    };
    const normalized = MetricNormalizer.normalizeLatencyUnit(secSeries, "ms");
    expect(normalized.unit).toBe("ms");
    expect(normalized.datapoints[0].value).toBe(150);
  });

  it("evaluates metric data quality score", () => {
    const series: MetricSeries = {
      metricName: "http_requests_total",
      metricType: "counter",
      labels: {},
      unit: "rps",
      datapoints: [
        { timestampMs: 1000, value: 10 },
        { timestampMs: 2000, value: 15 },
        { timestampMs: 3000, value: 20 },
        { timestampMs: 4000, value: 25 },
      ],
    };
    const quality = MetricNormalizer.evaluateDataQuality([series], 1);
    expect(quality.qualityScore).toBe(100);
    expect(quality.isSparse).toBe(false);
  });
});

describe("Architecture Observability - Service Identity Mapping", () => {
  const nodes: BaseNode[] = [
    {
      id: "node-api",
      type: "service",
      position: { x: 0, y: 0 },
      data: { label: "API Gateway" },
    },
    {
      id: "node-auth",
      type: "service",
      position: { x: 100, y: 0 },
      data: { label: "Auth Service" },
    },
    {
      id: "node-db",
      type: "database",
      position: { x: 200, y: 0 },
      data: { label: "PostgreSQL Primary" },
    },
  ];

  it("evaluates confidence for exact and fuzzy matching", () => {
    const discovered: DiscoveredService = {
      connectionId: "conn-1",
      serviceIdentity: {
        serviceName: "node-api",
      },
      displayName: "Node API",
      firstSeenAt: new Date().toISOString(),
      lastSeenAt: new Date().toISOString(),
      detectedProtocols: ["http"],
      metricsCount: 5,
    };

    const match = ServiceIdentityMapper.evaluateConfidence(discovered, nodes[0]);
    expect(match.confidence).toBe("suggested");
    expect(match.score).toBeGreaterThanOrEqual(0.9);
  });

  it("generates automated mapping suggestions for discovered services", () => {
    const discoveredList: DiscoveredService[] = [
      {
        connectionId: "conn-1",
        serviceIdentity: { serviceName: "node-api" },
        displayName: "Node API",
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        detectedProtocols: ["http"],
        metricsCount: 5,
      },
      {
        connectionId: "conn-1",
        serviceIdentity: { serviceName: "auth-service" },
        displayName: "Auth Service",
        firstSeenAt: new Date().toISOString(),
        lastSeenAt: new Date().toISOString(),
        detectedProtocols: ["grpc"],
        metricsCount: 5,
      },
    ];

    const suggestions = ServiceIdentityMapper.generateSuggestions(
      discoveredList,
      nodes,
      "conn-1",
      "arch-1",
      "proj-1"
    );
    expect(suggestions.length).toBeGreaterThan(0);
    const apiMatch = suggestions.find((s) => s.serviceIdentity.serviceName === "node-api");
    expect(apiMatch?.componentId).toBe("node-api");
  });

  it("detects stale mappings when components are removed from topology", () => {
    const mappings: TelemetryServiceMapping[] = [
      {
        id: "map-1",
        projectId: "proj-1",
        architectureId: "arch-1",
        componentId: "node-deleted",
        connectionId: "conn-1",
        serviceIdentity: { serviceName: "old-service" },
        confidence: "confirmed",
        evidenceScore: 1.0,
        evidenceReasons: ["Manual confirmed mapping"],
        lastVerifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const validated = ServiceIdentityMapper.validateMappings(mappings, nodes);
    expect(validated[0].confidence).toBe("stale");
    expect(validated[0].evidenceReasons.some((r) => r.includes("removed or modified"))).toBe(true);
  });
});

describe("Architecture Observability - Service Health Evaluation", () => {
  it("strictly marks component as unknown when telemetry is missing or stale > 15m", () => {
    const healthMissing = ServiceHealthEvaluator.evaluateHealth({
      componentId: "comp-empty",
      serviceName: "empty-service",
      seriesList: [],
    });
    expect(healthMissing.state).toBe("unknown");
    expect(healthMissing.freshnessStatus).toBe("missing");

    const staleTimestamp = Date.now() - 20 * 60 * 1000; // 20m ago
    const staleSeries: MetricSeries = {
      metricName: "http_requests_total",
      metricType: "counter",
      labels: {},
      unit: "rps",
      datapoints: [{ timestampMs: staleTimestamp, value: 50 }],
    };
    const healthStale = ServiceHealthEvaluator.evaluateHealth({
      componentId: "comp-stale",
      serviceName: "stale-service",
      seriesList: [staleSeries],
      freshnessWindowMs: 15 * 60 * 1000,
    });
    expect(healthStale.state).toBe("unknown");
    expect(healthStale.freshnessStatus).toBe("stale");
  });

  it("marks component as critical if error rate exceeds 5%", () => {
    const errorSeries: MetricSeries = {
      metricName: "error_rate_pct",
      metricType: "gauge",
      labels: {},
      unit: "%",
      datapoints: [{ timestampMs: Date.now(), value: 8.5 }],
    };
    const health = ServiceHealthEvaluator.evaluateHealth({
      componentId: "comp-err",
      serviceName: "error-service",
      seriesList: [errorSeries],
    });
    expect(health.state).toBe("critical");
    expect(health.reasons.some((r) => r.includes("High error rate"))).toBe(true);
  });

  it("marks component as degraded if latency P95 is elevated", () => {
    const latencySeries: MetricSeries = {
      metricName: "p95_latency_ms",
      metricType: "gauge",
      labels: {},
      unit: "ms",
      datapoints: [{ timestampMs: Date.now(), value: 650 }],
    };
    const health = ServiceHealthEvaluator.evaluateHealth({
      componentId: "comp-deg",
      serviceName: "degraded-service",
      seriesList: [latencySeries],
    });
    expect(health.state).toBe("degraded");
  });

  it("marks component as healthy when all indicators are within bounds", () => {
    const seriesList: MetricSeries[] = [
      {
        metricName: "requests_per_second",
        metricType: "gauge",
        labels: {},
        unit: "rps",
        datapoints: [{ timestampMs: Date.now(), value: 120 }],
      },
      {
        metricName: "error_rate_pct",
        metricType: "gauge",
        labels: {},
        unit: "%",
        datapoints: [{ timestampMs: Date.now(), value: 0.1 }],
      },
      {
        metricName: "p95_latency_ms",
        metricType: "gauge",
        labels: {},
        unit: "ms",
        datapoints: [{ timestampMs: Date.now(), value: 35 }],
      },
    ];
    const health = ServiceHealthEvaluator.evaluateHealth({
      componentId: "comp-ok",
      serviceName: "healthy-service",
      seriesList,
    });
    expect(health.state).toBe("healthy");
    expect(health.freshnessStatus).toBe("fresh");
  });
});

describe("Architecture Observability - Topology Drift Detection", () => {
  const nodes: BaseNode[] = [
    { id: "node-a", type: "service", position: { x: 0, y: 0 }, data: { label: "Service A" } },
    { id: "node-b", type: "service", position: { x: 100, y: 0 }, data: { label: "Service B" } },
    { id: "node-c", type: "service", position: { x: 200, y: 0 }, data: { label: "Service C" } },
  ];

  const edges: BaseEdge[] = [
    { id: "edge-a-b", source: "node-a", target: "node-b", data: {} },
  ];

  const mappings: TelemetryServiceMapping[] = [
    {
      id: "m-1",
      projectId: "p1",
      architectureId: "a1",
      componentId: "node-a",
      connectionId: "c1",
      serviceIdentity: { serviceName: "service-a" },
      confidence: "confirmed",
      evidenceScore: 1,
      evidenceReasons: [],
      lastVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "m-2",
      projectId: "p1",
      architectureId: "a1",
      componentId: "node-b",
      connectionId: "c1",
      serviceIdentity: { serviceName: "service-b" },
      confidence: "confirmed",
      evidenceScore: 1,
      evidenceReasons: [],
      lastVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: "m-3",
      projectId: "p1",
      architectureId: "a1",
      componentId: "node-c",
      connectionId: "c1",
      serviceIdentity: { serviceName: "service-c" },
      confidence: "confirmed",
      evidenceScore: 1,
      evidenceReasons: [],
      lastVerifiedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it("detects unmodeled runtime dependencies discovered via traces", () => {
    const observedSpans: TraceSpan[] = [
      {
        traceId: "t-1",
        spanId: "s-1",
        serviceName: "service-b",
        operationName: "CallC",
        startTimeMs: 1000,
        durationMs: 50,
        statusCode: "ok",
        attributes: {},
        isCriticalPath: true,
      },
      {
        traceId: "t-1",
        spanId: "s-2",
        parentSpanId: "s-1",
        serviceName: "service-c",
        operationName: "ReceiveC",
        startTimeMs: 1010,
        durationMs: 40,
        statusCode: "ok",
        attributes: {},
        isCriticalPath: true,
      },
    ];

    const findings = TopologyDriftDetector.detectDrift({
      nodes,
      edges,
      mappings,
      observedSpans,
    });

    const unmodeled = findings.find((f) => f.type === "unmapped_dependency");
    expect(unmodeled).toBeDefined();
    expect(unmodeled?.evidence).toContain("service-b -> service-c");
  });

  it("detects missing telemetry coverage on unmonitored components", () => {
    const findings = TopologyDriftDetector.detectDrift({
      nodes,
      edges,
      mappings: [mappings[0]], // only node-a mapped
      observedSpans: [],
    });

    const missing = findings.filter((f) => f.type === "missing_telemetry");
    expect(missing.length).toBe(2); // node-b and node-c
  });
});

describe("Architecture Observability - SLO Evaluation & Error Budget", () => {
  it("evaluates availability SLO and calculates remaining error budget accurately", () => {
    const slo: SloDefinition = {
      id: "slo-avail",
      projectId: "proj-1",
      architectureId: "arch-1",
      componentId: "node-api",
      name: "API Gateway Availability",
      indicator: "availability",
      targetThreshold: 99.9,
      targetPercentage: 99.9,
      windowDays: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Series with 0.25% error rate (availability 99.75%, below 99.9% target!)
    const seriesList: MetricSeries[] = [
      {
        metricName: "http_errors_rate",
        metricType: "gauge",
        labels: {},
        unit: "%",
        datapoints: [{ timestampMs: Date.now(), value: 0.25 }],
      },
    ];

    const evalResult = SloEvaluator.evaluateSlo(slo, seriesList);
    expect(evalResult.currentObservedValue).toBe(99.75);
    expect(evalResult.isCompliant).toBe(false);
    expect(evalResult.consumedErrorBudgetPct).toBe(100);
    expect(evalResult.status).toBe("breached");
  });

  it("calculates positive remaining error budget when compliant", () => {
    const slo: SloDefinition = {
      id: "slo-lat",
      projectId: "proj-1",
      architectureId: "arch-1",
      componentId: "node-api",
      name: "API Latency P95",
      indicator: "latency",
      targetThreshold: 200,
      targetPercentage: 95.0,
      windowDays: 30,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const seriesList: MetricSeries[] = [
      {
        metricName: "p95_latency_ms",
        metricType: "gauge",
        labels: {},
        unit: "ms",
        datapoints: [{ timestampMs: Date.now(), value: 120 }], // 120ms < 200ms
      },
    ];

    const evalResult = SloEvaluator.evaluateSlo(slo, seriesList);
    expect(evalResult.isCompliant).toBe(true);
    expect(evalResult.remainingErrorBudgetPct).toBeGreaterThan(0);
    expect(evalResult.status).toBe("healthy");
  });
});

describe("Architecture Observability - Observed vs Modeled Comparator", () => {
  it("computes discrepancies between observed telemetry and modeled assumptions", () => {
    const nodes: BaseNode[] = [
      { id: "node-checkout", type: "service", position: { x: 0, y: 0 }, data: { label: "Checkout Service" } },
    ];

    const healthIndicators = {
      "node-checkout": {
        componentId: "node-checkout",
        serviceName: "Checkout Service",
        componentLabel: "Checkout Service",
        state: "degraded" as const,
        freshnessStatus: "fresh" as const,
        metrics: {
          rps: 450,
          p95LatencyMs: 180,
          cpuSaturationPct: 88,
        },
        reasons: ["High CPU saturation"],
      },
    };

    const modeledExpectations = {
      "node-checkout": {
        expectedRps: 200, // Discrepancy > 100%
        expectedLatencyP95Ms: 50, // Discrepancy > 250%
        isModeledBottleneck: false,
      },
    };

    const comparisons = ObservedModeledComparator.compare({
      nodes,
      healthIndicators,
      modeledExpectations,
    });

    expect(comparisons).toHaveLength(1);
    const comp = comparisons[0];
    expect(comp.rpsDeltaPct).toBeGreaterThan(100);
    expect(comp.observedSaturation).toBe(true);
    expect(comp.calibrationSuggestions.length).toBeGreaterThan(0);
  });
});

describe("Architecture Observability - Connector Registry & Adapters", () => {
  it("registers and provides built-in Prometheus, OpenTelemetry, and Mock connectors", () => {
    const registry = new TelemetryConnectorRegistry();
    registry.register(new PrometheusAdapter());
    registry.register(new OpenTelemetryAdapter());
    registry.register(new MockTelemetryAdapter());

    expect(registry.has("prometheus")).toBe(true);
    expect(registry.has("opentelemetry")).toBe(true);
    expect(registry.has("mock")).toBe(true);

    const mockConn = registry.get("mock");
    expect(mockConn).toBeDefined();
    expect(mockConn?.capabilities).toContain("metrics");
    expect(mockConn?.capabilities).toContain("traces");
    expect(mockConn?.capabilities).toContain("logs");
  });
});
