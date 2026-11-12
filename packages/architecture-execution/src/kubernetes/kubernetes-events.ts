import type { BaseExecutionEvent } from "../domain/execution-event";
import type { SchedulerDecision, PodPhase } from "./kubernetes-schemas";

export interface K8sPodCreatedEvent extends BaseExecutionEvent {
  type: "k8s.pod.created";
  podId: string;
  podName: string;
  deploymentId?: string;
  replicaSetId?: string;
  revision: number;
}

export interface K8sPodPendingEvent extends BaseExecutionEvent {
  type: "k8s.pod.pending";
  podId: string;
  podName: string;
  reason: string;
}

export interface K8sPodScheduledEvent extends BaseExecutionEvent {
  type: "k8s.pod.scheduled";
  podId: string;
  podName: string;
  nodeId: string;
  nodeName: string;
  decision: SchedulerDecision;
}

export interface K8sPodRunningEvent extends BaseExecutionEvent {
  type: "k8s.pod.running";
  podId: string;
  podName: string;
  nodeId: string;
}

export interface K8sPodReadyEvent extends BaseExecutionEvent {
  type: "k8s.pod.ready";
  podId: string;
  podName: string;
  nodeId: string;
}

export interface K8sPodNotReadyEvent extends BaseExecutionEvent {
  type: "k8s.pod.not_ready";
  podId: string;
  podName: string;
  reason: string;
}

export interface K8sPodFailedEvent extends BaseExecutionEvent {
  type: "k8s.pod.failed";
  podId: string;
  podName: string;
  phase: PodPhase;
  reason: string;
}

export interface K8sPodDeletedEvent extends BaseExecutionEvent {
  type: "k8s.pod.deleted";
  podId: string;
  podName: string;
  reason: string;
}

export interface K8sPodEvictedEvent extends BaseExecutionEvent {
  type: "k8s.pod.evicted";
  podId: string;
  podName: string;
  nodeId: string;
  reason: string;
}

export interface K8sContainerStartRequestedEvent extends BaseExecutionEvent {
  type: "k8s.container.start.requested";
  podId: string;
  containerId: string;
  image: string;
}

export interface K8sContainerStartingEvent extends BaseExecutionEvent {
  type: "k8s.container.starting";
  podId: string;
  containerId: string;
  startupDelayMs: number;
}

export interface K8sContainerRunningEvent extends BaseExecutionEvent {
  type: "k8s.container.running";
  podId: string;
  containerId: string;
}

export interface K8sContainerTerminatedEvent extends BaseExecutionEvent {
  type: "k8s.container.terminated";
  podId: string;
  containerId: string;
  reason: string;
  exitCode: number;
}

export interface K8sContainerRestartRequestedEvent extends BaseExecutionEvent {
  type: "k8s.container.restart.requested";
  podId: string;
  containerId: string;
  restartCount: number;
  backoffMs: number;
  inCrashLoopBackOff: boolean;
}

export interface K8sSchedulerStartedEvent extends BaseExecutionEvent {
  type: "k8s.scheduler.started";
  podId: string;
  podName: string;
  candidateCount: number;
}

export interface K8sSchedulerNodeFilteredEvent extends BaseExecutionEvent {
  type: "k8s.scheduler.node.filtered";
  podId: string;
  nodeId: string;
  nodeName: string;
  eligible: boolean;
  reasons: string[];
}

export interface K8sSchedulerNodeScoredEvent extends BaseExecutionEvent {
  type: "k8s.scheduler.node.scored";
  podId: string;
  nodeId: string;
  nodeName: string;
  score: number;
  reason: string;
}

export interface K8sSchedulerNodeSelectedEvent extends BaseExecutionEvent {
  type: "k8s.scheduler.node.selected";
  podId: string;
  nodeId: string;
  nodeName: string;
  score: number;
}

export interface K8sSchedulerPodUnschedulableEvent extends BaseExecutionEvent {
  type: "k8s.scheduler.pod.unschedulable";
  podId: string;
  podName: string;
  decision: SchedulerDecision;
}

export interface K8sSchedulerBindingCompletedEvent extends BaseExecutionEvent {
  type: "k8s.scheduler.binding.completed";
  podId: string;
  nodeId: string;
  reservedCpuMillicores: number;
  reservedMemoryMiB: number;
}

