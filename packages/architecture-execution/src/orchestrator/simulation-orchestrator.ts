import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import { ExecutionSnapshotManager } from "../domain/execution-snapshot";
import { ExecutionPlanner } from "../engine/execution-planner";
import type { ExecutionTrace } from "../domain/execution-trace";
import { CapabilityRegistry } from "./capability-registry";
import { CheckpointManager } from "./checkpoint-manager";
import { CrossModuleExecutionPipeline } from "./cross-module-pipeline";
import { EventIntegrityVerifier } from "./event-integrity";
import { UnifiedFindingsAggregator } from "./findings-aggregator";
import { computeDeterministicDigest, createDeterministicId } from "./deterministic-id";
import {
  SimulationRunConfigSchema,
  type ProvenancedMetric,
  type SimulationRunConfig,
  type SimulationRunRecord,
  type SimulationRunState,
} from "./orchestrator-schemas";

const ALLOWED_TRANSITIONS: Record<SimulationRunState, SimulationRunState[]> = {
  created: ["validating", "cancelled", "failed"],
  validating: ["ready", "cancelled", "failed"],
  ready: ["running", "paused", "cancelled", "failed"],
  running: ["paused", "completed", "cancelled", "failed"],
  paused: ["running", "completed", "cancelled", "failed"],
  completed: ["running"], // allows deterministic seek/replay inspect without mutating trace
  cancelled: [],
  failed: [],
};

/**
 * Unified Phase 05.4.25 Simulation Orchestrator.
 * Owns single-source lifecycle state, isolated per-run execution contexts,
 * bounded step/event/memory guards, cancellation cleanup, checkpointing,
 * causal integrity verification, and cross-module findings aggregation.
 */
export class SimulationOrchestrator {
  private readonly runs = new Map<string, SimulationRunRecord>();
  private readonly abortControllers = new Map<string, AbortController>();

  public createRun(
    nodes: BaseNode[],
    edges: BaseEdge[],
    rawConfig: Partial<SimulationRunConfig> = {}
  ): SimulationRunRecord {
    const parsedConfig = SimulationRunConfigSchema.parse(rawConfig);
    const clonedNodes: BaseNode[] = JSON.parse(JSON.stringify(nodes || []));
    const clonedEdges: BaseEdge[] = JSON.parse(JSON.stringify(edges || []));

    const inspection = CapabilityRegistry.inspectTopology(clonedNodes, clonedEdges);
    const runId =
      parsedConfig.runId ||
      createDeterministicId(
        "simrun",
        `${inspection.snapshotDigest}:${parsedConfig.capabilityId}:${parsedConfig.seed}:${this.runs.size + 1}`
      );

    const record: SimulationRunRecord = {
      runId,
      state: "created",
      config: { ...parsedConfig, runId },
      nodes: clonedNodes,
      edges: clonedEdges,
      currentStepIndex: 0,
      virtualTimeMs: 0,
      trace: null,
      frames: [],
      checkpoints: [],
      findings: [],
      metrics: [],
      integrity: null,
      capabilityInspection: inspection,
      stateTransitions: [
        {
          from: null,
          to: "created",
          atVirtualMs: 0,
          reason: "Simulation run initialized with isolated topology clone.",
        },
      ],
    };

    this.runs.set(runId, record);
    this.abortControllers.set(runId, new AbortController());

    // Preflight validation transition
    this.transition(record, "validating", "Validating topology snapshot and capability contracts.");
    if (clonedNodes.length === 0) {
      record.failureReason = "Cannot execute simulation on an empty canvas.";
      record.findings = UnifiedFindingsAggregator.aggregate({
        nodes: clonedNodes,
        edges: clonedEdges,
        capabilityInspection: inspection,
      });
      this.transition(record, "failed", record.failureReason);
      return record;
    }

    this.transition(record, "ready", "Architecture snapshot validated and ready to execute.");
    return record;
  }

