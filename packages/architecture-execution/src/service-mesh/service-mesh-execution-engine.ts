import type {
  ExecutionConfiguration,
  ExecutionEvent,
  ExecutionTrace,
  VisualizationFrame,
} from "../index";
import { RuntimeStateHelper } from "../domain/runtime-state";
import {
  ServiceMeshScenarioSchema,
  type MeshMetrics,
  type MeshProxyRuntimeState,
  type MeshRequestSummary,
  type MeshResiliencePolicyConfig,
  type MeshServiceDefinition,
  type MeshServiceInstanceRuntimeState,
  type MeshTraceSpan,
  type ModeledServiceMeshRuntimeState,
  type ServiceMeshScenario,
} from "./service-mesh-schemas";
import { ServiceDiscoveryEngine } from "./discovery/service-discovery-engine";
import { MeshSecurityEngine } from "./security/mesh-security-engine";
import { MeshRoutingEngine } from "./routing/mesh-routing-engine";
import { MeshResilienceEngine } from "./resilience/mesh-resilience-engine";
import { CanaryController } from "./routing/canary-controller";

type WorkItem =
  | { kind: "failure_apply"; atMs: number; seq: number; failureId: string }
  | { kind: "failure_recover"; atMs: number; seq: number; failureId: string }
  | { kind: "canary_eval"; atMs: number; seq: number }
  | { kind: "workload_tick"; atMs: number; seq: number; stepIndex: number };

interface ReleaseHandle {
  kind: "instance" | "pool" | "bulkhead";
  id: string;
  targetServiceId?: string;
  usedQueue?: boolean;
}

