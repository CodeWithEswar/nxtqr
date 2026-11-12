import type { BaseExecutionEvent } from "../domain/execution-event";
import type { DnsResolutionTrace, RequestLatencyBreakdown } from "./global-network-schemas";

export interface DnsQueryStartedEvent extends BaseExecutionEvent {
  type: "dns.query.started";
  queryId: string;
  clientId: string;
  resolverId: string;
  domain: string;
  recordType: "A" | "AAAA";
}

export interface DnsCacheLookupEvent extends BaseExecutionEvent {
  type: "dns.cache.lookup";
  queryId: string;
  resolverId: string;
  cacheKey: string;
  layer: "stub" | "recursive";
}

export interface DnsCacheHitEvent extends BaseExecutionEvent {
  type: "dns.cache.hit";
  queryId: string;
  resolverId: string;
  cacheKey: string;
  remainingTtlMs: number;
  answers: string[];
}

export interface DnsCacheMissEvent extends BaseExecutionEvent {
  type: "dns.cache.miss";
  queryId: string;
  resolverId: string;
  cacheKey: string;
  expired: boolean;
}

export interface DnsReferralReceivedEvent extends BaseExecutionEvent {
  type: "dns.referral.received";
  queryId: string;
  stage: "root" | "tld";
  targetServer: string;
  nextHop: string;
}

export interface DnsAuthoritativeQueryEvent extends BaseExecutionEvent {
  type: "dns.authoritative.query";
  queryId: string;
  nameserver: string;
  domain: string;
}

export interface DnsCnameFollowedEvent extends BaseExecutionEvent {
  type: "dns.cname.followed";
  queryId: string;
  alias: string;
  target: string;
  depth: number;
}

export interface DnsAnswerReceivedEvent extends BaseExecutionEvent {
  type: "dns.answer.received";
  queryId: string;
  rcode: string;
  answers: string[];
  ttlSeconds: number;
}

export interface DnsResolutionCompletedEvent extends BaseExecutionEvent {
  type: "dns.resolution.completed";
  queryId: string;
  trace: DnsResolutionTrace;
}

export interface DnsResolutionFailedEvent extends BaseExecutionEvent {
  type: "dns.resolution.failed";
  queryId: string;
  rcode: string;
  reason: string;
}

export interface DnsNegativeCacheCreatedEvent extends BaseExecutionEvent {
  type: "dns.negative_cache.created";
  queryId: string;
  cacheKey: string;
  negativeType: "NXDOMAIN" | "NODATA";
  ttlSeconds: number;
}

export interface DnsNegativeCacheHitEvent extends BaseExecutionEvent {
  type: "dns.negative_cache.hit";
  queryId: string;
  cacheKey: string;
  negativeType: "NXDOMAIN" | "NODATA";
}

export interface DnsNegativeCacheExpiredEvent extends BaseExecutionEvent {
  type: "dns.negative_cache.expired";
  queryId: string;
  cacheKey: string;
}

export interface CdnEdgeSelectionStartedEvent extends BaseExecutionEvent {
  type: "cdn.edge.selection.started";
  requestId: string;
  clientRegion: string;
  strategy: string;
}

export interface CdnEdgeCandidateEvaluatedEvent extends BaseExecutionEvent {
  type: "cdn.edge.candidate.evaluated";
  requestId: string;
  edgeId: string;
  region: string;
  healthy: boolean;
  latencyMs: number;
}

export interface CdnEdgeSelectedEvent extends BaseExecutionEvent {
  type: "cdn.edge.selected";
  requestId: string;
  edgeId: string;
  region: string;
  latencyMs: number;
}

export interface CdnEdgeUnavailableEvent extends BaseExecutionEvent {
  type: "cdn.edge.unavailable";
  edgeId: string;
  region: string;
  reason: string;
}

export interface CdnEdgeSelectionFailedEvent extends BaseExecutionEvent {
  type: "cdn.edge.selection.failed";
  requestId: string;
  reason: string;
}

export interface CdnCacheLookupStartedEvent extends BaseExecutionEvent {
  type: "cdn.cache.lookup.started";
  requestId: string;
  edgeId: string;
  cacheKey: string;
}

export interface CdnCacheHitEvent extends BaseExecutionEvent {
  type: "cdn.cache.hit";
  requestId: string;
  edgeId: string;
  cacheKey: string;
  ageMs: number;
}

export interface CdnCacheMissEvent extends BaseExecutionEvent {
  type: "cdn.cache.miss";
  requestId: string;
  edgeId: string;
  cacheKey: string;
}

export interface CdnCacheStaleEvent extends BaseExecutionEvent {
  type: "cdn.cache.stale";
  requestId: string;
  edgeId: string;
  cacheKey: string;
  policy: "stale-while-revalidate" | "stale-if-error" | "must-revalidate";
}

export interface CdnCacheRevalidationStartedEvent extends BaseExecutionEvent {
  type: "cdn.cache.revalidation.started";
  requestId: string;
  edgeId: string;
  ifNoneMatch: string;
}