  public executeRun(runId: string): SimulationRunRecord {
    const record = this.requireRun(runId);
    const abortCtrl = this.abortControllers.get(runId);

    if (record.state === "cancelled" || abortCtrl?.signal.aborted) {
      return record;
    }
    if (record.state === "failed") {
      return record;
    }

    if (record.state === "ready" || record.state === "paused") {
      this.transition(record, "running", "Executing deterministic simulation trace.");
    }

    if (abortCtrl?.signal.aborted) {
      this.transition(record, "cancelled", "Run aborted prior to planner execution.");
      return record;
    }

    try {
      const cap = record.config.capabilityId;
      let trace: ExecutionTrace;
      let metrics: ProvenancedMetric[] = [];

      if (cap === "core-flow" && !record.config.scenarioId && !record.config.incomingRps) {
        const snapshot = ExecutionSnapshotManager.createSnapshot(
          record.config.architectureId,
          record.config.revisionId,
          "Unified Simulation Snapshot",
          record.nodes,
          record.edges
        );
        trace = ExecutionPlanner.planExecution(snapshot, {
          version: 1,
          entryNodeId: record.nodes[0]?.id || "entry",
          request: {
            id: createDeterministicId("req", runId, 1),
            method: "GET",
            path: "/api/v1/health",
            headers: {},
          },
          routing: { mode: "deterministic", selectedBranches: {} },
          limits: {
            maxHops: 50,
            maxEvents: record.config.maxEvents,
            maxDurationMs: record.config.maxDurationMs,
          },
          timing: { nodeDurationMs: 25, edgeDurationMs: 5 },
        });
      } else {
        const pipeline = CrossModuleExecutionPipeline.execute({
          nodes: record.nodes,
          edges: record.edges,
          config: record.config,
        });
        trace = pipeline.trace;
        metrics = pipeline.metrics;
      }

      if (abortCtrl?.signal.aborted) {
        record.cancelledAtStep = record.currentStepIndex;
        this.transition(record, "cancelled", "Run cancelled before committing output frames.");
        return record;
      }

      // Enforce bounded step & event caps safely
      const boundedFrames = (trace.frames || []).slice(0, record.config.maxSteps);
      const boundedEvents = (trace.events || []).slice(0, record.config.maxEvents);
      const boundedTrace: ExecutionTrace = {
        ...trace,
        events: boundedEvents,
        totalEvents: boundedEvents.length,
        frames: boundedFrames,
      };

      const checkpoints = CheckpointManager.buildCheckpoints(
        boundedFrames,
        record.config.checkpointInterval,
        record.config.seed
      );

      const integrity = EventIntegrityVerifier.verifyTrace(
        boundedTrace,
        record.nodes,
        record.edges
      );

      const findings = UnifiedFindingsAggregator.aggregate({
        nodes: record.nodes,
        edges: record.edges,
        trace: boundedTrace,
        capabilityInspection: record.capabilityInspection,
      });

      record.trace = boundedTrace;
      record.frames = boundedFrames;
      record.checkpoints = checkpoints;
      record.integrity = integrity;
      record.findings = findings;
      record.metrics =
        metrics.length > 0
          ? metrics
          : [
              {
                key: "total_events",
                label: "Executed Trace Events",
                value: boundedEvents.length,
                unit: "events",
                provenance: "observed-simulated",
              },
              {
                key: "total_duration_ms",
                label: "Simulated Virtual Duration",
                value: boundedTrace.totalDurationMs,
                unit: "ms",
                provenance: "observed-simulated",
              },
            ];

      record.currentStepIndex = Math.max(0, boundedFrames.length - 1);
      record.virtualTimeMs = boundedTrace.totalDurationMs;

      this.transition(
        record,
        "completed",
        `Completed deterministically with ${boundedEvents.length} events and ${checkpoints.length} checkpoints.`
      );
      return record;
    } catch (err) {
      record.failureReason = err instanceof Error ? err.message : "Unknown orchestrator failure";
      this.transition(record, "failed", record.failureReason);
      return record;
    }
  }

  public pauseRun(runId: string): SimulationRunRecord {
    const record = this.requireRun(runId);
    if (record.state === "running" || record.state === "ready") {
      this.transition(record, "paused", "Paused by operator request.");
    }
    return record;
  }

