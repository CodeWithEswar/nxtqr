import type {
  ExecutionConfiguration,
  ExecutionEvent,
  ExecutionTrace,
  VisualizationFrame,
} from "../index";
import { RuntimeStateHelper } from "../domain/runtime-state";
import {
  KubernetesScenarioSchema,
  type ClusterMetrics,
  type ClusterNode,
  type DeploymentConfiguration,
  type KubernetesScenario,
  type ModeledKubernetesRuntimeState,
  type Pod,
  type ReplicaSet,
  type SchedulerDecision,
  type ServiceRuntimeState,
} from "./kubernetes-schemas";
import { KubernetesPodScheduler } from "./scheduler/pod-scheduler";
import { RollingUpdateEngine } from "./rollout/rolling-update-engine";
import { HpaAutoscalingEngine } from "./autoscaling/hpa-engine";
import { ProbeSimulator } from "./runtime/probe-simulator";

export class KubernetesExecutionEngine {
  public static runScenario(rawScenario: KubernetesScenario): ExecutionTrace {
    const parsed = KubernetesScenarioSchema.parse(rawScenario);
    const baseRuntime = RuntimeStateHelper.createInitialState();

    // Clone nodes into runtime map
    const nodes: Record<string, ClusterNode> = {};
    for (const node of parsed.nodes) {
      nodes[node.id] = {
        ...node,
        allocatableCpuMillicores: node.allocatableCpuMillicores ?? node.cpuMillicores,
        allocatableMemoryMiB: node.allocatableMemoryMiB ?? node.memoryMiB,
        reservedCpuMillicores: 0,
        reservedMemoryMiB: 0,
        labels: { ...node.labels },
        taints: node.taints.map((t) => ({ ...t })),
        conditions: { ...node.conditions },
        scheduledPodIds: [],
      };
    }

    // Initialize deployments & initial ReplicaSets
    const deployments: ModeledKubernetesRuntimeState["deployments"] = {};
    const replicaSets: Record<string, ReplicaSet> = {};
    const rolloutHistory: ModeledKubernetesRuntimeState["rolloutHistory"] = {};
    const hpas: ModeledKubernetesRuntimeState["hpas"] = {};
    const depConfigMap: Record<string, DeploymentConfiguration> = {};
    const depDesiredMap: Record<string, number> = {};

    for (const dep of parsed.deployments) {
      depConfigMap[dep.id] = dep;
      depDesiredMap[dep.id] = dep.desiredReplicas;
      const rsId = `rs-${dep.id}-v${dep.template.revision}`;
      replicaSets[rsId] = {
        id: rsId,
        deploymentId: dep.id,
        revision: dep.template.revision,
        desiredReplicas: dep.desiredReplicas,
        currentReplicas: 0,
        readyReplicas: 0,
        podIds: [],
        template: dep.template,
        createdAtMs: 0,
      };
      deployments[dep.id] = {
        id: dep.id,
        name: dep.name,
        namespace: dep.namespace,
        desiredReplicas: dep.desiredReplicas,
        currentReplicas: 0,
        readyReplicas: 0,
        availableReplicas: 0,
        updatedReplicas: 0,
        currentRevision: dep.template.revision,
        activeReplicaSetIds: [rsId],
        rolloutState: "stable",
      };
      rolloutHistory[dep.id] = [
        {
          revision: dep.template.revision,
          atMs: 0,
          action: "initial",
          image: dep.template.image,
          summary: `Initial Deployment "${dep.name}" created at rev ${dep.template.revision} (${dep.desiredReplicas} replicas).`,
        },
      ];
      if (dep.hpa?.enabled) {
        hpas[dep.id] = {
          deploymentId: dep.id,
          enabled: true,
          currentReplicas: 0,
          desiredReplicas: dep.desiredReplicas,
          recommendedReplicas: dep.desiredReplicas,
          observedCpuUtilizationPct: 0,
          targetCpuUtilizationPct: dep.hpa.targetCpuUtilizationPct,
          minReplicas: dep.hpa.minReplicas,
          maxReplicas: dep.hpa.maxReplicas,
          stabilizationActive: false,
          lastDecisionReason: "Awaiting initial CPU telemetry evaluation.",
        };
      }
    }

    // Initialize services
    const services: Record<string, ServiceRuntimeState> = {};
    for (const svc of parsed.services) {
      services[svc.id] = {
        id: svc.id,
        name: svc.name,
        type: svc.type,
        virtualIp: svc.virtualIp,
        nodePort: svc.nodePort,
        dnsResolutionDelayMs: svc.dnsResolutionDelayMs,
        selector: { ...svc.selector },
        eligibleEndpointPodIds: [],
        nonReadyPodIds: [],
        routedRequestCount: 0,
        failedNoEndpointCount: 0,
        roundRobinCursor: 0,
      };
    }

    const k8sState: ModeledKubernetesRuntimeState = {
      cluster: { ...parsed.cluster },
      nodes,
      pods: {},
      deployments,
      replicaSets,
      services,
      hpas,
      recentDecisions: [],
      rolloutHistory,
      metrics: computeMetrics({}, nodes, deployments, services, 0, 0),
      virtualTimeMs: 0,
    };

    const events: ExecutionEvent[] = [];
    let sequence = 0;
    let totalPodSeq = 0;
    let totalSchedulingFailures = 0;
    let totalEvictedPods = 0;
    let lastUnschedulableLogged: Record<string, string> = {};
    let rolloutTargetRs: Record<string, string> = {};
    let triggeredUpdates = new Set<string>();
    let triggeredRollbacks = new Set<string>();
    let triggeredScales = new Set<string>();
    let appliedFaults = new Set<string>();
    let nodeLostProcessed = new Set<string>();
    let nodeLostAtMs: Record<string, number> = {};
    let lastReconcileAt = -9999;
    let lastHpaEvalAt: Record<string, number> = {};
    let lastTrafficSampleAt = -9999;

    const syncDeploymentCounters = () => {
      for (const dep of parsed.deployments) {
        const depStatus = k8sState.deployments[dep.id]!;
        const depPods = Object.values(k8sState.pods).filter(
          (p) =>
            p.ownerDeploymentId === dep.id &&
            !p.deletionTimestampMs &&
            p.phase !== "Failed" &&
            p.phase !== "Succeeded" &&
            p.phase !== "Unknown"
        );
        depStatus.currentReplicas = depPods.length;
        depStatus.readyReplicas = depPods.filter((p) => p.ready).length;
        depStatus.availableReplicas = depStatus.readyReplicas;
        depStatus.updatedReplicas = depPods.filter(
          (p) => p.revision === depStatus.currentRevision
        ).length;

        for (const rsId of depStatus.activeReplicaSetIds) {
          const rs = k8sState.replicaSets[rsId];
          if (!rs) continue;
          const rsPods = depPods.filter((p) => p.ownerReplicaSetId === rsId);
          rs.currentReplicas = rsPods.length;
          rs.readyReplicas = rsPods.filter((p) => p.ready).length;
        }
      }
    };

    const emitEvent = (evt: Omit<ExecutionEvent, "id" | "sequence" | "stateSnapshot"> & Record<string, unknown>) => {
      if (events.length >= parsed.limits.maxEvents) return;
      sequence += 1;
      k8sState.virtualTimeMs = evt.atMs as number;
      syncDeploymentCounters();
      k8sState.metrics = computeMetrics(
        k8sState.pods,
        k8sState.nodes,
        k8sState.deployments,
        k8sState.services,
        totalSchedulingFailures,
        totalEvictedPods,
        deployments
      );
      baseRuntime.kubernetesState = JSON.parse(JSON.stringify(k8sState)) as ModeledKubernetesRuntimeState;
      const fullEvent = {
        ...(evt as object),
        id: `k8s-evt-${sequence}`,
        sequence,
        stateSnapshot: RuntimeStateHelper.cloneState(baseRuntime),
      } as ExecutionEvent;
      events.push(fullEvent);
    };

    const freePodFromNode = (pod: Pod) => {
      if (!pod.assignedNodeId) return;
      const node = k8sState.nodes[pod.assignedNodeId];
      if (node) {
        node.reservedCpuMillicores = Math.max(
          0,
          node.reservedCpuMillicores - pod.requests.cpuMillicores
        );
        node.reservedMemoryMiB = Math.max(
          0,
          node.reservedMemoryMiB - pod.requests.memoryMiB
        );
        node.scheduledPodIds = node.scheduledPodIds.filter((id) => id !== pod.id);
      }
      pod.assignedNodeId = undefined;
    };

    const syncServicesForPodChange = (atMs: number) => {
      for (const svc of Object.values(k8sState.services)) {
        const matchingPods = Object.values(k8sState.pods).filter((p) => {
          if (p.phase === "Failed" || p.phase === "Succeeded" || p.deletionTimestampMs) {
            return false;
          }
          return Object.entries(svc.selector).every(([k, v]) => p.labels[k] === v);
        });

        const nextEligible = matchingPods.filter((p) => p.ready).map((p) => p.id);
        const nextNonReady = matchingPods.filter((p) => !p.ready).map((p) => p.id);

        for (const pid of nextEligible) {
          if (!svc.eligibleEndpointPodIds.includes(pid)) {
            svc.eligibleEndpointPodIds = [...svc.eligibleEndpointPodIds, pid];
            emitEvent({
              type: "k8s.service.endpoint.added",
              atMs,
              durationMs: 5,
              serviceId: svc.id,
              podId: pid,
              endpointCount: nextEligible.length,
              explanation: `Service "${svc.name}" added ready Pod endpoint "${k8sState.pods[pid]?.name}" (total endpoints: ${nextEligible.length}).`,
            });
          }
        }
        for (const oldPid of [...svc.eligibleEndpointPodIds]) {
          if (!nextEligible.includes(oldPid)) {
            svc.eligibleEndpointPodIds = svc.eligibleEndpointPodIds.filter((id) => id !== oldPid);
            emitEvent({
              type: "k8s.service.endpoint.removed",
              atMs,
              durationMs: 5,
              serviceId: svc.id,
              podId: oldPid,
              endpointCount: nextEligible.length,
              explanation: `Service "${svc.name}" removed non-ready/terminated Pod "${k8sState.pods[oldPid]?.name ?? oldPid}" from active endpoints (${nextEligible.length} remaining).`,
            });
          }
        }
        svc.eligibleEndpointPodIds = nextEligible;
        svc.nonReadyPodIds = nextNonReady;
      }
    };

    const createPodForRs = (dep: DeploymentConfiguration, rs: ReplicaSet, atMs: number): Pod | null => {
      if (Object.keys(k8sState.pods).length >= parsed.limits.maxPods) return null;
      totalPodSeq += 1;
      const podId = `pod-${dep.id}-r${rs.revision}-${totalPodSeq}`;
      const podName = `${dep.name}-v${rs.revision}-${String(totalPodSeq).padStart(3, "0")}`;
      const pod: Pod = {
        id: podId,
        name: podName,
        namespace: dep.namespace,
        labels: { ...dep.labels, revision: String(rs.revision) },
        ownerDeploymentId: dep.id,
        ownerReplicaSetId: rs.id,
        revision: rs.revision,
        phase: "Pending",
        ready: false,
        container: {
          id: `ctr-${podId}`,
          name: dep.name,
          image: rs.template.image,
          state: "waiting",
          restartCount: 0,
          inCrashLoopBackOff: false,
          cpuThrottled: false,
        },
        probeState: {
          startupPassed: !rs.template.startupProbe.enabled,
          startupAttempts: 0,
          startupSuccessStreak: 0,
          startupFailureStreak: 0,
          readinessAttempts: 0,
          readinessSuccessStreak: 0,
          readinessFailureStreak: 0,
          livenessAttempts: 0,
          livenessFailureStreak: 0,
        },
        requests: {
          cpuMillicores: rs.template.cpuRequestMillicores,
          memoryMiB: rs.template.memoryRequestMiB,
        },
        limits: {
          cpuMillicores: rs.template.cpuLimitMillicores,
          memoryMiB: rs.template.memoryLimitMiB,
        },
        template: rs.template,
        createdAtMs: atMs,
        lastReconciledAtMs: atMs,
      };
      k8sState.pods[podId] = pod;
      rs.podIds.push(podId);
      emitEvent({
        type: "k8s.controller.pod.create.requested",
        atMs,
        durationMs: 10,
        deploymentId: dep.id,
        replicaSetId: rs.id,
        podId,
        explanation: `Controller requested creation of Pod "${podName}" (rev ${rs.revision}) for Deployment "${dep.name}".`,
      });
      emitEvent({
        type: "k8s.pod.created",
        atMs,
        durationMs: 10,
        podId,
        podName,
        deploymentId: dep.id,
        replicaSetId: rs.id,
        revision: rs.revision,
        explanation: `Pod "${podName}" created in Pending phase (requests: ${pod.requests.cpuMillicores}m CPU, ${pod.requests.memoryMiB}Mi RAM).`,
      });
      return pod;
    };

    const deletePodFromRs = (depId: string, rs: ReplicaSet, pod: Pod, atMs: number, reason: string, isRolloutRemoval = false) => {
      pod.deletionTimestampMs = atMs;
      pod.ready = false;
      pod.phase = "Succeeded";
      pod.container.state = "terminated";
      pod.container.terminatedAtMs = atMs;
      pod.container.terminationReason = isRolloutRemoval ? "RolloutReplaced" : "Completed";
      pod.container.exitCode = 0;
      freePodFromNode(pod);
      emitEvent({
        type: isRolloutRemoval ? "k8s.rollout.old_pod.removed" : "k8s.controller.pod.delete.requested",
        atMs,
        durationMs: 15,
        deploymentId: depId,
        replicaSetId: rs.id,
        podId: pod.id,
        oldRevision: pod.revision,
        explanation: isRolloutRemoval
          ? `Rolling update scaled down old Pod "${pod.name}" (rev ${pod.revision}) within maxUnavailable constraints.`
          : `Controller requested deletion of excess Pod "${pod.name}": ${reason}.`,
      });
      emitEvent({
        type: "k8s.pod.deleted",
        atMs,
        durationMs: 10,
        podId: pod.id,
        podName: pod.name,
        reason,
        explanation: `Pod "${pod.name}" terminated and freed ${pod.requests.cpuMillicores}m CPU / ${pod.requests.memoryMiB}Mi RAM.`,
      });
      syncServicesForPodChange(atMs);
    };

    const tickMs = 50;
    const maxDuration = parsed.limits.maxVirtualDurationMs;

    emitEvent({
      type: "run.started",
      atMs: 0,
      durationMs: 10,
      entryNodeId: parsed.cluster.clusterId,
      request: {
        id: "k8s-sim-init",
        method: "POST",
        path: `/clusters/${parsed.cluster.name}/reconcile`,
        headers: { "content-type": "application/json" },
      },
      explanation: `Kubernetes simulation initialized for cluster "${parsed.cluster.name}" (${Object.keys(nodes).length} worker nodes, ${parsed.deployments.length} deployments).`,
    });

    for (let t = 0; t <= maxDuration; t += tickMs) {
      if (events.length >= parsed.limits.maxEvents) break;

      // 1. Check scheduled Deployment events (updates, rollbacks, manual scale)
      for (const dep of parsed.deployments) {
        const depStatus = k8sState.deployments[dep.id]!;

        if (dep.scaleReplicasAtMs && t >= dep.scaleReplicasAtMs.atMs && !triggeredScales.has(dep.id)) {
          triggeredScales.add(dep.id);
          depDesiredMap[dep.id] = dep.scaleReplicasAtMs.newReplicas;
          depStatus.desiredReplicas = dep.scaleReplicasAtMs.newReplicas;
          emitEvent({
            type: "k8s.controller.reconcile.started",
            atMs: t,
            durationMs: 15,
            deploymentId: dep.id,
            desiredReplicas: dep.scaleReplicasAtMs.newReplicas,
            observedReplicas: depStatus.currentReplicas,
            explanation: `Deployment "${dep.name}" desired replicas updated to ${dep.scaleReplicasAtMs.newReplicas}. Reconciling state.`,
          });
        }

        if (dep.updateToRevision && t >= dep.updateToRevision.atMs && !triggeredUpdates.has(dep.id)) {
          triggeredUpdates.add(dep.id);
          const oldRev = depStatus.currentRevision;
          const newRev = dep.updateToRevision.newTemplate.revision;
          const newRsId = `rs-${dep.id}-v${newRev}`;
          k8sState.replicaSets[newRsId] = {
            id: newRsId,
            deploymentId: dep.id,
            revision: newRev,
            desiredReplicas: depDesiredMap[dep.id]!,
            currentReplicas: 0,
            readyReplicas: 0,
            podIds: [],
            template: dep.updateToRevision.newTemplate,
            createdAtMs: t,
          };
          depStatus.currentRevision = newRev;
          depStatus.activeReplicaSetIds.push(newRsId);
          depStatus.rolloutState = "progressing";
          depStatus.rolloutStartedAtMs = t;
          rolloutTargetRs[dep.id] = newRsId;
          k8sState.rolloutHistory[dep.id]?.push({
            revision: newRev,
            atMs: t,
            action: "rollout",
            image: dep.updateToRevision.newTemplate.image,
            summary: `Started RollingUpdate from rev ${oldRev} to rev ${newRev} (${dep.updateToRevision.newTemplate.image}).`,
          });

          emitEvent({
            type: "k8s.rollout.started",
            atMs: t,
            durationMs: 20,
            deploymentId: dep.id,
            oldRevision: oldRev,
            newRevision: newRev,
            newImage: dep.updateToRevision.newTemplate.image,
            explanation: `Deployment "${dep.name}" initiated RollingUpdate from rev ${oldRev} to rev ${newRev} (${dep.updateToRevision.newTemplate.image}).`,
          });
          emitEvent({
            type: "k8s.rollout.replicaset.created",
            atMs: t,
            durationMs: 15,
            deploymentId: dep.id,
            replicaSetId: newRsId,
            revision: newRev,
            explanation: `Created ReplicaSet "${newRsId}" for revision ${newRev}.`,
          });
        }

        if (dep.rollbackToRevision && t >= dep.rollbackToRevision.atMs && !triggeredRollbacks.has(dep.id)) {
          triggeredRollbacks.add(dep.id);
          const fromRev = depStatus.currentRevision;
          const toRev = dep.rollbackToRevision.targetRevision;
          const targetRsId = `rs-${dep.id}-v${toRev}`;
          const targetRs = k8sState.replicaSets[targetRsId];
          if (targetRs) {
            emitEvent({
              type: "k8s.rollback.requested",
              atMs: t,
              durationMs: 15,
              deploymentId: dep.id,
              fromRevision: fromRev,
              toRevision: toRev,
              explanation: `Rollback requested on Deployment "${dep.name}": reverting rev ${fromRev} -> rev ${toRev}.`,
            });
            depStatus.currentRevision = toRev;
            depStatus.rolloutState = "rolled_back";
            depStatus.rolloutFailureReason = undefined;
            rolloutTargetRs[dep.id] = targetRsId;

            // Scale down failing newer ReplicaSet pods cleanly
            for (const rsId of depStatus.activeReplicaSetIds) {
              if (rsId === targetRsId) continue;
              const rs = k8sState.replicaSets[rsId];
              if (!rs) continue;
              for (const pid of rs.podIds) {
                const pod = k8sState.pods[pid];
                if (pod && !pod.deletionTimestampMs && pod.phase !== "Failed") {
                  deletePodFromRs(dep.id, rs, pod, t, `Rolled back from revision ${rs.revision}`, false);
                }
              }
            }

            k8sState.rolloutHistory[dep.id]?.push({
              revision: toRev,
              atMs: t,
              action: "rollback",
              image: targetRs.template.image,
              summary: `Rolled back Deployment "${dep.name}" from rev ${fromRev} to stable rev ${toRev}.`,
            });
            emitEvent({
              type: "k8s.rollback.started",
              atMs: t,
              durationMs: 20,
              deploymentId: dep.id,
              targetRevision: toRev,
              explanation: `Rolling back Deployment "${dep.name}" to revision ${toRev} (${targetRs.template.image}).`,
            });
            emitEvent({
              type: "k8s.rollback.completed",
              atMs: t,
              durationMs: 15,
              deploymentId: dep.id,
              activeRevision: toRev,
              explanation: `Deployment "${dep.name}" successfully rolled back to revision ${toRev}.`,
            });
          } else {
            emitEvent({
              type: "k8s.rollback.failed",
              atMs: t,
              durationMs: 15,
              deploymentId: dep.id,
              reason: `Revision ${toRev} ReplicaSet not found.`,
              explanation: `Rollback failed on "${dep.name}": target revision ${toRev} does not exist.`,
            });
          }
        }
      }

      // 2. Apply Fault Injections
      for (const fault of parsed.faults) {
        if (t >= fault.atMs && !appliedFaults.has(fault.id)) {
          appliedFaults.add(fault.id);
          if (fault.type === "pod_crash") {
            const victim = Object.values(k8sState.pods).find(
              (p) =>
                (p.id === fault.targetId || p.ownerDeploymentId === fault.targetId) &&
                p.phase === "Running" &&
                !p.deletionTimestampMs
            );
            if (victim) {
              victim.phase = "Failed";
              victim.ready = false;
              victim.container.state = "terminated";
              victim.container.terminatedAtMs = t;
              victim.container.terminationReason = "Error";
              victim.container.exitCode = 1;
              freePodFromNode(victim);
              emitEvent({
                type: "k8s.container.terminated",
                atMs: t,
                durationMs: 10,
                podId: victim.id,
                containerId: victim.container.id,
                reason: "Error",
                exitCode: 1,
                explanation: `Injected fault: Container "${victim.container.name}" in Pod "${victim.name}" crashed (Exit 1).`,
              });
              emitEvent({
                type: "k8s.pod.failed",
                atMs: t,
                durationMs: 10,
                podId: victim.id,
                podName: victim.name,
                phase: "Failed",
                reason: "Container crash",
                explanation: `Pod "${victim.name}" transitioned to Failed; controller will reconcile replacement.`,
              });
              syncServicesForPodChange(t);
            }
          } else if (fault.type === "oom_spike") {
            const victim = Object.values(k8sState.pods).find(
              (p) =>
                (p.id === fault.targetId || p.ownerDeploymentId === fault.targetId) &&
                p.phase === "Running" &&
                !p.deletionTimestampMs
            );
            if (victim) {
              victim.ready = false;
              victim.container.state = "terminated";
              victim.container.terminatedAtMs = t;
              victim.container.terminationReason = "OOMKilled";
              victim.container.exitCode = 137;
              victim.container.restartCount += 1;
              victim.container.nextRestartAtMs = t + 300;
              emitEvent({
                type: "k8s.container.terminated",
                atMs: t,
                durationMs: 15,
                podId: victim.id,
                containerId: victim.container.id,
                reason: "OOMKilled",
                exitCode: 137,
                explanation: `Memory spike exceeded limit (${victim.limits.memoryMiB}Mi); kernel OOMKilled container in Pod "${victim.name}" (Exit 137).`,
              });
              emitEvent({
                type: "k8s.pod.not_ready",
                atMs: t,
                durationMs: 10,
                podId: victim.id,
                podName: victim.name,
                reason: "OOMKilled",
                explanation: `Pod "${victim.name}" became NotReady due to OOMKilled termination.`,
              });
              syncServicesForPodChange(t);
            }
          } else if (fault.type === "node_unavailable" || fault.type === "node_not_ready") {
            const node = k8sState.nodes[fault.targetId];
            if (node) {
              const prevStatus = node.status;
              node.status = fault.type === "node_unavailable" ? "unavailable" : "not_ready";
              nodeLostAtMs[node.id] = t;
              emitEvent({
                type: "k8s.node.status.changed",
                atMs: t,
                durationMs: 20,
                nodeId: node.id,
                nodeName: node.name,
                previousStatus: prevStatus,
                newStatus: node.status,
                reason: fault.description || `Node marked ${node.status}.`,
                explanation: `Node "${node.name}" changed status from ${prevStatus} to ${node.status}. Waiting ${parsed.cluster.nodeFailureDetectionMs}ms nodeFailureDetection window before rescheduling.`,
              });
            }
          } else if (fault.type === "node_memory_pressure" || fault.type === "node_taint_no_execute") {
            const node = k8sState.nodes[fault.targetId];
            if (node) {
              node.conditions.memoryPressure = fault.type === "node_memory_pressure";
              node.taints.push({
                key: "node.kubernetes.io/memory-pressure",
                value: "true",
                effect: "NoExecute",
              });
              emitEvent({
                type: "k8s.node.status.changed",
                atMs: t,
                durationMs: 15,
                nodeId: node.id,
                nodeName: node.name,
                previousStatus: node.status,
                newStatus: node.status,
                reason: "MemoryPressure + NoExecute taint added.",
                explanation: `Node "${node.name}" entered MemoryPressure with NoExecute taint; kubelet evicting untolerated Pods.`,
              });
              for (const pid of [...node.scheduledPodIds]) {
                const pod = k8sState.pods[pid];
                if (!pod || pod.deletionTimestampMs) continue;
                const tolerated = pod.template.tolerations.some(
                  (tol) =>
                    tol.key === "node.kubernetes.io/memory-pressure" &&
                    (!tol.effect || tol.effect === "NoExecute")
                );
                if (!tolerated) {
                  pod.phase = "Failed";
                  pod.ready = false;
                  pod.evictionReason = "Evicted due to Node MemoryPressure (NoExecute)";
                  pod.container.state = "terminated";
                  pod.container.terminatedAtMs = t;
                  pod.container.terminationReason = "Evicted";
                  totalEvictedPods += 1;
                  freePodFromNode(pod);
                  emitEvent({
                    type: "k8s.pod.evicted",
                    atMs: t,
                    durationMs: 15,
                    podId: pod.id,
                    podName: pod.name,
                    nodeId: node.id,
                    reason: pod.evictionReason,
                    explanation: `Evicted Pod "${pod.name}" from "${node.name}" (${pod.evictionReason}).`,
                  });
                }
              }
              syncServicesForPodChange(t);
            }
          }
        }
      }

      // Check delayed node failure detection window
      for (const [nodeId, lostAt] of Object.entries(nodeLostAtMs)) {
        if (!nodeLostProcessed.has(nodeId) && t - lostAt >= parsed.cluster.nodeFailureDetectionMs) {
          nodeLostProcessed.add(nodeId);
          const node = k8sState.nodes[nodeId];
          if (node) {
            for (const pid of [...node.scheduledPodIds]) {
              const pod = k8sState.pods[pid];
              if (!pod || pod.deletionTimestampMs) continue;
              pod.phase = "Unknown";
              pod.ready = false;
              pod.container.state = "terminated";
              pod.container.terminatedAtMs = t;
              pod.container.terminationReason = "NodeLost";
              freePodFromNode(pod);
              emitEvent({
                type: "k8s.pod.failed",
                atMs: t,
                durationMs: 15,
                podId: pod.id,
                podName: pod.name,
                phase: "Unknown",
                reason: `Node "${node.name}" unreachable past detection timeout.`,
                explanation: `Marked Pod "${pod.name}" Unknown/lost on unavailable node "${node.name}"; ReplicaSet controller will schedule replacement.`,
              });
            }
            syncServicesForPodChange(t);
          }
        }
      }

      // 3. HPA Evaluations
      const currentTrafficStep = [...parsed.trafficProfile]
        .reverse()
        .find((s) => s.atMs <= t);
      const totalCpuDemandMillicores = currentTrafficStep
        ? currentTrafficStep.requestsPerSec * currentTrafficStep.cpuPerRequestMillicores
        : 0;

      for (const dep of parsed.deployments) {
        if (!dep.hpa?.enabled) continue;
        const lastEval = lastHpaEvalAt[dep.id] ?? -dep.hpa.evaluationIntervalMs;
        if (t - lastEval >= dep.hpa.evaluationIntervalMs && t > 0) {
          lastHpaEvalAt[dep.id] = t;
          const activeReadyPods = Object.values(k8sState.pods).filter(
            (p) =>
              p.ownerDeploymentId === dep.id &&
              !p.deletionTimestampMs &&
              p.phase === "Running" &&
              p.ready
          );
          const prevDesired = depDesiredMap[dep.id]!;
          const result = HpaAutoscalingEngine.evaluate(
            dep.id,
            dep.hpa,
            prevDesired,
            activeReadyPods,
            totalCpuDemandMillicores,
            k8sState.hpas[dep.id],
            t
          );
          k8sState.hpas[dep.id] = result.nextState;

          emitEvent({
            type: "k8s.hpa.evaluation.started",
            atMs: t,
            durationMs: 10,
            deploymentId: dep.id,
            currentReplicas: activeReadyPods.length,
            observedCpuPct: result.nextState.observedCpuUtilizationPct,
            targetCpuPct: dep.hpa.targetCpuUtilizationPct,
            explanation: `HPA evaluated "${dep.name}": observed ${result.nextState.observedCpuUtilizationPct}% CPU vs ${dep.hpa.targetCpuUtilizationPct}% target.`,
          });
          emitEvent({
            type: "k8s.hpa.recommendation.created",
            atMs: t,
            durationMs: 10,
            deploymentId: dep.id,
            recommendedReplicas: result.recommendedReplicas,
            clampedReplicas: result.clampedReplicas,
            stabilized: result.nextState.stabilizationActive,
            explanation: result.nextState.lastDecisionReason,
          });
          if (result.scaleChanged) {
            emitEvent({
              type: "k8s.hpa.scale.requested",
              atMs: t,
              durationMs: 10,
              deploymentId: dep.id,
              fromReplicas: prevDesired,
              toReplicas: result.nextState.desiredReplicas,
              explanation: `HPA requested scale ${prevDesired} -> ${result.nextState.desiredReplicas} replicas for "${dep.name}".`,
            });
            depDesiredMap[dep.id] = result.nextState.desiredReplicas;
            k8sState.deployments[dep.id]!.desiredReplicas = result.nextState.desiredReplicas;
            emitEvent({
              type: "k8s.hpa.scale.applied",
              atMs: t,
              durationMs: 10,
              deploymentId: dep.id,
              desiredReplicas: result.nextState.desiredReplicas,
              explanation: `Deployment "${dep.name}" desiredReplicas set to ${result.nextState.desiredReplicas}; controller reconciliation will create/remove Pods.`,
            });
          }
        }
      }

      // 4. Controller Reconciliation
      if (t === 0 || t - lastReconcileAt >= parsed.cluster.controllerSyncIntervalMs) {
        lastReconcileAt = t;
        for (const dep of parsed.deployments) {
          const depStatus = k8sState.deployments[dep.id]!;
          const desired = depDesiredMap[dep.id]!;
          depStatus.desiredReplicas = desired;

          const activePodsAll = Object.values(k8sState.pods).filter(
            (p) =>
              p.ownerDeploymentId === dep.id &&
              !p.deletionTimestampMs &&
              p.phase !== "Failed" &&
              p.phase !== "Succeeded" &&
              p.phase !== "Unknown"
          );

          const targetRsId =
            rolloutTargetRs[dep.id] ?? `rs-${dep.id}-v${depStatus.currentRevision}`;
          const targetRs = k8sState.replicaSets[targetRsId]!;

          if (depStatus.rolloutState === "progressing") {
            // Check progress deadline
            if (
              depStatus.rolloutStartedAtMs !== undefined &&
              t - depStatus.rolloutStartedAtMs > dep.strategy.progressDeadlineMs
            ) {
              const newReadyCount = targetRs.podIds
                .map((pid) => k8sState.pods[pid])
                .filter((p) => p && p.ready && !p.deletionTimestampMs).length;

              if (newReadyCount < desired) {
                depStatus.rolloutState = "failed";
                depStatus.rolloutFailureReason = `ProgressDeadlineExceeded (${dep.strategy.progressDeadlineMs}ms) with only ${newReadyCount}/${desired} new-revision Pods ready.`;
                k8sState.rolloutHistory[dep.id]?.push({
                  revision: depStatus.currentRevision,
                  atMs: t,
                  action: "rollout_failed",
                  image: targetRs.template.image,
                  summary: depStatus.rolloutFailureReason,
                });
                emitEvent({
                  type: "k8s.rollout.failed",
                  atMs: t,
                  durationMs: 20,
                  deploymentId: dep.id,
                  revision: depStatus.currentRevision,
                  reason: depStatus.rolloutFailureReason,
                  explanation: `Deployment "${dep.name}" rollout FAILED: ${depStatus.rolloutFailureReason}. Old healthy Pods remain protected by maxUnavailable.`,
                });
                continue;
              }
            }

            // Active RollingUpdate: Enforce maxSurge & maxUnavailable
            const { maxTotalPods, minAvailablePods } =
              RollingUpdateEngine.resolveSurgeAndUnavailable(
                desired,
                dep.strategy.maxSurge,
                dep.strategy.maxUnavailable
              );

            const newPods = activePodsAll.filter((p) => p.ownerReplicaSetId === targetRs.id);
            const oldPods = activePodsAll.filter((p) => p.ownerReplicaSetId !== targetRs.id);
            const readyTotal = activePodsAll.filter((p) => p.ready).length;
            const newReady = newPods.filter((p) => p.ready).length;

            // Create new pods if needed and within maxTotalPods
            if (newPods.length < desired && activePodsAll.length < maxTotalPods) {
              const slots = Math.min(desired - newPods.length, maxTotalPods - activePodsAll.length);
              for (let i = 0; i < slots; i++) {
                const pod = createPodForRs(dep, targetRs, t);
                if (pod) {
                  emitEvent({
                    type: "k8s.rollout.pod.created",
                    atMs: t,
                    durationMs: 10,
                    deploymentId: dep.id,
                    podId: pod.id,
                    revision: targetRs.revision,
                    explanation: `Rolling update surged new Pod "${pod.name}" (rev ${targetRs.revision}, active total ${activePodsAll.length + i + 1}/${maxTotalPods}).`,
                  });
                }
              }
            }

            // Scale down old pods only while preserving minAvailablePods
            const currentReadyAfterHold = activePodsAll.filter((p) => p.ready).length;
            if (oldPods.length > 0 && currentReadyAfterHold > minAvailablePods) {
              const canRemoveCount = Math.min(
                oldPods.length,
                currentReadyAfterHold - minAvailablePods + (newReady >= desired ? oldPods.length : 0)
              );
              let removed = 0;
              for (const oldPod of oldPods) {
                if (removed >= canRemoveCount) break;
                const oldRs = k8sState.replicaSets[oldPod.ownerReplicaSetId!]!;
                if (oldPod.ready && readyTotal - (removed + 1) < minAvailablePods && newReady < desired) {
                  continue;
                }
                deletePodFromRs(dep.id, oldRs, oldPod, t, "Replaced by RollingUpdate", true);
                removed += 1;
              }
            }

            // Check completion
            const finalOldPods = Object.values(k8sState.pods).filter(
              (p) =>
                p.ownerDeploymentId === dep.id &&
                p.ownerReplicaSetId !== targetRs.id &&
                !p.deletionTimestampMs &&
                p.phase !== "Failed" &&
                p.phase !== "Succeeded"
            );
            if (newReady >= desired && finalOldPods.length === 0) {
              depStatus.rolloutState = "stable";
              depStatus.rolloutCompletedAtMs = t;
              emitEvent({
                type: "k8s.rollout.completed",
                atMs: t,
                durationMs: t - (depStatus.rolloutStartedAtMs ?? t),
                deploymentId: dep.id,
                revision: targetRs.revision,
                explanation: `Rolling update completed cleanly on "${dep.name}" at revision ${targetRs.revision} in ${t - (depStatus.rolloutStartedAtMs ?? t)}ms.`,
              });
            }
          } else {
            // Steady-state desired replica reconciliation (skip creating broken surge if rollout permanently failed)
            const healthyTargetPods = activePodsAll.filter((p) => p.ownerReplicaSetId === targetRs.id);
            const effectivePods =
              depStatus.rolloutState === "failed" ? activePodsAll : healthyTargetPods;

            if (effectivePods.length < desired && depStatus.rolloutState !== "failed") {
              const deficit = desired - effectivePods.length;
              emitEvent({
                type: "k8s.controller.reconcile.started",
                atMs: t,
                durationMs: 10,
                deploymentId: dep.id,
                desiredReplicas: desired,
                observedReplicas: effectivePods.length,
                explanation: `Controller reconciling "${dep.name}": desired ${desired}, observed ${effectivePods.length}.`,
              });
              emitEvent({
                type: "k8s.controller.replica.deficit",
                atMs: t,
                durationMs: 10,
                deploymentId: dep.id,
                deficit,
                explanation: `Detected deficit of ${deficit} Pod(s) on "${dep.name}".`,
              });
              for (let i = 0; i < deficit; i++) {
                createPodForRs(dep, targetRs, t);
              }
            } else if (effectivePods.length > desired && depStatus.rolloutState !== "failed") {
              const excess = effectivePods.length - desired;
              emitEvent({
                type: "k8s.controller.replica.excess",
                atMs: t,
                durationMs: 10,
                deploymentId: dep.id,
                excess,
                explanation: `Detected excess of ${excess} Pod(s) on "${dep.name}"; scaling down.`,
              });
              // Delete newest pods first
              const sorted = [...effectivePods].sort((a, b) => b.createdAtMs - a.createdAtMs);
              for (let i = 0; i < excess; i++) {
                const victim = sorted[i]!;
                deletePodFromRs(dep.id, targetRs, victim, t, "Scaled down to match desiredReplicas");
              }
            }
          }
        }
      }

      // 5. Scheduler Pass for Pending Unassigned Pods
      const pendingPods = Object.values(k8sState.pods).filter(
        (p) => p.phase === "Pending" && !p.assignedNodeId && !p.deletionTimestampMs
      );
      for (const pod of pendingPods) {
        const prevSig = lastUnschedulableLogged[pod.id];
        const decision: SchedulerDecision = KubernetesPodScheduler.evaluateAndSelect(
          pod,
          Object.values(k8sState.nodes),
          k8sState.pods,
          parsed.cluster.schedulingPolicy,
          t
        );
        pod.schedulerDecision = decision;

        if (decision.selectedNodeId) {
          const targetNode = k8sState.nodes[decision.selectedNodeId]!;
          targetNode.reservedCpuMillicores += pod.requests.cpuMillicores;
          targetNode.reservedMemoryMiB += pod.requests.memoryMiB;
          targetNode.scheduledPodIds.push(pod.id);
          pod.assignedNodeId = targetNode.id;
          pod.scheduledAtMs = t;
          k8sState.recentDecisions.push(decision);
          delete lastUnschedulableLogged[pod.id];

          emitEvent({
            type: "k8s.scheduler.started",
            atMs: t,
            durationMs: 10,
            podId: pod.id,
            podName: pod.name,
            candidateCount: Object.keys(k8sState.nodes).length,
            explanation: `Scheduler started evaluating ${Object.keys(k8sState.nodes).length} candidate nodes for "${pod.name}".`,
          });
          emitEvent({
            type: "k8s.scheduler.node.selected",
            atMs: t,
            durationMs: 10,
            podId: pod.id,
            nodeId: targetNode.id,
            nodeName: targetNode.name,
            score: decision.scoredNodes[0]?.score ?? 0,
            explanation: decision.explanation,
          });
          emitEvent({
            type: "k8s.scheduler.binding.completed",
            atMs: t,
            durationMs: 10,
            podId: pod.id,
            nodeId: targetNode.id,
            reservedCpuMillicores: pod.requests.cpuMillicores,
            reservedMemoryMiB: pod.requests.memoryMiB,
            explanation: `Bound "${pod.name}" to "${targetNode.name}" (reserved ${pod.requests.cpuMillicores}m CPU, ${pod.requests.memoryMiB}Mi RAM).`,
          });
          emitEvent({
            type: "k8s.pod.scheduled",
            atMs: t,
            durationMs: 10,
            podId: pod.id,
            podName: pod.name,
            nodeId: targetNode.id,
            nodeName: targetNode.name,
            decision,
            explanation: `Pod "${pod.name}" scheduled onto "${targetNode.name}".`,
          });
          emitEvent({
            type: "k8s.container.start.requested",
            atMs: t,
            durationMs: 10,
            podId: pod.id,
            containerId: pod.container.id,
            image: pod.container.image,
            explanation: `Kubelet starting container "${pod.container.name}" (${pod.container.image}) on "${targetNode.name}".`,
          });
        } else {
          // Only emit unschedulable event if first time or reason changed
          if (prevSig !== decision.explanation) {
            lastUnschedulableLogged[pod.id] = decision.explanation;
            totalSchedulingFailures += 1;
            k8sState.recentDecisions.push(decision);
            emitEvent({
              type: "k8s.scheduler.pod.unschedulable",
              atMs: t,
              durationMs: 15,
              podId: pod.id,
              podName: pod.name,
              decision,
              explanation: decision.explanation,
            });
          }
        }
      }

      // 6. Container Startup & Restarts Transition
      for (const pod of Object.values(k8sState.pods)) {
        if (pod.deletionTimestampMs || !pod.assignedNodeId || pod.phase === "Failed" || pod.phase === "Unknown") {
          continue;
        }
        const node = k8sState.nodes[pod.assignedNodeId];
        if (!node || node.status !== "ready") continue;

        // Restart check after Liveness/OOM termination
        if (
          pod.container.state === "terminated" &&
          pod.container.nextRestartAtMs !== undefined &&
          t >= pod.container.nextRestartAtMs
        ) {
          pod.container.state = "waiting";
          pod.container.nextRestartAtMs = undefined;
          pod.scheduledAtMs = t;
          pod.probeState = {
            startupPassed: !pod.template.startupProbe.enabled,
            startupAttempts: 0,
            startupSuccessStreak: 0,
            startupFailureStreak: 0,
            readinessAttempts: 0,
            readinessSuccessStreak: 0,
            readinessFailureStreak: 0,
            livenessAttempts: 0,
            livenessFailureStreak: 0,
          };
          emitEvent({
            type: "k8s.container.starting",
            atMs: t,
            durationMs: 10,
            podId: pod.id,
            containerId: pod.container.id,
            startupDelayMs: pod.template.startupDelayMs,
            explanation: `Container "${pod.container.name}" restarting in Pod "${pod.name}" (restart #${pod.container.restartCount}).`,
          });
        }

        // Initial or restarted waiting -> running transition
        if (
          pod.container.state === "waiting" &&
          pod.scheduledAtMs !== undefined &&
          t - pod.scheduledAtMs >= pod.template.startupDelayMs
        ) {
          pod.container.state = "running";
          pod.container.startedAtMs = t;
          pod.phase = "Running";
          emitEvent({
            type: "k8s.container.running",
            atMs: t,
            durationMs: 10,
            podId: pod.id,
            containerId: pod.container.id,
            explanation: `Container "${pod.container.name}" entered Running state inside Pod "${pod.name}".`,
          });
          emitEvent({
            type: "k8s.pod.running",
            atMs: t,
            durationMs: 10,
            podId: pod.id,
            podName: pod.name,
            nodeId: pod.assignedNodeId,
            explanation: `Pod "${pod.name}" entered Running phase on "${node.name}".`,
          });

          if (!pod.template.readinessProbe.enabled && !pod.template.startupProbe.enabled) {
            pod.ready = true;
            pod.readyAtMs = t;
            emitEvent({
              type: "k8s.pod.ready",
              atMs: t,
              durationMs: 10,
              podId: pod.id,
              podName: pod.name,
              nodeId: pod.assignedNodeId,
              explanation: `Pod "${pod.name}" became Ready immediately (no readiness probe configured).`,
            });
            syncServicesForPodChange(t);
          }
        }
      }

      // 7. Health Probes Evaluation (Startup, Readiness, Liveness)
      for (const pod of Object.values(k8sState.pods)) {
        if (
          pod.deletionTimestampMs ||
          pod.phase !== "Running" ||
          pod.container.state !== "running" ||
          pod.container.startedAtMs === undefined
        ) {
          continue;
        }
        const runAge = t - pod.container.startedAtMs;

        // Startup Probe
        const sProbe = pod.template.startupProbe;
        if (
          sProbe.enabled &&
          !pod.probeState.startupPassed &&
          runAge >= sProbe.initialDelayMs &&
          (runAge - sProbe.initialDelayMs) % sProbe.periodMs === 0
        ) {
          pod.probeState.startupAttempts += 1;
          const attempt = pod.probeState.startupAttempts;
          const passed = ProbeSimulator.evaluateAttempt(sProbe, attempt);
          if (passed) {
            pod.probeState.startupSuccessStreak += 1;
            pod.probeState.startupFailureStreak = 0;
            emitEvent({
              type: "k8s.probe.succeeded",
              atMs: t,
              durationMs: 5,
              podId: pod.id,
              probeType: "startup",
              attempt,
              explanation: `Startup probe #${attempt} succeeded on "${pod.name}".`,
            });
            if (pod.probeState.startupSuccessStreak >= sProbe.successThreshold) {
              pod.probeState.startupPassed = true;
            }
          } else {
            pod.probeState.startupFailureStreak += 1;
            pod.probeState.startupSuccessStreak = 0;
            emitEvent({
              type: "k8s.probe.failed",
              atMs: t,
              durationMs: 5,
              podId: pod.id,
              probeType: "startup",
              attempt,
              failureStreak: pod.probeState.startupFailureStreak,
              threshold: sProbe.failureThreshold,
              explanation: `Startup probe #${attempt} failed on "${pod.name}" (${pod.probeState.startupFailureStreak}/${sProbe.failureThreshold}).`,
            });
            if (pod.probeState.startupFailureStreak >= sProbe.failureThreshold) {
              pod.ready = false;
              pod.container.state = "terminated";
              pod.container.terminatedAtMs = t;
              pod.container.terminationReason = "Error";
              pod.container.exitCode = 1;
              pod.container.restartCount += 1;
              pod.container.nextRestartAtMs = t + 200;
              emitEvent({
                type: "k8s.container.terminated",
                atMs: t,
                durationMs: 10,
                podId: pod.id,
                containerId: pod.container.id,
                reason: "StartupProbeFailed",
                exitCode: 1,
                explanation: `Startup probe failureThreshold reached; restarting container "${pod.container.name}".`,
              });
            }
          }
        }

        // Readiness Probe
        const rProbe = pod.template.readinessProbe;
        if (
          rProbe.enabled &&
          pod.probeState.startupPassed &&
          runAge >= rProbe.initialDelayMs &&
          (runAge - rProbe.initialDelayMs) % rProbe.periodMs === 0
        ) {
          pod.probeState.readinessAttempts += 1;
          const attempt = pod.probeState.readinessAttempts;
          const passed = ProbeSimulator.evaluateAttempt(rProbe, attempt);

          if (passed) {
            pod.probeState.readinessSuccessStreak += 1;
            pod.probeState.readinessFailureStreak = 0;
            emitEvent({
              type: "k8s.probe.succeeded",
              atMs: t,
              durationMs: 5,
              podId: pod.id,
              probeType: "readiness",
              attempt,
              explanation: `Readiness probe #${attempt} succeeded on "${pod.name}".`,
            });
            if (!pod.ready && pod.probeState.readinessSuccessStreak >= rProbe.successThreshold) {
              pod.ready = true;
              pod.readyAtMs = pod.readyAtMs ?? t;
              emitEvent({
                type: "k8s.pod.readiness.changed",
                atMs: t,
                durationMs: 5,
                podId: pod.id,
                ready: true,
                reason: "Readiness probe reached successThreshold.",
                explanation: `Pod "${pod.name}" marked Ready; eligible for Service routing.`,
              });
              emitEvent({
                type: "k8s.pod.ready",
                atMs: t,
                durationMs: 5,
                podId: pod.id,
                podName: pod.name,
                nodeId: pod.assignedNodeId!,
                explanation: `Pod "${pod.name}" became Ready on "${k8sState.nodes[pod.assignedNodeId!]?.name}".`,
              });
              if (k8sState.deployments[pod.ownerDeploymentId ?? ""]?.rolloutState === "progressing") {
                emitEvent({
                  type: "k8s.rollout.pod.ready",
                  atMs: t,
                  durationMs: 5,
                  deploymentId: pod.ownerDeploymentId!,
                  podId: pod.id,
                  revision: pod.revision,
                  explanation: `New-revision Pod "${pod.name}" became Ready during rolling update.`,
                });
              }
              syncServicesForPodChange(t);
            }
          } else {
            pod.probeState.readinessFailureStreak += 1;
            pod.probeState.readinessSuccessStreak = 0;
            emitEvent({
              type: "k8s.probe.failed",
              atMs: t,
              durationMs: 5,
              podId: pod.id,
              probeType: "readiness",
              attempt,
              failureStreak: pod.probeState.readinessFailureStreak,
              threshold: rProbe.failureThreshold,
              explanation: `Readiness probe #${attempt} failed on "${pod.name}" (${pod.probeState.readinessFailureStreak}/${rProbe.failureThreshold}).`,
            });
            if (pod.ready && pod.probeState.readinessFailureStreak >= rProbe.failureThreshold) {
              pod.ready = false;
              emitEvent({
                type: "k8s.pod.not_ready",
                atMs: t,
                durationMs: 5,
                podId: pod.id,
                podName: pod.name,
                reason: "Readiness probe failureThreshold exceeded.",
                explanation: `Pod "${pod.name}" marked NotReady and removed from Service endpoints (container remains Running).`,
              });
              syncServicesForPodChange(t);
            }
          }
        }

        // Liveness Probe
        const lProbe = pod.template.livenessProbe;
        if (
          lProbe.enabled &&
          pod.probeState.startupPassed &&
          runAge >= lProbe.initialDelayMs &&
          (runAge - lProbe.initialDelayMs) % lProbe.periodMs === 0
        ) {
          pod.probeState.livenessAttempts += 1;
          const attempt = pod.probeState.livenessAttempts;
          const passed = ProbeSimulator.evaluateAttempt(lProbe, attempt);
          if (passed) {
            pod.probeState.livenessFailureStreak = 0;
          } else {
            pod.probeState.livenessFailureStreak += 1;
            emitEvent({
              type: "k8s.probe.failed",
              atMs: t,
              durationMs: 5,
              podId: pod.id,
              probeType: "liveness",
              attempt,
              failureStreak: pod.probeState.livenessFailureStreak,
              threshold: lProbe.failureThreshold,
              explanation: `Liveness probe #${attempt} failed on "${pod.name}" (${pod.probeState.livenessFailureStreak}/${lProbe.failureThreshold}).`,
            });
            if (pod.probeState.livenessFailureStreak >= lProbe.failureThreshold) {
              pod.ready = false;
              pod.container.state = "terminated";
              pod.container.terminatedAtMs = t;
              pod.container.terminationReason = "LivenessProbeFailed";
              pod.container.exitCode = 137;
              pod.container.restartCount += 1;
              const inBackOff = pod.container.restartCount >= 2 && lProbe.modeledBehavior === "always_fail";
              pod.container.inCrashLoopBackOff = inBackOff;
              const backoffMs = inBackOff
                ? ProbeSimulator.computeCrashLoopBackOffMs(pod.container.restartCount)
                : 150;
              pod.container.nextRestartAtMs = t + backoffMs;

              emitEvent({
                type: "k8s.container.terminated",
                atMs: t,
                durationMs: 10,
                podId: pod.id,
                containerId: pod.container.id,
                reason: "LivenessProbeFailed",
                exitCode: 137,
                explanation: `Kubelet killed container "${pod.container.name}" after ${lProbe.failureThreshold} consecutive liveness probe failures.`,
              });
              emitEvent({
                type: "k8s.container.restart.requested",
                atMs: t,
                durationMs: 10,
                podId: pod.id,
                containerId: pod.container.id,
                restartCount: pod.container.restartCount,
                backoffMs,
                inCrashLoopBackOff: inBackOff,
                explanation: inBackOff
                  ? `CrashLoopBackOff active on "${pod.name}" (restart #${pod.container.restartCount}): delaying next start by ${backoffMs}ms.`
                  : `Scheduling container restart #${pod.container.restartCount} in ${backoffMs}ms.`,
              });
              syncServicesForPodChange(t);
            }
          }
        }
      }

      // 8. Service Traffic Routing Samples (every 400ms when traffic profile is active)
      if (currentTrafficStep && currentTrafficStep.requestsPerSec > 0 && t - lastTrafficSampleAt >= 400) {
        lastTrafficSampleAt = t;
        for (const svc of Object.values(k8sState.services)) {
          if (svc.eligibleEndpointPodIds.length > 0) {
            const idx = svc.roundRobinCursor % svc.eligibleEndpointPodIds.length;
            const targetPid = svc.eligibleEndpointPodIds[idx]!;
            const targetPod = k8sState.pods[targetPid];
            svc.roundRobinCursor += 1;
            svc.routedRequestCount += Math.max(1, Math.round(currentTrafficStep.requestsPerSec * 0.4));
            if (targetPod?.assignedNodeId) {
              emitEvent({
                type: "k8s.service.request.routed",
                atMs: t,
                durationMs: svc.dnsResolutionDelayMs + 10,
                serviceId: svc.id,
                targetPodId: targetPid,
                targetNodeId: targetPod.assignedNodeId,
                explanation: `Service "${svc.name}" (${svc.virtualIp}) routed request sample to ready Pod "${targetPod.name}" (${svc.eligibleEndpointPodIds.length} active endpoint(s)).`,
              });
            }
          } else {
            svc.failedNoEndpointCount += Math.max(1, Math.round(currentTrafficStep.requestsPerSec * 0.4));
            emitEvent({
              type: "k8s.service.no_ready_endpoints",
              atMs: t,
              durationMs: 10,
              serviceId: svc.id,
              serviceName: svc.name,
              explanation: `Service "${svc.name}" rejected incoming traffic: 0 ready Pod endpoints (${svc.nonReadyPodIds.length} non-ready pod(s) excluded).`,
            });
          }
        }
      }

      // 9. Update Deployment / ReplicaSet Aggregate Counters
      syncDeploymentCounters();
    }

    syncDeploymentCounters();
    const finalMetrics = computeMetrics(
      k8sState.pods,
      k8sState.nodes,
      k8sState.deployments,
      k8sState.services,
      totalSchedulingFailures,
      totalEvictedPods,
      deployments
    );
    k8sState.metrics = finalMetrics;
    baseRuntime.kubernetesState = JSON.parse(JSON.stringify(k8sState)) as ModeledKubernetesRuntimeState;

    emitEvent({
      type: "run.completed",
      atMs: Math.min(maxDuration, k8sState.virtualTimeMs + 10),
      durationMs: 10,
      outcome: "success",
      terminalNodeId: parsed.cluster.clusterId,
      terminalReason: `Kubernetes cluster simulation completed (${finalMetrics.readyReplicas}/${finalMetrics.desiredReplicas} ready replicas, ${finalMetrics.pendingPods} pending, ${finalMetrics.schedulingFailures} scheduling failure(s)).`,
      totalHops: events.length,
      explanation: `Kubernetes simulation finished at +${k8sState.virtualTimeMs}ms: ${finalMetrics.readyReplicas}/${finalMetrics.desiredReplicas} ready replicas across ${Object.keys(k8sState.nodes).length} node(s).`,
    });

    const runId = `k8s-run-${parsed.id}`;
    const frames: VisualizationFrame[] = events.map((event, idx) => ({
      frameIndex: idx,
      virtualTimeMs: event.atMs,
      activeNodeIds: [
        event.type.includes("scheduler")
          ? "scheduler"
          : event.type.includes("service")
            ? "service"
            : event.type.includes("hpa")
              ? "hpa"
              : parsed.cluster.clusterId,
      ],
      activeEdgeIds: [],
      activeEvent: event,
      direction: "request",
      stepTitle: event.type.replace(/\./g, " ").toUpperCase(),
      stepExplanation: event.explanation,
      runtimeState: event.stateSnapshot || RuntimeStateHelper.cloneState(baseRuntime),
    }));

    const config: ExecutionConfiguration = {
      version: 1,
      presetId: parsed.presetId || parsed.id,
      entryNodeId: parsed.cluster.clusterId,
      request: {
        id: `req_${runId}`,
        method: "POST",
        path: `/clusters/${parsed.cluster.name}/reconcile`,
        headers: { "content-type": "application/json" },
      },
      routing: { mode: "deterministic", selectedBranches: {} },
      limits: {
        maxHops: 50,
        maxEvents: parsed.limits.maxEvents,
        maxDurationMs: parsed.limits.maxVirtualDurationMs,
      },
      timing: { nodeDurationMs: 10, edgeDurationMs: 5 },
    };

    return {
      runId,
      architectureId: "arch_k8s_sim",
      architectureRevisionId: parsed.architectureRevisionId,
      snapshotHash: `hash_k8s_${parsed.id}`,
      createdAt: "2026-11-12T00:00:00.000Z",
      visitedNodeIds: [parsed.cluster.clusterId, ...Object.keys(k8sState.nodes)],
      traversedEdgeIds: [],
      configuration: config,
      events,
      totalDurationMs: k8sState.virtualTimeMs,
      totalEvents: events.length,
      totalHops: Object.keys(k8sState.deployments).length,
      outcome: "success",
      terminalReason: `Kubernetes cluster simulation finished (${finalMetrics.readyReplicas}/${finalMetrics.desiredReplicas} ready replicas).`,
      frames,
    };
  }
}

