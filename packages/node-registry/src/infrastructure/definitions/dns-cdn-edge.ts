import type { InfrastructureComponentDefinition, InfrastructureCategoryDefinition } from "../types";
import {
  DnsResolverConfigSchema,
  AuthoritativeDnsConfigSchema,
  DnsLoadBalancingConfigSchema,
  CdnConfigSchema,
  EdgeCacheConfigSchema,
  EdgeWorkerConfigSchema,
  EdgeRouterConfigSchema,
  ReverseProxyConfigSchema,
  GlobalTrafficManagerConfigSchema,
  AnycastNetworkConfigSchema,
  type DnsResolverConfig,
  type AuthoritativeDnsConfig,
  type DnsLoadBalancingConfig,
  type CdnConfig,
  type EdgeCacheConfig,
  type EdgeWorkerConfig,
  type EdgeRouterConfig,
  type ReverseProxyConfig,
  type GlobalTrafficManagerConfig,
  type AnycastNetworkConfig,
} from "../schemas/dns-cdn-edge.schema";

export const DNS_CDN_EDGE_CATEGORY_ID = "dns-cdn-edge";

export const dnsCdnEdgeCategoryDefinition: InfrastructureCategoryDefinition = {
  id: DNS_CDN_EDGE_CATEGORY_ID,
  name: "DNS, CDN & Edge",
  description: "Global name resolution, content delivery, edge computing, reverse proxies, and traffic routing.",
  iconSlug: "cdn",
  order: 2,
};

// 01 — DNS Resolver
export const dnsResolverDefinition: InfrastructureComponentDefinition<DnsResolverConfig> = {
  id: "dns-resolver",
  version: 1,
  categoryId: DNS_CDN_EDGE_CATEGORY_ID,
  display: {
    name: "DNS Resolver",
    shortName: "DNS Resolver",
    description: "Recursive or forwarding DNS resolver mapping domain names to IP addresses with local caching.",
    keywords: ["dns", "resolver", "recursive", "cache", "bind", "unbound", "doh", "dot", "name-resolution"],
    iconSlug: "dns-resolver",
  },
  configSchema: DnsResolverConfigSchema,
  defaultConfig: {
    label: "DNS Resolver",
    description: "Recursive DNS caching resolver",
    componentType: "dns-resolver",
    environment: "production",
    tags: ["dns", "network", "resolver"],
    notes: "",
    enabled: true,
    resolverMode: "recursive",
    dnsTransport: "UDP/53",
    cacheEnabled: true,
    cacheTtlMinSeconds: 60,
    cacheTtlMaxSeconds: 86400,
    dnssecValidation: false,
    upstreamResolvers: ["1.1.1.1", "8.8.8.8"],
    queryTimeoutMs: 2000,
    assumedQps: 10000,
  },
  ports: [
    { id: "client-query-in", name: "Client Query In", type: "input", dataType: "DNS_Query", description: "Inbound DNS queries from clients (UDP/TCP 53, DoH 443, DoT 853)" },
    { id: "upstream-query-out", name: "Upstream Query Out", type: "output", dataType: "DNS_Lookup", description: "Outbound queries to Authoritative Nameservers or forwarders" },
    { id: "cache-sync", name: "Cache Sync", type: "bidirectional", dataType: "Cache_Sync", description: "Cache coordination or prefetch replication" },
  ],
  capabilities: ["dns-resolution", "recursive-lookup", "dns-caching", "dnssec-validation"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "config",
      title: "Resolver Engine",
      fields: [
        {
          path: "resolverMode",
          label: "Operation Mode",
          type: "select",
          options: [
            { label: "Recursive Resolver", value: "recursive" },
            { label: "Forwarding Only", value: "forwarding" },
            { label: "Caching-Only Stub", value: "caching-only" },
          ],
        },
        {
          path: "dnsTransport",
          label: "Primary Transport",
          type: "select",
          options: [
            { label: "Standard UDP (Port 53)", value: "UDP/53" },
            { label: "Standard TCP (Port 53)", value: "TCP/53" },
            { label: "DNS over TLS (DoT - Port 853)", value: "DoT-TCP/853" },
            { label: "DNS over HTTPS (DoH - Port 443)", value: "DoH-HTTPS/443" },
          ],
        },
        { path: "cacheEnabled", label: "Cache Enabled", type: "boolean" },
        { path: "dnssecValidation", label: "DNSSEC Validation", type: "boolean" },
        { path: "queryTimeoutMs", label: "Query Timeout", type: "number", min: 100, max: 10000, unit: "ms" },
      ],
    },
    {
      id: "caching",
      title: "Cache TTL Bounds",
      fields: [
        { path: "cacheTtlMinSeconds", label: "Min Cache TTL", type: "number", min: 0, max: 86400, unit: "seconds" },
        { path: "cacheTtlMaxSeconds", label: "Max Cache TTL", type: "number", min: 60, max: 604800, unit: "seconds" },
      ],
    },
    {
      id: "assumptions",
      title: "Capacity Assumptions",
      fields: [
        { path: "assumedQps", label: "Assumed Query Load", type: "number", min: 1, max: 1000000, unit: "qps" },
      ],
    },
  ],
};

