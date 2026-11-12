import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import { VirtualClock } from "../engine/virtual-clock";
import { ExecutionTraceHelper, type ExecutionTrace } from "../domain/execution-trace";
import { RuntimeStateHelper } from "../domain/runtime-state";
import type { ExecutionEvent } from "../domain/execution-event";
import type { ExecutionConfiguration } from "../schemas/execution.schemas";
import type { TraceSpan } from "../schemas/distributed.schemas";
import {
  DETERMINISTIC_EPOCH_ISO,
  DeterministicPrng,
  computeDeterministicDigest,
  createDeterministicId,
} from "./deterministic-id";
import { EventIntegrityVerifier } from "./event-integrity";
import { UnifiedFindingsAggregator } from "./findings-aggregator";
import type {
  CrossModuleHopRecord,
  CrossModulePipelineResult,
  ProvenancedMetric,
  SimulationRunConfig,
} from "./orchestrator-schemas";

function resolveNodeKind(node: BaseNode): string {
  const data = (node.data || {}) as Record<string, unknown>;
  const raw = String(data.componentType || node.type || "service").toLowerCase();
  if (raw === "db" || raw === "postgres" || raw === "sql") return "database";
  if (raw === "kafka" || raw === "broker" || raw === "topic") return "queue";
  if (raw === "gateway" || raw === "ingress") return "api-gateway";
  if (raw === "lb" || raw === "alb") return "load-balancer";
  if (raw === "redis" || raw === "memcached") return "cache";
  return raw;
}

function getCapacityRps(node: BaseNode, fallbackRps: number): number {
  const data = (node.data || {}) as Record<string, unknown>;
  const rawCap =
    typeof data.capacityRps === "number"
      ? data.capacityRps
      : typeof data.rateLimitRps === "number"
        ? data.rateLimitRps
        : typeof data.maxRps === "number"
          ? data.maxRps
          : fallbackRps;
  const replicas = typeof data.replicas === "number" && data.replicas >= 1 ? data.replicas : 1;
  return Math.max(1, rawCap * replicas);
}

/**
 * Composed End-to-End Multi-Module Execution Pipeline.
 * Propagates causal requests through:
 * DNS -> CDN -> API Gateway -> Auth/Zero Trust -> Rate Limiter -> Load Balancer -> Service Mesh -> Service -> Cache / Database / Queue -> Observability.
 */