export class ServiceMeshExecutionEngine {
  public static runScenario(rawScenario: ServiceMeshScenario): ExecutionTrace {
    const parsed = ServiceMeshScenarioSchema.parse(rawScenario);
    const baseRuntime = RuntimeStateHelper.createInitialState();

    // Validate references cleanly
    const serviceMap = new Map<string, MeshServiceDefinition>();
    for (const svc of parsed.services) {
      serviceMap.set(svc.id, svc);
    }

    const instances: Record<string, MeshServiceInstanceRuntimeState> = {};
    for (const inst of parsed.instances) {
      instances[inst.id] = {
        id: inst.id,
        serviceId: inst.serviceId,
        revision: inst.revision,
        region: inst.region,
        weight: inst.weight,
        healthy: inst.healthy,
        ready: inst.ready,
        activeRequests: 0,
        maxConcurrent: inst.maxConcurrent,
        totalHandled: 0,
        totalErrors: 0,
        addedLatencyMs: 0,
        certificateValid: inst.certificateValid,
        lastUpdatedAtMs: 0,
      };
    }

    const proxies: Record<string, MeshProxyRuntimeState> = {};
    for (const p of parsed.proxies) {
      proxies[p.id] = {
        id: p.id,
        mode: p.mode,
        attachedServiceId: p.attachedServiceId,
        healthy: p.healthy,
        inboundCount: 0,
        outboundCount: 0,
        activeRequests: 0,
        pools: {},
      };
    }

    const runtime: ModeledServiceMeshRuntimeState = {
      virtualTimeMs: 0,
      topologyView: "logical",
      instances,
      proxies,
      discoveryCache: {},
      circuits: {},
      bulkheads: {},
      canary: CanaryController.initialize(parsed.canary),
      recentRequests: [],
      failurePropagationChain: [],
      metrics: emptyMetrics(),
    };

    const events: ExecutionEvent[] = [];
    const frames: VisualizationFrame[] = [];
    let eventSeq = 1;
    let spanCounter = 1;
    let failureNodeCounter = 1;

    const counters = {
      totalRootRequests: 0,
      totalServiceCalls: 0,
      successCount: 0,
      degradedCount: 0,
      failedCount: 0,
      timeoutCount: 0,
      retryCount: 0,
      circuitRejectionCount: 0,
      bulkheadRejectionCount: 0,
      authDeniedCount: 0,
      mtlsFailedCount: 0,
      poolRejectedCount: 0,
      fallbackCount: 0,
    };
    const rootLatencies: number[] = [];

    const policyByService = new Map<string, MeshResiliencePolicyConfig>();
    for (const p of parsed.resilience) {
      policyByService.set(p.serviceId, p);
    }

    const rrCursorByService: Record<string, number> = {};
    const tokenBucketByService: Record<string, { tokens: number; lastRefillMs: number }> = {};
    const activeFaultLatencyByService: Record<string, number> = {};
    const activeFaultErrorByService: Record<
      string,
      { status?: number; grpc?: string; packetLoss?: boolean; connReset?: boolean }
    > = {};

    const emitEvent = (evt: Record<string, unknown>) => {
      if (events.length >= parsed.limits.maxEvents) return;
      const sequence = eventSeq++;
      const atMs = Math.max(0, Math.round(Number(evt.atMs ?? runtime.virtualTimeMs)));
      runtime.virtualTimeMs = Math.max(runtime.virtualTimeMs, atMs);
      runtime.metrics = computeMetrics(counters, rootLatencies);

      const fullEvt = {
        ...evt,
        id: `mesh-evt-${sequence}`,
        sequence,
        atMs,
        durationMs: Math.max(0, Math.round(Number(evt.durationMs ?? 1))),
      } as unknown as ExecutionEvent;

      events.push(fullEvt);

      const meshClone: ModeledServiceMeshRuntimeState = JSON.parse(JSON.stringify(runtime));
      const frameRuntime = RuntimeStateHelper.cloneState(baseRuntime);
      frameRuntime.serviceMeshState = meshClone;
      fullEvt.stateSnapshot = frameRuntime;

      const activeServices = Object.values(runtime.instances)
        .filter((i) => i.activeRequests > 0)
        .map((i) => i.serviceId);

      frames.push({
        frameIndex: frames.length,
        virtualTimeMs: atMs,
        activeEvent: fullEvt,
        activeNodeIds: Array.from(new Set(activeServices)),
        activeEdgeIds: [],
        direction: "request",
        stepTitle: fullEvt.type.replace(/\./g, " ").toUpperCase(),
        stepExplanation: fullEvt.explanation,
        runtimeState: frameRuntime,
      });
    };

    const recordFailureNode = (
      atMs: number,
      serviceId: string,
      stage: string,
      summary: string,
      causeNodeId?: string
    ): string => {
      const id = `fnode-${failureNodeCounter++}`;
      runtime.failurePropagationChain.push({
        id,
        atMs,
        serviceId,
        stage,
        summary,
        causeNodeId,
      });
      if (runtime.failurePropagationChain.length > 60) {
        runtime.failurePropagationChain = runtime.failurePropagationChain.slice(-60);
      }
      return id;
    };

    const getProxyForService = (serviceId: string): MeshProxyRuntimeState | undefined => {
      return Object.values(runtime.proxies).find(
        (p) => p.attachedServiceId === serviceId && p.mode !== "disabled"
      );
    };

    // Build deterministic schedule
    const schedule: WorkItem[] = [];
    let seqCounter = 0;

    for (const f of parsed.failures) {
      schedule.push({ kind: "failure_apply", atMs: f.atMs, seq: seqCounter++, failureId: f.id });
      if (f.recoveryAtMs !== undefined) {
        schedule.push({
          kind: "failure_recover",
          atMs: f.recoveryAtMs,
          seq: seqCounter++,
          failureId: f.id,
        });
      }
    }

    if (parsed.canary?.enabled) {
      const interval = parsed.canary.evaluationIntervalMs;
      const maxTime = Math.min(
        parsed.limits.maxVirtualDurationMs,
        (parsed.workload[parsed.workload.length - 1]?.atMs ?? 0) + 1500
      );
      for (let t = interval; t <= maxTime; t += interval) {
        schedule.push({ kind: "canary_eval", atMs: t, seq: seqCounter++ });
      }
    }

    let scheduledRequestTotal = 0;
    for (let i = 0; i < parsed.workload.length; i++) {
      const w = parsed.workload[i]!;
      if (scheduledRequestTotal >= parsed.limits.maxRequests) break;
      scheduledRequestTotal += w.concurrentCount;
      schedule.push({
        kind: "workload_tick",
        atMs: w.atMs,
        seq: seqCounter++,
        stepIndex: i,
      });
    }

    schedule.sort((a, b) => (a.atMs !== b.atMs ? a.atMs - b.atMs : a.seq - b.seq));

    const executeServiceCall = (params: {
      requestId: string;
      traceId: string;
      parentSpanId?: string;
      sourceServiceId: string;
      destServiceId: string;
      operation: string;
      protocol: "http" | "grpc";
      headers: Record<string, string>;
      path: string;
      startMs: number;
      deadlineAtMs: number;
      spans: MeshTraceSpan[];
      holdConcurrentResources?: ReleaseHandle[];
      depth: number;
    }): {
      ok: boolean;
      degraded: boolean;
      endMs: number;
      statusLabel: string;
      causeFailureId?: string;
      attemptsMade: number;
    } => {
      const {
        requestId,
        traceId,
        parentSpanId,
        sourceServiceId,
        destServiceId,
        operation,
        protocol,
        headers,
        path,
        startMs,
        deadlineAtMs,
        spans,
        holdConcurrentResources,
        depth,
      } = params;

      if (depth > 8) {
        return {
          ok: false,
          degraded: false,
          endMs: startMs,
          statusLabel: protocol === "grpc" ? "ABORTED" : "508",
          attemptsMade: 1,
        };
      }

      const sourceSvc = serviceMap.get(sourceServiceId);
      const destSvc = serviceMap.get(destServiceId);
      if (!destSvc || !sourceSvc) {
        return {
          ok: false,
          degraded: false,
          endMs: startMs,
          statusLabel: protocol === "grpc" ? "NOT_FOUND" : "404",
          attemptsMade: 1,
        };
      }

      const policy: MeshResiliencePolicyConfig = policyByService.get(destServiceId) ?? {
        serviceId: destServiceId,
        attemptTimeoutMs: destSvc.defaultTimeoutMs,
        overallDeadlineMs: Math.max(destSvc.defaultTimeoutMs * 2, 1800),
        retry: {
          enabled: false,
          maxAttempts: 1,
          initialBackoffMs: 50,
          maxBackoffMs: 400,
          exponentialFactor: 2,
          jitterRatio: 0.2,
          retryBudgetPct: 100,
          retryableHttpStatuses: [500, 502, 503, 504],
          retryableGrpcStatuses: ["UNAVAILABLE", "DEADLINE_EXCEEDED", "RESOURCE_EXHAUSTED"],
        },
        circuitBreaker: {
          enabled: false,
          scope: "destination_service",
          rollingWindowMs: 10000,
          minimumRequests: 4,
          failureRateThresholdPct: 50,
          openDurationMs: 1200,
          halfOpenProbeLimit: 2,
          successThreshold: 2,
        },
        bulkhead: {
          enabled: false,
          maxActive: 10,
          queueCapacity: 5,
          queueTimeoutMs: 100,
        },
      };

      const effectiveDeadlineMs = Math.min(deadlineAtMs, startMs + policy.overallDeadlineMs);
      const maxAttempts = policy.retry.enabled
        ? Math.min(parsed.limits.maxAttemptsPerRequest, policy.retry.maxAttempts)
        : 1;

      const cbScopeKey =
        policy.circuitBreaker.scope === "source_destination"
          ? `${sourceServiceId}->${destServiceId}`
          : destServiceId;

      let cursorMs = startMs;
      let lastStatusLabel = protocol === "grpc" ? "UNKNOWN" : "500";
      let lastCauseId: string | undefined;
      let attemptsMade = 0;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        attemptsMade = attempt;
        counters.totalServiceCalls += 1;

        if (cursorMs >= effectiveDeadlineMs) {
          counters.timeoutCount += 1;
          emitEvent({
            type: "mesh.timeout.deadline.expired",
            atMs: effectiveDeadlineMs,
            durationMs: 1,
            requestId,
            serviceId: destServiceId,
            deadlineAtMs: effectiveDeadlineMs,
            explanation: `Overall deadline (${effectiveDeadlineMs}ms) expired before attempt ${attempt} to "${destServiceId}".`,
          });
          lastStatusLabel = protocol === "grpc" ? "DEADLINE_EXCEEDED" : "504";
          lastCauseId = recordFailureNode(
            effectiveDeadlineMs,
            destServiceId,
            "deadline_expired",
            `Deadline exceeded calling ${destServiceId}`
          );
          break;
        }

        const spanId = `span-${spanCounter++}`;
        const attemptStartMs = cursorMs;

        // Retry budget enforcement
        if (attempt > 1) {
          const maxRetryAllowed = Math.max(
            1,
            Math.floor((counters.totalRootRequests * policy.retry.retryBudgetPct) / 100)
          );
          if (counters.retryCount >= maxRetryAllowed) {
            emitEvent({
              type: "mesh.retry.suppressed",
              atMs: cursorMs,
              durationMs: 1,
              requestId,
              destinationServiceId: destServiceId,
              reason: `Retry budget exhausted (${counters.retryCount}/${maxRetryAllowed} retries used).`,
              explanation: `Suppressed retry attempt ${attempt} for "${destServiceId}": retry budget exhausted.`,
            });
            break;
          }
          counters.retryCount += 1;
        }

        // Circuit breaker check
        const cbAllowed = MeshResilienceEngine.canPassCircuit(
          requestId,
          cbScopeKey,
          destServiceId,
          cursorMs,
          policy.circuitBreaker,
          runtime,
          emitEvent
        );
        if (!cbAllowed) {
          counters.circuitRejectionCount += 1;
          lastStatusLabel = protocol === "grpc" ? "UNAVAILABLE" : "503";
          lastCauseId = recordFailureNode(
            cursorMs,
            destServiceId,
            "circuit_open",
            `Circuit breaker rejected call to ${destServiceId}`
          );
          spans.push({
            spanId,
            parentSpanId,
            traceId,
            sourceServiceId,
            destinationServiceId: destServiceId,
            operation,
            protocol,
            attempt,
            startMs: attemptStartMs,
            endMs: cursorMs + 1,
            durationMs: 1,
            status: "rejected",
            statusLabel: lastStatusLabel,
            mtlsMs: 0,
            queueWaitMs: 0,
            processingMs: 0,
            backoffMs: 0,
          });
          break;
        }

        // Rate limit token bucket check
        if (policy.rateLimitRps) {
          const tb =
            tokenBucketByService[destServiceId] ?? {
              tokens: policy.rateLimitRps,
              lastRefillMs: cursorMs,
            };
          const elapsedSec = Math.max(0, (cursorMs - tb.lastRefillMs) / 1000);
          tb.tokens = Math.min(policy.rateLimitRps, tb.tokens + elapsedSec * policy.rateLimitRps);
          tb.lastRefillMs = cursorMs;
          if (tb.tokens < 1) {
            tokenBucketByService[destServiceId] = tb;
            lastStatusLabel = protocol === "grpc" ? "RESOURCE_EXHAUSTED" : "429";
            spans.push({
              spanId,
              parentSpanId,
              traceId,
              sourceServiceId,
              destinationServiceId: destServiceId,
              operation,
              protocol,
              attempt,
              startMs: attemptStartMs,
              endMs: cursorMs + 1,
              durationMs: 1,
              status: "rejected",
              statusLabel: lastStatusLabel,
              mtlsMs: 0,
              queueWaitMs: 0,
              processingMs: 0,
              backoffMs: 0,
            });
            break;
          }
          tb.tokens -= 1;
          tokenBucketByService[destServiceId] = tb;
        }

        // Outbound Proxy traversal
        const outboundProxy = getProxyForService(sourceServiceId);
        if (outboundProxy && sourceSvc.proxyMode !== "disabled") {
          if (!outboundProxy.healthy) {
            lastStatusLabel = protocol === "grpc" ? "UNAVAILABLE" : "502";
            lastCauseId = recordFailureNode(
              cursorMs,
              sourceServiceId,
              "proxy_failure",
              `Outbound proxy "${outboundProxy.id}" unhealthy`
            );
            spans.push({
              spanId,
              parentSpanId,
              traceId,
              sourceServiceId,
              destinationServiceId: destServiceId,
              proxyId: outboundProxy.id,
              operation,
              protocol,
              attempt,
              startMs: attemptStartMs,
              endMs: cursorMs + 2,
              durationMs: 2,
              status: "error",
              statusLabel: lastStatusLabel,
              mtlsMs: 0,
              queueWaitMs: 0,
              processingMs: 0,
              backoffMs: 0,
            });
            break;
          }
          outboundProxy.outboundCount += 1;
          const outOverhead = parsed.proxies.find((p) => p.id === outboundProxy.id)?.proxyOverheadMs ?? 3;
          emitEvent({
            type: "mesh.proxy.outbound.entered",
            atMs: cursorMs,
            durationMs: outOverhead,
            requestId,
            proxyId: outboundProxy.id,
            serviceId: sourceServiceId,
            explanation: `Outbound ${outboundProxy.mode} proxy "${outboundProxy.id}" intercepted call from "${sourceServiceId}" -> "${destServiceId}".`,
          });
          cursorMs += outOverhead;
        }

        // Service Discovery
        const discoveryRes = ServiceDiscoveryEngine.resolveEndpoints(
          requestId,
          destServiceId,
          cursorMs,
          parsed.discovery,
          runtime,
          emitEvent
        );
        cursorMs += discoveryRes.latencyMs;

        if (discoveryRes.endpointIds.length === 0) {
          lastStatusLabel = protocol === "grpc" ? "UNAVAILABLE" : "503";
          MeshResilienceEngine.recordCircuitOutcome(
            cbScopeKey,
            destServiceId,
            cursorMs,
            false,
            policy.circuitBreaker,
            runtime,
            emitEvent
          );
          lastCauseId = recordFailureNode(
            cursorMs,
            destServiceId,
            "discovery_failed",
            `No endpoints available for ${destServiceId}`
          );
          break;
        }

        // Routing & Load Balancing
        const routingRes = MeshRoutingEngine.selectEndpoint(
          requestId,
          destServiceId,
          discoveryRes.endpointIds,
          headers,
          path,
          cursorMs,
          parsed.seed + attempt,
          parsed.routing,
          runtime.instances,
          rrCursorByService,
          runtime.canary,
          emitEvent
        );

        const destInstance = routingRes.selectedInstance;
        if (!destInstance) {
          lastStatusLabel = protocol === "grpc" ? "UNAVAILABLE" : "503";
          break;
        }

        // Stale discovery endpoint check (if cached unhealthy endpoint selected)
        if (!destInstance.healthy) {
          destInstance.totalErrors += 1;
          lastStatusLabel = protocol === "grpc" ? "UNAVAILABLE" : "503";
          emitEvent({
            type: "mesh.discovery.endpoint.updated",
            atMs: cursorMs,
            durationMs: 2,
            serviceId: destServiceId,
            instanceId: destInstance.id,
            healthy: false,
            explanation: `Endpoint "${destInstance.id}" failed connection (stale discovery entry evicted).`,
          });
          delete runtime.discoveryCache[destServiceId];
          MeshResilienceEngine.recordCircuitOutcome(
            cbScopeKey,
            destServiceId,
            cursorMs,
            false,
            policy.circuitBreaker,
            runtime,
            emitEvent
          );
          // Retry eligible if attempts left
          if (attempt < maxAttempts && policy.retry.enabled) {
            const backoffMs = MeshResilienceEngine.computeRetryBackoffMs(
              attempt,
              policy.retry,
              parsed.seed
            );
            if (cursorMs + backoffMs < effectiveDeadlineMs) {
              emitEvent({
                type: "mesh.retry.scheduled",
                atMs: cursorMs,
                durationMs: backoffMs,
                requestId,
                destinationServiceId: destServiceId,
                attempt: attempt + 1,
                backoffMs,
                explanation: `Scheduling retry ${attempt + 1}/${maxAttempts} for "${destServiceId}" after ${backoffMs}ms backoff.`,
              });
              cursorMs += backoffMs;
              continue;
            }
          }
          break;
        }

        // Connection Pool Acquisition on outbound proxy
        let poolUsedProxy: MeshProxyRuntimeState | undefined;
        let maxPoolConns = 16;
        if (outboundProxy) {
          maxPoolConns =
            parsed.proxies.find((p) => p.id === outboundProxy.id)?.maxConnections ?? 16;
          if (!outboundProxy.pools[destServiceId]) {
            outboundProxy.pools[destServiceId] = {
              targetServiceId: destServiceId,
              maxConnections: maxPoolConns,
              activeConnections: 0,
              idleConnections: 2,
              reusedCount: 0,
              createdCount: 2,
              rejectedCount: 0,
            };
          }
          const pool = outboundProxy.pools[destServiceId]!;
          emitEvent({
            type: "mesh.connection.acquire.started",
            atMs: cursorMs,
            durationMs: 1,
            requestId,
            proxyId: outboundProxy.id,
            targetServiceId: destServiceId,
            explanation: `Acquiring connection from pool "${outboundProxy.id}" -> "${destServiceId}" (${pool.activeConnections}/${pool.maxConnections} active).`,
          });
          if (pool.activeConnections >= pool.maxConnections) {
            pool.rejectedCount += 1;
            counters.poolRejectedCount += 1;
            lastStatusLabel = protocol === "grpc" ? "RESOURCE_EXHAUSTED" : "503";
            emitEvent({
              type: "mesh.connection.acquire.failed",
              atMs: cursorMs,
              durationMs: 1,
              requestId,
              proxyId: outboundProxy.id,
              targetServiceId: destServiceId,
              reason: `Connection pool exhausted (${pool.maxConnections}/${pool.maxConnections}).`,
              explanation: `Connection pool exhausted on "${outboundProxy.id}" -> "${destServiceId}".`,
            });
            spans.push({
              spanId,
              parentSpanId,
              traceId,
              sourceServiceId,
              destinationServiceId: destServiceId,
              instanceId: destInstance.id,
              proxyId: outboundProxy.id,
              operation,
              protocol,
              attempt,
              startMs: attemptStartMs,
              endMs: cursorMs + 1,
              durationMs: 1,
              status: "rejected",
              statusLabel: lastStatusLabel,
              mtlsMs: 0,
              queueWaitMs: 0,
              processingMs: 0,
              backoffMs: 0,
            });
            break;
          }
          if (pool.idleConnections > 0) {
            pool.idleConnections -= 1;
            pool.activeConnections += 1;
            pool.reusedCount += 1;
            emitEvent({
              type: "mesh.connection.reused",
              atMs: cursorMs,
              durationMs: 1,
              requestId,
              proxyId: outboundProxy.id,
              targetServiceId: destServiceId,
              explanation: `Reused pooled TCP/HTTP2 connection to "${destServiceId}".`,
            });
          } else {
            pool.activeConnections += 1;
            pool.createdCount += 1;
            cursorMs += 3;
            emitEvent({
              type: "mesh.connection.created",
              atMs: cursorMs,
              durationMs: 3,
              requestId,
              proxyId: outboundProxy.id,
              targetServiceId: destServiceId,
              explanation: `Opened new pooled connection to "${destServiceId}".`,
            });
          }
          poolUsedProxy = outboundProxy;
        }

        // Inbound Proxy health check
        const inboundProxy = getProxyForService(destServiceId);
        if (inboundProxy && destSvc.proxyMode !== "disabled") {
          if (!inboundProxy.healthy) {
            if (poolUsedProxy) {
              const pool = poolUsedProxy.pools[destServiceId]!;
              pool.activeConnections = Math.max(0, pool.activeConnections - 1);
              pool.idleConnections += 1;
            }
            lastStatusLabel = protocol === "grpc" ? "UNAVAILABLE" : "502";
            lastCauseId = recordFailureNode(
              cursorMs,
              destServiceId,
              "inbound_proxy_failure",
              `Inbound proxy "${inboundProxy.id}" unavailable`
            );
            spans.push({
              spanId,
              parentSpanId,
              traceId,
              sourceServiceId,
              destinationServiceId: destServiceId,
              instanceId: destInstance.id,
              proxyId: inboundProxy.id,
              operation,
              protocol,
              attempt,
              startMs: attemptStartMs,
              endMs: cursorMs + 2,
              durationMs: 2,
              status: "error",
              statusLabel: lastStatusLabel,
              mtlsMs: 0,
              queueWaitMs: 0,
              processingMs: 0,
              backoffMs: 0,
            });
            break;
          }
          inboundProxy.inboundCount += 1;
          const inOverhead = parsed.proxies.find((p) => p.id === inboundProxy.id)?.proxyOverheadMs ?? 2;
          emitEvent({
            type: "mesh.proxy.inbound.entered",
            atMs: cursorMs,
            durationMs: inOverhead,
            requestId,
            proxyId: inboundProxy.id,
            serviceId: destServiceId,
            explanation: `Inbound proxy "${inboundProxy.id}" received call for "${destServiceId}".`,
          });
          cursorMs += inOverhead;
        }

        // Security: Modeled mTLS & Authorization
        const sourceInst = Object.values(runtime.instances).find(
          (i) => i.serviceId === sourceServiceId
        );
        const secRes = MeshSecurityEngine.evaluateSecurity(
          requestId,
          cursorMs,
          sourceSvc,
          destSvc,
          sourceInst,
          destInstance,
          operation,
          parsed.security,
          emitEvent
        );
        cursorMs += secRes.latencyMs;

        if (!secRes.allowed) {
          if (secRes.mtlsFailed) counters.mtlsFailedCount += 1;
          if (secRes.authDenied) counters.authDeniedCount += 1;
          if (poolUsedProxy) {
            const pool = poolUsedProxy.pools[destServiceId]!;
            pool.activeConnections = Math.max(0, pool.activeConnections - 1);
            pool.idleConnections += 1;
          }
          lastStatusLabel = secRes.mtlsFailed
            ? protocol === "grpc"
              ? "UNAUTHENTICATED"
              : "401"
            : protocol === "grpc"
              ? "PERMISSION_DENIED"
              : "403";
          spans.push({
            spanId,
            parentSpanId,
            traceId,
            sourceServiceId,
            destinationServiceId: destServiceId,
            instanceId: destInstance.id,
            proxyId: inboundProxy?.id,
            operation,
            protocol,
            attempt,
            startMs: attemptStartMs,
            endMs: cursorMs,
            durationMs: cursorMs - attemptStartMs,
            status: "rejected",
            statusLabel: lastStatusLabel,
            mtlsMs: secRes.latencyMs,
            queueWaitMs: 0,
            processingMs: 0,
            backoffMs: 0,
          });
          // Authorization/mTLS failures MUST NOT retry to bypass security!
          break;
        }

        // Bulkhead Capacity Acquisition
        const bhRes = MeshResilienceEngine.tryAcquireBulkhead(
          requestId,
          destServiceId,
          cursorMs,
          policy.bulkhead,
          runtime,
          emitEvent
        );
        if (!bhRes.acquired) {
          counters.bulkheadRejectionCount += 1;
          if (poolUsedProxy) {
            const pool = poolUsedProxy.pools[destServiceId]!;
            pool.activeConnections = Math.max(0, pool.activeConnections - 1);
            pool.idleConnections += 1;
          }
          lastStatusLabel = protocol === "grpc" ? "RESOURCE_EXHAUSTED" : "503";
          lastCauseId = recordFailureNode(
            cursorMs,
            destServiceId,
            "bulkhead_rejected",
            `Bulkhead rejected request to ${destServiceId}`
          );
          spans.push({
            spanId,
            parentSpanId,
            traceId,
            sourceServiceId,
            destinationServiceId: destServiceId,
            instanceId: destInstance.id,
            operation,
            protocol,
            attempt,
            startMs: attemptStartMs,
            endMs: cursorMs + 1,
            durationMs: 1,
            status: "rejected",
            statusLabel: lastStatusLabel,
            mtlsMs: secRes.latencyMs,
            queueWaitMs: 0,
            processingMs: 0,
            backoffMs: 0,
          });
          break;
        }
        cursorMs += bhRes.queueWaitMs;

        // Acquire instance concurrency
        destInstance.activeRequests += 1;
        destInstance.totalHandled += 1;
        emitEvent({
          type: "mesh.service.processing.started",
          atMs: cursorMs,
          durationMs: 1,
          requestId,
          serviceId: destServiceId,
          instanceId: destInstance.id,
          explanation: `Instance "${destInstance.id}" began executing ${operation}.`,
        });

        // Downstream Dependencies (supports parallel branches + sequential calls)
        let depFailed = false;
        let depDegraded = false;
        let maxDepEndMs = cursorMs;
        let parallelEndMap: Record<string, number> = {};

        for (const dep of destSvc.dependencies) {
          const branchStartMs = dep.parallelGroup
            ? cursorMs
            : maxDepEndMs;
          const childRes = executeServiceCall({
            requestId: `${requestId}:${dep.targetServiceId}`,
            traceId,
            parentSpanId: spanId,
            sourceServiceId: destServiceId,
            destServiceId: dep.targetServiceId,
            operation: dep.operation,
            protocol: dep.protocol,
            headers,
            path,
            startMs: branchStartMs,
            deadlineAtMs: effectiveDeadlineMs,
            spans,
            holdConcurrentResources,
            depth: depth + 1,
          });

          if (dep.parallelGroup) {
            parallelEndMap[dep.parallelGroup] = Math.max(
              parallelEndMap[dep.parallelGroup] ?? branchStartMs,
              childRes.endMs
            );
            maxDepEndMs = Math.max(maxDepEndMs, parallelEndMap[dep.parallelGroup]!);
          } else {
            maxDepEndMs = Math.max(maxDepEndMs, childRes.endMs);
          }

          if (!childRes.ok) {
            const fbMode = dep.fallbackMode !== "none" ? dep.fallbackMode : destSvc.fallbackMode;
            if (!dep.required || (fbMode !== "none" && fbMode !== "fail")) {
              depDegraded = true;
              counters.fallbackCount += 1;
              emitEvent({
                type: "mesh.fallback.activated",
                atMs: maxDepEndMs,
                durationMs: 2,
                requestId,
                serviceId: destServiceId,
                mode: !dep.required ? "skip_optional" : fbMode,
                explanation: `Activated "${!dep.required ? "skip_optional" : fbMode}" fallback for failed dependency "${dep.targetServiceId}" — serving degraded partial response.`,
              });
            } else {
              depFailed = true;
              const grpcToHttpMap: Record<string, string> = {
                UNAVAILABLE: "503",
                DEADLINE_EXCEEDED: "504",
                PERMISSION_DENIED: "403",
                UNAUTHENTICATED: "401",
                RESOURCE_EXHAUSTED: "429",
                NOT_FOUND: "404",
              };
              lastStatusLabel =
                protocol === "http" && grpcToHttpMap[childRes.statusLabel]
                  ? grpcToHttpMap[childRes.statusLabel]!
                  : childRes.statusLabel;
              emitEvent({
                type: "mesh.failure.propagated",
                atMs: maxDepEndMs,
                durationMs: 1,
                requestId,
                fromServiceId: dep.targetServiceId,
                toServiceId: destServiceId,
                reason: `Required dependency "${dep.targetServiceId}" failed (${childRes.statusLabel}).`,
                explanation: `Failure propagated from "${dep.targetServiceId}" to "${destServiceId}".`,
              });
              lastCauseId = recordFailureNode(
                maxDepEndMs,
                destServiceId,
                "dependency_failed",
                `${destServiceId} failed because ${dep.targetServiceId} returned ${childRes.statusLabel}`,
                childRes.causeFailureId
              );
            }
          } else if (childRes.degraded) {
            depDegraded = true;
          }
        }

        cursorMs = maxDepEndMs;

        // Calculate self processing time + time-scoped fault latency/error checks
        const instCfg = parsed.instances.find((i) => i.id === destInstance.id);
        const activeFaultsHere = parsed.failures.filter(
          (f) =>
            (f.targetId === destServiceId || f.targetId === destInstance.id) &&
            f.atMs <= cursorMs &&
            (f.recoveryAtMs === undefined || cursorMs < f.recoveryAtMs)
        );
        const faultLatency = activeFaultsHere
          .filter((f) => f.type === "latency_spike")
          .reduce((sum, f) => sum + (f.addedLatencyMs ?? 200), 0);
        const errFault = activeFaultsHere.find(
          (f) =>
            f.type === "service_unavailable" ||
            f.type === "packet_loss" ||
            f.type === "connection_reset"
        );
        const faultErr = errFault
          ? {
              status: errFault.errorStatusCode ?? 503,
              grpc: errFault.grpcErrorCode ?? "UNAVAILABLE",
              packetLoss: errFault.type === "packet_loss",
              connReset: errFault.type === "connection_reset",
            }
          : undefined;
        const selfProcMs =
          (instCfg?.baseLatencyMs ?? destSvc.baseProcessingMs) +
          destInstance.addedLatencyMs +
          faultLatency;

        // Check Timeout Budget
        const attemptRemainingMs = Math.max(
          0,
          Math.min(policy.attemptTimeoutMs, effectiveDeadlineMs - attemptStartMs)
        );
        const elapsedBeforeProc = cursorMs - attemptStartMs;
        const totalAttemptProc = elapsedBeforeProc + selfProcMs;

        const timedOut = totalAttemptProc > attemptRemainingMs;
        const procConsumed = timedOut ? Math.max(1, attemptRemainingMs - elapsedBeforeProc) : selfProcMs;
        cursorMs += procConsumed;

        const releaseAll = () => {
          destInstance.activeRequests = Math.max(0, destInstance.activeRequests - 1);
          MeshResilienceEngine.releaseBulkhead(
            requestId,
            destServiceId,
            cursorMs,
            bhRes.queueWaitMs > 0,
            policy.bulkhead,
            runtime,
            emitEvent
          );
          if (poolUsedProxy) {
            const pool = poolUsedProxy.pools[destServiceId]!;
            pool.activeConnections = Math.max(0, pool.activeConnections - 1);
            pool.idleConnections += 1;
            emitEvent({
              type: "mesh.connection.released",
              atMs: cursorMs,
              durationMs: 0,
              requestId,
              proxyId: poolUsedProxy.id,
              targetServiceId: destServiceId,
              explanation: `Released connection back to "${poolUsedProxy.id}" pool.`,
            });
          }
        };

        // Hold concurrent burst locks if this is a root call in concurrent swarm
        if (holdConcurrentResources) {
          holdConcurrentResources.push({ kind: "instance", id: destInstance.id });
          if (poolUsedProxy) {
            holdConcurrentResources.push({
              kind: "pool",
              id: poolUsedProxy.id,
              targetServiceId: destServiceId,
            });
          }
          if (policy.bulkhead.enabled) {
            holdConcurrentResources.push({
              kind: "bulkhead",
              id: destServiceId,
              usedQueue: bhRes.queueWaitMs > 0,
            });
          }
        } else {
          releaseAll();
        }

        const injectedFailure = Boolean(faultErr?.status || faultErr?.grpc || faultErr?.packetLoss || faultErr?.connReset);
        const attemptSuccess = !depFailed && !timedOut && !injectedFailure;

        let spanStatus: MeshTraceSpan["status"] = "ok";
        let spanStatusLabel = protocol === "grpc" ? "OK" : "200";
        if (timedOut) {
          spanStatus = "timeout";
          spanStatusLabel = protocol === "grpc" ? "DEADLINE_EXCEEDED" : "504";
          counters.timeoutCount += 1;
          emitEvent({
            type: "mesh.timeout.attempt.expired",
            atMs: cursorMs,
            durationMs: 1,
            requestId,
            serviceId: destServiceId,
            timeoutMs: attemptRemainingMs,
            explanation: `Attempt ${attempt} to "${destServiceId}" timed out after ${attemptRemainingMs}ms.`,
          });
          lastCauseId = recordFailureNode(
            cursorMs,
            destServiceId,
            "timeout",
            `${destServiceId} attempt ${attempt} timed out (${attemptRemainingMs}ms)`
          );
        } else if (injectedFailure) {
          spanStatus = "error";
          spanStatusLabel =
            protocol === "grpc"
              ? (faultErr?.grpc ?? "UNAVAILABLE")
              : String(faultErr?.status ?? 503);
          lastCauseId = recordFailureNode(
            cursorMs,
            destServiceId,
            "service_error",
            `${destServiceId} returned ${spanStatusLabel}`
          );
        } else if (depFailed) {
          spanStatus = "error";
          spanStatusLabel = lastStatusLabel;
        } else if (depDegraded) {
          spanStatus = "degraded";
          spanStatusLabel = protocol === "grpc" ? "OK (DEGRADED)" : "200 (Degraded)";
        }

        const span: MeshTraceSpan = {
          spanId,
          parentSpanId,
          traceId,
          sourceServiceId,
          destinationServiceId: destServiceId,
          instanceId: destInstance.id,
          proxyId: outboundProxy?.id ?? inboundProxy?.id,
          operation,
          protocol,
          attempt,
          startMs: attemptStartMs,
          endMs: cursorMs,
          durationMs: cursorMs - attemptStartMs,
          status: spanStatus,
          statusLabel: spanStatusLabel,
          mtlsMs: secRes.latencyMs,
          queueWaitMs: bhRes.queueWaitMs,
          processingMs: procConsumed,
          backoffMs: 0,
          degradedFallbackUsed: depDegraded,
        };
        spans.push(span);

        emitEvent({
          type: "mesh.service.processing.completed",
          atMs: cursorMs,
          durationMs: procConsumed,
          requestId,
          serviceId: destServiceId,
          instanceId: destInstance.id,
          span,
          explanation: `"${destServiceId}" (${destInstance.id}) completed attempt ${attempt} -> ${spanStatusLabel} in ${span.durationMs}ms.`,
        });

        CanaryController.recordObservation(
          runtime.canary,
          destServiceId,
          destInstance.revision,
          attemptSuccess,
          span.durationMs
        );
        MeshResilienceEngine.recordCircuitOutcome(
          cbScopeKey,
          destServiceId,
          cursorMs,
          attemptSuccess,
          policy.circuitBreaker,
          runtime,
          emitEvent
        );

        if (attemptSuccess) {
          return {
            ok: true,
            degraded: depDegraded,
            endMs: cursorMs,
            statusLabel: spanStatusLabel,
            attemptsMade,
          };
        }

        destInstance.totalErrors += 1;
        lastStatusLabel = spanStatusLabel;

        // Check retry eligibility
        const codeNum = Number(spanStatusLabel);
        const retryable =
          policy.retry.enabled &&
          (protocol === "http"
            ? policy.retry.retryableHttpStatuses.includes(codeNum) || timedOut
            : policy.retry.retryableGrpcStatuses.includes(spanStatusLabel) || timedOut);

        if (retryable && attempt < maxAttempts) {
          const backoffMs = MeshResilienceEngine.computeRetryBackoffMs(
            attempt,
            policy.retry,
            parsed.seed
          );
          if (cursorMs + backoffMs < effectiveDeadlineMs) {
            emitEvent({
              type: "mesh.retry.scheduled",
              atMs: cursorMs,
              durationMs: backoffMs,
              requestId,
              destinationServiceId: destServiceId,
              attempt: attempt + 1,
              backoffMs,
              explanation: `Scheduling retry ${attempt + 1}/${maxAttempts} for "${destServiceId}" after ${backoffMs}ms backoff (remaining deadline ${effectiveDeadlineMs - cursorMs}ms).`,
            });
            cursorMs += backoffMs;
            continue;
          } else {
            emitEvent({
              type: "mesh.timeout.deadline.expired",
              atMs: effectiveDeadlineMs,
              durationMs: 1,
              requestId,
              serviceId: destServiceId,
              deadlineAtMs: effectiveDeadlineMs,
              explanation: `Retry skipped for "${destServiceId}": ${backoffMs}ms backoff exceeds remaining deadline.`,
            });
            break;
          }
        } else if (policy.retry.enabled && attempt >= maxAttempts) {
          emitEvent({
            type: "mesh.retry.exhausted",
            atMs: cursorMs,
            durationMs: 1,
            requestId,
            destinationServiceId: destServiceId,
            attempts: attempt,
            explanation: `Retry limit exhausted (${attempt}/${maxAttempts}) for "${destServiceId}".`,
          });
        }

        break;
      }

      // Check top-level fallback on failed destination call if configured
      if (destSvc.fallbackMode !== "none" && destSvc.fallbackMode !== "fail") {
        counters.fallbackCount += 1;
        emitEvent({
          type: "mesh.fallback.activated",
          atMs: cursorMs,
          durationMs: 2,
          requestId,
          serviceId: destServiceId,
          mode: destSvc.fallbackMode,
          explanation: `Activated fallback "${destSvc.fallbackMode}" on "${destServiceId}".`,
        });
        return {
          ok: true,
          degraded: true,
          endMs: cursorMs + 2,
          statusLabel: protocol === "grpc" ? "OK (FALLBACK)" : "200 (Fallback)",
          causeFailureId: lastCauseId,
          attemptsMade,
        };
      }

      return {
        ok: false,
        degraded: false,
        endMs: cursorMs,
        statusLabel: lastStatusLabel,
        causeFailureId: lastCauseId,
        attemptsMade,
      };
    };