// 02 — Authoritative DNS
export const authoritativeDnsDefinition: InfrastructureComponentDefinition<AuthoritativeDnsConfig> = {
  id: "authoritative-dns",
  version: 1,
  categoryId: DNS_CDN_EDGE_CATEGORY_ID,
  display: {
    name: "Authoritative DNS",
    shortName: "Authoritative DNS",
    description: "Authoritative nameserver hosting primary zone records (A, AAAA, CNAME, MX, TXT) and answering recursive resolvers.",
    keywords: ["dns", "authoritative", "zone", "records", "ns", "dnssec", "bind", "route53", "cloudflare-dns"],
    iconSlug: "authoritative-dns",
  },
  configSchema: AuthoritativeDnsConfigSchema,
  defaultConfig: {
    label: "Authoritative DNS",
    description: "Primary authoritative DNS zone server",
    componentType: "authoritative-dns",
    environment: "production",
    tags: ["dns", "authoritative", "records"],
    notes: "",
    enabled: true,
    zoneName: "example.internal",
    zoneType: "primary",
    recordFamilies: ["A", "AAAA", "CNAME", "NS", "TXT"],
    defaultTtlSeconds: 300,
    dnssecSigning: false,
    zoneTransferAllowed: false,
    queryCapacityRps: 50000,
  },
  ports: [
    { id: "resolver-query-in", name: "Resolver Query In", type: "input", dataType: "DNS_Query", description: "Inbound DNS queries from recursive resolvers" },
    { id: "zone-transfer-out", name: "Zone Transfer Out", type: "output", dataType: "AXFR_IXFR", description: "AXFR/IXFR secondary zone transfer egress" },
    { id: "control-api", name: "Control API", type: "bidirectional", dataType: "REST_API", description: "DNS management and record update API" },
  ],
  capabilities: ["authoritative-records", "dnssec-signing", "zone-transfer", "split-horizon"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "zone-config",
      title: "Zone Configuration",
      fields: [
        { path: "zoneName", label: "Apex Zone Domain", type: "text", placeholder: "example.com" },
        {
          path: "zoneType",
          label: "Zone Authority Type",
          type: "select",
          options: [
            { label: "Primary Master Zone", value: "primary" },
            { label: "Secondary Slave Zone", value: "secondary" },
            { label: "Split-Horizon Private Zone", value: "split-horizon-private" },
          ],
        },
        { path: "defaultTtlSeconds", label: "Default Record TTL", type: "number", min: 1, max: 86400, unit: "seconds" },
      ],
    },
    {
      id: "security",
      title: "Security & Replication",
      fields: [
        { path: "dnssecSigning", label: "DNSSEC Zone Signing", type: "boolean" },
        { path: "zoneTransferAllowed", label: "Allow AXFR/IXFR Transfer", type: "boolean" },
      ],
    },
    {
      id: "assumptions",
      title: "Capacity Assumptions",
      fields: [
        { path: "queryCapacityRps", label: "Query Capacity", type: "number", min: 100, max: 10000000, unit: "rps" },
      ],
    },
  ],
};

