import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  WebBrowserIcon,
  MobileApplicationIcon,
  DesktopApplicationIcon,
  SinglePageApplicationIcon,
  ServerRenderedAppIcon,
  StaticWebsiteIcon,
  ProgressiveWebAppIcon,
  CliClientIcon,
  IotDeviceIcon,
  ThirdPartyClientIcon,
  clientIconRegistry,
  getClientInfrastructureIcon,
} from "../index";

const ALL_ICONS = [
  { slug: "web-browser", name: "WebBrowserIcon", Component: WebBrowserIcon },
  { slug: "mobile-application", name: "MobileApplicationIcon", Component: MobileApplicationIcon },
  { slug: "desktop-application", name: "DesktopApplicationIcon", Component: DesktopApplicationIcon },
  { slug: "single-page-application", name: "SinglePageApplicationIcon", Component: SinglePageApplicationIcon },
  { slug: "server-side-rendered-app", name: "ServerRenderedAppIcon", Component: ServerRenderedAppIcon },
  { slug: "static-website", name: "StaticWebsiteIcon", Component: StaticWebsiteIcon },
  { slug: "progressive-web-app", name: "ProgressiveWebAppIcon", Component: ProgressiveWebAppIcon },
  { slug: "cli-client", name: "CliClientIcon", Component: CliClientIcon },
  { slug: "iot-device", name: "IotDeviceIcon", Component: IotDeviceIcon },
  { slug: "third-party-client", name: "ThirdPartyClientIcon", Component: ThirdPartyClientIcon },
] as const;

describe("NXTQR Phase 05.1.1 — Infrastructure Client Icons", () => {
  it("renders all 10 colored client icons with valid SVG structure", () => {
    for (const { Component, name } of ALL_ICONS) {
      const html = renderToString(<Component variant="colored" size={32} />);
      expect(html, `${name} should render an SVG element`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
    }
  });

  it("renders all 10 monochrome client icons", () => {
    for (const { Component, name } of ALL_ICONS) {
      const html = renderToString(<Component variant="monochrome" size={24} />);
      expect(html, `${name} should render monochrome SVG`).toContain("<svg");
      expect(html).toContain('width="24"');
    }
  });

  it("supports accessible standalone labeling when decorative is false", () => {
    for (const { Component, name } of ALL_ICONS) {
      const html = renderToString(
        <Component decorative={false} title={`Accessible ${name}`} />
      );
      expect(html).toContain(`<title>Accessible ${name}</title>`);
      expect(html).toContain('role="img"');
      expect(html).not.toContain('aria-hidden="true"');
    }
  });

  it("sets aria-hidden=true and role=presentation when decorative=true", () => {
    for (const { Component } of ALL_ICONS) {
      const html = renderToString(<Component decorative={true} />);
      expect(html).toContain('aria-hidden="true"');
      expect(html).toContain('role="presentation"');
      expect(html).not.toContain("<title>");
    }
  });

  it("correctly resolves every icon from clientIconRegistry and helper", () => {
    expect(Object.keys(clientIconRegistry)).toHaveLength(10);

    for (const { slug, Component } of ALL_ICONS) {
      expect(clientIconRegistry[slug]).toBe(Component);
      expect(getClientInfrastructureIcon(slug)).toBe(Component);
    }

    expect(getClientInfrastructureIcon("non-existent")).toBeUndefined();
  });
});