export interface CdnCacheRevalidationCompletedEvent extends BaseExecutionEvent {
  type: "cdn.cache.revalidation.completed";
  requestId: string;
  edgeId: string;
  statusCode: number;
}

export interface CdnCacheEntryStoredEvent extends BaseExecutionEvent {
  type: "cdn.cache.entry.stored";
  edgeId: string;
  cacheKey: string;
  ttlSeconds: number;
}

export interface CdnCacheEntryEvictedEvent extends BaseExecutionEvent {
  type: "cdn.cache.entry.evicted";
  edgeId: string;
  cacheKey: string;
  reason: string;
}

export interface CdnPurgeRequestedEvent extends BaseExecutionEvent {
  type: "cdn.purge.requested";
  purgeId: string;
  pathPattern: string;
  mode: string;
}

export interface CdnPurgePropagationStartedEvent extends BaseExecutionEvent {
  type: "cdn.purge.propagation.started";
  purgeId: string;
  edgeCount: number;
  propagationDelayMs: number;
}

export interface CdnPurgeEdgeAppliedEvent extends BaseExecutionEvent {
  type: "cdn.purge.edge.applied";
  purgeId: string;
  edgeId: string;
  evictedKeys: number;
}

export interface CdnPurgeCompletedEvent extends BaseExecutionEvent {
  type: "cdn.purge.completed";
  purgeId: string;
  totalEvictedKeys: number;
}

export interface CdnShieldLookupEvent extends BaseExecutionEvent {
  type: "cdn.shield.lookup";
  requestId: string;
  cacheKey: string;
}

export interface CdnShieldHitEvent extends BaseExecutionEvent {
  type: "cdn.shield.hit";
  requestId: string;
  cacheKey: string;
}

export interface CdnShieldMissEvent extends BaseExecutionEvent {
  type: "cdn.shield.miss";
  requestId: string;
  cacheKey: string;
}

export interface CdnShieldOriginFetchEvent extends BaseExecutionEvent {
  type: "cdn.shield.origin.fetch";
  requestId: string;
  originId: string;
}

export interface CdnOriginFetchStartedEvent extends BaseExecutionEvent {
  type: "cdn.origin.fetch.started";
  requestId: string;
  originId: string;
  path: string;
}

export interface CdnOriginRequestReceivedEvent extends BaseExecutionEvent {
  type: "cdn.origin.request.received";
  requestId: string;
  originId: string;
}

export interface CdnOriginResponseGeneratedEvent extends BaseExecutionEvent {
  type: "cdn.origin.response.generated";
  requestId: string;
  originId: string;
  statusCode: number;
}

export interface CdnOriginFetchCompletedEvent extends BaseExecutionEvent {
  type: "cdn.origin.fetch.completed";
  requestId: string;
  originId: string;
  breakdown: RequestLatencyBreakdown;
}

export interface CdnOriginFetchFailedEvent extends BaseExecutionEvent {
  type: "cdn.origin.fetch.failed";
  requestId: string;
  originId: string;
  reason: string;
}

export interface GlobalFaultAppliedEvent extends BaseExecutionEvent {
  type: "global.fault.applied";
  faultId: string;
  faultType: string;
  targetId: string;
}

export type GlobalNetworkExecutionEvent =
  | DnsQueryStartedEvent
  | DnsCacheLookupEvent
  | DnsCacheHitEvent
  | DnsCacheMissEvent
  | DnsReferralReceivedEvent
  | DnsAuthoritativeQueryEvent
  | DnsCnameFollowedEvent
  | DnsAnswerReceivedEvent
  | DnsResolutionCompletedEvent
  | DnsResolutionFailedEvent
  | DnsNegativeCacheCreatedEvent
  | DnsNegativeCacheHitEvent
  | DnsNegativeCacheExpiredEvent
  | CdnEdgeSelectionStartedEvent
  | CdnEdgeCandidateEvaluatedEvent
  | CdnEdgeSelectedEvent
  | CdnEdgeUnavailableEvent
  | CdnEdgeSelectionFailedEvent
  | CdnCacheLookupStartedEvent
  | CdnCacheHitEvent
  | CdnCacheMissEvent
  | CdnCacheStaleEvent
  | CdnCacheRevalidationStartedEvent
  | CdnCacheRevalidationCompletedEvent
  | CdnCacheEntryStoredEvent
  | CdnCacheEntryEvictedEvent
  | CdnPurgeRequestedEvent
  | CdnPurgePropagationStartedEvent
  | CdnPurgeEdgeAppliedEvent
  | CdnPurgeCompletedEvent
  | CdnShieldLookupEvent
  | CdnShieldHitEvent
  | CdnShieldMissEvent
  | CdnShieldOriginFetchEvent
  | CdnOriginFetchStartedEvent
  | CdnOriginRequestReceivedEvent
  | CdnOriginResponseGeneratedEvent
  | CdnOriginFetchCompletedEvent
  | CdnOriginFetchFailedEvent
  | GlobalFaultAppliedEvent;
