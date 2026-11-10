import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  EtlPipelineIcon,
  EltPipelineIcon,
  DataLakeIcon,
  DataLakehouseIcon,
  DataPipelineIcon,
  DataIngestionServiceIcon,
  AnalyticsEngineIcon,
  OlapEngineIcon,
  CdcConnectorIcon,
  WorkflowOrchestratorIcon,
  dataEngineeringAndAnalyticsIconRegistry,
  getDataEngineeringAndAnalyticsInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_13_ICONS = [
  { slug: "etl-pipeline", name: "EtlPipelineIcon", Component: EtlPipelineIcon },
  { slug: "elt-pipeline", name: "EltPipelineIcon", Component: EltPipelineIcon },
  { slug: "data-lake", name: "DataLakeIcon", Component: DataLakeIcon },
  { slug: "data-lakehouse", name: "DataLakehouseIcon", Component: DataLakehouseIcon },
  { slug: "data-pipeline", name: "DataPipelineIcon", Component: DataPipelineIcon },
  { slug: "data-ingestion-service", name: "DataIngestionServiceIcon", Component: DataIngestionServiceIcon },
  { slug: "analytics-engine", name: "AnalyticsEngineIcon", Component: AnalyticsEngineIcon },
  { slug: "olap-engine", name: "OlapEngineIcon", Component: OlapEngineIcon },
  { slug: "cdc-connector", name: "CdcConnectorIcon", Component: CdcConnectorIcon },
  { slug: "workflow-orchestrator", name: "WorkflowOrchestratorIcon", Component: WorkflowOrchestratorIcon },
] as const;

describe("Category 13 — Data Engineering & Analytics Infrastructure Icons", () => {
  it("renders all 10 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_13_ICONS).toHaveLength(10);

    for (const { slug, name, Component } of ALL_CATEGORY_13_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 10 icons in monochrome mode with accessible titles", () => {
    for (const { name, Component } of ALL_CATEGORY_13_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain("<title>" + name + "</title>");
      expect(html).toContain('width="24"');
      expect(html).toContain('height="24"');
    }
  });

  it("registers all 10 icons correctly in dataEngineeringAndAnalyticsIconRegistry", () => {
    expect(Object.keys(dataEngineeringAndAnalyticsIconRegistry)).toHaveLength(10);

    for (const { slug, Component } of ALL_CATEGORY_13_ICONS) {
      expect(dataEngineeringAndAnalyticsIconRegistry[slug]).toBe(Component);
      expect(getDataEngineeringAndAnalyticsInfrastructureIcon(slug)).toBe(Component);
    }
  });

  it("resolves all 10 icons through global getInfrastructureIcon lookup", () => {
    for (const { slug, Component } of ALL_CATEGORY_13_ICONS) {
      const resolved = getInfrastructureIcon(slug);
      expect(resolved, `getInfrastructureIcon("${slug}") should resolve to component`).toBe(
        Component
      );
    }
  });
});
