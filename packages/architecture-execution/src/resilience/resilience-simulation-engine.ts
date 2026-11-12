import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ExecutionSnapshot } from "../domain/execution-snapshot";
import type { ExecutionConfiguration, ExecutionOutcome } from "../schemas/execution.schemas";
import type { ExecutionEvent } from "../domain/execution-event";
import { type ExecutionTrace, ExecutionTraceHelper } from "../domain/execution-trace";
import { VirtualClock } from "../engine/virtual-clock";
import { ExecutionLimitsGuard } from "../engine/execution-limits";
import { RuntimeStateHelper, type ModeledRuntimeState } from "../domain/runtime-state";
import { PriorityQueue } from "../distributed/priority-queue";
import { CriticalPathAnalyzer } from "../tracing/critical-path";
import { DeterministicRandom } from "./deterministic-random";
import { CircuitBreakerEngine } from "./circuit-breaker-engine";
import { RetryEngine } from "./retry-engine";
import { FailoverEngine } from "./failover-engine";
import { BlastRadiusAnalyzer } from "./blast-radius-analyzer";
import type {
  FailureScenario,
  FaultDefinition,
  ResilienceMetrics,
  ScenarioComparison,
} from "./fault-schemas";
import type { TraceContext, TraceSpan, ExecutionBranch } from "../schemas/distributed.schemas";

interface ScheduledSimulationTask {
  id: string;
  atMs: number;
  priority: number;
  action: () => void;
}

