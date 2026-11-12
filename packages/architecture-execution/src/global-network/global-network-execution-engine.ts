import type {
  ExecutionConfiguration,
  ExecutionEvent,
  ExecutionTrace,
  VisualizationFrame,
} from "../index";
import { RuntimeStateHelper } from "../domain/runtime-state";
import {
  GlobalNetworkScenarioSchema,
  type CdnEdgeRuntimeState,
  type GlobalNetworkMetrics,
  type GlobalNetworkScenario,
  type ModeledGlobalNetworkRuntimeState,
  type OriginRuntimeState,
  type RequestLatencyBreakdown,
} from "./global-network-schemas";
import { DnsResolutionEngine } from "./dns/dns-resolution-engine";
import { CdnEdgeSelectionEngine } from "./cdn/edge-selection-engine";
import { EdgeCacheEngine } from "./cdn/edge-cache-engine";

type ScheduledWorkItem =
  | { kind: "fault_apply"; atMs: number; seq: number; faultId: string }
  | { kind: "fault_recover"; atMs: number; seq: number; faultId: string }
  | { kind: "purge_request"; atMs: number; seq: number; purgeId: string }
  | { kind: "purge_apply"; atMs: number; seq: number; purgeId: string; pathPattern: string; mode: "object" | "prefix" | "tag" }
  | { kind: "http_request"; atMs: number; seq: number; stepIndex: number; burstIndex: number };

