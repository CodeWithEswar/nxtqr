import type { TelemetrySourceType } from "../contracts/observability.types";
import type { TelemetryConnector } from "./connector-contract";
import { PrometheusAdapter } from "./prometheus-adapter";
import { OpenTelemetryAdapter } from "./opentelemetry-adapter";
import { MockTelemetryAdapter } from "./mock-telemetry-adapter";

export class ConnectorRegistry {
  private readonly connectors = new Map<string, TelemetryConnector>();

  constructor() {
    this.register(new PrometheusAdapter());
    this.register(new OpenTelemetryAdapter());
    this.register(new MockTelemetryAdapter());
  }

  public register(connector: TelemetryConnector): void {
    this.connectors.set(connector.id, connector);
  }

  public getConnector(sourceType: TelemetrySourceType | string): TelemetryConnector | undefined {
    return this.connectors.get(sourceType);
  }

  public get(sourceType: TelemetrySourceType | string): TelemetryConnector | undefined {
    return this.connectors.get(sourceType);
  }

  public has(sourceType: string): boolean {
    return this.connectors.has(sourceType);
  }

  public getAllConnectors(): TelemetryConnector[] {
    return Array.from(this.connectors.values());
  }
}

export const TelemetryConnectorRegistry = ConnectorRegistry;
export const connectorRegistry = new ConnectorRegistry();
