import { describe, expect, it } from "vitest";
import {
  GLOBAL_NETWORK_PRESET_METADATA,
  GlobalNetworkExecutionEngine,
  createGlobalNetworkPresetScenario,
  type ExecutionTrace,
  type ModeledGlobalNetworkRuntimeState,
} from "../index";

function getFinalState(trace: ExecutionTrace): ModeledGlobalNetworkRuntimeState {
  const lastFrame = trace.frames[trace.frames.length - 1];
  if (!lastFrame?.runtimeState?.globalNetworkState) {
    throw new Error("Expected final frame to include globalNetworkState");
  }
  return lastFrame.runtimeState.globalNetworkState;
}

describe("Phase 05.4.11: DNS Resolution, CDN Edge Routing & Global Network Engine", () => {
  it("runs all 24 presets deterministically with non-negative latencies and valid frames", () => {
    expect(GLOBAL_NETWORK_PRESET_METADATA.length).toBe(24);

    for (const meta of GLOBAL_NETWORK_PRESET_METADATA) {
      const scenario = createGlobalNetworkPresetScenario(meta.id);
      const traceA = GlobalNetworkExecutionEngine.runScenario(scenario);
      const traceB = GlobalNetworkExecutionEngine.runScenario(scenario);

      expect(traceA.frames.length).toBeGreaterThan(0);
      expect(traceA.events.length).toBe(traceB.events.length);

      const finalA = getFinalState(traceA);
      const finalB = getFinalState(traceB);

      expect(finalA.metrics).toEqual(finalB.metrics);
      expect(finalA.recentRequests.length).toBe(finalB.recentRequests.length);
      for (const req of finalA.recentRequests) {
        expect(req.dnsMs).toBeGreaterThanOrEqual(0);
        expect(req.connectTlsMs).toBeGreaterThanOrEqual(0);
        expect(req.edgeLookupMs).toBeGreaterThanOrEqual(0);
        expect(req.shieldMs).toBeGreaterThanOrEqual(0);
        expect(req.originFetchMs).toBeGreaterThanOrEqual(0);
        expect(req.transferMs).toBeGreaterThanOrEqual(0);
        expect(req.totalMs).toBeGreaterThanOrEqual(0);
      }
    }
  });

  it("models cold recursive DNS traversal versus warm stub/recursive cache hits", () => {
    const cold = GlobalNetworkExecutionEngine.runScenario(
      createGlobalNetworkPresetScenario("cold_dns_lookup")
    );
    const coldState = getFinalState(cold);
    expect(coldState.recentDnsTraces[0]?.cacheOutcome).toBe("miss");
    expect(coldState.recentDnsTraces[0]?.referralChain).toEqual([
      "Root (.) -> .com",
      "TLD (.com) -> ns1.example.net",
    ]);

    const warm = GlobalNetworkExecutionEngine.runScenario(
      createGlobalNetworkPresetScenario("warm_dns_cache")
    );
    const warmState = getFinalState(warm);
    expect(warmState.metrics.totalDnsQueries).toBe(3);
    expect(warmState.metrics.dnsCacheHits).toBe(2);
    expect(warmState.recentDnsTraces[0]?.cacheOutcome).toBe("miss");
    expect(warmState.recentDnsTraces[1]?.cacheOutcome).toBe("hit");
    expect(warmState.recentDnsTraces[1]?.referralChain).toEqual(["Stub Cache"]);
  });

  it("expires DNS records after TTL and never serves expired entries as fresh hits", () => {
    const trace = GlobalNetworkExecutionEngine.runScenario(
      createGlobalNetworkPresetScenario("ttl_expiration")
    );
    const state = getFinalState(trace);

    expect(state.recentDnsTraces).toHaveLength(3);
    expect(state.recentDnsTraces[0]?.cacheOutcome).toBe("miss");
    expect(state.recentDnsTraces[1]?.cacheOutcome).toBe("hit");
    expect(state.recentDnsTraces[2]?.cacheOutcome).toBe("expired");
    expect(state.recentDnsTraces[2]?.referralChain).toEqual([
      "Root (.) -> .com",
      "TLD (.com) -> ns1.example.net",
    ]);
  });

  it("follows CNAME chains and detects bounded CNAME loops safely", () => {
    const cnameTrace = GlobalNetworkExecutionEngine.runScenario(
      createGlobalNetworkPresetScenario("cname_chain")
    );
    const cnameState = getFinalState(cnameTrace);
    expect(cnameState.recentDnsTraces[0]?.cnameChain).toEqual([
      "app.example.com -> edge.cdn.example.net",
      "edge.cdn.example.net -> pop-us.cdn.example.net",
    ]);
    expect(cnameState.recentDnsTraces[0]?.answers).toEqual(["203.0.113.10"]);

    // Construct explicit CNAME cycle
    const loopScenario = createGlobalNetworkPresetScenario("cname_chain");
    loopScenario.dns.zones[0]!.records = [
      {
        id: "loop-a",
        name: "app.example.com",
        type: "CNAME",
        ttlSeconds: 30,
        value: "alias.example.com",
      },
      {
        id: "loop-b",
        name: "alias.example.com",
        type: "CNAME",
        ttlSeconds: 30,
        value: "app.example.com",
      },
    ];
    const loopTrace = GlobalNetworkExecutionEngine.runScenario(loopScenario);
    const loopState = getFinalState(loopTrace);
    expect(loopState.recentDnsTraces[0]?.rcode).toBe("SERVFAIL");
    expect(
      loopTrace.events.some(
        (e) =>
          e.type === "dns.resolution.failed" &&
          e.explanation.toLowerCase().includes("loop")
      )
    ).toBe(true);
  });

  it("caches negative NXDOMAIN responses for SOA minimum TTL", () => {
    const trace = GlobalNetworkExecutionEngine.runScenario(
      createGlobalNetworkPresetScenario("nxdomain_negative_cache")
    );
    const state = getFinalState(trace);

    expect(state.recentDnsTraces[0]?.rcode).toBe("NXDOMAIN");
    expect(state.recentDnsTraces[0]?.cacheOutcome).toBe("miss");
    expect(state.recentDnsTraces[1]?.rcode).toBe("NXDOMAIN");
    expect(state.recentDnsTraces[1]?.cacheOutcome).toBe("negative_hit");
    expect(state.recentRequests[0]?.statusCode).toBe(404);
  });

  it("routes geographically, weights traffic, and dynamically shifts on latency spikes", () => {
    const geoState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(
        createGlobalNetworkPresetScenario("geographic_routing")
      )
    );
    expect(geoState.recentRequests.map((r) => r.selectedEdgeRegion)).toEqual([
      "us-east",
      "eu-west",
      "ap-south",
    ]);

    const latState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(
        createGlobalNetworkPresetScenario("latency_aware_routing")
      )
    );
    expect(latState.recentRequests[0]?.selectedEdgeId).toBe("edge-us-east");
    expect(latState.recentRequests[1]?.selectedEdgeId).toBe("edge-us-west");

    const weightedState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(
        createGlobalNetworkPresetScenario("weighted_routing")
      )
    );
    const usEastHits = weightedState.recentRequests.filter(
      (r) => r.selectedEdgeId === "edge-us-east"
    ).length;
    const usWestHits = weightedState.recentRequests.filter(
      (r) => r.selectedEdgeId === "edge-us-west"
    ).length;
    expect(usEastHits).toBeGreaterThan(usWestHits);
  });

  it("models CDN cache hit, private bypass, ETag 304 revalidation, and purge propagation", () => {
    const hitState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(
        createGlobalNetworkPresetScenario("cdn_cache_hit")
      )
    );
    expect(hitState.metrics.cdnCacheHits).toBe(2);
    expect(hitState.metrics.cdnCacheMisses).toBe(1);
    expect(hitState.metrics.originRequests).toBe(1);
    expect(hitState.metrics.originOffloadPct).toBeGreaterThan(60);

    const bypassState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(
        createGlobalNetworkPresetScenario("cdn_cache_miss")
      )
    );
    expect(bypassState.recentRequests[0]?.cacheStatus).toBe("BYPASS");
    expect(bypassState.metrics.originRequests).toBe(2);

    const revalState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(
        createGlobalNetworkPresetScenario("cache_revalidation")
      )
    );
    expect(revalState.metrics.cdnRevalidations).toBe(1);
    expect(revalState.recentRequests[1]?.cacheStatus).toBe("REVALIDATED");

    const purgeState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(
        createGlobalNetworkPresetScenario("cache_invalidation")
      )
    );
    // req-2 arrives at 450ms before purge propagates at 650ms (400 + 250ms), so req-2 still hits; req-3 at 900ms misses
    expect(purgeState.recentRequests.map((r) => r.cacheStatus)).toEqual([
      "MISS",
      "HIT",
      "MISS",
    ]);
  });

  it("coalesces concurrent cache stampede bursts onto a single origin fetch", () => {
    const coalescedScenario = createGlobalNetworkPresetScenario("cache_stampede");
    coalescedScenario.cdn.cachePolicy.coalesceRequests = true;
    const coalescedState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(coalescedScenario)
    );

    const uncoalescedScenario = createGlobalNetworkPresetScenario("cache_stampede");
    uncoalescedScenario.cdn.cachePolicy.coalesceRequests = false;
    const uncoalescedState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(uncoalescedScenario)
    );

    expect(coalescedState.metrics.originRequests).toBe(1);
    expect(uncoalescedState.metrics.originRequests).toBe(5);
  });

  it("models origin shielding, stale-if-error survival, edge failover, and origin failover", () => {
    const shieldState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(
        createGlobalNetworkPresetScenario("origin_shielding")
      )
    );
    expect(shieldState.metrics.shieldMisses).toBe(1);
    expect(shieldState.metrics.shieldHits).toBe(2);
    expect(shieldState.metrics.originRequests).toBe(1);

    const staleState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(
        createGlobalNetworkPresetScenario("stale_if_error")
      )
    );
    expect(staleState.metrics.cdnStaleResponses).toBe(1);
    expect(staleState.recentRequests[1]?.cacheStatus).toBe("STALE");
    expect(staleState.recentRequests[1]?.statusCode).toBe(200);

    const edgeOutageState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(
        createGlobalNetworkPresetScenario("edge_outage")
      )
    );
    expect(edgeOutageState.recentRequests.map((r) => r.selectedEdgeId)).toEqual([
      "edge-us-east",
      "edge-us-west",
      "edge-us-east",
    ]);

    const originFailoverState = getFinalState(
      GlobalNetworkExecutionEngine.runScenario(
        createGlobalNetworkPresetScenario("origin_failover")
      )
    );
    expect(originFailoverState.recentRequests[0]?.selectedOriginId).toBe(
      "origin-primary"
    );
    expect(originFailoverState.recentRequests[1]?.selectedOriginId).toBe(
      "origin-secondary"
    );
    expect(originFailoverState.metrics.errorCount).toBe(0);
  });
});