export class GlobalNetworkExecutionEngine {
  public static runScenario(rawScenario: GlobalNetworkScenario): ExecutionTrace {
    const parsed = GlobalNetworkScenarioSchema.parse(rawScenario);
    const baseRuntime = RuntimeStateHelper.createInitialState();

    // Clone resolvers, edges, origins into runtime
    const resolvers: ModeledGlobalNetworkRuntimeState["resolvers"] = {};
    for (const r of parsed.dns.resolvers) {
      resolvers[r.id] = {
        id: r.id,
        name: r.name,
        healthy: r.healthy,
        cache: {},
      };
    }

    const edges: Record<string, CdnEdgeRuntimeState> = {};
    for (const e of parsed.cdn.edges) {
      edges[e.id] = {
        id: e.id,
        name: e.name,
        region: e.region,
        healthy: e.healthy,
        capacityRps: e.capacityRps,
        activeRequests: 0,
        processingLatencyMs: e.processingLatencyMs,
        cacheEntries: {},
        hitCount: 0,
        missCount: 0,
        staleServedCount: 0,
        revalidatedCount: 0,
        rejectedCapacityCount: 0,
      };
    }

    const origins: Record<string, OriginRuntimeState> = {};
    for (const o of parsed.origins) {
      origins[o.id] = {
        id: o.id,
        name: o.name,
        region: o.region,
        role: o.role,
        healthy: o.healthy,
        requestCount: 0,
        errorCount: 0,
      };
    }

    const runtime: ModeledGlobalNetworkRuntimeState = {
      resolvers,
      stubCaches: {},
      edges,
      originShield: {
        enabled: parsed.cdn.originShield.enabled,
        healthy: parsed.cdn.originShield.healthy,
        cacheEntries: {},
        hitCount: 0,
        missCount: 0,
      },
      origins,
      recentDnsTraces: [],
      recentRequests: [],
      metrics: computeMetrics([], [], {}),
      virtualTimeMs: 0,
    };

    // Clone mutable dns zones for fault toggles
    const zones = parsed.dns.zones.map((z) => ({
      ...z,
      nameservers: [...z.nameservers],
      records: z.records.map((r) => ({ ...r })),
    }));
    const dnsConfig = { ...parsed.dns, zones };
    const latencySpikes: Record<string, number> = {};
    const regionalCounts: Record<string, number> = {};
    const weightedCursorRef = { count: 0 };
    const events: ExecutionEvent[] = [];
    let eventSeq = 0;

    const emitEvent = (evt: Record<string, unknown>) => {
      if (events.length >= parsed.limits.maxEvents) return;
      eventSeq += 1;
      const evtAt = (evt.atMs as number) ?? runtime.virtualTimeMs;
      runtime.virtualTimeMs = Math.max(runtime.virtualTimeMs, evtAt);
      runtime.metrics = computeMetrics(
        runtime.recentDnsTraces,
        runtime.recentRequests,
        regionalCounts,
        runtime.originShield.hitCount,
        runtime.originShield.missCount
      );
      baseRuntime.globalNetworkState = JSON.parse(
        JSON.stringify(runtime)
      ) as ModeledGlobalNetworkRuntimeState;
      const fullEvt = {
        ...evt,
        id: `gn-evt-${eventSeq}`,
        sequence: eventSeq,
        stateSnapshot: RuntimeStateHelper.cloneState(baseRuntime),
      } as ExecutionEvent;
      events.push(fullEvt);
    };

    emitEvent({
      type: "run.started",
      atMs: 0,
      durationMs: 5,
      entryNodeId: parsed.clients[0]?.id ?? "client",
      request: {
        id: `req-${parsed.id}`,
        method: "GET",
        path: parsed.requests[0]?.path ?? "/",
        headers: {},
      },
      explanation: `Global Network simulation started for "${parsed.name}" (${parsed.clients.length} client region(s), ${parsed.cdn.edges.length} CDN edge(s), ${parsed.origins.length} origin(s)).`,
    });

    // Build deterministic chronological work queue
    const workQueue: ScheduledWorkItem[] = [];
    let seq = 0;

    for (const f of parsed.faults) {
      workQueue.push({ kind: "fault_apply", atMs: f.atMs, seq: ++seq, faultId: f.id });
      if (f.recoveryAtMs !== undefined) {
        workQueue.push({ kind: "fault_recover", atMs: f.recoveryAtMs, seq: ++seq, faultId: f.id });
      }
    }
    for (const p of parsed.purges) {
      workQueue.push({ kind: "purge_request", atMs: p.atMs, seq: ++seq, purgeId: p.id });
      workQueue.push({
        kind: "purge_apply",
        atMs: p.atMs + parsed.cdn.purgePropagationDelayMs,
        seq: ++seq,
        purgeId: p.id,
        pathPattern: p.pathPattern,
        mode: p.mode,
      });
    }

    let requestBudget = 0;
    parsed.requests.forEach((req, idx) => {
      const count = req.concurrentBurstCount ?? 1;
      for (let b = 0; b < count; b++) {
        if (requestBudget >= parsed.limits.maxRequests) break;
        requestBudget += 1;
        workQueue.push({
          kind: "http_request",
          atMs: req.atMs,
          seq: ++seq,
          stepIndex: idx,
          burstIndex: b,
        });
      }
    });

    workQueue.sort((a, b) => {
      if (a.atMs !== b.atMs) return a.atMs - b.atMs;
      const priority = (k: ScheduledWorkItem["kind"]) =>
        k === "fault_apply" || k === "fault_recover"
          ? 0
          : k === "purge_request" || k === "purge_apply"
            ? 1
            : 2;
      const diff = priority(a.kind) - priority(b.kind);
      return diff !== 0 ? diff : a.seq - b.seq;
    });

    // Track coalesced cache fills per (edgeId, cacheKey, atMs)
    const coalescedThisTick = new Set<string>();
    let lastTickSeen = -1;

    for (const item of workQueue) {
      if (events.length >= parsed.limits.maxEvents) break;
      if (item.atMs > parsed.limits.maxVirtualDurationMs) break;

      if (item.atMs !== lastTickSeen) {
        coalescedThisTick.clear();
        lastTickSeen = item.atMs;
      }

      if (item.kind === "fault_apply") {
        const fault = parsed.faults.find((f) => f.id === item.faultId);
        if (!fault) continue;
        if (fault.type === "resolver_down" && runtime.resolvers[fault.targetId]) {
          runtime.resolvers[fault.targetId]!.healthy = false;
        } else if (fault.type === "auth_dns_down") {
          for (const z of dnsConfig.zones) {
            if (z.zoneName === fault.targetId || z.nameservers.includes(fault.targetId)) {
              z.healthy = false;
            }
          }
        } else if (fault.type === "edge_outage" && runtime.edges[fault.targetId]) {
          runtime.edges[fault.targetId]!.healthy = false;
          emitEvent({
            type: "cdn.edge.unavailable",
            atMs: item.atMs,
            durationMs: 5,
            edgeId: fault.targetId,
            region: runtime.edges[fault.targetId]!.region,
            reason: fault.description || "Edge health probe failed.",
            explanation: `CDN edge "${runtime.edges[fault.targetId]!.name}" (${runtime.edges[fault.targetId]!.region}) marked UNAVAILABLE.`,
          });
        } else if (fault.type === "regional_outage") {
          for (const edge of Object.values(runtime.edges)) {
            if (edge.region === fault.targetId) {
              edge.healthy = false;
              emitEvent({
                type: "cdn.edge.unavailable",
                atMs: item.atMs,
                durationMs: 5,
                edgeId: edge.id,
                region: edge.region,
                reason: `Regional outage in ${fault.targetId}.`,
                explanation: `Edge "${edge.name}" down due to regional outage in "${fault.targetId}".`,
              });
            }
          }
          for (const origin of Object.values(runtime.origins)) {
            if (origin.region === fault.targetId) origin.healthy = false;
          }
        } else if (fault.type === "origin_down" && runtime.origins[fault.targetId]) {
          runtime.origins[fault.targetId]!.healthy = false;
        } else if (fault.type === "latency_spike") {
          latencySpikes[fault.targetId] = (latencySpikes[fault.targetId] ?? 0) + (fault.addedLatencyMs ?? 150);
        }

        emitEvent({
          type: "global.fault.applied",
          atMs: item.atMs,
          durationMs: 5,
          faultId: fault.id,
          faultType: fault.type,
          targetId: fault.targetId,
          explanation: `Network fault injected: ${fault.type} on "${fault.targetId}" — ${fault.description}`,
        });
        continue;
      }

      if (item.kind === "fault_recover") {
        const fault = parsed.faults.find((f) => f.id === item.faultId);
        if (!fault) continue;
        if (fault.type === "resolver_down" && runtime.resolvers[fault.targetId]) {
          runtime.resolvers[fault.targetId]!.healthy = true;
        } else if (fault.type === "auth_dns_down") {
          for (const z of dnsConfig.zones) z.healthy = true;
        } else if (fault.type === "edge_outage" && runtime.edges[fault.targetId]) {
          runtime.edges[fault.targetId]!.healthy = true;
        } else if (fault.type === "origin_down" && runtime.origins[fault.targetId]) {
          runtime.origins[fault.targetId]!.healthy = true;
        } else if (fault.type === "latency_spike") {
          delete latencySpikes[fault.targetId];
        }
        continue;
      }

      if (item.kind === "purge_request") {
        const purge = parsed.purges.find((p) => p.id === item.purgeId);
        if (!purge) continue;
        emitEvent({
          type: "cdn.purge.requested",
          atMs: item.atMs,
          durationMs: 5,
          purgeId: purge.id,
          pathPattern: purge.pathPattern,
          mode: purge.mode,
          explanation: `Cache invalidation (${purge.mode} purge) requested for "${purge.pathPattern}".`,
        });
        emitEvent({
          type: "cdn.purge.propagation.started",
          atMs: item.atMs,
          durationMs: parsed.cdn.purgePropagationDelayMs,
          purgeId: purge.id,
          edgeCount: Object.keys(runtime.edges).length,
          propagationDelayMs: parsed.cdn.purgePropagationDelayMs,
          explanation: `Propagating purge "${purge.pathPattern}" across ${Object.keys(runtime.edges).length} CDN edges (modeled propagation delay: ${parsed.cdn.purgePropagationDelayMs}ms).`,
        });
        continue;
      }

      if (item.kind === "purge_apply") {
        let totalEvicted = 0;
        for (const edge of Object.values(runtime.edges)) {
          let edgeEvicted = 0;
          for (const [k, entry] of Object.entries(edge.cacheEntries)) {
            if (EdgeCacheEngine.matchesPurge(entry.path, item.pathPattern, item.mode)) {
              delete edge.cacheEntries[k];
              edgeEvicted += 1;
              totalEvicted += 1;
              emitEvent({
                type: "cdn.cache.entry.evicted",
                atMs: item.atMs,
                durationMs: 1,
                edgeId: edge.id,
                cacheKey: k,
                reason: `Purge (${item.mode}: ${item.pathPattern})`,
                explanation: `Purged cached object "${entry.path}" from edge "${edge.name}".`,
              });
            }
          }
          emitEvent({
            type: "cdn.purge.edge.applied",
            atMs: item.atMs,
            durationMs: 2,
            purgeId: item.purgeId,
            edgeId: edge.id,
            evictedKeys: edgeEvicted,
            explanation: `Purge applied to "${edge.name}" (${edgeEvicted} key(s) evicted).`,
          });
        }
        // Clear shield cache entries too
        for (const [k, entry] of Object.entries(runtime.originShield.cacheEntries)) {
          if (EdgeCacheEngine.matchesPurge(entry.path, item.pathPattern, item.mode)) {
            delete runtime.originShield.cacheEntries[k];
          }
        }
        emitEvent({
          type: "cdn.purge.completed",
          atMs: item.atMs,
          durationMs: 2,
          purgeId: item.purgeId,
          totalEvictedKeys: totalEvicted,
          explanation: `Global cache invalidation "${item.purgeId}" completed (${totalEvicted} total edge entries removed).`,
        });
        continue;
      }

      // HTTP Request Execution Path (DNS -> CDN Edge Selection -> Edge Cache -> Shield -> Origin)
      const step = parsed.requests[item.stepIndex]!;
      const client = parsed.clients.find((c) => c.id === step.clientId) ?? parsed.clients[0]!;
      const requestId = `${step.id}-b${item.burstIndex + 1}`;
      const queryId = `dns-${requestId}`;

      regionalCounts[client.region] = (regionalCounts[client.region] ?? 0) + 1;

      const dnsTrace = DnsResolutionEngine.resolve(
        queryId,
        client,
        step.domain,
        step.recordType,
        item.atMs,
        dnsConfig,
        runtime,
        weightedCursorRef,
        emitEvent
      );
      runtime.recentDnsTraces.push(dnsTrace);

      const dnsMs = dnsTrace.resolutionLatencyMs;
      if (dnsTrace.rcode !== "NOERROR" || dnsTrace.answers.length === 0) {
        const failedBreakdown: RequestLatencyBreakdown = {
          requestId,
          clientId: client.id,
          clientRegion: client.region,
          domain: step.domain,
          path: step.path,
          atMs: item.atMs,
          dnsMs,
          connectTlsMs: 0,
          edgeLookupMs: 0,
          shieldMs: 0,
          originFetchMs: 0,
          transferMs: 0,
          totalMs: dnsMs,
          cacheStatus: "ERROR",
          statusCode: dnsTrace.rcode === "NXDOMAIN" ? 404 : 502,
          explanation: `Request aborted during DNS resolution (${dnsTrace.rcode}): ${dnsTrace.explanation}`,
        };
        runtime.recentRequests.push(failedBreakdown);
        continue;
      }

      let cursorMs = item.atMs + dnsMs;

      // Direct-to-Origin fallback when CDN disabled
      if (!parsed.cdn.enabled || parsed.cdn.edges.length === 0) {
        const origin =
          parsed.origins.find(
            (o) => runtime.origins[o.id]?.healthy && dnsTrace.answers.includes(o.ipAddress)
          ) ??
          parsed.origins.find((o) => runtime.origins[o.id]?.healthy);

        if (!origin) {
          runtime.recentRequests.push({
            requestId,
            clientId: client.id,
            clientRegion: client.region,
            domain: step.domain,
            path: step.path,
            atMs: item.atMs,
            dnsMs,
            connectTlsMs: 0,
            edgeLookupMs: 0,
            shieldMs: 0,
            originFetchMs: 0,
            transferMs: 0,
            totalMs: dnsMs + 100,
            cacheStatus: "ERROR",
            statusCode: 502,
            explanation: `All origins unavailable; direct origin connection failed (502 Bad Gateway).`,
          });
          continue;
        }

        const originRt = runtime.origins[origin.id]!;
        originRt.requestCount += 1;
        const originMs =
          origin.networkLatencyFromEdgeMs +
          origin.processingLatencyMs +
          (latencySpikes[origin.id] ?? 0);
        const connectTlsMs = 12;
        const breakdown: RequestLatencyBreakdown = {
          requestId,
          clientId: client.id,
          clientRegion: client.region,
          domain: step.domain,
          path: step.path,
          atMs: item.atMs,
          dnsMs,
          connectTlsMs,
          edgeLookupMs: 0,
          shieldMs: 0,
          originFetchMs: originMs,
          transferMs: 4,
          totalMs: dnsMs + connectTlsMs + originMs + 4,
          cacheStatus: "BYPASS",
          selectedOriginId: origin.id,
          statusCode: origin.resources[step.path]?.status ?? 200,
          explanation: `CDN bypassed/disabled; routed directly via DNS (${dnsTrace.answers[0]}) to Origin "${origin.name}" (${origin.region}).`,
        };
        runtime.recentRequests.push(breakdown);
        emitEvent({
          type: "cdn.origin.fetch.completed",
          atMs: cursorMs + connectTlsMs + originMs,
          durationMs: originMs,
          requestId,
          originId: origin.id,
          breakdown,
          explanation: breakdown.explanation,
        });
        continue;
      }

      // CDN Edge Selection
      const edgeSelection = CdnEdgeSelectionEngine.selectEdge(
        requestId,
        client.region,
        dnsTrace.answers,
        parsed.cdn,
        runtime.edges,
        cursorMs,
        latencySpikes,
        emitEvent
      );

      if (!edgeSelection.selectedEdge) {
        runtime.recentRequests.push({
          requestId,
          clientId: client.id,
          clientRegion: client.region,
          domain: step.domain,
          path: step.path,
          atMs: item.atMs,
          dnsMs,
          connectTlsMs: 0,
          edgeLookupMs: 0,
          shieldMs: 0,
          originFetchMs: 0,
          transferMs: 0,
          totalMs: dnsMs + 10,
          cacheStatus: "ERROR",
          statusCode: 503,
          explanation: edgeSelection.explanation,
        });
        continue;
      }

      const selectedEdge = edgeSelection.selectedEdge;
      const edgeRt = runtime.edges[selectedEdge.id]!;
      const connectTlsMs = edgeSelection.clientToEdgeLatencyMs;
      cursorMs += connectTlsMs;

      const cacheKey = EdgeCacheEngine.computeCacheKey(
        step.domain,
        step.path,
        step.headers,
        parsed.cdn.cachePolicy
      );
      const edgeLookupMs = selectedEdge.processingLatencyMs;

      emitEvent({
        type: "cdn.cache.lookup.started",
        atMs: cursorMs,
        durationMs: edgeLookupMs,
        requestId,
        edgeId: selectedEdge.id,
        cacheKey,
        explanation: `Edge "${selectedEdge.name}" checking HTTP cache for key "${cacheKey}".`,
      });
      cursorMs += edgeLookupMs;

      const existingEntry = edgeRt.cacheEntries[cacheKey];
      const sameTickUncoalescedMiss =
        Boolean(existingEntry) &&
        existingEntry!.insertedAtMs === item.atMs &&
        !parsed.cdn.cachePolicy.coalesceRequests;
      const freshness = sameTickUncoalescedMiss
        ? "miss"
        : EdgeCacheEngine.evaluateEntryFreshness(
            existingEntry,
            item.atMs,
            parsed.cdn.cachePolicy
          );

      // Fresh HIT path
      if (freshness === "fresh" && existingEntry) {
        existingEntry.hitCount += 1;
        edgeRt.hitCount += 1;
        emitEvent({
          type: "cdn.cache.hit",
          atMs: cursorMs,
          durationMs: 2,
          requestId,
          edgeId: selectedEdge.id,
          cacheKey,
          ageMs: item.atMs - existingEntry.insertedAtMs,
          explanation: `CDN Edge cache HIT on "${selectedEdge.name}" for "${step.path}" (age ${Math.round((item.atMs - existingEntry.insertedAtMs) / 1000)}s, origin bypassed).`,
        });

        const breakdown: RequestLatencyBreakdown = {
          requestId,
          clientId: client.id,
          clientRegion: client.region,
          domain: step.domain,
          path: step.path,
          atMs: item.atMs,
          dnsMs,
          connectTlsMs,
          edgeLookupMs,
          shieldMs: 0,
          originFetchMs: 0,
          transferMs: 3,
          totalMs: dnsMs + connectTlsMs + edgeLookupMs + 3,
          cacheStatus: "HIT",
          selectedEdgeId: selectedEdge.id,
          selectedEdgeRegion: selectedEdge.region,
          statusCode: existingEntry.status,
          explanation: `Edge HIT on "${selectedEdge.name}" (${selectedEdge.region}) in ${dnsMs + connectTlsMs + edgeLookupMs + 3}ms.`,
        };
        runtime.recentRequests.push(breakdown);
        emitEvent({
          type: "cdn.origin.fetch.completed",
          atMs: cursorMs + 3,
          durationMs: 3,
          requestId,
          originId: "edge-cache",
          breakdown,
          explanation: breakdown.explanation,
        });
        continue;
      }

      // Expired / Miss / Revalidate path
      if (freshness === "expired" || freshness === "stale_revalidate") {
        emitEvent({
          type: "cdn.cache.stale",
          atMs: cursorMs,
          durationMs: 1,
          requestId,
          edgeId: selectedEdge.id,
          cacheKey,
          policy:
            freshness === "stale_revalidate"
              ? "stale-while-revalidate"
              : parsed.cdn.cachePolicy.staleIfErrorSeconds > 0
                ? "stale-if-error"
                : "must-revalidate",
          explanation: `Cached object "${cacheKey}" expired at +${existingEntry?.expiresAtMs}ms; contacting upstream.`,
        });
      } else {
        emitEvent({
          type: "cdn.cache.miss",
          atMs: cursorMs,
          durationMs: 1,
          requestId,
          edgeId: selectedEdge.id,
          cacheKey,
          explanation: `CDN Edge cache MISS on "${selectedEdge.name}" for "${cacheKey}".`,
        });
      }

      // Check Request Coalescing on identical timestamp stampedes
      const coalesceKey = `${selectedEdge.id}:${cacheKey}`;
      if (parsed.cdn.cachePolicy.coalesceRequests && coalescedThisTick.has(coalesceKey)) {
        edgeRt.hitCount += 1;
        const breakdown: RequestLatencyBreakdown = {
          requestId,
          clientId: client.id,
          clientRegion: client.region,
          domain: step.domain,
          path: step.path,
          atMs: item.atMs,
          dnsMs,
          connectTlsMs,
          edgeLookupMs,
          shieldMs: 0,
          originFetchMs: 25, // awaited in-flight origin fill
          transferMs: 3,
          totalMs: dnsMs + connectTlsMs + edgeLookupMs + 28,
          cacheStatus: "HIT",
          selectedEdgeId: selectedEdge.id,
          selectedEdgeRegion: selectedEdge.region,
          statusCode: 200,
          explanation: `Coalesced concurrent cache miss on "${selectedEdge.name}" (avoided redundant origin fetch).`,
        };
        runtime.recentRequests.push(breakdown);
        continue;
      }

      edgeRt.missCount += 1;
      coalescedThisTick.add(coalesceKey);

      // Origin Shield Lookup (if enabled & healthy)
      let shieldMs = 0;
      if (parsed.cdn.originShield.enabled && runtime.originShield.healthy) {
        shieldMs =
          parsed.cdn.originShield.edgeToShieldLatencyMs +
          parsed.cdn.originShield.processingLatencyMs;
        emitEvent({
          type: "cdn.shield.lookup",
          atMs: cursorMs,
          durationMs: shieldMs,
          requestId,
          cacheKey,
          explanation: `Edge "${selectedEdge.name}" forwarding miss to Origin Shield (${parsed.cdn.originShield.region}).`,
        });
        cursorMs += shieldMs;

        const shieldEntry = runtime.originShield.cacheEntries[cacheKey];
        if (shieldEntry && item.atMs < shieldEntry.expiresAtMs) {
          runtime.originShield.hitCount += 1;
          shieldEntry.hitCount += 1;
          edgeRt.cacheEntries[cacheKey] = {
            ...shieldEntry,
            edgeId: selectedEdge.id,
            insertedAtMs: item.atMs,
          };
          emitEvent({
            type: "cdn.shield.hit",
            atMs: cursorMs,
            durationMs: 2,
            requestId,
            cacheKey,
            explanation: `Origin Shield HIT for "${cacheKey}"! Origin spared.`,
          });
          const breakdown: RequestLatencyBreakdown = {
            requestId,
            clientId: client.id,
            clientRegion: client.region,
            domain: step.domain,
            path: step.path,
            atMs: item.atMs,
            dnsMs,
            connectTlsMs,
            edgeLookupMs,
            shieldMs,
            originFetchMs: 0,
            transferMs: 3,
            totalMs: dnsMs + connectTlsMs + edgeLookupMs + shieldMs + 3,
            cacheStatus: "HIT",
            selectedEdgeId: selectedEdge.id,
            selectedEdgeRegion: selectedEdge.region,
            statusCode: shieldEntry.status,
            explanation: `Served via Origin Shield cache HIT (+${shieldMs}ms shield RTT; 0 origin fetches).`,
          };
          runtime.recentRequests.push(breakdown);
          continue;
        }
        runtime.originShield.missCount += 1;
        emitEvent({
          type: "cdn.shield.miss",
          atMs: cursorMs,
          durationMs: 2,
          requestId,
          cacheKey,
          explanation: `Origin Shield MISS for "${cacheKey}"; fetching from Origin.`,
        });
      }

      // Origin Selection (Healthy Primary -> Healthy Secondary Failover)
      const healthyOrigin =
        parsed.origins.find((o) => o.role === "primary" && runtime.origins[o.id]?.healthy) ??
        parsed.origins.find((o) => runtime.origins[o.id]?.healthy);

      if (!healthyOrigin) {
        // Check Stale-If-Error policy!
        if (
          existingEntry &&
          parsed.cdn.cachePolicy.staleIfErrorSeconds > 0 &&
          item.atMs <=
            existingEntry.expiresAtMs + parsed.cdn.cachePolicy.staleIfErrorSeconds * 1000
        ) {
          edgeRt.staleServedCount += 1;
          emitEvent({
            type: "cdn.cache.stale",
            atMs: cursorMs,
            durationMs: 5,
            requestId,
            edgeId: selectedEdge.id,
            cacheKey,
            policy: "stale-if-error",
            explanation: `Origin unavailable; serving cached response via stale-if-error (${parsed.cdn.cachePolicy.staleIfErrorSeconds}s window).`,
          });
          const staleBreakdown: RequestLatencyBreakdown = {
            requestId,
            clientId: client.id,
            clientRegion: client.region,
            domain: step.domain,
            path: step.path,
            atMs: item.atMs,
            dnsMs,
            connectTlsMs,
            edgeLookupMs,
            shieldMs,
            originFetchMs: 20,
            transferMs: 3,
            totalMs: dnsMs + connectTlsMs + edgeLookupMs + shieldMs + 23,
            cacheStatus: "STALE",
            selectedEdgeId: selectedEdge.id,
            selectedEdgeRegion: selectedEdge.region,
            statusCode: existingEntry.status,
            explanation: `Served STALE response (${existingEntry.status}) because origins are unreachable within stale-if-error window.`,
          };
          runtime.recentRequests.push(staleBreakdown);
          continue;
        }

        const primaryId = parsed.origins[0]?.id ?? "origin";
        if (runtime.origins[primaryId]) runtime.origins[primaryId]!.errorCount += 1;
        emitEvent({
          type: "cdn.origin.fetch.failed",
          atMs: cursorMs + 40,
          durationMs: 40,
          requestId,
          originId: primaryId,
          reason: "All configured origins unhealthy (502 Bad Gateway).",
          explanation: `Origin fetch FAILED for "${step.path}": no healthy origin servers available.`,
        });
        runtime.recentRequests.push({
          requestId,
          clientId: client.id,
          clientRegion: client.region,
          domain: step.domain,
          path: step.path,
          atMs: item.atMs,
          dnsMs,
          connectTlsMs,
          edgeLookupMs,
          shieldMs,
          originFetchMs: 40,
          transferMs: 0,
          totalMs: dnsMs + connectTlsMs + edgeLookupMs + shieldMs + 40,
          cacheStatus: "ERROR",
          selectedEdgeId: selectedEdge.id,
          selectedEdgeRegion: selectedEdge.region,
          statusCode: 502,
          explanation: `Origin fetch failed (502 Bad Gateway) — all origins unavailable.`,
        });
        continue;
      }

      // Origin Fetch Execution
      const originRt = runtime.origins[healthyOrigin.id]!;
      originRt.requestCount += 1;
      const resource = healthyOrigin.resources[step.path] ?? healthyOrigin.resources["*"];
      const originFetchMs =
        healthyOrigin.networkLatencyFromEdgeMs +
        healthyOrigin.processingLatencyMs +
        (latencySpikes[healthyOrigin.id] ?? 0);

      emitEvent({
        type: "cdn.origin.fetch.started",
        atMs: cursorMs,
        durationMs: originFetchMs,
        requestId,
        originId: healthyOrigin.id,
        path: step.path,
        explanation: `Edge "${selectedEdge.name}" initiated origin fetch to "${healthyOrigin.name}" (${healthyOrigin.region}) for "${step.path}".`,
      });

      // Conditional Revalidation check (If-None-Match -> 304 Not Modified)
      const isRevalidation =
        Boolean(existingEntry) &&
        parsed.cdn.cachePolicy.etagSupport &&
        resource?.etag === existingEntry?.etag;

      if (isRevalidation && existingEntry) {
        edgeRt.revalidatedCount += 1;
        emitEvent({
          type: "cdn.cache.revalidation.started",
          atMs: cursorMs,
          durationMs: 5,
          requestId,
          edgeId: selectedEdge.id,
          ifNoneMatch: existingEntry.etag,
          explanation: `Edge sending conditional If-None-Match: ${existingEntry.etag} to "${healthyOrigin.name}".`,
        });
        cursorMs += originFetchMs;
        const maxAge = parsed.cdn.cachePolicy.sMaxAgeSeconds ?? parsed.cdn.cachePolicy.maxAgeSeconds;
        existingEntry.expiresAtMs = item.atMs + maxAge * 1000;
        existingEntry.insertedAtMs = item.atMs;

        emitEvent({
          type: "cdn.cache.revalidation.completed",
          atMs: cursorMs,
          durationMs: 2,
          requestId,
          edgeId: selectedEdge.id,
          statusCode: 304,
          explanation: `Origin "${healthyOrigin.name}" returned 304 Not Modified (ETag ${existingEntry.etag} unchanged); edge TTL refreshed.`,
        });

        const revalBreakdown: RequestLatencyBreakdown = {
          requestId,
          clientId: client.id,
          clientRegion: client.region,
          domain: step.domain,
          path: step.path,
          atMs: item.atMs,
          dnsMs,
          connectTlsMs,
          edgeLookupMs,
          shieldMs,
          originFetchMs,
          transferMs: 2,
          totalMs: dnsMs + connectTlsMs + edgeLookupMs + shieldMs + originFetchMs + 2,
          cacheStatus: "REVALIDATED",
          selectedEdgeId: selectedEdge.id,
          selectedEdgeRegion: selectedEdge.region,
          selectedOriginId: healthyOrigin.id,
          statusCode: 304,
          explanation: `Revalidated stale object via ETag ${existingEntry.etag} (304 Not Modified).`,
        };
        runtime.recentRequests.push(revalBreakdown);
        continue;
      }

      emitEvent({
        type: "cdn.origin.request.received",
        atMs: cursorMs + Math.round(healthyOrigin.networkLatencyFromEdgeMs),
        durationMs: healthyOrigin.processingLatencyMs,
        requestId,
        originId: healthyOrigin.id,
        explanation: `Origin "${healthyOrigin.name}" processing ${step.method} ${step.path}.`,
      });
      cursorMs += originFetchMs;

      const respStatus = resource?.status ?? 200;
      emitEvent({
        type: "cdn.origin.response.generated",
        atMs: cursorMs,
        durationMs: 2,
        requestId,
        originId: healthyOrigin.id,
        statusCode: respStatus,
        explanation: `Origin "${healthyOrigin.name}" returned HTTP ${respStatus} (${resource?.sizeBytes ?? 4096} bytes).`,
      });

      const cacheEval = EdgeCacheEngine.isCacheableResponse(
        parsed.cdn.cachePolicy,
        resource,
        step.headers
      );
      if (cacheEval.cacheable && step.method === "GET") {
        const storedEntry = {
          cacheKey,
          edgeId: selectedEdge.id,
          path: step.path,
          etag: resource?.etag ?? '"v1-default"',
          lastModified: resource?.lastModified ?? "2026-11-12T00:00:00Z",
          status: respStatus,
          insertedAtMs: item.atMs,
          expiresAtMs: item.atMs + cacheEval.effectiveMaxAgeSec * 1000,
          staleUntilMs:
            item.atMs +
            (cacheEval.effectiveMaxAgeSec + parsed.cdn.cachePolicy.staleIfErrorSeconds) * 1000,
          revalidateUntilMs:
            item.atMs +
            (cacheEval.effectiveMaxAgeSec + parsed.cdn.cachePolicy.staleWhileRevalidateSeconds) *
              1000,
          hitCount: 0,
          bodyPreview: resource?.bodyPreview ?? '{"ok":true}',
        };
        edgeRt.cacheEntries[cacheKey] = storedEntry;
        if (parsed.cdn.originShield.enabled && runtime.originShield.healthy) {
          runtime.originShield.cacheEntries[cacheKey] = {
            ...storedEntry,
            edgeId: parsed.cdn.originShield.id,
          };
        }
        emitEvent({
          type: "cdn.cache.entry.stored",
          atMs: cursorMs,
          durationMs: 1,
          edgeId: selectedEdge.id,
          cacheKey,
          ttlSeconds: cacheEval.effectiveMaxAgeSec,
          explanation: `Edge "${selectedEdge.name}" cached "${cacheKey}" for ${cacheEval.effectiveMaxAgeSec}s.`,
        });
      }

      const breakdown: RequestLatencyBreakdown = {
        requestId,
        clientId: client.id,
        clientRegion: client.region,
        domain: step.domain,
        path: step.path,
        atMs: item.atMs,
        dnsMs,
        connectTlsMs,
        edgeLookupMs,
        shieldMs,
        originFetchMs,
        transferMs: 4,
        totalMs: dnsMs + connectTlsMs + edgeLookupMs + shieldMs + originFetchMs + 4,
        cacheStatus: cacheEval.cacheable ? "MISS" : "BYPASS",
        selectedEdgeId: selectedEdge.id,
        selectedEdgeRegion: selectedEdge.region,
        selectedOriginId: healthyOrigin.id,
        statusCode: respStatus,
        explanation: cacheEval.cacheable
          ? `Edge MISS fetched from Origin "${healthyOrigin.name}" (${originFetchMs}ms) and cached response.`
          : `Cache BYPASS (${cacheEval.reason}) fetched from Origin "${healthyOrigin.name}".`,
      };
      runtime.recentRequests.push(breakdown);
      emitEvent({
        type: "cdn.origin.fetch.completed",
        atMs: cursorMs + 4,
        durationMs: 4,
        requestId,
        originId: healthyOrigin.id,
        breakdown,
        explanation: breakdown.explanation,
      });
    }

    const finalMetrics = computeMetrics(
      runtime.recentDnsTraces,
      runtime.recentRequests,
      regionalCounts,
      runtime.originShield.hitCount,
      runtime.originShield.missCount
    );
    runtime.metrics = finalMetrics;

    emitEvent({
      type: "run.completed",
      atMs: runtime.virtualTimeMs + 10,
      durationMs: 5,
      outcome: "success",
      terminalNodeId: parsed.origins[0]?.id ?? "origin",
      terminalReason: `Global Network simulation finished (${finalMetrics.totalHttpRequests} reqs, ${finalMetrics.cdnHitRatioPct}% CDN cache hit ratio, p95=${finalMetrics.p95LatencyMs}ms).`,
      totalHops: events.length,
      explanation: `Global delivery simulation completed: ${finalMetrics.dnsHitRatioPct}% DNS hit rate, ${finalMetrics.cdnHitRatioPct}% CDN hit rate, ${finalMetrics.originOffloadPct}% origin offload.`,
    });

    const runId = `gn-run-${parsed.id}`;
    const frames: VisualizationFrame[] = events.map((event, idx) => ({
      frameIndex: idx,
      virtualTimeMs: event.atMs,
      activeNodeIds: [
        event.type.startsWith("dns")
          ? "dns"
          : event.type.startsWith("cdn.origin")
            ? "origin"
            : event.type.startsWith("cdn.shield")
              ? "shield"
              : "cdn",
      ],
      activeEdgeIds: [],
      activeEvent: event,
      direction: "request",
      stepTitle: event.type.replace(/\./g, " ").toUpperCase(),
      stepExplanation: event.explanation,
      runtimeState: event.stateSnapshot || RuntimeStateHelper.cloneState(baseRuntime),
    }));

    const config: ExecutionConfiguration = {
      version: 1,
      presetId: parsed.presetId || parsed.id,
      entryNodeId: parsed.clients[0]?.id ?? "client",
      request: {
        id: `req_${runId}`,
        method: "GET",
        path: parsed.requests[0]?.path ?? "/",
        headers: { "content-type": "application/json" },
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxHops: 50,
        maxEvents: parsed.limits.maxEvents,
        maxDurationMs: parsed.limits.maxVirtualDurationMs,
      },
      timing: { nodeDurationMs: 10, edgeDurationMs: 5 },
    };

    return {
      runId,
      architectureId: "arch_global_network_sim",
      architectureRevisionId: parsed.architectureRevisionId,
      snapshotHash: `hash_gn_${parsed.id}`,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: ["client", "dns", "cdn-edge", "origin"],
      traversedEdgeIds: [],
      configuration: config,
      events,
      totalDurationMs: runtime.virtualTimeMs,
      totalEvents: events.length,
      totalHops: 4,
      outcome: "success",
      terminalReason: `Global network simulation completed cleanly (${finalMetrics.totalHttpRequests} requests).`,
      frames,
    };
  }
}

