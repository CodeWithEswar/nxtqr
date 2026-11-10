import { z } from "zod";
import { SharedInfrastructureConfigSchema } from "./clients.schema";

// 01 — Authentication Service
export const AuthenticationServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("authentication-service"),
  authMethods: z
    .array(z.enum(["password", "passkey-webauthn", "otp", "federated-auth", "client-certificate"]))
    .default(["passkey-webauthn", "password"]),
  identitySource: z
    .enum(["internal-database", "directory-ldap", "idp-federation", "external-oauth"])
    .default("internal-database"),
  mfaRequirements: z
    .enum(["disabled", "optional", "required-all", "adaptive-risk"])
    .default("adaptive-risk"),
  sessionStrategy: z
    .enum(["jwt-stateless", "server-session-store", "database-backed"])
    .default("server-session-store"),
  sessionLifetimeMinutes: z.number().int().min(5).max(43200).default(720),
  passwordlessSupport: z.boolean().default(true),
  credentialValidationStrategy: z
    .enum(["argon2id", "bcrypt", "scrypt", "fido2-attestation"])
    .default("argon2id"),
  lockoutThresholdAttempts: z.number().int().min(3).max(20).default(5),
  rateLimitAssumption: z.string().default("1000 req/sec"),
});
export type AuthenticationServiceConfig = z.infer<typeof AuthenticationServiceConfigSchema>;

// 02 — Authorization Service
export const AuthorizationServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("authorization-service"),
  authorizationModel: z.enum(["rbac", "abac", "rebac", "acl"]).default("rbac"),
  resourceScope: z.string().default("workspace:*"),
  subjectModel: z
    .enum(["user-principal", "service-account", "workload-identity", "federated-identity"])
    .default("user-principal"),
  permissionModel: z
    .enum(["action-based", "attribute-based", "relationship-graph", "fine-grained"])
    .default("action-based"),
  policyDecisionStrategy: z
    .enum(["pdp-centralized", "sidecar-embedded", "cached-compiled"])
    .default("sidecar-embedded"),
  defaultDeny: z.boolean().default(true),
  decisionCacheTtlSeconds: z.number().int().min(0).max(3600).default(60),
  auditLogging: z.boolean().default(true),
  decisionRateAssumption: z.string().default("50000 eval/sec"),
});
export type AuthorizationServiceConfig = z.infer<typeof AuthorizationServiceConfigSchema>;

// 03 — Identity Provider
export const IdentityProviderConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("identity-provider"),
  federationProtocols: z
    .array(z.enum(["saml2", "oidc", "ws-federation", "ldap"]))
    .default(["oidc", "saml2"]),
  directoryType: z
    .enum(["cloud-directory", "active-directory", "openldap", "scim-synced"])
    .default("cloud-directory"),
  userLifecycleManagement: z.boolean().default(true),
  groupManagement: z.boolean().default(true),
  mfaPolicy: z.enum(["always-enforce", "risk-based", "optional"]).default("risk-based"),
  sessionPolicy: z.enum(["single-session", "concurrent-allowed", "device-bound"]).default("device-bound"),
  scimProvisioning: z.boolean().default(true),
  activeUsersAssumption: z.number().int().min(100).max(10000000).default(10000),
});
export type IdentityProviderConfig = z.infer<typeof IdentityProviderConfigSchema>;

// 04 — OAuth Provider
export const OAuthProviderConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("oauth-provider"),
  supportedGrantTypes: z
    .array(z.enum(["authorization-code", "client-credentials", "refresh-token", "device-code"]))
    .default(["authorization-code", "client-credentials", "refresh-token"]),
  clientTypes: z
    .array(z.enum(["confidential-server", "public-spa", "public-mobile"]))
    .default(["confidential-server", "public-spa"]),
  pkceRequirement: z.enum(["mandatory-all", "mandatory-public", "optional"]).default("mandatory-all"),
  scopeModel: z.string().default("openid profile email offline_access"),
  accessTokenLifetimeMinutes: z.number().int().min(1).max(1440).default(60),
  refreshTokenRotation: z.boolean().default(true),
  tokenRevocationSupport: z.boolean().default(true),
  issuerUrl: z.string().default("https://auth.nxtqr.internal"),
});
export type OAuthProviderConfig = z.infer<typeof OAuthProviderConfigSchema>;

// 05 — OpenID Connect Provider
export const OpenIDConnectProviderConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("openid-connect-provider"),
  issuerIdentifier: z.string().default("https://oidc.nxtqr.internal"),
  discoveryEndpoint: z.string().default("/.well-known/openid-configuration"),
  responseTypesSupported: z
    .array(z.enum(["code", "code id_token", "id_token"]))
    .default(["code"]),
  idTokenSigningAlgorithm: z.enum(["RS256", "ES256", "EdDSA", "PS256"]).default("ES256"),
  claimsModel: z.array(z.string()).default(["sub", "name", "email", "email_verified", "roles"]),
  subjectType: z.enum(["public", "pairwise"]).default("pairwise"),
  userInfoEndpointEnabled: z.boolean().default(true),
  jwksRotationDays: z.number().int().min(1).max(365).default(30),
});
export type OpenIDConnectProviderConfig = z.infer<typeof OpenIDConnectProviderConfigSchema>;

