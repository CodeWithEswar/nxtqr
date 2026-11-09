import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  LoadBalancerIcon,
  Layer4LoadBalancerIcon,
  Layer7LoadBalancerIcon,
  ApiGatewayIcon,
  IngressControllerIcon,
  ForwardProxyIcon,
  NatGatewayIcon,
  VpcIcon,
  SubnetIcon,
  ServiceDiscoveryIcon,
  ServiceMeshIcon,
  NetworkFirewallIcon,
  networkingAndTrafficIconRegistry,
  getNetworkingAndTrafficInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_03_ICONS = [
  { slug: "load-balancer", name: "LoadBalancerIcon", Component: LoadBalancerIcon },
  { slug: "layer-4-load-balancer", name: "Layer4LoadBalancerIcon", Component: Layer4LoadBalancerIcon },
  { slug: "layer-7-load-balancer", name: "Layer7LoadBalancerIcon", Component: Layer7LoadBalancerIcon },
  { slug: "api-gateway", name: "ApiGatewayIcon", Component: ApiGatewayIcon },
  { slug: "ingress-controller", name: "IngressControllerIcon", Component: IngressControllerIcon },
  { slug: "forward-proxy", name: "ForwardProxyIcon", Component: ForwardProxyIcon },
  { slug: "nat-gateway", name: "NatGatewayIcon", Component: NatGatewayIcon },
  { slug: "vpc", name: "VpcIcon", Component: VpcIcon },
  { slug: "subnet", name: "SubnetIcon", Component: SubnetIcon },
  { slug: "service-discovery", name: "ServiceDiscoveryIcon", Component: ServiceDiscoveryIcon },
  { slug: "service-mesh", name: "ServiceMeshIcon", Component: ServiceMeshIcon },
  { slug: "network-firewall", name: "NetworkFirewallIcon", Component: NetworkFirewallIcon },
] as const;

describe("Category 03 — Networking & Traffic Infrastructure Icons", () => {
  it("renders all 12 icons in colored mode with 32x32 viewBox", () => {
    for (const { slug, name, Component } of ALL_CATEGORY_03_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 12 icons in monochrome mode with accessible titles", () => {
    for (const { name, Component } of ALL_CATEGORY_03_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain(`<title>${name}</title>`);
      expect(html).toContain('role="img"');
    }
  });

  it("ensures registry exports exactly 12 items mapping slug to component", () => {
    expect(Object.keys(networkingAndTrafficIconRegistry)).toHaveLength(12);
    for (const { slug, Component } of ALL_CATEGORY_03_ICONS) {
      expect(networkingAndTrafficIconRegistry[slug]).toBe(Component);
      expect(getNetworkingAndTrafficInfrastructureIcon(slug)).toBe(Component);
    }
  });

  it("resolves through the unified getInfrastructureIcon helper", () => {
    for (const { slug, Component } of ALL_CATEGORY_03_ICONS) {
      const resolved = getInfrastructureIcon(slug);
      expect(resolved).toBe(Component);
    }
  });

  it("scales responsively across all standard studio sizes (16, 20, 24, 32, 48)", () => {
    const testSizes = [16, 20, 24, 32, 48];
    for (const size of testSizes) {
      const html = renderToString(<LoadBalancerIcon size={size} />);
      expect(html).toContain(`width="${size}"`);
      expect(html).toContain(`height="${size}"`);
    }
  });
});
