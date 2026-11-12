import type {
  CdnEdgeConfig,
  ClientRegionConfig,
  DnsRecord,
  GlobalNetworkScenario,
  OriginConfiguration,
  RecursiveResolverConfig,
} from "./global-network-schemas";

export const GLOBAL_NETWORK_PRESET_METADATA = [
  {
    id: "cold_dns_lookup",
    label: "Cold DNS Lookup",
    description: "Empty recursive cache traverses Root -> TLD -> Authoritative nameservers.",
  },
  {
    id: "warm_dns_cache",
    label: "Warm DNS Cache",
    description: "Repeat requests hit the recursive resolver cache within DNS TTL.",
  },
  {
    id: "ttl_expiration",
    label: "DNS TTL Expiration",
    description: "Short DNS TTL expires mid-scenario triggering fresh authoritative lookup.",
  },
  {
    id: "cname_chain",
    label: "CNAME Delegation Chain",
    description: "Canonical alias chain resolves app.example.com -> cdn.example.net -> A record.",
  },
  {
    id: "nxdomain_negative_cache",
    label: "NXDOMAIN Negative Cache",
    description: "Missing domain caches NXDOMAIN up to SOA minimum TTL.",
  },
  {
    id: "dns_resolver_failure",
    label: "DNS Resolver Failure",
    description: "Primary recursive resolver fails while secondary resolver recovers lookup.",
  },
  {
    id: "dns_failover",
    label: "DNS Health Failover",
    description: "Unhealthy primary target shifts authoritative DNS answers to secondary IP.",
  },
  {
    id: "geographic_routing",
    label: "Geographic DNS & Edge Routing",
    description: "US, EU, and APAC clients route to their nearest regional PoPs.",
  },
  {
    id: "weighted_routing",
    label: "Weighted DNS Routing",
    description: "Deterministic weighted DNS answers distribute traffic 80/20 across targets.",
  },
  {
    id: "latency_aware_routing",
    label: "Latency-Aware Routing",
    description: "Clients select lowest-RTT CDN edge; latency spike shifts traffic dynamically.",
  },
  {
    id: "cdn_cache_hit",
    label: "CDN Edge Cache Hit",
    description: "Initial cache miss warms edge PoP; subsequent hits bypass origin completely.",
  },
  {
    id: "cdn_cache_miss",
    label: "CDN Cache Miss & No-Store",
    description: "Cache-Control: private/no-store forces requests directly to origin.",
  },
  {
    id: "cache_revalidation",
    label: "ETag Conditional Revalidation",
    description: "Expired edge entry sends If-None-Match to origin and receives HTTP 304.",
  },
  {
    id: "cache_invalidation",
    label: "CDN Cache Purge Propagation",
    description: "Purge event clears edge entries after propagation delay and refills on miss.",
  },
  {
    id: "cache_stampede",
    label: "Cache Stampede & Coalescing",
    description: "Concurrent burst misses coalesce onto a single origin fetch.",
  },
  {
    id: "origin_shielding",
    label: "Origin Shielding",
    description: "Multiple regional edges share an intermediate shield PoP to cut origin load.",
  },
  {
    id: "edge_outage",
    label: "CDN Edge Outage & Reroute",
    description: "Nearest US-East edge goes down and traffic reroutes to US-West.",
  },
  {
    id: "regional_outage",
    label: "Regional Outage Recovery",
    description: "Entire EU region edges fail mid-flight and recover after outage window.",
  },
  {
    id: "origin_failure",
    label: "Origin Server Outage",
    description: "Origin outage causes 502 Bad Gateway responses on cache misses.",
  },
  {
    id: "origin_failover",
    label: "Origin Primary -> Secondary Failover",
    description: "Primary origin outage fails over cleanly to healthy secondary origin.",
  },
  {
    id: "high_global_traffic",
    label: "High Global Traffic Distribution",
    description: "Multi-region traffic storm exercises global CDN capacity and offload.",
  },
  {
    id: "regional_traffic_burst",
    label: "Regional Traffic Burst",
    description: "Sudden regional spike tests edge capacity saturation and spillover.",
  },
  {
    id: "stale_if_error",
    label: "Stale-If-Error Resilience",
    description: "Expired CDN object serves stale payload during origin failure outage window.",
  },
  {
    id: "anycast_routing",
    label: "Anycast Edge Routing",
    description: "Clients converge on lowest-BGP-cost Anycast PoP across regions.",
  },
] as const;

export type GlobalNetworkPresetId =
  (typeof GLOBAL_NETWORK_PRESET_METADATA)[number]["id"];