// 03 — DNS Load Balancing
export const dnsLoadBalancingDefinition: InfrastructureComponentDefinition<DnsLoadBalancingConfig> = {
  id: "dns-load-balancing",
  version: 1,
  categoryId: DNS_CDN_EDGE_CATEGORY_ID,
  display: {
    name: "DNS Load Balancing",
    shortName: "DNS Load Balancing",
    description: "Dynamic DNS-based traffic steering using latency, geolocation, weights, and health probes to distribute traffic across origins.",
    keywords: ["gslb", "dns-load-balancer", "traffic-routing", "geolocation", "failover", "health-check", "multi-region"],
    iconSlug: "dns-load-balancing",
  },
  configSchema: DnsLoadBalancingConfigSchema,
  defaultConfig: {
    label: "DNS Load Balancing",
    description: "Geo and latency-aware DNS traffic distribution",
    componentType: "dns-load-balancing",
    environment: "production",
    tags: ["dns", "load-balancer", "gslb", "routing"],
    notes: "",
    enabled: true,
    routingPolicy: "weighted",
    healthCheckEnabled: true,
    healthCheckIntervalSeconds: 30,
    ttlSeconds: 60,
    failoverThresholdPercent: 50,
    geographicRegions: ["na-east", "eu-west", "ap-southeast"],
    destinationPoolCount: 3,
  },
  ports: [
    { id: "dns-query-in", name: "DNS Query In", type: "input", dataType: "DNS_Query", description: "Inbound resolver lookups" },
    { id: "health-probe-out", name: "Health Probe Out", type: "output", dataType: "Synthetic_Probe", description: "Active health checks to origin pools" },
    { id: "routed-target-out", name: "Routed Target Out", type: "output", dataType: "Resolved_IP", description: "Logical routed endpoint answer targets" },
  ],
  capabilities: ["weighted-routing", "geo-steering", "health-checking", "automated-failover"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "policy",
      title: "Steering Policy",
      fields: [
        {
          path: "routingPolicy",
          label: "Routing Policy",
          type: "select",
          options: [
            { label: "Weighted Round Robin", value: "weighted" },
            { label: "Geolocation Proximity", value: "geolocation" },
            { label: "Latency-Based Routing", value: "latency-based" },
            { label: "Multivalue Answer", value: "multivalue-answer" },
            { label: "Active-Passive Failover", value: "active-passive-failover" },
          ],
        },
        { path: "ttlSeconds", label: "Answer TTL", type: "number", min: 5, max: 3600, unit: "seconds" },
        { path: "destinationPoolCount", label: "Target Origin Pools", type: "number", min: 1, max: 32 },
      ],
    },
    {
      id: "health-checks",
      title: "Origin Health Probing",
      fields: [
        { path: "healthCheckEnabled", label: "Active Health Checks", type: "boolean" },
        { path: "healthCheckIntervalSeconds", label: "Check Interval", type: "number", min: 5, max: 300, unit: "seconds" },
        { path: "failoverThresholdPercent", label: "Failover Unhealthy Threshold", type: "number", min: 1, max: 100, unit: "%" },
      ],
    },
  ],
};

// 04 — Content Delivery Network
export const cdnDefinition: InfrastructureComponentDefinition<CdnConfig> = {
  id: "cdn",
  version: 1,
  categoryId: DNS_CDN_EDGE_CATEGORY_ID,
  display: {
    name: "Content Delivery Network",
    shortName: "CDN",
    description: "Globally distributed edge network caching static assets, terminating TLS, and accelerating content delivery to end users.",
    keywords: ["cdn", "edge", "caching", "tls", "akamai", "cloudflare", "fastly", "cloudfront", "acceleration"],
    iconSlug: "cdn",
  },
  configSchema: CdnConfigSchema,
  defaultConfig: {
    label: "Content Delivery Network",
    description: "Global edge CDN distribution",
    componentType: "cdn",
    environment: "production",
    tags: ["cdn", "edge", "cache", "tls"],
    notes: "",
    enabled: true,
    cachePolicy: "respect-origin-headers",
    defaultTtlSeconds: 86400,
    tlsTermination: true,
    minTlsVersion: "TLS-1.3",
    compressionEnabled: true,
    compressionAlgorithms: ["brotli", "gzip"],
    originShieldEnabled: true,
    globalPoPCount: 120,
  },
  ports: [
    { id: "client-edge-ingress", name: "Client Edge Ingress", type: "input", dataType: "HTTPS_Request", description: "Client HTTPS/HTTP3 ingress at edge Points of Presence" },
    { id: "origin-fetch-out", name: "Origin Fetch Out", type: "output", dataType: "Origin_Fetch", description: "Origin fetch egress to backend servers or storage" },
    { id: "purge-api-in", name: "Purge API In", type: "input", dataType: "Cache_Purge", description: "Edge cache invalidation API endpoint" },
  ],
  capabilities: ["global-caching", "tls-termination", "brotli-compression", "origin-shield", "ddos-protection"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "cache-rules",
      title: "Edge Cache Policy",
      fields: [
        {
          path: "cachePolicy",
          label: "Cache Strategy",
          type: "select",
          options: [
            { label: "Respect Origin Headers", value: "respect-origin-headers" },
            { label: "Cache Everything Static & HTML", value: "cache-everything" },
            { label: "Bypass Dynamic Only", value: "bypass-dynamic-only" },
            { label: "Aggressive Static Override", value: "aggressive-static" },
          ],
        },
        { path: "defaultTtlSeconds", label: "Default Edge TTL", type: "number", min: 0, max: 31536000, unit: "seconds" },
        { path: "originShieldEnabled", label: "Origin Shield Mid-Tier", type: "boolean" },
      ],
    },
    {
      id: "security-tls",
      title: "Security & Optimization",
      fields: [
        { path: "tlsTermination", label: "Terminate TLS at Edge", type: "boolean" },
        {
          path: "minTlsVersion",
          label: "Minimum TLS Version",
          type: "select",
          options: [
            { label: "TLS 1.3 (Modern)", value: "TLS-1.3" },
            { label: "TLS 1.2 (Legacy Compatible)", value: "TLS-1.2" },
          ],
        },
        { path: "compressionEnabled", label: "Compression (Brotli/Gzip)", type: "boolean" },
        { path: "globalPoPCount", label: "Global Edge PoPs", type: "number", min: 1, max: 500, unit: "PoPs" },
      ],
    },
  ],
};

