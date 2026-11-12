import { describe, it, expect } from "vitest";
import {
  KUBERNETES_PRESET_METADATA,
  createKubernetesPresetScenario,
  KubernetesExecutionEngine,
  RollingUpdateEngine,
  type ExecutionTrace,
} from "../index";

function getFinalK8s(trace: ExecutionTrace) {
  const frame = trace.frames[trace.frames.length - 1];
  if (!frame?.runtimeState?.kubernetesState) {
    throw new Error("Expected final frame to contain kubernetesState");
  }
  return frame.runtimeState.kubernetesState;
}

describe("Phase 05.4.10 — Kubernetes Scheduling, Orchestration & Deployment Engine", () => {
  it("runs all 20 educational Kubernetes presets cleanly and produces valid traces", () => {
    expect(KUBERNETES_PRESET_METADATA.length).toBe(20);
    for (const meta of KUBERNETES_PRESET_METADATA) {
      const scenario = createKubernetesPresetScenario(meta.id);
      const trace = KubernetesExecutionEngine.runScenario(scenario);
      expect(trace.outcome).toBe("success");
      expect(trace.events.length).toBeGreaterThan(2);
      expect(trace.frames.length).toBe(trace.events.length);
      getFinalK8s(trace);
    }
  });

  it("basic_pod_scheduling: schedules 3 replicas, reaches Ready, populates Service endpoints", () => {
    const trace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("basic_pod_scheduling")
    );
    const finalK8s = getFinalK8s(trace);

    expect(finalK8s.metrics.desiredReplicas).toBe(3);
    expect(finalK8s.metrics.readyReplicas).toBe(3);
    expect(finalK8s.metrics.pendingPods).toBe(0);
    expect(finalK8s.services["svc-api"]?.eligibleEndpointPodIds.length).toBe(3);
    expect(finalK8s.metrics.routedRequests).toBeGreaterThan(0);

    // Verify no node exceeded allocatable resources
    for (const node of Object.values(finalK8s.nodes)) {
      expect(node.reservedCpuMillicores).toBeLessThanOrEqual(
        node.allocatableCpuMillicores ?? node.cpuMillicores
      );
      expect(node.reservedMemoryMiB).toBeLessThanOrEqual(
        node.allocatableMemoryMiB ?? node.memoryMiB
      );
    }
  });

  it("insufficient_cpu & insufficient_memory: leaves unschedulable Pods Pending with reasons", () => {
    const cpuTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("insufficient_cpu")
    );
    const cpuK8s = getFinalK8s(cpuTrace);
    expect(cpuK8s.metrics.pendingPods).toBe(1);
    expect(cpuK8s.metrics.schedulingFailures).toBeGreaterThanOrEqual(1);
    const cpuPod = Object.values(cpuK8s.pods)[0]!;
    expect(cpuPod.assignedNodeId).toBeUndefined();
    expect(cpuPod.schedulerDecision?.rejectedNodes[0]?.reasons.some((r) => r.includes("Insufficient CPU"))).toBe(true);

    const memTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("insufficient_memory")
    );
    const memK8s = getFinalK8s(memTrace);
    expect(memK8s.metrics.pendingPods).toBe(1);
    const memPod = Object.values(memK8s.pods)[0]!;
    expect(memPod.schedulerDecision?.rejectedNodes[0]?.reasons.some((r) => r.includes("Insufficient Memory"))).toBe(true);
  });

  it("node_selector_mismatch & taint_without_toleration: enforces placement constraints", () => {
    const selTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("node_selector_mismatch")
    );
    const selK8s = getFinalK8s(selTrace);
    expect(selK8s.metrics.pendingPods).toBe(1);
    expect(Object.values(selK8s.pods)[0]?.schedulerDecision?.rejectedNodes[0]?.reasons.some((r) =>
      r.includes("NodeSelector mismatch")
    )).toBe(true);

    const taintTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("taint_without_toleration")
    );
    const taintK8s = getFinalK8s(taintTrace);
    expect(taintK8s.metrics.readyReplicas).toBe(2);
    expect(taintK8s.nodes["node-a"]?.scheduledPodIds.length).toBe(2);
    expect(taintK8s.nodes["node-b"]?.scheduledPodIds.length).toBe(0);
  });

  it("pod_anti_affinity: spreads across 2 nodes and leaves 3rd Pod Pending", () => {
    const trace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("pod_anti_affinity")
    );
    const k8s = getFinalK8s(trace);
    expect(k8s.metrics.readyReplicas).toBe(2);
    expect(k8s.metrics.pendingPods).toBe(1);
    expect(k8s.nodes["node-a"]?.scheduledPodIds.length).toBe(1);
    expect(k8s.nodes["node-b"]?.scheduledPodIds.length).toBe(1);
  });

  it("deployment_reconciliation: scales cleanly from 2 to 4 replicas", () => {
    const trace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("deployment_reconciliation")
    );
    const k8s = getFinalK8s(trace);
    expect(k8s.metrics.desiredReplicas).toBe(4);
    expect(k8s.metrics.readyReplicas).toBe(4);
  });

  it("readiness_failure: excludes Pod from Service endpoints without restarting container", () => {
    const trace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("readiness_failure")
    );
    const probeFailedEvents = trace.events.filter(
      (e) => e.type === "k8s.probe.failed" && e.probeType === "readiness"
    );
    expect(probeFailedEvents.length).toBeGreaterThanOrEqual(3);
    const finalK8s = getFinalK8s(trace);
    // Eventually passes after fail_first_n(3), with 0 restarts
    expect(finalK8s.metrics.totalRestartCount).toBe(0);
    expect(finalK8s.metrics.readyReplicas).toBe(2);
  });

  it("liveness_restart & crash_loop_backoff & oom_killed: restarts container cleanly and detects OOM", () => {
    const liveTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("liveness_restart")
    );
    expect(liveTrace.events.some((e) => e.type === "k8s.container.restart.requested")).toBe(true);
    const liveK8s = getFinalK8s(liveTrace);
    expect(liveK8s.metrics.totalRestartCount).toBeGreaterThanOrEqual(1);

    const clbTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("crash_loop_backoff")
    );
    expect(
      clbTrace.events.some(
        (e) => e.type === "k8s.container.restart.requested" && e.inCrashLoopBackOff
      )
    ).toBe(true);

    const oomTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("oom_killed")
    );
    expect(
      oomTrace.events.some(
        (e) => e.type === "k8s.container.terminated" && e.reason === "OOMKilled" && e.exitCode === 137
      )
    ).toBe(true);
  });

  it("service_no_endpoints: records zero eligible endpoints and increments noEndpointErrors", () => {
    const trace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("service_no_endpoints")
    );
    expect(trace.events.some((e) => e.type === "k8s.service.no_ready_endpoints")).toBe(true);
    const k8s = getFinalK8s(trace);
    expect(k8s.services["svc-api"]?.eligibleEndpointPodIds.length).toBe(0);
    expect(k8s.metrics.noEndpointErrors).toBeGreaterThan(0);
  });

  it("hpa_scale_out & hpa_scale_in: scales based on CPU utilization relative to requested CPU", () => {
    const outTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("hpa_scale_out")
    );
    expect(outTrace.events.some((e) => e.type === "k8s.hpa.scale.applied")).toBe(true);
    const outK8s = getFinalK8s(outTrace);
    expect(outK8s.deployments["dep-api"]?.desiredReplicas).toBeGreaterThan(2);

    const inTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("hpa_scale_in")
    );
    const inK8s = getFinalK8s(inTrace);
    expect(inK8s.deployments["dep-api"]?.desiredReplicas).toBeLessThan(4);
    expect(inK8s.deployments["dep-api"]?.desiredReplicas).toBeGreaterThanOrEqual(2);
  });

  it("rolling_update, failed_rollout, and deployment_rollback respect surge/unavailability and revisions", () => {
    const bounds = RollingUpdateEngine.resolveSurgeAndUnavailable(3, "25%", "25%");
    expect(bounds.maxSurgeCount).toBe(1); // ceil(0.75)
    expect(bounds.maxUnavailableCount).toBe(0); // floor(0.75)

    const rollTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("rolling_update")
    );
    expect(rollTrace.events.some((e) => e.type === "k8s.rollout.completed")).toBe(true);
    const rollK8s = getFinalK8s(rollTrace);
    expect(rollK8s.deployments["dep-api"]?.currentRevision).toBe(2);
    expect(rollK8s.deployments["dep-api"]?.readyReplicas).toBe(3);
    expect(rollK8s.deployments["dep-api"]?.rolloutState).toBe("stable");

    const failTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("failed_rollout")
    );
    expect(failTrace.events.some((e) => e.type === "k8s.rollout.failed")).toBe(true);
    const failK8s = getFinalK8s(failTrace);
    expect(failK8s.deployments["dep-api"]?.rolloutState).toBe("failed");

    const rbTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("deployment_rollback")
    );
    expect(rbTrace.events.some((e) => e.type === "k8s.rollback.completed")).toBe(true);
    const rbK8s = getFinalK8s(rbTrace);
    expect(rbK8s.deployments["dep-api"]?.currentRevision).toBe(1);
    expect(rbK8s.deployments["dep-api"]?.readyReplicas).toBe(2);
  });

  it("pod_failure_recovery, node_failure_recovery, and resource_pressure_eviction recover workloads via rescheduling", () => {
    const podRecTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("pod_failure_recovery")
    );
    expect(podRecTrace.events.some((e) => e.type === "k8s.pod.failed")).toBe(true);
    const podRecK8s = getFinalK8s(podRecTrace);
    expect(podRecK8s.metrics.readyReplicas).toBe(2);

    const nodeRecTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("node_failure_recovery")
    );
    expect(nodeRecTrace.events.some((e) => e.type === "k8s.node.status.changed")).toBe(true);
    const nodeRecK8s = getFinalK8s(nodeRecTrace);
    expect(nodeRecK8s.nodes["node-a"]?.status).toBe("unavailable");
    expect(nodeRecK8s.nodes["node-a"]?.scheduledPodIds.length).toBe(0);
    // Replacement Pods scheduled cleanly on surviving nodes B and C
    expect(nodeRecK8s.metrics.readyReplicas).toBe(3);

    const evictTrace = KubernetesExecutionEngine.runScenario(
      createKubernetesPresetScenario("resource_pressure_eviction")
    );
    expect(evictTrace.events.some((e) => e.type === "k8s.pod.evicted")).toBe(true);
    const evictK8s = getFinalK8s(evictTrace);
    expect(evictK8s.metrics.evictedPods).toBeGreaterThanOrEqual(1);
    expect(evictK8s.metrics.readyReplicas).toBe(2);
  });

  it("guarantees deterministic replay and exact state reconstruction across identical runs", () => {
    const s1 = createKubernetesPresetScenario("rolling_update");
    const s2 = createKubernetesPresetScenario("rolling_update");
    const t1 = KubernetesExecutionEngine.runScenario(s1);
    const t2 = KubernetesExecutionEngine.runScenario(s2);

    expect(t1.events.map((e) => e.type)).toEqual(t2.events.map((e) => e.type));
    expect(t1.events.map((e) => e.atMs)).toEqual(t2.events.map((e) => e.atMs));
    expect(getFinalK8s(t1).metrics).toEqual(getFinalK8s(t2).metrics);
  });
});
