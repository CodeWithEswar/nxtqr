import type { BaseExecutionEvent } from "../domain/execution-event";
import type {
  MeshFallbackMode,
  MeshProtocol,
  MeshTraceSpan,
} from "./service-mesh-schemas";

export interface MeshDiscoveryLookupStartedEvent extends BaseExecutionEvent {
  type: "mesh.discovery.lookup.started";
  requestId: string;
  serviceId: string;
}

export interface MeshDiscoveryCacheHitEvent extends BaseExecutionEvent {
  type: "mesh.discovery.cache.hit";
  requestId: string;
  serviceId: string;
  endpointIds: string[];
}

export interface MeshDiscoveryCacheMissEvent extends BaseExecutionEvent {
  type: "mesh.discovery.cache.miss";
  requestId: string;
  serviceId: string;
}

export interface MeshDiscoveryEndpointsResolvedEvent extends BaseExecutionEvent {
  type: "mesh.discovery.endpoints.resolved";
  requestId: string;
  serviceId: string;
  endpointIds: string[];
}

export interface MeshDiscoveryEndpointUpdatedEvent extends BaseExecutionEvent {
  type: "mesh.discovery.endpoint.updated";
  serviceId: string;
  instanceId: string;
  healthy: boolean;
}

export interface MeshDiscoveryFailedEvent extends BaseExecutionEvent {
  type: "mesh.discovery.failed";
  requestId: string;
  serviceId: string;
  reason: string;
}

export interface MeshRequestCreatedEvent extends BaseExecutionEvent {
  type: "mesh.request.created";
  requestId: string;
  sourceServiceId: string;
  destinationServiceId: string;
  protocol: MeshProtocol;
  operation: string;
}

export interface MeshProxyOutboundEnteredEvent extends BaseExecutionEvent {
  type: "mesh.proxy.outbound.entered";
  requestId: string;
  proxyId: string;
  serviceId: string;
}

export interface MeshRoutingCompletedEvent extends BaseExecutionEvent {
  type: "mesh.routing.completed";
  requestId: string;
  destinationServiceId: string;
  selectedInstanceId?: string;
  selectedRevision?: string;
  matchedRuleId?: string;
}

export interface MeshMtlsHandshakeStartedEvent extends BaseExecutionEvent {
  type: "mesh.mtls.handshake.started";
  requestId: string;
  clientIdentity: string;
  serverIdentity: string;
}

export interface MeshMtlsHandshakeCompletedEvent extends BaseExecutionEvent {
  type: "mesh.mtls.handshake.completed";
  requestId: string;
  clientIdentity: string;
  serverIdentity: string;
}

export interface MeshMtlsHandshakeFailedEvent extends BaseExecutionEvent {
  type: "mesh.mtls.handshake.failed";
  requestId: string;
  clientIdentity: string;
  serverIdentity: string;
  reason: string;
}

export interface MeshAuthorizationStartedEvent extends BaseExecutionEvent {
  type: "mesh.authorization.started";
  requestId: string;
  sourceIdentity: string;
  destinationServiceId: string;
  operation: string;
}

export interface MeshAuthorizationAllowedEvent extends BaseExecutionEvent {
  type: "mesh.authorization.allowed";
  requestId: string;
  ruleId: string;
}

export interface MeshAuthorizationDeniedEvent extends BaseExecutionEvent {
  type: "mesh.authorization.denied";
  requestId: string;
  ruleId: string;
  reason: string;
}

export interface MeshConnectionAcquireStartedEvent extends BaseExecutionEvent {
  type: "mesh.connection.acquire.started";
  requestId: string;
  proxyId: string;
  targetServiceId: string;
}

export interface MeshConnectionReusedEvent extends BaseExecutionEvent {
  type: "mesh.connection.reused";
  requestId: string;
  proxyId: string;
  targetServiceId: string;
}

export interface MeshConnectionCreatedEvent extends BaseExecutionEvent {
  type: "mesh.connection.created";
  requestId: string;
  proxyId: string;
  targetServiceId: string;
}

export interface MeshConnectionAcquireFailedEvent extends BaseExecutionEvent {
  type: "mesh.connection.acquire.failed";
  requestId: string;
  proxyId: string;
  targetServiceId: string;
  reason: string;
}

export interface MeshConnectionReleasedEvent extends BaseExecutionEvent {
  type: "mesh.connection.released";
  requestId: string;
  proxyId: string;
  targetServiceId: string;
}

export interface MeshProxyInboundEnteredEvent extends BaseExecutionEvent {
  type: "mesh.proxy.inbound.entered";
  requestId: string;
  proxyId: string;
  serviceId: string;
}

export interface MeshServiceProcessingStartedEvent extends BaseExecutionEvent {
  type: "mesh.service.processing.started";
  requestId: string;
  serviceId: string;
  instanceId: string;
}

export interface MeshServiceProcessingCompletedEvent extends BaseExecutionEvent {
  type: "mesh.service.processing.completed";
  requestId: string;
  serviceId: string;
  instanceId: string;
  span: MeshTraceSpan;
}

export interface MeshTimeoutAttemptExpiredEvent extends BaseExecutionEvent {
  type: "mesh.timeout.attempt.expired";
  requestId: string;
  serviceId: string;
  timeoutMs: number;
}

export interface MeshTimeoutDeadlineExpiredEvent extends BaseExecutionEvent {
  type: "mesh.timeout.deadline.expired";
  requestId: string;
  serviceId: string;
  deadlineAtMs: number;
}

export interface MeshRetryScheduledEvent extends BaseExecutionEvent {
  type: "mesh.retry.scheduled";
  requestId: string;
  destinationServiceId: string;
  attempt: number;
  backoffMs: number;
}

