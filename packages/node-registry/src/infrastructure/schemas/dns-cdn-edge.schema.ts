import { z } from "zod";
import { SharedInfrastructureConfigSchema } from "./clients.schema";

// 01 — DNS Resolver
export const DnsResolverConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("dns-resolver"),
  resolverMode: z.enum(["recursive", "forwarding", "caching-only"]).default("recursive"),
  dnsTransport: z.enum(["UDP/53", "TCP/53", "DoT-TCP/853", "DoH-HTTPS/443"]).default("UDP/53"),
  cacheEnabled: z.boolean().default(true),
  cacheTtlMinSeconds: z.number().int().min(0).max(86400).default(60),
  cacheTtlMaxSeconds: z.number().int().min(60).max(604800).default(86400),
  dnssecValidation: z.boolean().default(false),
  upstreamResolvers: z.array(z.string()).max(4).default(["1.1.1.1", "8.8.8.8"]),
  queryTimeoutMs: z.number().int().min(100).max(10000).default(2000),
  assumedQps: z.number().int().min(1).max(1000000).default(10000),
});
export type DnsResolverConfig = z.infer<typeof DnsResolverConfigSchema>;

// 02 — Authoritative DNS
export const AuthoritativeDnsConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("authoritative-dns"),
  zoneName: z.string().min(1).max(253).default("example.internal"),
  zoneType: z.enum(["primary", "secondary", "split-horizon-private"]).default("primary"),
  recordFamilies: z
    .array(z.enum(["A", "AAAA", "CNAME", "MX", "TXT", "NS", "SRV", "CAA"]))
    .min(1)
    .default(["A", "AAAA", "CNAME", "NS", "TXT"]),
  defaultTtlSeconds: z.number().int().min(1).max(86400).default(300),
  dnssecSigning: z.boolean().default(false),
  zoneTransferAllowed: z.boolean().default(false),
  queryCapacityRps: z.number().int().min(100).max(10000000).default(50000),
});
export type AuthoritativeDnsConfig = z.infer<typeof AuthoritativeDnsConfigSchema>;

// 03 — DNS Load Balancing
export const DnsLoadBalancingConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("dns-load-balancing"),
  routingPolicy: z
    .enum(["weighted", "geolocation", "latency-based", "multivalue-answer", "active-passive-failover"])
    .default("weighted"),
  healthCheckEnabled: z.boolean().default(true),
  healthCheckIntervalSeconds: z.number().int().min(5).max(300).default(30),
  ttlSeconds: z.number().int().min(5).max(3600).default(60),
  failoverThresholdPercent: z.number().int().min(1).max(100).default(50),
  geographicRegions: z.array(z.string()).default(["na-east", "eu-west", "ap-southeast"]),
  destinationPoolCount: z.number().int().min(1).max(32).default(3),
});
export type DnsLoadBalancingConfig = z.infer<typeof DnsLoadBalancingConfigSchema>;

// 04 — Content Delivery Network (CDN)
export const CdnConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("cdn"),
  cachePolicy: z
    .enum(["cache-everything", "respect-origin-headers", "bypass-dynamic-only", "aggressive-static"])
    .default("respect-origin-headers"),
  defaultTtlSeconds: z.number().int().min(0).max(31536000).default(86400),
  tlsTermination: z.boolean().default(true),
  minTlsVersion: z.enum(["TLS-1.2", "TLS-1.3"]).default("TLS-1.3"),
  compressionEnabled: z.boolean().default(true),
  compressionAlgorithms: z.array(z.enum(["gzip", "brotli", "zstd"])).default(["brotli", "gzip"]),
  originShieldEnabled: z.boolean().default(true),
  globalPoPCount: z.number().int().min(1).max(500).default(120),
});
export type CdnConfig = z.infer<typeof CdnConfigSchema>;

// 05 — Edge Cache
export const EdgeCacheConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("edge-cache"),
  storageTier: z.enum(["memory-only", "nvme-tiered", "distributed-dram"]).default("nvme-tiered"),
  capacityGb: z.number().int().min(1).max(100000).default(512),
  evictionPolicy: z.enum(["lru", "lfu", "fifo", "slru"]).default("lru"),
  staleWhileRevalidateSeconds: z.number().int().min(0).max(86400).default(300),
  staleIfErrorSeconds: z.number().int().min(0).max(86400).default(1800),
  queryParamInCacheKey: z.boolean().default(true),
  purgeMethods: z
    .array(z.enum(["tag-based", "url-exact", "wildcard-prefix"]))
    .default(["tag-based", "url-exact"]),
});
export type EdgeCacheConfig = z.infer<typeof EdgeCacheConfigSchema>;

