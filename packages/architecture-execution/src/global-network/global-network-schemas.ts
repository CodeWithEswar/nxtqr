import { z } from "zod";

export const DnsRecordTypeSchema = z.enum(["A", "AAAA", "CNAME", "NS", "SOA"]);
export type DnsRecordType = z.infer<typeof DnsRecordTypeSchema>;

export const DnsRecordSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: DnsRecordTypeSchema,
  ttlSeconds: z.number().int().min(0),
  value: z.string().min(1),
  weight: z.number().min(0).optional(),
  region: z.string().optional(),
  healthTargetId: z.string().optional(),
  latencyMs: z.number().min(0).optional(),
});
export type DnsRecord = z.infer<typeof DnsRecordSchema>;

export const DnsZoneSchema = z.object({
  zoneName: z.string().min(1),
  nameservers: z.array(z.string().min(1)).default(["ns1.example.net"]),
  soaMinimumTtlSeconds: z.number().int().min(0).default(60),
  healthy: z.boolean().default(true),
  records: z.array(DnsRecordSchema),
});
export type DnsZone = z.infer<typeof DnsZoneSchema>;

export const RecursiveResolverConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  cacheEnabled: z.boolean().default(true),
  baseLatencyMs: z.number().min(0).default(6),
  retryCount: z.number().int().min(0).default(1),
  timeoutMs: z.number().positive().default(1500),
  healthy: z.boolean().default(true),
});
export type RecursiveResolverConfig = z.infer<typeof RecursiveResolverConfigSchema>;

export const DnsRoutingPolicySchema = z.enum([
  "simple",
  "weighted",
  "geographic",
  "latency",
  "health_failover",
]);
export type DnsRoutingPolicy = z.infer<typeof DnsRoutingPolicySchema>;

export const DnsConfigurationSchema = z.object({
  resolvers: z.array(RecursiveResolverConfigSchema).min(1),
  zones: z.array(DnsZoneSchema).min(1),
  routingPolicy: DnsRoutingPolicySchema.default("simple"),
  delegationLatencyMs: z
    .object({
      rootMs: z.number().min(0).default(12),
      tldMs: z.number().min(0).default(14),
      authMs: z.number().min(0).default(18),
    })
    .default({}),
  allowStaleOnError: z.boolean().default(false),
});
export type DnsConfiguration = z.infer<typeof DnsConfigurationSchema>;

export const ClientRegionConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  resolverId: z.string().min(1),
  stubCacheEnabled: z.boolean().default(false),
  stubCacheTtlMs: z.number().int().min(0).default(30000),
});
export type ClientRegionConfig = z.infer<typeof ClientRegionConfigSchema>;

export const HttpCachePolicySchema = z.object({
  cacheControl: z.enum(["public", "private", "no-store", "max-age"]).default("public"),
  maxAgeSeconds: z.number().int().min(0).default(60),
  sMaxAgeSeconds: z.number().int().min(0).optional(),
  staleWhileRevalidateSeconds: z.number().int().min(0).default(0),
  staleIfErrorSeconds: z.number().int().min(0).default(0),
  varyHeaders: z.array(z.string()).default([]),
  coalesceRequests: z.boolean().default(true),
  etagSupport: z.boolean().default(true),
});
export type HttpCachePolicy = z.infer<typeof HttpCachePolicySchema>;

export const CdnEdgeConfigSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  healthy: z.boolean().default(true),
  capacityRps: z.number().int().positive().default(1000),
  processingLatencyMs: z.number().min(0).default(4),
  networkLatencyByClientRegion: z.record(z.number().min(0)).default({}),
  anycastCostByClientRegion: z.record(z.number().min(0)).default({}),
  mappedIp: z.string().optional(),
});
export type CdnEdgeConfig = z.infer<typeof CdnEdgeConfigSchema>;

