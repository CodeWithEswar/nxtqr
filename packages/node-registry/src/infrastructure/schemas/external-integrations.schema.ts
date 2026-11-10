import { z } from "zod";

// Base shared infrastructure fields
const baseInfrastructureFields = {
  label: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  environment: z.enum(["development", "staging", "production", "edge", "local"]).default("production"),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(1024).optional(),
  enabled: z.boolean().default(true),
};

// Reusable external integration metadata sub-schema
export const externalIntegrationMetadataSchema = z.object({
  providerCategory: z
    .enum(["api-service", "payment-processor", "communication-provider", "identity-provider", "location-services", "webhook-emitter"])
    .default("api-service"),
  serviceRole: z.string().max(64).default("third-party-api"),
  integrationDirection: z.enum(["inbound", "outbound", "bidirectional"]).default("outbound"),
  authMechanism: z
    .enum(["api-key", "bearer-token", "oauth2-bearer", "mTLS", "hmac-signature", "basic-auth", "none"])
    .default("api-key"),
  timeoutMs: z.number().int().min(100).max(60000).default(5000),
  retryPolicy: z
    .enum(["exponential-backoff", "fixed-interval", "circuit-breaker-fallback", "no-retry"])
    .default("exponential-backoff"),
  rateLimitAssumption: z
    .enum(["strict-quota", "leaky-bucket", "tier-based", "unthrottled"])
    .default("strict-quota"),
  failureHandling: z
    .enum(["circuit-break", "queue-and-retry", "fail-fast", "fallback-mock"])
    .default("queue-and-retry"),
  observabilityLevel: z
    .enum(["detailed-telemetry", "basic-metrics", "access-logs-only", "none"])
    .default("detailed-telemetry"),
});
export type ExternalIntegrationMetadata = z.infer<typeof externalIntegrationMetadataSchema>;

// 1. External REST API Schema
export const externalRestApiConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("external-rest-api").default("external-rest-api"),
  baseUrlPlaceholder: z.string().min(1).max(256).default("https://api.external-partner.com/v1"),
  httpMethods: z
    .array(z.enum(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]))
    .min(1)
    .default(["GET", "POST"]),
  authType: z
    .enum(["api-key", "bearer-token", "basic", "oauth2", "mTLS", "none"])
    .default("api-key"),
  requestFormat: z
    .enum(["json", "multipart-form", "form-urlencoded", "xml", "binary"])
    .default("json"),
  responseFormat: z
    .enum(["json", "xml", "binary", "text"])
    .default("json"),
  paginationStrategy: z
    .enum(["cursor-based", "offset-limit", "page-number", "link-header", "none"])
    .default("cursor-based"),
  rateLimitAssumptionRps: z.number().int().min(1).max(50000).default(50),
  timeoutMs: z.number().int().min(100).max(60000).default(5000),
  retryPolicy: z
    .enum(["exponential-backoff", "linear", "no-retry"])
    .default("exponential-backoff"),
  versioningStrategy: z
    .enum(["uri-path", "header", "query-param", "none"])
    .default("uri-path"),
});
export type ExternalRestApiConfig = z.infer<typeof externalRestApiConfigSchema>;

// 2. GraphQL API Schema
export const graphqlApiConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("graphql-api").default("graphql-api"),
  endpointPlaceholder: z.string().min(1).max(256).default("https://api.external-partner.com/graphql"),
  supportedOperations: z
    .array(z.enum(["query", "mutation", "subscription"]))
    .min(1)
    .default(["query", "mutation"]),
  schemaReference: z.string().min(1).max(128).default("partner-schema.graphql"),
  authMechanism: z
    .enum(["bearer-token", "api-key", "cookie-session", "none"])
    .default("bearer-token"),
  queryDepthLimit: z.number().int().min(1).max(30).default(7),
  queryComplexityLimit: z.number().int().min(10).max(10000).default(500),
  paginationModel: z
    .enum(["relay-cursor-connections", "offset-limit", "none"])
    .default("relay-cursor-connections"),
  batchingSupport: z.boolean().default(true),
  timeoutMs: z.number().int().min(100).max(60000).default(8000),
  maxRequestRateRps: z.number().int().min(1).max(50000).default(100),
});
export type GraphqlApiConfig = z.infer<typeof graphqlApiConfigSchema>;

