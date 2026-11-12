import type {
  AnalysisComponentConfig,
  AnalysisEdgeConfig,
  AnalysisExperiment,
} from "../../analysis/analysis-schemas";
import { ArchitectureAnalysisExecutionEngine } from "../../analysis/analysis-execution-engine";
import { withComputedRevisionHash } from "../../analysis/revisions/revision-diff-engine";
import type {
  EngineeringLab,
  LabAttemptState,
  LabCompletionRule,
  LabStep,
} from "../practice-schemas";

function makeComponent(
  partial: Partial<AnalysisComponentConfig> & {
    id: string;
    label: string;
    kind: AnalysisComponentConfig["kind"];
  }
): AnalysisComponentConfig {
  const isCache = partial.kind === "cache";
  return {
    failureDomain: "az",
    region: "us-east-1",
    zone: "us-east-1a",
    multiAz: true,
    replicas: 2,
    capacityPerReplicaRps: 500,
    baseLatencyMs: isCache ? 2 : partial.kind === "database" ? 11 : 6,
    maxConnectionsPerReplica: 60,
    mtbfHours: 2400,
    mttrMinutes: 10,
    replicationMode: partial.kind === "database" ? "sync" : "none",
    replicationLagSec: 0,
    cacheStrategy: isCache ? "cache_aside" : "none",
    cacheHitRatio: isCache ? 0.85 : 0,
    monthlyCostPerReplicaUsd: 70,
    hasBackup: true,
    dependencyIds: [],
    ...partial,
  };
}

function makeEdge(
  id: string,
  source: string,
  target: string,
  retryFactor = 1.15,
  communicationMode: AnalysisEdgeConfig["communicationMode"] = "sync_http"
): AnalysisEdgeConfig {
  return {
    id,
    source,
    target,
    communicationMode,
    retryFactor,
  };
}

interface LabSeed {
  number: number;
  id: string;
  slug: string;
  title: string;
  difficulty: EngineeringLab["difficulty"];
  topic: string;
  learningObjectives: string[];
  explanation: string;
  workloadRps: number;
  fault: EngineeringLab["fault"];
  starterComponents: AnalysisComponentConfig[];
  starterEdges: AnalysisEdgeConfig[];
  steps: LabStep[];
  completionRules: LabCompletionRule[];
}

