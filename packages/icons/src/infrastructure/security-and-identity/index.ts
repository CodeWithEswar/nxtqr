export * from "./authentication-service-icon";
export * from "./authorization-service-icon";
export * from "./identity-provider-icon";
export * from "./oauth-provider-icon";
export * from "./openid-connect-provider-icon";
export * from "./api-key-service-icon";
export * from "./secrets-manager-icon";
export * from "./key-management-service-icon";
export * from "./web-application-firewall-icon";
export * from "./ddos-protection-icon";
export * from "./rate-limiter-icon";
export * from "./certificate-authority-icon";
export * from "./token-service-icon";
export * from "./policy-engine-icon";

import type { InfrastructureIconComponent } from "../types";
import { AuthenticationServiceIcon } from "./authentication-service-icon";
import { AuthorizationServiceIcon } from "./authorization-service-icon";
import { IdentityProviderIcon } from "./identity-provider-icon";
import { OAuthProviderIcon } from "./oauth-provider-icon";
import { OpenIDConnectProviderIcon } from "./openid-connect-provider-icon";
import { ApiKeyServiceIcon } from "./api-key-service-icon";
import { SecretsManagerIcon } from "./secrets-manager-icon";
import { KeyManagementServiceIcon } from "./key-management-service-icon";
import { WebApplicationFirewallIcon } from "./web-application-firewall-icon";
import { DdosProtectionIcon } from "./ddos-protection-icon";
import { RateLimiterIcon } from "./rate-limiter-icon";
import { CertificateAuthorityIcon } from "./certificate-authority-icon";
import { TokenServiceIcon } from "./token-service-icon";
import { PolicyEngineIcon } from "./policy-engine-icon";

export {
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
};

export const securityAndIdentityIconRegistry: Record<string, InfrastructureIconComponent> = {
  "authentication-service": AuthenticationServiceIcon,
  "authorization-service": AuthorizationServiceIcon,
  "identity-provider": IdentityProviderIcon,
  "oauth-provider": OAuthProviderIcon,
  "openid-connect-provider": OpenIDConnectProviderIcon,
  "api-key-service": ApiKeyServiceIcon,
  "secrets-manager": SecretsManagerIcon,
  "key-management-service": KeyManagementServiceIcon,
  "web-application-firewall": WebApplicationFirewallIcon,
  "ddos-protection": DdosProtectionIcon,
  "rate-limiter": RateLimiterIcon,
  "certificate-authority": CertificateAuthorityIcon,
  "token-service": TokenServiceIcon,
  "policy-engine": PolicyEngineIcon,
};

export function getSecurityAndIdentityInfrastructureIcon(slug: string): InfrastructureIconComponent | undefined {
  return securityAndIdentityIconRegistry[slug];
}