function defaultClients(): ClientRegionConfig[] {
  return [
    {
      id: "client-us-east",
      name: "US-East Client",
      region: "us-east",
      resolverId: "res-us",
      stubCacheEnabled: false,
      stubCacheTtlMs: 30000,
    },
    {
      id: "client-eu-west",
      name: "EU-West Client",
      region: "eu-west",
      resolverId: "res-eu",
      stubCacheEnabled: false,
      stubCacheTtlMs: 30000,
    },
    {
      id: "client-ap-south",
      name: "AP-South Client",
      region: "ap-south",
      resolverId: "res-ap",
      stubCacheEnabled: false,
      stubCacheTtlMs: 30000,
    },
  ];
}

function defaultResolvers(): RecursiveResolverConfig[] {
  return [
    {
      id: "res-us",
      name: "US Recursive Resolver",
      region: "us-east",
      cacheEnabled: true,
      baseLatencyMs: 6,
      retryCount: 1,
      timeoutMs: 1500,
      healthy: true,
    },
    {
      id: "res-eu",
      name: "EU Recursive Resolver",
      region: "eu-west",
      cacheEnabled: true,
      baseLatencyMs: 7,
      retryCount: 1,
      timeoutMs: 1500,
      healthy: true,
    },
    {
      id: "res-ap",
      name: "AP Recursive Resolver",
      region: "ap-south",
      cacheEnabled: true,
      baseLatencyMs: 9,
      retryCount: 1,
      timeoutMs: 1500,
      healthy: true,
    },
  ];
}

function defaultEdges(): CdnEdgeConfig[] {
  return [
    {
      id: "edge-us-east",
      name: "Edge IAD (US-East)",
      region: "us-east",
      healthy: true,
      capacityRps: 500,
      processingLatencyMs: 4,
      networkLatencyByClientRegion: {
        "us-east": 12,
        "eu-west": 82,
        "ap-south": 165,
      },
      anycastCostByClientRegion: {
        "us-east": 10,
        "eu-west": 75,
        "ap-south": 140,
      },
      mappedIp: "203.0.113.10",
    },
    {
      id: "edge-us-west",
      name: "Edge SFO (US-West)",
      region: "us-west",
      healthy: true,
      capacityRps: 500,
      processingLatencyMs: 4,
      networkLatencyByClientRegion: {
        "us-east": 58,
        "eu-west": 125,
        "ap-south": 135,
      },
      anycastCostByClientRegion: {
        "us-east": 48,
        "eu-west": 115,
        "ap-south": 120,
      },
      mappedIp: "203.0.113.11",
    },
    {
      id: "edge-eu-west",
      name: "Edge FRA (EU-West)",
      region: "eu-west",
      healthy: true,
      capacityRps: 500,
      processingLatencyMs: 4,
      networkLatencyByClientRegion: {
        "us-east": 84,
        "eu-west": 11,
        "ap-south": 118,
      },
      anycastCostByClientRegion: {
        "us-east": 80,
        "eu-west": 9,
        "ap-south": 110,
      },
      mappedIp: "203.0.113.20",
    },
    {
      id: "edge-ap-south",
      name: "Edge SIN (AP-South)",
      region: "ap-south",
      healthy: true,
      capacityRps: 500,
      processingLatencyMs: 5,
      networkLatencyByClientRegion: {
        "us-east": 168,
        "eu-west": 122,
        "ap-south": 15,
      },
      anycastCostByClientRegion: {
        "us-east": 155,
        "eu-west": 118,
        "ap-south": 12,
      },
      mappedIp: "203.0.113.30",
    },
  ];
}

function defaultOrigins(): OriginConfiguration[] {
  return [
    {
      id: "origin-primary",
      name: "Origin Primary (us-east)",
      region: "us-east",
      role: "primary",
      healthy: true,
      processingLatencyMs: 42,
      networkLatencyFromEdgeMs: 45,
      capacityRps: 500,
      ipAddress: "198.51.100.10",
      resources: {
        "/api/products": {
          status: 200,
          etag: '"prod-v1"',
          lastModified: "2026-11-12T00:00:00Z",
          bodyPreview: '{"items":[{"id":42,"name":"Compute Unit"}]}',
          sizeBytes: 2048,
        },
        "/static/app.js": {
          status: 200,
          etag: '"app-v3"',
          lastModified: "2026-11-12T00:00:00Z",
          bodyPreview: "/* app bundle v3 */",
          sizeBytes: 16384,
        },
      },
    },
    {
      id: "origin-secondary",
      name: "Origin Secondary (eu-west)",
      region: "eu-west",
      role: "secondary",
      healthy: true,
      processingLatencyMs: 48,
      networkLatencyFromEdgeMs: 55,
      capacityRps: 500,
      ipAddress: "198.51.100.20",
      resources: {
        "/api/products": {
          status: 200,
          etag: '"prod-v1"',
          lastModified: "2026-11-12T00:00:00Z",
          bodyPreview: '{"items":[{"id":42,"name":"Compute Unit (DR)"}]}',
          sizeBytes: 2048,
        },
      },
    },
  ];
}