function computeMetrics(
  pods: Record<string, Pod>,
  nodes: Record<string, ClusterNode>,
  deployments: ModeledKubernetesRuntimeState["deployments"],
  services: Record<string, ServiceRuntimeState>,
  schedulingFailures: number,
  evictedPods: number,
  depsForDuration?: ModeledKubernetesRuntimeState["deployments"]
): ClusterMetrics {
  const allPods = Object.values(pods);
  const activePods = allPods.filter((p) => !p.deletionTimestampMs);

  let desiredReplicas = 0;
  let currentReplicas = 0;
  let readyReplicas = 0;
  let availableReplicas = 0;
  let rolloutDurationMs: number | undefined;

  for (const dep of Object.values(deployments)) {
    desiredReplicas += dep.desiredReplicas;
    currentReplicas += dep.currentReplicas;
    readyReplicas += dep.readyReplicas;
    availableReplicas += dep.availableReplicas;
  }

  if (depsForDuration) {
    for (const dep of Object.values(depsForDuration)) {
      if (dep.rolloutCompletedAtMs !== undefined && dep.rolloutStartedAtMs !== undefined) {
        rolloutDurationMs = dep.rolloutCompletedAtMs - dep.rolloutStartedAtMs;
      }
    }
  }

  const nodeValues = Object.values(nodes);
  const cpuCapacityMillicores = nodeValues.reduce(
    (s, n) => s + (n.allocatableCpuMillicores ?? n.cpuMillicores),
    0
  );
  const cpuRequestedMillicores = nodeValues.reduce((s, n) => s + n.reservedCpuMillicores, 0);
  const memoryCapacityMiB = nodeValues.reduce(
    (s, n) => s + (n.allocatableMemoryMiB ?? n.memoryMiB),
    0
  );
  const memoryRequestedMiB = nodeValues.reduce((s, n) => s + n.reservedMemoryMiB, 0);

  const nodeUtilizationPct =
    cpuCapacityMillicores > 0
      ? Math.round((cpuRequestedMillicores / cpuCapacityMillicores) * 100)
      : 0;

  return {
    desiredReplicas,
    currentReplicas,
    readyReplicas,
    availableReplicas,
    pendingPods: activePods.filter((p) => p.phase === "Pending").length,
    failedPods: activePods.filter((p) => p.phase === "Failed" || p.phase === "Unknown").length,
    evictedPods,
    totalRestartCount: allPods.reduce((s, p) => s + p.container.restartCount, 0),
    cpuCapacityMillicores,
    cpuRequestedMillicores,
    memoryCapacityMiB,
    memoryRequestedMiB,
    nodeUtilizationPct,
    serviceEndpointCount: Object.values(services).reduce(
      (s, svc) => s + svc.eligibleEndpointPodIds.length,
      0
    ),
    schedulingFailures,
    routedRequests: Object.values(services).reduce((s, svc) => s + svc.routedRequestCount, 0),
    noEndpointErrors: Object.values(services).reduce((s, svc) => s + svc.failedNoEndpointCount, 0),
    rolloutDurationMs,
  };
}
