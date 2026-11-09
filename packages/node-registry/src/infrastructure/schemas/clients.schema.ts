import { z } from "zod";

export const SharedInfrastructureConfigSchema = z.object({
  label: z.string().min(1, "Label is required").max(64, "Label must not exceed 64 characters"),
  description: z.string().max(256, "Description must not exceed 256 characters").optional(),
  componentType: z.string().min(1),
  environment: z
    .enum(["production", "staging", "development", "edge", "local"])
    .default("production"),
  tags: z.array(z.string().max(24)).max(8).default([]),
  notes: z.string().max(1024).optional(),
  enabled: z.boolean().default(true),
});

export type SharedInfrastructureConfig = z.infer<typeof SharedInfrastructureConfigSchema>;

// 01 — Web Browser
export const WebBrowserConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("web-browser"),
  browserFamily: z.enum(["generic", "chromium", "firefox", "safari", "other"]).default("chromium"),
  supportedTransports: z
    .array(z.enum(["HTTP", "HTTPS", "WebSocket", "SSE"]))
    .min(1)
    .default(["HTTPS", "WebSocket"]),
  cookieSupport: z.boolean().default(true),
  localStorage: z.boolean().default(true),
  sessionStorage: z.boolean().default(true),
  cachingStrategy: z.enum(["standard", "aggressive", "none"]).default("standard"),
  concurrentUsers: z.number().int().min(1).max(10_000_000).default(500),
});
export type WebBrowserConfig = z.infer<typeof WebBrowserConfigSchema>;

// 02 — Mobile Application
export const MobileApplicationConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("mobile-application"),
  platform: z.enum(["ios", "android", "cross-platform", "other"]).default("cross-platform"),
  connectivity: z.enum(["online", "intermittent", "offline-capable"]).default("intermittent"),
  apiTransport: z.enum(["HTTPS", "WebSocket", "gRPC"]).default("HTTPS"),
  storageStrategy: z.enum(["sqlite", "key-value", "encrypted-fs", "none"]).default("sqlite"),
  pushNotifications: z.boolean().default(true),
  backgroundSync: z.boolean().default(true),
  activeDevices: z.number().int().min(1).max(50_000_000).default(5000),
});
export type MobileApplicationConfig = z.infer<typeof MobileApplicationConfigSchema>;

// 03 — Desktop Application
export const DesktopApplicationConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("desktop-application"),
  platform: z.enum(["windows", "macos", "linux", "cross-platform"]).default("cross-platform"),
  applicationModel: z.enum(["native", "hybrid-electron", "web-wrapped"]).default("native"),
  apiTransport: z.enum(["HTTPS", "TCP", "WebSocket", "gRPC"]).default("HTTPS"),
  localPersistence: z.enum(["sqlite", "filesystem", "embedded-db", "none"]).default("sqlite"),
  backgroundProcessing: z.boolean().default(true),
  autoUpdateDelivery: z.boolean().default(true),
});
export type DesktopApplicationConfig = z.infer<typeof DesktopApplicationConfigSchema>;

// 04 — Single Page Application
export const SinglePageApplicationConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("single-page-application"),
  framework: z.enum(["react", "vue", "angular", "svelte", "other"]).default("react"),
  routingMode: z.enum(["client-side-history", "hash"]).default("client-side-history"),
  stateManagement: z.enum(["redux", "zustand", "context", "signals", "other"]).default("zustand"),
  apiTransport: z.enum(["REST", "GraphQL", "WebSocket", "tRPC"]).default("REST"),
  authIntegration: z.enum(["oauth-oidc", "jwt-bearer", "session-cookie"]).default("jwt-bearer"),
  clientCache: z.boolean().default(true),
});
export type SinglePageApplicationConfig = z.infer<typeof SinglePageApplicationConfigSchema>;

// 05 — Server-Side Rendered Application
export const ServerRenderedAppConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("server-side-rendered-app"),
  framework: z.enum(["nextjs", "remix", "nuxt", "sveltekit", "other"]).default("nextjs"),
  renderingStrategy: z.enum(["ssr", "streaming", "isr"]).default("streaming"),
  hydrationStrategy: z.enum(["full", "partial", "island", "resumable"]).default("full"),
  cachePolicy: z.enum(["edge-cached", "server-memory", "nocache"]).default("edge-cached"),
  serverRuntime: z.enum(["nodejs", "edge-worker", "serverless"]).default("nodejs"),
  revalidationSeconds: z.number().int().min(0).max(86400).default(60),
});
export type ServerRenderedAppConfig = z.infer<typeof ServerRenderedAppConfigSchema>;

