export * from "./monitoring-service-icon";
export * from "./metrics-collector-icon";
export * from "./log-collector-icon";
export * from "./log-aggregator-icon";
export * from "./distributed-tracing-icon";
export * from "./alert-manager-icon";
export * from "./health-check-service-icon";
export * from "./error-tracker-icon";
export * from "./apm-service-icon";
export * from "./status-page-icon";

import type { InfrastructureIconComponent } from "../types";
import { MonitoringServiceIcon } from "./monitoring-service-icon";
import { MetricsCollectorIcon } from "./metrics-collector-icon";
import { LogCollectorIcon } from "./log-collector-icon";
import { LogAggregatorIcon } from "./log-aggregator-icon";
import { DistributedTracingIcon } from "./distributed-tracing-icon";
import { AlertManagerIcon } from "./alert-manager-icon";
import { HealthCheckServiceIcon } from "./health-check-service-icon";
import { ErrorTrackerIcon } from "./error-tracker-icon";
import { ApmServiceIcon } from "./apm-service-icon";
import { StatusPageIcon } from "./status-page-icon";

export {
  MonitoringServiceIcon,
  MetricsCollectorIcon,
  LogCollectorIcon,
  LogAggregatorIcon,
  DistributedTracingIcon,
  AlertManagerIcon,
  HealthCheckServiceIcon,
  ErrorTrackerIcon,
  ApmServiceIcon,
  StatusPageIcon,
};

export const observabilityAndReliabilityIconRegistry: Record<string, InfrastructureIconComponent> = {
  "monitoring-service": MonitoringServiceIcon,
  "metrics-collector": MetricsCollectorIcon,
  "log-collector": LogCollectorIcon,
  "log-aggregator": LogAggregatorIcon,
  "distributed-tracing": DistributedTracingIcon,
  "alert-manager": AlertManagerIcon,
  "health-check-service": HealthCheckServiceIcon,
  "error-tracker": ErrorTrackerIcon,
  "apm-service": ApmServiceIcon,
  "status-page": StatusPageIcon,
};

export function getObservabilityAndReliabilityInfrastructureIcon(slug: string): InfrastructureIconComponent | undefined {
  return observabilityAndReliabilityIconRegistry[slug];
}

