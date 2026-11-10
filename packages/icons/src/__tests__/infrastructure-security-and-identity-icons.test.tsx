import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  AuthenticationServiceIcon,
  AuthorizationServiceIcon,
  IdentityProviderIcon,
  OAuthProviderIcon,
  OpenIDConnectProviderIcon,
  ApiKeyServiceIcon,
  SecretsManagerIcon,
  KeyManagementServiceIcon,
  WebApplicationFirewallIcon,
  DdosProtectionIcon,
  RateLimiterIcon,
  CertificateAuthorityIcon,
  TokenServiceIcon,
  PolicyEngineIcon,
  securityAndIdentityIconRegistry,
  getSecurityAndIdentityInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_09_ICONS = [
  { slug: "authentication-service", name: "AuthenticationServiceIcon", Component: AuthenticationServiceIcon },
  { slug: "authorization-service", name: "AuthorizationServiceIcon", Component: AuthorizationServiceIcon },
  { slug: "identity-provider", name: "IdentityProviderIcon", Component: IdentityProviderIcon },
  { slug: "oauth-provider", name: "OAuthProviderIcon", Component: OAuthProviderIcon },
  { slug: "openid-connect-provider", name: "OpenIDConnectProviderIcon", Component: OpenIDConnectProviderIcon },
  { slug: "api-key-service", name: "ApiKeyServiceIcon", Component: ApiKeyServiceIcon },
  { slug: "secrets-manager", name: "SecretsManagerIcon", Component: SecretsManagerIcon },
  { slug: "key-management-service", name: "KeyManagementServiceIcon", Component: KeyManagementServiceIcon },
  { slug: "web-application-firewall", name: "WebApplicationFirewallIcon", Component: WebApplicationFirewallIcon },
  { slug: "ddos-protection", name: "DdosProtectionIcon", Component: DdosProtectionIcon },
  { slug: "rate-limiter", name: "RateLimiterIcon", Component: RateLimiterIcon },
  { slug: "certificate-authority", name: "CertificateAuthorityIcon", Component: CertificateAuthorityIcon },
  { slug: "token-service", name: "TokenServiceIcon", Component: TokenServiceIcon },
  { slug: "policy-engine", name: "PolicyEngineIcon", Component: PolicyEngineIcon },
] as const;

describe("Category 09 — Security & Identity Infrastructure Icons", () => {
  it("renders all 14 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_09_ICONS).toHaveLength(14);

    for (const { slug, name, Component } of ALL_CATEGORY_09_ICONS) {
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
    for (const { name, Component } of ALL_CATEGORY_09_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain(`<title>${name}</title>`);
      expect(html).toContain('role="img"');
      expect(html).not.toContain('aria-hidden="true"');
    }
  });

  it("resolves all 14 icons from securityAndIdentityIconRegistry and getInfrastructureIcon", () => {
    for (const { slug, Component } of ALL_CATEGORY_09_ICONS) {
      const registryComp = securityAndIdentityIconRegistry[slug];
      expect(registryComp).toBe(Component);

      const getterComp = getSecurityAndIdentityInfrastructureIcon(slug);
      expect(getterComp).toBe(Component);

      const globalComp = getInfrastructureIcon(slug);
      expect(globalComp).toBe(Component);
    }
  });

  it("scales correctly across standard infrastructure sizes", () => {
    const sizes = [16, 20, 24, 32, 48] as const;
    for (const size of sizes) {
      const html = renderToString(<AuthenticationServiceIcon size={size} />);
      expect(html).toContain(`width="${size}"`);
      expect(html).toContain(`height="${size}"`);
    }
  });
});