// 06 — Static Website
export const StaticWebsiteConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("static-website"),
  hostingType: z.enum(["cdn-edge", "object-storage", "web-server"]).default("cdn-edge"),
  cdnProvider: z.enum(["cloudflare", "fastly", "cloudfront", "other"]).default("cloudflare"),
  assetCaching: z.enum(["immutable", "standard", "minimal"]).default("immutable"),
  deploymentStrategy: z.enum(["git-triggered", "ci-push", "manual-sftp"]).default("git-triggered"),
  hasFormOrApi: z.boolean().default(true),
});
export type StaticWebsiteConfig = z.infer<typeof StaticWebsiteConfigSchema>;

// 07 — Progressive Web Application
export const ProgressiveWebAppConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("progressive-web-app"),
  installable: z.boolean().default(true),
  serviceWorkerUsage: z.enum(["cache-first", "network-first", "stale-while-revalidate"]).default("stale-while-revalidate"),
  offlineCapable: z.boolean().default(true),
  backgroundSync: z.boolean().default(true),
  pushCapability: z.boolean().default(true),
  updateStrategy: z.enum(["prompt-reload", "silent-update"]).default("prompt-reload"),
});
export type ProgressiveWebAppConfig = z.infer<typeof ProgressiveWebAppConfigSchema>;

// 08 — CLI Client
export const CliClientConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("cli-client"),
  runtimeEnvironment: z.enum(["posix", "windows", "cross-platform"]).default("cross-platform"),
  executionMode: z.enum(["interactive", "headless-daemon", "batch-job"]).default("interactive"),
  authMethod: z.enum(["api-key", "oauth-device-flow", "ssh-key", "none"]).default("api-key"),
  apiTransport: z.enum(["REST-HTTPS", "gRPC", "raw-tcp"]).default("REST-HTTPS"),
  retryPolicy: z.enum(["exponential-backoff", "linear", "none"]).default("exponential-backoff"),
  timeoutMs: z.number().int().min(100).max(300000).default(30000),
});
export type CliClientConfig = z.infer<typeof CliClientConfigSchema>;

// 09 — IoT Device
export const IotDeviceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("iot-device"),
  deviceClass: z.enum(["sensor", "actuator", "gateway", "embedded-controller"]).default("sensor"),
  connectivityType: z.enum(["wifi", "cellular-5g-lte", "ethernet", "bluetooth-ble", "lorawan"]).default("wifi"),
  communicationProtocol: z.enum(["MQTT", "HTTP", "CoAP", "WebSocket"]).default("MQTT"),
  telemetryIntervalSeconds: z.number().int().min(1).max(86400).default(60),
  powerSource: z.enum(["mains-powered", "battery", "solar-scavenged"]).default("mains-powered"),
  hardwareSecurity: z.enum(["secure-element", "tpm", "software-cert"]).default("software-cert"),
  bufferOffline: z.boolean().default(true),
  deviceCount: z.number().int().min(1).max(10_000_000).default(100),
});
export type IotDeviceConfig = z.infer<typeof IotDeviceConfigSchema>;

// 10 — Third-Party Client
export const ThirdPartyClientConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("third-party-client"),
  clientCategory: z.enum(["api-partner", "public-consumer", "enterprise-b2b", "internal-service"]).default("api-partner"),
  integrationMethod: z.enum(["rest-webhook", "sdk", "graphql-federation", "grpc"]).default("rest-webhook"),
  authMethod: z.enum(["oauth2-m2m", "mutual-tls", "hmac-signed-token", "api-key"]).default("oauth2-m2m"),
  requestFrequencyRps: z.number().min(0).max(100000).default(50),
  rateLimitTier: z.enum(["standard-100rps", "enterprise-1000rps", "custom"]).default("standard-100rps"),
  trustLevel: z.enum(["zero-trust", "verified-partner", "internal-trusted"]).default("zero-trust"),
  timeoutMs: z.number().int().min(100).max(120000).default(10000),
});
export type ThirdPartyClientConfig = z.infer<typeof ThirdPartyClientConfigSchema>;
