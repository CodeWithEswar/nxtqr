/**
 * NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
 * Provider Capability Registry
 */

import type {
  CacheProviderTechnology,
  CacheProviderCapabilities,
  CacheEvidenceSource,
  CacheLayer,
} from "../contracts/cache-state.types";

export class CacheCapabilityRegistry {
  private readonly capabilities = new Map<CacheProviderTechnology, CacheProviderCapabilities>();

  constructor() {
    this.registerDefaults();
  }

  public getCapabilities(
    technology: CacheProviderTechnology,
    evidenceSource: CacheEvidenceSource = "modeled"
  ): CacheProviderCapabilities {
    const base = this.capabilities.get(technology) || this.getDefaultCustomCapabilities();
    return {
      ...base,
      provenance: {
        source: evidenceSource,
        sourceIdentifier: `registry:${technology}`,
        timestamp: new Date().toISOString(),
        graphRevision: "rev-default",
        confirmed: evidenceSource !== "unknown",
      },
    };
  }

  public resolveCapabilities(layer: CacheLayer): CacheProviderCapabilities {
    return this.getCapabilities(layer.technology, layer.provenance?.source || "modeled");
  }

  public registerCustomCapabilities(
    technology: CacheProviderTechnology,
    capabilities: CacheProviderCapabilities
  ): void {
    this.capabilities.set(technology, capabilities);
  }