export interface K8sControllerReconcileStartedEvent extends BaseExecutionEvent {
  type: "k8s.controller.reconcile.started";
  deploymentId: string;
  desiredReplicas: number;
  observedReplicas: number;
}

export interface K8sControllerReplicaDeficitEvent extends BaseExecutionEvent {
  type: "k8s.controller.replica.deficit";
  deploymentId: string;
  deficit: number;
}

export interface K8sControllerReplicaExcessEvent extends BaseExecutionEvent {
  type: "k8s.controller.replica.excess";
  deploymentId: string;
  excess: number;
}

export interface K8sControllerPodCreateRequestedEvent extends BaseExecutionEvent {
  type: "k8s.controller.pod.create.requested";
  deploymentId: string;
  replicaSetId: string;
  podId: string;
}

export interface K8sControllerPodDeleteRequestedEvent extends BaseExecutionEvent {
  type: "k8s.controller.pod.delete.requested";
  deploymentId: string;
  replicaSetId: string;
  podId: string;
}

export interface K8sControllerReconcileCompletedEvent extends BaseExecutionEvent {
  type: "k8s.controller.reconcile.completed";
  deploymentId: string;
  currentReplicas: number;
  readyReplicas: number;
}

export interface K8sProbeStartedEvent extends BaseExecutionEvent {
  type: "k8s.probe.started";
  podId: string;
  probeType: "startup" | "readiness" | "liveness";
  attempt: number;
}

export interface K8sProbeSucceededEvent extends BaseExecutionEvent {
  type: "k8s.probe.succeeded";
  podId: string;
  probeType: "startup" | "readiness" | "liveness";
  attempt: number;
}

export interface K8sProbeFailedEvent extends BaseExecutionEvent {
  type: "k8s.probe.failed";
  podId: string;
  probeType: "startup" | "readiness" | "liveness";
  attempt: number;
  failureStreak: number;
  threshold: number;
}

export interface K8sPodReadinessChangedEvent extends BaseExecutionEvent {
  type: "k8s.pod.readiness.changed";
  podId: string;
  ready: boolean;
  reason: string;
}

export interface K8sServiceEndpointAddedEvent extends BaseExecutionEvent {
  type: "k8s.service.endpoint.added";
  serviceId: string;
  podId: string;
  endpointCount: number;
}

export interface K8sServiceEndpointRemovedEvent extends BaseExecutionEvent {
  type: "k8s.service.endpoint.removed";
  serviceId: string;
  podId: string;
  endpointCount: number;
}

export interface K8sServiceRequestRoutedEvent extends BaseExecutionEvent {
  type: "k8s.service.request.routed";
  serviceId: string;
  targetPodId: string;
  targetNodeId: string;
}

export interface K8sServiceNoReadyEndpointsEvent extends BaseExecutionEvent {
  type: "k8s.service.no_ready_endpoints";
  serviceId: string;
  serviceName: string;
}

export interface K8sHpaEvaluationStartedEvent extends BaseExecutionEvent {
  type: "k8s.hpa.evaluation.started";
  deploymentId: string;
  currentReplicas: number;
  observedCpuPct: number;
  targetCpuPct: number;
}

export interface K8sHpaRecommendationCreatedEvent extends BaseExecutionEvent {
  type: "k8s.hpa.recommendation.created";
  deploymentId: string;
  recommendedReplicas: number;
  clampedReplicas: number;
  stabilized: boolean;
}

export interface K8sHpaScaleRequestedEvent extends BaseExecutionEvent {
  type: "k8s.hpa.scale.requested";
  deploymentId: string;
  fromReplicas: number;
  toReplicas: number;
}

export interface K8sHpaScaleAppliedEvent extends BaseExecutionEvent {
  type: "k8s.hpa.scale.applied";
  deploymentId: string;
  desiredReplicas: number;
}

export interface K8sRolloutStartedEvent extends BaseExecutionEvent {
  type: "k8s.rollout.started";
  deploymentId: string;
  oldRevision: number;
  newRevision: number;
  newImage: string;
}

export interface K8sRolloutReplicaSetCreatedEvent extends BaseExecutionEvent {
  type: "k8s.rollout.replicaset.created";
  deploymentId: string;
  replicaSetId: string;
  revision: number;
}

