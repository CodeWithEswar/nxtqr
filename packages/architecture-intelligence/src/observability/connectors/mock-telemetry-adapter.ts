import type {
  AuthorizedConnectorContext,
  ConnectionTestResult,
  TelemetryConnector,
} from "./connector-contract";
import type {
  DiscoveredService,
  MetricQueryRequest,
  MetricQueryResult,
  MetricSeries,
  TelemetryCapability,
  TraceQueryRequest,
  TraceQueryResult,
  TraceSpan,
  LogQueryRequest,
  LogQueryResult,
  StructuredLogEntry,
} from "../contracts/observability.types";
import { MetricNormalizer } from "../telemetry/metric-normalizer";

export class MockTelemetryAdapter implements TelemetryConnector {
  public readonly id = "mock";
  public readonly name = "Synthetic Telemetry Simulator";
  public readonly capabilities: TelemetryCapability[] = [
    "metrics",
    "traces",
    "logs",
    "service_discovery",
  ];

  public async testConnection(_context: AuthorizedConnectorContext): Promise<ConnectionTestResult> {
    return {
      success: true,
      latencyMs: 12,
      discoveredCapabilities: ["metrics", "traces", "logs", "service_discovery"],
      message: "Connected to synthetic observability harness.",
    };
  }

  public async discoverServices(context: AuthorizedConnectorContext): Promise<DiscoveredService[]> {
    return [
      {
        connectionId: context.connection.id,
        serviceIdentity: { serviceName: "api-gateway", namespace: "default", environment: "production" },
        displayName: "API Ingress Gateway",
        detectedProtocols: ["HTTP/1.1", "HTTP/2"],
        metricsCount: 28,
        firstSeenAt: new Date(Date.now() - 604800000).toISOString(),
        lastSeenAt: new Date().toISOString(),
      },
      {
        connectionId: context.connection.id,
        serviceIdentity: { serviceName: "order-service", namespace: "default", environment: "production" },
        displayName: "Order & Checkout Service",
        detectedProtocols: ["gRPC", "HTTP"],
        metricsCount: 42,
        firstSeenAt: new Date(Date.now() - 604800000).toISOString(),
        lastSeenAt: new Date().toISOString(),
      },
      {
        connectionId: context.connection.id,
        serviceIdentity: { serviceName: "postgres-primary", namespace: "database", environment: "production" },
        displayName: "PostgreSQL Primary",
        detectedProtocols: ["Postgres Wire"],
        metricsCount: 35,
        firstSeenAt: new Date(Date.now() - 604800000).toISOString(),
        lastSeenAt: new Date().toISOString(),
      },
      {
        connectionId: context.connection.id,
        serviceIdentity: { serviceName: "redis-cluster", namespace: "cache", environment: "production" },
        displayName: "Redis L2 Cache",
        detectedProtocols: ["RESP"],
        metricsCount: 19,
        firstSeenAt: new Date(Date.now() - 604800000).toISOString(),
        lastSeenAt: new Date().toISOString(),
      },
    ];
  }