    // Execute deterministic schedule
    for (const item of schedule) {
      runtime.virtualTimeMs = Math.max(runtime.virtualTimeMs, item.atMs);

      if (item.kind === "failure_apply") {
        const f = parsed.failures.find((x) => x.id === item.failureId);
        if (!f) continue;
        if (f.type === "service_unavailable") {
          for (const inst of Object.values(runtime.instances)) {
            if (inst.serviceId === f.targetId) {
              inst.healthy = false;
              inst.lastUpdatedAtMs = item.atMs;
            }
          }
          activeFaultErrorByService[f.targetId] = {
            status: f.errorStatusCode ?? 503,
            grpc: f.grpcErrorCode ?? "UNAVAILABLE",
          };
        } else if (f.type === "instance_crash" && runtime.instances[f.targetId]) {
          runtime.instances[f.targetId]!.healthy = false;
          runtime.instances[f.targetId]!.ready = false;
          runtime.instances[f.targetId]!.lastUpdatedAtMs = item.atMs;
        } else if (f.type === "proxy_failure" && runtime.proxies[f.targetId]) {
          runtime.proxies[f.targetId]!.healthy = false;
        } else if (f.type === "latency_spike") {
          activeFaultLatencyByService[f.targetId] =
            (activeFaultLatencyByService[f.targetId] ?? 0) + (f.addedLatencyMs ?? 200);
        } else if (f.type === "packet_loss" || f.type === "connection_reset") {
          activeFaultErrorByService[f.targetId] = {
            status: f.errorStatusCode ?? 502,
            grpc: f.grpcErrorCode ?? "UNAVAILABLE",
            packetLoss: f.type === "packet_loss",
            connReset: f.type === "connection_reset",
          };
        } else if (f.type === "regional_outage") {
          for (const inst of Object.values(runtime.instances)) {
            if (inst.region === f.targetId) {
              inst.healthy = false;
              inst.lastUpdatedAtMs = item.atMs;
            }
          }
        } else if (f.type === "cert_expired") {
          for (const inst of Object.values(runtime.instances)) {
            if (inst.serviceId === f.targetId || inst.id === f.targetId) {
              inst.certificateValid = false;
            }
          }
        }
        recordFailureNode(
          item.atMs,
          f.targetId,
          f.type,
          `Injected fault ${f.type} on "${f.targetId}"`
        );
        continue;
      }

      if (item.kind === "failure_recover") {
        const f = parsed.failures.find((x) => x.id === item.failureId);
        if (!f) continue;
        if (f.type === "service_unavailable") {
          for (const inst of Object.values(runtime.instances)) {
            if (inst.serviceId === f.targetId) {
              inst.healthy = true;
              inst.ready = true;
              inst.lastUpdatedAtMs = item.atMs;
            }
          }
          delete activeFaultErrorByService[f.targetId];
        } else if (f.type === "instance_crash" && runtime.instances[f.targetId]) {
          runtime.instances[f.targetId]!.healthy = true;
          runtime.instances[f.targetId]!.ready = true;
          runtime.instances[f.targetId]!.lastUpdatedAtMs = item.atMs;
        } else if (f.type === "proxy_failure" && runtime.proxies[f.targetId]) {
          runtime.proxies[f.targetId]!.healthy = true;
        } else if (f.type === "latency_spike") {
          delete activeFaultLatencyByService[f.targetId];
        } else if (f.type === "packet_loss" || f.type === "connection_reset") {
          delete activeFaultErrorByService[f.targetId];
        } else if (f.type === "regional_outage") {
          for (const inst of Object.values(runtime.instances)) {
            if (inst.region === f.targetId) {
              inst.healthy = true;
              inst.lastUpdatedAtMs = item.atMs;
            }
          }
        } else if (f.type === "cert_expired") {
          for (const inst of Object.values(runtime.instances)) {
            if (inst.serviceId === f.targetId || inst.id === f.targetId) {
              inst.certificateValid = true;
            }
          }
        }
        delete runtime.discoveryCache[f.targetId];
        continue;
      }

      if (item.kind === "canary_eval") {
        CanaryController.evaluate(parsed.canary, runtime.canary, item.atMs, emitEvent);
        continue;
      }

      // Workload tick: execute `concurrentCount` requests in parallel occupancy mode
      const w = parsed.workload[item.stepIndex]!;
      const concurrentHandles: ReleaseHandle[][] = [];
      const summariesInTick: MeshRequestSummary[] = [];

      for (let b = 0; b < w.concurrentCount; b++) {
        counters.totalRootRequests += 1;
        const reqId = `${w.id}-r${b + 1}`;
        const traceId = `trace-${reqId}`;
        const entryPolicy = policyByService.get(w.entryServiceId);
        const overallDeadlineMs = entryPolicy?.overallDeadlineMs ?? 2000;
        const entrySvc = serviceMap.get(w.entryServiceId) ?? parsed.services[0]!;

        emitEvent({
          type: "mesh.request.created",
          atMs: item.atMs,
          durationMs: 1,
          requestId: reqId,
          sourceServiceId: "external-client",
          destinationServiceId: entrySvc.id,
          protocol: w.protocol,
          operation: w.operation,
          explanation: `Request "${reqId}" entered "${entrySvc.name}" (${w.protocol.toUpperCase()} ${w.operation}).`,
        });

        const spans: MeshTraceSpan[] = [];
        const holdHandles: ReleaseHandle[] = [];
        concurrentHandles.push(holdHandles);

        const entrySpansStartMs = item.atMs;
        // Pick an entry service definition if there are dependencies to walk, or execute entry directly
        const entryRes = executeServiceCall({
          requestId: reqId,
          traceId,
          sourceServiceId: entrySvc.id,
          destServiceId: entrySvc.id,
          operation: w.operation,
          protocol: w.protocol,
          headers: w.headers,
          path: w.path,
          startMs: entrySpansStartMs,
          deadlineAtMs: entrySpansStartMs + overallDeadlineMs,
          spans,
          holdConcurrentResources: w.concurrentCount > 1 ? holdHandles : undefined,
          depth: 0,
        });

        // Mark critical path spans (longest-end-time chain)
        if (spans.length > 0) {
          let maxSpan = spans[0]!;
          for (const sp of spans) {
            if (sp.endMs >= maxSpan.endMs) maxSpan = sp;
          }
          const spanById = new Map(spans.map((s) => [s.spanId, s]));
          let cur: MeshTraceSpan | undefined = maxSpan;
          while (cur) {
            cur.onCriticalPath = true;
            cur = cur.parentSpanId ? spanById.get(cur.parentSpanId) : undefined;
          }
        }

        const totalDurationMs = Math.max(0, entryRes.endMs - entrySpansStartMs);
        rootLatencies.push(totalDurationMs);

        let reqStatus: MeshRequestSummary["status"] = "success";
        if (!entryRes.ok) {
          if (
            entryRes.statusLabel === "503" ||
            entryRes.statusLabel === "403" ||
            entryRes.statusLabel === "401" ||
            entryRes.statusLabel === "429" ||
            entryRes.statusLabel === "UNAUTHENTICATED" ||
            entryRes.statusLabel === "PERMISSION_DENIED" ||
            entryRes.statusLabel === "RESOURCE_EXHAUSTED" ||
            entryRes.statusLabel === "UNAVAILABLE"
          ) {
            reqStatus = "rejected";
          } else {
            reqStatus = "failed";
          }
          counters.failedCount += 1;
        } else if (entryRes.degraded) {
          reqStatus = "degraded";
          counters.degradedCount += 1;
        } else {
          counters.successCount += 1;
        }

        const summary: MeshRequestSummary = {
          requestId: reqId,
          traceId,
          entryServiceId: entrySvc.id,
          operation: w.operation,
          protocol: w.protocol,
          atMs: item.atMs,
          totalDurationMs,
          criticalPathMs: totalDurationMs,
          attemptCount: Math.max(entryRes.attemptsMade, spans.length),
          status: reqStatus,
          statusCodeLabel: entryRes.statusLabel,
          degradedReason: entryRes.degraded ? "Fallback response served" : undefined,
          spans,
        };
        summariesInTick.push(summary);
      }

      // Release concurrent swarm resources after burst finishes occupying them
      for (const handles of concurrentHandles) {
        for (const h of handles) {
          if (h.kind === "instance" && runtime.instances[h.id]) {
            runtime.instances[h.id]!.activeRequests = Math.max(
              0,
              runtime.instances[h.id]!.activeRequests - 1
            );
          } else if (
            h.kind === "pool" &&
            h.targetServiceId &&
            runtime.proxies[h.id]?.pools[h.targetServiceId]
          ) {
            const p = runtime.proxies[h.id]!.pools[h.targetServiceId]!;
            p.activeConnections = Math.max(0, p.activeConnections - 1);
            p.idleConnections += 1;
          } else if (h.kind === "bulkhead" && runtime.bulkheads[h.id]) {
            const bh = runtime.bulkheads[h.id]!;
            if (h.usedQueue) bh.queuedCount = Math.max(0, bh.queuedCount - 1);
            else bh.activeCount = Math.max(0, bh.activeCount - 1);
          }
        }
      }

      for (const summary of summariesInTick) {
        runtime.recentRequests.push(summary);
        if (runtime.recentRequests.length > 100) {
          runtime.recentRequests = runtime.recentRequests.slice(-100);
        }
        emitEvent({
          type: "mesh.response.delivered",
          atMs: summary.atMs + summary.totalDurationMs,
          durationMs: 1,
          requestId: summary.requestId,
          serviceId: summary.entryServiceId,
          status: summary.status,
          explanation: `Request "${summary.requestId}" finished with "${summary.status}" (${summary.statusCodeLabel}) in ${summary.totalDurationMs}ms.`,
        });
      }
    }

