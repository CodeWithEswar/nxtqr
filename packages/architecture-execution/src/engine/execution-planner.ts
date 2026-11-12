import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type { ExecutionSnapshot } from "../domain/execution-snapshot";
import type { ExecutionConfiguration, ExecutionOutcome } from "../schemas/execution.schemas";
import type { ExecutionEvent } from "../domain/execution-event";
import { type ExecutionTrace, ExecutionTraceHelper } from "../domain/execution-trace";
import { VirtualClock } from "./virtual-clock";
import { EventBuilder } from "./event-builder";
import { RouteResolver } from "./route-resolver";
import { ExecutionLimitsGuard } from "./execution-limits";
import { componentAdapterRegistry } from "../adapters/adapter-registry";
import { ExecutionSnapshotManager } from "../domain/execution-snapshot";
import { RequestLifecyclePlanner } from "./request-lifecycle-planner";

export class ExecutionPlanner {
  public static planExecution(
    snapshot: ExecutionSnapshot,
    configuration: ExecutionConfiguration
  ): ExecutionTrace {
    if (configuration.presetId || configuration.scenario) {
      return RequestLifecyclePlanner.planLifecycle(snapshot, configuration);
    }

    const runId = `run_${snapshot.snapshotHash.slice(5, 11)}_${Date.now()}`;
    const validation = ExecutionSnapshotManager.validateSnapshot(snapshot);

    if (!validation.isValid) {
      const errorEvents: ExecutionEvent[] = [
        EventBuilder.buildRunCompletedEvent(
          runId,
          1,
          0,
          configuration.entryNodeId || "unknown",
          "Invalid Architecture Snapshot",
          "failure",
          validation.errors.join("; "),
          0
        ),
      ];

      return {
        runId,
        architectureId: snapshot.architectureId,
        architectureRevisionId: snapshot.architectureRevisionId,
        snapshotHash: snapshot.snapshotHash,
        configuration,
        events: errorEvents,
        totalDurationMs: 0,
        totalEvents: errorEvents.length,
        totalHops: 0,
        outcome: "failure",
        terminalReason: validation.errors.join("; "),
        visitedNodeIds: [],
        traversedEdgeIds: [],
        frames: ExecutionTraceHelper.generateFrames(errorEvents),
        createdAt: new Date().toISOString(),
      };
    }

    const clock = new VirtualClock(0);
    const limitsGuard = new ExecutionLimitsGuard(configuration.limits);
    const events: ExecutionEvent[] = [];
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
    let currentNode: BaseNode | null = nodeMap.get(configuration.entryNodeId) || null;
    let terminalOutcome: ExecutionOutcome = "success";
    let terminalReason = "Completed full traversal without errors.";

    // 1. Run Started Event
    if (currentNode) {
      events.push(
        EventBuilder.buildRunStartedEvent(
          runId,
          sequence++,
          clock.now(),
          currentNode.id,
          currentNode.label || currentNode.id,
          configuration.request
        )
      );
      limitsGuard.recordEvent();
    }

    // 2. Traversal Loop
    while (currentNode) {
      const currentId = currentNode.id;
      visitedNodeIds.push(currentId);

      // Check limits
      if (limitsGuard.isHopLimitReached()) {
        terminalOutcome = "limit-exceeded";
        terminalReason = `Execution stopped: Maximum hop limit (${configuration.limits.maxHops} hops) reached.`;
        break;
      }

      if (limitsGuard.isEventLimitReached()) {
        terminalOutcome = "limit-exceeded";
        terminalReason = `Execution stopped: Maximum event limit (${configuration.limits.maxEvents} events) reached.`;
        break;
      }

      const cycle = limitsGuard.checkCycle(currentId, 4);
      if (cycle.hasCycle) {
        terminalOutcome = "limit-exceeded";
        terminalReason = `Execution stopped: Bounded loop detected on component "${currentNode.label || currentId}" (${cycle.visitCount} visits).`;
        break;
      }

      limitsGuard.recordHop(currentId);
      const hopIndex = limitsGuard.getHopCount();

      // Resolve adapter & component step execution
      const compType = String(
        (currentNode.data as Record<string, unknown>)?.componentType ||
        currentNode.type ||
        "service"
      );
      const adapter = componentAdapterRegistry.resolve(compType);
      const componentResult = adapter.plan({
        node: currentNode,
        request: configuration.request,
        hopIndex,
        simulatedTimeMs: clock.now(),
      });

      // Node Entered
      const nodeDuration = configuration.timing.nodeDurationMs || componentResult.durationMs;
      events.push(
        EventBuilder.buildNodeEnteredEvent(
          runId,
          sequence++,
          clock.now(),
          nodeDuration,
          currentNode.id,
          currentNode.label || currentNode.id,
          compType,
          hopIndex,
          configuration.request
        )
      );
      limitsGuard.recordEvent();

      // Advance clock for node processing
      clock.advance(nodeDuration);

      // Node Exited
      events.push(
        EventBuilder.buildNodeExitedEvent(
          runId,
          sequence++,
          clock.now(),
          nodeDuration,
          currentNode.id,
          currentNode.label || currentNode.id,
          compType,
          componentResult.stepOutcome
        )
      );
      limitsGuard.recordEvent();

      if (componentResult.stepOutcome === "blocked") {
        terminalOutcome = "failure";
        terminalReason = `Component "${currentNode.label || currentId}" blocked request progression. Details: ${componentResult.explanation}`;
        break;
      }

      // Route resolution
      const outEdges = outgoingEdgesMap.get(currentId) || [];
      const route = RouteResolver.resolveNextHop(
        currentNode,
        outEdges,
        nodeMap,
        configuration,
        configuration.request
      );

      // Multiple outgoing connections -> record route decision
      if (outEdges.length > 1 && route.selectedEdge) {
        events.push(
          EventBuilder.buildRouteSelectedEvent(
            runId,
            sequence++,
            clock.now(),
            10,
            currentId,
            route.selectedEdge.id,
            route.targetNode?.id || route.selectedEdge.target,
            route.targetNode?.label || route.selectedEdge.target,
            route.decisionReason,
            route.availableEdges.map((e) => e.id)
          )
        );
        limitsGuard.recordEvent();
      }

      // Check if terminal
      if (route.isTerminal || !route.selectedEdge || !route.targetNode) {
        terminalOutcome = "success";
        terminalReason = route.decisionReason;
        break;
      }

      // Transit edge
      const edge = route.selectedEdge;
      traversedEdgeIds.push(edge.id);
      const edgeDuration = configuration.timing.edgeDurationMs || 300;
      const edgeProtocol = String(
        (edge.data as Record<string, unknown>)?.protocol || "http"
      );

      events.push(
        EventBuilder.buildEdgeTraversedEvent(
          runId,
          sequence++,
          clock.now(),
          edgeDuration,
          edge.id,
          edge.label || edge.id,
          currentNode.id,
          currentNode.label || currentNode.id,
          route.targetNode.id,
          route.targetNode.label || route.targetNode.id,
          edgeProtocol
        )
      );
      limitsGuard.recordEvent();

      // Advance clock for wire transit
      clock.advance(edgeDuration);

      // Advance to target node
      currentNode = route.targetNode;
    }

    // 3. Run Completed Event
    const finalNodeId = currentNode ? currentNode.id : (visitedNodeIds[visitedNodeIds.length - 1] || "unknown");
    const finalNodeLabel = (currentNode?.label || finalNodeId);

    events.push(
      EventBuilder.buildRunCompletedEvent(
        runId,
        sequence++,
        clock.now(),
        finalNodeId,
        finalNodeLabel,
        terminalOutcome,
        terminalReason,
        limitsGuard.getHopCount()
      )
    );
    limitsGuard.recordEvent();

    const frames = ExecutionTraceHelper.generateFrames(events);

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