// 05 — Edge Cache
export const edgeCacheDefinition: InfrastructureComponentDefinition<EdgeCacheConfig> = {
  id: "edge-cache",
  version: 1,
  categoryId: DNS_CDN_EDGE_CATEGORY_ID,
  display: {
    name: "Edge Cache",
    shortName: "Edge Cache",
    description: "Dedicated high-performance edge storage tier for caching HTML responses, API payloads, and media slices close to users.",
    keywords: ["cache", "edge-cache", "lru", "nvme", "purge", "stale-while-revalidate", "redis", "varnish"],
    iconSlug: "edge-cache",
  },
  configSchema: EdgeCacheConfigSchema,
  defaultConfig: {
    label: "Edge Cache",
    description: "High-speed edge response and media cache",
    componentType: "edge-cache",
    environment: "production",
    tags: ["cache", "edge", "storage", "fast-path"],
    notes: "",
    enabled: true,
    storageTier: "nvme-tiered",
    capacityGb: 512,
    evictionPolicy: "lru",
    staleWhileRevalidateSeconds: 300,
    staleIfErrorSeconds: 1800,
    queryParamInCacheKey: true,
    purgeMethods: ["tag-based", "url-exact"],
  },
  ports: [
    { id: "cache-lookup-in", name: "Lookup In", type: "input", dataType: "Cache_Key", description: "Inbound request cache key lookup" },
    { id: "cache-hit-out", name: "Hit Out", type: "output", dataType: "Cached_Response", description: "Cache hit fast-path response egress" },
    { id: "origin-miss-out", name: "Miss Out", type: "output", dataType: "Origin_Fetch", description: "Cache miss upstream origin fetch egress" },
  ],
  capabilities: ["nvme-storage", "lru-eviction", "stale-while-revalidate", "tag-purging"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "storage",
      title: "Storage & Eviction",
      fields: [
        {
          path: "storageTier",
          label: "Cache Storage Media",
          type: "select",
          options: [
            { label: "NVMe Tiered Storage", value: "nvme-tiered" },
            { label: "RAM / Memory Only", value: "memory-only" },
            { label: "Distributed Edge DRAM Mesh", value: "distributed-dram" },
          ],
        },
        { path: "capacityGb", label: "Allocated Capacity", type: "number", min: 1, max: 100000, unit: "GB" },
        {
          path: "evictionPolicy",
          label: "Eviction Policy",
          type: "select",
          options: [
            { label: "LRU (Least Recently Used)", value: "lru" },
            { label: "LFU (Least Frequently Used)", value: "lfu" },
            { label: "FIFO (First In First Out)", value: "fifo" },
            { label: "SLRU (Segmented LRU)", value: "slru" },
          ],
        },
      ],
    },
    {
      id: "revalidation",
      title: "Stale & Key Behavior",
      fields: [
        { path: "staleWhileRevalidateSeconds", label: "Stale-While-Revalidate", type: "number", min: 0, max: 86400, unit: "seconds" },
        { path: "staleIfErrorSeconds", label: "Stale-If-Error Window", type: "number", min: 0, max: 86400, unit: "seconds" },
        { path: "queryParamInCacheKey", label: "Include URL Query in Key", type: "boolean" },
      ],
    },
  ],
};