  private registerDefaults(): void {
    const now = new Date().toISOString();
    const defaultProv = {
      source: "configured" as const,
      timestamp: now,
      graphRevision: "rev-capabilities-v1",
      confirmed: true,
    };

    // 1. Redis
    this.capabilities.set("redis", {
      supportsEvictionConfiguration: true,
      supportedEvictionPolicies: ["lru", "lfu", "random", "ttl_only", "no_eviction"],
      supportsSlidingTTL: true,
      supportsBackgroundRefresh: true,
      supportsAtomicCompareAndSwap: true,
      supportsDistributedLocking: true,
      supportsPubSubInvalidation: true,
      supportsKeyPatternPurge: true,
      supportsReplication: true,
      supportsMultiRegionActiveActive: false, // Standard Redis is primary-replica; active-active requires CRDT Redis Enterprise
      maxKeySizeBytes: 536870912, // 512 MB
      maxValueSizeBytes: 536870912, // 512 MB
      provenance: defaultProv,
    });

    // 2. Valkey
    this.capabilities.set("valkey", {
      supportsEvictionConfiguration: true,
      supportedEvictionPolicies: ["lru", "lfu", "random", "ttl_only", "no_eviction"],
      supportsSlidingTTL: true,
      supportsBackgroundRefresh: true,
      supportsAtomicCompareAndSwap: true,
      supportsDistributedLocking: true,
      supportsPubSubInvalidation: true,
      supportsKeyPatternPurge: true,
      supportsReplication: true,
      supportsMultiRegionActiveActive: false,
      maxKeySizeBytes: 536870912,
      maxValueSizeBytes: 536870912,
      provenance: defaultProv,
    });

    // 3. Memcached
    this.capabilities.set("memcached", {
      supportsEvictionConfiguration: true,
      supportedEvictionPolicies: ["lru"],
      supportsSlidingTTL: false,
      supportsBackgroundRefresh: false,
      supportsAtomicCompareAndSwap: true, // CAS command supported
      supportsDistributedLocking: false,
      supportsPubSubInvalidation: false,
      supportsKeyPatternPurge: false,
      supportsReplication: false, // Memcached has no native cross-node replication
      supportsMultiRegionActiveActive: false,
      maxKeySizeBytes: 250, // 250 bytes
      maxValueSizeBytes: 1048576, // 1 MB default slab limit
      provenance: defaultProv,
    });

    // 4. Cloudflare KV
    this.capabilities.set("cloudflare_kv", {
      supportsEvictionConfiguration: false,
      supportedEvictionPolicies: ["ttl_only"],
      supportsSlidingTTL: false,
      supportsBackgroundRefresh: true,
      supportsAtomicCompareAndSwap: false,
      supportsDistributedLocking: false,
      supportsPubSubInvalidation: false,
      supportsKeyPatternPurge: false,
      supportsReplication: true,
      supportsMultiRegionActiveActive: true, // Globally distributed eventual consistency
      maxKeySizeBytes: 512,
      maxValueSizeBytes: 26214400, // 25 MB
      provenance: defaultProv,
    });

    // 5. Cloudflare Cache (CDN Edge)
    this.capabilities.set("cloudflare_cache", {
      supportsEvictionConfiguration: false,
      supportedEvictionPolicies: ["lru", "ttl_only"],
      supportsSlidingTTL: false,
      supportsBackgroundRefresh: true, // stale-while-revalidate
      supportsAtomicCompareAndSwap: false,
      supportsDistributedLocking: false,
      supportsPubSubInvalidation: false,
      supportsKeyPatternPurge: true, // Cache-Tags / Surrogate Keys
      supportsReplication: true,
      supportsMultiRegionActiveActive: true,
      maxKeySizeBytes: 2048,
      maxValueSizeBytes: 536870912,
      provenance: defaultProv,
    });

    // 6. AWS ElastiCache
    this.capabilities.set("aws_elasticache", {
      supportsEvictionConfiguration: true,
      supportedEvictionPolicies: ["lru", "lfu", "random", "ttl_only", "no_eviction"],
      supportsSlidingTTL: true,
      supportsBackgroundRefresh: true,
      supportsAtomicCompareAndSwap: true,
      supportsDistributedLocking: true,
      supportsPubSubInvalidation: true,
      supportsKeyPatternPurge: true,
      supportsReplication: true,
      supportsMultiRegionActiveActive: true, // Global Datastore
      maxKeySizeBytes: 536870912,
      maxValueSizeBytes: 536870912,
      provenance: defaultProv,
    });

    // 7. AWS MemoryDB
    this.capabilities.set("aws_memorydb", {
      supportsEvictionConfiguration: true,
      supportedEvictionPolicies: ["lru", "lfu", "random", "ttl_only", "no_eviction"],
      supportsSlidingTTL: true,
      supportsBackgroundRefresh: true,
      supportsAtomicCompareAndSwap: true,
      supportsDistributedLocking: true,
      supportsPubSubInvalidation: true,
      supportsKeyPatternPurge: true,
      supportsReplication: true,
      supportsMultiRegionActiveActive: false,
      maxKeySizeBytes: 536870912,
      maxValueSizeBytes: 536870912,
      provenance: defaultProv,
    });

    // 8. Fastly
    this.capabilities.set("fastly", {
      supportsEvictionConfiguration: false,
      supportedEvictionPolicies: ["lru", "ttl_only"],
      supportsSlidingTTL: false,
      supportsBackgroundRefresh: true,
      supportsAtomicCompareAndSwap: false,
      supportsDistributedLocking: false,
      supportsPubSubInvalidation: false,
      supportsKeyPatternPurge: true, // Instant Surrogate-Key purge
      supportsReplication: true,
      supportsMultiRegionActiveActive: true,
      provenance: defaultProv,
    });

    // 9. Browser Native
    this.capabilities.set("browser_native", {
      supportsEvictionConfiguration: false,
      supportedEvictionPolicies: ["lru"],
      supportsSlidingTTL: false,
      supportsBackgroundRefresh: true,
      supportsAtomicCompareAndSwap: false,
      supportsDistributedLocking: false,
      supportsPubSubInvalidation: false,
      supportsKeyPatternPurge: false,
      supportsReplication: false,
      supportsMultiRegionActiveActive: false,
      provenance: defaultProv,
    });

    // 10. Application In-Memory (Node.js heap / lru-cache)
    this.capabilities.set("in_memory", {
      supportsEvictionConfiguration: true,
      supportedEvictionPolicies: ["lru", "lfu", "fifo"],
      supportsSlidingTTL: true,
      supportsBackgroundRefresh: true,
      supportsAtomicCompareAndSwap: true, // Single-threaded event loop atomicity
      supportsDistributedLocking: false, // Node memory is local to 1 pod!
      supportsPubSubInvalidation: false,
      supportsKeyPatternPurge: true,
      supportsReplication: false, // Not replicated across pods
      supportsMultiRegionActiveActive: false,
      provenance: defaultProv,
    });
  }

  private getDefaultCustomCapabilities(): CacheProviderCapabilities {
    return {
      supportsEvictionConfiguration: false,
      supportedEvictionPolicies: ["lru", "ttl_only"],
      supportsSlidingTTL: false,
      supportsBackgroundRefresh: false,
      supportsAtomicCompareAndSwap: false,
      supportsDistributedLocking: false,
      supportsPubSubInvalidation: false,
      supportsKeyPatternPurge: false,
      supportsReplication: false,
      supportsMultiRegionActiveActive: false,
      provenance: {
        source: "unknown",
        timestamp: new Date().toISOString(),
        graphRevision: "rev-default",
        confirmed: false,
      },
    };
  }
}

export const cacheCapabilityRegistry = new CacheCapabilityRegistry();

