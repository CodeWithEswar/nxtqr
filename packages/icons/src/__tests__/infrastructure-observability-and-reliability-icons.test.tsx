import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
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
  observabilityAndReliabilityIconRegistry,
  getObservabilityAndReliabilityInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_10_ICONS = [
  { slug: "monitoring-service", name: "MonitoringServiceIcon", Component: MonitoringServiceIcon },
  { slug: "metrics-collector", name: "MetricsCollectorIcon", Component: MetricsCollectorIcon },
  { slug: "log-collector", name: "LogCollectorIcon", Component: LogCollectorIcon },
  { slug: "log-aggregator", name: "LogAggregatorIcon", Component: LogAggregatorIcon },
  { slug: "distributed-tracing", name: "DistributedTracingIcon", Component: DistributedTracingIcon },
  { slug: "alert-manager", name: "AlertManagerIcon", Component: AlertManagerIcon },
  { slug: "health-check-service", name: "HealthCheckServiceIcon", Component: HealthCheckServiceIcon },
  { slug: "error-tracker", name: "ErrorTrackerIcon", Component: ErrorTrackerIcon },
  { slug: "apm-service", name: "ApmServiceIcon", Component: ApmServiceIcon },
  { slug: "status-page", name: "StatusPageIcon", Component: StatusPageIcon },
] as const;

describe("Category 10 — Observability & Reliability Infrastructure Icons", () => {
  it("renders all 10 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_10_ICONS).toHaveLength(10);

    for (const { slug, name, Component } of ALL_CATEGORY_10_ICONS) {
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
    for (const { name, Component } of ALL_CATEGORY_10_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain(`<title>${name}</title>`);
      expect(html).toContain('role="img"');
      expect(html).not.toContain('aria-hidden="true"');
    }
  });

  it("resolves all 10 icons from observabilityAndReliabilityIconRegistry and getInfrastructureIcon", () => {
    for (const { slug, Component } of ALL_CATEGORY_10_ICONS) {
      const registryComp = observabilityAndReliabilityIconRegistry[slug];
      expect(registryComp).toBe(Component);

      const getterComp = getObservabilityAndReliabilityInfrastructureIcon(slug);
      expect(getterComp).toBe(Component);

      const globalComp = getInfrastructureIcon(slug);
      expect(globalComp).toBe(Component);
    }
  });

  it("scales correctly across standard infrastructure sizes", () => {
    const sizes = [16, 20, 24, 32, 48] as const;
    for (const size of sizes) {
      const html = renderToString(<MonitoringServiceIcon size={size} />);
      expect(html).toContain(`width="${size}"`);
      expect(html).toContain(`height="${size}"`);
    }
  });
});

