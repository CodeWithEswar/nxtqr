export * from "./etl-pipeline-icon";
export * from "./elt-pipeline-icon";
export * from "./data-lake-icon";
export * from "./data-lakehouse-icon";
export * from "./data-pipeline-icon";
export * from "./data-ingestion-service-icon";
export * from "./analytics-engine-icon";
export * from "./olap-engine-icon";
export * from "./cdc-connector-icon";
export * from "./workflow-orchestrator-icon";

import type { InfrastructureIconComponent } from "../types";
import { EtlPipelineIcon } from "./etl-pipeline-icon";
import { EltPipelineIcon } from "./elt-pipeline-icon";
import { DataLakeIcon } from "./data-lake-icon";
import { DataLakehouseIcon } from "./data-lakehouse-icon";
import { DataPipelineIcon } from "./data-pipeline-icon";
import { DataIngestionServiceIcon } from "./data-ingestion-service-icon";
import { AnalyticsEngineIcon } from "./analytics-engine-icon";
import { OlapEngineIcon } from "./olap-engine-icon";
import { CdcConnectorIcon } from "./cdc-connector-icon";
import { WorkflowOrchestratorIcon } from "./workflow-orchestrator-icon";

export const dataEngineeringAndAnalyticsIconRegistry: Record<string, InfrastructureIconComponent> = {
  "etl-pipeline": EtlPipelineIcon,
  "elt-pipeline": EltPipelineIcon,
  "data-lake": DataLakeIcon,
  "data-lakehouse": DataLakehouseIcon,
  "data-pipeline": DataPipelineIcon,
  "data-ingestion-service": DataIngestionServiceIcon,
  "analytics-engine": AnalyticsEngineIcon,
  "olap-engine": OlapEngineIcon,
  "cdc-connector": CdcConnectorIcon,
  "workflow-orchestrator": WorkflowOrchestratorIcon,
};

export function getDataEngineeringAndAnalyticsInfrastructureIcon(
  slug: string
): InfrastructureIconComponent | undefined {
  return dataEngineeringAndAnalyticsIconRegistry[slug];
}

