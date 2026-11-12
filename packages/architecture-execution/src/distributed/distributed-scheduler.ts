import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ExecutionSnapshot } from "../domain/execution-snapshot";
import type { ExecutionConfiguration, ExecutionOutcome } from "../schemas/execution.schemas";
import type { ExecutionEvent } from "../domain/execution-event";
import { type ExecutionTrace, ExecutionTraceHelper } from "../domain/execution-trace";
import { VirtualClock } from "../engine/virtual-clock";
import { ExecutionLimitsGuard } from "../engine/execution-limits";
import { RuntimeStateHelper, type ModeledRuntimeState } from "../domain/runtime-state";
import { PriorityQueue } from "./priority-queue";
import { CriticalPathAnalyzer } from "../tracing/critical-path";
import { DETERMINISTIC_EPOCH_ISO, createDeterministicId } from "../orchestrator/deterministic-id";
import type {
  DistributedScenarioConfig,
  TraceContext,
  TraceSpan,
  ExecutionBranch,
  FanInBarrier,
  ModeledMessage,
  ModeledQueueState,
} from "../schemas/distributed.schemas";

interface ScheduledTask {
  id: string;
  atMs: number;
  priority: number;
  action: () => void;
}

export class DistributedScheduler {
  public static planDistributedExecution(
    snapshot: ExecutionSnapshot,
    scenario: DistributedScenarioConfig,
    configuration: ExecutionConfiguration
  ): ExecutionTrace {
    const distSeed = `${snapshot.snapshotHash}:${scenario.id}:${scenario.entryNodeId}`;
    const runId = createDeterministicId("dist_run", distSeed);
    const clock = new VirtualClock(0);
    const limitsGuard = new ExecutionLimitsGuard(configuration.limits);
    const queue = new PriorityQueue<ScheduledTask>();

    const runtimeState = RuntimeStateHelper.createInitialState();
    const events: ExecutionEvent[] = [];
    const stateSnapshots: ModeledRuntimeState[] = [];
    const visitedNodeIds = new Set<string>();
    const traversedEdgeIds = new Set<string>();
    const allSpans: TraceSpan[] = [];

    let sequence = 1;
    const getSeq = () => sequence++;

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
    // Initialize Queues in Runtime State
    // ------------------------------------------------------------------------
    for (const qConfig of scenario.queues) {
      const qState: ModeledQueueState = {
        id: qConfig.id,
        nodeId: qConfig.nodeId,
        name: qConfig.name,
        capacity: qConfig.capacity,
        readyMessageIds: [],
        inFlightMessageIds: [],
        acknowledgedMessageIds: [],
        deadLetteredMessageIds: [],
        deadLetterQueueId: qConfig.deadLetterQueueId,
        activeConsumerCount: 0,
      };
      runtimeState.queues[qConfig.nodeId] = qState;
      if (qConfig.id !== qConfig.nodeId) {
        runtimeState.queues[qConfig.id] = qState;
      }
    }

    // ------------------------------------------------------------------------
    // Initialize Root Trace Context
    // ------------------------------------------------------------------------
    const rootTraceContext: TraceContext = {
      requestId: createDeterministicId("req", distSeed, 1),
      correlationId: createDeterministicId("corr", distSeed, 1),
      traceId: `trace_${runId}`,
      spanId: `span_root_${runId}`,
      branchId: "branch_main",
    };

    const rootBranch: ExecutionBranch = {
      id: "branch_main",
      name: "Main User Journey",
      originNodeId: scenario.entryNodeId,
      targetNodeId: scenario.entryNodeId,
      startedAtMs: 0,
      status: "active",
      spanId: rootTraceContext.spanId,
    };
    runtimeState.activeBranches.push(rootBranch);

    const rootSpan: TraceSpan = {
      traceId: rootTraceContext.traceId,
      spanId: rootTraceContext.spanId,
      name: `${scenario.entryRequest.method} ${scenario.entryRequest.path}`,
      componentId: scenario.entryNodeId,
      componentLabel: nodeMap.get(scenario.entryNodeId)?.label || scenario.entryNodeId,
      startMs: 0,
      status: "running",
      attributes: {
        "http.method": scenario.entryRequest.method,
        "http.target": scenario.entryRequest.path,
        "workflow.type": scenario.presetId,
      },
      branchId: "branch_main",
    };
    allSpans.push(rootSpan);
    runtimeState.activeSpans.push(rootSpan);

    // Initial Events
    pushEvent({
      id: `evt_${runId}_${getSeq()}_run_start`,
      sequence: sequence - 1,
      type: "run.started",
      atMs: clock.now(),
      durationMs: 0,
      entryNodeId: scenario.entryNodeId,
      request: {
        id: rootTraceContext.requestId,
        method: scenario.entryRequest.method as any,
        path: scenario.entryRequest.path,
        headers: scenario.entryRequest.headers,
        body: scenario.entryRequest.body,
      },
      explanation: `Initiating distributed execution: ${scenario.name}`,
    });

    pushEvent({
      id: `evt_${runId}_${getSeq()}_span_root_start`,
      sequence: sequence - 1,
      type: "span.started",
      atMs: clock.now(),
      durationMs: 0,
      spanId: rootSpan.spanId,
      traceId: rootSpan.traceId,
      componentId: rootSpan.componentId,
      componentLabel: rootSpan.componentLabel,
      name: rootSpan.name,
      branchId: "branch_main",
      explanation: `Started root distributed trace span "${rootSpan.name}" at ${rootSpan.componentLabel}.`,
    });

    visitedNodeIds.add(scenario.entryNodeId);

    // ------------------------------------------------------------------------
    // Step 1: Forward from Entry Component to Orchestrating Service
    // ------------------------------------------------------------------------
    const entryNode = nodeMap.get(scenario.entryNodeId);
    let orchestratorNodeId = scenario.fanInNodeId || "order_service";

    // If entryNode is not orchestrator, traverse edge to orchestrator
    if (entryNode && scenario.entryNodeId !== orchestratorNodeId) {
      const edge = findEdge(scenario.entryNodeId, orchestratorNodeId);
      if (edge) {
        traversedEdgeIds.add(edge.id);
        pushEvent({
          id: `evt_${runId}_${getSeq()}_req_disp_${edge.id}`,
          sequence: sequence - 1,
          type: "request.dispatched",
          atMs: clock.now(),
          durationMs: 40,
          fromNodeId: scenario.entryNodeId,
          toNodeId: orchestratorNodeId,
          edgeId: edge.id,
          request: {
            id: rootTraceContext.requestId,
            method: scenario.entryRequest.method as any,
            path: scenario.entryRequest.path,
            headers: scenario.entryRequest.headers,
            query: {},
            sourceNodeId: scenario.entryNodeId,
            correlationId: rootTraceContext.correlationId,
            body: scenario.entryRequest.body,
          },
          explanation: `Request dispatched along wire "${edge.label || edge.id}" to orchestrator service.`,
        });
        clock.advance(40);
      }
    }

    visitedNodeIds.add(orchestratorNodeId);
    const orchestratorNode = nodeMap.get(orchestratorNodeId);

    pushEvent({
      id: `evt_${runId}_${getSeq()}_req_rcvd_${orchestratorNodeId}`,
      sequence: sequence - 1,
      type: "request.received",
      atMs: clock.now(),
      durationMs: 20,
      nodeId: orchestratorNodeId,
      nodeLabel: orchestratorNode?.label || orchestratorNodeId,
      request: {
        id: rootTraceContext.requestId,
        method: scenario.entryRequest.method as any,
        path: scenario.entryRequest.path,
        headers: scenario.entryRequest.headers,
        query: {},
        sourceNodeId: scenario.entryNodeId,
        correlationId: rootTraceContext.correlationId,
        body: scenario.entryRequest.body,
      },
      explanation: `Request arrived at "${orchestratorNode?.label || orchestratorNodeId}". Evaluating orchestration rules...`,
    });
    clock.advance(20);

    // ------------------------------------------------------------------------
    // Step 2: Parallel Branch Scheduling (Fan-Out & Fan-In)
    // ------------------------------------------------------------------------
    if (scenario.parallelBranches.length > 0) {
      const barrierId = createDeterministicId(`barrier_${orchestratorNodeId}`, distSeed, sequence);
      const barrier: FanInBarrier = {
        barrierId,
        parentBranchId: "branch_main",
        waitingNodeId: orchestratorNodeId,
        policy: scenario.fanInPolicy,
        expectedBranchIds: scenario.parallelBranches.map((b) => b.id),
        completedBranchIds: [],
        failedBranchIds: [],
        status: "waiting",
      };
      runtimeState.fanInBarriers[barrierId] = barrier;

      pushEvent({
        id: `evt_${runId}_${getSeq()}_fanout_start`,
        sequence: sequence - 1,
        type: "parallel.fanout.started",
        atMs: clock.now(),
        durationMs: 15,
        parentNodeId: orchestratorNodeId,
        parentNodeLabel: orchestratorNode?.label || orchestratorNodeId,
        barrierId,
        branches: scenario.parallelBranches.map((b) => ({
          branchId: b.id,
          targetNodeId: b.targetNodeId,
          targetLabel: nodeMap.get(b.targetNodeId)?.label || b.targetNodeId,
          operation: b.operation,
        })),
        branchId: "branch_main",
        explanation: `Orchestrator initiated parallel fan-out across ${scenario.parallelBranches.length} concurrent branches (Barrier policy: ${scenario.fanInPolicy.toUpperCase()}).`,
      });
      clock.advance(15);

      const fanoutStartVirtualMs = clock.now();

      for (const branchDef of scenario.parallelBranches) {
        const targetNode = nodeMap.get(branchDef.targetNodeId);
        visitedNodeIds.add(branchDef.targetNodeId);

        const branchEdge = findEdge(orchestratorNodeId, branchDef.targetNodeId);
        if (branchEdge) traversedEdgeIds.add(branchEdge.id);

        const branchSpanId = `span_${branchDef.id}`;
        const branchSpan: TraceSpan = {
          traceId: rootTraceContext.traceId,
          spanId: branchSpanId,
          parentSpanId: rootTraceContext.spanId,
          name: branchDef.operation,
          componentId: branchDef.targetNodeId,
          componentLabel: targetNode?.label || branchDef.targetNodeId,
          startMs: fanoutStartVirtualMs,
          status: "running",
          attributes: {
            "branch.id": branchDef.id,
            "operation": branchDef.operation,
            "simulated.parallel": true,
          },
          branchId: branchDef.id,
        };
        allSpans.push(branchSpan);
        runtimeState.activeSpans.push(branchSpan);

        const branchObj: ExecutionBranch = {
          id: branchDef.id,
          parentBranchId: "branch_main",
          name: branchDef.operation,
          originNodeId: orchestratorNodeId,
          targetNodeId: branchDef.targetNodeId,
          startedAtMs: fanoutStartVirtualMs,
          status: "active",
          spanId: branchSpanId,
        };
        runtimeState.activeBranches.push(branchObj);

        pushEvent({
          id: `evt_${runId}_${getSeq()}_branch_created_${branchDef.id}`,
          sequence: sequence - 1,
          type: "parallel.branch.created",
          atMs: fanoutStartVirtualMs,
          durationMs: 0,
          branchId: branchDef.id,
          parentBranchId: "branch_main",
          originNodeId: orchestratorNodeId,
          targetNodeId: branchDef.targetNodeId,
          operation: branchDef.operation,
          explanation: `Created parallel logical branch "${branchDef.id}" targeting "${targetNode?.label || branchDef.targetNodeId}".`,
        });

        pushEvent({
          id: `evt_${runId}_${getSeq()}_span_start_${branchDef.id}`,
          sequence: sequence - 1,
          type: "span.started",
          atMs: fanoutStartVirtualMs,
          durationMs: 0,
          spanId: branchSpanId,
          traceId: rootTraceContext.traceId,
          parentSpanId: rootTraceContext.spanId,
          componentId: branchDef.targetNodeId,
          componentLabel: targetNode?.label || branchDef.targetNodeId,
          name: branchDef.operation,
          branchId: branchDef.id,
          explanation: `Parallel span started: ${branchDef.operation} on ${targetNode?.label || branchDef.targetNodeId}.`,
        });

        // Schedule completion task in virtual time
        const completionMs = fanoutStartVirtualMs + branchDef.durationMs;
        queue.push(
          {
            id: `task_finish_${branchDef.id}`,
            atMs: completionMs,
            priority: 5,
            action: () => {
              clock.setTime(completionMs);
              branchSpan.endMs = completionMs;
              branchSpan.durationMs = branchDef.durationMs;
              branchObj.completedAtMs = completionMs;

              if (branchDef.willFail) {
                branchSpan.status = "error";
                branchObj.status = "failed";
                branchObj.error = branchDef.errorMessage || "Operation failed in downstream service.";
                barrier.failedBranchIds.push(branchDef.id);

                pushEvent({
                  id: `evt_${runId}_${getSeq()}_branch_failed_${branchDef.id}`,
                  sequence: sequence - 1,
                  type: "parallel.branch.failed",
                  atMs: completionMs,
                  durationMs: 0,
                  branchId: branchDef.id,
                  targetNodeId: branchDef.targetNodeId,
                  targetNodeLabel: targetNode?.label || branchDef.targetNodeId,
                  error: branchObj.error,
                  explanation: `Parallel branch "${branchDef.id}" failed: ${branchObj.error}`,
                });

                pushEvent({
                  id: `evt_${runId}_${getSeq()}_span_done_${branchDef.id}`,
                  sequence: sequence - 1,
                  type: "span.completed",
                  atMs: completionMs,
                  durationMs: branchDef.durationMs,
                  spanId: branchSpanId,
                  traceId: rootTraceContext.traceId,
                  status: "error",
                  branchId: branchDef.id,
                  explanation: `Span "${branchSpan.name}" completed with status ERROR (+${branchDef.durationMs}ms).`,
                });
              } else {
                branchSpan.status = "success";
                branchObj.status = "completed";
                barrier.completedBranchIds.push(branchDef.id);

                pushEvent({
                  id: `evt_${runId}_${getSeq()}_branch_completed_${branchDef.id}`,
                  sequence: sequence - 1,
                  type: "parallel.branch.completed",
                  atMs: completionMs,
                  durationMs: branchDef.durationMs,
                  branchId: branchDef.id,
                  targetNodeId: branchDef.targetNodeId,
                  targetNodeLabel: targetNode?.label || branchDef.targetNodeId,
                  result: { success: true },
                  explanation: `Parallel branch "${branchDef.id}" completed successfully (+${branchDef.durationMs}ms).`,
                });

                pushEvent({
                  id: `evt_${runId}_${getSeq()}_span_done_${branchDef.id}`,
                  sequence: sequence - 1,
                  type: "span.completed",
                  atMs: completionMs,
                  durationMs: branchDef.durationMs,
                  spanId: branchSpanId,
                  traceId: rootTraceContext.traceId,
                  status: "success",
                  branchId: branchDef.id,
                  explanation: `Span "${branchSpan.name}" completed with status SUCCESS (+${branchDef.durationMs}ms).`,
                });
              }

              // Check barrier satisfaction
              const allDone = barrier.completedBranchIds.length + barrier.failedBranchIds.length === barrier.expectedBranchIds.length;
              if (allDone && barrier.status === "waiting") {
                barrier.resolvedAtMs = completionMs;
                if (barrier.policy === "all") {
                  if (barrier.failedBranchIds.length === 0) {
                    barrier.status = "satisfied";
                    pushEvent({
                      id: `evt_${runId}_${getSeq()}_barrier_satisfied`,
                      sequence: sequence - 1,
                      type: "parallel.join.satisfied",
                      atMs: completionMs,
                      durationMs: 0,
                      barrierId,
                      policy: barrier.policy,
                      completedBranchIds: barrier.completedBranchIds,
                      waitingNodeId: orchestratorNodeId,
                      waitingNodeLabel: orchestratorNode?.label || orchestratorNodeId,
                      branchId: "branch_main",
                      explanation: `Fan-in barrier satisfied: All ${barrier.completedBranchIds.length} parallel branches completed successfully.`,
                    });
                  } else {
                    barrier.status = "failed";
                    pushEvent({
                      id: `evt_${runId}_${getSeq()}_barrier_failed`,
                      sequence: sequence - 1,
                      type: "parallel.join.failed",
                      atMs: completionMs,
                      durationMs: 0,
                      barrierId,
                      policy: barrier.policy,
                      failedBranchIds: barrier.failedBranchIds,
                      waitingNodeId: orchestratorNodeId,
                      reason: `Barrier failed: ${barrier.failedBranchIds.length} parallel branches failed and policy is 'all'.`,
                      branchId: "branch_main",
                      explanation: `Fan-in barrier failed: Policy requires all branches to succeed, but branch ${barrier.failedBranchIds.join(", ")} failed.`,
                    });
                  }
                } else if (barrier.policy === "any" || barrier.policy === "first-success") {
                  if (barrier.completedBranchIds.length > 0) {
                    barrier.status = "satisfied";
                    pushEvent({
                      id: `evt_${runId}_${getSeq()}_barrier_satisfied`,
                      sequence: sequence - 1,
                      type: "parallel.join.satisfied",
                      atMs: completionMs,
                      durationMs: 0,
                      barrierId,
                      policy: barrier.policy,
                      completedBranchIds: barrier.completedBranchIds,
                      waitingNodeId: orchestratorNodeId,
                      waitingNodeLabel: orchestratorNode?.label || orchestratorNodeId,
                      branchId: "branch_main",
                      explanation: `Fan-in barrier satisfied: Condition met under policy "${barrier.policy}".`,
                    });
                  } else {
                    barrier.status = "failed";
                    pushEvent({
                      id: `evt_${runId}_${getSeq()}_barrier_failed`,
                      sequence: sequence - 1,
                      type: "parallel.join.failed",
                      atMs: completionMs,
                      durationMs: 0,
                      barrierId,
                      policy: barrier.policy,
                      failedBranchIds: barrier.failedBranchIds,
                      waitingNodeId: orchestratorNodeId,
                      reason: "No branch completed successfully.",
                      branchId: "branch_main",
                      explanation: "Fan-in barrier failed: No branch succeeded.",
                    });
                  }
                }
              }
            },
          },
          completionMs,
          5,
          getSeq()
        );
      }
    }

    // ------------------------------------------------------------------------
    // Step 3: Asynchronous Messaging & Queues
    // ------------------------------------------------------------------------
    for (const msgDef of scenario.messagesToPublish) {
      const qConfig = scenario.queues.find((q) => q.nodeId === msgDef.destinationQueueId);
      const queueNode = nodeMap.get(msgDef.destinationQueueId);
      visitedNodeIds.add(msgDef.destinationQueueId);

      const publishTimeMs = clock.now() + msgDef.delayMs;

      const schedulePublish = () => {
        const msgId = createDeterministicId("msg", `${distSeed}:${msgDef.destinationQueueId}`, sequence);
        const messageObj: ModeledMessage = {
          id: msgId,
          correlationId: rootTraceContext.correlationId,
          traceContext: {
            ...rootTraceContext,
            spanId: `span_${msgId}`,
            branchId: `branch_msg_${msgId}`,
          },
          producerNodeId: msgDef.producerNodeId,
          destinationQueueId: msgDef.destinationQueueId,
          payload: msgDef.payload,
          createdAtMs: publishTimeMs,
          attempt: 1,
          maxAttempts: qConfig?.maxRetries ? qConfig.maxRetries + 1 : 3,
          status: "created",
          idempotencyKey: msgDef.idempotencyKey,
        };
        runtimeState.activeMessages.push(messageObj);

        // Created Event
        pushEvent({
          id: `evt_${runId}_${getSeq()}_msg_created_${msgId}`,
          sequence: sequence - 1,
          type: "message.created",
          atMs: publishTimeMs,
          durationMs: 0,
          message: messageObj,
          producerNodeId: msgDef.producerNodeId,
          destinationQueueId: msgDef.destinationQueueId,
          branchId: "branch_main",
          explanation: `Created asynchronous message payload with correlation "${messageObj.correlationId}".`,
        });

        // Published Event
        const pubEdge = findEdge(msgDef.producerNodeId, msgDef.destinationQueueId);
        if (pubEdge) traversedEdgeIds.add(pubEdge.id);

        pushEvent({
          id: `evt_${runId}_${getSeq()}_msg_published_${msgId}`,
          sequence: sequence - 1,
          type: "message.published",
          atMs: publishTimeMs,
          durationMs: 15,
          message: messageObj,
          producerNodeId: msgDef.producerNodeId,
          destinationQueueId: msgDef.destinationQueueId,
          edgeId: pubEdge?.id,
          branchId: "branch_main",
          explanation: `Message published to queue "${queueNode?.label || msgDef.destinationQueueId}".`,
        });

        // Enqueued Event
        const qState = runtimeState.queues[msgDef.destinationQueueId];
        if (qState) {
          qState.readyMessageIds.push(msgId);
          messageObj.status = "queued";
        }

        const enqueuedTimeMs = publishTimeMs + 15;
        pushEvent({
          id: `evt_${runId}_${getSeq()}_msg_enqueued_${msgId}`,
          sequence: sequence - 1,
          type: "message.enqueued",
          atMs: enqueuedTimeMs,
          durationMs: 0,
          messageId: msgId,
          queueId: msgDef.destinationQueueId,
          queueName: queueNode?.label || msgDef.destinationQueueId,
          queueDepth: qState ? qState.readyMessageIds.length : 1,
          branchId: "branch_main",
          explanation: `Message enqueued into "${queueNode?.label || msgDef.destinationQueueId}" (Current queue depth: ${qState?.readyMessageIds.length || 1}).`,
        });

        // Schedule Delivery to Consumers / Workers
        const subscribers = qConfig?.subscriberNodeIds || [];
        const deliveryMode = qConfig?.deliveryMode || "competing-workers";

        const deliverToWorker = (consumerId: string, currentAttempt: number, deliverAtMs: number) => {
          const workerNode = nodeMap.get(consumerId);
          visitedNodeIds.add(consumerId);

          const qToWorkerEdge = findEdge(msgDef.destinationQueueId, consumerId);
          if (qToWorkerEdge) traversedEdgeIds.add(qToWorkerEdge.id);

          const procDuration = qConfig?.processingDurationMs || 100;
          const finishProcessingMs = deliverAtMs + procDuration;

          queue.push(
            {
              id: `task_deliver_${msgId}_${consumerId}_att${currentAttempt}`,
              atMs: deliverAtMs,
              priority: 5,
              action: () => {
                clock.setTime(deliverAtMs);
                messageObj.status = "in-flight";
                messageObj.attempt = currentAttempt;
                messageObj.deliveredAtMs = deliverAtMs;
                messageObj.consumerNodeId = consumerId;

                pushEvent({
                  id: `evt_${runId}_${getSeq()}_msg_delivered_${msgId}_${consumerId}`,
                  sequence: sequence - 1,
                  type: "message.delivered",
                  atMs: deliverAtMs,
                  durationMs: 15,
                  messageId: msgId,
                  queueId: msgDef.destinationQueueId,
                  consumerNodeId: consumerId,
                  consumerLabel: workerNode?.label || consumerId,
                  attempt: currentAttempt,
                  edgeId: qToWorkerEdge?.id,
                  branchId: `branch_worker_${consumerId}`,
                  explanation: `Message delivered from queue to worker "${workerNode?.label || consumerId}" (Attempt ${currentAttempt}).`,
                });

                pushEvent({
                  id: `evt_${runId}_${getSeq()}_msg_proc_start_${msgId}`,
                  sequence: sequence - 1,
                  type: "message.processing.started",
                  atMs: deliverAtMs,
                  durationMs: procDuration,
                  messageId: msgId,
                  consumerNodeId: consumerId,
                  consumerLabel: workerNode?.label || consumerId,
                  attempt: currentAttempt,
                  operation: "Process Asynchronous Message Payload",
                  branchId: `branch_worker_${consumerId}`,
                  explanation: `Worker "${workerNode?.label || consumerId}" began processing message payload.`,
                });
              },
            },
            deliverAtMs,
            5,
            getSeq()
          );

          queue.push(
            {
              id: `task_finish_proc_${msgId}_${consumerId}_att${currentAttempt}`,
              atMs: finishProcessingMs,
              priority: 5,
              action: () => {
                clock.setTime(finishProcessingMs);

                const willFail = msgDef.willFailOnAttempt !== undefined && currentAttempt <= msgDef.willFailOnAttempt;

                if (willFail) {
                  const maxRetries = qConfig?.maxRetries || 2;
                  const canRetry = currentAttempt < maxRetries + 1;

                  pushEvent({
                    id: `evt_${runId}_${getSeq()}_msg_nack_${msgId}`,
                    sequence: sequence - 1,
                    type: "message.nacked",
                    atMs: finishProcessingMs,
                    durationMs: 0,
                    messageId: msgId,
                    consumerNodeId: consumerId,
                    consumerLabel: workerNode?.label || consumerId,
                    attempt: currentAttempt,
                    reason: msgDef.failError || "Processing failed in asynchronous worker.",
                    willRetry: canRetry,
                    branchId: `branch_worker_${consumerId}`,
                    explanation: `Worker rejected message (NACK): ${msgDef.failError || "Processing error"} (Attempt ${currentAttempt}/${maxRetries + 1}).`,
                  });

                  if (canRetry) {
                    messageObj.status = "retry-pending";
                    const delayMs = (qConfig?.retryDelayMs || 200) * Math.pow(2, currentAttempt - 1);
                    const retryAtMs = finishProcessingMs + delayMs;
                    messageObj.retryAtMs = retryAtMs;

                    pushEvent({
                      id: `evt_${runId}_${getSeq()}_retry_sched_${msgId}`,
                      sequence: sequence - 1,
                      type: "message.retry.scheduled",
                      atMs: finishProcessingMs,
                      durationMs: 0,
                      messageId: msgId,
                      attempt: currentAttempt + 1,
                      retryAtMs,
                      delayMs,
                      nodeId: consumerId,
                      branchId: `branch_worker_${consumerId}`,
                      explanation: `Scheduled exponential retry for message in +${delayMs}ms (Next Attempt: ${currentAttempt + 1}).`,
                    });

                    deliverToWorker(consumerId, currentAttempt + 1, retryAtMs);
                  } else {
                    // Dead-Letter routing
                    messageObj.status = "dead-lettered";
                    const dlqId = qConfig?.deadLetterQueueId || "dead_letter_queue";
                    visitedNodeIds.add(dlqId);

                    if (qState) {
                      qState.deadLetteredMessageIds.push(msgId);
                    }

                    const dlqState =
                      runtimeState.queues[dlqId] ||
                      (qConfig?.deadLetterQueueId ? runtimeState.queues[qConfig.deadLetterQueueId] : undefined);
                    if (dlqState) {
                      dlqState.deadLetteredMessageIds.push(msgId);
                      dlqState.readyMessageIds.push(msgId);
                    }

                    pushEvent({
                      id: `evt_${runId}_${getSeq()}_msg_dlq_${msgId}`,
                      sequence: sequence - 1,
                      type: "message.deadlettered",
                      atMs: finishProcessingMs,
                      durationMs: 0,
                      messageId: msgId,
                      dlqId,
                      attempts: currentAttempt,
                      reason: `Exhausted all ${currentAttempt} retries: ${msgDef.failError || "Persistent error"}`,
                      branchId: `branch_worker_${consumerId}`,
                      explanation: `Retries exhausted. Routed message to Dead-Letter Queue "${dlqId}".`,
                    });
                  }
                } else {
                  // Successful processing & ACK
                  messageObj.status = "acknowledged";
                  messageObj.acknowledgedAtMs = finishProcessingMs;

                  if (qState) {
                    qState.acknowledgedMessageIds.push(msgId);
                  }

                  pushEvent({
                    id: `evt_${runId}_${getSeq()}_msg_proc_done_${msgId}_${consumerId}`,
                    sequence: sequence - 1,
                    type: "message.processing.completed",
                    atMs: finishProcessingMs,
                    durationMs: 0,
                    messageId: msgId,
                    consumerNodeId: consumerId,
                    consumerLabel: workerNode?.label || consumerId,
                    attempt: currentAttempt,
                    branchId: `branch_worker_${consumerId}`,
                    explanation: `Worker "${workerNode?.label || consumerId}" finished processing message payload.`,
                  });

                  pushEvent({
                    id: `evt_${runId}_${getSeq()}_msg_ack_${msgId}_${consumerId}`,
                    sequence: sequence - 1,
                    type: "message.acknowledged",
                    atMs: finishProcessingMs,
                    durationMs: 10,
                    messageId: msgId,
                    consumerNodeId: consumerId,
                    consumerLabel: workerNode?.label || consumerId,
                    attempt: currentAttempt,
                    nodeId: msgDef.destinationQueueId,
                    edgeId: qToWorkerEdge?.id,
                    branchId: `branch_worker_${consumerId}`,
                    explanation: `Worker "${workerNode?.label || consumerId}" successfully processed and acknowledged message (ACK).`,
                  });
                }
              },
            },
            finishProcessingMs,
            5,
            getSeq()
          );
        };

        if (deliveryMode === "pub-sub") {
          for (const subId of subscribers) {
            deliverToWorker(subId, 1, enqueuedTimeMs + 20);
          }
        } else if (subscribers.length > 0) {
          deliverToWorker(subscribers[0], 1, enqueuedTimeMs + 20);
        }
      };

      queue.push(
        {
          id: `task_pub_${msgDef.destinationQueueId}`,
          atMs: publishTimeMs,
          priority: 5,
          action: schedulePublish,
        },
        publishTimeMs,
        5,
        getSeq()
      );
    }

    // ------------------------------------------------------------------------
    // Step 4: Process Queue Tasks in Strict Virtual Time Order
    // ------------------------------------------------------------------------
    while (!queue.isEmpty && limitsGuard.getEventCount() < configuration.limits.maxEvents) {
      const task = queue.pop()!;
      task.action();
    }

    // ------------------------------------------------------------------------
    // Step 5: Complete Root Execution & Synthesize Terminal Event
    // ------------------------------------------------------------------------
    rootSpan.endMs = clock.now();
    rootSpan.durationMs = clock.now();
    rootBranch.completedAtMs = clock.now();

    const anyBarrierFailed = Object.values(runtimeState.fanInBarriers).some((b) => b.status === "failed");
    const terminalOutcome: ExecutionOutcome = anyBarrierFailed ? "failure" : "success";
    const terminalStatus = anyBarrierFailed ? 500 : 201;

    const responsePayload = anyBarrierFailed
      ? { error: "Internal Server Error", message: "One or more dependent parallel services failed." }
      : { orderId: "ord_9981", status: "confirmed", amount: 3999.0 };

    const finalResponse = {
      requestId: rootTraceContext.requestId,
      status: terminalStatus,
      headers: { "content-type": "application/json" },
      body: responsePayload,
      sourceNodeId: orchestratorNodeId,
      destinationNodeId: scenario.entryNodeId,
      latencyMs: clock.now(),
    };
    runtimeState.activeResponse = finalResponse;

    // Emit final response back to entry node
    pushEvent({
      id: `evt_${runId}_${getSeq()}_resp_created`,
      sequence: sequence - 1,
      type: "response.created",
      atMs: clock.now(),
      durationMs: 20,
      nodeId: orchestratorNodeId,
      nodeLabel: orchestratorNode?.label || orchestratorNodeId,
      response: finalResponse,
      branchId: "branch_main",
      explanation: `Synthesized modeled HTTP ${terminalStatus} response from orchestrator.`,
    });
    clock.advance(20);

    pushEvent({
      id: `evt_${runId}_${getSeq()}_resp_rcvd_client`,
      sequence: sequence - 1,
      type: "response.received",
      atMs: clock.now(),
      durationMs: 10,
      nodeId: scenario.entryNodeId,
      nodeLabel: entryNode?.label || scenario.entryNodeId,
      response: finalResponse,
      branchId: "branch_main",
      explanation: `Client received HTTP ${terminalStatus} response (+${clock.now()}ms total virtual time).`,
    });
    clock.advance(10);

    pushEvent({
      id: `evt_${runId}_${getSeq()}_run_done`,
      sequence: sequence - 1,
      type: "run.completed",
      atMs: clock.now(),
      durationMs: 0,
      terminalNodeId: scenario.entryNodeId,
      terminalReason: anyBarrierFailed
        ? "Execution failed due to parallel branch or barrier failure."
        : "Completed distributed execution workflow successfully.",
      outcome: terminalOutcome,
      totalHops: limitsGuard.getHopCount(),
      explanation: `Distributed Execution ${terminalOutcome.toUpperCase()}: Finished in +${clock.now()}ms virtual time.`,
    } as any);

    // Calculate Critical Path across all generated spans
    const criticalPathSpanIds = CriticalPathAnalyzer.calculateCriticalPath(allSpans);
    for (const span of allSpans) {
      if (criticalPathSpanIds.includes(span.spanId)) {
        span.isCriticalPath = true;
      }
    }
    runtimeState.criticalPathSpanIds = criticalPathSpanIds;

    for (const snap of stateSnapshots) {
      snap.criticalPathSpanIds = criticalPathSpanIds;
      for (const span of snap.activeSpans) {
        if (criticalPathSpanIds.includes(span.spanId)) {
          span.isCriticalPath = true;
        }
      }
    }

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
      totalHops: limitsGuard.getHopCount(),
      outcome: terminalOutcome,
      terminalReason: anyBarrierFailed
        ? "Parallel branch failure occurred."
        : "Distributed execution completed successfully.",
      visitedNodeIds: Array.from(visitedNodeIds),
      traversedEdgeIds: Array.from(traversedEdgeIds),
      frames,
      spans: allSpans,
      criticalPathSpanIds,
      createdAt: DETERMINISTIC_EPOCH_ISO,
    };
  }
}
