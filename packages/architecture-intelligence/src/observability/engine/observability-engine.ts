import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  TelemetryConnection,
  ConnectionStatus,
  TimeRange,
  DiscoveredService,
  TelemetryServiceMapping,
  MetricQueryRequest,
  MetricQueryResult,
  TraceQueryRequest,
  TraceQueryResult,
  LogQueryRequest,
  LogQueryResult,
  ServiceHealthIndicator,
  TopologyDriftFinding,
  ObservedVsModeledComparison,
  ObservabilityFinding,
  TraceSpan,
  MetricSeries,
} from "../contracts/observability.types";
import type { AuthorizedConnectorContext, ConnectionTestResult } from "../connectors/connector-contract";
import { connectorRegistry } from "../connectors/connector-registry";
import { ServiceIdentityMapper } from "../mapping/service-identity-mapper";
import { ServiceHealthEvaluator } from "../analysis/service-health-evaluator";
import { TopologyDriftDetector } from "../analysis/topology-drift-detector";
import { ObservedModeledComparator } from "../analysis/observed-modeled-comparator";

export class ArchitectureObservabilityEngine {
  public static readonly ENGINE_VERSION = "1.0.0";

  public async testConnection(context: AuthorizedConnectorContext): Promise<ConnectionTestResult> {
    const connector = connectorRegistry.getConnector(context.connection.sourceType);
    if (!connector) {
      return {
        success: false,
        latencyMs: 0,
        discoveredCapabilities: [],
        message: `Unsupported telemetry source type: ${context.connection.sourceType}`,
        error: "UNSUPPORTED_CONNECTOR",
      };
    }
    return connector.testConnection(context);
  }

  public async discoverServices(context: AuthorizedConnectorContext): Promise<DiscoveredService[]> {
    const connector = connectorRegistry.getConnector(context.connection.sourceType);
    if (!connector) {
      throw new Error(`Unsupported connector type: ${context.connection.sourceType}`);
    }
    return connector.discoverServices(context);
  }

  public async queryMetrics(
    request: MetricQueryRequest,
    context: AuthorizedConnectorContext
  ): Promise<MetricQueryResult> {
    const connector = connectorRegistry.getConnector(context.connection.sourceType);
    if (!connector || !connector.queryMetrics) {
      throw new Error(`Connector '${context.connection.sourceType}' does not support metric queries.`);
    }
    return connector.queryMetrics(request, context);
  }

  public async queryTraces(
    request: TraceQueryRequest,
    context: AuthorizedConnectorContext
  ): Promise<TraceQueryResult> {
    const connector = connectorRegistry.getConnector(context.connection.sourceType);
    if (!connector || !connector.queryTraces) {
      throw new Error(`Connector '${context.connection.sourceType}' does not support trace queries.`);
    }
    return connector.queryTraces(request, context);
  }

  public async queryLogs(
    request: LogQueryRequest,
    context: AuthorizedConnectorContext
  ): Promise<LogQueryResult> {
    const connector = connectorRegistry.getConnector(context.connection.sourceType);
    if (!connector || !connector.queryLogs) {
      throw new Error(`Connector '${context.connection.sourceType}' does not support log queries.`);
    }
    return connector.queryLogs(request, context);
  }

  public generateMappingSuggestions(
    services: DiscoveredService[],
    nodes: BaseNode[],
    connectionId: string,
    architectureId: string,
    projectId: string
  ): TelemetryServiceMapping[] {
    return ServiceIdentityMapper.generateSuggestions(
      services,
      nodes,
      connectionId,
      architectureId,
      projectId
    );
  }

  public evaluateServiceHealth(params: {
    componentId: string;
    serviceName: string;
    seriesList: MetricSeries[];
    freshnessWindowMs?: number;
  }): ServiceHealthIndicator {
    return ServiceHealthEvaluator.evaluateHealth(params);
  }

  public detectTopologyDrift(params: {
    nodes: BaseNode[];
    edges: BaseEdge[];
    mappings: TelemetryServiceMapping[];
    observedSpans: TraceSpan[];
  }): TopologyDriftFinding[] {
    return TopologyDriftDetector.detectDrift(params);
  }

  public compareObservedWithModel(params: {
    nodes: BaseNode[];
    healthIndicators: Record<string, ServiceHealthIndicator>;
    modeledExpectations?: Record<
      string,
      {
        expectedRps?: number;
        expectedLatencyP95Ms?: number;
        isModeledBottleneck?: boolean;
      }
    >;
  }): ObservedVsModeledComparison[] {
    return ObservedModeledComparator.compare(params);
  }

