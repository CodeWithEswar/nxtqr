import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  WebServerIcon,
  ApplicationServerIcon,
  BackendServiceIcon,
  MicroserviceIcon,
  MonolithicApplicationIcon,
  ServerlessFunctionIcon,
  ContainerIcon,
  ContainerClusterIcon,
  KubernetesPodIcon,
  KubernetesServiceIcon,
  VirtualMachineIcon,
  BackgroundWorkerIcon,
  ScheduledJobIcon,
  BatchProcessorIcon,
  computeAndApplicationServicesIconRegistry,
  getComputeAndApplicationServicesInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_04_ICONS = [
  { slug: "web-server", name: "WebServerIcon", Component: WebServerIcon },
  { slug: "application-server", name: "ApplicationServerIcon", Component: ApplicationServerIcon },
  { slug: "backend-service", name: "BackendServiceIcon", Component: BackendServiceIcon },
  { slug: "microservice", name: "MicroserviceIcon", Component: MicroserviceIcon },
  { slug: "monolithic-application", name: "MonolithicApplicationIcon", Component: MonolithicApplicationIcon },
  { slug: "serverless-function", name: "ServerlessFunctionIcon", Component: ServerlessFunctionIcon },
  { slug: "container", name: "ContainerIcon", Component: ContainerIcon },
  { slug: "container-cluster", name: "ContainerClusterIcon", Component: ContainerClusterIcon },
  { slug: "kubernetes-pod", name: "KubernetesPodIcon", Component: KubernetesPodIcon },
  { slug: "kubernetes-service", name: "KubernetesServiceIcon", Component: KubernetesServiceIcon },
  { slug: "virtual-machine", name: "VirtualMachineIcon", Component: VirtualMachineIcon },
  { slug: "background-worker", name: "BackgroundWorkerIcon", Component: BackgroundWorkerIcon },
  { slug: "scheduled-job", name: "ScheduledJobIcon", Component: ScheduledJobIcon },
  { slug: "batch-processor", name: "BatchProcessorIcon", Component: BatchProcessorIcon },
] as const;

describe("Category 04 — Compute & Application Services Infrastructure Icons", () => {
  it("renders all 14 icons in colored mode with 32x32 viewBox", () => {
    for (const { slug, name, Component } of ALL_CATEGORY_04_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 14 icons in monochrome mode with accessible titles", () => {
    for (const { name, Component } of ALL_CATEGORY_04_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain(`<title>${name}</title>`);
      expect(html).toContain('role="img"');
    }
  });

  it("ensures registry exports exactly 14 items mapping slug to component", () => {
    expect(Object.keys(computeAndApplicationServicesIconRegistry)).toHaveLength(14);
    for (const { slug, Component } of ALL_CATEGORY_04_ICONS) {
      expect(computeAndApplicationServicesIconRegistry[slug]).toBe(Component);
      expect(getComputeAndApplicationServicesInfrastructureIcon(slug)).toBe(Component);
      expect(getInfrastructureIcon(slug)).toBe(Component);
    }
  });

  it("supports arbitrary sizes without distortion (16px, 20px, 48px)", () => {
    const html16 = renderToString(<WebServerIcon size={16} />);
    expect(html16).toContain('width="16"');
    expect(html16).toContain('height="16"');

    const html48 = renderToString(<MicroserviceIcon size={48} />);
    expect(html48).toContain('width="48"');
    expect(html48).toContain('height="48"');
  });
});
