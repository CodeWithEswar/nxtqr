import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ExecutionSnapshot } from "../domain/execution-snapshot";
import type { ExecutionConfiguration, ExecutionOutcome } from "../schemas/execution.schemas";
import type { ExecutionEvent } from "../domain/execution-event";
import { type ExecutionTrace, ExecutionTraceHelper } from "../domain/execution-trace";
import { VirtualClock } from "./virtual-clock";
import { ExecutionLimitsGuard } from "./execution-limits";
import { ExecutionSnapshotManager } from "../domain/execution-snapshot";
import { componentBehaviorRegistry } from "../behavior/behavior-registry";
import { RuntimeStateHelper, type ModeledRuntimeState } from "../domain/runtime-state";
import { getScenarioPreset } from "../behavior/scenario-presets";
import type { ModeledHttpRequest, ModeledHttpResponse, BehaviorScenario } from "../schemas/behavior.schemas";

export class RequestLifecyclePlanner {
  public static planLifecycle(
    snapshot: ExecutionSnapshot,
    configuration: ExecutionConfiguration
  ): ExecutionTrace {
    const runId = `run_${snapshot.snapshotHash.slice(5, 11)}_${Date.now()}`;
    const validation = ExecutionSnapshotManager.validateSnapshot(snapshot);

    if (!validation.isValid) {
      const errorEvent: ExecutionEvent = {
        id: `evt_${runId}_1_run_completed_invalid`,
        sequence: 1,
        type: "run.completed",
        atMs: 0,
        durationMs: 0,
        outcome: "failure",
        terminalNodeId: configuration.entryNodeId || "unknown",
        terminalReason: validation.errors.join("; "),
        totalHops: 0,
        explanation: `Architecture snapshot validation failed: ${validation.errors.join("; ")}`,
      };

      return {
        runId,
        architectureId: snapshot.architectureId,
        architectureRevisionId: snapshot.architectureRevisionId,
        snapshotHash: snapshot.snapshotHash,
        configuration,
        events: [errorEvent],
        totalDurationMs: 0,
        totalEvents: 1,
        totalHops: 0,
        outcome: "failure",
        terminalReason: validation.errors.join("; "),
        visitedNodeIds: [],
        traversedEdgeIds: [],
        frames: ExecutionTraceHelper.generateFrames([errorEvent]),
        createdAt: new Date().toISOString(),
      };
    }

    // Resolve Scenario Preset
    const scenario: BehaviorScenario =
      configuration.scenario ||
      getScenarioPreset(configuration.presetId || "cache-miss");

    const clock = new VirtualClock(0);
    const limitsGuard = new ExecutionLimitsGuard(configuration.limits);
    const runtimeState = RuntimeStateHelper.createInitialState(scenario);

    const events: ExecutionEvent[] = [];
    const stateSnapshots: (ModeledRuntimeState | undefined)[] = [];
    const visitedNodeIds: string[] = [];
    const traversedEdgeIds: string[] = [];

    const nodeMap = new Map<string, BaseNode>(snapshot.nodes.map((n) => [n.id, n]));
    const outgoingEdgesMap = new Map<string, BaseEdge[]>();

    for (const edge of snapshot.edges) {
      if (!outgoingEdgesMap.has(edge.source)) {
        outgoingEdgesMap.set(edge.source, []);
      }
      outgoingEdgesMap.get(edge.source)!.push(edge);
    }

    let sequence = 1;
    const getSeq = () => sequence++;

    const pushEvent = (evt: ExecutionEvent, customSnapshot?: ModeledRuntimeState) => {
      events.push(evt);
      stateSnapshots.push(
        customSnapshot
          ? RuntimeStateHelper.cloneState(customSnapshot)
          : evt.stateSnapshot
            ? RuntimeStateHelper.cloneState(evt.stateSnapshot)
            : RuntimeStateHelper.cloneState(runtimeState)
      );
      limitsGuard.recordEvent();
    };

    let currentNode: BaseNode | null = nodeMap.get(configuration.entryNodeId) || null;
    let terminalOutcome: ExecutionOutcome = "success";
    let terminalReason = "Completed full request/response lifecycle.";

    // Track traversed path to enable response propagation back to client
    const traversedPath: { node: BaseNode; edgeToTarget?: BaseEdge }[] = [];

    // Initialize Modeled HTTP Request
    let currentRequest: ModeledHttpRequest = {
      id: configuration.request.id || `req_${Date.now()}`,
      method: configuration.request.method,
      path: configuration.request.path,
      headers: configuration.request.headers || {
        "content-type": "application/json",
        "x-correlation-id": `corr_${Date.now()}`,
      },
      query: {},
      body: configuration.request.body,
      sourceNodeId: configuration.entryNodeId,
      correlationId: `corr_${Date.now()}`,
    };
    runtimeState.activeRequest = currentRequest;

    // 1. Run Started Event
    if (currentNode) {
      pushEvent({
        id: `evt_${runId}_${getSeq()}_run_started_${currentNode.id}`,
        sequence: sequence - 1,
        type: "run.started",
        atMs: clock.now(),
        durationMs: 0,
        entryNodeId: currentNode.id,
        request: configuration.request,
        explanation: `Execution started at "${currentNode.label || currentNode.id}" handling ${currentRequest.method} ${currentRequest.path}.`,
      });
    }

    let finalResponse: ModeledHttpResponse | null = null;

    // 2. Traversal Loop
    while (currentNode) {
      const currentId = currentNode.id;
      visitedNodeIds.push(currentId);

      // Check limits
      if (limitsGuard.isHopLimitReached()) {
        terminalOutcome = "limit-exceeded";
        terminalReason = `Execution stopped: Maximum hop limit (${configuration.limits.maxHops}) reached.`;
        break;
      }
      if (limitsGuard.isEventLimitReached()) {
        terminalOutcome = "limit-exceeded";
        terminalReason = `Execution stopped: Maximum event limit (${configuration.limits.maxEvents}) reached.`;
        break;
      }
      const cycle = limitsGuard.checkCycle(currentId, 4);
      if (cycle.hasCycle) {
        terminalOutcome = "limit-exceeded";
        terminalReason = `Execution stopped: Cycle detected on component "${currentNode.label || currentId}".`;
        break;
      }

      limitsGuard.recordHop(currentId);

      const compType = String(
        (currentNode.data as Record<string, unknown>)?.componentType ||
        currentNode.type ||
        "service"
      );
      const outEdges = outgoingEdgesMap.get(currentId) || [];

      // Resolve Behavior Adapter
      const adapter = componentBehaviorRegistry.resolve(compType);
      const result = adapter.execute({
        node: currentNode,
        request: currentRequest,
        runtimeState,
        simulatedTimeMs: clock.now(),
        outEdges,
        nodeMap,
        scenario,
        runId,
        getSequence: getSeq,
      });

      // Append generated events and advance clock
      for (const evt of result.events) {
        pushEvent(evt);
      }
      clock.advance(result.durationMs);

      // Check if this component returned a response
      if (result.response) {
        finalResponse = result.response;
        runtimeState.activeResponse = finalResponse;

        // If not terminal client, initiate response propagation back through traversed path!
        if (traversedPath.length > 0) {
          let responseSourceNode = currentNode;

          // Propagate back in reverse order
          for (let i = traversedPath.length - 1; i >= 0; i--) {
            const step = traversedPath[i];
            const returnEdge = step.edgeToTarget;

            if (returnEdge) {
              const edgeDuration = configuration.timing.edgeDurationMs || 250;
              traversedEdgeIds.push(returnEdge.id);

              // 1. Response Dispatched along wire (in reverse)
              pushEvent({
                id: `evt_${runId}_${getSeq()}_resp_disp_${returnEdge.id}`,
                sequence: sequence - 1,
                type: "response.dispatched",
                atMs: clock.now(),
                durationMs: edgeDuration,
                response: finalResponse,
                fromNodeId: responseSourceNode.id,
                toNodeId: step.node.id,
                edgeId: returnEdge.id,
                explanation: `Response HTTP ${finalResponse.status} returning along wire "${returnEdge.label || returnEdge.id}" to "${step.node.label || step.node.id}".`,
              });

              clock.advance(edgeDuration);
            }

            // 2. Response Received at parent node
            pushEvent({
              id: `evt_${runId}_${getSeq()}_resp_rcvd_${step.node.id}`,
              sequence: sequence - 1,
              type: "response.received",
              atMs: clock.now(),
              durationMs: 30,
              response: finalResponse,
              nodeId: step.node.id,
              nodeLabel: step.node.label || step.node.id,
              explanation: `Response HTTP ${finalResponse.status} received by "${step.node.label || step.node.id}".`,
            });
            clock.advance(30);

            responseSourceNode = step.node;
          }
        }

        terminalOutcome = finalResponse.status < 400 ? "success" : "failure";
        terminalReason = `Request completed with HTTP ${finalResponse.status}. ${result.reason}`;
        break;
      }

      if (result.outcome === "blocked") {
        terminalOutcome = "failure";
        terminalReason = result.reason;
        break;
      }

      // If there are outgoing requests to follow
      if (result.outgoingRequests.length > 0) {
        const next = result.outgoingRequests[0];
        const nextNode = nodeMap.get(next.targetNodeId);
        const wireEdge = outEdges.find((e) => e.id === next.edgeId) || outEdges[0];

        if (wireEdge) {
          traversedEdgeIds.push(wireEdge.id);
          traversedPath.push({ node: currentNode, edgeToTarget: wireEdge });
        }

        currentRequest = next.request;
        runtimeState.activeRequest = currentRequest;
        currentNode = nextNode || null;
      } else {
        // No further downstream connection
        terminalOutcome = "success";
        terminalReason = `Execution reached leaf component "${currentNode.label || currentId}".`;
        break;
      }
    }

    // 3. Run Completed Event
    const finalNodeId = currentNode
      ? currentNode.id
      : visitedNodeIds[visitedNodeIds.length - 1] || "unknown";
    const finalNodeLabel = currentNode?.label || finalNodeId;

    pushEvent({
      id: `evt_${runId}_${getSeq()}_run_completed_${finalNodeId}`,
      sequence: sequence - 1,
      type: "run.completed",
      atMs: clock.now(),
      durationMs: 0,
      finalNodeId,
      finalNodeLabel,
      terminalNodeId: finalNodeId,
      terminalReason,
      outcome: terminalOutcome,
      totalHops: limitsGuard.getHopCount(),
      explanation: `Execution ${terminalOutcome.toUpperCase()}: ${terminalReason}`,
    } as any);

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
      terminalReason,
      visitedNodeIds,
      traversedEdgeIds,
      frames,
      createdAt: new Date().toISOString(),
    };
  }
}