  public async queryMetrics(
    request: MetricQueryRequest,
    context: AuthorizedConnectorContext
  ): Promise<MetricQueryResult> {
    const tStart = performance.now();
    const { startMs, endMs, stepSeconds } = request.timeRange;
    const stepMs = (stepSeconds || 60) * 1000;

    const category = request.metricCategory || "throughput";
    const seriesList: MetricSeries[] = [];

    const timestamps: number[] = [];
    for (let t = startMs; t <= endMs; t += stepMs) {
      timestamps.push(t);
    }

    if (category === "throughput") {
      seriesList.push({
        metricName: "http_requests_per_second",
        metricType: "gauge",
        unit: "rps",
        labels: { service: "order-service" },
        datapoints: timestamps.map((ts, i) => {
          const base = 850;
          const wave = Math.sin(i / 4) * 120;
          const noise = ((i * 37) % 30) - 15;
          return { timestampMs: ts, value: Math.max(10, Math.round(base + wave + noise)) };
        }),
      });
    } else if (category === "latency") {
      seriesList.push(
        {
          metricName: "http_request_duration_p50",
          metricType: "gauge",
          unit: "ms",
          labels: { quantile: "0.50" },
          datapoints: timestamps.map((ts) => ({ timestampMs: ts, value: 18.5 })),
        },
        {
          metricName: "http_request_duration_p95",
          metricType: "gauge",
          unit: "ms",
          labels: { quantile: "0.95" },
          datapoints: timestamps.map((ts, i) => {
            const spike = i > timestamps.length - 5 ? 180 : 45;
            return { timestampMs: ts, value: spike + ((i * 17) % 8) };
          }),
        },
        {
          metricName: "http_request_duration_p99",
          metricType: "gauge",
          unit: "ms",
          labels: { quantile: "0.99" },
          datapoints: timestamps.map((ts, i) => {
            const spike = i > timestamps.length - 5 ? 320 : 85;
            return { timestampMs: ts, value: spike + ((i * 19) % 12) };
          }),
        }
      );
    } else if (category === "error_rate") {
      seriesList.push({
        metricName: "http_error_rate_percentage",
        metricType: "gauge",
        unit: "percent",
        labels: { code: "5xx" },
        datapoints: timestamps.map((ts, i) => {
          // Elevated error rate at end of window
          const val = i > timestamps.length - 6 ? 2.8 : 0.04;
          return { timestampMs: ts, value: Number(val.toFixed(2)) };
        }),
      });
    } else if (category === "saturation") {
      seriesList.push(
        {
          metricName: "container_cpu_usage_percent",
          metricType: "gauge",
          unit: "percent",
          labels: { resource: "cpu" },
          datapoints: timestamps.map((ts, i) => ({
            timestampMs: ts,
            value: Math.min(100, Math.round(65 + Math.sin(i / 3) * 20)),
          })),
        },
        {
          metricName: "container_memory_usage_percent",
          metricType: "gauge",
          unit: "percent",
          labels: { resource: "memory" },
          datapoints: timestamps.map((ts) => ({
            timestampMs: ts,
            value: 72,
          })),
        }
      );
    }

    const dataQuality = MetricNormalizer.evaluateDataQuality(seriesList, stepSeconds);
    const duration = Math.round(performance.now() - tStart);

    return {
      request,
      series: seriesList,
      provenance: {
        connectionId: context.connection.id,
        sourceType: "mock",
        endpointUrl: context.connection.endpointUrl,
        queryIdentifier: request.queryExpression,
        requestedRange: { startMs, endMs },
        returnedRange: {
          startMs: timestamps[0] || startMs,
          endMs: timestamps[timestamps.length - 1] || endMs,
        },
        collectedAt: new Date().toISOString(),
        unit: seriesList[0]?.unit || "gauge",
      },
      dataQuality,
      executionDurationMs: duration,
    };
  }

  public async queryTraces(
    request: TraceQueryRequest,
    _context: AuthorizedConnectorContext
  ): Promise<TraceQueryResult> {
    const traceId = `trace-mock-${Date.now().toString(16)}`;
    const baseTime = request.timeRange.endMs - 30000;

    const spans: TraceSpan[] = [
      {
        traceId,
        spanId: "sp-1",
        serviceName: "api-gateway",
        operationName: "POST /v1/checkout/submit",
        startTimeMs: baseTime,
        durationMs: 180,
        statusCode: "ok" as const,
        attributes: { "http.method": "POST", "http.status_code": 200 },
        isCriticalPath: true,
      },
      {
        traceId,
        spanId: "sp-2",
        parentSpanId: "sp-1",
        serviceName: "order-service",
        operationName: "SubmitOrder",
        startTimeMs: baseTime + 15,
        durationMs: 140,
        statusCode: "ok" as const,
        attributes: { "rpc.method": "SubmitOrder" },
        isCriticalPath: true,
      },
      {
        traceId,
        spanId: "sp-3",
        parentSpanId: "sp-2",
        serviceName: "postgres-primary",
        operationName: "INSERT INTO orders",
        startTimeMs: baseTime + 40,
        durationMs: 45,
        statusCode: "ok" as const,
        attributes: { "db.operation": "INSERT" },
        isCriticalPath: false,
      },
    ];

    return {
      traceId,
      rootSpan: spans[0],
      spans,
      totalDurationMs: 180,
      servicesInvolved: ["api-gateway", "order-service", "postgres-primary"],
      componentsInvolved: [],
      hasErrors: false,
      criticalPathDurationMs: 180,
    };
  }

  public async queryLogs(
    request: LogQueryRequest,
    _context: AuthorizedConnectorContext
  ): Promise<LogQueryResult> {
    const baseTime = request.timeRange.endMs - 20000;
    const entries: StructuredLogEntry[] = [
      {
        id: "log-mock-1",
        timestampMs: baseTime,
        serviceName: "api-gateway",
        severity: "info" as const,
        message: "Accepted HTTP checkout request from mobile client.",
        attributes: { route: "/v1/checkout/submit" },
      },
      {
        id: "log-mock-2",
        timestampMs: baseTime + 35,
        serviceName: "order-service",
        severity: "info" as const,
        message: "Order #91823 persistence initiated in PostgreSQL.",
        attributes: { orderId: "91823" },
      },
      {
        id: "log-mock-3",
        timestampMs: baseTime + 120,
        serviceName: "postgres-primary",
        severity: "warn" as const,
        message: "Connection pool utilization reached 82% (threshold: 80%).",
        attributes: { activePoolSize: 82, maxPoolSize: 100 },
      },
    ];

    return {
      entries,
      totalMatched: entries.length,
      severityCounts: { info: 2, warn: 1 },
    };
  }
}
