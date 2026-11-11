import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  FailureScenario,
  SimulationResult,
  SimulationEvent,
  TimelineStepSnapshot,
  SimulationFinding,
  SimulationComparisonResult,
} from "../contracts/simulation.types";
import { FailureScenarioSchema } from "../schemas/simulation.schemas";
import { VirtualClock } from "./virtual-clock";
import { SimulationEventQueue } from "./event-queue";
import { DeterministicRandom } from "./deterministic-replay";
import { ComponentStateMachine } from "./component-state-machine";
import { DependencyPropagationEngine } from "./propagation-engine";
import { CriticalJourneyEvaluator } from "../analysis/journey-evaluator";
import { BlastRadiusEvaluator } from "../analysis/blast-radius-evaluator";
import { RecoveryEvaluator } from "../analysis/recovery-evaluator";
import { CascadingFailureEvaluator } from "../analysis/cascading-failure-evaluator";

export class ArchitectureSimulationEngine {
  private static readonly ENGINE_VERSION = "1.0.0-phase05.3.15";

  /**
   * Executes a deterministic, model-based failure simulation against an architecture graph.
   * Completely isolated from real infrastructure.
   */
  public simulate(
    nodes: BaseNode[],
    edges: BaseEdge[],
    scenario: FailureScenario
  ): SimulationResult {
    const tStart = performance.now();

    // 1. Validate scenario schema
    const validatedScenario = FailureScenarioSchema.parse(scenario);

    // 2. Initialize simulation components
    const clock = new VirtualClock(0, validatedScenario.durationMs, 1_000);
    const eventQueue = new SimulationEventQueue();
    const random = new DeterministicRandom(validatedScenario.randomSeed || 1337);
    const stateMachine = new ComponentStateMachine(nodes);
    const propagationEngine = new DependencyPropagationEngine(nodes, edges);

    const executedEvents: SimulationEvent[] = [];
    const timeline: TimelineStepSnapshot[] = [];

    // 3. Pre-schedule explicit failure and recovery events from injections
    for (const inj of validatedScenario.injections) {
      // Injected failure start event
      eventQueue.enqueue({
        id: `evt-start-${inj.id}`,
        scenarioId: validatedScenario.id,
        timestampMs: inj.startMs,
        type: "failure_injected",
        targetId: inj.targetId,
        payload: {
          injectionId: inj.id,
          injectionType: inj.type,
          severity: inj.severity,
          parameters: inj.parameters,
        },
        description: `Injected ${inj.type.replace(/_/g, " ")} on target #${inj.targetId} (${inj.name})`,
      });

      // Scheduled recovery event (if automatic)
      if (inj.recoveryBehavior !== "none") {
        const jitter = random.nextInt(0, 10);
        const recoveryTime = inj.startMs + (inj.parameters?.recoveryTimeMs ?? inj.durationMs) + jitter;
        eventQueue.enqueue({
          id: `evt-rec-${inj.id}`,
          scenarioId: validatedScenario.id,
          timestampMs: recoveryTime,
          type: "recovery_completed",
          targetId: inj.targetId,
          payload: { injectionId: inj.id },
          description: `Recovery completed for target #${inj.targetId}`,
        });
      }
    }

    // 4. Time-stepped discrete event simulation loop
    while (!clock.isFinished) {
      const currentMs = clock.currentTimeMs;
      const readyEvents = eventQueue.drainUpTo(currentMs);

      for (const event of readyEvents) {
        executedEvents.push(event);

        if (event.type === "failure_injected") {
          stateMachine.injectFailure(event.targetId, event.id, event.description);

          // Trigger failure propagation to upstream callers
          const propEvents = propagationEngine.propagateFailure(event.targetId, stateMachine, {
            scenarioId: validatedScenario.id,
            timestampMs: currentMs,
          });

          for (const pe of propEvents) {
            executedEvents.push(pe);
          }
        } else if (event.type === "recovery_completed") {
          stateMachine.removeFailure(event.targetId, event.payload.injectionId as string);
          stateMachine.setDegraded(event.targetId, false);
          stateMachine.setCircuitBreaker(event.targetId, false);
        }
      }

      // Snapshot current virtual timeline state
      const currentSnapshots = stateMachine.getAllSnapshots();
      const journeyResults = CriticalJourneyEvaluator.evaluateJourneys(
        validatedScenario.criticalJourneys,
        currentSnapshots
      );

      const journeyStatuses: Record<string, "available" | "degraded" | "unavailable" | "unknown"> = {};
      for (const j of journeyResults) {
        journeyStatuses[j.journeyId] = j.status;
      }

      const activeBlastRadius = Object.keys(currentSnapshots).filter(
        (id) => currentSnapshots[id].state !== "healthy"
      );

      timeline.push({
        timestampMs: currentMs,
        eventIndex: executedEvents.length,
        componentStates: currentSnapshots,
        activeEvents: readyEvents,
        journeyStatuses,
        activeBlastRadius,
      });

      clock.step();
    }

    // 5. Final Post-Simulation Analysis
    const finalStates = stateMachine.getAllSnapshots();
    const finalJourneyResults = CriticalJourneyEvaluator.evaluateJourneys(
      validatedScenario.criticalJourneys,
      finalStates
    );

    const primaryTargetId = validatedScenario.injections[0]?.targetId || "system";
    const primaryTargetNode = nodes.find((n) => n.id === primaryTargetId);
    const blastRadius = BlastRadiusEvaluator.evaluate(
      primaryTargetId,
      primaryTargetNode?.label || primaryTargetId,
      nodes,
      finalStates,
      finalJourneyResults
    );

    const hasDbOutage = validatedScenario.injections.some((i) => i.type.includes("database"));
    const hasQueueOutage = validatedScenario.injections.some((i) => i.type.includes("queue"));
    const maxBacklog = Math.max(...Object.values(finalStates).map((s) => s.unprocessedBacklog || 0), 0);
    const recovery = RecoveryEvaluator.evaluate(
      validatedScenario,
      hasDbOutage,
      hasQueueOutage,
      maxBacklog
    );

    const cascadingRisks = CascadingFailureEvaluator.evaluate(
      nodes,
      edges,
      finalStates,
      executedEvents
    );

    // 6. Generate Actionable Resilience Findings
    const findings: SimulationFinding[] = [];

    // Critical journeys interrupted
    const interruptedJourneys = finalJourneyResults.filter((j) => j.status === "unavailable");
    if (interruptedJourneys.length > 0) {
      findings.push({
        id: "find-journeys-interrupted",
        severity: "critical",
        category: "journey",
        title: `${interruptedJourneys.length} Critical User Journey(s) Interrupted Under Failure`,
        explanation: `Under scenario '${validatedScenario.name}', critical journeys (${interruptedJourneys.map((j) => j.name).join(", ")}) became unavailable due to missing redundancy or lack of graceful degradation paths.`,
        affectedNodeIds: Array.from(new Set(interruptedJourneys.flatMap((j) => j.affectedComponentIds))),
        remediationRecommendation: "Introduce read-replicas, fallback responses, or circuit-breakers to isolate failed components from critical journeys.",
      });
    }

    // High blast radius
    if (blastRadius.blastRadiusScore > 40) {
      findings.push({
        id: "find-high-blast-radius",
        severity: "high",
        category: "resilience",
        title: `High Blast Radius (${blastRadius.blastRadiusScore}%) Detected`,
        explanation: `A single failure event in #${blastRadius.targetId} propagated to ${blastRadius.indirectlyImpactedNodeIds.length} dependent component(s) across the architecture.`,
        affectedNodeIds: [blastRadius.targetId, ...blastRadius.indirectlyImpactedNodeIds],
        remediationRecommendation: "Implement bulkheads and circuit breakers to partition dependencies into bounded failure domains.",
      });
    }

    // RTO exceeded
    if (!recovery.rtoMet) {
      findings.push({
        id: "find-rto-exceeded",
        severity: "medium",
        category: "recovery",
        title: "Modeled Recovery Duration Exceeds Declared Target RTO",
        explanation: `Estimated recovery time (${(recovery.totalModeledRecoveryMs / 1000).toFixed(1)}s) exceeds target RTO (${((recovery.targetRtoMs || 60000) / 1000).toFixed(1)}s).`,
        affectedNodeIds: [primaryTargetId],
        remediationRecommendation: "Configure automated multi-AZ failover and fast health-check probe intervals to minimize detection and failover latency.",
      });
    }

    const tEnd = performance.now();

    return {
      id: `sim-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      scenario: validatedScenario,
      graphRevision: validatedScenario.graphRevision,
      engineVersion: ArchitectureSimulationEngine.ENGINE_VERSION,
      events: executedEvents,
      timeline,
      finalComponentStates: finalStates,
      journeyResults: finalJourneyResults,
      blastRadius,
      recovery,
      cascadingRisks,
      findings,
      completedAt: new Date().toISOString(),
      executionDurationMs: Math.round(tEnd - tStart),
    };
  }

  /**
   * Compares the failure simulation results of a baseline architecture against an improved candidate architecture.
   */
  public compareScenarios(
    baseline: SimulationResult,
    candidate: SimulationResult
  ): SimulationComparisonResult {
    const blastDelta = candidate.blastRadius.blastRadiusScore - baseline.blastRadius.blastRadiusScore;
    const baseUnavail = baseline.journeyResults.filter((j) => j.status === "unavailable").length;
    const candUnavail = candidate.journeyResults.filter((j) => j.status === "unavailable").length;
    const journeyDelta = candUnavail - baseUnavail;

    const improvedComponents: string[] = [];
    const degradedComponents: string[] = [];

    for (const [nodeId, candState] of Object.entries(candidate.finalComponentStates)) {
      const baseState = baseline.finalComponentStates[nodeId];
      if (baseState) {
        if (baseState.state === "unavailable" && candState.state === "healthy") {
          improvedComponents.push(nodeId);
        } else if (baseState.state === "healthy" && candState.state === "unavailable") {
          degradedComponents.push(nodeId);
        }
      }
    }

    const newResilienceControls: string[] = [];
    if (blastDelta < 0) newResilienceControls.push("Blast radius reduction through redundancy");
    if (journeyDelta < 0) newResilienceControls.push("Critical journey availability preserved");
    if (candidate.cascadingRisks.length < baseline.cascadingRisks.length) {
      newResilienceControls.push("Cascading retry/surge mitigation active");
    }

    const summary =
      blastDelta <= 0 && journeyDelta <= 0
        ? `Candidate architecture improved resilience: blast radius reduced by ${Math.abs(blastDelta)}%, and ${Math.abs(journeyDelta)} fewer journeys interrupted.`
        : `Candidate architecture experienced higher blast radius (${blastDelta > 0 ? "+" : ""}${blastDelta}%) under this failure scenario.`;

    return {
      baselineScenarioId: baseline.scenario.id,
      baselineRevision: baseline.graphRevision,
      candidateRevision: candidate.graphRevision,
      baselineBlastRadiusScore: baseline.blastRadius.blastRadiusScore,
      candidateBlastRadiusScore: candidate.blastRadius.blastRadiusScore,
      blastRadiusScoreDelta: blastDelta,
      baselineUnavailableJourneys: baseUnavail,
      candidateUnavailableJourneys: candUnavail,
      journeyAvailabilityDelta: journeyDelta,
      improvedComponentIds: improvedComponents,
      degradedComponentIds: degradedComponents,
      newResilienceControlsActive: newResilienceControls,
      summary,
    };
  }
}

export const architectureSimulationEngine = new ArchitectureSimulationEngine();