export const OriginShieldConfigSchema = z.object({
  enabled: z.boolean().default(false),
  id: z.string().default("shield-core"),
  region: z.string().default("us-east"),
  processingLatencyMs: z.number().min(0).default(12),
  edgeToShieldLatencyMs: z.number().min(0).default(25),
  healthy: z.boolean().default(true),
});
export type OriginShieldConfig = z.infer<typeof OriginShieldConfigSchema>;

export const CdnConfigurationSchema = z.object({
  enabled: z.boolean().default(true),
  routingStrategy: z
    .enum(["dns_directed", "latency", "geographic", "anycast"])
    .default("latency"),
  edges: z.array(CdnEdgeConfigSchema),
  cachePolicy: HttpCachePolicySchema.default({}),
  originShield: OriginShieldConfigSchema.default({}),
  purgePropagationDelayMs: z.number().int().min(0).default(300),
});
export type CdnConfiguration = z.infer<typeof CdnConfigurationSchema>;

export const OriginResourceSchema = z.object({
  status: z.number().int().default(200),
  etag: z.string().default('"v1-abc"'),
  lastModified: z.string().default("2026-11-12T00:00:00Z"),
  bodyPreview: z.string().default('{"ok":true}'),
  cacheControlOverride: z.string().optional(),
  sizeBytes: z.number().int().min(0).default(4096),
});
export type OriginResource = z.infer<typeof OriginResourceSchema>;

export const OriginConfigurationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  role: z.enum(["primary", "secondary"]).default("primary"),
  healthy: z.boolean().default(true),
  processingLatencyMs: z.number().min(0).default(45),
  networkLatencyFromEdgeMs: z.number().min(0).default(60),
  capacityRps: z.number().int().positive().default(500),
  ipAddress: z.string().default("198.51.100.10"),
  resources: z.record(OriginResourceSchema).default({}),
});
export type OriginConfiguration = z.infer<typeof OriginConfigurationSchema>;

export const GlobalRequestStepSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().int().min(0),
  clientId: z.string().min(1),
  domain: z.string().min(1),
  recordType: z.enum(["A", "AAAA"]).default("A"),
  path: z.string().default("/api/products"),
  method: z.enum(["GET", "POST", "PUT", "DELETE"]).default("GET"),
  headers: z.record(z.string()).default({}),
  concurrentBurstCount: z.number().int().min(1).default(1),
});
export type GlobalRequestStep = z.infer<typeof GlobalRequestStepSchema>;

export const GlobalNetworkFaultSchema = z.object({
  id: z.string().min(1),
  type: z.enum([
    "resolver_down",
    "auth_dns_down",
    "edge_outage",
    "regional_outage",
    "origin_down",
    "latency_spike",
  ]),
  targetId: z.string().min(1),
  atMs: z.number().int().min(0),
  recoveryAtMs: z.number().int().min(0).optional(),
  addedLatencyMs: z.number().min(0).optional(),
  description: z.string().default(""),
});
export type GlobalNetworkFault = z.infer<typeof GlobalNetworkFaultSchema>;

export const CachePurgeActionSchema = z.object({
  id: z.string().min(1),
  atMs: z.number().int().min(0),
  pathPattern: z.string().min(1),
  mode: z.enum(["object", "prefix", "tag"]).default("object"),
});
export type CachePurgeAction = z.infer<typeof CachePurgeActionSchema>;

export const GlobalNetworkScenarioSchema = z.object({
  version: z.literal(1),
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().default(""),
  architectureRevisionId: z.string().min(1).default("rev-1"),
  presetId: z.string().optional(),
  clients: z.array(ClientRegionConfigSchema).min(1),
  dns: DnsConfigurationSchema,
  cdn: CdnConfigurationSchema,
  origins: z.array(OriginConfigurationSchema).min(1),
  requests: z.array(GlobalRequestStepSchema),
  faults: z.array(GlobalNetworkFaultSchema).default([]),
  purges: z.array(CachePurgeActionSchema).default([]),
  limits: z.object({
    maxRequests: z.number().int().positive().default(500),
    maxEvents: z.number().int().positive().default(1500),
    maxVirtualDurationMs: z.number().int().positive().default(20000),
  }),
});
export type GlobalNetworkScenario = z.infer<typeof GlobalNetworkScenarioSchema>;

