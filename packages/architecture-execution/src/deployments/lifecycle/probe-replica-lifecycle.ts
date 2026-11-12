import { RollingUpdateEngine } from "../../kubernetes/rollout/rolling-update-engine";
import { ProbeSimulator } from "../../kubernetes/runtime/probe-simulator";
import type {
  ApplicationRevision,
  DeploymentFaultConfig,
  DeployProbeResult,
  DeployReplicaRuntime,
} from "../deployment-schemas";

export function resolveDeploymentBudgets(
  desiredReplicas: number,
  maxSurge: number | string,
  maxUnavailable: number | string
) {
  return RollingUpdateEngine.resolveSurgeAndUnavailable(
    desiredReplicas,
    maxSurge,
    maxUnavailable
  );
}

export function stepReplicaLifecycleAndProbes(params: {
  replicas: DeployReplicaRuntime[];
  revisions: Record<string, ApplicationRevision>;
  faults: DeploymentFaultConfig[];
  nowMs: number;
}): {
  probeResults: DeployProbeResult[];
  restartsTriggered: number;
  lifecycleMessages: Array<{ replicaId: string; revisionId: string; eventType: "deployment.replica.started" | "deployment.replica.ready" | "deployment.replica.unready" | "deployment.replica.failed"; detail: string }>;
} {
  const { replicas, revisions, faults, nowMs } = params;
  const probeResults: DeployProbeResult[] = [];
  const lifecycleMessages: Array<{
    replicaId: string;
    revisionId: string;
    eventType:
      | "deployment.replica.started"
      | "deployment.replica.ready"
      | "deployment.replica.unready"
      | "deployment.replica.failed";
    detail: string;
  }> = [];
  let restartsTriggered = 0;

  const activeFaults = faults.filter(
    (f) =>
      f.atMs <= nowMs &&
      (f.durationMs === undefined || nowMs <= f.atMs + f.durationMs)
  );

  for (const rep of replicas) {
    if (rep.state === "TERMINATED") continue;

    const rev = revisions[rep.revisionId];
    if (!rev) continue;

    const revFaults = activeFaults.filter(
      (f) =>
        (!f.targetRevisionId || f.targetRevisionId === rep.revisionId) &&
        (!f.targetRegion || f.targetRegion === rep.region)
    );
    const hasStartupFail = revFaults.some(
      (f) =>
        f.type === "replica_startup_failure" ||
        f.type === "image_pull_failure" ||
        f.type === "crash_loop"
    );
    const hasReadinessFail = revFaults.some(
      (f) => f.type === "readiness_failure" || f.type === "region_failure"
    );
    const hasLivenessFail = revFaults.some((f) => f.type === "liveness_failure");

    // Draining / Terminating transition
    if (rep.state === "TERMINATING") {
      const graceEnd = (rep.drainingStartedAtMs ?? nowMs) + rev.drainingGraceMs;
      if (rep.activeRequests > 0 && nowMs < graceEnd) {
        rep.activeRequests = Math.max(0, rep.activeRequests - 1);
      } else if (nowMs >= graceEnd) {
        rep.activeRequests = 0;
        rep.longLivedSessions = 0;
        rep.state = "TERMINATED";
      }
      continue;
    }

    // Backoff restart recovery
    if (rep.state === "FAILED") {
      if (rep.nextRestartAtMs !== undefined && nowMs >= rep.nextRestartAtMs && !hasStartupFail) {
        rep.state = "STARTING";
        rep.startedAtMs = nowMs;
        rep.consecutiveLivenessFailures = 0;
        rep.consecutiveReadinessFailures = 0;
        rep.readinessPassed = false;
        rep.startupPassed = false;
        lifecycleMessages.push({
          replicaId: rep.id,
          revisionId: rep.revisionId,
          eventType: "deployment.replica.started",
          detail: `Replica ${rep.id} restarting after backoff (#${rep.restartCount}).`,
        });
      }
      continue;
    }

    if (rep.state === "PENDING" || rep.state === "SCHEDULING") {
      rep.state = "STARTING";
      rep.startedAtMs = nowMs;
      lifecycleMessages.push({
        replicaId: rep.id,
        revisionId: rep.revisionId,
        eventType: "deployment.replica.started",
        detail: `Replica ${rep.id} started on ${rep.nodeId}.`,
      });
    }

    // Startup probe & crash loop check
    if (rep.state === "STARTING") {
      if (hasStartupFail) {
        rep.restartCount += 1;
        restartsTriggered += 1;
        rep.nextRestartAtMs =
          nowMs + ProbeSimulator.computeCrashLoopBackOffMs(rep.restartCount);
        rep.state = "FAILED";
        rep.startupPassed = false;
        probeResults.push({
          id: `pr_start_${rep.id}_${nowMs}`,
          atMs: nowMs,
          replicaId: rep.id,
          probeType: "startup",
          passed: false,
          consecutiveSuccesses: 0,
          consecutiveFailures: rep.restartCount,
          transitionNote: `CrashLoopBackOff (${rep.nextRestartAtMs - nowMs}ms backoff)`,
        });
        lifecycleMessages.push({
          replicaId: rep.id,
          revisionId: rep.revisionId,
          eventType: "deployment.replica.failed",
          detail: `Replica ${rep.id} failed startup (restart #${rep.restartCount}, backoff applied).`,
        });
        continue;
      }

      if (nowMs >= rep.startedAtMs + rev.startupDurationMs) {
        rep.startupPassed = true;
        rep.state = "RUNNING_NOT_READY";
        probeResults.push({
          id: `pr_start_ok_${rep.id}_${nowMs}`,
          atMs: nowMs,
          replicaId: rep.id,
          probeType: "startup",
          passed: true,
          consecutiveSuccesses: 1,
          consecutiveFailures: 0,
          transitionNote: "Startup probe passed; awaiting readiness.",
        });
      } else {
        continue;
      }
    }

    // Liveness probe (triggers restart consequence if threshold reached)
    if (rep.state === "RUNNING_NOT_READY" || rep.state === "READY") {
      if (hasLivenessFail) {
        rep.consecutiveLivenessFailures += 1;
        rep.livenessPassed = false;
        probeResults.push({
          id: `pr_live_fail_${rep.id}_${nowMs}`,
          atMs: nowMs,
          replicaId: rep.id,
          probeType: "liveness",
          passed: false,
          consecutiveSuccesses: 0,
          consecutiveFailures: rep.consecutiveLivenessFailures,
          transitionNote:
            rep.consecutiveLivenessFailures >= rev.livenessProbe.failureThreshold
              ? "Liveness failure threshold exceeded -> triggering container restart."
              : "Liveness probe failed.",
        });
        if (rep.consecutiveLivenessFailures >= rev.livenessProbe.failureThreshold) {
          rep.restartCount += 1;
          restartsTriggered += 1;
          rep.readinessPassed = false;
          rep.state = "FAILED";
          rep.nextRestartAtMs =
            nowMs + ProbeSimulator.computeCrashLoopBackOffMs(rep.restartCount);
          lifecycleMessages.push({
            replicaId: rep.id,
            revisionId: rep.revisionId,
            eventType: "deployment.replica.failed",
            detail: `Liveness failure restarted replica ${rep.id} (#${rep.restartCount}).`,
          });
          continue;
        }
      } else {
        rep.consecutiveLivenessFailures = 0;
        rep.livenessPassed = true;
      }

      // Readiness probe (determines routing eligibility without restarting container)
      if (hasReadinessFail) {
        rep.consecutiveReadinessFailures += 1;
        const wasReady = rep.readinessPassed || rep.state === "READY";
        rep.readinessPassed = false;
        rep.state = "RUNNING_NOT_READY";
        probeResults.push({
          id: `pr_ready_fail_${rep.id}_${nowMs}`,
          atMs: nowMs,
          replicaId: rep.id,
          probeType: "readiness",
          passed: false,
          consecutiveSuccesses: 0,
          consecutiveFailures: rep.consecutiveReadinessFailures,
          transitionNote: "Removed from routing endpoints (readiness=false).",
        });
        if (wasReady) {
          lifecycleMessages.push({
            replicaId: rep.id,
            revisionId: rep.revisionId,
            eventType: "deployment.replica.unready",
            detail: `Replica ${rep.id} readiness probe failed; excluded from active traffic.`,
          });
        }
      } else {
        const wasReady = rep.state === "READY";
        rep.consecutiveReadinessFailures = 0;
        rep.readinessPassed = true;
        rep.state = "READY";
        if (!wasReady) {
          rep.readyAtMs = nowMs;
          probeResults.push({
            id: `pr_ready_ok_${rep.id}_${nowMs}`,
            atMs: nowMs,
            replicaId: rep.id,
            probeType: "readiness",
            passed: true,
            consecutiveSuccesses: rev.readinessProbe.successThreshold,
            consecutiveFailures: 0,
            transitionNote: "Replica READY and eligible for routed traffic.",
          });
          lifecycleMessages.push({
            replicaId: rep.id,
            revisionId: rep.revisionId,
            eventType: "deployment.replica.ready",
            detail: `Replica ${rep.id} passed readiness probe.`,
          });
        }
      }
    }
  }

  return { probeResults, restartsTriggered, lifecycleMessages };
}

