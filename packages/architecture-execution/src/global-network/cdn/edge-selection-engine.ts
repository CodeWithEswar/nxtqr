import type {
  CdnConfiguration,
  CdnEdgeConfig,
  CdnEdgeRuntimeState,
} from "../global-network-schemas";

export class CdnEdgeSelectionEngine {
  public static selectEdge(
    requestId: string,
    clientRegion: string,
    dnsAnswers: string[],
    cdnConfig: CdnConfiguration,
    edgesState: Record<string, CdnEdgeRuntimeState>,
    atMs: number,
    latencySpikes: Record<string, number>,
    emit: (evt: Record<string, unknown>) => void
  ): {
    selectedEdge?: CdnEdgeConfig;
    clientToEdgeLatencyMs: number;
    explanation: string;
  } {
    emit({
      type: "cdn.edge.selection.started",
      atMs,
      durationMs: 2,
      requestId,
      clientRegion,
      strategy: cdnConfig.routingStrategy,
      explanation: `Selecting CDN edge for client in "${clientRegion}" using "${cdnConfig.routingStrategy}" routing strategy.`,
    });

    const candidates = [...cdnConfig.edges].sort((a, b) => a.id.localeCompare(b.id));
    const healthyCandidates: Array<{ edge: CdnEdgeConfig; scoreCost: number; rttMs: number }> = [];

    for (const edge of candidates) {
      const rt = edgesState[edge.id];
      const baseRtt =
        edge.networkLatencyByClientRegion[clientRegion] ??
        (edge.region === clientRegion ? 14 : 75);
      const rttMs = baseRtt + (latencySpikes[edge.id] ?? 0);
      const isHealthy = Boolean(rt?.healthy) && rt!.activeRequests < rt!.capacityRps;

      emit({
        type: "cdn.edge.candidate.evaluated",
        atMs,
        durationMs: 1,
        requestId,
        edgeId: edge.id,
        region: edge.region,
        healthy: isHealthy,
        latencyMs: rttMs,
        explanation: `Evaluated edge "${edge.name}" (${edge.region}): healthy=${isHealthy}, modeled RTT=${rttMs}ms.`,
      });

      if (!isHealthy) continue;

      let cost = rttMs;
      if (cdnConfig.routingStrategy === "dns_directed") {
        const matchesIp = edge.mappedIp && dnsAnswers.includes(edge.mappedIp);
        cost = matchesIp ? 0 : 1000 + rttMs;
      } else if (cdnConfig.routingStrategy === "geographic") {
        cost = edge.region === clientRegion ? 0 : 500 + rttMs;
      } else if (cdnConfig.routingStrategy === "anycast") {
        cost = edge.anycastCostByClientRegion[clientRegion] ?? rttMs;
      }

      healthyCandidates.push({ edge, scoreCost: cost, rttMs });
    }

    if (healthyCandidates.length === 0) {
      const reason = `No healthy/under-capacity CDN edges available for "${clientRegion}".`;
      emit({
        type: "cdn.edge.selection.failed",
        atMs,
        durationMs: 5,
        requestId,
        reason,
        explanation: reason,
      });
      return {
        clientToEdgeLatencyMs: 0,
        explanation: reason,
      };
    }

    healthyCandidates.sort((a, b) => {
      if (a.scoreCost !== b.scoreCost) return a.scoreCost - b.scoreCost;
      return a.edge.id.localeCompare(b.edge.id);
    });

    const winner = healthyCandidates[0]!;
    const explanation = `Selected edge "${winner.edge.name}" (${winner.edge.region}) via ${cdnConfig.routingStrategy} routing (RTT ${winner.rttMs}ms, cost ${winner.scoreCost}).`;

    emit({
      type: "cdn.edge.selected",
      atMs,
      durationMs: 2,
      requestId,
      edgeId: winner.edge.id,
      region: winner.edge.region,
      latencyMs: winner.rttMs,
      explanation,
    });

    return {
      selectedEdge: winner.edge,
      clientToEdgeLatencyMs: winner.rttMs,
      explanation,
    };
  }
}