export interface MeshRetryExhaustedEvent extends BaseExecutionEvent {
  type: "mesh.retry.exhausted";
  requestId: string;
  destinationServiceId: string;
  attempts: number;
}

export interface MeshRetrySuppressedEvent extends BaseExecutionEvent {
  type: "mesh.retry.suppressed";
  requestId: string;
  destinationServiceId: string;
  reason: string;
}

export interface MeshCircuitRequestAllowedEvent extends BaseExecutionEvent {
  type: "mesh.circuit.request.allowed";
  requestId: string;
  scopeKey: string;
  state: "closed" | "half_open";
}

export interface MeshCircuitRequestRejectedEvent extends BaseExecutionEvent {
  type: "mesh.circuit.request.rejected";
  requestId: string;
  scopeKey: string;
  state: "open" | "half_open";
}

export interface MeshCircuitOpenedEvent extends BaseExecutionEvent {
  type: "mesh.circuit.opened";
  scopeKey: string;
  serviceId: string;
  failureRatePct: number;
}

export interface MeshCircuitHalfOpenedEvent extends BaseExecutionEvent {
  type: "mesh.circuit.half_opened";
  scopeKey: string;
  serviceId: string;
}

export interface MeshCircuitClosedEvent extends BaseExecutionEvent {
  type: "mesh.circuit.closed";
  scopeKey: string;
  serviceId: string;
}

export interface MeshBulkheadSlotAcquiredEvent extends BaseExecutionEvent {
  type: "mesh.bulkhead.slot.acquired";
  requestId: string;
  serviceId: string;
  activeCount: number;
}

export interface MeshBulkheadQueuedEvent extends BaseExecutionEvent {
  type: "mesh.bulkhead.queued";
  requestId: string;
  serviceId: string;
  queuedCount: number;
}

export interface MeshBulkheadRejectedEvent extends BaseExecutionEvent {
  type: "mesh.bulkhead.rejected";
  requestId: string;
  serviceId: string;
}

export interface MeshBulkheadSlotReleasedEvent extends BaseExecutionEvent {
  type: "mesh.bulkhead.slot.released";
  requestId: string;
  serviceId: string;
}

export interface MeshTrafficSplitEvaluatedEvent extends BaseExecutionEvent {
  type: "mesh.traffic_split.evaluated";
  requestId: string;
  destinationServiceId: string;
  selectedRevision: string;
}

export interface MeshCanaryEvaluationStartedEvent extends BaseExecutionEvent {
  type: "mesh.canary.evaluation.started";
  serviceId: string;
  canaryPct: number;
  canaryErrorRatePct: number;
}

export interface MeshCanaryPromotedEvent extends BaseExecutionEvent {
  type: "mesh.canary.promoted";
  serviceId: string;
  newCanaryPct: number;
}

export interface MeshCanaryRollbackCompletedEvent extends BaseExecutionEvent {
  type: "mesh.canary.rollback.completed";
  serviceId: string;
  reason: string;
}

export interface MeshFailurePropagatedEvent extends BaseExecutionEvent {
  type: "mesh.failure.propagated";
  requestId: string;
  fromServiceId: string;
  toServiceId: string;
  reason: string;
}

export interface MeshFallbackActivatedEvent extends BaseExecutionEvent {
  type: "mesh.fallback.activated";
  requestId: string;
  serviceId: string;
  mode: MeshFallbackMode;
}

export interface MeshResponseDeliveredEvent extends BaseExecutionEvent {
  type: "mesh.response.delivered";
  requestId: string;
  serviceId: string;
  status: "success" | "degraded" | "failed" | "rejected";
}

export type ServiceMeshExecutionEvent =
  | MeshDiscoveryLookupStartedEvent
  | MeshDiscoveryCacheHitEvent
  | MeshDiscoveryCacheMissEvent
  | MeshDiscoveryEndpointsResolvedEvent
  | MeshDiscoveryEndpointUpdatedEvent
  | MeshDiscoveryFailedEvent
  | MeshRequestCreatedEvent
  | MeshProxyOutboundEnteredEvent
  | MeshRoutingCompletedEvent
  | MeshMtlsHandshakeStartedEvent
  | MeshMtlsHandshakeCompletedEvent
  | MeshMtlsHandshakeFailedEvent
  | MeshAuthorizationStartedEvent
  | MeshAuthorizationAllowedEvent
  | MeshAuthorizationDeniedEvent
  | MeshConnectionAcquireStartedEvent
  | MeshConnectionReusedEvent
  | MeshConnectionCreatedEvent
  | MeshConnectionAcquireFailedEvent
  | MeshConnectionReleasedEvent
  | MeshProxyInboundEnteredEvent
  | MeshServiceProcessingStartedEvent
  | MeshServiceProcessingCompletedEvent
  | MeshTimeoutAttemptExpiredEvent
  | MeshTimeoutDeadlineExpiredEvent
  | MeshRetryScheduledEvent
  | MeshRetryExhaustedEvent
  | MeshRetrySuppressedEvent
  | MeshCircuitRequestAllowedEvent
  | MeshCircuitRequestRejectedEvent
  | MeshCircuitOpenedEvent
  | MeshCircuitHalfOpenedEvent
  | MeshCircuitClosedEvent
  | MeshBulkheadSlotAcquiredEvent
  | MeshBulkheadQueuedEvent
  | MeshBulkheadRejectedEvent
  | MeshBulkheadSlotReleasedEvent
  | MeshTrafficSplitEvaluatedEvent
  | MeshCanaryEvaluationStartedEvent
  | MeshCanaryPromotedEvent
  | MeshCanaryRollbackCompletedEvent
  | MeshFailurePropagatedEvent
  | MeshFallbackActivatedEvent
  | MeshResponseDeliveredEvent;