// 06 — Edge Worker
export const edgeWorkerDefinition: InfrastructureComponentDefinition<EdgeWorkerConfig> = {
  id: "edge-worker",
  version: 1,
  categoryId: DNS_CDN_EDGE_CATEGORY_ID,
  display: {
    name: "Edge Worker",
    shortName: "Edge Worker",
    description: "Serverless JavaScript/WASM execution runtime at edge PoPs for request transformation, auth verification, and personalization.",
    keywords: ["worker", "edge-compute", "serverless", "v8-isolate", "wasm", "cloudflare-workers", "fastly-compute", "lambda-edge"],
    iconSlug: "edge-worker",
  },
  configSchema: EdgeWorkerConfigSchema,
  defaultConfig: {
    label: "Edge Worker",
    description: "Lightweight edge isolate compute engine",
    componentType: "edge-worker",
    environment: "production",
    tags: ["serverless", "worker", "edge", "v8"],
    notes: "",
    enabled: true,
    runtimeModel: "v8-isolate",
    triggerType: "http-request",
    executionTimeoutMs: 50,
    memoryLimitMb: 128,
    kvBindingEnabled: true,
    subrequestLimit: 50,
    concurrencyPerPoP: 1000,
  },
  ports: [
    { id: "edge-request-in", name: "Edge Request In", type: "input", dataType: "HTTP_Event", description: "Edge HTTP request or scheduled event trigger" },
    { id: "origin-forward-out", name: "Origin Forward Out", type: "output", dataType: "Subrequest", description: "Transformed request dispatch to origin or microservices" },
    { id: "kv-storage-conn", name: "KV / DB Conn", type: "bidirectional", dataType: "KV_Query", description: "Edge KV or durable state database binding" },
  ],
  capabilities: ["v8-isolate-runtime", "zero-cold-start", "request-rewrite", "edge-kv"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "runtime",
      title: "Isolate Runtime",
      fields: [
        {
          path: "runtimeModel",
          label: "Runtime Engine",
          type: "select",
          options: [
            { label: "V8 Isolate (JS/TS)", value: "v8-isolate" },
            { label: "WebAssembly (WASM)", value: "wasm" },
            { label: "Micro-VM (Firecracker)", value: "micro-vm" },
          ],
        },
        {
          path: "triggerType",
          label: "Trigger Event",
          type: "select",
          options: [
            { label: "Inbound HTTP Request", value: "http-request" },
            { label: "Scheduled Cron Trigger", value: "scheduled-cron" },
            { label: "Queue Message Consumer", value: "queue-consumer" },
            { label: "WebSocket Session", value: "websocket" },
          ],
        },
        { path: "executionTimeoutMs", label: "CPU Timeout", type: "number", min: 5, max: 30000, unit: "ms" },
        { path: "memoryLimitMb", label: "Memory Limit", type: "number", min: 16, max: 1024, unit: "MB" },
      ],
    },
    {
      id: "bindings",
      title: "Bindings & Limits",
      fields: [
        { path: "kvBindingEnabled", label: "Edge KV Store Binding", type: "boolean" },
        { path: "subrequestLimit", label: "Max Subrequests per Invocation", type: "number", min: 1, max: 500 },
        { path: "concurrencyPerPoP", label: "Concurrency per PoP", type: "number", min: 10, max: 100000 },
      ],
    },
  ],
};