export class CrossModuleExecutionPipeline {
  public static execute(params: {
    nodes: BaseNode[];
    edges: BaseEdge[];
    config: SimulationRunConfig;
    baseExecutionConfig?: Partial<ExecutionConfiguration>;
  }): CrossModulePipelineResult {
    const { nodes, edges, config, baseExecutionConfig } = params;
    const digest = computeDeterministicDigest(
      nodes.map((n) => `${n.id}:${resolveNodeKind(n)}`).join("|") + `::${config.seed}`
    );
    const runId = config.runId || createDeterministicId("unified_run", digest);
    const correlationId = createDeterministicId("corr", `${runId}:${config.seed}`, 1);
    const prng = new DeterministicPrng(config.seed);
    const clock = new VirtualClock(0);

    const requestedRps = config.incomingRps ?? 250;
    const runtimeState = RuntimeStateHelper.createInitialState();
    const events: ExecutionEvent[] = [];
    const stateSnapshots: ReturnType<typeof RuntimeStateHelper.cloneState>[] = [];
    const spans: TraceSpan[] = [];
    const hops: CrossModuleHopRecord[] = [];
    const visitedNodeIds = new Set<string>();
    const traversedEdgeIds = new Set<string>();

    let sequence = 1;
    const nextSeq = () => sequence++;

    const pickByKind = (kinds: string[]): BaseNode | undefined =>
      nodes.find((n) => kinds.includes(resolveNodeKind(n)));

    const entryNode =
      pickByKind(["client", "dns", "cdn", "api-gateway", "load-balancer", "service"]) ||
      nodes[0];

    const recordEvent = (evt: ExecutionEvent) => {
      if (events.length >= config.maxEvents) return;
      events.push(evt);
      stateSnapshots.push(RuntimeStateHelper.cloneState(runtimeState));
    };

    const requestPayload = {
      id: createDeterministicId("req", runId, 1),
      method: (baseExecutionConfig?.request?.method || "GET") as "GET" | "POST" | "PUT" | "DELETE" | "PATCH",
      path: baseExecutionConfig?.request?.path || "/api/v1/orders",
      headers: {
        "x-correlation-id": correlationId,
        "x-zero-trust-verified": config.denyAuth ? "false" : "true",
      },
      body: baseExecutionConfig?.request?.body,
    };

    if (entryNode) {
      recordEvent({
        id: createDeterministicId("evt", runId, sequence),
        sequence: nextSeq(),
        type: "run.started",
        atMs: clock.now(),
        durationMs: 0,
        entryNodeId: entryNode.id,
        request: requestPayload,
        traceId: `trace_${runId}`,
        explanation: `Unified pipeline initialized at "${entryNode.label || entryNode.id}" targeting ${requestedRps} req/s.`,
      });
    }

    // Build ordered layer candidates present in the architecture graph
    const layerOrder: Array<{
      layer: CrossModuleHopRecord["layer"];
      kinds: string[];
      baseLatencyMs: number;
      defaultRps: number;
    }> = [
      { layer: "dns", kinds: ["dns"], baseLatencyMs: 6, defaultRps: 50000 },
      { layer: "cdn", kinds: ["cdn"], baseLatencyMs: 12, defaultRps: 25000 },
      { layer: "gateway", kinds: ["api-gateway"], baseLatencyMs: 8, defaultRps: 5000 },
      { layer: "auth", kinds: ["security", "auth", "zero-trust"], baseLatencyMs: 10, defaultRps: 4000 },
      { layer: "rate-limiter", kinds: ["rate-limiter"], baseLatencyMs: 4, defaultRps: 1000 },
      { layer: "load-balancer", kinds: ["load-balancer"], baseLatencyMs: 5, defaultRps: 8000 },
      { layer: "service-mesh", kinds: ["service-mesh", "mesh"], baseLatencyMs: 7, defaultRps: 4000 },
      { layer: "service", kinds: ["service", "worker"], baseLatencyMs: 28, defaultRps: 600 },
      { layer: "cache", kinds: ["cache"], baseLatencyMs: 4, defaultRps: 3000 },
      { layer: "database", kinds: ["database", "storage"], baseLatencyMs: 36, defaultRps: 350 },
      { layer: "queue", kinds: ["queue"], baseLatencyMs: 14, defaultRps: 1500 },
    ];

    let bottleneckNodeId: string | undefined;
    let bottleneckEffectiveRps = Number.POSITIVE_INFINITY;
    let shortCircuitedAtLayer: CrossModuleHopRecord["layer"] | undefined;
    let outcome: CrossModulePipelineResult["outcome"] = "success";
    let terminalStatusCode = 200;
    let prevNodeId: string | undefined = entryNode?.id;
    let prevSpanId: string | undefined;
    let hopIndex = 0;
    const hasDedicatedAuth = Boolean(pickByKind(["security", "auth", "zero-trust"]));

    // Evaluate bottleneck among reachable components along active path first up to short-circuit
    for (const stage of layerOrder) {
      const node = pickByKind(stage.kinds);
      if (!node) continue;

      const capRps = getCapacityRps(node, stage.defaultRps);
      const isFaultTarget =
        config.faultTargetNodeId === node.id ||
        (config.faultKind === "database_outage" && stage.layer === "database") ||
        (config.faultKind === "service_degraded" && stage.layer === "service") ||
        (config.faultKind === "rate_limit_exhausted" &&
          (stage.layer === "rate-limiter" || stage.layer === "gateway"));

      if (capRps < bottleneckEffectiveRps && stage.layer !== "dns" && stage.layer !== "cdn") {
        bottleneckEffectiveRps = capRps;
        bottleneckNodeId = node.id;
      }

      if (shortCircuitedAtLayer) {
        // Record skipped downstream layer explicitly if useful? No, per causal invariant: denied/halted execution MUST NOT execute downstream hops!
        break;
      }

      const spanId = createDeterministicId("span", runId, sequence);
      const enteredAtMs = clock.now();
      const jitterMs = prng.nextInt(0, 3);
      const durationMs = stage.baseLatencyMs + jitterMs;

      visitedNodeIds.add(node.id);
      hopIndex += 1;

      if (prevNodeId && prevNodeId !== node.id) {
        const linkingEdge = edges.find(
          (e) =>
            (e.source === prevNodeId && e.target === node.id) ||
            (e.target === prevNodeId && e.source === node.id)
        );
        if (linkingEdge) {
          traversedEdgeIds.add(linkingEdge.id);
          recordEvent({
            id: createDeterministicId("evt", runId, sequence),
            sequence: nextSeq(),
            type: "edge.traversed",
            atMs: clock.now(),
            durationMs: 2,
            edgeId: linkingEdge.id,
            edgeLabel: linkingEdge.label || linkingEdge.id,
            sourceNodeId: prevNodeId,
            targetNodeId: node.id,
            protocol: "https",
            spanId,
            traceId: `trace_${runId}`,
            explanation: `Propagated request from "${prevNodeId}" to "${node.label || node.id}" via "${linkingEdge.id}".`,
          });
          clock.advance(2);
        }
      }

      recordEvent({
        id: createDeterministicId("evt", runId, sequence),
        sequence: nextSeq(),
        type: "node.entered",
        atMs: clock.now(),
        durationMs,
        nodeId: node.id,
        nodeLabel: node.label || node.id,
        componentType: resolveNodeKind(node),
        hopIndex,
        request: requestPayload,
        spanId,
        traceId: `trace_${runId}`,
        explanation: `Layer [${stage.layer.toUpperCase()}] processed request at "${node.label || node.id}" (${capRps} req/s modeled capacity).`,
      });

      // Security short-circuit invariant: deny on Zero Trust / Auth (or Gateway when no dedicated Auth node) halts downstream DB/Service calls!
      const isSecurityEnforcementStage = hasDedicatedAuth
        ? stage.layer === "auth"
        : stage.layer === "gateway";
      if (
        (config.denyAuth && isSecurityEnforcementStage) ||
        Boolean((node.data as Record<string, unknown> | undefined)?.denyAllTraffic)
      ) {
        shortCircuitedAtLayer = stage.layer;
        outcome = "blocked-security";
        terminalStatusCode = 403;

        recordEvent({
          id: createDeterministicId("evt", runId, sequence),
          sequence: nextSeq(),
          type: "zero_trust.policy.denied",
          atMs: clock.now(),
          durationMs: 1,
          nodeId: node.id,
          identityId: "spiffe://nxtqr.local/caller",
          action: `${requestPayload.method} ${requestPayload.path}`,
          reasonCode: "ZERO_TRUST_POLICY_DENIED",
          explanation: `Security policy denied request at "${node.label || node.id}" (${stage.layer}); downstream components bypassed.`,
        } as unknown as ExecutionEvent);

        hops.push({
          layer: stage.layer,
          nodeId: node.id,
          nodeLabel: node.label || node.id,
          enteredAtMs,
          durationMs,
          outcome: "denied",
          statusCode: 403,
          spanId,
          parentSpanId: prevSpanId,
          explanation: `Zero Trust / Security policy rejected request at ${node.label || node.id}.`,
        });

        spans.push({
          traceId: `trace_${runId}`,
          spanId,
          parentSpanId: prevSpanId,
          branchId: "branch_main",
          componentId: node.id,
          name: `${stage.layer}:${node.label || node.id}`,
          startMs: enteredAtMs,
          endMs: enteredAtMs + durationMs,
          durationMs,
          status: "error",
          attributes: {
            layer: stage.layer,
            outcome: "denied",
            statusCode: 403,
          },
        });

        clock.advance(durationMs);
        break;
      }

      // Rate-limiter / Token bucket overload short-circuit
      if (
        (stage.layer === "rate-limiter" && requestedRps > capRps) ||
        (isFaultTarget && config.faultKind === "rate_limit_exhausted")
      ) {
        shortCircuitedAtLayer = stage.layer;
        outcome = "throttled";
        terminalStatusCode = 429;

        recordEvent({
          id: createDeterministicId("evt", runId, sequence),
          sequence: nextSeq(),
          type: "rate_limit.rejected",
          atMs: clock.now(),
          durationMs: 1,
          nodeId: node.id,
          requestedRps,
          allowedRps: capRps,
          explanation: `Rate limiter at "${node.label || node.id}" shed excess traffic (${requestedRps} > ${capRps} req/s).`,
        } as unknown as ExecutionEvent);

        hops.push({
          layer: stage.layer,
          nodeId: node.id,
          nodeLabel: node.label || node.id,
          enteredAtMs,
          durationMs,
          outcome: "throttled",
          statusCode: 429,
          spanId,
          parentSpanId: prevSpanId,
          explanation: `HTTP 429 Too Many Requests emitted by rate limiter.`,
        });

        spans.push({
          traceId: `trace_${runId}`,
          spanId,
          parentSpanId: prevSpanId,
          branchId: "branch_main",
          componentId: node.id,
          name: `${stage.layer}:${node.label || node.id}`,
          startMs: enteredAtMs,
          endMs: enteredAtMs + durationMs,
          durationMs,
          status: "error",
          attributes: {
            layer: stage.layer,
            outcome: "denied",
            statusCode: 403,
          },
        });

        clock.advance(durationMs);
        break;
      }

      // Fault propagation (e.g., database outage or degraded downstream service)
      if (isFaultTarget && (config.faultKind === "database_outage" || config.faultKind === "service_degraded")) {
        const isOutage = config.faultKind === "database_outage";
        shortCircuitedAtLayer = stage.layer;
        outcome = isOutage ? "failed" : "degraded";
        terminalStatusCode = isOutage ? 503 : 500;

        recordEvent({
          id: createDeterministicId("evt", runId, sequence),
          sequence: nextSeq(),
          type: "database.operation.failed",
          atMs: clock.now(),
          durationMs: durationMs * 2,
          dbNodeId: node.id,
          errorMessage: `Simulated fault (${config.faultKind}) on "${node.label || node.id}" propagated upstream.`,
          explanation: `Fault "${config.faultKind}" triggered at "${node.label || node.id}", escalating upstream error budget burn.`,
        } as unknown as ExecutionEvent);

        hops.push({
          layer: stage.layer,
          nodeId: node.id,
          nodeLabel: node.label || node.id,
          enteredAtMs,
          durationMs: durationMs * 2,
          outcome: "failed",
          statusCode: terminalStatusCode,
          spanId,
          parentSpanId: prevSpanId,
          explanation: `Simulated fault (${config.faultKind}) failed downstream step.`,
        });

        spans.push({
          traceId: `trace_${runId}`,
          spanId,
          parentSpanId: prevSpanId,
          branchId: "branch_main",
          componentId: node.id,
          name: `${stage.layer}:${node.label || node.id}`,
          startMs: enteredAtMs,
          endMs: enteredAtMs + durationMs * 2,
          durationMs: durationMs * 2,
          status: "error",
          attributes: {
            layer: stage.layer,
            faultKind: config.faultKind,
            statusCode: terminalStatusCode,
          },
        });

        clock.advance(durationMs * 2);
        break;
      }

      // Healthy layer execution
      const hopOutcome: CrossModuleHopRecord["outcome"] =
        stage.layer === "cache"
          ? ((node.data as Record<string, unknown> | undefined)?.hitRatio as number | undefined) === 0
            ? "miss"
            : "hit"
          : "allowed";

      hops.push({
        layer: stage.layer,
        nodeId: node.id,
        nodeLabel: node.label || node.id,
        enteredAtMs,
        durationMs,
        outcome: hopOutcome,
        statusCode: 200,
        spanId,
        parentSpanId: prevSpanId,
        explanation: `${stage.layer} completed within ${durationMs}ms virtual window.`,
      });

      spans.push({
        traceId: `trace_${runId}`,
        spanId,
        parentSpanId: prevSpanId,
        branchId: "branch_main",
        componentId: node.id,
        name: `${stage.layer}:${node.label || node.id}`,
        startMs: enteredAtMs,
        endMs: enteredAtMs + durationMs,
        durationMs,
        status: "success",
        attributes: {
          layer: stage.layer,
          outcome: hopOutcome,
          statusCode: 200,
        },
      });

      clock.advance(durationMs);
      prevNodeId = node.id;
      prevSpanId = spanId;
    }

    // Observability synthesis hop always closes the distributed trace when execution finishes
    const obsNode = pickByKind(["observability", "monitoring"]) || entryNode;
    if (obsNode) {
      const obsSpanId = createDeterministicId("span", runId, sequence);
      hops.push({
        layer: "observability",
        nodeId: obsNode.id,
        nodeLabel: obsNode.label || obsNode.id,
        enteredAtMs: clock.now(),
        durationMs: 2,
        outcome: outcome === "success" ? "allowed" : "degraded" as any,
        statusCode: terminalStatusCode,
        spanId: obsSpanId,
        parentSpanId: prevSpanId,
        explanation: `Observability correlated ${spans.length} span(s) under correlationId ${correlationId}.`,
      });
      clock.advance(2);
    }

    // Bottleneck throughput invariant: delivered RPS CANNOT exceed the minimum active capacity along the request path!
    const finiteBottleneckRps = Number.isFinite(bottleneckEffectiveRps)
      ? bottleneckEffectiveRps
      : Math.max(1, requestedRps);

    const deliveredRps =
      outcome === "blocked-security" || outcome === "failed"
        ? 0
        : Math.min(requestedRps, finiteBottleneckRps);

    const droppedRps = Math.max(0, requestedRps - deliveredRps);
    const errorRatePercent =
      requestedRps > 0 ? Number(((droppedRps / requestedRps) * 100).toFixed(2)) : 0;

    if (outcome === "success" && droppedRps > 0) {
      outcome = "degraded";
    }

    const terminalNodeId = prevNodeId || entryNode?.id || "virtual_terminal";
    recordEvent({
      id: createDeterministicId("evt", runId, sequence),
      sequence: nextSeq(),
      type: "run.completed",
      atMs: clock.now(),
      durationMs: 0,
      outcome: outcome === "success" ? "success" : "failure",
      terminalNodeId,
      terminalReason: `Cross-module flow finished with HTTP ${terminalStatusCode} (${outcome}). Delivered ${deliveredRps}/${requestedRps} req/s.`,
      totalHops: hopIndex,
      explanation: `Unified pipeline completed across ${hops.length} layer(s) in ${clock.now()}ms virtual time.`,
    });

    const frames = ExecutionTraceHelper.generateFrames(events, stateSnapshots);
    const effectiveConfig: ExecutionConfiguration = {
      version: 1,
      entryNodeId: entryNode?.id || "entry",
      request: requestPayload,
      routing: baseExecutionConfig?.routing || { mode: "deterministic", selectedBranches: {} },
      limits: baseExecutionConfig?.limits || {
        maxHops: 50,
        maxEvents: config.maxEvents,
        maxDurationMs: config.maxDurationMs,
      },
      timing: baseExecutionConfig?.timing || { nodeDurationMs: 20, edgeDurationMs: 5 },
    };

    const trace: ExecutionTrace = {
      runId,
      architectureId: config.architectureId,
      architectureRevisionId: config.revisionId,
      snapshotHash: `sha_${digest}`,
      configuration: effectiveConfig,
      events,
      totalDurationMs: clock.now(),
      totalEvents: events.length,
      totalHops: hopIndex,
      outcome: outcome === "success" ? "success" : "failure",
      terminalReason: `HTTP ${terminalStatusCode} (${outcome})`,
      visitedNodeIds: Array.from(visitedNodeIds),
      traversedEdgeIds: Array.from(traversedEdgeIds),
      frames,
      spans,
      criticalPathSpanIds: spans.map((s) => s.spanId),
      performanceSummary: {
        totalRequests: Math.round(requestedRps),
        completedRequests: Math.round(deliveredRps),
        successfulRequests: Math.round(deliveredRps),
        failedRequests: outcome === "failed" ? Math.round(droppedRps) : 0,
        timedOutRequests: 0,
        rejectedRequests: Math.round(droppedRps),
        overallP50LatencyMs: clock.now(),
        overallP90LatencyMs: Math.round(clock.now() * 1.25),
        overallP95LatencyMs: Math.round(clock.now() * 1.35),
        overallP99LatencyMs: Math.round(clock.now() * 1.6),
        maxLatencyMs: Math.round(clock.now() * 1.8),
        meanLatencyMs: clock.now(),
        averageThroughputRps: deliveredRps,
        peakThroughputRps: deliveredRps,
        peakQueueDepth: Math.max(0, Math.round(droppedRps / 10)),
        averageUtilizationPercent:
          finiteBottleneckRps > 0
            ? Math.min(100, Number(((requestedRps / finiteBottleneckRps) * 100).toFixed(1)))
            : 0,
        bottlenecks: bottleneckNodeId
          ? [
              {
                nodeId: bottleneckNodeId,
                nodeLabel: nodes.find((n) => n.id === bottleneckNodeId)?.label || bottleneckNodeId,
                severity: droppedRps > 0 ? "critical" : "healthy",
                reason:
                  droppedRps > 0
                    ? `Ingress ${requestedRps} req/s exceeded bottleneck ceiling ${finiteBottleneckRps} req/s.`
                    : `Operating within capacity (${finiteBottleneckRps} req/s ceiling).`,
                utilizationPercent:
                  finiteBottleneckRps > 0
                    ? Math.min(100, Math.round((requestedRps / finiteBottleneckRps) * 100))
                    : 0,
                queueDepth: Math.max(0, Math.round(droppedRps / 10)),
                rejectionCount: Math.round(droppedRps),
                waitingTimeMs: droppedRps > 0 ? Math.round(droppedRps * 0.5) : 0,
              },
            ]
          : [],
        scalingEventsCount: 0,
      },
      createdAt: DETERMINISTIC_EPOCH_ISO,
    };

    const integrity = EventIntegrityVerifier.verifyTrace(trace, nodes, edges);
    const findings = UnifiedFindingsAggregator.aggregate({
      nodes,
      edges,
      trace,
    });

    const metrics: ProvenancedMetric[] = [
      {
        key: "requested_rps",
        label: "Requested Ingress Load",
        value: requestedRps,
        unit: "req/s",
        provenance: "modeled-estimate",
      },
      {
        key: "delivered_rps",
        label: "Delivered Throughput (Bottleneck Capped)",
        value: deliveredRps,
        unit: "req/s",
        provenance: "observed-simulated",
      },
      {
        key: "bottleneck_capacity_rps",
        label: "System Bottleneck Ceiling",
        value: finiteBottleneckRps,
        unit: "req/s",
        provenance: "topology-derived",
      },
      {
        key: "virtual_duration_ms",
        label: "End-to-End Virtual Latency",
        value: clock.now(),
        unit: "ms",
        provenance: "observed-simulated",
      },
      {
        key: "error_rate_percent",
        label: "Dropped / Failed Rate",
        value: errorRatePercent,
        unit: "%",
        provenance: "observed-simulated",
      },
    ];

    return {
      runId,
      correlationId,
      outcome,
      shortCircuitedAtLayer,
      terminalStatusCode,
      totalDurationMs: clock.now(),
      bottleneckNodeId,
      bottleneckEffectiveRps: finiteBottleneckRps,
      requestedRps,
      deliveredRps,
      errorRatePercent,
      hops,
      trace,
      findings,
      metrics,
      integrity,
    };
  }
}