// 3. gRPC Service Schema
export const grpcServiceConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("grpc-service").default("grpc-service"),
  serviceDefinitionRef: z.string().min(1).max(128).default("proto/partner_service_v1.proto"),
  protocolVersion: z.enum(["http2", "http3"]).default("http2"),
  rpcMethods: z.array(z.string().min(1).max(64)).min(1).default(["GetResource", "StreamUpdates"]),
  streamingModes: z
    .array(z.enum(["unary", "server-streaming", "client-streaming", "bidirectional-streaming"]))
    .min(1)
    .default(["unary", "server-streaming"]),
  transportSecurity: z
    .enum(["tls-1.3", "tls-1.2", "mtls", "insecure-plaintext"])
    .default("tls-1.3"),
  authMechanism: z
    .enum(["jwt-metadata", "api-key-header", "cert-client", "none"])
    .default("jwt-metadata"),
  deadlineMs: z.number().int().min(100).max(60000).default(3000),
  retryPolicy: z
    .enum(["idempotent-only", "exponential-backoff", "no-retry"])
    .default("idempotent-only"),
  loadBalancing: z
    .enum(["round-robin", "pick-first", "grpclb", "envoy-sidecar"])
    .default("round-robin"),
  maxConcurrentStreams: z.number().int().min(1).max(10000).default(100),
});
export type GrpcServiceConfig = z.infer<typeof grpcServiceConfigSchema>;

// 4. Payment Gateway Schema
export const paymentGatewayConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("payment-gateway").default("payment-gateway"),
  paymentFlowType: z
    .enum(["hosted-checkout", "direct-api", "tokenized-sdk", "bank-transfer"])
    .default("tokenized-sdk"),
  paymentMethodCategories: z
    .array(z.enum(["credit-debit-cards", "digital-wallets", "bank-ach", "realtime-payments", "buy-now-pay-later"]))
    .min(1)
    .default(["credit-debit-cards", "digital-wallets"]),
  currencySupport: z.array(z.string().min(3).max(3)).min(1).default(["USD", "EUR", "GBP", "JPY", "CAD"]),
  authCaptureStrategy: z
    .enum(["two-step-authorize-capture", "single-step-immediate-capture"])
    .default("two-step-authorize-capture"),
  refundSupport: z
    .enum(["full-and-partial", "full-only", "manual-dispute-only"])
    .default("full-and-partial"),
  webhookVerification: z
    .enum(["asymmetric-signature", "shared-hmac-secret", "ip-allowlist"])
    .default("asymmetric-signature"),
  idempotencyPolicy: z
    .enum(["strict-idempotency-key", "reference-id-dedup", "none"])
    .default("strict-idempotency-key"),
  settlementAssumption: z
    .enum(["t-plus-2-days", "t-plus-1-day", "instant-settlement", "monthly"])
    .default("t-plus-2-days"),
  reconciliationStrategy: z
    .enum(["automated-daily-ledger", "webhook-event-based", "batch-export"])
    .default("automated-daily-ledger"),
  tpsEstimate: z.number().int().min(1).max(10000).default(25),
});
export type PaymentGatewayConfig = z.infer<typeof paymentGatewayConfigSchema>;

// 5. Email Provider Schema
export const emailProviderConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("email-provider").default("email-provider"),
  emailCategory: z.enum(["transactional", "marketing-broadcast", "hybrid"]).default("transactional"),
  templateReference: z.string().min(1).max(128).default("templates/auth-verification.html"),
  senderDomain: z.string().min(1).max(128).default("mail.company-domain.com"),
  domainAuthProtocols: z
    .array(z.enum(["spf", "dkim", "dmarc", "bimi"]))
    .min(1)
    .default(["spf", "dkim", "dmarc"]),
  deliveryEventSupport: z
    .array(z.enum(["delivered", "opened", "clicked", "bounced", "complained"]))
    .min(1)
    .default(["delivered", "bounced", "complained"]),
  retryPolicy: z
    .enum(["exponential-with-jitter", "three-attempts", "drop-on-fail"])
    .default("exponential-with-jitter"),
  bounceHandling: z
    .enum(["auto-suppress-hard-bounce", "alert-admin", "dead-letter"])
    .default("auto-suppress-hard-bounce"),
  suppressionListSync: z.boolean().default(true),
  sendingRatePerSecond: z.number().int().min(1).max(10000).default(50),
});
export type EmailProviderConfig = z.infer<typeof emailProviderConfigSchema>;

