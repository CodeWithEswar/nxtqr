import type {
  ClientRegionConfig,
  DnsCacheEntryState,
  DnsConfiguration,
  DnsRecord,
  DnsResolutionTrace,
  DnsZone,
  ModeledGlobalNetworkRuntimeState,
} from "../global-network-schemas";

export interface DnsStepEmitCallback {
  (evt: Record<string, unknown>): void;
}

export class DnsResolutionEngine {
  public static resolve(
    queryId: string,
    client: ClientRegionConfig,
    domain: string,
    recordType: "A" | "AAAA",
    atMs: number,
    dnsConfig: DnsConfiguration,
    runtime: ModeledGlobalNetworkRuntimeState,
    weightedCursorRef: { count: number },
    emit: DnsStepEmitCallback
  ): DnsResolutionTrace {
    const resolverState = runtime.resolvers[client.resolverId];
    const resolverConfig = dnsConfig.resolvers.find((r) => r.id === client.resolverId);
    const cacheKey = `${domain.toLowerCase()}:${recordType}`;
    let latency = 0;

    emit({
      type: "dns.query.started",
      atMs,
      durationMs: 4,
      queryId,
      clientId: client.id,
      resolverId: client.resolverId,
      domain,
      recordType,
      explanation: `Client "${client.name}" (${client.region}) initiated ${recordType} lookup for "${domain}".`,
    });

    // 1. Optional Stub Resolver Cache
    if (client.stubCacheEnabled) {
      const stubCache = runtime.stubCaches[client.id] || {};
      const stubEntry = stubCache[cacheKey];
      emit({
        type: "dns.cache.lookup",
        atMs: atMs + latency,
        durationMs: 1,
        queryId,
        resolverId: client.id,
        cacheKey,
        layer: "stub",
        explanation: `Checking local stub resolver cache for "${cacheKey}".`,
      });
      if (stubEntry && atMs < stubEntry.expiresAtMs && !stubEntry.isNegative) {
        latency += 1;
        emit({
          type: "dns.cache.hit",
          atMs: atMs + latency,
          durationMs: 1,
          queryId,
          resolverId: client.id,
          cacheKey,
          remainingTtlMs: stubEntry.expiresAtMs - atMs,
          answers: stubEntry.answers,
          explanation: `Stub cache HIT for "${domain}" (${stubEntry.answers.join(", ")}), skipping recursive lookup (${stubEntry.expiresAtMs - atMs}ms TTL remaining).`,
        });
        const trace: DnsResolutionTrace = {
          queryId,
          clientId: client.id,
          resolverId: client.id,
          domain,
          recordType,
          referralChain: ["Stub Cache"],
          cnameChain: [],
          cacheOutcome: "hit",
          rcode: "NOERROR",
          answers: stubEntry.answers,
          ttlSeconds: Math.floor((stubEntry.expiresAtMs - atMs) / 1000),
          resolutionLatencyMs: latency,
          explanation: `Resolved "${domain}" from client stub cache in ${latency}ms.`,
        };
        emit({
          type: "dns.resolution.completed",
          atMs: atMs + latency,
          durationMs: 1,
          queryId,
          trace,
          explanation: trace.explanation,
        });
        return trace;
      }
    }

    // 2. Recursive Resolver Availability
    if (!resolverState || !resolverState.healthy || !resolverConfig) {
      const failMs = resolverConfig?.timeoutMs ?? 500;
      emit({
        type: "dns.resolution.failed",
        atMs: atMs + failMs,
        durationMs: failMs,
        queryId,
        rcode: "SERVFAIL",
        reason: `Configured recursive resolver "${client.resolverId}" is unavailable.`,
        explanation: `DNS lookup FAILED (SERVFAIL): resolver "${client.resolverId}" unreachable after ${failMs}ms.`,
      });
      return {
        queryId,
        clientId: client.id,
        resolverId: client.resolverId,
        domain,
        recordType,
        referralChain: [],
        cnameChain: [],
        cacheOutcome: "bypass",
        rcode: "SERVFAIL",
        answers: [],
        ttlSeconds: 0,
        resolutionLatencyMs: failMs,
        explanation: `Resolver "${client.resolverId}" unavailable (SERVFAIL).`,
      };
    }

    latency += resolverConfig.baseLatencyMs;

    // 3. Recursive Resolver Cache Check
    let wasExpired = false;
    if (resolverConfig.cacheEnabled) {
      emit({
        type: "dns.cache.lookup",
        atMs: atMs + latency,
        durationMs: 2,
        queryId,
        resolverId: resolverState.id,
        cacheKey,
        layer: "recursive",
        explanation: `Recursive resolver "${resolverState.name}" checking cache for "${cacheKey}".`,
      });
      const cached = resolverState.cache[cacheKey];
      if (cached) {
        if (atMs < cached.expiresAtMs) {
          if (cached.isNegative) {
            emit({
              type: "dns.negative_cache.hit",
              atMs: atMs + latency,
              durationMs: 2,
              queryId,
              cacheKey,
              negativeType: cached.negativeType ?? "NXDOMAIN",
              explanation: `Negative cache HIT (${cached.negativeType}) for "${domain}" (${cached.expiresAtMs - atMs}ms remaining).`,
            });
            const negTrace: DnsResolutionTrace = {
              queryId,
              clientId: client.id,
              resolverId: resolverState.id,
              domain,
              recordType,
              referralChain: ["Recursive Cache (Negative)"],
              cnameChain: [],
              cacheOutcome: "negative_hit",
              rcode: cached.negativeType ?? "NXDOMAIN",
              answers: [],
              ttlSeconds: Math.floor((cached.expiresAtMs - atMs) / 1000),
              resolutionLatencyMs: latency,
              explanation: `Served cached ${cached.negativeType} negative response in ${latency}ms.`,
            };
            emit({
              type: "dns.resolution.failed",
              atMs: atMs + latency,
              durationMs: 2,
              queryId,
              rcode: negTrace.rcode,
              reason: negTrace.explanation,
              explanation: negTrace.explanation,
            });
            return negTrace;
          }

          emit({
            type: "dns.cache.hit",
            atMs: atMs + latency,
            durationMs: 2,
            queryId,
            resolverId: resolverState.id,
            cacheKey,
            remainingTtlMs: cached.expiresAtMs - atMs,
            answers: cached.answers,
            explanation: `Recursive cache HIT for "${domain}" -> [${cached.answers.join(", ")}] (${Math.round((cached.expiresAtMs - atMs) / 1000)}s TTL remaining).`,
          });

          if (client.stubCacheEnabled) {
            runtime.stubCaches[client.id] = runtime.stubCaches[client.id] || {};
            runtime.stubCaches[client.id]![cacheKey] = {
              ...cached,
              expiresAtMs: Math.min(cached.expiresAtMs, atMs + client.stubCacheTtlMs),
            };
          }

          const trace: DnsResolutionTrace = {
            queryId,
            clientId: client.id,
            resolverId: resolverState.id,
            domain,
            recordType,
            referralChain: ["Recursive Cache"],
            cnameChain: [],
            cacheOutcome: "hit",
            rcode: "NOERROR",
            answers: cached.answers,
            ttlSeconds: cached.originalTtlSeconds,
            resolutionLatencyMs: latency,
            explanation: `Warm recursive cache hit resolved "${domain}" -> [${cached.answers.join(", ")}] in ${latency}ms.`,
          };
          emit({
            type: "dns.resolution.completed",
            atMs: atMs + latency,
            durationMs: 2,
            queryId,
            trace,
            explanation: trace.explanation,
          });
          return trace;
        } else {
          // Entry expired!
          wasExpired = true;
          if (cached.isNegative) {
            emit({
              type: "dns.negative_cache.expired",
              atMs: atMs + latency,
              durationMs: 2,
              queryId,
              cacheKey,
              explanation: `Negative cache entry for "${cacheKey}" expired at +${cached.expiresAtMs}ms; querying authoritative server.`,
            });
          }
          delete resolverState.cache[cacheKey];
        }
      }

      emit({
        type: "dns.cache.miss",
        atMs: atMs + latency,
        durationMs: 2,
        queryId,
        resolverId: resolverState.id,
        cacheKey,
        expired: wasExpired,
        explanation: wasExpired
          ? `DNS cache entry for "${cacheKey}" EXPIRED; performing fresh iterative resolution.`
          : `DNS cache MISS for "${cacheKey}"; starting iterative delegation from root.`,
      });
    }

    // 4. Iterative Delegation (Root -> TLD -> Authoritative)
    const referralChain: string[] = [];
    const tld = domain.split(".").pop() || "com";

    latency += dnsConfig.delegationLatencyMs.rootMs;
    referralChain.push(`Root (.) -> .${tld}`);
    emit({
      type: "dns.referral.received",
      atMs: atMs + latency,
      durationMs: dnsConfig.delegationLatencyMs.rootMs,
      queryId,
      stage: "root",
      targetServer: "a.root-servers.net",
      nextHop: `.${tld} TLD nameservers`,
      explanation: `Root nameserver referred resolver to .${tld} TLD nameserver (+${dnsConfig.delegationLatencyMs.rootMs}ms).`,
    });

    const zone = findMatchingZone(domain, dnsConfig.zones);
    latency += dnsConfig.delegationLatencyMs.tldMs;
    referralChain.push(`TLD (.${tld}) -> ${zone?.nameservers[0] ?? "unassigned"}`);
    emit({
      type: "dns.referral.received",
      atMs: atMs + latency,
      durationMs: dnsConfig.delegationLatencyMs.tldMs,
      queryId,
      stage: "tld",
      targetServer: `tld.${tld}`,
      nextHop: zone?.nameservers[0] ?? "authoritative-ns",
      explanation: `.${tld} TLD referred resolver to ${zone?.nameservers[0] ?? "authoritative NS"} (+${dnsConfig.delegationLatencyMs.tldMs}ms).`,
    });

    if (!zone || !zone.healthy) {
      const reason = !zone
        ? `No authoritative DNS zone exists matching "${domain}".`
        : `Authoritative nameserver for "${zone.zoneName}" is unavailable.`;
      emit({
        type: "dns.resolution.failed",
        atMs: atMs + latency,
        durationMs: 20,
        queryId,
        rcode: !zone ? "NXDOMAIN" : "SERVFAIL",
        reason,
        explanation: `DNS authoritative query FAILED: ${reason}`,
      });
      return {
        queryId,
        clientId: client.id,
        resolverId: resolverState.id,
        domain,
        recordType,
        referralChain,
        cnameChain: [],
        cacheOutcome: wasExpired ? "expired" : "miss",
        rcode: !zone ? "NXDOMAIN" : "SERVFAIL",
        answers: [],
        ttlSeconds: 0,
        resolutionLatencyMs: latency,
        explanation: reason,
      };
    }

    // 5. Authoritative Query + Bounded CNAME Chain Follow-up
    const cnameChain: string[] = [];
    const visitedNames = new Set<string>([domain.toLowerCase()]);
    let currentName = domain.toLowerCase();
    let finalRecords: DnsRecord[] = [];
    let currentZone: DnsZone = zone;

    for (let depth = 0; depth <= 8; depth++) {
      latency += dnsConfig.delegationLatencyMs.authMs;
      emit({
        type: "dns.authoritative.query",
        atMs: atMs + latency,
        durationMs: dnsConfig.delegationLatencyMs.authMs,
        queryId,
        nameserver: currentZone.nameservers[0] || "ns1.example.com",
        domain: currentName,
        explanation: `Querying authoritative NS (${currentZone.nameservers[0]}) for ${currentName} ${recordType}.`,
      });

      const directMatches = currentZone.records.filter(
        (r) => r.name.toLowerCase() === currentName && r.type === recordType
      );
      if (directMatches.length > 0) {
        finalRecords = directMatches;
        break;
      }

      // Check CNAME alias
      const cnameRec = currentZone.records.find(
        (r) => r.name.toLowerCase() === currentName && r.type === "CNAME"
      );
      if (cnameRec) {
        const nextTarget = cnameRec.value.toLowerCase();
        cnameChain.push(`${currentName} -> ${nextTarget}`);
        emit({
          type: "dns.cname.followed",
          atMs: atMs + latency,
          durationMs: 4,
          queryId,
          alias: currentName,
          target: nextTarget,
          depth: depth + 1,
          explanation: `Followed CNAME alias: ${currentName} -> ${nextTarget} (depth ${depth + 1}).`,
        });

        if (visitedNames.has(nextTarget) || depth >= 7) {
          const loopMsg = visitedNames.has(nextTarget)
            ? `CNAME loop detected on "${nextTarget}".`
            : `CNAME chain exceeded maximum depth (8).`;
          emit({
            type: "dns.resolution.failed",
            atMs: atMs + latency,
            durationMs: 10,
            queryId,
            rcode: "SERVFAIL",
            reason: loopMsg,
            explanation: `DNS CNAME resolution aborted: ${loopMsg}`,
          });
          return {
            queryId,
            clientId: client.id,
            resolverId: resolverState.id,
            domain,
            recordType,
            referralChain,
            cnameChain,
            cacheOutcome: wasExpired ? "expired" : "miss",
            rcode: "SERVFAIL",
            answers: [],
            ttlSeconds: 0,
            resolutionLatencyMs: latency,
            explanation: loopMsg,
          };
        }

        visitedNames.add(nextTarget);
        currentName = nextTarget;
        currentZone = findMatchingZone(currentName, dnsConfig.zones) || currentZone;
        continue;
      }

      // Check whether any other record type exists for currentName (NODATA vs NXDOMAIN)
      const anyRecordForName = currentZone.records.some(
        (r) => r.name.toLowerCase() === currentName
      );
      const negativeType: "NXDOMAIN" | "NODATA" = anyRecordForName ? "NODATA" : "NXDOMAIN";
      const negTtl = currentZone.soaMinimumTtlSeconds;

      if (resolverConfig.cacheEnabled && negTtl > 0) {
        resolverState.cache[cacheKey] = {
          cacheKey,
          queryName: domain,
          recordType,
          answers: [],
          insertedAtMs: atMs + latency,
          expiresAtMs: atMs + latency + negTtl * 1000,
          originalTtlSeconds: negTtl,
          isNegative: true,
          negativeType,
        };
        emit({
          type: "dns.negative_cache.created",
          atMs: atMs + latency,
          durationMs: 2,
          queryId,
          cacheKey,
          negativeType,
          ttlSeconds: negTtl,
          explanation: `Cached negative ${negativeType} response for "${cacheKey}" with SOA minimum TTL ${negTtl}s.`,
        });
      }

      emit({
        type: "dns.resolution.failed",
        atMs: atMs + latency,
        durationMs: 10,
        queryId,
        rcode: negativeType,
        reason: `Authoritative zone returned ${negativeType} for "${currentName}" (${recordType}).`,
        explanation: `DNS resolution failed (${negativeType}): "${currentName}" has no ${recordType} record.`,
      });

      return {
        queryId,
        clientId: client.id,
        resolverId: resolverState.id,
        domain,
        recordType,
        referralChain,
        cnameChain,
        cacheOutcome: wasExpired ? "expired" : "miss",
        rcode: negativeType,
        answers: [],
        ttlSeconds: negTtl,
        resolutionLatencyMs: latency,
        explanation: `Authoritative ${negativeType} for "${currentName}".`,
      };
    }

    // 6. Apply DNS Routing Policy (Health, Geographic, Weighted, Latency, Simple)
    const selectedRecords = selectRecordsByRoutingPolicy(
      finalRecords,
      client.region,
      dnsConfig.routingPolicy,
      runtime,
      weightedCursorRef
    );

    const answers = selectedRecords.map((r) => r.value);
    const minTtl = Math.min(...selectedRecords.map((r) => r.ttlSeconds));

    emit({
      type: "dns.answer.received",
      atMs: atMs + latency,
      durationMs: 4,
      queryId,
      rcode: "NOERROR",
      answers,
      ttlSeconds: minTtl,
      explanation: `Authoritative answer received (${dnsConfig.routingPolicy} policy): ${answers.join(", ")} (TTL ${minTtl}s).`,
    });

    // Populate Resolver & Stub Cache
    if (resolverConfig.cacheEnabled && minTtl > 0) {
      const entry: DnsCacheEntryState = {
        cacheKey,
        queryName: domain,
        recordType,
        answers,
        insertedAtMs: atMs + latency,
        expiresAtMs: atMs + latency + minTtl * 1000,
        originalTtlSeconds: minTtl,
        isNegative: false,
      };
      resolverState.cache[cacheKey] = entry;
      if (client.stubCacheEnabled) {
        runtime.stubCaches[client.id] = runtime.stubCaches[client.id] || {};
        runtime.stubCaches[client.id]![cacheKey] = {
          ...entry,
          expiresAtMs: Math.min(entry.expiresAtMs, atMs + latency + client.stubCacheTtlMs),
        };
      }
    }

    const trace: DnsResolutionTrace = {
      queryId,
      clientId: client.id,
      resolverId: resolverState.id,
      domain,
      recordType,
      referralChain,
      cnameChain,
      cacheOutcome: wasExpired ? "expired" : "miss",
      rcode: "NOERROR",
      answers,
      ttlSeconds: minTtl,
      resolutionLatencyMs: latency,
      explanation: `Resolved "${domain}" -> [${answers.join(", ")}] via ${dnsConfig.routingPolicy} routing in ${latency}ms (TTL ${minTtl}s).`,
    };
    emit({
      type: "dns.resolution.completed",
      atMs: atMs + latency,
      durationMs: 2,
      queryId,
      trace,
      explanation: trace.explanation,
    });
    return trace;
  }
}