function computeMetrics(
  dnsTraces: ModeledGlobalNetworkRuntimeState["recentDnsTraces"],
  requests: RequestLatencyBreakdown[],
  regionalCounts: Record<string, number>,
  shieldHits = 0,
  shieldMisses = 0
): GlobalNetworkMetrics {
  const totalDnsQueries = dnsTraces.length;
  const dnsCacheHits = dnsTraces.filter(
    (d) => d.cacheOutcome === "hit" || d.cacheOutcome === "negative_hit"
  ).length;
  const dnsCacheMisses = totalDnsQueries - dnsCacheHits;
  const dnsHitRatioPct =
    totalDnsQueries > 0 ? Math.round((dnsCacheHits / totalDnsQueries) * 100) : 0;
  const avgDnsLatencyMs =
    totalDnsQueries > 0
      ? Math.round(dnsTraces.reduce((s, d) => s + d.resolutionLatencyMs, 0) / totalDnsQueries)
      : 0;

  const totalHttpRequests = requests.length;
  const cdnCacheHits = requests.filter((r) => r.cacheStatus === "HIT").length;
  const cdnRevalidations = requests.filter((r) => r.cacheStatus === "REVALIDATED").length;
  const cdnStaleResponses = requests.filter((r) => r.cacheStatus === "STALE").length;
  const cdnCacheMisses = requests.filter((r) => r.cacheStatus === "MISS").length;
  const originRequests = requests.filter((r) => Boolean(r.selectedOriginId)).length;
  const successCount = requests.filter((r) => r.statusCode < 400).length;
  const errorCount = totalHttpRequests - successCount;

  const cdnHitRatioPct =
    totalHttpRequests > 0
      ? Math.round(((cdnCacheHits + cdnStaleResponses) / totalHttpRequests) * 100)
      : 0;
  const originOffloadPct =
    totalHttpRequests > 0
      ? Math.max(0, Math.round(((totalHttpRequests - originRequests) / totalHttpRequests) * 100))
      : 0;

  const latencies = requests.map((r) => r.totalMs).sort((a, b) => a - b);
  const percentile = (p: number) => {
    if (latencies.length === 0) return 0;
    const idx = Math.min(latencies.length - 1, Math.floor(latencies.length * p));
    return Math.round(latencies[idx]!);
  };

  return {
    totalDnsQueries,
    dnsCacheHits,
    dnsCacheMisses,
    dnsHitRatioPct,
    avgDnsLatencyMs,
    totalHttpRequests,
    cdnCacheHits,
    cdnCacheMisses,
    cdnRevalidations,
    cdnStaleResponses,
    cdnHitRatioPct,
    originRequests,
    originOffloadPct,
    shieldHits,
    shieldMisses,
    successCount,
    errorCount,
    p50LatencyMs: percentile(0.5),
    p95LatencyMs: percentile(0.95),
    p99LatencyMs: percentile(0.99),
    regionalCounts: { ...regionalCounts },
  };
}