// Runtime Models

export interface DnsCacheEntryState {
  cacheKey: string;
  queryName: string;
  recordType: DnsRecordType;
  answers: string[];
  insertedAtMs: number;
  expiresAtMs: number;
  originalTtlSeconds: number;
  isNegative: boolean;
  negativeType?: "NXDOMAIN" | "NODATA";
}

export interface DnsResolutionTrace {
  queryId: string;
  clientId: string;
  resolverId: string;
  domain: string;
  recordType: "A" | "AAAA";
  referralChain: string[];
  cnameChain: string[];
  cacheOutcome: "hit" | "miss" | "negative_hit" | "expired" | "stale" | "bypass";
  rcode: "NOERROR" | "NXDOMAIN" | "NODATA" | "SERVFAIL";
  answers: string[];
  ttlSeconds: number;
  resolutionLatencyMs: number;
  explanation: string;
}

export interface EdgeCacheEntryState {
  cacheKey: string;
  edgeId: string;
  path: string;
  etag: string;
  lastModified: string;
  status: number;
  insertedAtMs: number;
  expiresAtMs: number;
  staleUntilMs?: number;
  revalidateUntilMs?: number;
  hitCount: number;
  bodyPreview: string;
}

export interface CdnEdgeRuntimeState {
  id: string;
  name: string;
  region: string;
  healthy: boolean;
  capacityRps: number;
  activeRequests: number;
  processingLatencyMs: number;
  cacheEntries: Record<string, EdgeCacheEntryState>;
  hitCount: number;
  missCount: number;
  staleServedCount: number;
  revalidatedCount: number;
  rejectedCapacityCount: number;
}

export interface OriginRuntimeState {
  id: string;
  name: string;
  region: string;
  role: "primary" | "secondary";
  healthy: boolean;
  requestCount: number;
  errorCount: number;
}

export interface RequestLatencyBreakdown {
  requestId: string;
  clientId: string;
  clientRegion: string;
  domain: string;
  path: string;
  atMs: number;
  dnsMs: number;
  connectTlsMs: number;
  edgeLookupMs: number;
  shieldMs: number;
  originFetchMs: number;
  transferMs: number;
  totalMs: number;
  cacheStatus: "HIT" | "MISS" | "REVALIDATED" | "STALE" | "BYPASS" | "ERROR";
  selectedEdgeId?: string;
  selectedEdgeRegion?: string;
  selectedOriginId?: string;
  statusCode: number;
  explanation: string;
}

export interface GlobalNetworkMetrics {
  totalDnsQueries: number;
  dnsCacheHits: number;
  dnsCacheMisses: number;
  dnsHitRatioPct: number;
  avgDnsLatencyMs: number;
  totalHttpRequests: number;
  cdnCacheHits: number;
  cdnCacheMisses: number;
  cdnRevalidations: number;
  cdnStaleResponses: number;
  cdnHitRatioPct: number;
  originRequests: number;
  originOffloadPct: number;
  shieldHits: number;
  shieldMisses: number;
  successCount: number;
  errorCount: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  regionalCounts: Record<string, number>;
}

export interface ModeledGlobalNetworkRuntimeState {
  resolvers: Record<string, { id: string; name: string; healthy: boolean; cache: Record<string, DnsCacheEntryState> }>;
  stubCaches: Record<string, Record<string, DnsCacheEntryState>>;
  edges: Record<string, CdnEdgeRuntimeState>;
  originShield: {
    enabled: boolean;
    healthy: boolean;
    cacheEntries: Record<string, EdgeCacheEntryState>;
    hitCount: number;
    missCount: number;
  };
  origins: Record<string, OriginRuntimeState>;
  recentDnsTraces: DnsResolutionTrace[];
  recentRequests: RequestLatencyBreakdown[];
  metrics: GlobalNetworkMetrics;
  virtualTimeMs: number;
}
