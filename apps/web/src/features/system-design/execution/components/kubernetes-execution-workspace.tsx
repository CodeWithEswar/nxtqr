"use client";

import * as React from "react";
import {
  LayersIcon,
  CloseIcon,
  PlayIcon,
  CpuIcon,
  ShieldIcon,
  ActivityIcon,
} from "@nxtqr/icons";
import {
  Button,
  Badge,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@nxtqr/ui";
import { cn } from "@nxtqr/utils";
import { useExecutionStore } from "../store/execution-store";
import {
  KUBERNETES_PRESET_METADATA,
  type KubernetesScenarioPresetId,
  createKubernetesPresetScenario,
  type Pod,
  type SchedulerDecision,
} from "@nxtqr/architecture-execution";

type WorkspaceTab =
  | "nodes"
  | "scheduler"
  | "deployments"
  | "probes"
  | "services"
  | "hpa_rollout";

export function KubernetesExecutionWorkspace() {
  const toggleKubernetesWorkspace = useExecutionStore((s) => s.toggleKubernetesWorkspace);
  const activeKubernetesScenario = useExecutionStore((s) => s.activeKubernetesScenario);
  const setKubernetesScenario = useExecutionStore((s) => s.setKubernetesScenario);
  const runKubernetesSimulation = useExecutionStore((s) => s.runKubernetesSimulation);
  const trace = useExecutionStore((s) => s.trace);
  const currentStepIndex = useExecutionStore((s) => s.playbackState.currentStepIndex);

  const [activeTab, setActiveTab] = React.useState<WorkspaceTab>("nodes");
  const [selectedPreset, setSelectedPreset] = React.useState<KubernetesScenarioPresetId>(
    (activeKubernetesScenario?.presetId as KubernetesScenarioPresetId) || "basic_pod_scheduling"
  );
  const [selectedPodId, setSelectedPodId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!activeKubernetesScenario) {
      const initial = createKubernetesPresetScenario(selectedPreset);
      setKubernetesScenario(initial);
    }
  }, [activeKubernetesScenario, selectedPreset, setKubernetesScenario]);

  const activeScenario =
    activeKubernetesScenario || createKubernetesPresetScenario(selectedPreset);

  const currentFrame = trace?.frames?.[currentStepIndex];
  const activeEvent = currentFrame?.activeEvent;
  const k8sState = currentFrame?.runtimeState?.kubernetesState;

  const nodesList = k8sState ? Object.values(k8sState.nodes) : activeScenario.nodes;
  const podsList = k8sState ? Object.values(k8sState.pods) : [];
  const activePodsList = podsList.filter((p) => !p.deletionTimestampMs);
  const deploymentsList = k8sState ? Object.values(k8sState.deployments) : [];
  const replicaSetsList = k8sState ? Object.values(k8sState.replicaSets) : [];
  const servicesList = k8sState ? Object.values(k8sState.services) : [];
  const hpasList = k8sState ? Object.values(k8sState.hpas) : [];
  const decisionsList: SchedulerDecision[] = k8sState ? k8sState.recentDecisions : [];
  const metrics = k8sState?.metrics;

  const inspectedPod: Pod | undefined =
    (selectedPodId && k8sState?.pods[selectedPodId]) || activePodsList[0] || podsList[0];

  const handlePresetChange = (presetId: string) => {
    const id = presetId as KubernetesScenarioPresetId;
    setSelectedPreset(id);
    setSelectedPodId(null);
    const scenario = createKubernetesPresetScenario(id);
    setKubernetesScenario(scenario);
    runKubernetesSimulation(scenario);
  };

  const handleRunSimulation = () => {
    setSelectedPodId(null);
    runKubernetesSimulation(activeScenario);
  };

  return (
    <div
      className="fixed inset-x-4 bottom-20 top-20 z-40 flex flex-col bg-background border border-border-default rounded-md shadow-level-2 overflow-hidden"
      role="dialog"
      aria-label="Kubernetes Scheduling and Container Orchestration Workspace"
    >
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-surface-01 border-b border-border-default">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-surface-03 border border-border-subtle">
            <LayersIcon className="w-4 h-4 text-foreground" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-semibold text-foreground tracking-tight">
                Kubernetes Cluster & Orchestration Studio
              </h2>
              <Badge
                variant="outline"
                className="text-[10px] font-mono border-border-strong bg-surface-03 text-text-secondary rounded-md"
              >
                {activeScenario.cluster.name}
              </Badge>
              {k8sState && (
                <Badge
                  variant="outline"
                  className="text-[10px] font-mono border-border-default bg-surface-02 text-foreground rounded-md"
                >
                  t = +{k8sState.virtualTimeMs}ms
                </Badge>
              )}
            </div>
            <p className="text-[11px] text-text-muted truncate max-w-2xl">
              {activeEvent?.explanation || activeScenario.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedPreset} onValueChange={handlePresetChange}>
            <SelectTrigger className="h-7 w-64 text-[11px] font-mono bg-surface-02 border-border-default text-foreground rounded-md">
              <SelectValue placeholder="Select Kubernetes scenario..." />
            </SelectTrigger>
            <SelectContent className="bg-surface-02 border-border-default text-foreground max-h-72 rounded-md">
              {KUBERNETES_PRESET_METADATA.map((preset) => (
                <SelectItem
                  key={preset.id}
                  value={preset.id}
                  className="text-[11px] font-mono"
                >
                  [{preset.category.split(" ")[0]}] {preset.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            size="sm"
            onClick={handleRunSimulation}
            className="h-7 px-3 text-[11px] font-mono bg-foreground text-background hover:bg-text-secondary rounded-md gap-1.5"
          >
            <PlayIcon className="w-3 h-3" />
            Run Cluster Sim
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleKubernetesWorkspace(false)}
            aria-label="Close Kubernetes Workspace"
            className="h-7 w-7 p-0 text-text-muted hover:text-foreground hover:bg-surface-03 rounded-md"
          >
            <CloseIcon className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Live Telemetry Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 px-4 py-2 bg-surface-01 border-b border-border-subtle">
        <MetricTile
          label="Ready / Desired"
          value={metrics ? `${metrics.readyReplicas} / ${metrics.desiredReplicas}` : "-"}
          sub={metrics ? `${metrics.currentReplicas} active pods` : "Run to simulate"}
        />
        <MetricTile
          label="Pending Pods"
          value={metrics ? String(metrics.pendingPods) : "0"}
          highlight={Boolean(metrics && metrics.pendingPods > 0)}
        />
        <MetricTile
          label="Failed / Evicted"
          value={metrics ? `${metrics.failedPods} / ${metrics.evictedPods}` : "0 / 0"}
          highlight={Boolean(metrics && (metrics.failedPods > 0 || metrics.evictedPods > 0))}
        />
        <MetricTile
          label="Container Restarts"
          value={metrics ? String(metrics.totalRestartCount) : "0"}
          highlight={Boolean(metrics && metrics.totalRestartCount > 0)}
        />
        <MetricTile
          label="Cluster CPU"
          value={
            metrics
              ? `${metrics.cpuRequestedMillicores}m / ${metrics.cpuCapacityMillicores}m`
              : "-"
          }
          sub={metrics ? `${metrics.nodeUtilizationPct}% requested` : undefined}
        />
        <MetricTile
          label="Cluster Memory"
          value={
            metrics
              ? `${metrics.memoryRequestedMiB} / ${metrics.memoryCapacityMiB} Mi`
              : "-"
          }
        />
        <MetricTile
          label="Service Endpoints"
          value={metrics ? String(metrics.serviceEndpointCount) : "0"}
          sub={metrics ? `${metrics.routedRequests} routed reqs` : undefined}
        />
        <MetricTile
          label="No-Endpoint Errs"
          value={metrics ? String(metrics.noEndpointErrors) : "0"}
          highlight={Boolean(metrics && metrics.noEndpointErrors > 0)}
        />
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 px-4 py-1.5 bg-surface-02 border-b border-border-default overflow-x-auto">
        {(
          [
            { id: "nodes", label: "Nodes & Topology" },
            { id: "scheduler", label: "Scheduler & Pods" },
            { id: "deployments", label: "Deployments & ReplicaSets" },
            { id: "probes", label: "Health Probes & Restarts" },
            { id: "services", label: "Services & Routing" },
            { id: "hpa_rollout", label: "HPA & Rolling Updates" },
          ] as { id: WorkspaceTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-3 py-1 text-[11px] font-mono rounded-md border transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "bg-surface-04 border-border-strong text-foreground font-semibold shadow-level-3"
                : "bg-transparent border-transparent text-text-muted hover:text-foreground hover:bg-surface-03"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Body */}
      <div className="flex-1 overflow-y-auto p-4 bg-background space-y-4">
        {!k8sState ? (
          <div className="flex flex-col items-center justify-center h-full text-center border border-border-subtle rounded-md bg-surface-01 p-8">
            <LayersIcon className="w-8 h-8 mb-3 text-text-disabled" />
            <p className="text-xs font-mono text-foreground mb-1">
              Cluster Simulation Idle — {activeScenario.name}
            </p>
            <p className="text-[11px] text-text-muted max-w-md mb-4">
              {activeScenario.description}
            </p>
            <Button
              size="sm"
              onClick={handleRunSimulation}
              className="h-8 px-4 text-xs font-mono bg-foreground text-background hover:bg-text-secondary rounded-md gap-1.5"
            >
              <PlayIcon className="w-3.5 h-3.5" />
              Run Deterministic Simulation
            </Button>
          </div>
        ) : (
          <>
            {activeTab === "nodes" && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {nodesList.map((node) => {
                  const allocCpu = node.allocatableCpuMillicores ?? node.cpuMillicores;
                  const allocMem = node.allocatableMemoryMiB ?? node.memoryMiB;
                  const cpuPct = Math.min(
                    100,
                    Math.round((node.reservedCpuMillicores / allocCpu) * 100)
                  );
                  const memPct = Math.min(
                    100,
                    Math.round((node.reservedMemoryMiB / allocMem) * 100)
                  );
                  const hostedPods = node.scheduledPodIds
                    .map((pid) => k8sState.pods[pid])
                    .filter((p): p is Pod => Boolean(p));

                  return (
                    <div
                      key={node.id}
                      className="p-3 bg-surface-01 border border-border-default rounded-md flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CpuIcon className="w-3.5 h-3.5 text-text-secondary" />
                          <span className="text-xs font-mono font-semibold text-foreground">
                            {node.name}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] font-mono rounded-md",
                            node.status === "ready"
                              ? "border-border-strong bg-surface-03 text-foreground"
                              : "border-destructive/60 bg-destructive/10 text-destructive"
                          )}
                        >
                          {node.status.toUpperCase()}
                        </Badge>
                      </div>

                      {/* CPU & Memory Utilization Bars */}
                      <div className="space-y-2 text-[11px] font-mono">
                        <div>
                          <div className="flex justify-between text-text-secondary mb-1">
                            <span>CPU Reserved</span>
                            <span>
                              {node.reservedCpuMillicores}m / {allocCpu}m ({cpuPct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-03 rounded-md overflow-hidden border border-border-subtle">
                            <div
                              className="h-full bg-foreground transition-all"
                              style={{ width: `${cpuPct}%` }}
                            />
                          </div>
                        </div>
                        <div>
                          <div className="flex justify-between text-text-secondary mb-1">
                            <span>Memory Reserved</span>
                            <span>
                              {node.reservedMemoryMiB}Mi / {allocMem}Mi ({memPct}%)
                            </span>
                          </div>
                          <div className="h-1.5 w-full bg-surface-03 rounded-md overflow-hidden border border-border-subtle">
                            <div
                              className="h-full bg-text-secondary transition-all"
                              style={{ width: `${memPct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Labels & Taints */}
                      <div className="space-y-1.5 text-[10px] font-mono border-t border-border-subtle pt-2">
                        <div className="flex flex-wrap gap-1">
                          <span className="text-text-disabled mr-1">Zone:</span>
                          <span className="px-1.5 py-0.5 rounded-md bg-surface-03 border border-border-subtle text-text-secondary">
                            {node.zone}
                          </span>
                          {node.conditions.memoryPressure && (
                            <span className="px-1.5 py-0.5 rounded-md bg-destructive/15 border border-destructive/50 text-destructive">
                              MemoryPressure
                            </span>
                          )}
                        </div>
                        {node.taints.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            <span className="text-text-disabled mr-1">Taints:</span>
                            {node.taints.map((t, idx) => (
                              <span
                                key={idx}
                                className="px-1.5 py-0.5 rounded-md bg-surface-03 border border-border-strong text-warning"
                              >
                                {t.key}={t.value}:{t.effect}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Hosted Pods on Node */}
                      <div className="border-t border-border-subtle pt-2 space-y-1.5">
                        <div className="text-[10px] font-mono text-text-muted">
                          Scheduled Pods ({hostedPods.length} / {node.maxPods})
                        </div>
                        {hostedPods.length === 0 ? (
                          <div className="text-[10px] font-mono text-text-disabled italic">
                            No active pods scheduled on node
                          </div>
                        ) : (
                          <div className="space-y-1">
                            {hostedPods.map((pod) => (
                              <button
                                key={pod.id}
                                type="button"
                                onClick={() => {
                                  setSelectedPodId(pod.id);
                                  setActiveTab("scheduler");
                                }}
                                className="w-full flex items-center justify-between px-2 py-1 rounded-md bg-surface-02 border border-border-subtle hover:border-border-hover text-left text-[10px] font-mono"
                              >
                                <span className="text-foreground truncate">{pod.name}</span>
                                <span
                                  className={cn(
                                    "px-1.5 py-0.5 rounded-md text-[9px]",
                                    pod.ready
                                      ? "bg-surface-04 text-foreground border border-border-strong"
                                      : "bg-surface-03 text-text-muted border border-border-subtle"
                                  )}
                                >
                                  {pod.ready ? "READY" : pod.phase.toUpperCase()}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "scheduler" && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Pod List */}
                <div className="lg:col-span-5 bg-surface-01 border border-border-default rounded-md p-3 space-y-2">
                  <div className="flex items-center justify-between border-b border-border-subtle pb-2">
                    <span className="text-xs font-mono font-semibold text-foreground">
                      Pod Inventory ({podsList.length})
                    </span>
                    <span className="text-[10px] font-mono text-text-muted">
                      Policy: {k8sState.cluster.schedulingPolicy}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-[420px] overflow-y-auto">
                    {podsList.map((pod) => (
                      <button
                        key={pod.id}
                        type="button"
                        onClick={() => setSelectedPodId(pod.id)}
                        className={cn(
                          "w-full text-left p-2 rounded-md border transition-colors text-[11px] font-mono",
                          inspectedPod?.id === pod.id
                            ? "bg-surface-04 border-border-strong text-foreground shadow-level-3"
                            : "bg-surface-02 border-border-subtle text-text-secondary hover:border-border-hover"
                        )}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-foreground truncate">
                            {pod.name}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] font-mono border-border-default bg-surface-03 rounded-md"
                          >
                            {pod.phase} {pod.ready ? "· Ready" : ""}
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-text-muted">
                          <span>
                            Node: {pod.assignedNodeId ? k8sState.nodes[pod.assignedNodeId]?.name : "Unbound"}
                          </span>
                          <span>
                            Req: {pod.requests.cpuMillicores}m / {pod.requests.memoryMiB}Mi
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scheduler Decision Inspector */}
                <div className="lg:col-span-7 bg-surface-01 border border-border-default rounded-md p-3 space-y-3">
                  <div className="border-b border-border-subtle pb-2">
                    <h3 className="text-xs font-mono font-semibold text-foreground">
                      Scheduler Filter & Score Decision Inspector
                    </h3>
                    <p className="text-[11px] text-text-muted">
                      {inspectedPod
                        ? `Evaluating Pod "${inspectedPod.name}" (rev ${inspectedPod.revision})`
                        : "Select a Pod to inspect its scheduler decision"}
                    </p>
                  </div>

                  {inspectedPod?.schedulerDecision ? (
                    <div className="space-y-3 text-[11px] font-mono">
                      <div className="p-2.5 rounded-md bg-surface-02 border border-border-default text-foreground">
                        {inspectedPod.schedulerDecision.explanation}
                      </div>

                      {inspectedPod.schedulerDecision.rejectedNodes.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] uppercase tracking-wider text-text-muted">
                            Filtered / Rejected Nodes
                          </div>
                          {inspectedPod.schedulerDecision.rejectedNodes.map((rej) => (
                            <div
                              key={rej.nodeId}
                              className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1"
                            >
                              <div className="font-semibold text-destructive">{rej.nodeName}</div>
                              {rej.reasons.map((reason, idx) => (
                                <div key={idx} className="text-[10px] text-text-secondary">
                                  • {reason}
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}

                      {inspectedPod.schedulerDecision.scoredNodes.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="text-[10px] uppercase tracking-wider text-text-muted">
                            Eligible Node Scores
                          </div>
                          {inspectedPod.schedulerDecision.scoredNodes.map((sc) => (
                            <div
                              key={sc.nodeId}
                              className={cn(
                                "p-2 rounded-md border flex items-center justify-between gap-2",
                                sc.nodeId === inspectedPod.schedulerDecision?.selectedNodeId
                                  ? "bg-surface-04 border-border-strong"
                                  : "bg-surface-02 border-border-subtle"
                              )}
                            >
                              <div>
                                <div className="font-semibold text-foreground">
                                  {sc.nodeName}{" "}
                                  {sc.nodeId === inspectedPod.schedulerDecision?.selectedNodeId && (
                                    <span className="text-[10px] text-text-secondary">
                                      (SELECTED)
                                    </span>
                                  )}
                                </div>
                                <div className="text-[10px] text-text-muted">{sc.reason}</div>
                              </div>
                              <div className="text-xs font-bold text-foreground px-2 py-1 rounded-md bg-surface-03 border border-border-default">
                                {sc.score}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-[11px] font-mono text-text-muted py-8 text-center">
                      No scheduler evaluation recorded yet for this Pod. Recent cluster decisions:{" "}
                      {decisionsList.length}.
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === "deployments" && (
              <div className="space-y-4">
                {deploymentsList.map((dep) => {
                  const history = k8sState.rolloutHistory[dep.id] || [];
                  const depRs = replicaSetsList.filter((rs) => rs.deploymentId === dep.id);
                  return (
                    <div
                      key={dep.id}
                      className="p-3 bg-surface-01 border border-border-default rounded-md space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2">
                        <div>
                          <span className="text-xs font-mono font-semibold text-foreground">
                            Deployment/{dep.name}
                          </span>
                          <span className="ml-2 text-[10px] font-mono text-text-muted">
                            rev {dep.currentRevision} · ns: {dep.namespace}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-[10px] font-mono rounded-md border-border-strong bg-surface-03 text-foreground"
                        >
                          {dep.rolloutState.toUpperCase()}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono">
                        <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
                          <div className="text-text-muted text-[10px]">Desired</div>
                          <div className="text-foreground font-semibold">{dep.desiredReplicas}</div>
                        </div>
                        <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
                          <div className="text-text-muted text-[10px]">Current</div>
                          <div className="text-foreground font-semibold">{dep.currentReplicas}</div>
                        </div>
                        <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
                          <div className="text-text-muted text-[10px]">Ready</div>
                          <div className="text-foreground font-semibold">{dep.readyReplicas}</div>
                        </div>
                        <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
                          <div className="text-text-muted text-[10px]">Available</div>
                          <div className="text-foreground font-semibold">{dep.availableReplicas}</div>
                        </div>
                        <div className="p-2 rounded-md bg-surface-02 border border-border-subtle">
                          <div className="text-text-muted text-[10px]">Updated</div>
                          <div className="text-foreground font-semibold">{dep.updatedReplicas}</div>
                        </div>
                      </div>

                      {dep.rolloutFailureReason && (
                        <div className="p-2 rounded-md bg-destructive/10 border border-destructive/50 text-[11px] font-mono text-destructive">
                          {dep.rolloutFailureReason}
                        </div>
                      )}

                      {/* ReplicaSets */}
                      <div className="space-y-1.5">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                          ReplicaSets ({depRs.length})
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {depRs.map((rs) => (
                            <div
                              key={rs.id}
                              className="p-2 rounded-md bg-surface-02 border border-border-subtle text-[11px] font-mono flex items-center justify-between"
                            >
                              <div>
                                <div className="font-semibold text-foreground">{rs.id}</div>
                                <div className="text-[10px] text-text-muted">{rs.template.image}</div>
                              </div>
                              <div className="text-right">
                                <div className="text-foreground">
                                  {rs.readyReplicas}/{rs.currentReplicas} ready
                                </div>
                                <div className="text-[10px] text-text-muted">rev {rs.revision}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Revision History */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-mono uppercase tracking-wider text-text-muted">
                          Revision History
                        </div>
                        {history.map((entry, idx) => (
                          <div
                            key={idx}
                            className="text-[10px] font-mono text-text-secondary px-2 py-1 rounded-md bg-surface-02 border border-border-subtle"
                          >
                            <span className="text-foreground font-semibold">
                              [+{entry.atMs}ms · rev {entry.revision}]
                            </span>{" "}
                            {entry.summary}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "probes" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {podsList.map((pod) => (
                  <div
                    key={pod.id}
                    className="p-3 bg-surface-01 border border-border-default rounded-md space-y-2 text-[11px] font-mono"
                  >
                    <div className="flex items-center justify-between border-b border-border-subtle pb-1.5">
                      <span className="font-semibold text-foreground">{pod.name}</span>
                      <div className="flex items-center gap-1.5">
                        {pod.container.inCrashLoopBackOff && (
                          <Badge
                            variant="outline"
                            className="text-[9px] border-destructive/60 text-destructive bg-destructive/10 rounded-md"
                          >
                            CrashLoopBackOff
                          </Badge>
                        )}
                        {pod.container.terminationReason && (
                          <Badge
                            variant="outline"
                            className="text-[9px] border-border-strong text-text-secondary bg-surface-03 rounded-md"
                          >
                            {pod.container.terminationReason}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px]">
                      <div className="p-1.5 rounded-md bg-surface-02 border border-border-subtle">
                        <div className="text-text-muted">Container</div>
                        <div className="text-foreground font-semibold">{pod.container.state}</div>
                      </div>
                      <div className="p-1.5 rounded-md bg-surface-02 border border-border-subtle">
                        <div className="text-text-muted">Restarts</div>
                        <div className="text-foreground font-semibold">{pod.container.restartCount}</div>
                      </div>
                      <div className="p-1.5 rounded-md bg-surface-02 border border-border-subtle">
                        <div className="text-text-muted">Readiness</div>
                        <div className="text-foreground font-semibold">
                          {pod.ready ? "READY" : "NOT READY"}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-[10px] pt-1">
                      <div className="text-text-secondary">
                        Startup: {pod.probeState.startupPassed ? "Pass" : "Pending"} (
                        {pod.probeState.startupAttempts})
                      </div>
                      <div className="text-text-secondary">
                        Readiness: {pod.probeState.readinessAttempts} checks (fail streak{" "}
                        {pod.probeState.readinessFailureStreak})
                      </div>
                      <div className="text-text-secondary">
                        Liveness: {pod.probeState.livenessAttempts} checks (fail streak{" "}
                        {pod.probeState.livenessFailureStreak})
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "services" && (
              <div className="space-y-3">
                {servicesList.map((svc) => (
                  <div
                    key={svc.id}
                    className="p-3 bg-surface-01 border border-border-default rounded-md space-y-3 text-[11px] font-mono"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-subtle pb-2">
                      <div className="flex items-center gap-2">
                        <ShieldIcon className="w-3.5 h-3.5 text-text-secondary" />
                        <span className="font-semibold text-foreground">
                          Service/{svc.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] border-border-strong bg-surface-03 rounded-md"
                        >
                          {svc.type} · {svc.virtualIp}
                        </Badge>
                      </div>
                      <div className="text-[10px] text-text-muted">
                        Routed: {svc.routedRequestCount} · No-Endpoint Errs:{" "}
                        {svc.failedNoEndpointCount} · DNS Delay: {svc.dnsResolutionDelayMs}ms
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1">
                        <div className="text-[10px] text-text-muted">
                          Eligible Ready Endpoints ({svc.eligibleEndpointPodIds.length})
                        </div>
                        {svc.eligibleEndpointPodIds.length === 0 ? (
                          <div className="text-[10px] text-destructive">
                            0 ready endpoints — traffic rejected with 503 / no endpoints
                          </div>
                        ) : (
                          svc.eligibleEndpointPodIds.map((pid) => (
                            <div
                              key={pid}
                              className="px-2 py-1 rounded-md bg-surface-03 border border-border-default text-foreground text-[10px]"
                            >
                              {k8sState.pods[pid]?.name} (Node:{" "}
                              {k8sState.nodes[k8sState.pods[pid]?.assignedNodeId || ""]?.name})
                            </div>
                          ))
                        )}
                      </div>

                      <div className="p-2 rounded-md bg-surface-02 border border-border-subtle space-y-1">
                        <div className="text-[10px] text-text-muted">
                          Excluded Non-Ready Pods ({svc.nonReadyPodIds.length})
                        </div>
                        {svc.nonReadyPodIds.length === 0 ? (
                          <div className="text-[10px] text-text-disabled">None</div>
                        ) : (
                          svc.nonReadyPodIds.map((pid) => (
                            <div
                              key={pid}
                              className="px-2 py-1 rounded-md bg-surface-03 border border-border-subtle text-text-muted text-[10px]"
                            >
                              {k8sState.pods[pid]?.name} ({k8sState.pods[pid]?.phase})
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === "hpa_rollout" && (
              <div className="space-y-4 text-[11px] font-mono">
                <div className="p-3 bg-surface-01 border border-border-default rounded-md space-y-2">
                  <div className="flex items-center gap-2 border-b border-border-subtle pb-2">
                    <ActivityIcon className="w-3.5 h-3.5 text-text-secondary" />
                    <span className="font-semibold text-foreground">
                      Horizontal Pod Autoscaling (HPA) Controllers
                    </span>
                  </div>
                  {hpasList.length === 0 ? (
                    <p className="text-text-muted text-[11px]">
                      No HPA policy enabled in the active scenario. Try "HPA Scale-Out" or "HPA Scale-In & Stabilization".
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {hpasList.map((hpa) => (
                        <div
                          key={hpa.deploymentId}
                          className="p-2.5 rounded-md bg-surface-02 border border-border-subtle space-y-1.5"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-foreground">
                              HPA &rarr; Deployment/{hpa.deploymentId}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[10px] border-border-strong bg-surface-03 rounded-md"
                            >
                              Desired {hpa.desiredReplicas} (Min {hpa.minReplicas} / Max {hpa.maxReplicas})
                            </Badge>
                          </div>
                          <div className="text-text-secondary">
                            Observed CPU: {hpa.observedCpuUtilizationPct}% · Target:{" "}
                            {hpa.targetCpuUtilizationPct}% · Recommended: {hpa.recommendedReplicas}
                            {hpa.stabilizationActive ? " · Stabilization Window Active" : ""}
                          </div>
                          <div className="text-[10px] text-text-muted">{hpa.lastDecisionReason}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rolling Update Bounds Info */}
                <div className="p-3 bg-surface-01 border border-border-default rounded-md space-y-2">
                  <div className="font-semibold text-foreground border-b border-border-subtle pb-2">
                    Configured Rolling Update Strategies
                  </div>
                  {activeScenario.deployments.map((dep) => (
                    <div
                      key={dep.id}
                      className="p-2.5 rounded-md bg-surface-02 border border-border-subtle flex flex-wrap items-center justify-between gap-2"
                    >
                      <div>
                        <span className="text-foreground font-semibold">{dep.name}</span>{" "}
                        <span className="text-text-muted">({dep.strategy.type})</span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-text-secondary">
                        <span>maxSurge: {String(dep.strategy.maxSurge)}</span>
                        <span>maxUnavailable: {String(dep.strategy.maxUnavailable)}</span>
                        <span>progressDeadline: {dep.strategy.progressDeadlineMs}ms</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function MetricTile({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="px-2.5 py-1.5 bg-surface-02 border border-border-subtle rounded-md">
      <div className="text-[10px] font-mono text-text-muted truncate">{label}</div>
      <div
        className={cn(
          "text-xs font-mono font-semibold truncate",
          highlight ? "text-warning" : "text-foreground"
        )}
      >
        {value}
      </div>
      {sub && <div className="text-[9px] font-mono text-text-disabled truncate">{sub}</div>}
    </div>
  );
}