const LAB_SEEDS: LabSeed[] = [
  {
    number: 1,
    id: "lab_01_client_server",
    slug: "client-server-request-flow",
    title: "1. Understand Client-Server Request Flow",
    difficulty: "beginner",
    topic: "fundamentals",
    learningObjectives: ["Trace end-to-end request latency from ingress gateway through app tier to DB"],
    explanation: "Every hop adds serialization, network RTT, and queueing delay under Little's Law.",
    workloadRps: 250,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "gw", label: "API Gateway", kind: "gateway", replicas: 2, baseLatencyMs: 3 }),
      makeComponent({ id: "app", label: "App Server", kind: "service", replicas: 2, baseLatencyMs: 8 }),
      makeComponent({ id: "db", label: "Primary DB", kind: "database", replicas: 2, baseLatencyMs: 12 }),
    ],
    starterEdges: [makeEdge("e1", "gw", "app"), makeEdge("e2", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "read_explanation", title: "Review hop budget", instruction: "Read how network + service hops sum into p95.", expectedObservation: "Baseline latency stays below 80ms." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Execute 250 req/s trace", instruction: "Run simulation and inspect per-hop contribution.", expectedObservation: "Throughput meets 250 req/s cleanly." },
    ],
    completionRules: [
      { id: "r1", description: "Has database persistence node", predicate: "has_component_kind", targetString: "database" },
      { id: "r2", description: "Baseline p95 <= 80ms", predicate: "simulation_p95_lte", targetNumber: 80 },
      { id: "r3", description: "All lab steps verified", predicate: "steps_completed" },
    ],
  },
  {
    number: 2,
    id: "lab_02_load_balancer",
    slug: "add-load-balancer",
    title: "2. Add a Load Balancer",
    difficulty: "beginner",
    topic: "scaling",
    learningObjectives: ["Distribute ingress across redundant stateless instances cleanly"],
    explanation: "A multi-AZ load balancer removes single-instance ingress coupling.",
    workloadRps: 600,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "lb", label: "L7 Load Balancer", kind: "gateway", replicas: 2, capacityPerReplicaRps: 1500, baseLatencyMs: 2 }),
      makeComponent({ id: "app", label: "App Fleet", kind: "service", replicas: 2, capacityPerReplicaRps: 500, baseLatencyMs: 8 }),
      makeComponent({ id: "db", label: "Primary DB", kind: "database", replicas: 2, capacityPerReplicaRps: 900, baseLatencyMs: 10 }),
    ],
    starterEdges: [makeEdge("e1", "lb", "app"), makeEdge("e2", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "add_component", title: "Verify L7 Load Balancer", instruction: "Confirm gateway load balancer sits in front of stateless app servers.", expectedObservation: "Requests distribute cleanly without single-node bottleneck." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Run 600 req/s workload", instruction: "Execute simulation under 600 req/s.", expectedObservation: "Availability >= 99.0%." },
    ],
    completionRules: [
      { id: "r1", description: "Includes ingress gateway / LB component", predicate: "has_component_kind", targetString: "gateway" },
      { id: "r2", description: "Availability >= 99.0%", predicate: "simulation_availability_gte", targetNumber: 99.0 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 3,
    id: "lab_03_scale_replicas",
    slug: "scale-application-replicas",
    title: "3. Scale Application Replicas",
    difficulty: "beginner",
    topic: "capacity",
    learningObjectives: ["Scale horizontal app capacity above incoming arrival rate"],
    explanation: "Adding stateless replicas reduces queueing wait time exponentially once rho < 0.75.",
    workloadRps: 900,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "lb", label: "Ingress LB", kind: "gateway", replicas: 2, capacityPerReplicaRps: 1500, baseLatencyMs: 2 }),
      makeComponent({ id: "app", label: "App Server", kind: "service", replicas: 3, capacityPerReplicaRps: 500, baseLatencyMs: 8 }),
      makeComponent({ id: "db", label: "Primary DB", kind: "database", replicas: 2, capacityPerReplicaRps: 1000, baseLatencyMs: 10 }),
    ],
    starterEdges: [makeEdge("e1", "lb", "app"), makeEdge("e2", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "configure_property", title: "Scale app replicas", instruction: "Ensure >= 6 total replicas across services to absorb 900 req/s.", expectedObservation: "CPU utilization drops below 70%." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Validate p95 under 75ms", instruction: "Run simulation and inspect tail latency.", expectedObservation: "p95 stays <= 75ms." },
    ],
    completionRules: [
      { id: "r1", description: "At least 6 total replicas across topology", predicate: "has_min_total_replicas", targetNumber: 6 },
      { id: "r2", description: "p95 latency <= 75ms", predicate: "simulation_p95_lte", targetNumber: 75 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 4,
    id: "lab_04_read_replicas",
    slug: "database-read-replicas",
    title: "4. Introduce Database Read Replicas",
    difficulty: "beginner",
    topic: "databases",
    learningObjectives: ["Offload read-heavy queries across multiple database replicas"],
    explanation: "Multi-replica databases increase aggregate read IOPS and eliminate primary SPOF.",
    workloadRps: 750,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "gw", label: "Gateway", kind: "gateway", replicas: 2, capacityPerReplicaRps: 1200 }),
      makeComponent({ id: "app", label: "API Tier", kind: "service", replicas: 3, capacityPerReplicaRps: 500 }),
      makeComponent({ id: "db", label: "DB + Read Replicas", kind: "database", replicas: 3, capacityPerReplicaRps: 600, baseLatencyMs: 11, replicationMode: "async", multiAz: true }),
    ],
    starterEdges: [makeEdge("e1", "gw", "app"), makeEdge("e2", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "configure_property", title: "Add read replicas", instruction: "Configure database with >= 2 multi-AZ replicas.", expectedObservation: "Zero critical database SPOFs remain." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Run read-heavy load", instruction: "Verify database read throughput under 750 req/s.", expectedObservation: "p95 <= 80ms and 0 SPOFs." },
    ],
    completionRules: [
      { id: "r1", description: "Zero critical SPOFs", predicate: "simulation_max_spofs_lte", targetNumber: 0 },
      { id: "r2", description: "p95 latency <= 80ms", predicate: "simulation_p95_lte", targetNumber: 80 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 5,
    id: "lab_05_add_cache",
    slug: "add-read-through-cache",
    title: "5. Add a Cache",
    difficulty: "beginner",
    topic: "caching",
    learningObjectives: ["Serve hot keys from memory to cut DB load and tail latency"],
    explanation: "An 85% cache hit ratio cuts downstream primary DB QPS proportionally.",
    workloadRps: 1100,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "gw", label: "Gateway", kind: "gateway", replicas: 2, capacityPerReplicaRps: 1400 }),
      makeComponent({ id: "app", label: "App Tier", kind: "service", replicas: 3, capacityPerReplicaRps: 700 }),
      makeComponent({ id: "cache", label: "Redis Cluster", kind: "cache", replicas: 2, capacityPerReplicaRps: 1600, baseLatencyMs: 2, cacheHitRatio: 0.88 }),
      makeComponent({ id: "db", label: "Primary DB", kind: "database", replicas: 2, capacityPerReplicaRps: 750, baseLatencyMs: 12 }),
    ],
    starterEdges: [makeEdge("e1", "gw", "app"), makeEdge("e2", "app", "cache"), makeEdge("e3", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "add_component", title: "Attach cache-aside tier", instruction: "Ensure a replicated cache component sits before DB reads.", expectedObservation: "Effective capacity increases without adding DB replicas." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Simulate 1,100 req/s", instruction: "Run traffic trace and inspect p95.", expectedObservation: "p95 <= 85ms despite lower DB capacity." },
    ],
    completionRules: [
      { id: "r1", description: "Includes cache component", predicate: "has_cache_component" },
      { id: "r2", description: "p95 <= 85ms", predicate: "simulation_p95_lte", targetNumber: 85 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 6,
    id: "lab_06_cache_misses",
    slug: "investigate-cache-misses",
    title: "6. Investigate Cache Misses",
    difficulty: "intermediate",
    topic: "caching",
    learningObjectives: ["Observe how low hit ratios expose database capacity limits"],
    explanation: "Cache miss traffic passes straight through to persistent storage, magnifying tail latency.",
    workloadRps: 800,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "app", label: "App Service", kind: "service", replicas: 3, capacityPerReplicaRps: 600 }),
      makeComponent({ id: "cache", label: "Warm Cache", kind: "cache", replicas: 2, capacityPerReplicaRps: 1200, baseLatencyMs: 2, cacheHitRatio: 0.78 }),
      makeComponent({ id: "db", label: "Catalog DB", kind: "database", replicas: 2, capacityPerReplicaRps: 650, baseLatencyMs: 11 }),
    ],
    starterEdges: [makeEdge("e1", "app", "cache"), makeEdge("e2", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "inspect_metric", title: "Analyze cache hit offload", instruction: "Compare origin DB load with and without high hit ratio.", expectedObservation: "Higher hit ratio prevents DB saturation." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Run miss-path check", instruction: "Execute simulation under 800 req/s.", expectedObservation: "Availability >= 99.0%." },
    ],
    completionRules: [
      { id: "r1", description: "Has cache tier", predicate: "has_cache_component" },
      { id: "r2", description: "Availability >= 99.0%", predicate: "simulation_availability_gte", targetNumber: 99.0 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 7,
    id: "lab_07_cache_stampede",
    slug: "handle-cache-stampede",
    title: "7. Handle Cache Stampede",
    difficulty: "intermediate",
    topic: "caching",
    learningObjectives: ["Ensure origin DB has headroom when a hot key expires simultaneously"],
    explanation: "When cacheHitRatio collapses during a stampede, DB + bounded retries prevent meltdown.",
    workloadRps: 650,
    fault: { type: "cache_stampede", targetId: "cache" },
    starterComponents: [
      makeComponent({ id: "app", label: "API Tier", kind: "service", replicas: 3, capacityPerReplicaRps: 600 }),
      makeComponent({ id: "cache", label: "Redis Cache", kind: "cache", replicas: 2, capacityPerReplicaRps: 1200, cacheHitRatio: 0.9 }),
      makeComponent({ id: "db", label: "Origin DB (Hardened)", kind: "database", replicas: 3, capacityPerReplicaRps: 700, baseLatencyMs: 10 }),
    ],
    starterEdges: [makeEdge("e1", "app", "cache", 1.1), makeEdge("e2", "app", "db", 1.1)],
    steps: [
      { id: "s1", order: 1, kind: "run_simulation", title: "Trigger stampede fault", instruction: "Run simulation with cache_stampede injected.", expectedObservation: "Sufficient DB replicas absorb origin miss burst." },
      { id: "s2", order: 2, kind: "inspect_metric", title: "Verify bounded retries", instruction: "Inspect edge retry amplification factor <= 1.5x.", expectedObservation: "p95 stays <= 110ms without collapse." },
    ],
    completionRules: [
      { id: "r1", description: "Bounded retry factors across edges", predicate: "has_circuit_breaker_or_retry_bounded" },
      { id: "r2", description: "Stampede p95 <= 110ms", predicate: "simulation_p95_lte", targetNumber: 110 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 8,
    id: "lab_08_async_queue",
    slug: "add-asynchronous-queue",
    title: "8. Add an Asynchronous Queue",
    difficulty: "intermediate",
    topic: "messaging",
    learningObjectives: ["Decouple slow background jobs from synchronous user-facing latency"],
    explanation: "A durable queue + worker pool smooths bursty writes without blocking HTTP callers.",
    workloadRps: 700,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "gw", label: "API Gateway", kind: "gateway", replicas: 2, capacityPerReplicaRps: 1000 }),
      makeComponent({ id: "queue", label: "Event Broker", kind: "queue", replicas: 2, capacityPerReplicaRps: 1200, baseLatencyMs: 3 }),
      makeComponent({ id: "worker", label: "Async Workers", kind: "service", replicas: 3, capacityPerReplicaRps: 600, baseLatencyMs: 9 }),
    ],
    starterEdges: [makeEdge("e1", "gw", "queue", 1.1, "async_queue"), makeEdge("e2", "queue", "worker", 1.1, "async_queue")],
    steps: [
      { id: "s1", order: 1, kind: "add_component", title: "Add durable queue & worker tier", instruction: "Route asynchronous work through broker + worker pool.", expectedObservation: "Ingress returns immediately while workers drain backlog." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Validate async pipeline", instruction: "Execute 700 req/s run.", expectedObservation: "Zero SPOFs and p95 <= 80ms." },
    ],
    completionRules: [
      { id: "r1", description: "Includes async queue tier", predicate: "has_queue_or_async" },
      { id: "r2", description: "p95 <= 80ms", predicate: "simulation_p95_lte", targetNumber: 80 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 9,
    id: "lab_09_consumer_lag",
    slug: "understand-consumer-lag",
    title: "9. Understand Consumer Lag",
    difficulty: "intermediate",
    topic: "messaging",
    learningObjectives: ["Diagnose consumer saturation and match worker throughput to producer rate"],
    explanation: "When producer rate exceeds consumer capacity, lag grows monotonically until workers scale.",
    workloadRps: 850,
    fault: { type: "queue_overload", targetId: "queue" },
    starterComponents: [
      makeComponent({ id: "gw", label: "Ingest API", kind: "gateway", replicas: 2, capacityPerReplicaRps: 1200 }),
      makeComponent({ id: "queue", label: "Partitioned Stream", kind: "queue", replicas: 3, capacityPerReplicaRps: 900, baseLatencyMs: 4 }),
      makeComponent({ id: "worker", label: "Consumer Group", kind: "service", replicas: 4, capacityPerReplicaRps: 600, baseLatencyMs: 8 }),
    ],
    starterEdges: [makeEdge("e1", "gw", "queue", 1.1, "async_queue"), makeEdge("e2", "queue", "worker", 1.1, "async_queue")],
    steps: [
      { id: "s1", order: 1, kind: "inspect_component", title: "Inspect consumer parallelism", instruction: "Check worker replicas * capacityPerReplicaRps vs workload.", expectedObservation: "Scaled consumers drain lag cleanly." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Simulate stream spike", instruction: "Run simulation at 850 req/s.", expectedObservation: "Zero critical SPOFs." },
    ],
    completionRules: [
      { id: "r1", description: "Has queue & consumer tiers", predicate: "has_queue_or_async" },
      { id: "r2", description: "Zero critical SPOFs", predicate: "simulation_max_spofs_lte", targetNumber: 0 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 10,
    id: "lab_10_rate_limiting",
    slug: "configure-rate-limiting",
    title: "10. Configure Rate Limiting",
    difficulty: "intermediate",
    topic: "traffic_control",
    learningObjectives: ["Shed excess traffic at API gateway before backend saturation"],
    explanation: "Early admission control preserves latency for accepted requests during overload.",
    workloadRps: 750,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "gw", label: "Rate-Limiting Gateway", kind: "gateway", replicas: 3, capacityPerReplicaRps: 900, baseLatencyMs: 3 }),
      makeComponent({ id: "cache", label: "Token Bucket Store", kind: "cache", replicas: 2, capacityPerReplicaRps: 1500, baseLatencyMs: 1 }),
      makeComponent({ id: "app", label: "Protected Backend", kind: "service", replicas: 3, capacityPerReplicaRps: 600, baseLatencyMs: 8 }),
    ],
    starterEdges: [makeEdge("e1", "gw", "cache"), makeEdge("e2", "gw", "app")],
    steps: [
      { id: "s1", order: 1, kind: "configure_property", title: "Enable edge rate limiter", instruction: "Place multi-AZ gateway + memory counter before app tier.", expectedObservation: "Admission checks remain bounded." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Verify stable p95", instruction: "Simulate 750 req/s.", expectedObservation: "p95 <= 70ms." },
    ],
    completionRules: [
      { id: "r1", description: "API Gateway protection enabled", predicate: "has_rate_limit_or_auth" },
      { id: "r2", description: "p95 <= 70ms", predicate: "simulation_p95_lte", targetNumber: 70 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 11,
    id: "lab_11_gateway_auth",
    slug: "api-gateway-authentication",
    title: "11. Simulate API Gateway Authentication",
    difficulty: "intermediate",
    topic: "security",
    learningObjectives: ["Enforce zero-trust token verification on edge and downstream hops"],
    explanation: "Verifying tokens and identity metadata at each boundary prevents lateral privilege escalation.",
    workloadRps: 550,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "gw", label: "Zero-Trust Gateway", kind: "gateway", replicas: 2, capacityPerReplicaRps: 1000 }),
      makeComponent({ id: "app", label: "Orders Service", kind: "service", replicas: 2, capacityPerReplicaRps: 600 }),
      makeComponent({ id: "db", label: "Orders DB", kind: "database", replicas: 2, capacityPerReplicaRps: 800 }),
    ],
    starterEdges: [makeEdge("e1", "gw", "app"), makeEdge("e2", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "inspect_component", title: "Verify gateway trust boundary", instruction: "Ensure replicated gateway sits before internal services.", expectedObservation: "Security boundary is consistent end-to-end." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Run authenticated workload", instruction: "Simulate 550 req/s.", expectedObservation: "Availability >= 99.0%." },
    ],
    completionRules: [
      { id: "r1", description: "Gateway auth boundary active", predicate: "has_rate_limit_or_auth" },
      { id: "r2", description: "Availability >= 99.0%", predicate: "simulation_availability_gte", targetNumber: 99.0 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 12,
    id: "lab_12_db_conn_exhaustion",
    slug: "database-connection-exhaustion",
    title: "12. Investigate Database Connection Exhaustion",
    difficulty: "intermediate",
    topic: "databases",
    learningObjectives: ["Relieve hot primary DB contention using cache + read scaling"],
    explanation: "Direct unbounded app-to-DB connections queue linearly once connection pool slots fill.",
    workloadRps: 900,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "app", label: "Pooled App Fleet", kind: "service", replicas: 3, capacityPerReplicaRps: 600 }),
      makeComponent({ id: "cache", label: "Query Cache", kind: "cache", replicas: 2, capacityPerReplicaRps: 1400, cacheHitRatio: 0.8 }),
      makeComponent({ id: "db", label: "Primary + Pooled Replicas", kind: "database", replicas: 3, capacityPerReplicaRps: 700, baseLatencyMs: 11 }),
    ],
    starterEdges: [makeEdge("e1", "app", "cache"), makeEdge("e2", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "inspect_metric", title: "Measure DB pool pressure", instruction: "Confirm DB utilization stays safely under saturation.", expectedObservation: "Pool queues remain bounded." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Run 900 req/s check", instruction: "Verify latency bounds.", expectedObservation: "p95 <= 80ms." },
    ],
    completionRules: [
      { id: "r1", description: "Cache relieves DB read pool", predicate: "has_cache_component" },
      { id: "r2", description: "p95 <= 80ms", predicate: "simulation_p95_lte", targetNumber: 80 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 13,
    id: "lab_13_p95_p99_latency",
    slug: "analyze-p95-p99-latency",
    title: "13. Analyze p95 and p99 Latency",
    difficulty: "intermediate",
    topic: "performance",
    learningObjectives: ["Contrast tail amplification across multi-hop fanout paths"],
    explanation: "Tail latency diverges from p50 when utilization climbs above 75% or retries compound.",
    workloadRps: 800,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "lb", label: "LB", kind: "gateway", replicas: 2, capacityPerReplicaRps: 1500, baseLatencyMs: 2 }),
      makeComponent({ id: "app", label: "API", kind: "service", replicas: 3, capacityPerReplicaRps: 700, baseLatencyMs: 6 }),
      makeComponent({ id: "cache", label: "Cache", kind: "cache", replicas: 2, capacityPerReplicaRps: 1500, baseLatencyMs: 2, cacheHitRatio: 0.85 }),
      makeComponent({ id: "db", label: "DB", kind: "database", replicas: 2, capacityPerReplicaRps: 800, baseLatencyMs: 9 }),
    ],
    starterEdges: [makeEdge("e1", "lb", "app", 1.05), makeEdge("e2", "app", "cache", 1.05), makeEdge("e3", "app", "db", 1.05)],
    steps: [
      { id: "s1", order: 1, kind: "inspect_metric", title: "Compare p50 vs p95 vs p99", instruction: "Inspect percentile distribution in simulation output.", expectedObservation: "Keeping rho < 0.7 keeps p95 compact." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Verify tight p95", instruction: "Execute simulation.", expectedObservation: "p95 <= 80ms." },
    ],
    completionRules: [
      { id: "r1", description: "p95 <= 80ms", predicate: "simulation_p95_lte", targetNumber: 80 },
      { id: "r2", description: "Zero critical SPOFs", predicate: "simulation_max_spofs_lte", targetNumber: 0 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 14,
    id: "lab_14_single_point_of_failure",
    slug: "identify-single-point-of-failure",
    title: "14. Identify a Single Point of Failure",
    difficulty: "beginner",
    topic: "reliability",
    learningObjectives: ["Eliminate single-replica and single-AZ blast radius risks"],
    explanation: "One un-replicated database or single-AZ gateway places 100% of traffic at risk.",
    workloadRps: 450,
    fault: { type: "service_crash", targetId: "app" },
    starterComponents: [
      makeComponent({ id: "lb", label: "Multi-AZ LB", kind: "gateway", replicas: 2, multiAz: true }),
      makeComponent({ id: "app", label: "App Fleet", kind: "service", replicas: 3, multiAz: true }),
      makeComponent({ id: "db", label: "Multi-AZ DB", kind: "database", replicas: 2, multiAz: true }),
    ],
    starterEdges: [makeEdge("e1", "lb", "app"), makeEdge("e2", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "configure_property", title: "Replicate across >= 2 AZs", instruction: "Ensure every tier runs multiAz: true and replicas >= 2.", expectedObservation: "SPOF count drops to 0." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Survive service_crash fault", instruction: "Run node failure simulation.", expectedObservation: "Zero critical SPOFs remain." },
    ],
    completionRules: [
      { id: "r1", description: "Zero critical SPOFs", predicate: "simulation_max_spofs_lte", targetNumber: 0 },
      { id: "r2", description: "Multi-AZ redundancy active", predicate: "has_multi_az_or_region" },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 15,
    id: "lab_15_service_outage",
    slug: "simulate-service-outage",
    title: "15. Simulate a Service Outage",
    difficulty: "intermediate",
    topic: "reliability",
    learningObjectives: ["Maintain availability under active primary failover fault injection"],
    explanation: "Automated failover preserves continuity only if surviving replicas absorb full load.",
    workloadRps: 500,
    fault: { type: "db_outage", targetId: "db" },
    starterComponents: [
      makeComponent({ id: "gw", label: "API Gateway", kind: "gateway", replicas: 2, capacityPerReplicaRps: 1000 }),
      makeComponent({ id: "app", label: "App Servers", kind: "service", replicas: 3, capacityPerReplicaRps: 600 }),
      makeComponent({ id: "db", label: "Failover DB Cluster", kind: "database", replicas: 3, capacityPerReplicaRps: 700 }),
    ],
    starterEdges: [makeEdge("e1", "gw", "app"), makeEdge("e2", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "run_simulation", title: "Inject DB outage fault", instruction: "Run simulation with db_outage.", expectedObservation: "Surviving replicas keep topology hardened." },
      { id: "s2", order: 2, kind: "inspect_metric", title: "Verify failover resilience", instruction: "Check critical SPOFs = 0.", expectedObservation: "Zero critical SPOFs." },
    ],
    completionRules: [
      { id: "r1", description: "Zero unmitigated SPOFs", predicate: "simulation_max_spofs_lte", targetNumber: 0 },
      { id: "r2", description: "Multi-AZ failover enabled", predicate: "has_multi_az_or_region" },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 16,
    id: "lab_16_circuit_breakers",
    slug: "configure-circuit-breakers",
    title: "16. Configure Circuit Breakers",
    difficulty: "advanced",
    topic: "resilience",
    learningObjectives: ["Contain retry amplification during dependency latency spikes"],
    explanation: "Bounding retry factors (<= 1.5x) plus circuit breaking prevents cascading retry storms.",
    workloadRps: 600,
    fault: { type: "retry_storm", targetId: "db" },
    starterComponents: [
      makeComponent({ id: "gw", label: "Gateway", kind: "gateway", replicas: 2, capacityPerReplicaRps: 1200 }),
      makeComponent({ id: "app", label: "Resilient API", kind: "service", replicas: 3, capacityPerReplicaRps: 700 }),
      makeComponent({ id: "db", label: "Protected DB", kind: "database", replicas: 3, capacityPerReplicaRps: 800 }),
    ],
    starterEdges: [makeEdge("e1", "gw", "app", 1.2), makeEdge("e2", "app", "db", 1.25)],
    steps: [
      { id: "s1", order: 1, kind: "configure_property", title: "Cap retry amplification", instruction: "Keep all edge retryFactor values <= 1.5x.", expectedObservation: "Zero retry-storm cascading alerts." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Test fault containment", instruction: "Run simulation under retry_storm.", expectedObservation: "p95 stays bounded <= 120ms." },
    ],
    completionRules: [
      { id: "r1", description: "Retry factors strictly bounded (<= 1.5x)", predicate: "has_circuit_breaker_or_retry_bounded" },
      { id: "r2", description: "p95 <= 120ms", predicate: "simulation_p95_lte", targetNumber: 120 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 17,
    id: "lab_17_network_partitions",
    slug: "explore-network-partitions",
    title: "17. Explore Network Partitions",
    difficulty: "advanced",
    topic: "distributed_systems",
    learningObjectives: ["Reason about CAP trade-offs during cross-node network split"],
    explanation: "Under partition, quorum-replicated stores protect correctness at a latency/availability cost.",
    workloadRps: 500,
    fault: { type: "network_partition", targetId: "db" },
    starterComponents: [
      makeComponent({ id: "app", label: "Partition-Aware API", kind: "service", replicas: 3, capacityPerReplicaRps: 600, multiAz: true }),
      makeComponent({ id: "db", label: "Quorum DB Nodes", kind: "database", replicas: 3, capacityPerReplicaRps: 700, replicationMode: "quorum", multiAz: true }),
    ],
    starterEdges: [makeEdge("e1", "app", "db", 1.15)],
    steps: [
      { id: "s1", order: 1, kind: "run_simulation", title: "Inject network_partition", instruction: "Execute partition trace.", expectedObservation: "Multi-AZ majority quorum avoids single-zone failure." },
      { id: "s2", order: 2, kind: "answer_question", title: "State CP vs AP trade-off", instruction: "Explain consistency guarantee sacrificed or preserved.", expectedObservation: "Clear CP trade-off articulation recorded." },
    ],
    completionRules: [
      { id: "r1", description: "Multi-AZ quorum present", predicate: "has_multi_az_or_region" },
      { id: "r2", description: "Zero unmitigated SPOFs", predicate: "simulation_max_spofs_lte", targetNumber: 0 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 18,
    id: "lab_18_consistency_strategies",
    slug: "compare-consistency-strategies",
    title: "18. Compare Consistency Strategies",
    difficulty: "advanced",
    topic: "distributed_systems",
    learningObjectives: ["Contrast strong vs eventual consistency impacts on read latency and freshness"],
    explanation: "Eventual read caches trade sub-second staleness for massive latency and cost savings.",
    workloadRps: 900,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "app", label: "Read-Optimized API", kind: "service", replicas: 3, capacityPerReplicaRps: 700 }),
      makeComponent({ id: "cache", label: "Eventual Cache", kind: "cache", replicas: 2, capacityPerReplicaRps: 1500, replicationMode: "async", cacheHitRatio: 0.85 }),
      makeComponent({ id: "db", label: "Source of Truth DB", kind: "database", replicas: 3, capacityPerReplicaRps: 700, replicationMode: "sync" }),
    ],
    starterEdges: [makeEdge("e1", "app", "cache"), makeEdge("e2", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "compare_outcomes", title: "Compare cached vs direct reads", instruction: "Run trace combining eventual cache with strong primary DB.", expectedObservation: "p95 stays <= 80ms while DB preserves durable truth." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Validate latency envelope", instruction: "Confirm p95 target under 900 req/s.", expectedObservation: "p95 <= 80ms." },
    ],
    completionRules: [
      { id: "r1", description: "Has cache tier for read offload", predicate: "has_cache_component" },
      { id: "r2", description: "p95 <= 80ms", predicate: "simulation_p95_lte", targetNumber: 80 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 19,
    id: "lab_19_regional_failover",
    slug: "simulate-regional-failover",
    title: "19. Simulate Regional Failover",
    difficulty: "expert",
    topic: "disaster_recovery",
    learningObjectives: ["Validate survival under az_outage with multi-region DNS/DB standby"],
    explanation: "Cross-AZ & cross-region standbys eliminate correlated single-datacenter outages.",
    workloadRps: 800,
    fault: { type: "az_outage", targetId: "db" },
    starterComponents: [
      makeComponent({ id: "dns", label: "GeoDNS Failover", kind: "gateway", replicas: 2, capacityPerReplicaRps: 3000, region: "global", multiAz: true, failureDomain: "region" }),
      makeComponent({ id: "lb", label: "Regional LB", kind: "gateway", replicas: 3, capacityPerReplicaRps: 1200, multiAz: true }),
      makeComponent({ id: "app", label: "Stateless App", kind: "service", replicas: 4, capacityPerReplicaRps: 700, multiAz: true }),
      makeComponent({ id: "db", label: "Geo-Replicated DB", kind: "database", replicas: 3, capacityPerReplicaRps: 800, multiAz: true, replicationMode: "sync" }),
    ],
    starterEdges: [makeEdge("e1", "dns", "lb"), makeEdge("e2", "lb", "app"), makeEdge("e3", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "run_simulation", title: "Simulate full AZ outage", instruction: "Run az_outage scenario across multi-AZ cluster.", expectedObservation: "Zero unmitigated SPOFs remain." },
      { id: "s2", order: 2, kind: "inspect_metric", title: "Inspect surviving capacity", instruction: "Verify surviving replicas carry 800 req/s cleanly.", expectedObservation: "Zero critical SPOFs and multi-AZ enabled." },
    ],
    completionRules: [
      { id: "r1", description: "Multi-AZ / Multi-region topology", predicate: "has_multi_az_or_region" },
      { id: "r2", description: "Zero critical SPOFs", predicate: "simulation_max_spofs_lte", targetNumber: 0 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
  {
    number: 20,
    id: "lab_20_optimize_capacity_cost",
    slug: "optimize-capacity-and-cost",
    title: "20. Optimize Capacity and Cost",
    difficulty: "expert",
    topic: "finops",
    learningObjectives: ["Hit latency and reliability constraints with right-sized instance count & cost"],
    explanation: "Right-sizing replicas with a small high-hit cache outperforms brute-force compute overprovisioning.",
    workloadRps: 850,
    fault: { type: "none" },
    starterComponents: [
      makeComponent({ id: "gw", label: "Gateway", kind: "gateway", replicas: 2, capacityPerReplicaRps: 1200, monthlyCostPerReplicaUsd: 55 }),
      makeComponent({ id: "app", label: "Right-Sized App", kind: "service", replicas: 3, capacityPerReplicaRps: 600, monthlyCostPerReplicaUsd: 65 }),
      makeComponent({ id: "cache", label: "Compact Redis", kind: "cache", replicas: 2, capacityPerReplicaRps: 1500, cacheHitRatio: 0.85, monthlyCostPerReplicaUsd: 60 }),
      makeComponent({ id: "db", label: "Balanced DB", kind: "database", replicas: 2, capacityPerReplicaRps: 800, monthlyCostPerReplicaUsd: 95 }),
    ],
    starterEdges: [makeEdge("e1", "gw", "app"), makeEdge("e2", "app", "cache"), makeEdge("e3", "app", "db")],
    steps: [
      { id: "s1", order: 1, kind: "inspect_metric", title: "Review cost vs p95 curve", instruction: "Verify monthly spend stays below $800 while hitting p95 <= 80ms.", expectedObservation: "Monthly infra spend <= $800." },
      { id: "s2", order: 2, kind: "run_simulation", title: "Validate cost-efficient SLO", instruction: "Run simulation at 850 req/s.", expectedObservation: "p95 <= 80ms and monthlyCost <= $800." },
    ],
    completionRules: [
      { id: "r1", description: "Monthly cost <= $800", predicate: "simulation_cost_lte", targetNumber: 800 },
      { id: "r2", description: "p95 <= 80ms", predicate: "simulation_p95_lte", targetNumber: 80 },
      { id: "r3", description: "All steps completed", predicate: "steps_completed" },
    ],
  },
];

export const ENGINEERING_LABS: EngineeringLab[] = LAB_SEEDS.map((seed) => ({
  version: 1,
  id: seed.id,
  slug: seed.slug,
  number: seed.number,
  title: seed.title,
  difficulty: seed.difficulty,
  topic: seed.topic,
  learningObjectives: seed.learningObjectives,
  explanation: seed.explanation,
  starterRevision: {
    id: `${seed.id}_starter_rev`,
    label: `${seed.title} Starter`,
    components: seed.starterComponents,
    edges: seed.starterEdges,
  },
  allowedModifications: ["add_component", "scale_replicas", "adjust_retry_factor", "add_cache"],
  workloadRps: seed.workloadRps,
  fault: seed.fault,
  steps: seed.steps,
  completionRules: seed.completionRules,
}));

export function getEngineeringLabById(labId: string): EngineeringLab | undefined {
  return ENGINEERING_LABS.find((l) => l.id === labId);
}

export function resetLabWorkingState(lab: EngineeringLab): {
  components: AnalysisComponentConfig[];
  edges: AnalysisEdgeConfig[];
  completedStepIds: string[];
} {
  return {
    components: lab.starterRevision.components.map((c) => ({
      ...c,
      dependencyIds: [...c.dependencyIds],
    })),
    edges: lab.starterRevision.edges.map((e) => ({ ...e })),
    completedStepIds: [],
  };
}

export function evaluateLabAttempt(params: {
  lab: EngineeringLab;
  attemptId: string;
  components: AnalysisComponentConfig[];
  edges: AnalysisEdgeConfig[];
  completedStepIds: string[];
  inspectedMetrics?: boolean;
  reasoningAnswers?: Record<string, string>;
  seed: number;
}): {
  attempt: LabAttemptState;
  simulationRunId: string;
} {
  const {
    lab,
    attemptId,
    components,
    edges,
    completedStepIds,
    inspectedMetrics = true,
    reasoningAnswers = {},
    seed,
  } = params;

  const rev = withComputedRevisionHash({
    revisionId: `${lab.id}_attempt_rev`,
    contentHash: "",
    label: `${lab.title} Working Revision`,
    routingPolicy: "least_connections",
    scalingMode: "hpa_reactive",
    maxReplicas: 20,
    components,
    edges,
  });

  const experiment: AnalysisExperiment = {
    version: 1,
    id: `${attemptId}_exp`,
    projectId: "proj_practice_lab",
    label: lab.title,
    architectureRevisionId: rev.revisionId,
    baselineRevision: rev,
    candidateRevision: rev,
    workloadRps: lab.workloadRps,
    durationMs: 600,
    seed,
    fault: {
      id: `f_${lab.id}`,
      type: lab.fault.type,
      targetComponentId: lab.fault.targetId || rev.components[0]?.id || "db",
      atMs: 160,
      durationMs: 220,
    },
    constraints: [],
    objectives: [
      { id: "obj_lat", dimension: "performance", targetDirection: "minimize", weight: 0.5 },
      { id: "obj_avail", dimension: "reliability", targetDirection: "maximize", weight: 0.5 },
    ],
    scoringEnabled: false,
    seedSet: [seed],
  };

  const { trace, finalState } = ArchitectureAnalysisExecutionEngine.runExperiment(experiment);
  const metrics = finalState.baselineMetrics;
  const availPct = Number((metrics.simulatedAvailability * 100).toFixed(3));
  const criticalSpofs = finalState.spofs.filter((s) => s.severity === "critical").length;

  const totalReplicas = components.reduce((s, c) => s + c.replicas, 0);
  const multiAzCount = components.filter((c) => c.multiAz).length;
  const stepSet = new Set(completedStepIds);
  const allStepsDone = lab.steps.every((s) => stepSet.has(s.id));

  const validationResults = lab.completionRules.map((rule) => {
    let passed = false;
    let observedDetail = "";

    switch (rule.predicate) {
      case "has_component_kind": {
        passed = components.some((c) => c.kind === rule.targetString);
        observedDetail = passed
          ? `Found component kind "${rule.targetString}".`
          : `Missing component kind "${rule.targetString}".`;
        break;
      }
      case "has_min_total_replicas": {
        const target = rule.targetNumber ?? 1;
        passed = totalReplicas >= target;
        observedDetail = `Total replicas = ${totalReplicas} (target >= ${target}).`;
        break;
      }
      case "has_cache_component": {
        passed = components.some((c) => c.kind === "cache" && c.cacheHitRatio >= 0.5);
        observedDetail = passed
          ? "Active cache component with >= 50% hit ratio present."
          : "No active high-hit cache component present.";
        break;
      }
      case "has_queue_or_async": {
        passed = components.some((c) => c.kind === "queue");
        observedDetail = passed
          ? "Asynchronous queue decoupling tier present."
          : "Missing queue tier.";
        break;
      }
      case "has_rate_limit_or_auth": {
        passed = components.some((c) => c.kind === "gateway");
        observedDetail = passed
          ? "API Gateway boundary present."
          : "Missing API Gateway boundary.";
        break;
      }
      case "has_circuit_breaker_or_retry_bounded": {
        const maxRetry = edges.reduce((m, e) => Math.max(m, e.retryFactor), 1);
        passed = maxRetry <= 1.5;
        observedDetail = `Max edge retry factor = ${maxRetry.toFixed(2)}x (target <= 1.50x).`;
        break;
      }
      case "has_multi_az_or_region": {
        passed = multiAzCount >= 2;
        observedDetail = `Multi-AZ components = ${multiAzCount} (target >= 2).`;
        break;
      }
      case "simulation_p95_lte": {
        const target = rule.targetNumber ?? 100;
        passed = metrics.p95LatencyMs <= target;
        observedDetail = `Simulated p95 = ${metrics.p95LatencyMs} ms (target <= ${target} ms).`;
        break;
      }
      case "simulation_availability_gte": {
        const target = rule.targetNumber ?? 99;
        passed = availPct >= target;
        observedDetail = `Simulated availability = ${availPct}% (target >= ${target}%).`;
        break;
      }
      case "simulation_max_spofs_lte": {
        const target = rule.targetNumber ?? 0;
        passed = criticalSpofs <= target;
        observedDetail = `Critical SPOFs = ${criticalSpofs} (target <= ${target}).`;
        break;
      }
      case "simulation_cost_lte": {
        const target = rule.targetNumber ?? 1000;
        passed = metrics.estimatedMonthlyCostUsd <= target;
        observedDetail = `Monthly cost = $${metrics.estimatedMonthlyCostUsd} (target <= $${target}).`;
        break;
      }
      case "steps_completed": {
        passed = allStepsDone && inspectedMetrics;
        observedDetail = passed
          ? `All ${lab.steps.length} lab steps completed.`
          : `${completedStepIds.length}/${lab.steps.length} steps completed.`;
        break;
      }
    }

    return {
      ruleId: rule.id,
      description: rule.description,
      passed,
      observedDetail,
    };
  });

  const completed =
    allStepsDone && validationResults.length > 0 && validationResults.every((r) => r.passed);

  return {
    simulationRunId: trace.runId,
    attempt: {
      attemptId,
      labId: lab.id,
      labVersion: lab.version,
      completedStepIds: [...completedStepIds],
      inspectedMetrics,
      reasoningAnswers: { ...reasoningAnswers },
      simulationRunIds: [trace.runId],
      validationResults,
      completed,
      completedAtIso: completed ? trace.createdAt : undefined,
    },
  };
}