// 06 — API Key Service
export const ApiKeyServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("api-key-service"),
  issuanceModel: z
    .enum(["scoped-bearer", "signed-hmac", "hashed-prefix-secret"])
    .default("hashed-prefix-secret"),
  keyScope: z.string().default("read:telemetry,write:traces"),
  expirationDays: z.number().int().min(1).max(730).default(90),
  rotationGracePeriodHours: z.number().int().min(0).max(168).default(24),
  hashingAlgorithm: z.enum(["SHA-256", "SHA-512", "BLAKE3"]).default("SHA-256"),
  usageTrackingEnabled: z.boolean().default(true),
  rateLimitQuotaPerMinute: z.number().int().min(10).max(1000000).default(6000),
});
export type ApiKeyServiceConfig = z.infer<typeof ApiKeyServiceConfigSchema>;

// 07 — Secrets Manager
export const SecretsManagerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("secrets-manager"),
  secretCategories: z
    .array(
      z.enum([
        "database-credentials",
        "api-tokens",
        "tls-certificates",
        "encryption-passphrases",
        "oauth-secrets",
      ])
    )
    .default(["database-credentials", "api-tokens"]),
  versioningEnabled: z.boolean().default(true),
  autoRotationIntervalDays: z.number().int().min(0).max(365).default(30),
  accessControlModel: z
    .enum(["iam-role-based", "attribute-based", "mTLS-identity"])
    .default("iam-role-based"),
  encryptionAtRest: z
    .enum(["AES-256-GCM", "ChaCha20-Poly1305", "KMS-envelope"])
    .default("KMS-envelope"),
  auditAccessLogging: z.boolean().default(true),
  cachingTtlSeconds: z.number().int().min(0).max(3600).default(300),
});
export type SecretsManagerConfig = z.infer<typeof SecretsManagerConfigSchema>;

// 08 — Key Management Service
export const KeyManagementServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("key-management-service"),
  keyTypes: z
    .array(
      z.enum([
        "asymmetric-rsa",
        "asymmetric-ecdsa",
        "asymmetric-ed25519",
        "symmetric-aes-256",
      ])
    )
    .default(["symmetric-aes-256", "asymmetric-ed25519"]),
  keyPurposes: z
    .array(z.enum(["encrypt-decrypt", "sign-verify", "key-agreement", "envelope-wrapping"]))
    .default(["encrypt-decrypt", "sign-verify"]),
  fipsProtectionLevel: z
    .enum(["FIPS-140-2-Level-2", "FIPS-140-2-Level-3", "FIPS-140-3-Level-4"])
    .default("FIPS-140-2-Level-3"),
  rotationIntervalDays: z.number().int().min(0).max(730).default(90),
  hardwareSecurityModule: z.boolean().default(true),
  dualAuthorization: z.boolean().default(true),
  deletionGracePeriodDays: z.number().int().min(7).max(30).default(14),
});
export type KeyManagementServiceConfig = z.infer<typeof KeyManagementServiceConfigSchema>;

// 09 — Web Application Firewall
export const WebApplicationFirewallConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("web-application-firewall"),
  deploymentMode: z
    .enum(["cloud-edge", "ingress-controller-sidecar", "reverse-proxy-plugin"])
    .default("cloud-edge"),
  inspectionScope: z
    .enum(["header-and-body", "full-payload-tls-terminated", "metadata-only"])
    .default("full-payload-tls-terminated"),
  ruleGroups: z
    .array(
      z.enum([
        "owasp-top-10",
        "cve-virtual-patches",
        "ip-reputation",
        "bot-mitigation",
        "custom-sqli-xss",
      ])
    )
    .default(["owasp-top-10", "cve-virtual-patches", "bot-mitigation"]),
  enforcementAction: z
    .enum(["block-and-alert", "challenge-captcha", "simulate-count", "rate-throttle"])
    .default("block-and-alert"),
  falsePositiveHandling: z
    .enum(["allowlist-override", "score-thresholding", "canary-rules"])
    .default("score-thresholding"),
  peakInspectionCapacity: z.string().default("20 Gbps / 50000 rps"),
});
export type WebApplicationFirewallConfig = z.infer<typeof WebApplicationFirewallConfigSchema>;

