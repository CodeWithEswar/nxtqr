import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  SystemBoundaryIcon,
  ServiceGroupIcon,
  NetworkBoundaryIcon,
  TrustBoundaryIcon,
  ArchitectureNoteIcon,
  DecisionAnnotationIcon,
  TrafficLabelIcon,
  ConnectionJunctionIcon,
  ExternalDependencyIcon,
  FailureZoneIcon,
  architectureAndDiagramUtilitiesIconRegistry,
  getArchitectureAndDiagramUtilitiesIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_19_ICONS = [
  { slug: "system-boundary", name: "SystemBoundaryIcon", Component: SystemBoundaryIcon },
  { slug: "service-group", name: "ServiceGroupIcon", Component: ServiceGroupIcon },
  { slug: "network-boundary", name: "NetworkBoundaryIcon", Component: NetworkBoundaryIcon },
  { slug: "trust-boundary", name: "TrustBoundaryIcon", Component: TrustBoundaryIcon },
  { slug: "architecture-note", name: "ArchitectureNoteIcon", Component: ArchitectureNoteIcon },
  { slug: "decision-annotation", name: "DecisionAnnotationIcon", Component: DecisionAnnotationIcon },
  { slug: "traffic-label", name: "TrafficLabelIcon", Component: TrafficLabelIcon },
  { slug: "connection-junction", name: "ConnectionJunctionIcon", Component: ConnectionJunctionIcon },
  { slug: "external-dependency", name: "ExternalDependencyIcon", Component: ExternalDependencyIcon },
  { slug: "failure-zone", name: "FailureZoneIcon", Component: FailureZoneIcon },
] as const;

describe("Category 19 — Architecture and Diagram Utilities Icons", () => {
  it("renders all 10 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_19_ICONS).toHaveLength(10);

    for (const { slug, name, Component } of ALL_CATEGORY_19_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 10 icons in monochrome mode with neutral tokens", () => {
    for (const { slug, name, Component } of ALL_CATEGORY_19_ICONS) {
      const html = renderToString(<Component size={24} variant="monochrome" />);
      expect(html, `Monochrome "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('width="24"');
      expect(html).toContain('height="24"');
      expect(html).toContain("#A3A3A3");
    }
  });

  it("resolves all 10 icons from the utilities and global infrastructure registries", () => {
    for (const { slug, Component } of ALL_CATEGORY_19_ICONS) {
      expect(architectureAndDiagramUtilitiesIconRegistry[slug]).toBe(Component);
      expect(getArchitectureAndDiagramUtilitiesIcon(slug)).toBe(Component);
      expect(getInfrastructureIcon(slug)).toBe(Component);
    }
  });
});