export class ResilienceSimulationEngine {
  /**
   * Plans and executes a deterministic resilience simulation run with full fault injection,
   * retry policies, circuit breakers, failover routing, and virtual clock progression.
   */
  public static planResilienceExecution(
    snapshot: ExecutionSnapshot,
    scenario: FailureScenario,
    configuration: ExecutionConfiguration
  ): ExecutionTrace {
    const runId = `resil_run_${snapshot.snapshotHash.slice(5, 11)}_${Date.now()}`;
    const clock = new VirtualClock(0);
    const limitsGuard = new ExecutionLimitsGuard({
      maxEvents: scenario.limits?.maxEvents || configuration.limits.maxEvents || 400,
      maxHops: configuration.limits.maxHops || 50,
      maxDurationMs: scenario.limits?.maxVirtualDurationMs || configuration.limits.maxDurationMs || 60000,
    });
    const queue = new PriorityQueue<ScheduledSimulationTask>();
    const rng = new DeterministicRandom(scenario.seed || 42);

    const runtimeState = RuntimeStateHelper.createInitialState();
    const events: ExecutionEvent[] = [];
    const stateSnapshots: ModeledRuntimeState[] = [];
    const visitedNodeIds = new Set<string>();
    const traversedEdgeIds = new Set<string>();
    const allSpans: TraceSpan[] = [];

    // Metrics counters
    let totalRequests = 0;
    let successfulRequests = 0;
    let failedRequests = 0;
    let timedOutRequests = 0;
    let retryAttempts = 0;
    let failoverAttempts = 0;
    let recoveredRequests = 0;
    let circuitTrips = 0;

    let sequence = 1;
    const getSeq = () => sequence++;

    const enqueueTask = (task: ScheduledSimulationTask) => {
      queue.push(task, task.atMs, task.priority, getSeq());
    };

    const pushEvent = (evt: ExecutionEvent) => {
      events.push(evt);
      stateSnapshots.push(RuntimeStateHelper.cloneState(runtimeState));
      limitsGuard.recordEvent();
    };

    const nodeMap = new Map<string, BaseNode>(snapshot.nodes.map((n) => [n.id, n]));
    const edges = snapshot.edges;

    const findEdge = (src: string, tgt: string): BaseEdge | undefined => {
      return (
        edges.find((e) => e.source === src && e.target === tgt) ||
        edges.find((e) => e.source === tgt && e.target === src)
      );
    };

    // ------------------------------------------------------------------------
    // 1. Initialize Faults & Condition Tracking
    // ------------------------------------------------------------------------
    for (const fault of scenario.faults) {
      enqueueTask({
        id: `schedule_fault_${fault.id}`,
        atMs: fault.startAtMs,
        priority: 1, // High priority: faults activate before requests at same virtual time
        action: () => {
          activateFault(fault);
        },
      });

      if (fault.durationMs && fault.durationMs > 0) {
        enqueueTask({
          id: `resolve_fault_${fault.id}`,
          atMs: fault.startAtMs + fault.durationMs,
          priority: 2,
          action: () => {
            resolveFault(fault);
          },
        });
      }
    }

    const activateFault = (fault: FaultDefinition) => {
      runtimeState.activeFaultIds.push(fault.id);

      // Node faults
      if (fault.target.type === "node" || fault.target.type === "service_instance") {
        if (fault.type === "component.outage") {
          runtimeState.componentHealth[fault.target.targetId] = "unavailable";
        } else if (fault.type === "component.degraded") {
          runtimeState.componentHealth[fault.target.targetId] = "degraded";
        }
      }

      // Edge faults
      if (fault.target.type === "edge") {
        runtimeState.networkConditions[fault.target.targetId] = {
          disconnected: fault.type === "network.disconnected",
          additionalLatencyMs:
            fault.type === "network.latency"
              ? Number(fault.parameters.additionalLatencyMs || 500)
              : 0,
          packetLossRate:
            fault.type === "network.packet_loss"
              ? Number(fault.parameters.lossRate || 0.5)
              : 0,
          totalDroppedPackets: 0,
        };
      }

      pushEvent({
        id: `evt_fault_act_${fault.id}`,
        sequence: getSeq(),
        atMs: clock.now(),
        durationMs: 0,
        type: "fault.activated",
        faultId: fault.id,
        faultType: fault.type,
        targetId: fault.target.targetId,
        parameters: fault.parameters,
        explanation: `Injected fault [${fault.name}] activated on target "${fault.target.targetLabel || fault.target.targetId}".`,
      });

      // Calculate and report blast radius
      const blastRadius = BlastRadiusAnalyzer.calculateBlastRadius(snapshot.nodes, snapshot.edges, fault);
      pushEvent({
        id: `evt_fault_effect_${fault.id}`,
        sequence: getSeq(),
        atMs: clock.now(),
        durationMs: 0,
        type: "fault.effect.applied",
        faultId: fault.id,
        faultType: fault.type,
        targetId: fault.target.targetId,
        effectType:
          fault.type === "component.outage"
            ? "outage"
            : fault.type === "component.degraded"
            ? "degradation"
            : fault.type === "network.latency"
            ? "latency"
            : fault.type === "network.packet_loss"
            ? "packet_loss"
            : "outage",
        details: `Blast radius includes ${blastRadius.directlyAffectedNodeIds.length} direct nodes and ${blastRadius.downstreamAffectedNodeIds.length} downstream components. Causal depth: ${blastRadius.causalDepth}.`,
        explanation: `Fault impacts dependency graph: ${blastRadius.downstreamAffectedNodeIds.length} downstream nodes affected.`,
      });
    };

    const resolveFault = (fault: FaultDefinition) => {
      runtimeState.activeFaultIds = runtimeState.activeFaultIds.filter((id) => id !== fault.id);

      if (fault.target.type === "node" || fault.target.type === "service_instance") {
        runtimeState.componentHealth[fault.target.targetId] = "healthy";
      }

      if (fault.target.type === "edge") {
        delete runtimeState.networkConditions[fault.target.targetId];
      }

      pushEvent({
        id: `evt_fault_res_${fault.id}`,
        sequence: getSeq(),
        atMs: clock.now(),
        durationMs: fault.durationMs || 0,
        type: "fault.resolved",
        faultId: fault.id,
        faultType: fault.type,
        targetId: fault.target.targetId,
        explanation: `Fault [${fault.name}] resolved on target "${fault.target.targetLabel || fault.target.targetId}". Component health restored.`,
      });
    };

    // ------------------------------------------------------------------------
    // 2. Setup Root Request & Execution Context
    // ------------------------------------------------------------------------
    const entryNodeId = configuration.entryNodeId || snapshot.nodes[0]?.id || "node_1";
    const entryNode = nodeMap.get(entryNodeId);
    visitedNodeIds.add(entryNodeId);

    const rootTraceContext: TraceContext = {
      requestId: `req_${Date.now()}`,
      correlationId: `corr_${Date.now()}`,
      traceId: `trace_${runId}`,
      spanId: `span_root_${runId}`,
      branchId: "branch_main",
    };

    const rootBranch: ExecutionBranch = {
      id: "branch_main",
      name: "Main Journey",
      originNodeId: entryNodeId,
      targetNodeId: entryNodeId,
      startedAtMs: 0,
      status: "active",
      spanId: rootTraceContext.spanId,
    };
    runtimeState.activeBranches.push(rootBranch);

    const rootSpan: TraceSpan = {
      traceId: rootTraceContext.traceId,
      spanId: rootTraceContext.spanId,
      branchId: rootTraceContext.branchId,
      name: `${configuration.request.method} ${configuration.request.path}`,
      componentId: entryNodeId,
      componentLabel: entryNode?.label || entryNodeId,
      startMs: 0,
      status: "running",
      attributes: {
        "http.method": configuration.request.method,
        "http.target": configuration.request.path,
        "scenario.name": scenario.name,
      },
    };
    allSpans.push(rootSpan);
    runtimeState.activeSpans.push(rootSpan);

    pushEvent({
      id: `evt_run_start_${runId}`,
      sequence: getSeq(),
      atMs: 0,
      durationMs: 0,
      type: "run.started",
      entryNodeId,
      request: configuration.request,
      traceId: rootTraceContext.traceId,
      spanId: rootTraceContext.spanId,
      branchId: rootTraceContext.branchId,
      explanation: `Resilience execution initialized at "${entryNode?.label || entryNodeId}" for scenario "${scenario.name}".`,
    });

    totalRequests++;

    // ------------------------------------------------------------------------
    // 3. Recursive Component Dispatcher with Resilience Handling
    // ------------------------------------------------------------------------
    const dispatchToComponent = (
      sourceNodeId: string,
      targetNodeId: string,
      operationName: string,
      context: TraceContext,
      attemptNumber = 1
    ) => {
      const sourceNode = nodeMap.get(sourceNodeId);
      let effectiveTargetId = targetNodeId;
      let effectiveTargetNode = nodeMap.get(effectiveTargetId);

      // Check Failover Policy
      const failoverPolicy = scenario.failoverPolicies[targetNodeId];
      const isTargetUnavailable =
        runtimeState.componentHealth[targetNodeId] === "unavailable" ||
        runtimeState.circuitBreakers[targetNodeId]?.state === "open";

      if (failoverPolicy && isTargetUnavailable) {
        const failoverEval = FailoverEngine.evaluateFailover(runtimeState, failoverPolicy);
        if (failoverEval.selected && failoverEval.selectedTargetId) {
          effectiveTargetId = failoverEval.selectedTargetId;
          effectiveTargetNode = nodeMap.get(effectiveTargetId);
          failoverAttempts++;

          pushEvent({
            id: `evt_failover_${effectiveTargetId}_${clock.now()}`,
            sequence: getSeq(),
            atMs: clock.now(),
            durationMs: 15,
            type: "failover.target.selected",
            primaryTargetId: targetNodeId,
            selectedTargetId: effectiveTargetId,
            evaluatedTargets: failoverEval.evaluatedTargets,
            reason: failoverEval.reason,
            traceId: context.traceId,
            spanId: context.spanId,
            branchId: context.branchId,
            explanation: failoverEval.reason,
          });
        }
      }

      // Check Circuit Breaker Policy
      const cbPolicy = scenario.circuitBreakers[effectiveTargetId];
      if (cbPolicy) {
        const cbCheck = CircuitBreakerEngine.shouldAllowRequest(runtimeState, cbPolicy, clock.now());
        if (cbCheck.stateChanged && cbCheck.newState === "half-open") {
          pushEvent({
            id: `evt_cb_halfopen_${effectiveTargetId}_${clock.now()}`,
            sequence: getSeq(),
            atMs: clock.now(),
            durationMs: 0,
            type: "circuit.half_opened",
            targetNodeId: effectiveTargetId,
            allowedProbeCount: cbPolicy.halfOpenProbeLimit,
            probeTimeoutMs: 1000,
            traceId: context.traceId,
            spanId: context.spanId,
            branchId: context.branchId,
            explanation: `Circuit breaker entered HALF-OPEN probe state on "${effectiveTargetNode?.label || effectiveTargetId}".`,
          });
        }

        if (!cbCheck.allowed) {
          // Circuit is OPEN: fast fail immediately
          circuitTrips++;
          failedRequests++;

          pushEvent({
            id: `evt_cb_fastfail_${effectiveTargetId}_${clock.now()}`,
            sequence: getSeq(),
            atMs: clock.now(),
            durationMs: 5,
            type: "circuit.opened",
            targetNodeId: effectiveTargetId,
            consecutiveFailures: cbPolicy.failureThreshold,
            failureThreshold: cbPolicy.failureThreshold,
            openDurationMs: cbPolicy.openDurationMs,
            reason: cbCheck.reason,
            traceId: context.traceId,
            spanId: context.spanId,
            branchId: context.branchId,
            explanation: `Request rejected by circuit breaker: ${cbCheck.reason}`,
          });
          return;
        }
      }

      // Check Edge Network Conditions
      const edge = findEdge(sourceNodeId, effectiveTargetId);
      let transitDelayMs = 40;
      if (edge) {
        traversedEdgeIds.add(edge.id);
        const netCondition = runtimeState.networkConditions[edge.id];
        if (netCondition) {
          if (netCondition.disconnected) {
            failedRequests++;
            pushEvent({
              id: `evt_net_disc_${edge.id}_${clock.now()}`,
              sequence: getSeq(),
              atMs: clock.now(),
              durationMs: 10,
              type: "fault.effect.applied",
              faultId: "fault_network_disc",
              faultType: "network.disconnected",
              targetId: edge.id,
              effectType: "outage",
              details: `Transit link ${edge.id} severed; request cannot reach target.`,
              traceId: context.traceId,
              spanId: context.spanId,
              branchId: context.branchId,
              explanation: `Network link between "${sourceNode?.label || sourceNodeId}" and "${effectiveTargetNode?.label || effectiveTargetId}" is disconnected.`,
            });
            handleRetryOrFailure(sourceNodeId, effectiveTargetId, "network_disconnected", context, attemptNumber);
            return;
          }

          if (netCondition.packetLossRate > 0) {
            const isDropped = rng.testChance(netCondition.packetLossRate);
            if (isDropped) {
              netCondition.totalDroppedPackets++;
              pushEvent({
                id: `evt_pkt_loss_${edge.id}_${clock.now()}`,
                sequence: getSeq(),
                atMs: clock.now(),
                durationMs: 15,
                type: "fault.effect.applied",
                faultId: "fault_packet_loss",
                faultType: "network.packet_loss",
                targetId: edge.id,
                effectType: "packet_loss",
                details: `Packet dropped on edge ${edge.id} (loss rate: ${(netCondition.packetLossRate * 100).toFixed(0)}%).`,
                traceId: context.traceId,
                spanId: context.spanId,
                branchId: context.branchId,
                explanation: `50% packet loss dropped request in transit to "${effectiveTargetNode?.label || effectiveTargetId}".`,
              });
              handleRetryOrFailure(sourceNodeId, effectiveTargetId, "packet_loss", context, attemptNumber);
              return;
            }
          }

          if (netCondition.additionalLatencyMs > 0) {
            transitDelayMs += netCondition.additionalLatencyMs;
          }
        }
      }

      // Schedule arrival at target component
      const arrivalTime = clock.now() + transitDelayMs;
      enqueueTask({
        id: `component_arrive_${effectiveTargetId}_${arrivalTime}_${attemptNumber}`,
        atMs: arrivalTime,
        priority: 5,
        action: () => {
          visitedNodeIds.add(effectiveTargetId);

          const childSpan: TraceSpan = {
            traceId: context.traceId,
            spanId: `span_${effectiveTargetId}_${clock.now()}`,
            branchId: context.branchId,
            parentSpanId: context.spanId,
            name: `${operationName} on ${effectiveTargetNode?.label || effectiveTargetId}`,
            componentId: effectiveTargetId,
            componentLabel: effectiveTargetNode?.label || effectiveTargetId,
            startMs: clock.now(),
            status: "running",
            attributes: {
              attempt: attemptNumber,
              targetId: effectiveTargetId,
            },
          };
          allSpans.push(childSpan);
          runtimeState.activeSpans.push(childSpan);

          pushEvent({
            id: `evt_node_enter_${effectiveTargetId}_${clock.now()}`,
            sequence: getSeq(),
            atMs: clock.now(),
            durationMs: 0,
            type: "node.entered",
            nodeId: effectiveTargetId,
            nodeLabel: effectiveTargetNode?.label || effectiveTargetId,
            componentType: String((effectiveTargetNode?.data as any)?.componentType || effectiveTargetNode?.type || "service"),
            hopIndex: 1,
            request: configuration.request,
            traceId: context.traceId,
            spanId: childSpan.spanId,
            branchId: context.branchId,
            explanation: `Request reached "${effectiveTargetNode?.label || effectiveTargetId}".`,
          });

          // Check Target Node Health
          const health = runtimeState.componentHealth[effectiveTargetId] || "healthy";
          if (health === "unavailable") {
            failedRequests++;
            childSpan.status = "error";
            childSpan.endMs = clock.now() + 20;
            childSpan.attributes["error"] = "Target service unavailable (outage)";

            if (cbPolicy) {
              const tripResult = CircuitBreakerEngine.recordFailure(runtimeState, cbPolicy, clock.now(), "Target node offline");
              if (tripResult.tripped) {
                pushEvent({
                  id: `evt_cb_tripped_${effectiveTargetId}_${clock.now()}`,
                  sequence: getSeq(),
                  atMs: clock.now(),
                  durationMs: 0,
                  type: "circuit.opened",
                  targetNodeId: effectiveTargetId,
                  consecutiveFailures: cbPolicy.failureThreshold,
                  failureThreshold: cbPolicy.failureThreshold,
                  openDurationMs: cbPolicy.openDurationMs,
                  reason: tripResult.reason,
                  traceId: context.traceId,
                  spanId: childSpan.spanId,
                  branchId: context.branchId,
                  explanation: tripResult.reason,
                });
              }
            }

            handleRetryOrFailure(sourceNodeId, effectiveTargetId, "connection_refused", context, attemptNumber);
            return;
          }

          // Check if target is degraded
          let processingDurationMs = 60;
          if (health === "degraded") {
            processingDurationMs = 280;
            // Potential transient failure in degraded mode
            if (rng.testChance(0.6)) {
              failedRequests++;
              childSpan.status = "error";
              childSpan.endMs = clock.now() + processingDurationMs;
              childSpan.attributes["error"] = "503 Service Degraded Overload";

              if (cbPolicy) {
                CircuitBreakerEngine.recordFailure(runtimeState, cbPolicy, clock.now(), "503 Degraded Error");
              }

              handleRetryOrFailure(sourceNodeId, effectiveTargetId, "503", context, attemptNumber);
              return;
            }
          }

          // Processing succeeds
          const completionTime = clock.now() + processingDurationMs;
          enqueueTask({
            id: `component_complete_${effectiveTargetId}_${completionTime}`,
            atMs: completionTime,
            priority: 4,
            action: () => {
              childSpan.status = "success";
              childSpan.endMs = clock.now();
              successfulRequests++;
              if (attemptNumber > 1) {
                recoveredRequests++;
              }

              if (cbPolicy) {
                const cbSuccess = CircuitBreakerEngine.recordSuccess(runtimeState, cbPolicy, clock.now());
                if (cbSuccess.closed) {
                  pushEvent({
                    id: `evt_cb_closed_${effectiveTargetId}_${clock.now()}`,
                    sequence: getSeq(),
                    atMs: clock.now(),
                    durationMs: 0,
                    type: "circuit.closed",
                    targetNodeId: effectiveTargetId,
                    consecutiveSuccesses: cbPolicy.successThreshold,
                    recoveredAtMs: clock.now(),
                    traceId: context.traceId,
                    spanId: childSpan.spanId,
                    branchId: context.branchId,
                    explanation: cbSuccess.reason,
                  });
                }
              }

              pushEvent({
                id: `evt_proc_done_${effectiveTargetId}_${clock.now()}`,
                sequence: getSeq(),
                atMs: clock.now(),
                durationMs: processingDurationMs,
                type: "component.processing.completed",
                nodeId: effectiveTargetId,
                operation: operationName,
                status: "success",
                traceId: context.traceId,
                spanId: childSpan.spanId,
                branchId: context.branchId,
                explanation: `Component "${effectiveTargetNode?.label || effectiveTargetId}" successfully processed ${operationName}.`,
              });

              // Check if there is a downstream component to cascade to
              const outgoingEdges = edges.filter((e) => e.source === effectiveTargetId);
              if (outgoingEdges.length > 0) {
                const nextEdge = outgoingEdges[0];
                dispatchToComponent(
                  effectiveTargetId,
                  nextEdge.target,
                  "Downstream Query",
                  { ...context, spanId: childSpan.spanId },
                  1
                );
              }
            },
          });
        },
      });
    };

    const handleRetryOrFailure = (
      sourceNodeId: string,
      targetNodeId: string,
      failureType: string,
      context: TraceContext,
      _attemptNumber = 1
    ) => {
      const retryPolicy = scenario.retryPolicies[sourceNodeId] || scenario.retryPolicies["default"];
      if (!retryPolicy) {
        return;
      }

      const retryEval = RetryEngine.evaluateRetry(
        runtimeState,
        retryPolicy,
        context.requestId,
        failureType,
        null,
        clock.now(),
        rng
      );

      if (retryEval.shouldRetry) {
        retryAttempts++;
        pushEvent({
          id: `evt_retry_sched_${targetNodeId}_${retryEval.attemptNumber}_${clock.now()}`,
          sequence: getSeq(),
          atMs: clock.now(),
          durationMs: 0,
          type: "retry.scheduled",
          requestId: context.requestId,
          attemptNumber: retryEval.attemptNumber,
          maxAttempts: retryEval.maxAttempts,
          backoffDelayMs: retryEval.backoffDelayMs,
          scheduledAtMs: retryEval.scheduledAtMs,
          sourceNodeId,
          targetNodeId,
          reason: retryEval.reason,
          traceId: context.traceId,
          spanId: context.spanId,
          branchId: context.branchId,
          explanation: retryEval.reason,
        });

        enqueueTask({
          id: `execute_retry_${context.requestId}_${retryEval.attemptNumber}`,
          atMs: retryEval.scheduledAtMs,
          priority: 3,
          action: () => {
            pushEvent({
              id: `evt_retry_start_${context.requestId}_${retryEval.attemptNumber}`,
              sequence: getSeq(),
              atMs: clock.now(),
              durationMs: 0,
              type: "retry.started",
              requestId: context.requestId,
              attemptNumber: retryEval.attemptNumber,
              maxAttempts: retryEval.maxAttempts,
              sourceNodeId,
              targetNodeId,
              traceId: context.traceId,
              spanId: context.spanId,
              branchId: context.branchId,
              explanation: `Executing retry attempt ${retryEval.attemptNumber}/${retryEval.maxAttempts} to "${nodeMap.get(targetNodeId)?.label || targetNodeId}".`,
            });

            dispatchToComponent(sourceNodeId, targetNodeId, "Retried Request", context, retryEval.attemptNumber);
          },
        });
      } else {
        pushEvent({
          id: `evt_retry_exhausted_${context.requestId}_${clock.now()}`,
          sequence: getSeq(),
          atMs: clock.now(),
          durationMs: 0,
          type: "retry.exhausted",
          requestId: context.requestId,
          totalAttempts: retryEval.attemptNumber,
          sourceNodeId,
          targetNodeId,
          finalError: retryEval.reason,
          traceId: context.traceId,
          spanId: context.spanId,
          branchId: context.branchId,
          explanation: retryEval.reason,
        });
      }
    };

    // ------------------------------------------------------------------------
    // 4. Initial Trigger: Dispatch from Entry Node to First Downstream
    // ------------------------------------------------------------------------
    const initialEdges = edges.filter((e) => e.source === entryNodeId);
    if (initialEdges.length > 0) {
      dispatchToComponent(entryNodeId, initialEdges[0].target, "Initial Request", rootTraceContext, 1);
    }

    const maxTimeMs = scenario.limits?.maxVirtualDurationMs || 60000;

    // ------------------------------------------------------------------------
    // 5. Main Simulation Clock & Queue Loop
    // ------------------------------------------------------------------------
    while (!queue.isEmpty && !limitsGuard.isEventLimitReached() && clock.now() < maxTimeMs) {
      const task = queue.pop()!;
      clock.setTime(task.atMs);
      task.action();
    }

    // Close Root Span
    rootSpan.endMs = clock.now();
    rootSpan.status = failedRequests > 0 && successfulRequests === 0 ? "error" : "success";

    // Compute Critical Path
    const criticalPathSpanIds = CriticalPathAnalyzer.calculateCriticalPath(allSpans);
    runtimeState.criticalPathSpanIds = criticalPathSpanIds;

    // Calculate Final Resilience Metrics
    const totalRuns = successfulRequests + failedRequests;
    const availabilityPercent =
      totalRuns > 0 ? Number(((successfulRequests / totalRuns) * 100).toFixed(1)) : 100;

    const resilienceMetrics: ResilienceMetrics = {
      totalRequests,
      successfulRequests,
      failedRequests,
      timedOutRequests,
      retryAttempts,
      failoverAttempts,
      recoveredRequests,
      circuitTrips,
      meanRecoveryDurationMs: 350,
      queueBacklog: 0,
      deadLetterCount: 0,
      criticalPathDelayMs: clock.now(),
      availabilityPercent,
    };
    runtimeState.resilienceMetrics = resilienceMetrics;

    const outcome: ExecutionOutcome =
      failedRequests > 0 && successfulRequests === 0
        ? "failure"
        : "success";

    const terminalReason =
      outcome === "success" && failedRequests === 0
        ? `Resilience simulation succeeded with 100% availability.`
        : outcome === "success"
        ? `Simulation completed with failovers/retries (${availabilityPercent}% availability).`
        : `Simulation encountered unrecovered failures (${failedRequests} failed requests).`;

    pushEvent({
      id: `evt_run_complete_${runId}`,
      sequence: getSeq(),
      atMs: clock.now(),
      durationMs: clock.now(),
      type: "run.completed",
      outcome,
      terminalNodeId: Array.from(visitedNodeIds).pop() || entryNodeId,
      terminalReason,
      totalHops: visitedNodeIds.size,
      traceId: rootTraceContext.traceId,
      spanId: rootTraceContext.spanId,
      branchId: rootTraceContext.branchId,
      explanation: `Resilience execution concluded at virtual time ${clock.now()}ms. Availability: ${availabilityPercent}%.`,
    });

    const frames = ExecutionTraceHelper.generateFrames(events, stateSnapshots);

    return {
      runId,
      architectureId: snapshot.architectureId,
      architectureRevisionId: snapshot.architectureRevisionId,
      snapshotHash: snapshot.snapshotHash,
      configuration,
      events,
      totalDurationMs: clock.now(),
      totalEvents: events.length,
      totalHops: visitedNodeIds.size,
      outcome,
      terminalReason,
      visitedNodeIds: Array.from(visitedNodeIds),
      traversedEdgeIds: Array.from(traversedEdgeIds),
      frames,
      spans: allSpans,
      criticalPathSpanIds,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Compares a baseline execution trace against a failure scenario execution trace,
   * producing a detailed resilience comparison and divergence report.
   */
  public static compareScenarios(
    baselineTrace: ExecutionTrace,
    failureTrace: ExecutionTrace,
    baselineScenario: FailureScenario,
    failureScenario: FailureScenario
  ): ScenarioComparison {
    const lastBaselineFrame = baselineTrace.frames[baselineTrace.frames.length - 1];
    const lastBaselineState = lastBaselineFrame?.runtimeState;

    const lastFailureFrame = failureTrace.frames[failureTrace.frames.length - 1];
    const lastFailureState = lastFailureFrame?.runtimeState;

    const baselineMetrics: ResilienceMetrics = lastBaselineState?.resilienceMetrics || {
      totalRequests: 1,
      successfulRequests: 1,
      failedRequests: 0,
      timedOutRequests: 0,
      retryAttempts: 0,
      failoverAttempts: 0,
      recoveredRequests: 0,
      circuitTrips: 0,
      meanRecoveryDurationMs: 0,
      queueBacklog: 0,
      deadLetterCount: 0,
      criticalPathDelayMs: baselineTrace.totalDurationMs,
      availabilityPercent: 100,
    };

    const failureMetrics: ResilienceMetrics = lastFailureState?.resilienceMetrics || {
      totalRequests: 1,
      successfulRequests: failureTrace.outcome === "success" ? 1 : 0,
      failedRequests: failureTrace.outcome === "failure" ? 1 : 0,
      timedOutRequests: 0,
      retryAttempts: 1,
      failoverAttempts: 0,
      recoveredRequests: 0,
      circuitTrips: 0,
      meanRecoveryDurationMs: 0,
      queueBacklog: 0,
      deadLetterCount: 0,
      criticalPathDelayMs: failureTrace.totalDurationMs,
      availabilityPercent: failureTrace.outcome === "success" ? 100 : 0,
    };

    const availabilityDiffPercent = Number(
      (failureMetrics.availabilityPercent - baselineMetrics.availabilityPercent).toFixed(1)
    );
    const latencyDiffMs = failureTrace.totalDurationMs - baselineTrace.totalDurationMs;
    const additionalFailuresCount = Math.max(0, failureMetrics.failedRequests - baselineMetrics.failedRequests);
    const additionalRetriesCount = Math.max(0, failureMetrics.retryAttempts - baselineMetrics.retryAttempts);

    // Identify divergent spans
    const baselineSpans = baselineTrace.spans || lastBaselineState?.activeSpans || [];
    const failureSpans = failureTrace.spans || lastFailureState?.activeSpans || [];
    const divergentSpans: ScenarioComparison["divergentSpans"] = [];

    for (const fSpan of failureSpans) {
      const bSpan = baselineSpans.find((s) => s.componentId === fSpan.componentId);
      const bDuration = bSpan ? (bSpan.endMs || bSpan.startMs) - bSpan.startMs : 0;
      const fDuration = (fSpan.endMs || fSpan.startMs) - fSpan.startMs;

      if (!bSpan || fSpan.status !== bSpan.status || Math.abs(fDuration - bDuration) > 50) {
        divergentSpans.push({
          spanId: fSpan.spanId,
          name: fSpan.name,
          componentId: fSpan.componentId,
          baselineDurationMs: bDuration,
          failureDurationMs: fDuration,
          baselineStatus: bSpan?.status || "missing",
          failureStatus: fSpan.status,
          divergenceReason:
            fSpan.status === "error"
              ? "Operation failed due to injected fault"
              : fDuration > bDuration
              ? `Latency expanded by +${fDuration - bDuration}ms under degraded conditions`
              : "Divergent execution path taken",
        });
      }
    }

    const summary =
      additionalFailuresCount === 0 && additionalRetriesCount === 0
        ? `Architecture demonstrated complete resilience: 0 unrecovered failures and 0 latency penalty.`
        : additionalFailuresCount === 0
        ? `Architecture absorbed the failure scenario through retries/failover without user-facing outages (Availability: ${failureMetrics.availabilityPercent}%).`
        : `Architecture experienced partial degradation under "${failureScenario.name}": ${additionalFailuresCount} request failure(s) observed.`;

    return {
      baselineScenarioId: baselineScenario.id,
      failureScenarioId: failureScenario.id,
      baselineMetrics,
      failureMetrics,
      availabilityDiffPercent,
      latencyDiffMs,
      additionalFailuresCount,
      additionalRetriesCount,
      unrecoveredRequestIds: failureMetrics.failedRequests > 0 ? ["req_unrecovered"] : [],
      divergentSpans,
      summary,
    };
  }
}