// 6. SMS Provider Schema
export const smsProviderConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("sms-provider").default("sms-provider"),
  messageCategory: z
    .enum(["otp-verification", "transactional-alert", "marketing-campaign"])
    .default("otp-verification"),
  senderIdentityAssumption: z
    .enum(["alphanumeric-sender-id", "shortcode", "toll-free-10dlc", "long-code"])
    .default("shortcode"),
  geographicCoverage: z.array(z.string().min(2).max(32)).min(1).default(["US/CA", "EU", "APAC", "GLOBAL"]),
  templateRequirements: z
    .enum(["strict-pre-registered", "dynamic-content-permitted"])
    .default("strict-pre-registered"),
  encodingSupport: z.enum(["gsm-7", "ucs-2-unicode", "auto-detect"]).default("auto-detect"),
  deliveryReceiptSupport: z.boolean().default(true),
  retryPolicy: z
    .enum(["fallback-alternate-carrier", "exponential-retry", "no-retry"])
    .default("fallback-alternate-carrier"),
  rateLimitAssumptionPerSecond: z.number().int().min(1).max(2000).default(20),
  monthlyVolumeEstimate: z.number().int().min(100).max(50000000).default(100000),
});
export type SmsProviderConfig = z.infer<typeof smsProviderConfigSchema>;

// 7. WhatsApp Provider Schema
export const whatsappProviderConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("whatsapp-provider").default("whatsapp-provider"),
  businessMessagingMode: z
    .enum(["cloud-api", "on-premises-gateway", "bsp-hosted-partner"])
    .default("cloud-api"),
  templateCategory: z
    .enum(["authentication-otp", "utility-notification", "marketing"])
    .default("utility-notification"),
  conversationType: z
    .enum(["user-initiated-service", "business-initiated-template"])
    .default("business-initiated-template"),
  optInAssumption: z
    .enum(["explicit-double-opt-in", "account-creation-consent", "inbound-prompt"])
    .default("explicit-double-opt-in"),
  deliveryStatusCallbacks: z
    .array(z.enum(["sent", "delivered", "read", "failed"]))
    .min(1)
    .default(["sent", "delivered", "read", "failed"]),
  mediaSupport: z
    .array(z.enum(["text-only", "document-pdf", "images", "interactive-buttons", "audio"]))
    .min(1)
    .default(["text-only", "interactive-buttons", "images"]),
  retryStrategy: z
    .enum(["message-queue-backoff", "fallback-to-sms", "fail-fast"])
    .default("message-queue-backoff"),
  providerRouting: z
    .enum(["meta-direct", "twilio-proxy", "infobip-proxy", "sinch-proxy"])
    .default("meta-direct"),
  messageRatePerSecond: z.number().int().min(1).max(1000).default(25),
});
export type WhatsappProviderConfig = z.infer<typeof whatsappProviderConfigSchema>;

// 8. Maps Provider Schema
export const mapsProviderConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("maps-provider").default("maps-provider"),
  serviceCapabilities: z
    .array(z.enum(["geocoding", "reverse-geocoding", "directions-routing", "distance-matrix", "places-autocomplete", "static-tiles", "vector-tiles"]))
    .min(1)
    .default(["geocoding", "reverse-geocoding", "directions-routing", "distance-matrix"]),
  geocodingAccuracy: z
    .enum(["rooftop-exact", "interpolated", "geometric-center", "approximate"])
    .default("rooftop-exact"),
  routingProfile: z
    .enum(["driving-traffic", "walking", "cycling", "transit", "truck-freight"])
    .default("driving-traffic"),
  distanceMatrixCalculation: z
    .enum(["matrix-api-realtime", "straight-line-haversine-fallback"])
    .default("matrix-api-realtime"),
  placesSearchType: z
    .enum(["text-search", "nearby-radar", "details-by-place-id"])
    .default("nearby-radar"),
  mapTileStyle: z
    .enum(["vector-styled", "raster-png", "satellite-hybrid"])
    .default("vector-styled"),
  rateLimitRpm: z.number().int().min(10).max(100000).default(3000),
  cachingRestrictions: z
    .enum(["ephemeral-session-only", "30-days-cache-permitted", "zero-caching-mandated"])
    .default("ephemeral-session-only"),
  dailyRequestVolumeQuota: z.number().int().min(100).max(10000000).default(50000),
});
export type MapsProviderConfig = z.infer<typeof mapsProviderConfigSchema>;

