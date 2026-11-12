# Compatibility & Capability Contract Matrix (Phase 05.4.1–05.4.25)

All 24 capabilities are canonically registered in `CANONICAL_SIMULATION_CAPABILITIES` (`packages/architecture-execution/src/orchestrator/capability-registry.ts`).

| Phase | Capability ID | Required Node Types (Any) | Determinism | Workspace Drawer | Modeling Scope |
| --- | --- | --- | --- | --- | --- |
| 05.4.1 | `core-flow` | Any graph | Verified | `ExecutionTimeline` | Discrete hop traversal on directed edges |
| 05.4.2 | `request-lifecycle` | `service`, `api-gateway` | Verified | `ExecutionInspector` | Synthetic HTTP request/response propagation |
| 05.4.3 | `routing-lb` | `load-balancer`, `api-gateway`, `queue` | Verified | `DistributedTimeline` | Parallel fan-out/fan-in with priority queue |
| 05.4.4 | `resilience` | `service`, `database` | Verified | `FaultInspector` | Fault injection, retries, breakers, failover |
| 05.4.5 | `traffic` | `service`, `api-gateway` | Verified | `PerformanceWorkspace` | Constant/burst/step workload queuing |
| 05.4.6 | `database` | `database` | Verified | `DatabaseExecutionWorkspace` | Logical SQL plans, B-tree scans, WAL replication |
| 05.4.7 | `cache` | `cache` | Verified | `CacheExecutionWorkspace` | Cache-aside, write-through/behind, LRU/LFU |
| 05.4.8 | `security` | `api-gateway`, `service`, `security` | Verified | `SecurityExecutionWorkspace` | WAF, JWT/OAuth, RBAC deny short-circuit |
| 05.4.9 | `streaming` | `queue`, `stream`, `kafka` | Verified | `StreamingExecutionWorkspace` | Partitioned logs, rebalancing, lag, DLQ |
| 05.4.10 | `kubernetes` | `service`, `container`, `kubernetes`, `worker` | Verified | `KubernetesExecutionWorkspace` | Pod scheduling, HPA, rolling updates |
| 05.4.11 | `global-network` | `dns`, `cdn`, `client`, `api-gateway` | Verified | `GlobalNetworkWorkspace` | Geo-DNS, POP edge hits, WAN RTT |
| 05.4.12 | `service-mesh` | `service`, `load-balancer` | Verified | `ServiceMeshWorkspace` | mTLS, outlier ejection, canary splits |
| 05.4.13 | `raft` | `database`, `consensus`, `storage` | Verified | `RaftWorkspace` | Term elections & commit quorum safety |
| 05.4.14 | `distributed-transactions` | `service`, `database` | Verified | `DistributedTransactionWorkspace` | 2PC voting & Saga compensations |
| 05.4.15 | `distributed-storage` | `database`, `storage` | Verified | `DistributedStorageWorkspace` | Consistent hash rings, N/R/W quorums |
| 05.4.16 | `traffic-control` | `api-gateway`, `load-balancer`, `rate-limiter` | Verified | `TrafficControlWorkspace` | Token bucket refills, 429 load shedding |
| 05.4.17 | `observability` | Optional multi-tier nodes | Verified | `ObservabilityWorkspace` | Correlated spans, RED metrics, burn rates |
| 05.4.18 | `zero-trust` | `api-gateway`, `service`, `security` | Verified | `ZeroTrustWorkspace` | SPIFFE identity, least privilege, attack graph |
| 05.4.19 | `deployment` | `load-balancer`, `api-gateway`, `service` | Verified | `DeploymentWorkspace` | Canary gates, blue-green swaps, auto-rollback |
| 05.4.20 | `disaster-recovery` | `database`, `storage`, `dns`, `load-balancer` | Verified | `DisasterRecoveryWorkspace` | Multi-region failover, RPO/RTO evaluation |
| 05.4.21 | `capacity` | `service`, `database`, `api-gateway` | Verified | `CapacityWorkspace` | Analytical M/M/1 & M/M/c + synthetic cost |
| 05.4.22 | `architecture-analysis` | Any graph | Verified | `AnalysisWorkspace` | Baseline vs candidate diffs, SPOF findings |
| 05.4.23 | `practice-labs` | Any graph | Verified | `PracticeWorkspace` | Challenges, estimation, evidence grading |
| 05.4.24 | `templates` | Any graph | Verified | `TemplatesWorkspace` | Versioned reference templates & JSON library |

## Composable Multi-Layer Flow (`CrossModuleExecutionPipeline`)
1. Executes traversed layers in deterministic sequence:
   `DNS -> CDN -> API Gateway -> Auth / Zero Trust -> Rate Limiter -> Load Balancer -> Service Mesh -> Service -> Cache / Database / Queue -> Observability`
2. **Causal Invariants**:
   - Auth/Zero Trust denial terminates execution immediately (`403 Forbidden`), issuing zero downstream compute/cache/database events.
   - Rate limiter saturation (`incomingRps > capacityRps`) emits `429 Too Many Requests`.
   - Downstream `database_outage` or `service_degraded` faults propagate into HTTP `500/503`, Observability error budgets, and critical deduplicated findings.
   - Delivered throughput cannot exceed the constrained bottleneck tier capacity (`min(capacityRps)`).