// 07 — Edge Router
export const edgeRouterDefinition: InfrastructureComponentDefinition<EdgeRouterConfig> = {
  id: "edge-router",
  version: 1,
  categoryId: DNS_CDN_EDGE_CATEGORY_ID,
  display: {
    name: "Edge Router",
    shortName: "Edge Router",
    description: "Edge-layer protocol and path-based router directing incoming traffic across origins, microservices, and static buckets.",
    keywords: ["router", "edge-router", "path-routing", "ingress", "gateway", "http2", "http3", "dispatch"],
    iconSlug: "edge-router",
  },
  configSchema: EdgeRouterConfigSchema,
  defaultConfig: {
    label: "Edge Router",
    description: "Edge path and header traffic router",
    componentType: "edge-router",
    environment: "production",
    tags: ["routing", "edge", "dispatch", "ingress"],
    notes: "",
    enabled: true,
    routingStrategy: "path-prefix",
    supportedProtocols: ["HTTP/2", "HTTP/3", "WebSocket"],
    maxHeaderSizeKb: 16,
    routeCount: 8,
    healthCheckPath: "/healthz",
    failoverPolicy: "automatic-next-upstream",
  },
  ports: [
    { id: "edge-traffic-in", name: "Edge Traffic In", type: "input", dataType: "HTTP_Ingress", description: "External ingress traffic from Internet clients" },
    { id: "routed-egress-out", name: "Routed Egress Out", type: "output", dataType: "Upstream_Forward", description: "Matched route egress to targeted service" },
    { id: "fallback-out", name: "Fallback Out", type: "output", dataType: "Fallback_Route", description: "Fallback route for unhandled or failing routes" },
  ],
  capabilities: ["path-routing", "header-inspection", "protocol-negotiation", "circuit-breaking"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "routing",
      title: "Routing Logic",
      fields: [
        {
          path: "routingStrategy",
          label: "Route Match Strategy",
          type: "select",
          options: [
            { label: "Path Prefix Matching", value: "path-prefix" },
            { label: "Host Header Matching", value: "host-header" },
            { label: "HTTP Method Dispatch", value: "http-method" },
            { label: "Query Parameter Filter", value: "query-parameter" },
            { label: "Weighted Canary Split", value: "weighted-split" },
          ],
        },
        { path: "routeCount", label: "Active Routes", type: "number", min: 1, max: 256 },
        { path: "maxHeaderSizeKb", label: "Max Header Buffer", type: "number", min: 4, max: 64, unit: "KB" },
      ],
    },
    {
      id: "resilience",
      title: "Resilience & Health",
      fields: [
        { path: "healthCheckPath", label: "Upstream Probe Path", type: "text", placeholder: "/healthz" },
        {
          path: "failoverPolicy",
          label: "Failover Policy",
          type: "select",
          options: [
            { label: "Automatic Next Upstream", value: "automatic-next-upstream" },
            { label: "Circuit Breaker Fast Fail", value: "circuit-breaker" },
            { label: "Serve Fallback Static Page", value: "fallback-static-page" },
          ],
        },
      ],
    },
  ],
};

// 08 — Reverse Proxy
export const reverseProxyDefinition: InfrastructureComponentDefinition<ReverseProxyConfig> = {
  id: "reverse-proxy",
  version: 1,
  categoryId: DNS_CDN_EDGE_CATEGORY_ID,
  display: {
    name: "Reverse Proxy",
    shortName: "Reverse Proxy",
    description: "Intermediate proxy sitting in front of web servers to handle TLS termination, request buffering, compression, and load balancing.",
    keywords: ["reverse-proxy", "nginx", "envoy", "caddy", "haproxy", "tls-termination", "buffer", "upstream"],
    iconSlug: "reverse-proxy",
  },
  configSchema: ReverseProxyConfigSchema,
  defaultConfig: {
    label: "Reverse Proxy",
    description: "Front-end reverse proxy and SSL terminator",
    componentType: "reverse-proxy",
    environment: "production",
    tags: ["proxy", "reverse-proxy", "nginx", "tls"],
    notes: "",
    enabled: true,
    proxyMode: "layer7-http",
    tlsTermination: true,
    upstreamProtocol: "HTTP/1.1",
    keepAliveTimeoutSeconds: 65,
    maxConnectionsPerUpstream: 1024,
    forwardHeaders: ["X-Forwarded-For", "X-Forwarded-Proto", "X-Real-IP"],
    rateLimitEnabled: false,
    clientMaxBodySizeMb: 16,
  },
  ports: [
    { id: "client-ingress-in", name: "Client Ingress In", type: "input", dataType: "TCP_HTTP_Traffic", description: "Inbound public HTTP/TCP traffic" },
    { id: "upstream-egress-out", name: "Upstream Egress Out", type: "output", dataType: "Proxied_Request", description: "Forwarded requests to backend upstream pool" },
    { id: "health-monitor-out", name: "Health Monitor Out", type: "output", dataType: "Health_Probe", description: "Upstream server health check probes" },
  ],
  capabilities: ["tls-termination", "http-buffering", "header-rewriting", "keepalive-pooling"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "proxy-mode",
      title: "Proxy Operation",
      fields: [
        {
          path: "proxyMode",
          label: "Proxy Layer",
          type: "select",
          options: [
            { label: "Layer 7 HTTP / HTTPS", value: "layer7-http" },
            { label: "Layer 4 TCP / TLS Stream", value: "layer4-tcp-stream" },
            { label: "Transparent Proxy", value: "transparent" },
          ],
        },
        { path: "tlsTermination", label: "SSL / TLS Termination", type: "boolean" },
        {
          path: "upstreamProtocol",
          label: "Upstream Protocol",
          type: "select",
          options: [
            { label: "HTTP/1.1 Keep-Alive", value: "HTTP/1.1" },
            { label: "HTTP/2 Multiplexed", value: "HTTP/2" },
            { label: "gRPC", value: "gRPC" },
            { label: "FastCGI (PHP-FPM)", value: "FastCGI" },
          ],
        },
      ],
    },
    {
      id: "buffering-limits",
      title: "Limits & Headers",
      fields: [
        { path: "keepAliveTimeoutSeconds", label: "Keep-Alive Timeout", type: "number", min: 5, max: 300, unit: "seconds" },
        { path: "maxConnectionsPerUpstream", label: "Max Conn per Upstream", type: "number", min: 10, max: 10000 },
        { path: "clientMaxBodySizeMb", label: "Max Request Body Size", type: "number", min: 1, max: 1024, unit: "MB" },
        { path: "rateLimitEnabled", label: "Rate Limiting Enabled", type: "boolean" },
      ],
    },
  ],
};

