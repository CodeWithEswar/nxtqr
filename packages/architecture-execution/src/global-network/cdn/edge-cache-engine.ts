import type {
  EdgeCacheEntryState,
  HttpCachePolicy,
  OriginResource,
} from "../global-network-schemas";

export class EdgeCacheEngine {
  public static computeCacheKey(
    domain: string,
    path: string,
    headers: Record<string, string>,
    policy: HttpCachePolicy
  ): string {
    const base = `${domain.toLowerCase()}:${path}`;
    if (!policy.varyHeaders || policy.varyHeaders.length === 0) return base;
    const varyPart = [...policy.varyHeaders]
      .sort()
      .map((h) => `${h.toLowerCase()}=${headers[h.toLowerCase()] ?? headers[h] ?? ""}`)
      .join("&");
    return `${base}?vary[${varyPart}]`;
  }

  public static isCacheableResponse(
    policy: HttpCachePolicy,
    resource: OriginResource | undefined,
    requestHeaders: Record<string, string>
  ): { cacheable: boolean; reason: string; effectiveMaxAgeSec: number } {
    if (policy.cacheControl === "no-store" || resource?.cacheControlOverride === "no-store") {
      return {
        cacheable: false,
        reason: "Cache-Control: no-store prohibits edge caching.",
        effectiveMaxAgeSec: 0,
      };
    }
    if (policy.cacheControl === "private" || resource?.cacheControlOverride === "private") {
      return {
        cacheable: false,
        reason: "Cache-Control: private prohibits shared CDN edge caching.",
        effectiveMaxAgeSec: 0,
      };
    }
    if (requestHeaders["authorization"] && policy.cacheControl !== "public") {
      return {
        cacheable: false,
        reason: "Authenticated request with Authorization header bypassed default edge cache.",
        effectiveMaxAgeSec: 0,
      };
    }
    const maxAge = policy.sMaxAgeSeconds ?? policy.maxAgeSeconds;
    return {
      cacheable: maxAge > 0,
      reason: maxAge > 0 ? `Cacheable (TTL ${maxAge}s).` : "Zero max-age requires validation.",
      effectiveMaxAgeSec: maxAge,
    };
  }

  public static evaluateEntryFreshness(
    entry: EdgeCacheEntryState | undefined,
    atMs: number,
    policy: HttpCachePolicy
  ): "miss" | "fresh" | "stale_revalidate" | "expired" {
    if (!entry) return "miss";
    if (atMs < entry.expiresAtMs) return "fresh";
    if (
      policy.staleWhileRevalidateSeconds > 0 &&
      entry.revalidateUntilMs !== undefined &&
      atMs <= entry.revalidateUntilMs
    ) {
      return "stale_revalidate";
    }
    return "expired";
  }

  public static matchesPurge(
    entryPath: string,
    purgePattern: string,
    mode: "object" | "prefix" | "tag"
  ): boolean {
    if (mode === "prefix") {
      return entryPath.startsWith(purgePattern);
    }
    if (mode === "object") {
      return entryPath === purgePattern;
    }
    return entryPath.includes(purgePattern);
  }
}