  public async evaluateArchitectureObservability(params: {
    nodes: BaseNode[];
    edges: BaseEdge[];
    connection: TelemetryConnection;
    mappings: TelemetryServiceMapping[];
    timeRange: TimeRange;
    modeledExpectations?: Record<
      string,
      {
        expectedRps?: number;
        expectedLatencyP95Ms?: number;
        isModeledBottleneck?: boolean;
      }
    >;
  }): Promise<{
    connectionStatus: ConnectionStatus;
    healthIndicators: Record<string, ServiceHealthIndicator>;
    driftFindings: TopologyDriftFinding[];
    comparisons: ObservedVsModeledComparison[];
    unifiedFindings: ObservabilityFinding[];
  }> {
    const { nodes, edges, connection, mappings, timeRange, modeledExpectations } = params;
    const connector = connectorRegistry.getConnector(connection.sourceType);

    const connectorContext: AuthorizedConnectorContext = {
      connection,
      projectId: connection.projectId,
      userId: "system",
    };

    // 1. Fetch metrics for mapped services
    const mappedServices = mappings.map((m) => m.serviceIdentity);
    const defaultRequest: MetricQueryRequest = {
      connectionId: connection.id,
      queryExpression: "*",
      timeRange,
    };
    let metricsResult: MetricQueryResult = {
      request: defaultRequest,
      series: [],
      provenance: {
        connectionId: connection.id,
        sourceType: connection.sourceType,
        endpointUrl: connection.endpointUrl,
        queryIdentifier: "*",
        requestedRange: { startMs: timeRange.startMs, endMs: timeRange.endMs },
        returnedRange: { startMs: timeRange.startMs, endMs: timeRange.endMs },
        collectedAt: new Date().toISOString(),
        unit: "mixed",
      },
      dataQuality: {
        qualityScore: 100,
        isSparse: false,
        clockSkewMs: 0,
        missingSamplesCount: 0,
        samplingRatio: 1,
        notes: [],
      },
      executionDurationMs: 0,
    };

    if (connector?.queryMetrics && mappedServices.length > 0) {
      metricsResult = await connector.queryMetrics(
        {
          connectionId: connection.id,
          queryExpression: "*",
          timeRange,
        },
        connectorContext
      );
    }

    // 2. Fetch traces to detect inter-service call patterns & drift
    let tracesResult: TraceQueryResult = {
      traceId: "default",
      spans: [],
      totalDurationMs: 0,
      servicesInvolved: [],
      componentsInvolved: [],
      hasErrors: false,
      criticalPathDurationMs: 0,
    };
    if (connector?.queryTraces) {
      tracesResult = await connector.queryTraces(
        { connectionId: connection.id, timeRange, limit: 100 },
        connectorContext
      );
    }

    // 3. Evaluate health per node
    const healthIndicators: Record<string, ServiceHealthIndicator> = {};
    for (const node of nodes) {
      const mapping = mappings.find((m) => m.componentId === node.id);
      if (!mapping) {
        healthIndicators[node.id] = ServiceHealthEvaluator.evaluateHealth({
          componentId: node.id,
          serviceName: (node.data?.label as string) || node.id,
          seriesList: [],
        });
        continue;
      }

      // Filter series matching this service
      const nodeSeries = metricsResult.series.filter(
        (s) =>
          s.labels.service === mapping.serviceIdentity.serviceName ||
          s.labels.job === mapping.serviceIdentity.serviceName ||
          s.labels.app === mapping.serviceIdentity.serviceName
      );

      healthIndicators[node.id] = ServiceHealthEvaluator.evaluateHealth({
        componentId: node.id,
        serviceName: mapping.serviceIdentity.serviceName,
        seriesList: nodeSeries.length > 0 ? nodeSeries : metricsResult.series,
      });
    }

    // 4. Flatten spans from traces
    const allSpans: TraceSpan[] = tracesResult.spans || [];

    // 5. Detect topology drift
    const driftFindings = TopologyDriftDetector.detectDrift({
      nodes,
      edges,
      mappings,
      observedSpans: allSpans,
    });

    // 6. Compare with modeled assumptions
    const comparisons = ObservedModeledComparator.compare({
      nodes,
      healthIndicators,
      modeledExpectations,
    });

    // 7. Unified findings
    const unifiedFindings = this.generateUnifiedFindings({
      healthIndicators,
      driftFindings,
      nodes,
    });

    return {
      connectionStatus: connection.status,
      healthIndicators,
      driftFindings,
      comparisons,
      unifiedFindings,
    };
  }

  public generateUnifiedFindings(params: {
    healthIndicators: Record<string, ServiceHealthIndicator>;
    driftFindings: TopologyDriftFinding[];
    nodes: BaseNode[];
  }): ObservabilityFinding[] {
    const { healthIndicators, driftFindings, nodes } = params;
    const findings: ObservabilityFinding[] = [];

    // 1. Health-based findings (Critical & Degraded components)
    for (const [componentId, health] of Object.entries(healthIndicators)) {
      const node = nodes.find((n) => n.id === componentId);
      const label = (node?.data?.label as string) || componentId;

      if (health.state === "critical") {
        findings.push({
          id: `obs-find-crit-${componentId}`,
          severity: "critical",
          category: health.metrics.errorRatePct && health.metrics.errorRatePct >= 5 ? "error_rate" : "latency",
          componentId,
          componentLabel: label,
          title: `Critical Production Degradation: ${label}`,
          description: health.reasons.join(" "),
          evidence: `Observed P95 Latency: ${health.metrics.p95LatencyMs || 0}ms, Error Rate: ${health.metrics.errorRatePct || 0}%`,
          recommendation: "Scale component replicas or investigate downstream database connection pool exhaustion.",
        });
      } else if (health.state === "degraded") {
        findings.push({
          id: `obs-find-degr-${componentId}`,
          severity: "high",
          category: "saturation",
          componentId,
          componentLabel: label,
          title: `Degraded Production Health: ${label}`,
          description: health.reasons.join(" "),
          evidence: `CPU Saturation: ${health.metrics.cpuSaturationPct || 0}%, P95: ${health.metrics.p95LatencyMs || 0}ms`,
          recommendation: "Review cache hit ratio and increase container CPU allocation.",
        });
      }
    }

    // 2. Drift findings
    for (const drift of driftFindings) {
      if (drift.type === "unmapped_dependency") {
        const node = nodes.find((n) => n.id === drift.sourceComponentId);
        findings.push({
          id: `obs-find-drift-${drift.id}`,
          severity: drift.severity,
          category: "drift",
          componentId: drift.sourceComponentId || "unknown",
          componentLabel: (node?.data?.label as string) || drift.sourceComponentId || "Service",
          title: drift.title,
          description: drift.explanation,
          evidence: drift.evidence,
          recommendation: drift.suggestedAction,
        });
      }
    }

    return findings;
  }
}

export const architectureObservabilityEngine = new ArchitectureObservabilityEngine();