// 09 — Global Traffic Manager
export const globalTrafficManagerDefinition: InfrastructureComponentDefinition<GlobalTrafficManagerConfig> = {
  id: "global-traffic-manager",
  version: 1,
  categoryId: DNS_CDN_EDGE_CATEGORY_ID,
  display: {
    name: "Global Traffic Manager",
    shortName: "Traffic Manager",
    description: "Multi-cloud and multi-datacenter traffic orchestrator performing real-time global steering, disaster recovery, and latency optimization.",
    keywords: ["gtm", "traffic-manager", "global-routing", "multi-cloud", "disaster-recovery", "active-active", "latency"],
    iconSlug: "global-traffic-manager",
  },
  configSchema: GlobalTrafficManagerConfigSchema,
  defaultConfig: {
    label: "Global Traffic Manager",
    description: "Global multi-cloud traffic controller",
    componentType: "global-traffic-manager",
    environment: "production",
    tags: ["traffic-manager", "global", "multi-cloud", "orchestration"],
    notes: "",
    enabled: true,
    steeringPolicy: "performance-lowest-latency",
    managedRegions: ["us-east", "us-west", "eu-central", "ap-northeast"],
    telemetrySampleRateSeconds: 15,
    failoverDwellTimeSeconds: 60,
    minimumHealthyOriginPercent: 30,
    activePoolsCount: 4,
  },
  ports: [
    { id: "telemetry-ingress-in", name: "Telemetry In", type: "input", dataType: "Region_Telemetry", description: "Regional health and latency telemetry feeds" },
    { id: "steering-directive-out", name: "Steering Directive Out", type: "output", dataType: "Routing_Control", description: "Real-time routing directives to Edge Routers & DNS" },
    { id: "audit-events-out", name: "Audit Events Out", type: "output", dataType: "Failover_Event", description: "Failover and incident event notifications" },
  ],
  capabilities: ["realtime-steering", "disaster-failover", "latency-optimization", "pool-health-aggregation"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "steering",
      title: "Global Steering",
      fields: [
        {
          path: "steeringPolicy",
          label: "Steering Policy",
          type: "select",
          options: [
            { label: "Performance (Lowest Real-User Latency)", value: "performance-lowest-latency" },
            { label: "Geo-Proximity (Closest Datacenter)", value: "geo-proximity" },
            { label: "Weighted Multi-Cloud Round Robin", value: "weighted-round-robin" },
            { label: "Strict Failover Priority", value: "failover-priority" },
          ],
        },
        { path: "activePoolsCount", label: "Managed Origin Pools", type: "number", min: 1, max: 16 },
      ],
    },
    {
      id: "health-failover",
      title: "Failover Dynamics",
      fields: [
        { path: "telemetrySampleRateSeconds", label: "Telemetry Sample Interval", type: "number", min: 5, max: 300, unit: "seconds" },
        { path: "failoverDwellTimeSeconds", label: "Failover Dwell Time", type: "number", min: 10, max: 600, unit: "seconds" },
        { path: "minimumHealthyOriginPercent", label: "Minimum Healthy Quorum", type: "number", min: 10, max: 100, unit: "%" },
      ],
    },
  ],
};

