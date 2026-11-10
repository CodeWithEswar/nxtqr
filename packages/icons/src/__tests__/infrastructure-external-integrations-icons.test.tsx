import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  ExternalRestApiIcon,
  GraphqlApiIcon,
  GrpcServiceIcon,
  PaymentGatewayIcon,
  EmailProviderIcon,
  SmsProviderIcon,
  WhatsappProviderIcon,
  MapsProviderIcon,
  OauthIntegrationIcon,
  ThirdPartyWebhookIcon,
  externalIntegrationsIconRegistry,
  getExternalIntegrationsIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_17_ICONS = [
  { slug: "external-rest-api", name: "ExternalRestApiIcon", Component: ExternalRestApiIcon },
  { slug: "graphql-api", name: "GraphqlApiIcon", Component: GraphqlApiIcon },
  { slug: "grpc-service", name: "GrpcServiceIcon", Component: GrpcServiceIcon },
  { slug: "payment-gateway", name: "PaymentGatewayIcon", Component: PaymentGatewayIcon },
  { slug: "email-provider", name: "EmailProviderIcon", Component: EmailProviderIcon },
  { slug: "sms-provider", name: "SmsProviderIcon", Component: SmsProviderIcon },
  { slug: "whatsapp-provider", name: "WhatsappProviderIcon", Component: WhatsappProviderIcon },
  { slug: "maps-provider", name: "MapsProviderIcon", Component: MapsProviderIcon },
  { slug: "oauth-integration", name: "OauthIntegrationIcon", Component: OauthIntegrationIcon },
  { slug: "third-party-webhook", name: "ThirdPartyWebhookIcon", Component: ThirdPartyWebhookIcon },
] as const;

describe("Category 17 — External Integrations Icons", () => {
  it("renders all 10 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_17_ICONS).toHaveLength(10);

    for (const { slug, name, Component } of ALL_CATEGORY_17_ICONS) {
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
    for (const { slug, name, Component } of ALL_CATEGORY_17_ICONS) {
      const html = renderToString(<Component size={24} variant="monochrome" />);
      expect(html, `Monochrome "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('width="24"');
      expect(html).toContain('height="24"');
      // In monochrome, the primary strokes use #A3A3A3
      expect(html).toContain("#A3A3A3");
    }
  });

  it("resolves all 10 icons from the external integrations and global infrastructure registries", () => {
    for (const { slug, Component } of ALL_CATEGORY_17_ICONS) {
      expect(externalIntegrationsIconRegistry[slug]).toBe(Component);
      expect(getExternalIntegrationsIcon(slug)).toBe(Component);
      expect(getInfrastructureIcon(slug)).toBe(Component);
    }
  });
});