// 06 — Edge Worker
export const EdgeWorkerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("edge-worker"),
  runtimeModel: z.enum(["v8-isolate", "wasm", "micro-vm"]).default("v8-isolate"),
  triggerType: z.enum(["http-request", "scheduled-cron", "queue-consumer", "websocket"]).default("http-request"),
  executionTimeoutMs: z.number().int().min(5).max(30000).default(50),
  memoryLimitMb: z.number().int().min(16).max(1024).default(128),
  kvBindingEnabled: z.boolean().default(true),
  subrequestLimit: z.number().int().min(1).max(500).default(50),
  concurrencyPerPoP: z.number().int().min(10).max(100000).default(1000),
});
export type EdgeWorkerConfig = z.infer<typeof EdgeWorkerConfigSchema>;

// 07 — Edge Router
export const EdgeRouterConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("edge-router"),
  routingStrategy: z
    .enum(["path-prefix", "host-header", "http-method", "query-parameter", "weighted-split"])
    .default("path-prefix"),
  supportedProtocols: z
    .array(z.enum(["HTTP/1.1", "HTTP/2", "HTTP/3", "gRPC", "WebSocket"]))
    .default(["HTTP/2", "HTTP/3", "WebSocket"]),
  maxHeaderSizeKb: z.number().int().min(4).max(64).default(16),
  routeCount: z.number().int().min(1).max(256).default(8),
  healthCheckPath: z.string().min(1).max(128).default("/healthz"),
  failoverPolicy: z
    .enum(["automatic-next-upstream", "circuit-breaker", "fallback-static-page"])
    .default("automatic-next-upstream"),
});
export type EdgeRouterConfig = z.infer<typeof EdgeRouterConfigSchema>;

// 08 — Reverse Proxy
export const ReverseProxyConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("reverse-proxy"),
  proxyMode: z.enum(["layer7-http", "layer4-tcp-stream", "transparent"]).default("layer7-http"),
  tlsTermination: z.boolean().default(true),
  upstreamProtocol: z.enum(["HTTP/1.1", "HTTP/2", "gRPC", "FastCGI"]).default("HTTP/1.1"),
  keepAliveTimeoutSeconds: z.number().int().min(5).max(300).default(65),
  maxConnectionsPerUpstream: z.number().int().min(10).max(10000).default(1024),
  forwardHeaders: z
    .array(z.enum(["X-Forwarded-For", "X-Forwarded-Proto", "X-Real-IP", "CF-Connecting-IP"]))
    .default(["X-Forwarded-For", "X-Forwarded-Proto", "X-Real-IP"]),
  rateLimitEnabled: z.boolean().default(false),
  clientMaxBodySizeMb: z.number().int().min(1).max(1024).default(16),
});
export type ReverseProxyConfig = z.infer<typeof ReverseProxyConfigSchema>;

// 09 — Global Traffic Manager
export const GlobalTrafficManagerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("global-traffic-manager"),
  steeringPolicy: z
    .enum(["geo-proximity", "performance-lowest-latency", "weighted-round-robin", "failover-priority"])
    .default("performance-lowest-latency"),
  managedRegions: z.array(z.string()).default(["us-east", "us-west", "eu-central", "ap-northeast"]),
  telemetrySampleRateSeconds: z.number().int().min(5).max(300).default(15),
  failoverDwellTimeSeconds: z.number().int().min(10).max(600).default(60),
  minimumHealthyOriginPercent: z.number().int().min(10).max(100).default(30),
  activePoolsCount: z.number().int().min(1).max(16).default(4),
});
export type GlobalTrafficManagerConfig = z.infer<typeof GlobalTrafficManagerConfigSchema>;

// 10 — Anycast Network
export const AnycastNetworkConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("anycast-network"),
  asnNumber: z.number().int().min(1).max(4294967295).default(13335),
  routingProtocol: z.enum(["BGP-4", "eBGP-MultiHop", "Internal-Static"]).default("BGP-4"),
  ipVersion: z.enum(["IPv4-IPv6-DualStack", "IPv4-Only", "IPv6-Only"]).default("IPv4-IPv6-DualStack"),
  announcedPrefix: z.string().min(7).max(48).default("198.51.100.0/24"),
  activePoPsCount: z.number().int().min(2).max(350).default(84),
  ddosMitigationEnabled: z.boolean().default(true),
  bgpCommunityTag: z.string().max(32).default("standard-global"),
});
export type AnycastNetworkConfig = z.infer<typeof AnycastNetworkConfigSchema>;

