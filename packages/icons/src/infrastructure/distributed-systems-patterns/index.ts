export * from "./circuit-breaker-icon";
export * from "./bulkhead-icon";
export * from "./retry-controller-icon";
export * from "./saga-orchestrator-icon";
export * from "./leader-election-icon";
export * from "./distributed-lock-icon";
export * from "./consensus-coordinator-icon";
export * from "./idempotency-service-icon";
export * from "./distributed-scheduler-icon";
export * from "./service-registry-icon";

import { CircuitBreakerIcon } from "./circuit-breaker-icon";
import { BulkheadIcon } from "./bulkhead-icon";
import { RetryControllerIcon } from "./retry-controller-icon";
import { SagaOrchestratorIcon } from "./saga-orchestrator-icon";
import { LeaderElectionIcon } from "./leader-election-icon";
import { DistributedLockIcon } from "./distributed-lock-icon";
import { ConsensusCoordinatorIcon } from "./consensus-coordinator-icon";
import { IdempotencyServiceIcon } from "./idempotency-service-icon";
import { DistributedSchedulerIcon } from "./distributed-scheduler-icon";
import { ServiceRegistryIcon } from "./service-registry-icon";
import type { InfrastructureIconComponent } from "../types";

export const distributedSystemsPatternsIconRegistry: Record<string, InfrastructureIconComponent> = {
  "circuit-breaker": CircuitBreakerIcon,
  "bulkhead": BulkheadIcon,
  "retry-controller": RetryControllerIcon,
  "saga-orchestrator": SagaOrchestratorIcon,
  "leader-election": LeaderElectionIcon,
  "distributed-lock": DistributedLockIcon,
  "consensus-coordinator": ConsensusCoordinatorIcon,
  "idempotency-service": IdempotencyServiceIcon,
  "distributed-scheduler": DistributedSchedulerIcon,
  "service-registry": ServiceRegistryIcon,
};

export function getDistributedSystemsPatternsIcon(slug: string): InfrastructureIconComponent | undefined {
  return distributedSystemsPatternsIconRegistry[slug];
}