    const finalMetrics = computeMetrics(counters, rootLatencies);
    runtime.metrics = finalMetrics;

    const configuration: ExecutionConfiguration = {
      version: 1,
      entryNodeId: parsed.services[0]!.id,
      presetId: parsed.presetId,
      request: {
        id: parsed.workload[0]?.id ?? "mesh-req",
        method: "GET",
        path: parsed.workload[0]?.path ?? "/api/orders",
        headers: parsed.workload[0]?.headers ?? {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: parsed.limits.maxEvents,
        maxHops: 50,
        maxDurationMs: parsed.limits.maxVirtualDurationMs,
      },
      timing: { nodeDurationMs: 100, edgeDurationMs: 100 },
    };

    return {
      runId: `mesh-run-${parsed.id}`,
      architectureId: "arch_service_mesh_sim",
      architectureRevisionId: parsed.architectureRevisionId,
      snapshotHash: `mesh-snap-${parsed.id}-${parsed.seed}`,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: parsed.services.map((s) => s.id),
      traversedEdgeIds: [],
      configuration,
      events,
      totalDurationMs: runtime.virtualTimeMs,
      totalEvents: events.length,
      totalHops: counters.totalServiceCalls,
      outcome: counters.failedCount > 0 && counters.successCount === 0 ? "failure" : "success",
      terminalReason: `Service mesh simulation completed ${counters.totalRootRequests} root requests (${counters.successCount} ok, ${counters.degradedCount} degraded, ${counters.failedCount} failed).`,
      frames,
    };
  }
}

