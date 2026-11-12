import type { BaseNode } from "@nxtqr/graph-schema";
import type { ExecutionSnapshot } from "../domain/execution-snapshot";
import type { ExecutionConfiguration, ExecutionOutcome } from "../schemas/execution.schemas";
import type { ExecutionEvent } from "../domain/execution-event";
import { type ExecutionTrace, ExecutionTraceHelper, type TravelingMarkerData } from "../domain/execution-trace";
import { VirtualClock } from "../engine/virtual-clock";
import { ExecutionLimitsGuard } from "../engine/execution-limits";
import { RuntimeStateHelper, type ModeledRuntimeState } from "../domain/runtime-state";
import { PriorityQueue } from "../distributed/priority-queue";
import { DeterministicRandom } from "../resilience/deterministic-random";
import { WorkloadGenerator } from "./workload-generator";
import { WorkerPool } from "./worker-pool";
import { RequestQueueManager } from "./request-queue";
import { LoadDistributionEngine } from "./load-distribution";
import { RateLimiterEngine } from "./rate-limiter";
import { AutoscalingEngine } from "./autoscaling-engine";
import { MetricAggregator, type CompletedRequestRecord } from "./metric-aggregator";
import { DETERMINISTIC_EPOCH_ISO, createDeterministicId } from "../orchestrator/deterministic-id";
import type {
  TrafficScenario,
  PerformanceSample,
  SimulationComparison,
} from "./traffic-schemas";

interface ScheduledTrafficTask {
  id: string;
  atMs: number;
  priority: number;
  action: () => void;
}

export class TrafficSimulationEngine {
  public static runTrafficSimulation(
    snapshot: ExecutionSnapshot,
    arg2: TrafficScenario | ExecutionConfiguration,
    arg3: ExecutionConfiguration | TrafficScenario
  ): ExecutionTrace {
    const scenario = "workload" in arg2 ? (arg2 as TrafficScenario) : (arg3 as TrafficScenario);
    const config = "workload" in arg2 ? (arg3 as ExecutionConfiguration) : (arg2 as ExecutionConfiguration);
    return this.planTrafficSimulation(snapshot, scenario, config);
  }