// 10 — DDoS Protection
export const DdosProtectionConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("ddos-protection"),
  protectedLayers: z
    .array(z.enum(["layer-3-4-volumetric", "layer-7-application", "dns-amplification"]))
    .default(["layer-3-4-volumetric", "layer-7-application"]),
  mitigationStrategy: z
    .enum(["anycast-scrubbing", "syn-proxy-filtering", "rate-shaping-quarantine", "geo-challenge"])
    .default("anycast-scrubbing"),
  networkCapacityAssumption: z.string().default("150 Tbps scrubbing mesh"),
  detectionMode: z
    .enum(["automated-inline", "heuristic-anomaly", "always-active-scrubbing"])
    .default("automated-inline"),
  trafficBaselining: z.boolean().default(true),
  escalationPolicy: z
    .enum(["auto-route-blackhole", "divert-to-clean-pipe", "synthetic-rate-cap"])
    .default("divert-to-clean-pipe"),
});
export type DdosProtectionConfig = z.infer<typeof DdosProtectionConfigSchema>;

// 11 — Rate Limiter
export const RateLimiterConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("rate-limiter"),
  limitingAlgorithm: z
    .enum(["token-bucket", "leaky-bucket", "sliding-window-log", "fixed-window-counter"])
    .default("token-bucket"),
  requestKeyScope: z
    .enum(["client-ip", "api-key-id", "user-id", "ip-plus-route", "global-tenant"])
    .default("api-key-id"),
  windowDurationSeconds: z.number().int().min(1).max(86400).default(60),
  requestQuota: z.number().int().min(1).max(10000000).default(1000),
  burstCapacity: z.number().int().min(0).max(1000000).default(200),
  sharedStateStore: z
    .enum(["redis-cluster", "memcached", "in-memory-local", "edge-kv"])
    .default("redis-cluster"),
  failureMode: z.enum(["fail-open", "fail-closed", "cached-allow"]).default("fail-open"),
});
export type RateLimiterConfig = z.infer<typeof RateLimiterConfigSchema>;

// 12 — Certificate Authority
export const CertificateAuthorityConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("certificate-authority"),
  caRole: z
    .enum(["root-ca", "subordinate-intermediate-ca", "issuing-sub-ca", "internal-mesh-ca"])
    .default("subordinate-intermediate-ca"),
  certificateTypes: z
    .array(z.enum(["tls-server", "tls-client-mtls", "code-signing", "smime-email"]))
    .default(["tls-server", "tls-client-mtls"]),
  signingAlgorithm: z
    .enum(["ECDSA-P384-SHA384", "ECDSA-P256-SHA256", "RSA-4096-SHA256", "Ed25519"])
    .default("ECDSA-P256-SHA256"),
  validityPeriodDays: z.number().int().min(1).max(3650).default(90),
  renewalPolicy: z
    .enum(["acme-automated", "manual-csr", "vault-pki-dynamic"])
    .default("acme-automated"),
  revocationMechanism: z
    .enum(["ocsp-stapling", "crl-distribution", "short-lived-certs"])
    .default("ocsp-stapling"),
  certificateTransparencyEnabled: z.boolean().default(true),
});
export type CertificateAuthorityConfig = z.infer<typeof CertificateAuthorityConfigSchema>;

// 13 — Token Service
export const TokenServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("token-service"),
  tokenFormat: z.enum(["jwt", "paseto-v4", "opaque-reference", "macaroon"]).default("jwt"),
  issuanceStrategy: z
    .enum(["asymmetric-signed", "symmetric-mac", "ephemeral-dynamically-keyed"])
    .default("asymmetric-signed"),
  signingAlgorithm: z.enum(["ES256", "EdDSA", "RS256", "PS256"]).default("ES256"),
  tokenLifetimeMinutes: z.number().int().min(1).max(10080).default(15),
  audienceModel: z.string().default("https://api.nxtqr.internal"),
  tokenExchangeSupport: z.boolean().default(true),
  revocationStrategy: z
    .enum(["bloom-filter-blacklist", "distributed-redis-blocklist", "short-lived-no-revocation"])
    .default("distributed-redis-blocklist"),
});
export type TokenServiceConfig = z.infer<typeof TokenServiceConfigSchema>;

// 14 — Policy Engine
export const PolicyEngineConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("policy-engine"),
  policyLanguage: z
    .enum(["rego-opa", "cedar", "polar-oso", "json-schema-rules"])
    .default("rego-opa"),
  evaluationModel: z
    .enum(["embedded-library", "sidecar-daemon", "centralized-pdp-service"])
    .default("sidecar-daemon"),
  policySource: z
    .enum(["gitops-bundle", "oci-registry", "database-sync"])
    .default("gitops-bundle"),
  decisionCaching: z.boolean().default(true),
  decisionCacheTtlMs: z.number().int().min(0).max(600000).default(5000),
  defaultDecision: z.enum(["deny", "allow"]).default("deny"),
  auditLogging: z.boolean().default(true),
});
export type PolicyEngineConfig = z.infer<typeof PolicyEngineConfigSchema>;