function defaultDnsRecords(): DnsRecord[] {
  return [
    {
      id: "rec-a-us",
      name: "app.example.com",
      type: "A",
      ttlSeconds: 60,
      value: "203.0.113.10",
      region: "us-east",
      healthTargetId: "edge-us-east",
      latencyMs: 12,
    },
    {
      id: "rec-a-eu",
      name: "app.example.com",
      type: "A",
      ttlSeconds: 60,
      value: "203.0.113.20",
      region: "eu-west",
      healthTargetId: "edge-eu-west",
      latencyMs: 11,
    },
    {
      id: "rec-a-ap",
      name: "app.example.com",
      type: "A",
      ttlSeconds: 60,
      value: "203.0.113.30",
      region: "ap-south",
      healthTargetId: "edge-ap-south",
      latencyMs: 15,
    },
  ];
}

function baseScenario(
  presetId: GlobalNetworkPresetId,
  name: string,
  description: string
): GlobalNetworkScenario {
  return {
    version: 1,
    id: `scenario-${presetId}`,
    name,
    description,
    architectureRevisionId: "rev-1",
    presetId,
    clients: defaultClients(),
    dns: {
      resolvers: defaultResolvers(),
      zones: [
        {
          zoneName: "example.com",
          nameservers: ["ns1.example.net", "ns2.example.net"],
          soaMinimumTtlSeconds: 10,
          healthy: true,
          records: defaultDnsRecords(),
        },
      ],
      routingPolicy: "geographic",
      delegationLatencyMs: { rootMs: 12, tldMs: 14, authMs: 18 },
      allowStaleOnError: false,
    },
    cdn: {
      enabled: true,
      routingStrategy: "latency",
      edges: defaultEdges(),
      cachePolicy: {
        cacheControl: "public",
        maxAgeSeconds: 60,
        sMaxAgeSeconds: 60,
        staleWhileRevalidateSeconds: 0,
        staleIfErrorSeconds: 0,
        varyHeaders: [],
        coalesceRequests: true,
        etagSupport: true,
      },
      originShield: {
        enabled: false,
        id: "shield-core",
        region: "us-east",
        processingLatencyMs: 12,
        edgeToShieldLatencyMs: 25,
        healthy: true,
      },
      purgePropagationDelayMs: 300,
    },
    origins: defaultOrigins(),
    requests: [
      {
        id: "req-1",
        atMs: 0,
        clientId: "client-us-east",
        domain: "app.example.com",
        recordType: "A",
        path: "/api/products",
        method: "GET",
        headers: {},
        concurrentBurstCount: 1,
      },
    ],
    faults: [],
    purges: [],
    limits: {
      maxRequests: 500,
      maxEvents: 1500,
      maxVirtualDurationMs: 20000,
    },
  };
}

