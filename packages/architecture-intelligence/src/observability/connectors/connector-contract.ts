import type {
  TelemetryConnection,
  DiscoveredService,
  MetricQueryRequest,
  MetricQueryResult,
  TraceQueryRequest,
  TraceQueryResult,
  LogQueryRequest,
  LogQueryResult,
  TelemetryCapability,
} from "../contracts/observability.types";

export interface AuthorizedConnectorContext {
  connection: TelemetryConnection;
  secretCredentials?: string;
  projectId: string;
  userId: string;
}

export interface ConnectionTestResult {
  success: boolean;
  latencyMs: number;
  discoveredCapabilities: TelemetryCapability[];
  message: string;
  error?: string;
}

export interface TelemetryConnector {
  readonly id: string;
  readonly name: string;
  readonly capabilities: TelemetryCapability[];

  testConnection(context: AuthorizedConnectorContext): Promise<ConnectionTestResult>;

  discoverServices(context: AuthorizedConnectorContext): Promise<DiscoveredService[]>;

  queryMetrics?(
    request: MetricQueryRequest,
    context: AuthorizedConnectorContext
  ): Promise<MetricQueryResult>;

  queryTraces?(
    request: TraceQueryRequest,
    context: AuthorizedConnectorContext
  ): Promise<TraceQueryResult>;

  queryLogs?(
    request: LogQueryRequest,
    context: AuthorizedConnectorContext
  ): Promise<LogQueryResult>;
}