export interface K8sRolloutPodCreatedEvent extends BaseExecutionEvent {
  type: "k8s.rollout.pod.created";
  deploymentId: string;
  podId: string;
  revision: number;
}

export interface K8sRolloutPodReadyEvent extends BaseExecutionEvent {
  type: "k8s.rollout.pod.ready";
  deploymentId: string;
  podId: string;
  revision: number;
}

export interface K8sRolloutOldPodRemovedEvent extends BaseExecutionEvent {
  type: "k8s.rollout.old_pod.removed";
  deploymentId: string;
  podId: string;
  oldRevision: number;
}

export interface K8sRolloutCompletedEvent extends BaseExecutionEvent {
  type: "k8s.rollout.completed";
  deploymentId: string;
  revision: number;
  durationMs: number;
}

export interface K8sRolloutFailedEvent extends BaseExecutionEvent {
  type: "k8s.rollout.failed";
  deploymentId: string;
  revision: number;
  reason: string;
}

export interface K8sRollbackRequestedEvent extends BaseExecutionEvent {
  type: "k8s.rollback.requested";
  deploymentId: string;
  fromRevision: number;
  toRevision: number;
}

export interface K8sRollbackStartedEvent extends BaseExecutionEvent {
  type: "k8s.rollback.started";
  deploymentId: string;
  targetRevision: number;
}

export interface K8sRollbackCompletedEvent extends BaseExecutionEvent {
  type: "k8s.rollback.completed";
  deploymentId: string;
  activeRevision: number;
}

export interface K8sRollbackFailedEvent extends BaseExecutionEvent {
  type: "k8s.rollback.failed";
  deploymentId: string;
  reason: string;
}

export interface K8sNodeStatusChangedEvent extends BaseExecutionEvent {
  type: "k8s.node.status.changed";
  nodeId: string;
  nodeName: string;
  previousStatus: string;
  newStatus: string;
  reason: string;
}

export type KubernetesExecutionEvent =
  | K8sPodCreatedEvent
  | K8sPodPendingEvent
  | K8sPodScheduledEvent
  | K8sPodRunningEvent
  | K8sPodReadyEvent
  | K8sPodNotReadyEvent
  | K8sPodFailedEvent
  | K8sPodDeletedEvent
  | K8sPodEvictedEvent
  | K8sContainerStartRequestedEvent
  | K8sContainerStartingEvent
  | K8sContainerRunningEvent
  | K8sContainerTerminatedEvent
  | K8sContainerRestartRequestedEvent
  | K8sSchedulerStartedEvent
  | K8sSchedulerNodeFilteredEvent
  | K8sSchedulerNodeScoredEvent
  | K8sSchedulerNodeSelectedEvent
  | K8sSchedulerPodUnschedulableEvent
  | K8sSchedulerBindingCompletedEvent
  | K8sControllerReconcileStartedEvent
  | K8sControllerReplicaDeficitEvent
  | K8sControllerReplicaExcessEvent
  | K8sControllerPodCreateRequestedEvent
  | K8sControllerPodDeleteRequestedEvent
  | K8sControllerReconcileCompletedEvent
  | K8sProbeStartedEvent
  | K8sProbeSucceededEvent
  | K8sProbeFailedEvent
  | K8sPodReadinessChangedEvent
  | K8sServiceEndpointAddedEvent
  | K8sServiceEndpointRemovedEvent
  | K8sServiceRequestRoutedEvent
  | K8sServiceNoReadyEndpointsEvent
  | K8sHpaEvaluationStartedEvent
  | K8sHpaRecommendationCreatedEvent
  | K8sHpaScaleRequestedEvent
  | K8sHpaScaleAppliedEvent
  | K8sRolloutStartedEvent
  | K8sRolloutReplicaSetCreatedEvent
  | K8sRolloutPodCreatedEvent
  | K8sRolloutPodReadyEvent
  | K8sRolloutOldPodRemovedEvent
  | K8sRolloutCompletedEvent
  | K8sRolloutFailedEvent
  | K8sRollbackRequestedEvent
  | K8sRollbackStartedEvent
  | K8sRollbackCompletedEvent
  | K8sRollbackFailedEvent
  | K8sNodeStatusChangedEvent;
