export * from "./redis-cache-icon";
export * from "./memcached-cache-icon";
export * from "./application-cache-icon";
export * from "./distributed-cache-icon";
export * from "./session-cache-icon";
export * from "./query-cache-icon";
export * from "./read-through-cache-icon";
export * from "./write-through-cache-icon";
export * from "./write-behind-cache-icon";
export * from "./rate-limit-store-icon";

import type { InfrastructureIconComponent } from "../types";
import { RedisCacheIcon } from "./redis-cache-icon";
import { MemcachedCacheIcon } from "./memcached-cache-icon";
import { ApplicationCacheIcon } from "./application-cache-icon";
import { DistributedCacheIcon } from "./distributed-cache-icon";
import { SessionCacheIcon } from "./session-cache-icon";
import { QueryCacheIcon } from "./query-cache-icon";
import { ReadThroughCacheIcon } from "./read-through-cache-icon";
import { WriteThroughCacheIcon } from "./write-through-cache-icon";
import { WriteBehindCacheIcon } from "./write-behind-cache-icon";
import { RateLimitStoreIcon } from "./rate-limit-store-icon";

export {
  RedisCacheIcon,
  MemcachedCacheIcon,
  ApplicationCacheIcon,
  DistributedCacheIcon,
  SessionCacheIcon,
  QueryCacheIcon,
  ReadThroughCacheIcon,
  WriteThroughCacheIcon,
  WriteBehindCacheIcon,
  RateLimitStoreIcon,
};

export const cachingAndPerformanceIconRegistry: Record<string, InfrastructureIconComponent> = {
  "redis-cache": RedisCacheIcon,
  "memcached-cache": MemcachedCacheIcon,
  "application-cache": ApplicationCacheIcon,
  "distributed-cache": DistributedCacheIcon,
  "session-cache": SessionCacheIcon,
  "query-cache": QueryCacheIcon,
  "read-through-cache": ReadThroughCacheIcon,
  "write-through-cache": WriteThroughCacheIcon,
  "write-behind-cache": WriteBehindCacheIcon,
  "rate-limit-store": RateLimitStoreIcon,
};

export function getCachingAndPerformanceInfrastructureIcon(
  slug: string
): InfrastructureIconComponent | null {
  return cachingAndPerformanceIconRegistry[slug] || null;
}