export function createGlobalNetworkPresetScenario(
  presetId: GlobalNetworkPresetId
): GlobalNetworkScenario {
  const meta =
    GLOBAL_NETWORK_PRESET_METADATA.find((p) => p.id === presetId) ??
    GLOBAL_NETWORK_PRESET_METADATA[0];
  const s = baseScenario(presetId, meta.label, meta.description);

  switch (presetId) {
    case "cold_dns_lookup": {
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "warm_dns_cache": {
      s.clients[0]!.stubCacheEnabled = true;
      s.clients[0]!.stubCacheTtlMs = 20000;
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 500,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/static/app.js",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-3",
          atMs: 1200,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "ttl_expiration": {
      s.dns.zones[0]!.records = [
        {
          id: "rec-short-ttl",
          name: "app.example.com",
          type: "A",
          ttlSeconds: 1,
          value: "203.0.113.10",
          region: "us-east",
          healthTargetId: "edge-us-east",
        },
      ];
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 500,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-3",
          atMs: 1600,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "cname_chain": {
      s.dns.routingPolicy = "simple";
      s.dns.zones[0]!.records = [
        {
          id: "rec-cname-1",
          name: "app.example.com",
          type: "CNAME",
          ttlSeconds: 60,
          value: "edge.cdn.example.net",
        },
      ];
      s.dns.zones.push({
        zoneName: "example.net",
        nameservers: ["ns1.example.net"],
        soaMinimumTtlSeconds: 10,
        healthy: true,
        records: [
          {
            id: "rec-cname-2",
            name: "edge.cdn.example.net",
            type: "CNAME",
            ttlSeconds: 60,
            value: "pop-us.cdn.example.net",
          },
          {
            id: "rec-a-target",
            name: "pop-us.cdn.example.net",
            type: "A",
            ttlSeconds: 60,
            value: "203.0.113.10",
          },
        ],
      });
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/static/app.js",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "nxdomain_negative_cache": {
      s.dns.zones[0]!.soaMinimumTtlSeconds = 5;
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "missing.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 800,
          clientId: "client-us-east",
          domain: "missing.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "dns_resolver_failure": {
      s.dns.resolvers.push({
        id: "res-us-backup",
        name: "US Backup Resolver",
        region: "us-east",
        cacheEnabled: true,
        baseLatencyMs: 14,
        retryCount: 1,
        timeoutMs: 1500,
        healthy: true,
      });
      s.faults = [
        {
          id: "fault-res-down",
          type: "resolver_down",
          targetId: "res-us",
          atMs: 0,
          recoveryAtMs: 2000,
          description: "Primary US recursive resolver fails.",
        },
      ];
      s.requests = [
        {
          id: "req-1",
          atMs: 100,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 2200,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "dns_failover": {
      s.dns.routingPolicy = "health_failover";
      s.cdn.routingStrategy = "dns_directed";
      s.dns.zones[0]!.records = [
        {
          id: "rec-primary",
          name: "app.example.com",
          type: "A",
          ttlSeconds: 1,
          value: "203.0.113.10",
          region: "us-east",
          healthTargetId: "edge-us-east",
        },
        {
          id: "rec-backup",
          name: "app.example.com",
          type: "A",
          ttlSeconds: 1,
          value: "203.0.113.11",
          region: "us-west",
          healthTargetId: "edge-us-west",
        },
      ];
      s.faults = [
        {
          id: "fault-edge-primary",
          type: "edge_outage",
          targetId: "edge-us-east",
          atMs: 900,
          description: "Primary US-East PoP health probe fails.",
        },
      ];
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 2200,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "geographic_routing": {
      s.dns.routingPolicy = "geographic";
      s.cdn.routingStrategy = "geographic";
      s.requests = [
        {
          id: "req-us",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-eu",
          atMs: 300,
          clientId: "client-eu-west",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-ap",
          atMs: 600,
          clientId: "client-ap-south",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "weighted_routing": {
      s.dns.routingPolicy = "weighted";
      s.cdn.routingStrategy = "dns_directed";
      s.dns.zones[0]!.records = [
        {
          id: "rec-w1",
          name: "app.example.com",
          type: "A",
          ttlSeconds: 0,
          value: "203.0.113.10",
          weight: 80,
          healthTargetId: "edge-us-east",
        },
        {
          id: "rec-w2",
          name: "app.example.com",
          type: "A",
          ttlSeconds: 0,
          value: "203.0.113.11",
          weight: 20,
          healthTargetId: "edge-us-west",
        },
      ];
      s.requests = Array.from({ length: 5 }, (_, i) => ({
        id: `req-${i + 1}`,
        atMs: i * 250,
        clientId: "client-us-east",
        domain: "app.example.com",
        recordType: "A" as const,
        path: "/api/products",
        method: "GET" as const,
        headers: {},
        concurrentBurstCount: 1,
      }));
      return s;
    }

    case "latency_aware_routing": {
      s.dns.routingPolicy = "latency";
      s.cdn.routingStrategy = "latency";
      s.faults = [
        {
          id: "fault-lat-spike",
          type: "latency_spike",
          targetId: "edge-us-east",
          atMs: 500,
          addedLatencyMs: 120,
          description: "Network congestion degrades US-East PoP RTT.",
        },
      ];
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 800,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "cdn_cache_hit": {
      s.cdn.cachePolicy.maxAgeSeconds = 120;
      s.cdn.cachePolicy.sMaxAgeSeconds = 120;
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/static/app.js",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 300,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/static/app.js",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-3",
          atMs: 600,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/static/app.js",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "cdn_cache_miss": {
      s.cdn.cachePolicy.cacheControl = "private";
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 400,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "cache_revalidation": {
      s.cdn.cachePolicy.maxAgeSeconds = 1;
      s.cdn.cachePolicy.sMaxAgeSeconds = 1;
      s.cdn.cachePolicy.etagSupport = true;
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 1400,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "cache_invalidation": {
      s.cdn.purgePropagationDelayMs = 250;
      s.purges = [
        {
          id: "purge-1",
          atMs: 400,
          pathPattern: "/api/products",
          mode: "object",
        },
      ];
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 450,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-3",
          atMs: 900,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "cache_stampede": {
      s.cdn.cachePolicy.coalesceRequests = true;
      s.requests = [
        {
          id: "req-burst",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 5,
        },
      ];
      return s;
    }

    case "origin_shielding": {
      s.cdn.originShield.enabled = true;
      s.cdn.originShield.healthy = true;
      s.requests = [
        {
          id: "req-us",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/static/app.js",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-eu",
          atMs: 300,
          clientId: "client-eu-west",
          domain: "app.example.com",
          recordType: "A",
          path: "/static/app.js",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-ap",
          atMs: 600,
          clientId: "client-ap-south",
          domain: "app.example.com",
          recordType: "A",
          path: "/static/app.js",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "edge_outage": {
      s.faults = [
        {
          id: "fault-edge-us-east",
          type: "edge_outage",
          targetId: "edge-us-east",
          atMs: 300,
          recoveryAtMs: 2500,
          description: "US-East CDN edge goes offline.",
        },
      ];
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 600,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-3",
          atMs: 2700,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "regional_outage": {
      s.faults = [
        {
          id: "fault-eu-outage",
          type: "regional_outage",
          targetId: "eu-west",
          atMs: 300,
          recoveryAtMs: 2200,
          description: "EU-West region loses edge capacity.",
        },
      ];
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-eu-west",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 700,
          clientId: "client-eu-west",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-3",
          atMs: 2500,
          clientId: "client-eu-west",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "origin_failure": {
      s.origins = [defaultOrigins()[0]!];
      s.faults = [
        {
          id: "fault-origin-down",
          type: "origin_down",
          targetId: "origin-primary",
          atMs: 200,
          description: "Primary origin crashes with no standby.",
        },
      ];
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 500,
          clientId: "client-eu-west",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "origin_failover": {
      s.faults = [
        {
          id: "fault-origin-primary",
          type: "origin_down",
          targetId: "origin-primary",
          atMs: 200,
          description: "Primary origin fails over to secondary DR origin.",
        },
      ];
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 500,
          clientId: "client-eu-west",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "high_global_traffic": {
      const clientIds = ["client-us-east", "client-eu-west", "client-ap-south"];
      s.requests = Array.from({ length: 18 }, (_, i) => ({
        id: `req-${i + 1}`,
        atMs: i * 150,
        clientId: clientIds[i % clientIds.length]!,
        domain: "app.example.com",
        recordType: "A" as const,
        path: i % 3 === 0 ? "/api/products" : "/static/app.js",
        method: "GET" as const,
        headers: {},
        concurrentBurstCount: 1,
      }));
      return s;
    }

    case "regional_traffic_burst": {
      s.cdn.edges[0]!.capacityRps = 4;
      s.requests = Array.from({ length: 8 }, (_, i) => ({
        id: `req-burst-${i + 1}`,
        atMs: i * 80,
        clientId: "client-us-east",
        domain: "app.example.com",
        recordType: "A" as const,
        path: "/static/app.js",
        method: "GET" as const,
        headers: {},
        concurrentBurstCount: 1,
      }));
      return s;
    }

    case "stale_if_error": {
      s.origins = [defaultOrigins()[0]!];
      s.cdn.cachePolicy.maxAgeSeconds = 1;
      s.cdn.cachePolicy.sMaxAgeSeconds = 1;
      s.cdn.cachePolicy.staleIfErrorSeconds = 60;
      s.faults = [
        {
          id: "fault-origin-outage",
          type: "origin_down",
          targetId: "origin-primary",
          atMs: 900,
          description: "Origin outage triggers stale-if-error protection.",
        },
      ];
      s.requests = [
        {
          id: "req-1",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-2",
          atMs: 1400,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/api/products",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }

    case "anycast_routing": {
      s.cdn.routingStrategy = "anycast";
      s.requests = [
        {
          id: "req-us",
          atMs: 0,
          clientId: "client-us-east",
          domain: "app.example.com",
          recordType: "A",
          path: "/static/app.js",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-eu",
          atMs: 250,
          clientId: "client-eu-west",
          domain: "app.example.com",
          recordType: "A",
          path: "/static/app.js",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
        {
          id: "req-ap",
          atMs: 500,
          clientId: "client-ap-south",
          domain: "app.example.com",
          recordType: "A",
          path: "/static/app.js",
          method: "GET",
          headers: {},
          concurrentBurstCount: 1,
        },
      ];
      return s;
    }
  }
}