  /**
   * Plans and executes a deterministic traffic simulation run.
   */
  public static planTrafficSimulation(
    snapshot: ExecutionSnapshot,
    scenario: TrafficScenario,
    configuration: ExecutionConfiguration
  ): ExecutionTrace {
    const runId = createDeterministicId("traffic_run", `${snapshot.snapshotHash}:${scenario.id}:${scenario.seed}`);
    const clock = new VirtualClock(0);
    const limitsGuard = new ExecutionLimitsGuard({
      maxEvents: scenario.limits.maxEvents,
      maxHops: configuration.limits?.maxHops || 50,
      maxDurationMs: scenario.limits.maxVirtualDurationMs,
    });
    const queue = new PriorityQueue<ScheduledTrafficTask>();
    const rng = new DeterministicRandom(scenario.seed);
    const queueManager = new RequestQueueManager();

    const runtimeState = RuntimeStateHelper.createInitialState();
    const events: ExecutionEvent[] = [];
    const stateSnapshots: ModeledRuntimeState[] = [];
    const visitedNodeIds = new Set<string>();
    const traversedEdgeIds = new Set<string>();
    const completedRecords: CompletedRequestRecord[] = [];
    const samples: PerformanceSample[] = [];

    let sequence = 1;
    const getSeq = () => sequence++;

    const pushEvent = (evt: ExecutionEvent) => {
      events.push(evt);
      stateSnapshots.push(RuntimeStateHelper.cloneState(runtimeState));
      limitsGuard.recordEvent();
    };

    const enqueueTask = (task: ScheduledTrafficTask) => {
      queue.push(task, task.atMs, task.priority, getSeq());
    };

    const nodeMap = new Map<string, BaseNode>(snapshot.nodes.map((n) => [n.id, n]));
    const edges = snapshot.edges;

    // ------------------------------------------------------------------------
    // 1. Initialize Capacity, Queues, Rate Limiters, Autoscaling in State
    // ------------------------------------------------------------------------
    for (const [nodeId, cap] of Object.entries(scenario.capacities)) {
      runtimeState.trafficInstances[nodeId] = WorkerPool.initializeInstances(cap, 0);
      runtimeState.trafficQueues[nodeId] = {
        nodeId,
        capacity: cap.queueCapacity,
        waitingCount: 0,
        rejectedCount: 0,
        totalEnqueuedCount: 0,
        admissionPolicy: cap.admissionPolicy,
      };
      if (scenario.autoscaling[nodeId]) {
        runtimeState.trafficAutoscaling[nodeId] = AutoscalingEngine.initializeState(
          nodeId,
          runtimeState.trafficInstances[nodeId].length
        );
      }
    }

    for (const [nodeId, rlConfig] of Object.entries(scenario.rateLimiters)) {
      runtimeState.trafficRateLimiters[nodeId] = RateLimiterEngine.initialize(rlConfig, 0);
    }

    // Counters
    let totalScheduledArrivals = 0;
    let activeInFlight = 0;
    let timedOutCount = 0;
    let rejectedCount = 0;
    let scalingEventsCount = 0;

    // ------------------------------------------------------------------------
    // 2. Generate Workload Arrivals & Enqueue
    // ------------------------------------------------------------------------
    const arrivals = WorkloadGenerator.generateArrivals(scenario);
    totalScheduledArrivals = arrivals.length;

    for (const arrival of arrivals) {
      enqueueTask({
        id: `arrival_${arrival.requestId}`,
        atMs: arrival.arrivalMs,
        priority: 5,
        action: () => {
          handleRequestArrival(arrival.requestId, arrival.entryNodeId, arrival.virtualUserId);
        },
      });
    }

    // ------------------------------------------------------------------------
    // 3. Periodic Metric Sampling & Autoscaling Evaluation
    // ------------------------------------------------------------------------
    const sampleIntervalMs = scenario.limits.metricSamplingIntervalMs || 500;
    let lastSampleWindowMs = 0;
    let arrivalsInCurrentWindow = 0;

    const scheduleNextSample = (atMs: number) => {
      if (atMs >= scenario.durationMs) return;

      enqueueTask({
        id: `metric_sample_${atMs}`,
        atMs,
        priority: 10,
        action: () => {
          const sample = MetricAggregator.computeWindowSample(
            lastSampleWindowMs,
            atMs,
            arrivalsInCurrentWindow,
            completedRecords,
            activeInFlight,
            runtimeState.trafficInstances,
            runtimeState.trafficQueues
          );
          samples.push(sample);
          runtimeState.trafficCurrentSample = sample;

          pushEvent({
            id: `evt_sample_${atMs}`,
            sequence: getSeq(),
            atMs,
            durationMs: sampleIntervalMs,
            type: "traffic.metrics.sample",
            sample,
            explanation: `Virtual interval sample: ${sample.completedRps} completed req/s, P95: ${sample.p95LatencyMs}ms, In-Flight: ${sample.activeInFlight}.`,
          });

          // Evaluate Autoscaling across services
          for (const [nodeId, asPolicy] of Object.entries(scenario.autoscaling)) {
            const capConfig = scenario.capacities[nodeId];
            const asState = runtimeState.trafficAutoscaling[nodeId];
            const instances = runtimeState.trafficInstances[nodeId] || [];

            if (capConfig && asState) {
              const evalResult = AutoscalingEngine.evaluateScaling(
                asPolicy,
                capConfig,
                asState,
                instances,
                atMs
              );

              if (evalResult.action === "scale_out" && evalResult.newInstance) {
                scalingEventsCount++;
                const newInst = evalResult.newInstance;
                instances.push(newInst);

                pushEvent({
                  id: `evt_scaleout_${nodeId}_${atMs}`,
                  sequence: getSeq(),
                  atMs,
                  durationMs: asPolicy.provisioningDelayMs,
                  type: "autoscale.scaleout.requested",
                  serviceNodeId: nodeId,
                  fromInstances: evalResult.fromInstances,
                  toInstances: evalResult.toInstances,
                  provisioningDelayMs: asPolicy.provisioningDelayMs,
                  readyAtMs: evalResult.readyAtMs || atMs,
                  triggerReason: evalResult.reason,
                  explanation: evalResult.reason,
                });

                if (asPolicy.provisioningDelayMs > 0) {
                  enqueueTask({
                    id: `scaleout_ready_${newInst.id}`,
                    atMs: evalResult.readyAtMs || atMs,
                    priority: 2,
                    action: () => {
                      newInst.status = "healthy";
                      pushEvent({
                        id: `evt_inst_ready_${newInst.id}_${clock.now()}`,
                        sequence: getSeq(),
                        atMs: clock.now(),
                        durationMs: 0,
                        type: "autoscale.instance.ready",
                        serviceNodeId: nodeId,
                        instanceId: newInst.id,
                        totalActiveInstances: instances.filter((i) => i.status === "healthy").length,
                        explanation: `Autoscaled instance ${newInst.id} provisioned and ready for traffic on "${nodeMap.get(nodeId)?.label || nodeId}".`,
                      });
                      // Drain queue if waiting
                      drainQueueIfAvailable(nodeId);
                    },
                  });
                }
              } else if (evalResult.action === "scale_in" && evalResult.removedInstanceId) {
                scalingEventsCount++;
                const removeIdx = instances.findIndex((i) => i.id === evalResult.removedInstanceId);
                if (removeIdx !== -1) {
                  instances.splice(removeIdx, 1);
                }

                pushEvent({
                  id: `evt_scalein_${nodeId}_${atMs}`,
                  sequence: getSeq(),
                  atMs,
                  durationMs: 0,
                  type: "autoscale.scalein.requested",
                  serviceNodeId: nodeId,
                  fromInstances: evalResult.fromInstances,
                  toInstances: evalResult.toInstances,
                  triggerReason: evalResult.reason,
                  explanation: evalResult.reason,
                });
              }
            }
          }

          lastSampleWindowMs = atMs;
          arrivalsInCurrentWindow = 0;
          scheduleNextSample(atMs + sampleIntervalMs);
        },
      });
    };

    scheduleNextSample(sampleIntervalMs);

    // ------------------------------------------------------------------------
    // 4. Request Dispatch & Pipeline Lifecycle
    // ------------------------------------------------------------------------
    const handleRequestArrival = (requestId: string, entryNodeId: string, virtualUserId?: string) => {
      activeInFlight++;
      arrivalsInCurrentWindow++;
      visitedNodeIds.add(entryNodeId);

      const entryNode = nodeMap.get(entryNodeId);

      pushEvent({
        id: `evt_req_arrive_${requestId}`,
        sequence: getSeq(),
        atMs: clock.now(),
        durationMs: 0,
        type: "traffic.request.arrived",
        requestId,
        virtualUserId,
        entryNodeId,
        activeInFlight,
        explanation: `Virtual request "${requestId}" arrived at entry point "${entryNode?.label || entryNodeId}".`,
      });

      // Check Rate Limiter on entry node if configured
      const rlConfig = scenario.rateLimiters[entryNodeId];
      const rlState = runtimeState.trafficRateLimiters[entryNodeId];

      if (rlConfig && rlState) {
        const rlResult = RateLimiterEngine.checkAndConsume(rlState, rlConfig, clock.now());
        if (!rlResult.allowed) {
          activeInFlight--;
          rejectedCount++;

          completedRecords.push({
            requestId,
            arrivalAtMs: clock.now(),
            completedAtMs: clock.now(),
            latencyMs: 5,
            status: "rejected",
            terminalNodeId: entryNodeId,
            queueWaitMs: 0,
          });

          pushEvent({
            id: `evt_rl_reject_${requestId}`,
            sequence: getSeq(),
            atMs: clock.now(),
            durationMs: 5,
            type: "ratelimit.request.rejected",
            nodeId: entryNodeId,
            requestId,
            statusCode: rlConfig.rejectStatusCode,
            reason: rlResult.reason || "Rate limit exceeded",
            explanation: `Request "${requestId}" rejected by token bucket rate limiter on "${entryNode?.label || entryNodeId}".`,
          });
          return;
        }

        if (rlResult.tokensRefilled > 0) {
          pushEvent({
            id: `evt_rl_refill_${entryNodeId}_${clock.now()}`,
            sequence: getSeq(),
            atMs: clock.now(),
            durationMs: 0,
            type: "ratelimit.tokens.refilled",
            nodeId: entryNodeId,
            tokensAdded: rlResult.tokensRefilled,
            currentTokens: rlResult.remainingTokens,
            explanation: `Rate limiter refilled ${rlResult.tokensRefilled} token(s) on "${entryNode?.label || entryNodeId}".`,
          });
        }
      }

      // Route downstream from entry node
      const outgoingEdges = edges.filter((e) => e.source === entryNodeId);
      if (outgoingEdges.length > 0) {
        const nextEdge = outgoingEdges[0];
        traversedEdgeIds.add(nextEdge.id);
        const transitDelayMs = 25;

        pushEvent({
          id: `evt_dispatch_${requestId}_${nextEdge.id}`,
          sequence: getSeq(),
          atMs: clock.now(),
          durationMs: transitDelayMs,
          type: "request.dispatched",
          fromNodeId: entryNodeId,
          toNodeId: nextEdge.target,
          edgeId: nextEdge.id,
          request: {
            id: requestId,
            method: configuration.request?.method || "GET",
            path: configuration.request?.path || "/api",
            headers: {},
            query: {},
            sourceNodeId: entryNodeId,
            correlationId: requestId,
          },
          explanation: `Routing request ${requestId} across edge ${nextEdge.id} to ${nextEdge.target}.`,
        });

        enqueueTask({
          id: `transit_${requestId}_${nextEdge.target}`,
          atMs: clock.now() + transitDelayMs,
          priority: 5,
          action: () => {
            dispatchToService(requestId, nextEdge.target, clock.now() - transitDelayMs);
          },
        });
      } else {
        // Single node terminal
        completeRequest(requestId, entryNodeId, clock.now(), 0, 0, "success");
      }
    };

    const dispatchToService = (requestId: string, serviceNodeId: string, requestArrivalMs: number) => {
      visitedNodeIds.add(serviceNodeId);
      const capConfig = scenario.capacities[serviceNodeId];
      const instances = runtimeState.trafficInstances[serviceNodeId] || [];
      const queueState = runtimeState.trafficQueues[serviceNodeId];

      if (!capConfig || instances.length === 0 || !queueState) {
        // Component without modeled capacity runs with standard 30ms baseline
        const dur = 30;
        enqueueTask({
          id: `proc_unmodeled_${requestId}`,
          atMs: clock.now() + dur,
          priority: 4,
          action: () => {
            cascadeOrComplete(requestId, serviceNodeId, requestArrivalMs, 0, dur);
          },
        });
        return;
      }

      // Check load balancing to select instance
      const selectedInstance = LoadDistributionEngine.selectInstance(
        serviceNodeId,
        instances,
        capConfig.loadBalancing,
        capConfig.instanceWeights
      );

      // Check if instance has immediate worker available
      if (selectedInstance && selectedInstance.busyWorkers < selectedInstance.workerCount) {
        WorkerPool.acquireWorker(selectedInstance);
        const processingDurationMs = WorkerPool.computeProcessingDuration(capConfig, rng);

        pushEvent({
          id: `evt_admit_${requestId}`,
          sequence: getSeq(),
          atMs: clock.now(),
          durationMs: 0,
          type: "traffic.request.admitted",
          requestId,
          serviceNodeId,
          instanceId: selectedInstance.id,
          workerIndex: selectedInstance.busyWorkers,
          queueWaitingTimeMs: 0,
          explanation: `Request "${requestId}" admitted to worker on instance "${selectedInstance.id}" (0ms queue wait).`,
        });

        enqueueTask({
          id: `work_complete_${requestId}_${selectedInstance.id}`,
          atMs: clock.now() + processingDurationMs,
          priority: 4,
          action: () => {
            WorkerPool.releaseWorker(selectedInstance);
            cascadeOrComplete(requestId, serviceNodeId, requestArrivalMs, 0, processingDurationMs);
            drainQueueIfAvailable(serviceNodeId);
          },
        });
      } else {
        // All workers busy: enqueue into service queue
        const enqueueResult = queueManager.enqueue(serviceNodeId, requestId, clock.now(), queueState);

        if (!enqueueResult.admitted) {
          activeInFlight--;
          rejectedCount++;

          completedRecords.push({
            requestId,
            arrivalAtMs: requestArrivalMs,
            completedAtMs: clock.now(),
            latencyMs: clock.now() - requestArrivalMs,
            status: "rejected",
            terminalNodeId: serviceNodeId,
            queueWaitMs: 0,
          });

          pushEvent({
            id: `evt_queue_reject_${requestId}`,
            sequence: getSeq(),
            atMs: clock.now(),
            durationMs: 0,
            type: "queue.request.rejected",
            nodeId: serviceNodeId,
            requestId,
            currentQueueDepth: enqueueResult.currentDepth,
            maxQueueCapacity: queueState.capacity,
            explanation: `Request "${requestId}" rejected on "${nodeMap.get(serviceNodeId)?.label || serviceNodeId}": queue is full (${enqueueResult.currentDepth}/${queueState.capacity}).`,
          });
          return;
        }

        pushEvent({
          id: `evt_queue_enq_${requestId}`,
          sequence: getSeq(),
          atMs: clock.now(),
          durationMs: 0,
          type: "queue.request.enqueued",
          nodeId: serviceNodeId,
          requestId,
          currentQueueDepth: enqueueResult.currentDepth,
          maxQueueCapacity: queueState.capacity,
          explanation: `Request "${requestId}" queued waiting for worker on "${nodeMap.get(serviceNodeId)?.label || serviceNodeId}" (Queue depth: ${enqueueResult.currentDepth}).`,
        });
      }
    };

    const drainQueueIfAvailable = (serviceNodeId: string) => {
      const instances = runtimeState.trafficInstances[serviceNodeId] || [];
      const queueState = runtimeState.trafficQueues[serviceNodeId];
      const capConfig = scenario.capacities[serviceNodeId];

      if (!queueState || !capConfig || queueState.waitingCount === 0) return;

      const availableInstance = WorkerPool.findAvailableInstance(instances);
      if (!availableInstance) return;

      const dequeueResult = queueManager.dequeue(serviceNodeId, clock.now(), queueState);
      if (!dequeueResult.item) return;

      const dequeuedReqId = dequeueResult.item.requestId;
      WorkerPool.acquireWorker(availableInstance);
      const processingDurationMs = WorkerPool.computeProcessingDuration(capConfig, rng);

      pushEvent({
        id: `evt_queue_deq_${dequeuedReqId}`,
        sequence: getSeq(),
        atMs: clock.now(),
        durationMs: 0,
        type: "queue.request.dequeued",
        nodeId: serviceNodeId,
        requestId: dequeuedReqId,
        assignedInstanceId: availableInstance.id,
        waitTimeMs: dequeueResult.waitTimeMs,
        remainingQueueDepth: dequeueResult.remainingDepth,
        explanation: `Request "${dequeuedReqId}" dequeued after ${dequeueResult.waitTimeMs}ms wait and assigned to instance "${availableInstance.id}".`,
      });

      enqueueTask({
        id: `work_complete_${dequeuedReqId}_${availableInstance.id}`,
        atMs: clock.now() + processingDurationMs,
        priority: 4,
        action: () => {
          WorkerPool.releaseWorker(availableInstance);
          cascadeOrComplete(dequeuedReqId, serviceNodeId, dequeueResult.item!.enqueuedAtMs - dequeueResult.waitTimeMs, dequeueResult.waitTimeMs, processingDurationMs);
          drainQueueIfAvailable(serviceNodeId);
        },
      });
    };

    const cascadeOrComplete = (
      requestId: string,
      currentNodeId: string,
      arrivalAtMs: number,
      queueWaitMs: number,
      serviceDurationMs: number
    ) => {
      const outgoingEdges = edges.filter((e) => e.source === currentNodeId);
      if (outgoingEdges.length > 0) {
        const nextEdge = outgoingEdges[0];
        traversedEdgeIds.add(nextEdge.id);
        const transitDelayMs = 20;

        pushEvent({
          id: `evt_dispatch_${requestId}_${nextEdge.id}`,
          sequence: getSeq(),
          atMs: clock.now(),
          durationMs: transitDelayMs,
          type: "request.dispatched",
          fromNodeId: currentNodeId,
          toNodeId: nextEdge.target,
          edgeId: nextEdge.id,
          request: {
            id: requestId,
            method: configuration.request?.method || "GET",
            path: configuration.request?.path || "/api",
            headers: {},
            query: {},
            sourceNodeId: currentNodeId,
            correlationId: requestId,
          },
          explanation: `Forwarding request ${requestId} downstream along edge ${nextEdge.id} to ${nextEdge.target}.`,
        });

        enqueueTask({
          id: `cascade_${requestId}_${nextEdge.target}`,
          atMs: clock.now() + transitDelayMs,
          priority: 5,
          action: () => {
            dispatchToService(requestId, nextEdge.target, arrivalAtMs);
          },
        });
      } else {
        completeRequest(requestId, currentNodeId, arrivalAtMs, queueWaitMs, serviceDurationMs, "success");
      }
    };

    const completeRequest = (
      requestId: string,
      terminalNodeId: string,
      arrivalAtMs: number,
      queueWaitDurationMs: number,
      serviceDurationMs: number,
      status: "success" | "error"
    ) => {
      activeInFlight--;
      const latencyMs = Math.max(1, clock.now() - arrivalAtMs);

      completedRecords.push({
        requestId,
        arrivalAtMs,
        completedAtMs: clock.now(),
        latencyMs,
        status,
        terminalNodeId,
        queueWaitMs: queueWaitDurationMs,
      });

      pushEvent({
        id: `evt_req_done_${requestId}`,
        sequence: getSeq(),
        atMs: clock.now(),
        durationMs: latencyMs,
        type: "traffic.request.completed",
        requestId,
        terminalNodeId,
        latencyMs,
        serviceDurationMs,
        queueWaitDurationMs,
        explanation: `Virtual request "${requestId}" completed successfully in ${latencyMs}ms (Queue wait: ${queueWaitDurationMs}ms, Service: ${serviceDurationMs}ms).`,
      });
    };

    // ------------------------------------------------------------------------
    // 5. Main Simulation Clock & Queue Loop
    // ------------------------------------------------------------------------
    const maxTimeMs = scenario.limits.maxVirtualDurationMs || 60000;

    while (!queue.isEmpty && !limitsGuard.isEventLimitReached() && clock.now() < maxTimeMs) {
      const task = queue.pop()!;
      clock.setTime(task.atMs);
      task.action();
    }

    // ------------------------------------------------------------------------
    // 6. Compute Final Summary & Aggregated Frames
    // ------------------------------------------------------------------------
    const summary = MetricAggregator.computeSummary(
      totalScheduledArrivals,
      completedRecords,
      timedOutCount,
      rejectedCount,
      samples,
      snapshot.nodes,
      runtimeState.trafficInstances,
      runtimeState.trafficQueues,
      scalingEventsCount
    );
    runtimeState.trafficSummary = summary;

    const outcome: ExecutionOutcome = summary.failedRequests > 0 && summary.successfulRequests === 0 ? "failure" : "success";
    const terminalReason = `Traffic simulation finished: ${summary.successfulRequests}/${summary.totalRequests} requests completed (P95: ${summary.overallP95LatencyMs}ms, Peak RPS: ${summary.peakThroughputRps}).`;

    pushEvent({
      id: `evt_traffic_complete_${runId}`,
      sequence: getSeq(),
      atMs: clock.now(),
      durationMs: clock.now(),
      type: "run.completed",
      outcome,
      terminalNodeId: scenario.entryNodeId,
      terminalReason,
      totalHops: visitedNodeIds.size,
      explanation: terminalReason,
    });

    // Generate Adaptive Visualization Frames
    const frames = ExecutionTraceHelper.generateFrames(events, stateSnapshots);

    // Enrich frames with traveling request aggregation
    // If request volume is high, aggregate markers so React Flow stays at 60 FPS
    for (const frame of frames) {
      frame.runtimeState = frame.runtimeState || runtimeState;
      if (frame.runtimeState.trafficCurrentSample) {
        const curSample = frame.runtimeState.trafficCurrentSample;
        // Construct adaptive traveling packets on active edges
        if (frame.activeEdgeIds && frame.activeEdgeIds.length > 0) {
          const edgeId = frame.activeEdgeIds[0];
          const edge = edges.find((e) => e.id === edgeId);
          if (edge) {
            const multiplier = curSample.incomingRps >= 500 ? 50 : curSample.incomingRps >= 100 ? 10 : 1;
            const marker: TravelingMarkerData = {
              id: `pkt_flow_${edgeId}_${frame.virtualTimeMs}`,
              edgeId,
              sourceNodeId: edge.source,
              targetNodeId: edge.target,
              progress: 0.5,
              direction: "request",
              kind: "request",
              label: multiplier > 1 ? `x${multiplier} Flow` : "REQ ▶",
            };
            frame.travelingPackets = [marker];
          }
        }
      }
    }

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
      trafficScenario: scenario,
      performanceSamples: samples,
      performanceSummary: summary,
      createdAt: DETERMINISTIC_EPOCH_ISO,
    };
  }

  /**
   * Compares two traffic simulation runs (e.g. 2 instances vs 4 instances, or baseline vs spike).
   */
  public static compareScenarios(
    baselineTrace: ExecutionTrace,
    testTrace: ExecutionTrace,
    baselineScenario?: TrafficScenario,
    testScenario?: TrafficScenario
  ): SimulationComparison {
    const baseScen =
      baselineScenario ||
      baselineTrace.trafficScenario ||
      ({ id: "baseline", name: "Baseline Scenario" } as TrafficScenario);
    const testScen =
      testScenario ||
      testTrace.trafficScenario ||
      ({ id: "comparison", name: "Comparison Scenario" } as TrafficScenario);

    const lastBaseFrame = baselineTrace.frames[baselineTrace.frames.length - 1];
    const lastTestFrame = testTrace.frames[testTrace.frames.length - 1];

    const baseSummary =
      baselineTrace.performanceSummary ||
      lastBaseFrame?.runtimeState?.trafficSummary || {
      totalRequests: baselineTrace.totalEvents,
      completedRequests: baselineTrace.totalEvents,
      successfulRequests: baselineTrace.totalEvents,
      failedRequests: 0,
      timedOutRequests: 0,
      rejectedRequests: 0,
      overallP50LatencyMs: 40,
      overallP90LatencyMs: 65,
      overallP95LatencyMs: 80,
      overallP99LatencyMs: 120,
      maxLatencyMs: 150,
      meanLatencyMs: 50,
      averageThroughputRps: 100,
      peakThroughputRps: 150,
      peakQueueDepth: 5,
      averageUtilizationPercent: 45,
      bottlenecks: [],
      scalingEventsCount: 0,
    };

    const testSummary =
      testTrace.performanceSummary ||
      lastTestFrame?.runtimeState?.trafficSummary || {
      totalRequests: testTrace.totalEvents,
      completedRequests: testTrace.totalEvents,
      successfulRequests: testTrace.totalEvents,
      failedRequests: 0,
      timedOutRequests: 0,
      rejectedRequests: 0,
      overallP50LatencyMs: 45,
      overallP90LatencyMs: 70,
      overallP95LatencyMs: 90,
      overallP99LatencyMs: 140,
      maxLatencyMs: 180,
      meanLatencyMs: 55,
      averageThroughputRps: 120,
      peakThroughputRps: 180,
      peakQueueDepth: 12,
      averageUtilizationPercent: 65,
      bottlenecks: [],
      scalingEventsCount: 0,
    };

    const throughputDeltaRps = testSummary.averageThroughputRps - baseSummary.averageThroughputRps;
    const p95LatencyDeltaMs = testSummary.overallP95LatencyMs - baseSummary.overallP95LatencyMs;
    const failedRequestsDelta = testSummary.failedRequests - baseSummary.failedRequests;
    const queueDepthDelta = testSummary.peakQueueDepth - baseSummary.peakQueueDepth;
    const utilizationDeltaPercent = testSummary.averageUtilizationPercent - baseSummary.averageUtilizationPercent;

    const summary =
      failedRequestsDelta === 0 && p95LatencyDeltaMs <= 0
        ? `Configuration "${testScen.name}" improved performance: latency decreased by ${Math.abs(p95LatencyDeltaMs)}ms with 0 additional failures.`
        : failedRequestsDelta > 0
        ? `Configuration "${testScen.name}" experienced saturation: ${failedRequestsDelta} additional request failure(s) observed under increased load.`
        : `Throughput changed by ${throughputDeltaRps >= 0 ? `+${throughputDeltaRps}` : throughputDeltaRps} req/s with P95 latency shifting by ${p95LatencyDeltaMs >= 0 ? `+${p95LatencyDeltaMs}` : p95LatencyDeltaMs}ms.`;

    return {
      baselineScenarioId: baseScen.id,
      testScenarioId: testScen.id,
      baselineSummary: baseSummary,
      testSummary,
      throughputDeltaRps,
      p95LatencyDeltaMs,
      failedRequestsDelta,
      queueDepthDelta,
      utilizationDeltaPercent,
      summary,
    };
  }
}
