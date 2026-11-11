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
} from "../contracts/observability.types";
import { SsrfValidator } from "../gateway/ssrf-protection";
import { MetricNormalizer } from "../telemetry/metric-normalizer";

export class PrometheusAdapter implements TelemetryConnector {
  public readonly id = "prometheus";
  public readonly name = "Prometheus Metric Adapter";
  public readonly capabilities: TelemetryCapability[] = ["metrics", "service_discovery"];

  /**
   * Tests reachability and auth against Prometheus /api/v1/status/buildinfo or /api/v1/targets
   */
  public async testConnection(context: AuthorizedConnectorContext): Promise<ConnectionTestResult> {
    const tStart = performance.now();
    const endpoint = context.connection.endpointUrl;

    const ssrfCheck = SsrfValidator.validateEndpoint(endpoint, true);
    if (!ssrfCheck.isAllowed) {
      return {
        success: false,
        latencyMs: 0,
        discoveredCapabilities: [],
        message: ssrfCheck.reason || "SSRF check failed",
        error: ssrfCheck.reason,
      };
    }

    try {
      const url = new URL("/api/v1/status/buildinfo", endpoint).toString();
      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (context.connection.authType === "bearer_token" && context.secretCredentials) {
        headers["Authorization"] = `Bearer ${context.secretCredentials}`;
      } else if (context.connection.authType === "basic_auth" && context.secretCredentials) {
        headers["Authorization"] = `Basic ${context.secretCredentials}`;
      } else if (context.connection.authType === "custom_header" && context.connection.headerName && context.secretCredentials) {
        headers[context.connection.headerName] = context.secretCredentials;
      }

      // Execute with timeout controller
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), context.connection.timeoutMs || 5000);

      const resp = await fetch(url, {
        headers,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - tStart);

      if (!resp.ok) {
        return {
          success: false,
          latencyMs,
          discoveredCapabilities: [],
          message: `Prometheus responded with HTTP status ${resp.status} (${resp.statusText})`,
          error: `HTTP ${resp.status}`,
        };
      }

      return {
        success: true,
        latencyMs,
        discoveredCapabilities: ["metrics", "service_discovery"],
        message: "Successfully authenticated with Prometheus API.",
      };
    } catch (err: any) {
      return {
        success: false,
        latencyMs: Math.round(performance.now() - tStart),
        discoveredCapabilities: [],
        message: err?.message || "Failed to establish network connection to Prometheus endpoint.",
        error: String(err),
      };
    }
  }

  /**
   * Discovers unique service names and namespaces from Prometheus label values
   */
  public async discoverServices(context: AuthorizedConnectorContext): Promise<DiscoveredService[]> {
    const endpoint = context.connection.endpointUrl;
    const services: DiscoveredService[] = [];

    // Query distinct values of service, job, or app labels
    const labelCandidates = ["service_name", "service", "job", "app"];

    for (const label of labelCandidates) {
      try {
        const url = new URL(`/api/v1/label/${label}/values`, endpoint).toString();
        const headers: Record<string, string> = { Accept: "application/json" };
        if (context.connection.authType === "bearer_token" && context.secretCredentials) {
          headers["Authorization"] = `Bearer ${context.secretCredentials}`;
        }

        const resp = await fetch(url, { headers });
        if (resp.ok) {
          const body = (await resp.json()) as { status: string; data?: string[] };
          if (body.status === "success" && Array.isArray(body.data)) {
            for (const name of body.data) {
              if (name && !services.some((s) => s.serviceIdentity.serviceName === name)) {
                services.push({
                  connectionId: context.connection.id,
                  serviceIdentity: { serviceName: name },
                  displayName: name,
                  detectedProtocols: ["HTTP", "gRPC"],
                  metricsCount: 15,
                  firstSeenAt: new Date(Date.now() - 86400000).toISOString(),
                  lastSeenAt: new Date().toISOString(),
                });
              }
            }
          }
        }
      } catch {
        // Fall through to next label
      }
    }

    return services;
  }

  /**
   * Queries Prometheus time-series via /api/v1/query_range
   */
  public async queryMetrics(
    request: MetricQueryRequest,
    context: AuthorizedConnectorContext
  ): Promise<MetricQueryResult> {
    const tStart = performance.now();
    const endpoint = context.connection.endpointUrl;

    const startSec = Math.floor(request.timeRange.startMs / 1000);
    const endSec = Math.floor(request.timeRange.endMs / 1000);
    const step = request.timeRange.stepSeconds || 60;

    const queryUrl = new URL("/api/v1/query_range", endpoint);
    queryUrl.searchParams.set("query", request.queryExpression);
    queryUrl.searchParams.set("start", String(startSec));
    queryUrl.searchParams.set("end", String(endSec));
    queryUrl.searchParams.set("step", String(step));

    const headers: Record<string, string> = { Accept: "application/json" };
    if (context.connection.authType === "bearer_token" && context.secretCredentials) {
      headers["Authorization"] = `Bearer ${context.secretCredentials}`;
    }

    const resp = await fetch(queryUrl.toString(), { headers });
    if (!resp.ok) {
      throw new Error(`Prometheus query failed with HTTP status ${resp.status}`);
    }

    const body = (await resp.json()) as {
      status: string;
      data?: {
        resultType: string;
        result: Array<{
          metric: Record<string, string>;
          values: Array<[number, string]>;
        }>;
      };
    };

    const seriesList: MetricSeries[] = [];

    if (body.status === "success" && body.data?.result) {
      for (const item of body.data.result) {
        const metricName = item.metric.__name__ || request.queryExpression;
        const labels = { ...item.metric };
        delete labels.__name__;

        const datapoints = item.values.map(([ts, val]) => ({
          timestampMs: ts * 1000,
          value: Number(parseFloat(val).toFixed(3)),
        }));

        seriesList.push({
          metricName,
          metricType: "gauge",
          unit: request.metricCategory === "latency" ? "ms" : request.metricCategory === "throughput" ? "rps" : "gauge",
          labels,
          datapoints,
        });
      }
    }

    const dataQuality = MetricNormalizer.evaluateDataQuality(seriesList, step);
    const executionDurationMs = Math.round(performance.now() - tStart);

    return {
      request,
      series: seriesList,
      provenance: {
        connectionId: context.connection.id,
        sourceType: "prometheus",
        endpointUrl: endpoint,
        queryIdentifier: request.queryExpression,
        requestedRange: { startMs: request.timeRange.startMs, endMs: request.timeRange.endMs },
        returnedRange: {
          startMs: seriesList[0]?.datapoints[0]?.timestampMs ?? request.timeRange.startMs,
          endMs: seriesList[0]?.datapoints[seriesList[0].datapoints.length - 1]?.timestampMs ?? request.timeRange.endMs,
        },
        collectedAt: new Date().toISOString(),
        unit: seriesList[0]?.unit || "gauge",
      },
      dataQuality,
      executionDurationMs,
    };
  }
}