  public resumeRun(runId: string): SimulationRunRecord {
    const record = this.requireRun(runId);
    if (record.state === "paused") {
      this.transition(record, "running", "Resumed from paused state.");
    }
    return record;
  }

  public seekStep(runId: string, targetStepIndex: number): {
    record: SimulationRunRecord;
    restoredFromCheckpointStep: number;
    replayedSteps: number;
    stateHash: string;
  } {
    const record = this.requireRun(runId);
    const replay = CheckpointManager.seekWithCheckpointReplay(
      record.frames,
      record.checkpoints,
      targetStepIndex
    );

    if (replay.frame) {
      record.currentStepIndex = replay.frame.frameIndex;
      record.virtualTimeMs = replay.frame.virtualTimeMs;
    }

    return {
      record,
      restoredFromCheckpointStep: replay.restoredFromCheckpointStep,
      replayedSteps: replay.replayedSteps,
      stateHash: replay.stateHash,
    };
  }

  public cancelRun(runId: string, reason = "Cancelled by user or resource watchdog."): SimulationRunRecord {
    const record = this.requireRun(runId);
    const ctrl = this.abortControllers.get(runId);
    if (ctrl && !ctrl.signal.aborted) {
      ctrl.abort(reason);
    }

    if (
      record.state !== "completed" &&
      record.state !== "cancelled" &&
      record.state !== "failed"
    ) {
      record.cancelledAtStep = record.currentStepIndex;
      this.transition(record, "cancelled", reason);
    }

    this.abortControllers.delete(runId);
    return record;
  }

  public getRun(runId: string): SimulationRunRecord | undefined {
    return this.runs.get(runId);
  }

  public getAbortSignal(runId: string): AbortSignal | undefined {
    return this.abortControllers.get(runId)?.signal;
  }

  public disposeRun(runId: string): boolean {
    const ctrl = this.abortControllers.get(runId);
    if (ctrl && !ctrl.signal.aborted) {
      ctrl.abort("Disposed");
    }
    this.abortControllers.delete(runId);
    return this.runs.delete(runId);
  }

  public listRunSummaries(): Array<{
    runId: string;
    state: SimulationRunState;
    capabilityId: string;
    virtualTimeMs: number;
    findingsCount: number;
  }> {
    return Array.from(this.runs.values()).map((r) => ({
      runId: r.runId,
      state: r.state,
      capabilityId: r.config.capabilityId,
      virtualTimeMs: r.virtualTimeMs,
      findingsCount: r.findings.length,
    }));
  }

  public computeRunFingerprint(runId: string): string {
    const record = this.requireRun(runId);
    const payload = JSON.stringify({
      config: {
        ...record.config,
        runId: "normalized",
      },
      events: (record.trace?.events || []).map((e) => ({
        seq: e.sequence,
        type: e.type,
        atMs: e.atMs,
        durationMs: e.durationMs,
      })),
      checkpointHashes: record.checkpoints.map((c) => c.stateHash),
      findingKeys: record.findings.map((f) => `${f.dedupeKey}:${f.severity}`),
    });
    return computeDeterministicDigest(payload);
  }

  private requireRun(runId: string): SimulationRunRecord {
    const rec = this.runs.get(runId);
    if (!rec) {
      throw new Error(`Simulation run "${runId}" was not found in orchestrator registry.`);
    }
    return rec;
  }

  private transition(
    record: SimulationRunRecord,
    next: SimulationRunState,
    reason: string
  ): void {
    const allowed = ALLOWED_TRANSITIONS[record.state] || [];
    if (!allowed.includes(next)) {
      throw new Error(
        `Invalid SimulationRun transition from "${record.state}" to "${next}" (${reason}).`
      );
    }
    record.stateTransitions.push({
      from: record.state,
      to: next,
      atVirtualMs: record.virtualTimeMs,
      reason,
    });
    record.state = next;
  }
}

export const defaultSimulationOrchestrator = new SimulationOrchestrator();