// 10 — Anycast Network
export const anycastNetworkDefinition: InfrastructureComponentDefinition<AnycastNetworkConfig> = {
  id: "anycast-network",
  version: 1,
  categoryId: DNS_CDN_EDGE_CATEGORY_ID,
  display: {
    name: "Anycast Network",
    shortName: "Anycast Network",
    description: "BGP Anycast routing mesh broadcasting a single IP prefix from multiple global PoPs to route visitors to the topologically nearest edge.",
    keywords: ["anycast", "bgp", "asn", "prefix", "routing", "ddos-absorb", "tier1", "peering"],
    iconSlug: "anycast-network",
  },
  configSchema: AnycastNetworkConfigSchema,
  defaultConfig: {
    label: "Anycast Network",
    description: "Global BGP Anycast IP announcement mesh",
    componentType: "anycast-network",
    environment: "production",
    tags: ["anycast", "bgp", "network", "mesh", "transit"],
    notes: "",
    enabled: true,
    asnNumber: 13335,
    routingProtocol: "BGP-4",
    ipVersion: "IPv4-IPv6-DualStack",
    announcedPrefix: "198.51.100.0/24",
    activePoPsCount: 84,
    ddosMitigationEnabled: true,
    bgpCommunityTag: "standard-global",
  },
  ports: [
    { id: "internet-transit-in", name: "Transit In", type: "input", dataType: "BGP_Transit", description: "Upstream transit / IX peering ingress" },
    { id: "pop-dispatch-out", name: "PoP Dispatch Out", type: "output", dataType: "Edge_Handoff", description: "Topologically nearest Edge PoP handoff" },
    { id: "bgp-peer-conn", name: "BGP Peer", type: "bidirectional", dataType: "BGP_Session", description: "BGP neighbor peer session" },
  ],
  capabilities: ["bgp-anycast", "ddos-absorption", "topology-routing", "dual-stack-ip"],
  node: { variant: "standard", minWidth: 200, minHeight: 84 },
  inspector: [
    {
      id: "bgp-config",
      title: "BGP Routing Configuration",
      fields: [
        { path: "asnNumber", label: "Autonomous System Number (ASN)", type: "number", min: 1, max: 4294967295 },
        { path: "announcedPrefix", label: "Announced IP Prefix CIDR", type: "text", placeholder: "198.51.100.0/24" },
        {
          path: "routingProtocol",
          label: "Routing Protocol",
          type: "select",
          options: [
            { label: "BGP-4 (Border Gateway Protocol)", value: "BGP-4" },
            { label: "eBGP Multi-Hop", value: "eBGP-MultiHop" },
            { label: "Internal Static Peer", value: "Internal-Static" },
          ],
        },
        {
          path: "ipVersion",
          label: "IP Addressing Stack",
          type: "select",
          options: [
            { label: "IPv4 / IPv6 Dual Stack", value: "IPv4-IPv6-DualStack" },
            { label: "IPv4 Only", value: "IPv4-Only" },
            { label: "IPv6 Only", value: "IPv6-Only" },
          ],
        },
      ],
    },
    {
      id: "network-mesh",
      title: "Mesh Topology & Protection",
      fields: [
        { path: "activePoPsCount", label: "Broadcasting PoPs Count", type: "number", min: 2, max: 350, unit: "PoPs" },
        { path: "ddosMitigationEnabled", label: "Volumetric DDoS Mitigation", type: "boolean" },
        { path: "bgpCommunityTag", label: "BGP Community String", type: "text", placeholder: "standard-global" },
      ],
    },
  ],
};

export const ALL_DNS_CDN_EDGE_DEFINITIONS: readonly InfrastructureComponentDefinition[] = [
  dnsResolverDefinition,
  authoritativeDnsDefinition,
  dnsLoadBalancingDefinition,
  cdnDefinition,
  edgeCacheDefinition,
  edgeWorkerDefinition,
  edgeRouterDefinition,
  reverseProxyDefinition,
  globalTrafficManagerDefinition,
  anycastNetworkDefinition,
] as const;
