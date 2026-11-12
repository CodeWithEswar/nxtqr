import type { ExecutionTrace, VisualizationFrame } from "../domain/execution-trace";
import { RuntimeStateHelper } from "../domain/runtime-state";
import type { ExecutionConfiguration } from "../schemas/execution.schemas";
import { DeterministicRandom } from "../resilience/deterministic-random";
import {
  resolveDeploymentBudgets,
  stepReplicaLifecycleAndProbes,
} from "./lifecycle/probe-replica-lifecycle";
import {
  computeRevisionStats,
  evaluateFeatureFlagsDeterministic,
  evaluatePromotionGate,
} from "./progressive/gates-rollback-engine";
import { DeploymentInvariantMonitor } from "./invariants/deployment-invariants";
import {
  type ApplicationRevision,
  type DeployIncidentRuntime,
  type DeployProbeResult,
  type DeployReplicaRuntime,
  type DeploymentConfig,
  type DeploymentRuntimeInstance,
  type DeploymentScenario,
  DeploymentScenarioSchema,
  type ModeledDeploymentRuntimeState,
  type TrafficAllocationRuntime,
} from "./deployment-schemas";

export class DeploymentExecutionEngine {
  public static runScenario(rawScenario: DeploymentScenario): ExecutionTrace {
    const scenario = DeploymentScenarioSchema.parse(rawScenario);
    const rng = new DeterministicRandom(scenario.seed);

    const revisions: Record<string, ApplicationRevision> = {};
    for (const r of scenario.revisions.slice(0, scenario.limits.maxRevisions)) {
      revisions[r.id] = r;
    }

    const replicas: Record<string, DeployReplicaRuntime> = {};
    let repCounter = 0;

    const addReplicasForRevision = (
      serviceId: string,
      revisionId: string,
      region: string,
      count: number,
      readyNow: boolean,
      nowMs: number,
      availableCapacityUnits: number
    ): { createdIds: string[]; pendingCapacity: number } => {
      const rev = revisions[revisionId];
      if (!rev) return { createdIds: [], pendingCapacity: count };
      const createdIds: string[] = [];
      let pendingCapacity = 0;
      const usedUnits = Object.values(replicas)
        .filter((r) => r.state !== "TERMINATED" && r.state !== "FAILED")
        .reduce((acc, r) => acc + (revisions[r.revisionId]?.cpuRequestUnits ?? 1), 0);
      let remainingUnits = Math.max(0, availableCapacityUnits - usedUnits);

      for (let i = 0; i < count; i++) {
        if (Object.keys(replicas).length >= scenario.limits.maxReplicas) break;
        const id = `rep_${serviceId}_${rev.version}_${++repCounter}`;
        if (!readyNow && remainingUnits < rev.cpuRequestUnits) {
          pendingCapacity += 1;
          replicas[id] = {
            id,
            serviceId,
            revisionId,
            region,
            nodeId: "unscheduled-pending-capacity",
            state: "PENDING",
            startedAtMs: nowMs,
            readinessPassed: false,
            livenessPassed: true,
            startupPassed: false,
            consecutiveReadinessFailures: 0,
            consecutiveLivenessFailures: 0,
            restartCount: 0,
            activeRequests: 0,
            longLivedSessions: 0,
          };
          continue;
        }
        remainingUnits -= rev.cpuRequestUnits;
        replicas[id] = {
          id,
          serviceId,
          revisionId,
          region,
          nodeId: `node-${region}-${((repCounter - 1) % 3) + 1}`,
          state: readyNow ? "READY" : "STARTING",
          startedAtMs: nowMs,
          readyAtMs: readyNow ? nowMs : undefined,
          readinessPassed: readyNow,
          livenessPassed: true,
          startupPassed: readyNow,
          consecutiveReadinessFailures: 0,
          consecutiveLivenessFailures: 0,
          restartCount: 0,
          activeRequests: 0,
          longLivedSessions: readyNow && rev.longLivedConnections ? 2 : 0,
        };
        createdIds.push(id);
      }
      return { createdIds, pendingCapacity };
    };

    const deployments: Record<string, DeploymentRuntimeInstance> = {};
    const allocations: Record<string, TrafficAllocationRuntime> = {};
    const revLatencies: Record<string, number[]> = {};
    const revErrors: Record<string, number> = {};
    const revRequests: Record<string, number> = {};
    const consecutivePassesByGate: Record<string, number> = {};
    const manualApprovedGates = new Set<string>();

    for (const r of Object.values(revisions)) {
      revLatencies[r.id] = [];
      revErrors[r.id] = 0;
      revRequests[r.id] = 0;
    }

    // Initialize stable replicas & deployment runtime entries
    for (const dCfg of scenario.deployments) {
      const stableRev = revisions[dCfg.stableRevisionId];
      const desired = stableRev?.desiredReplicas ?? 2;
      const budgets = resolveDeploymentBudgets(
        desired,
        dCfg.maxSurge,
        dCfg.maxUnavailable
      );

      for (const reg of dCfg.regions) {
        addReplicasForRevision(
          dCfg.serviceId,
          dCfg.stableRevisionId,
          reg,
          Math.max(1, Math.round(desired / dCfg.regions.length)),
          true,
          0,
          dCfg.clusterCapacityUnits * 2
        );
      }

      const regStatus: DeploymentRuntimeInstance["regionalStatus"] = {};
      for (const reg of dCfg.regions) {
        regStatus[reg] = { weightPct: 0, healthy: true, rolledBack: false };
      }

      deployments[dCfg.id] = {
        id: dCfg.id,
        serviceId: dCfg.serviceId,
        strategy: dCfg.strategy,
        state: "CREATED",
        stableRevisionId: dCfg.stableRevisionId,
        candidateRevisionId: dCfg.candidateRevisionId,
        activeEnvironment: "blue",
        currentStageIndex: 0,
        totalStages: dCfg.stages.length,
        currentStageId: dCfg.stages[0]?.id,
        stageStartedAtMs: 0,
        targetCandidateWeightPct: 0,
        observedCandidateWeightPct: 0,
        maxSurgeCount: budgets.maxSurgeCount,
        maxUnavailableCount: budgets.maxUnavailableCount,
        desiredReplicas: desired,
        availableReplicas: desired,
        readyStableReplicas: desired,
        readyCandidateReplicas: 0,
        surgeReplicas: 0,
        unavailableReplicas: 0,
        pendingCapacityReplicas: 0,
        paused: false,
        gateEvaluations: [],
        rollback: {
          state: "NONE",
          fromRevisionId: dCfg.candidateRevisionId,
          toRevisionId: dCfg.stableRevisionId,
          irreversibleDataWarning: Boolean(dCfg.migrationPlan?.irreversibleMutation),
        },
        migrationStatus: dCfg.migrationPlan?.phase ?? "none",
        compatibilityStatus: "compatible",
        regionalStatus: regStatus,
        timeline: [
          {
            atMs: 0,
            kind: "created",
            summary: `Deployment '${dCfg.id}' initialized (${dCfg.strategy})`,
          },
        ],
      };

      allocations[dCfg.serviceId] = {
        serviceId: dCfg.serviceId,
        weights: [
          { revisionId: dCfg.stableRevisionId, percentage: 100 },
          { revisionId: dCfg.candidateRevisionId, percentage: 0 },
        ],
        noHealthyEndpoints: false,
      };
    }

    const recentProbes: DeployProbeResult[] = [];
    const incidents: DeployIncidentRuntime[] = [];
    let restartsTriggered = 0;
    let routedUnreadyCount = 0;
    const promotedAfterFailedGate = false;
    const advancedWhilePaused = false;
    let deploymentStartedAt: number | null = null;
    let deploymentCompletedAt: number | null = null;
    let rollbackStartedAt: number | null = null;
    let rollbackCompletedAt: number | null = null;

    const allEvents: ExecutionTrace["events"] = [];
    const frames: VisualizationFrame[] = [];
    const baseRuntime = RuntimeStateHelper.createInitialState();
    let seq = 0;

    // Build chronological tick schedule
    const stepMs = 40;
    const tickSet = new Set<number>([0]);
    for (
      let t = scenario.traffic.startAtMs;
      t <= Math.min(scenario.traffic.endAtMs, scenario.limits.maxVirtualDurationMs);
      t += stepMs
    ) {
      tickSet.add(t);
    }
    for (const c of scenario.commands) tickSet.add(c.atMs);
    for (const f of scenario.faults) tickSet.add(f.atMs);
    const ticks = Array.from(tickSet)
      .filter((t) => t <= scenario.limits.maxVirtualDurationMs)
      .sort((a, b) => a - b);

    const buildSnapshot = (nowMs: number): ModeledDeploymentRuntimeState => {
      const totalReplicasList = Object.values(replicas).filter(
        (r) => r.state !== "TERMINATED"
      );
      const readyReplicasList = totalReplicasList.filter(
        (r) => r.state === "READY"
      );
      const revStats: ModeledDeploymentRuntimeState["revisionStats"] = {};
      const totalReqsAll = Object.values(revRequests).reduce((a, b) => a + b, 0);

      for (const r of Object.values(revisions)) {
        const lats = revLatencies[r.id] ?? [];
        const activeOnRev = totalReplicasList.filter(
          (rep) => rep.revisionId === r.id
        );
        const avgSat =
          activeOnRev.length > 0
            ? Math.min(100, Math.round(r.baseSaturationPct + lats.length * 0.15))
            : r.baseSaturationPct;
        revStats[r.id] = computeRevisionStats({
          revisionId: r.id,
          version: r.version,
          latenciesMs: lats,
          errors: revErrors[r.id] ?? 0,
          saturationPct: avgSat,
          totalServiceRequests: totalReqsAll,
        });
      }

      const firstDep = Object.values(deployments)[0];
      const candStats = firstDep
        ? revStats[firstDep.candidateRevisionId]
        : undefined;
      const stabStats = firstDep ? revStats[firstDep.stableRevisionId] : undefined;

      const allGates = Object.values(deployments).flatMap(
        (d) => d.gateEvaluations
      );
      const invariants = DeploymentInvariantMonitor.verify({
        scenario,
        deployments,
        replicas,
        allocations,
        routedUnreadyCount,
        promotedAfterFailedGate,
        advancedWhilePaused,
      });

      const featureFlags = evaluateFeatureFlagsDeterministic(
        scenario.featureFlags,
        scenario.traffic.syntheticIdentities,
        nowMs
      );

      const activeDeployments = Object.values(deployments).filter(
        (d) =>
          d.state !== "COMPLETED" &&
          d.state !== "ROLLED_BACK" &&
          d.state !== "FAILED" &&
          d.state !== "CANCELLED"
      ).length;

      const caveats: string[] = [
        "Configured traffic weights govern routing probability; finite sample counts may cause observed request shares to differ slightly.",
        "Small canary sample sizes increase statistical variance; passing gates do not prove production safety.",
        "Application rollback restores code & traffic weights but does not undo irreversible data mutations.",
      ];

      return {
        virtualTimeMs: nowMs,
        deployments: JSON.parse(JSON.stringify(deployments)),
        revisions: { ...revisions },
        replicas: JSON.parse(JSON.stringify(replicas)),
        recentProbes: recentProbes.slice(-30),
        trafficAllocations: JSON.parse(JSON.stringify(allocations)),
        revisionStats: revStats,
        featureFlags,
        incidents: JSON.parse(JSON.stringify(incidents)),
        caveats,
        invariants,
        metrics: {
          virtualTimeMs: nowMs,
          activeDeployments,
          completedDeployments: Object.values(deployments).filter(
            (d) => d.state === "COMPLETED"
          ).length,
          rolledBackDeployments: Object.values(deployments).filter(
            (d) => d.state === "ROLLED_BACK"
          ).length,
          failedDeployments: Object.values(deployments).filter(
            (d) => d.state === "FAILED"
          ).length,
          totalReplicas: totalReplicasList.length,
          readyReplicas: readyReplicasList.length,
          unreadyReplicas: totalReplicasList.length - readyReplicasList.length,
          restartsTriggered,
          totalRequests: totalReqsAll,
          totalErrors: Object.values(revErrors).reduce((a, b) => a + b, 0),
          candidateErrorRate: candStats?.errorRate ?? 0,
          stableErrorRate: stabStats?.errorRate ?? 0,
          candidateP95Ms: candStats?.p95LatencyMs ?? 0,
          stableP95Ms: stabStats?.p95LatencyMs ?? 0,
          gatesPassed: allGates.filter((g) => g.outcome === "PASS").length,
          gatesFailed: allGates.filter((g) => g.outcome === "FAIL").length,
          gatesInconclusiveOrNoData: allGates.filter(
            (g) => g.outcome === "INCONCLUSIVE" || g.outcome === "NO_DATA"
          ).length,
          deploymentDurationMs:
            deploymentStartedAt !== null && deploymentCompletedAt !== null
              ? Math.max(0, deploymentCompletedAt - deploymentStartedAt)
              : null,
          rollbackDurationMs:
            rollbackStartedAt !== null && rollbackCompletedAt !== null
              ? Math.max(0, rollbackCompletedAt - rollbackStartedAt)
              : null,
        },
      };
    };

    const emitFrame = (
      nowMs: number,
      summary: string,
      activeNodeIds: string[],
      eventPayload: Record<string, unknown>
    ) => {
      if (allEvents.length >= scenario.limits.maxEvents) return;
      const evt = {
        id: `dep_evt_${++seq}`,
        sequence: seq,
        atMs: nowMs,
        durationMs: 5,
        ...eventPayload,
      } as unknown as ExecutionTrace["events"][number];
      allEvents.push(evt);
      const cloned = RuntimeStateHelper.cloneState(baseRuntime);
      cloned.deploymentState = buildSnapshot(nowMs);
      frames.push({
        frameIndex: frames.length,
        virtualTimeMs: nowMs,
        activeNodeIds: Array.from(new Set(activeNodeIds)),
        activeEdgeIds: [],
        activeEvent: { ...evt, explanation: summary },
        direction: "request",
        stepTitle: String(eventPayload.type ?? "Deployment Step"),
        stepExplanation: summary,
        runtimeState: cloned,
      });
    };

    const lastEmittedGateSig: Record<string, string> = {};

    emitFrame(0, `Deployment scenario initialized (${scenario.label})`, [], {
      type: "deployment.created",
      deploymentId: scenario.deployments[0]!.id,
      serviceId: scenario.deployments[0]!.serviceId,
      strategy: scenario.deployments[0]!.strategy,
      explanation: scenario.label,
    });

    const triggerRollback = (
      dCfg: DeploymentConfig,
      dep: DeploymentRuntimeInstance,
      nowMs: number,
      reason: string
    ) => {
      if (
        dep.state === "ROLLING_BACK" ||
        dep.state === "ROLLED_BACK" ||
        dep.rollback.state === "FAILED"
      ) {
        return;
      }
      if (rollbackStartedAt === null) rollbackStartedAt = nowMs;

      const prevRev = revisions[dep.stableRevisionId];
      const rollbackFailFault = scenario.faults.some(
        (f) => f.atMs <= nowMs && f.type === "rollback_failure"
      );
      const incompatibleDb =
        dCfg.migrationPlan?.mode === "incompatible_destructive" ||
        dCfg.migrationPlan?.rollbackCompatible === false;

      dep.rollback = {
        state: "REQUESTED",
        reason,
        fromRevisionId: dep.candidateRevisionId,
        toRevisionId: dep.stableRevisionId,
        requestedAtMs: nowMs,
        irreversibleDataWarning: Boolean(
          dCfg.migrationPlan?.irreversibleMutation
        ),
      };
      dep.timeline.push({ atMs: nowMs, kind: "rollback_requested", summary: reason });

      emitFrame(nowMs, `Rollback requested on '${dep.id}': ${reason}`, [dep.serviceId], {
        type: "deployment.rollback.requested",
        deploymentId: dep.id,
        reason,
        explanation: reason,
      });

      if (!prevRev || !prevRev.available || rollbackFailFault || incompatibleDb) {
        dep.rollback.state = "FAILED";
        dep.rollback.failureReason = !prevRev?.available
          ? "Previous revision is unavailable or capacity was destroyed."
          : incompatibleDb
            ? "Rollback blocked: incompatible or irreversible database schema change."
            : "Simulated rollback verification failure.";
        dep.state = "FAILED";
        dep.timeline.push({
          atMs: nowMs,
          kind: "rollback_failed",
          summary: dep.rollback.failureReason,
        });
        emitFrame(
          nowMs,
          `Rollback FAILED on '${dep.id}': ${dep.rollback.failureReason}`,
          [dep.serviceId],
          {
            type: "deployment.rollback.failed",
            deploymentId: dep.id,
            reason: dep.rollback.failureReason,
            explanation: dep.rollback.failureReason,
          }
        );
        return;
      }

      // Restore stable routing & mark candidate replicas terminating cleanly
      dep.state = "ROLLING_BACK";
      dep.rollback.state = "ROUTING_REVERTING";
      dep.targetCandidateWeightPct = 0;
      allocations[dep.serviceId] = {
        serviceId: dep.serviceId,
        weights: [
          { revisionId: dep.stableRevisionId, percentage: 100 },
          { revisionId: dep.candidateRevisionId, percentage: 0 },
        ],
        noHealthyEndpoints: false,
      };
      if (dep.strategy === "blue_green") {
        dep.activeEnvironment = "blue";
      }
      for (const rep of Object.values(replicas)) {
        if (rep.revisionId === dep.candidateRevisionId && rep.state !== "TERMINATED") {
          rep.state = "TERMINATING";
          rep.drainingStartedAtMs = nowMs;
          rep.readinessPassed = false;
        } else if (rep.revisionId === dep.stableRevisionId && rep.state === "TERMINATED") {
          rep.state = "READY";
          rep.readinessPassed = true;
        }
      }

      // Restore missing stable replicas if recreate/rolling terminated some
      const curStable = Object.values(replicas).filter(
        (r) =>
          r.revisionId === dep.stableRevisionId &&
          r.state !== "TERMINATED" &&
          r.state !== "TERMINATING"
      ).length;
      if (curStable < dep.desiredReplicas) {
        addReplicasForRevision(
          dep.serviceId,
          dep.stableRevisionId,
          dCfg.regions[0] ?? "us-east-1",
          dep.desiredReplicas - curStable,
          true,
          nowMs,
          dCfg.clusterCapacityUnits * 2
        );
      }

      dep.rollback.state = "COMPLETED";
      dep.rollback.completedAtMs = nowMs;
      rollbackCompletedAt = nowMs;
      dep.state = "ROLLED_BACK";
      dep.timeline.push({
        atMs: nowMs,
        kind: "rollback_completed",
        summary: `Traffic restored 100% to '${dep.stableRevisionId}'`,
      });
      if (incidents[0]) {
        incidents[0].status = "resolved";
        incidents[0].resolvedAtMs = nowMs;
      }

      emitFrame(
        nowMs,
        `Rollback completed on '${dep.id}': 100% traffic restored to ${dep.stableRevisionId}`,
        [dep.serviceId],
        {
          type: "deployment.rollback.completed",
          deploymentId: dep.id,
          toRevisionId: dep.stableRevisionId,
          explanation: `Rolled back cleanly to ${dep.stableRevisionId}.`,
        }
      );
    };

    for (const nowMs of ticks) {
      const activeFaults = scenario.faults.filter(
        (f) =>
          f.atMs <= nowMs &&
          (f.durationMs === undefined || nowMs <= f.atMs + f.durationMs)
      );

      // 1. Operator commands at nowMs
      for (const cmd of scenario.commands) {
        if (cmd.atMs !== nowMs) continue;
        const firstDepCfg = scenario.deployments[0]!;
        const dep = deployments[firstDepCfg.id]!;
        if (cmd.command === "pause") {
          dep.paused = true;
          dep.pauseReason = cmd.description;
          dep.state = "PAUSED";
          dep.timeline.push({ atMs: nowMs, kind: "paused", summary: cmd.description });
          emitFrame(nowMs, `Deployment '${dep.id}' paused`, [dep.serviceId], {
            type: "deployment.paused",
            deploymentId: dep.id,
            reason: cmd.description,
            explanation: cmd.description,
          });
        } else if (cmd.command === "resume") {
          dep.paused = false;
          dep.pauseReason = undefined;
          dep.state = "PROGRESSING";
          dep.stageStartedAtMs = nowMs;
          dep.timeline.push({ atMs: nowMs, kind: "resumed", summary: cmd.description });
          emitFrame(nowMs, `Deployment '${dep.id}' resumed`, [dep.serviceId], {
            type: "deployment.resumed",
            deploymentId: dep.id,
            explanation: cmd.description,
          });
        } else if (cmd.command === "cancel") {
          dep.state = "CANCELLED";
          dep.timeline.push({ atMs: nowMs, kind: "cancelled", summary: cmd.description });
          emitFrame(nowMs, `Deployment '${dep.id}' cancelled`, [dep.serviceId], {
            type: "deployment.cancelled",
            deploymentId: dep.id,
            explanation: cmd.description,
          });
        } else if (cmd.command === "approve_gate" && cmd.gateId) {
          manualApprovedGates.add(cmd.gateId);
        } else if (cmd.command === "manual_rollback") {
          triggerRollback(firstDepCfg, dep, nowMs, cmd.description);
        }
      }

      // 2. Replica probe & lifecycle progression
      const probeStep = stepReplicaLifecycleAndProbes({
        replicas: Object.values(replicas),
        revisions,
        faults: scenario.faults,
        nowMs,
      });
      recentProbes.push(...probeStep.probeResults);
      restartsTriggered += probeStep.restartsTriggered;
      for (const lm of probeStep.lifecycleMessages) {
        emitFrame(nowMs, lm.detail, [lm.replicaId], {
          type: lm.eventType,
          replicaId: lm.replicaId,
          revisionId: lm.revisionId,
          reason: lm.detail,
          explanation: lm.detail,
        });
      }

      // 3. Deployment state machine progression per service
      for (const dCfg of scenario.deployments) {
        const dep = deployments[dCfg.id]!;
        if (
          dep.state === "COMPLETED" ||
          dep.state === "ROLLED_BACK" ||
          dep.state === "FAILED" ||
          dep.state === "CANCELLED" ||
          dep.paused
        ) {
          continue;
        }

        // Wait on dependency deployments if configured
        const depsReady = dCfg.dependsOnDeploymentIds.every(
          (did) => deployments[did]?.state === "COMPLETED"
        );
        if (!depsReady) continue;

        // Check compatibility faults
        const compatFault = activeFaults.find(
          (f) =>
            f.type === "dependency_incompatibility" ||
            f.type === "migration_incompatibility" ||
            f.type === "event_schema_incompatibility"
        );
        if (compatFault) {
          dep.compatibilityStatus =
            compatFault.type === "dependency_incompatibility"
              ? "incompatible_api"
              : compatFault.type === "event_schema_incompatibility"
                ? "incompatible_event"
                : "incompatible_db";
          triggerRollback(dCfg, dep, nowMs, compatFault.description);
          continue;
        }

        if (dep.state === "CREATED") {
          if (deploymentStartedAt === null) deploymentStartedAt = nowMs;
          dep.state = "PROGRESSING";
          dep.stageStartedAtMs = nowMs;

          if (dCfg.strategy === "recreate") {
            // Recreate: terminate all stable replicas first before starting candidate
            for (const rep of Object.values(replicas)) {
              if (rep.revisionId === dep.stableRevisionId && rep.state !== "TERMINATED") {
                rep.state = "TERMINATING";
                rep.drainingStartedAtMs = nowMs;
                rep.readinessPassed = false;
              }
            }
            allocations[dep.serviceId] = {
              serviceId: dep.serviceId,
              weights: [
                { revisionId: dep.stableRevisionId, percentage: 0 },
                { revisionId: dep.candidateRevisionId, percentage: 100 },
              ],
              noHealthyEndpoints: true,
            };
          } else {
            // Spawn initial candidate replicas respecting budget & capacity
            const spawnCount =
              dCfg.strategy === "rolling_update"
                ? Math.max(1, dep.maxSurgeCount || 1)
                : dep.desiredReplicas;
            const spawned = addReplicasForRevision(
              dCfg.serviceId,
              dCfg.candidateRevisionId,
              dCfg.regions[0] ?? "us-east-1",
              Math.min(dep.desiredReplicas, spawnCount),
              false,
              nowMs,
              dCfg.clusterCapacityUnits
            );
            dep.pendingCapacityReplicas += spawned.pendingCapacity;
          }

          emitFrame(
            nowMs,
            `Started ${dCfg.strategy} rollout for '${dCfg.serviceId}' (${dCfg.stableRevisionId} -> ${dCfg.candidateRevisionId})`,
            [dCfg.serviceId],
            {
              type: "deployment.started",
              deploymentId: dep.id,
              strategy: dCfg.strategy,
              explanation: `Started ${dCfg.strategy} deployment.`,
            }
          );
        }

        // Count live replica states
        const liveAll = Object.values(replicas).filter(
          (r) => r.serviceId === dCfg.serviceId && r.state !== "TERMINATED"
        );
        const readyStable = liveAll.filter(
          (r) => r.revisionId === dep.stableRevisionId && r.state === "READY"
        );
        const readyCand = liveAll.filter(
          (r) => r.revisionId === dep.candidateRevisionId && r.state === "READY"
        );
        const termOrStartCand = liveAll.filter(
          (r) =>
            r.revisionId === dep.candidateRevisionId &&
            (r.state === "STARTING" ||
              r.state === "RUNNING_NOT_READY" ||
              r.state === "PENDING")
        );

        dep.readyStableReplicas = readyStable.length;
        dep.readyCandidateReplicas = readyCand.length;
        dep.availableReplicas = readyStable.length + readyCand.length;

        // Progress deadline check
        const capacityStalled = activeFaults.some(
          (f) => f.type === "insufficient_capacity"
        );
        if (
          (capacityStalled || termOrStartCand.some((r) => r.state === "PENDING")) &&
          dCfg.rollbackPolicy.autoRollbackOnProgressDeadline &&
          nowMs - dep.stageStartedAtMs > dCfg.rollbackPolicy.progressDeadlineMs
        ) {
          triggerRollback(
            dCfg,
            dep,
            nowMs,
            "Progress deadline exceeded due to insufficient capacity / unready candidate replicas."
          );
          continue;
        }

        // Health auto-rollback when candidate crash loops or liveness fails
        const failedCand = liveAll.filter(
          (r) => r.revisionId === dep.candidateRevisionId && r.state === "FAILED"
        );
        if (
          failedCand.length > 0 &&
          dCfg.rollbackPolicy.autoRollbackOnHealthFail &&
          failedCand.some((r) => r.restartCount >= 2)
        ) {
          incidents.push({
            id: `dep_inc_${incidents.length + 1}`,
            deploymentId: dep.id,
            severity: "sev1",
            status: "mitigating",
            detectedAtMs: nowMs,
            correlatedRevisionId: dep.candidateRevisionId,
            causalStatus: "verified_simulated_causal",
            summary: `Candidate '${dep.candidateRevisionId}' crash-looped (${failedCand[0]!.restartCount} restarts).`,
            evidence: [
              {
                atMs: nowMs,
                source: "liveness_crash_loop",
                detail: `Replica ${failedCand[0]!.id} restarted repeatedly.`,
              },
            ],
          });
          triggerRollback(
            dCfg,
            dep,
            nowMs,
            `Candidate replicas failed startup/liveness probes (CrashLoopBackOff).`
          );
          continue;
        }

        // Strategy-specific progression once candidate replicas become READY
        if (dCfg.strategy === "recreate") {
          const stableTerminated = Object.values(replicas)
            .filter((r) => r.revisionId === dep.stableRevisionId)
            .every((r) => r.state === "TERMINATED");
          if (
            stableTerminated &&
            liveAll.filter((r) => r.revisionId === dep.candidateRevisionId).length === 0
          ) {
            addReplicasForRevision(
              dCfg.serviceId,
              dCfg.candidateRevisionId,
              dCfg.regions[0] ?? "us-east-1",
              dep.desiredReplicas,
              false,
              nowMs,
              dCfg.clusterCapacityUnits
            );
          }
          if (readyCand.length >= dep.desiredReplicas) {
            allocations[dCfg.serviceId] = {
              serviceId: dCfg.serviceId,
              weights: [
                { revisionId: dep.stableRevisionId, percentage: 0 },
                { revisionId: dep.candidateRevisionId, percentage: 100 },
              ],
              noHealthyEndpoints: false,
            };
            dep.targetCandidateWeightPct = 100;
            dep.state = "COMPLETED";
            deploymentCompletedAt = nowMs;
            emitFrame(
              nowMs,
              `Recreate deployment completed on '${dCfg.serviceId}' after old revision termination.`,
              [dCfg.serviceId],
              {
                type: "deployment.completed",
                deploymentId: dep.id,
                activeRevisionId: dep.candidateRevisionId,
                explanation: "Recreate rollout completed.",
              }
            );
          }
        } else if (dCfg.strategy === "rolling_update") {
          const curCandCount = liveAll.filter(
            (r) =>
              r.revisionId === dep.candidateRevisionId &&
              r.state !== "TERMINATING"
          ).length;

          // Retire stable replicas only as candidate replicas become READY within maxUnavailable
          const minAvail = Math.max(0, dep.desiredReplicas - dep.maxUnavailableCount);
          const removableStable = Math.max(
            0,
            dep.availableReplicas - minAvail
          );
          if (removableStable > 0 && readyStable.length > 0 && readyCand.length > 0) {
            const toRetire = Math.min(readyStable.length, removableStable);
            for (let i = 0; i < toRetire; i++) {
              const sRep = readyStable[i]!;
              sRep.state = "TERMINATING";
              sRep.drainingStartedAtMs = nowMs;
              sRep.readinessPassed = false;
            }
          }

          // Surge new candidate replicas respecting maxTotal = desired + maxSurge
          const nonTermCount = liveAll.filter(
            (r) => r.state !== "TERMINATING" && r.state !== "FAILED"
          ).length;
          const headroom = Math.max(
            0,
            dep.desiredReplicas + dep.maxSurgeCount - nonTermCount
          );
          const neededCand = Math.max(0, dep.desiredReplicas - curCandCount);
          if (headroom > 0 && neededCand > 0 && !capacityStalled) {
            const spawned = addReplicasForRevision(
              dCfg.serviceId,
              dCfg.candidateRevisionId,
              dCfg.regions[0] ?? "us-east-1",
              Math.min(headroom, neededCand),
              false,
              nowMs,
              dCfg.clusterCapacityUnits
            );
            dep.pendingCapacityReplicas += spawned.pendingCapacity;
          }

          const updatedReadyStable = Object.values(replicas).filter(
            (r) => r.revisionId === dep.stableRevisionId && r.state === "READY"
          ).length;
          const totalReady = updatedReadyStable + readyCand.length;
          const candPct =
            totalReady > 0 ? Math.round((readyCand.length / totalReady) * 100) : 0;
          dep.targetCandidateWeightPct = candPct;
          allocations[dCfg.serviceId] = {
            serviceId: dCfg.serviceId,
            weights: [
              { revisionId: dep.stableRevisionId, percentage: 100 - candPct },
              { revisionId: dep.candidateRevisionId, percentage: candPct },
            ],
            noHealthyEndpoints: totalReady === 0,
          };

          if (readyCand.length >= dep.desiredReplicas && updatedReadyStable === 0) {
            dep.state = "COMPLETED";
            deploymentCompletedAt = nowMs;
            emitFrame(
              nowMs,
              `Rolling update completed for '${dCfg.serviceId}' (${dep.desiredReplicas}/${dep.desiredReplicas} ${dep.candidateRevisionId} READY).`,
              [dCfg.serviceId],
              {
                type: "deployment.completed",
                deploymentId: dep.id,
                activeRevisionId: dep.candidateRevisionId,
                explanation: "Rolling update finished within surge/unavailable budgets.",
              }
            );
          }
        } else if (dCfg.strategy === "blue_green") {
          if (
            readyCand.length >= dep.desiredReplicas &&
            dep.activeEnvironment === "blue"
          ) {
            dep.activeEnvironment = "green";
            dep.targetCandidateWeightPct = 100;
            allocations[dCfg.serviceId] = {
              serviceId: dCfg.serviceId,
              weights: [
                { revisionId: dep.stableRevisionId, percentage: 0 },
                { revisionId: dep.candidateRevisionId, percentage: 100 },
              ],
              noHealthyEndpoints: false,
            };
            dep.timeline.push({
              atMs: nowMs,
              kind: "blue_green_switch",
              summary: "Green passed readiness; active routing switched 100% to Green.",
            });
            emitFrame(
              nowMs,
              `Blue-Green cutover: traffic switched to Green (${dep.candidateRevisionId})`,
              [dCfg.serviceId],
              {
                type: "deployment.traffic.shifted",
                deploymentId: dep.id,
                serviceId: dCfg.serviceId,
                candidateWeightPct: 100,
                explanation: "Switched routing from Blue to verified Green environment.",
              }
            );
          } else if (
            dep.activeEnvironment === "green" &&
            nowMs >= dep.stageStartedAtMs + 160
          ) {
            dep.state = "COMPLETED";
            deploymentCompletedAt = nowMs;
            emitFrame(
              nowMs,
              `Blue-Green deployment completed (Blue retained on standby=${dCfg.rollbackPolicy.preserveOldRevisionAfterBlueGreen})`,
              [dCfg.serviceId],
              {
                type: "deployment.completed",
                deploymentId: dep.id,
                activeRevisionId: dep.candidateRevisionId,
                explanation: "Blue-Green deployment verified and completed.",
              }
            );
          }
        } else {
          // Canary / Progressive Delivery / Regional / Feature Flag Rollout
          const activeStage = dCfg.stages[dep.currentStageIndex];
          if (activeStage && readyCand.length > 0) {
            if (dep.targetCandidateWeightPct !== activeStage.targetWeightPercent) {
              const propDelay = activeFaults.some(
                (f) => f.type === "routing_propagation_delay"
              )
                ? 100
                : dCfg.routingPropagationDelayMs;
              dep.targetCandidateWeightPct = activeStage.targetWeightPercent;
              allocations[dCfg.serviceId] = {
                serviceId: dCfg.serviceId,
                weights: [
                  {
                    revisionId: dep.stableRevisionId,
                    percentage: 100 - activeStage.targetWeightPercent,
                  },
                  {
                    revisionId: dep.candidateRevisionId,
                    percentage: activeStage.targetWeightPercent,
                  },
                ],
                noHealthyEndpoints: false,
                propagationPendingUntilMs:
                  propDelay > 0 ? nowMs + propDelay : undefined,
              };
              emitFrame(
                nowMs,
                `Shifted candidate traffic weight to ${activeStage.targetWeightPercent}% (${activeStage.id})`,
                [dCfg.serviceId],
                {
                  type: "deployment.traffic.shifted",
                  deploymentId: dep.id,
                  serviceId: dCfg.serviceId,
                  candidateWeightPct: activeStage.targetWeightPercent,
                  explanation: `Stage ${activeStage.id} traffic allocation active.`,
                }
              );
            }
          }
        }
      }

      // 4. Generate synthetic traffic routed strictly through READY replicas & allocations
      const intervalMs = Math.max(
        15,
        Math.round(1000 / scenario.traffic.requestsPerSecond)
      );
      const batchCount = Math.max(1, Math.round(stepMs / intervalMs));

      for (const dCfg of scenario.deployments) {
        const alloc = allocations[dCfg.serviceId];
        if (!alloc || alloc.noHealthyEndpoints) continue;
        if (
          alloc.propagationPendingUntilMs !== undefined &&
          nowMs < alloc.propagationPendingUntilMs
        ) {
          continue;
        }

        const readyCand = Object.values(replicas).filter(
          (r) =>
            r.revisionId === dCfg.candidateRevisionId && r.state === "READY"
        );
        const readyStab = Object.values(replicas).filter(
          (r) => r.revisionId === dCfg.stableRevisionId && r.state === "READY"
        );
        if (readyCand.length + readyStab.length === 0) continue;

        const candWeight =
          alloc.weights.find((w) => w.revisionId === dCfg.candidateRevisionId)
            ?.percentage ?? 0;

        for (let b = 0; b < batchCount; b++) {
          const chooseCand =
            readyCand.length > 0 &&
            (readyStab.length === 0 || rng.next() * 100 < candWeight);
          const targetRevId = chooseCand
            ? dCfg.candidateRevisionId
            : dCfg.stableRevisionId;
          const targetPool = chooseCand ? readyCand : readyStab;
          const chosenRep = targetPool[b % targetPool.length]!;
          if (chosenRep.state !== "READY") {
            routedUnreadyCount += 1;
            continue;
          }

          const rev = revisions[targetRevId]!;
          const revFaults = activeFaults.filter(
            (f) =>
              (!f.targetRevisionId || f.targetRevisionId === targetRevId) &&
              (f.type === "latency_regression" ||
                f.type === "error_rate_regression")
          );
          const extraLat = revFaults
            .filter((f) => f.type === "latency_regression")
            .reduce((acc, f) => acc + (f.latencyMs ?? 240), 0);
          const errRate = revFaults.some((f) => f.type === "error_rate_regression")
            ? revFaults.find((f) => f.type === "error_rate_regression")?.errorRate ?? 0.25
            : rev.baseErrorRate;

          const latMs = Math.round(
            rev.baseLatencyMs + extraLat + rng.next() * 18
          );
          const failed = rng.next() < errRate;
          revLatencies[targetRevId]!.push(latMs);
          revRequests[targetRevId] = (revRequests[targetRevId] ?? 0) + 1;
          if (failed) {
            revErrors[targetRevId] = (revErrors[targetRevId] ?? 0) + 1;
          }
        }
      }

      // 5. Evaluate Canary / Progressive Delivery Promotion Gates & Advance Stages
      const telemetryLost = activeFaults.some((f) => f.type === "telemetry_loss");
      for (const dCfg of scenario.deployments) {
        const dep = deployments[dCfg.id]!;
        if (
          dep.state !== "PROGRESSING" ||
          dep.paused ||
          dCfg.stages.length === 0
        ) {
          continue;
        }
        const stage = dCfg.stages[dep.currentStageIndex];
        if (!stage) continue;

        const candStats = computeRevisionStats({
          revisionId: dep.candidateRevisionId,
          version: revisions[dep.candidateRevisionId]?.version ?? "v2",
          latenciesMs: revLatencies[dep.candidateRevisionId] ?? [],
          errors: revErrors[dep.candidateRevisionId] ?? 0,
          saturationPct:
            revisions[dep.candidateRevisionId]?.baseSaturationPct ?? 40,
          totalServiceRequests:
            (revRequests[dep.candidateRevisionId] ?? 0) +
            (revRequests[dep.stableRevisionId] ?? 0),
        });
        const stabStats = computeRevisionStats({
          revisionId: dep.stableRevisionId,
          version: revisions[dep.stableRevisionId]?.version ?? "v1",
          latenciesMs: revLatencies[dep.stableRevisionId] ?? [],
          errors: revErrors[dep.stableRevisionId] ?? 0,
          saturationPct: revisions[dep.stableRevisionId]?.baseSaturationPct ?? 35,
          totalServiceRequests:
            (revRequests[dep.candidateRevisionId] ?? 0) +
            (revRequests[dep.stableRevisionId] ?? 0),
        });

        const stageGates = dCfg.gates.filter(
          (g) =>
            stage.promotionGateIds.length === 0 ||
            stage.promotionGateIds.includes(g.id)
        );
        const evals = stageGates.map((g) => {
          const gEffective = manualApprovedGates.has(g.id)
            ? { ...g, manualApproved: true }
            : g;
          const res = evaluatePromotionGate({
            gate: gEffective,
            serviceId: dCfg.serviceId,
            candidateStats: candStats,
            stableStats: stabStats,
            minRequiredSamples: stage.minimumEligibleRequests,
            stageElapsedMs: nowMs - dep.stageStartedAtMs,
            minDurationMs: stage.minimumDurationMs,
            telemetryLost,
            previousConsecutivePasses: consecutivePassesByGate[g.id] ?? 0,
            nowMs,
          });
          consecutivePassesByGate[g.id] = res.consecutivePasses;
          return res;
        });

        if (evals.length > 0) {
          dep.gateEvaluations = evals;
        }

        const anyFail = evals.some((e) => e.outcome === "FAIL");
        if (!anyFail && evals.length > 0) {
          const sig = evals.map((e) => `${e.gateId}:${e.outcome}`).join("|");
          if (
            lastEmittedGateSig[dep.id] !== sig &&
            evals.some((e) => e.outcome === "NO_DATA" || e.outcome === "INCONCLUSIVE")
          ) {
            lastEmittedGateSig[dep.id] = sig;
            const heldGate = evals.find(
              (e) => e.outcome === "NO_DATA" || e.outcome === "INCONCLUSIVE"
            )!;
            emitFrame(
              nowMs,
              `Promotion gate held (${heldGate.outcome}) on '${dep.id}': ${heldGate.explanation}`,
              [dCfg.serviceId],
              {
                type: "deployment.gate.evaluated",
                deploymentId: dep.id,
                gateId: heldGate.gateId,
                outcome: heldGate.outcome,
                explanation: heldGate.explanation,
              }
            );
          }
        }
        if (anyFail) {
          const failGate = evals.find((e) => e.outcome === "FAIL")!;
          incidents.push({
            id: `dep_inc_${incidents.length + 1}`,
            deploymentId: dep.id,
            severity: "sev1",
            status: "mitigating",
            detectedAtMs: nowMs,
            correlatedRevisionId: dep.candidateRevisionId,
            causalStatus: "verified_simulated_causal",
            summary: `Promotion gate '${failGate.gateName}' failed: ${failGate.explanation}`,
            evidence: [
              {
                atMs: nowMs,
                source: "gate_failure",
                detail: failGate.explanation,
              },
            ],
          });
          emitFrame(
            nowMs,
            `Promotion gate FAILED on '${dep.id}': ${failGate.gateName}`,
            [dCfg.serviceId],
            {
              type: "deployment.gate.evaluated",
              deploymentId: dep.id,
              gateId: failGate.gateId,
              outcome: "FAIL",
              explanation: failGate.explanation,
            }
          );

          if (dCfg.rollbackPolicy.autoRollbackOnGateFail) {
            triggerRollback(dCfg, dep, nowMs, failGate.explanation);
          } else {
            dep.paused = true;
            dep.state = "PAUSED";
            dep.pauseReason = `Held after gate failure: ${failGate.gateName}`;
          }
          continue;
        }

        const allPassedRequired =
          evals.length === 0
            ? nowMs - dep.stageStartedAtMs >= stage.minimumDurationMs &&
              candStats.requests >= stage.minimumEligibleRequests
            : evals.every((e, idx) => {
                const reqConsec = stageGates[idx]?.consecutiveRequired ?? 1;
                return e.outcome === "PASS" && e.consecutivePasses >= reqConsec;
              });

        if (allPassedRequired) {
          if (dep.currentStageIndex + 1 < dCfg.stages.length) {
            dep.currentStageIndex += 1;
            dep.currentStageId = dCfg.stages[dep.currentStageIndex]!.id;
            dep.stageStartedAtMs = nowMs;
            const nextW = dCfg.stages[dep.currentStageIndex]!.targetWeightPercent;
            dep.targetCandidateWeightPct = nextW;
            allocations[dCfg.serviceId] = {
              serviceId: dCfg.serviceId,
              weights: [
                { revisionId: dep.stableRevisionId, percentage: 100 - nextW },
                { revisionId: dep.candidateRevisionId, percentage: nextW },
              ],
              noHealthyEndpoints: false,
            };
            dep.timeline.push({
              atMs: nowMs,
              kind: "stage_promoted",
              summary: `Promoted to stage ${dep.currentStageId} (${nextW}%)`,
            });
            emitFrame(
              nowMs,
              `Promoted '${dep.serviceId}' to stage ${dep.currentStageId} (${nextW}% candidate traffic)`,
              [dCfg.serviceId],
              {
                type: "deployment.stage.promoted",
                deploymentId: dep.id,
                stageId: dep.currentStageId,
                newWeightPct: nextW,
                explanation: `All gates passed; promoted to ${nextW}%.`,
              }
            );
          } else {
            // Final stage passed -> promote to 100% & complete
            allocations[dCfg.serviceId] = {
              serviceId: dCfg.serviceId,
              weights: [
                { revisionId: dep.stableRevisionId, percentage: 0 },
                { revisionId: dep.candidateRevisionId, percentage: 100 },
              ],
              noHealthyEndpoints: false,
            };
            dep.targetCandidateWeightPct = 100;
            dep.state = "COMPLETED";
            deploymentCompletedAt = nowMs;
            dep.timeline.push({
              atMs: nowMs,
              kind: "completed",
              summary: `Candidate '${dep.candidateRevisionId}' promoted to 100%`,
            });
            emitFrame(
              nowMs,
              `Deployment '${dep.id}' completed (100% traffic on ${dep.candidateRevisionId})`,
              [dCfg.serviceId],
              {
                type: "deployment.completed",
                deploymentId: dep.id,
                activeRevisionId: dep.candidateRevisionId,
                explanation: "All progressive delivery stages verified and promoted.",
              }
            );
          }
        }
      }
    }

    const totalDur = Math.max(100, ticks[ticks.length - 1] ?? 100);
    const lastDepState = frames[frames.length - 1]?.runtimeState?.deploymentState;
    const failedInv = lastDepState?.invariants.allPassed === false;

    const configuration: ExecutionConfiguration = {
      version: 1,
      entryNodeId: scenario.services[0]?.id ?? "checkout",
      request: {
        id: `dep_req_${scenario.id}`,
        method: "POST",
        path: "/deploy",
        headers: {},
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxEvents: scenario.limits.maxEvents,
        maxHops: 100,
        maxDurationMs: scenario.limits.maxVirtualDurationMs,
      },
      timing: {
        nodeDurationMs: 15,
        edgeDurationMs: 10,
      },
      presetId: scenario.presetId ?? "custom",
    };

    return {
      runId: `dep_run_${scenario.id}_${scenario.seed}`,
      architectureId: "arch_deployment_sim",
      architectureRevisionId: scenario.architectureRevisionId,
      snapshotHash: `dep_${scenario.id}_${frames.length}`,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: scenario.services.map((s) => s.id),
      traversedEdgeIds: [],
      configuration,
      events: allEvents,
      totalDurationMs: totalDur,
      totalEvents: allEvents.length,
      totalHops: Object.keys(replicas).length + allEvents.length,
      outcome: failedInv ? "failure" : "success",
      terminalReason: failedInv
        ? lastDepState?.invariants.violations.join("; ")
        : `Deployment simulation finished at ${totalDur}ms (${frames.length} snapshots).`,
      frames,
    };
  }
}