// 9. OAuth Integration Schema
export const oauthIntegrationConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("oauth-integration").default("oauth-integration"),
  oauthFlow: z
    .enum(["authorization-code-pkce", "client-credentials", "device-authorization", "refresh-token"])
    .default("authorization-code-pkce"),
  authorizationServerRef: z.string().min(1).max(256).default("https://auth.partner-platform.com"),
  clientType: z
    .enum(["public-spa", "public-mobile", "confidential-backend-server"])
    .default("confidential-backend-server"),
  redirectUriPlaceholder: z.string().min(1).max(256).default("https://studio.nxtqr.dev/api/auth/callback/partner"),
  scopeDefinitions: z.array(z.string().min(1).max(64)).min(1).default(["read:profile", "email", "openid"]),
  pkceRequirement: z.enum(["mandatory-s256", "optional", "unsupported"]).default("mandatory-s256"),
  tokenRefreshAssumption: z
    .enum(["rotating-refresh-tokens", "static-refresh-token", "re-authenticate"])
    .default("rotating-refresh-tokens"),
  stateValidation: z
    .enum(["cryptographic-nonce", "signed-jws-state", "random-csrf-token"])
    .default("cryptographic-nonce"),
  tokenStorageStrategy: z
    .enum(["http-only-secure-cookie", "vault-server-side", "memory-only"])
    .default("http-only-secure-cookie"),
  sessionLifetimeMinutes: z.number().int().min(1).max(1440).default(60),
});
export type OauthIntegrationConfig = z.infer<typeof oauthIntegrationConfigSchema>;

// 10. Third-Party Webhook Schema
export const thirdPartyWebhookConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("third-party-webhook").default("third-party-webhook"),
  eventTypes: z
    .array(z.string().min(1).max(64))
    .min(1)
    .default(["payment.succeeded", "invoice.paid", "account.updated"]),
  callbackEndpointPlaceholder: z.string().min(1).max(256).default("https://api.nxtqr.dev/webhooks/partner-receiver"),
  signatureVerification: z
    .enum(["hmac-sha256-header", "ed25519-public-key", "ip-whitelist-only", "mutual-tls"])
    .default("hmac-sha256-header"),
  timestampToleranceSeconds: z.number().int().min(5).max(3600).default(300),
  replayProtection: z
    .enum(["nonce-cache-redis", "timestamp-window-strict", "event-id-dedup"])
    .default("event-id-dedup"),
  deliveryRetryAssumption: z
    .enum(["exponential-with-jitter-24h", "linear-hourly", "no-retry"])
    .default("exponential-with-jitter-24h"),
  idempotencyHandling: z
    .enum(["transactional-outbox", "unique-event-id-table", "stateless-idempotent"])
    .default("unique-event-id-table"),
  orderingAssumption: z
    .enum(["out-of-order-possible", "strict-sequential-guarantee"])
    .default("out-of-order-possible"),
  deadLetterStrategy: z
    .enum(["sqs-dlq-after-5-fails", "alert-operator", "discard"])
    .default("sqs-dlq-after-5-fails"),
  expectedEventRatePerMinute: z.number().int().min(1).max(100000).default(600),
});
export type ThirdPartyWebhookConfig = z.infer<typeof thirdPartyWebhookConfigSchema>;

// Discriminated union of all external integration config schemas
export const externalIntegrationsConfigSchema = z.discriminatedUnion("componentType", [
  externalRestApiConfigSchema,
  graphqlApiConfigSchema,
  grpcServiceConfigSchema,
  paymentGatewayConfigSchema,
  emailProviderConfigSchema,
  smsProviderConfigSchema,
  whatsappProviderConfigSchema,
  mapsProviderConfigSchema,
  oauthIntegrationConfigSchema,
  thirdPartyWebhookConfigSchema,
]);
export type ExternalIntegrationsConfig = z.infer<typeof externalIntegrationsConfigSchema>;
