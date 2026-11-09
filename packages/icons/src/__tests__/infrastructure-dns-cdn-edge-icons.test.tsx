import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  DnsResolverIcon,
  AuthoritativeDnsIcon,
  DnsLoadBalancingIcon,
  CdnIcon,
  EdgeCacheIcon,
  EdgeWorkerIcon,
  EdgeRouterIcon,
  ReverseProxyIcon,
  GlobalTrafficManagerIcon,
  AnycastNetworkIcon,
  dnsCdnEdgeIconRegistry,
  getDnsCdnEdgeInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_02_ICONS = [
  { slug: "dns-resolver", name: "DnsResolverIcon", Component: DnsResolverIcon },
  { slug: "authoritative-dns", name: "AuthoritativeDnsIcon", Component: AuthoritativeDnsIcon },
  { slug: "dns-load-balancing", name: "DnsLoadBalancingIcon", Component: DnsLoadBalancingIcon },
  { slug: "cdn", name: "CdnIcon", Component: CdnIcon },
  { slug: "edge-cache", name: "EdgeCacheIcon", Component: EdgeCacheIcon },
  { slug: "edge-worker", name: "EdgeWorkerIcon", Component: EdgeWorkerIcon },
  { slug: "edge-router", name: "EdgeRouterIcon", Component: EdgeRouterIcon },
  { slug: "reverse-proxy", name: "ReverseProxyIcon", Component: ReverseProxyIcon },
  { slug: "global-traffic-manager", name: "GlobalTrafficManagerIcon", Component: GlobalTrafficManagerIcon },
  { slug: "anycast-network", name: "AnycastNetworkIcon", Component: AnycastNetworkIcon },
] as const;

describe("Category 02 — DNS, CDN & Edge Infrastructure Icons", () => {
  it("renders all 10 icons in colored mode with 32x32 viewBox", () => {
    for (const { slug, name, Component } of ALL_CATEGORY_02_ICONS) {
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
    for (const { name, Component } of ALL_CATEGORY_02_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain(`<title>${name}</title>`);
      expect(html).toContain('role="img"');
    }
  });

  it("exports a complete dnsCdnEdgeIconRegistry with all 10 slugs", () => {
    expect(Object.keys(dnsCdnEdgeIconRegistry).length).toBe(10);
    for (const { slug } of ALL_CATEGORY_02_ICONS) {
      expect(dnsCdnEdgeIconRegistry[slug]).toBeDefined();
      expect(typeof dnsCdnEdgeIconRegistry[slug]).toBe("function");
    }
  });

  it("resolves icons correctly via getDnsCdnEdgeInfrastructureIcon and unified getInfrastructureIcon", () => {
    for (const { slug, Component } of ALL_CATEGORY_02_ICONS) {
      const resolvedDirect = getDnsCdnEdgeInfrastructureIcon(slug);
      const resolvedUnified = getInfrastructureIcon(slug);
      expect(resolvedDirect).toBe(Component);
      expect(resolvedUnified).toBe(Component);
    }
  });

  it("supports responsive custom sizes (16, 20, 24, 32, 48)", () => {
    const testSizes = [16, 20, 24, 32, 48];
    for (const size of testSizes) {
      const html = renderToString(<CdnIcon size={size} />);
      expect(html).toContain(`width="${size}"`);
      expect(html).toContain(`height="${size}"`);
    }
  });
});