function emptyMetrics(): MeshMetrics {
  return {
    totalRootRequests: 0,
    totalServiceCalls: 0,
    successCount: 0,
    degradedCount: 0,
    failedCount: 0,
    timeoutCount: 0,
    retryCount: 0,
    retryAmplificationFactor: 1,
    circuitRejectionCount: 0,
    bulkheadRejectionCount: 0,
    authDeniedCount: 0,
    mtlsFailedCount: 0,
    poolRejectedCount: 0,
    fallbackCount: 0,
    p50LatencyMs: 0,
    p95LatencyMs: 0,
    p99LatencyMs: 0,
  };
}

function computeMetrics(
  counters: {
    totalRootRequests: number;
    totalServiceCalls: number;
    successCount: number;
    degradedCount: number;
    failedCount: number;
    timeoutCount: number;
    retryCount: number;
    circuitRejectionCount: number;
    bulkheadRejectionCount: number;
    authDeniedCount: number;
    mtlsFailedCount: number;
    poolRejectedCount: number;
    fallbackCount: number;
  },
  latencies: number[]
): MeshMetrics {
  const sorted = [...latencies].sort((a, b) => a - b);
  const pct = (p: number) => {
    if (sorted.length === 0) return 0;
    const idx = Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p));
    return sorted[idx] ?? 0;
  };
  return {
    totalRootRequests: counters.totalRootRequests,
    totalServiceCalls: counters.totalServiceCalls,
    successCount: counters.successCount,
    degradedCount: counters.degradedCount,
    failedCount: counters.failedCount,
    timeoutCount: counters.timeoutCount,
    retryCount: counters.retryCount,
    retryAmplificationFactor:
      counters.totalRootRequests > 0
        ? Math.round((counters.totalServiceCalls / counters.totalRootRequests) * 100) / 100
        : 1,
    circuitRejectionCount: counters.circuitRejectionCount,
    bulkheadRejectionCount: counters.bulkheadRejectionCount,
    authDeniedCount: counters.authDeniedCount,
    mtlsFailedCount: counters.mtlsFailedCount,
    poolRejectedCount: counters.poolRejectedCount,
    fallbackCount: counters.fallbackCount,
    p50LatencyMs: pct(0.5),
    p95LatencyMs: pct(0.95),
    p99LatencyMs: pct(0.99),
  };
}