function findMatchingZone(domain: string, zones: DnsZone[]): DnsZone | undefined {
  const lower = domain.toLowerCase();
  return zones
    .filter((z) => lower === z.zoneName.toLowerCase() || lower.endsWith(`.${z.zoneName.toLowerCase()}`))
    .sort((a, b) => b.zoneName.length - a.zoneName.length)[0];
}

function isTargetHealthy(
  healthTargetId: string | undefined,
  runtime: ModeledGlobalNetworkRuntimeState
): boolean {
  if (!healthTargetId) return true;
  if (runtime.origins[healthTargetId]) return runtime.origins[healthTargetId]!.healthy;
  if (runtime.edges[healthTargetId]) return runtime.edges[healthTargetId]!.healthy;
  return true;
}

function selectRecordsByRoutingPolicy(
  records: DnsRecord[],
  clientRegion: string,
  policy: DnsConfiguration["routingPolicy"],
  runtime: ModeledGlobalNetworkRuntimeState,
  weightedCursorRef: { count: number }
): DnsRecord[] {
  if (records.length <= 1) return records;

  const healthyOnly = records.filter((r) => isTargetHealthy(r.healthTargetId, runtime));
  const pool = healthyOnly.length > 0 ? healthyOnly : records;

  if (policy === "health_failover") {
    return [pool[0]!];
  }

  if (policy === "geographic") {
    const regionalMatch = pool.find((r) => r.region === clientRegion);
    return [regionalMatch || pool[0]!];
  }

  if (policy === "latency") {
    const sorted = [...pool].sort((a, b) => (a.latencyMs ?? 50) - (b.latencyMs ?? 50));
    return [sorted[0]!];
  }

  if (policy === "weighted") {
    const totalWeight = pool.reduce((sum, r) => sum + Math.max(1, r.weight ?? 1), 0);
    const pick = weightedCursorRef.count % totalWeight;
    weightedCursorRef.count += 1;
    let accum = 0;
    for (const r of pool) {
      accum += Math.max(1, r.weight ?? 1);
      if (pick < accum) return [r];
    }
    return [pool[0]!];
  }

  return pool;
}
