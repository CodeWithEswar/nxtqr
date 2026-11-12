import type { BaseEdge, BaseNode } from "@nxtqr/graph-schema";
import { computeDeterministicDigest } from "./deterministic-id";
import type {
  DetectedCapabilityState,
  SimulationCapabilityId,
  SimulationCapabilityMetadata,
  TopologyCapabilityInspection,
} from "./orchestrator-schemas";

export const CANONICAL_SIMULATION_CAPABILITIES: SimulationCapabilityMetadata[] = [
  {
    id: "core-flow",
    phase: "05.4.1",
    name: "Architecture Flow & Virtual Clock",
    category: "execution",
    description: "Deterministic request path traversal and step-by-step playback.",
    requiredAnyNodeTypes: [],
    optionalNodeTypes: ["client", "api-gateway", "load-balancer", "service", "database"],
    dependencies: [],
    defaultScenarioIds: ["cache-hit", "cache-miss"],
    determinismSupported: true,
    workspaceKey: "timeline",
    scopeNotes: "Deterministic virtual-clock hop traversal on directed graph edges.",
  },
  {
    id: "request-lifecycle",
    phase: "05.4.2",
    name: "Request/Response Payload Lifecycle",
    category: "execution",
    description: "HTTP payload shaping, headers, correlation IDs, and reverse return path.",
    requiredAnyNodeTypes: ["service", "api-gateway"],
    optionalNodeTypes: ["client", "cache", "database"],
    dependencies: ["core-flow"],
    defaultScenarioIds: ["database-read", "database-write"],
    determinismSupported: true,
    workspaceKey: "inspector",
    scopeNotes: "Models synthetic HTTP requests, headers, and status return flows.",
  },
  {
    id: "routing-lb",
    phase: "05.4.3",
    name: "Routing, Load Balancing & Fan-Out",
    category: "execution",
    description: "Parallel branches, fan-in barriers, queues, and weighted routing.",
    requiredAnyNodeTypes: ["load-balancer", "api-gateway", "queue"],
    optionalNodeTypes: ["service", "worker"],
    dependencies: ["core-flow"],
    defaultScenarioIds: ["parallel-fanout", "async-queue-workers"],
    determinismSupported: true,
    workspaceKey: "distributed-timeline",
    scopeNotes: "Models discrete event fan-out/fan-in with virtual priority queues.",
  },
  {
    id: "resilience",
    phase: "05.4.4",
    name: "Fault Injection, Retries & Circuit Breakers",
    category: "resilience-scale",
    description: "Simulated outages, transient errors, retry storms, circuit breakers, and failover.",
    requiredAnyNodeTypes: ["service", "database"],
    optionalNodeTypes: ["api-gateway", "load-balancer", "queue", "cache"],
    dependencies: ["request-lifecycle"],
    defaultScenarioIds: ["database_outage", "circuit_breaker", "retry_storm", "failover"],
    determinismSupported: true,
    workspaceKey: "fault-inspector",
    scopeNotes: "Deterministic simulated faults with zero external network impact.",
  },
  {
    id: "traffic",
    phase: "05.4.5",
    name: "Traffic, Queueing & Bottleneck Load",
    category: "resilience-scale",
    description: "Constant, burst, and step load profiles, worker saturation, and latency percentiles.",
    requiredAnyNodeTypes: ["service", "api-gateway"],
    optionalNodeTypes: ["load-balancer", "database", "queue", "cache"],
    dependencies: ["request-lifecycle"],
    defaultScenarioIds: ["steady_state", "traffic_spike", "bottleneck_db"],
    determinismSupported: true,
    workspaceKey: "performance-workspace",
    scopeNotes: "Models synthetic open-loop load and simulated queue waits.",
  },
  {
    id: "database",
    phase: "05.4.6",
    name: "Database Query Planner, Indexes & WAL Replication",
    category: "data-state",
    description: "SQL query plans, B-tree scans, joins, locks, and primary-replica replication.",
    requiredAnyNodeTypes: ["database"],
    optionalNodeTypes: ["service", "cache"],
    dependencies: [],
    defaultScenarioIds: ["indexed-lookup", "replication-lag"],
    determinismSupported: true,
    workspaceKey: "database-workspace",
    scopeNotes: "Deterministic logical query operator cost and WAL replication lag model.",
  },
  {
    id: "cache",
    phase: "05.4.7",
    name: "Distributed Caching, Eviction & Stampede",
    category: "data-state",
    description: "Cache-aside, write-through, write-behind, LRU/LFU eviction, and thundering herd.",
    requiredAnyNodeTypes: ["cache"],
    optionalNodeTypes: ["service", "database"],
    dependencies: [],
    defaultScenarioIds: ["cache-aside-hit", "write-through", "cache-stampede"],
    determinismSupported: true,
    workspaceKey: "cache-workspace",
    scopeNotes: "Synthetic memory cache simulation modeling eviction and stampede.",
  },
  {
    id: "security",
    phase: "05.4.8",
    name: "Gateway Security, WAF, Auth & RBAC",
    category: "security-delivery",
    description: "API gateway routing, OAuth/JWT verification, WAF inspection, and RBAC denial.",
    requiredAnyNodeTypes: ["api-gateway", "service", "security"],
    optionalNodeTypes: ["client", "database"],
    dependencies: [],
    defaultScenarioIds: ["authorized-jwt", "waf-sqli-block", "rbac-deny"],
    determinismSupported: true,
    workspaceKey: "security-workspace",
    scopeNotes: "Synthetic policy evaluation; enforces short-circuiting on deny.",
  },
  {
    id: "streaming",
    phase: "05.4.9",
    name: "Event Streaming, Partitions & Consumer Lag",
    category: "data-state",
    description: "Topic partitions, consumer groups, rebalancing, offset commits, and DLQs.",
    requiredAnyNodeTypes: ["queue", "stream", "kafka"],
    optionalNodeTypes: ["service", "worker", "database"],
    dependencies: [],
    defaultScenarioIds: ["partition-ordered", "consumer-rebalance", "dlq-poison-pill"],
    determinismSupported: true,
    workspaceKey: "streaming-workspace",
    scopeNotes: "Deterministic partitioned log and offset lag model.",
  },
  {
    id: "kubernetes",
    phase: "05.4.10",
    name: "Kubernetes Scheduling, HPA & Rolling Updates",
    category: "resilience-scale",
    description: "Pod scheduling, probes, HPA scale-out, OOM/evictions, and rollouts.",
    requiredAnyNodeTypes: ["service", "container", "kubernetes", "worker"],
    optionalNodeTypes: ["load-balancer", "api-gateway"],
    dependencies: ["traffic"],
    defaultScenarioIds: ["hpa-scale-out", "rolling-update", "probe-failure"],
    determinismSupported: true,
    workspaceKey: "kubernetes-workspace",
    scopeNotes: "Simplified deterministic control-loop scheduler without host containers.",
  },
  {
    id: "global-network",
    phase: "05.4.11",
    name: "Global DNS, Anycast CDN & Edge Routing",
    category: "execution",
    description: "Geo-DNS resolution, CDN POP edge hits/shielding, and WAN latency.",
    requiredAnyNodeTypes: ["dns", "cdn", "client", "api-gateway"],
    optionalNodeTypes: ["load-balancer", "service"],
    dependencies: [],
    defaultScenarioIds: ["cdn-edge-hit", "geo-failover"],
    determinismSupported: true,
    workspaceKey: "global-network-workspace",
    scopeNotes: "Models regional RTT, DNS TTL propagation, and edge POP hit ratios.",
  },
  {
    id: "service-mesh",
    phase: "05.4.12",
    name: "Service Mesh, mTLS, Retries & Canary Weights",
    category: "execution",
    description: "Sidecar proxy mTLS handshakes, outlier ejection, and weighted splits.",
    requiredAnyNodeTypes: ["service", "load-balancer"],
    optionalNodeTypes: ["api-gateway", "security"],
    dependencies: ["request-lifecycle"],
    defaultScenarioIds: ["mtls-strict", "canary-split", "outlier-ejection"],
    determinismSupported: true,
    workspaceKey: "service-mesh-workspace",
    scopeNotes: "Sidecar control-plane abstraction over service-to-service hops.",
  },
  {
    id: "raft",
    phase: "05.4.13",
    name: "Raft Consensus, Leader Election & Split-Brain",
    category: "data-state",
    description: "Term elections, log replication quorum commits, and partition safety.",
    requiredAnyNodeTypes: ["database", "consensus", "storage"],
    optionalNodeTypes: ["service"],
    dependencies: [],
    defaultScenarioIds: ["leader-election", "quorum-partition"],
    determinismSupported: true,
    workspaceKey: "raft-workspace",
    scopeNotes: "Formal term/commit-index consensus stepper.",
  },
  {
    id: "distributed-transactions",
    phase: "05.4.14",
    name: "Distributed Transactions (2PC & Sagas)",
    category: "data-state",
    description: "Two-phase commit voting, saga choreography, and compensating rollbacks.",
    requiredAnyNodeTypes: ["service", "database"],
    optionalNodeTypes: ["queue"],
    dependencies: ["database"],
    defaultScenarioIds: ["saga-compensation", "two-phase-commit"],
    determinismSupported: true,
    workspaceKey: "distributed-tx-workspace",
    scopeNotes: "Atomic prepare/commit and idempotent compensation trace model.",
  },
  {
    id: "distributed-storage",
    phase: "05.4.15",
    name: "Sharding, Consistent Hashing & Quorum Storage",
    category: "data-state",
    description: "Hash rings, range splits, hot shards, quorum reads/writes, and rebalancing.",
    requiredAnyNodeTypes: ["database", "storage"],
    optionalNodeTypes: ["cache", "service"],
    dependencies: ["database"],
    defaultScenarioIds: ["consistent-hash-rebalance", "hot-shard-skew"],
    determinismSupported: true,
    workspaceKey: "distributed-storage-workspace",
    scopeNotes: "Synthetic hash-ring key placement and quorum N/R/W simulator.",
  },
  {
    id: "traffic-control",
    phase: "05.4.16",
    name: "Rate Limiting, Token Bucket & Load Shedding",
    category: "resilience-scale",
    description: "Token/leaky buckets, sliding windows, priority queues, and 429 shedding.",
    requiredAnyNodeTypes: ["api-gateway", "load-balancer", "rate-limiter"],
    optionalNodeTypes: ["service", "queue"],
    dependencies: ["core-flow"],
    defaultScenarioIds: ["token-bucket-burst", "priority-load-shedding"],
    determinismSupported: true,
    workspaceKey: "traffic-control-workspace",
    scopeNotes: "Exact deterministic bucket refills and priority admission control.",
  },
  {
    id: "observability",
    phase: "05.4.17",
    name: "Metrics, Logs, Traces, SLOs & Incident RCA",
    category: "resilience-scale",
    description: "Correlated spans, RED metrics, burn-rate alerts, and timeline RCA.",
    requiredAnyNodeTypes: [],
    optionalNodeTypes: ["api-gateway", "service", "database", "cache", "queue"],
    dependencies: ["core-flow"],
    defaultScenarioIds: ["checkout-latency-incident", "slo-burn-alert"],
    determinismSupported: true,
    workspaceKey: "observability-workspace",
    scopeNotes: "Synthesizes spans, structured logs, and burn rates from virtual runs.",
  },
  {
    id: "zero-trust",
    phase: "05.4.18",
    name: "Zero Trust Policies, Identities & Attack Paths",
    category: "security-delivery",
    description: "Trust boundaries, SPIFFE identity verification, lateral blast paths, and blocks.",
    requiredAnyNodeTypes: ["api-gateway", "service", "security"],
    optionalNodeTypes: ["database", "cache"],
    dependencies: ["security"],
    defaultScenarioIds: ["least-privilege-enforce", "credential-compromise"],
    determinismSupported: true,
    workspaceKey: "zero-trust-workspace",
    scopeNotes: "Simulated policy enforcement and synthetic attack-graph reachability.",
  },
  {
    id: "deployment",
    phase: "05.4.19",
    name: "Progressive Delivery, Canary & Rollback",
    category: "security-delivery",
    description: "Blue-green swaps, canary weight progression, health gates, and auto-rollback.",
    requiredAnyNodeTypes: ["load-balancer", "api-gateway", "service"],
    optionalNodeTypes: ["kubernetes"],
    dependencies: ["routing-lb", "observability"],
    defaultScenarioIds: ["canary-auto-rollback", "blue-green-switch"],
    determinismSupported: true,
    workspaceKey: "deployment-workspace",
    scopeNotes: "Models weighted shift stages against synthetic error/latency gates.",
  },
  {
    id: "disaster-recovery",
    phase: "05.4.20",
    name: "Multi-Region Disaster Recovery, RPO & RTO",
    category: "security-delivery",
    description: "Region isolation, standby DB promotion, backup restore, and RPO/RTO checks.",
    requiredAnyNodeTypes: ["database", "storage", "dns", "load-balancer"],
    optionalNodeTypes: ["service", "api-gateway"],
    dependencies: ["global-network", "database"],
    defaultScenarioIds: ["active-passive-failover", "backup-restore"],
    determinismSupported: true,
    workspaceKey: "disaster-recovery-workspace",
    scopeNotes: "Synthetic RPO/RTO calculations calibrated against replication mode.",
  },
  {
    id: "capacity",
    phase: "05.4.21",
    name: "Capacity Planning, Queueing & Synthetic Cost",
    category: "resilience-scale",
    description: "M/M/1 & M/M/c saturation, utilization targets, scale recommendations, cost units.",
    requiredAnyNodeTypes: ["service", "database", "api-gateway"],
    optionalNodeTypes: ["queue", "cache", "load-balancer"],
    dependencies: ["traffic"],
    defaultScenarioIds: ["autoscale-saturation", "cost-rightsizing"],
    determinismSupported: true,
    workspaceKey: "capacity-workspace",
    scopeNotes: "Uses analytical queueing formulas and synthetic unit pricing tables.",
  },
  {
    id: "architecture-analysis",
    phase: "05.4.22",
    name: "Trade-Off Explorer, SPOFs & Design Revisions",
    category: "platform-learning",
    description: "Baseline vs candidate diffs, SPOF discovery, and multi-domain sensitivity.",
    requiredAnyNodeTypes: [],
    optionalNodeTypes: ["api-gateway", "load-balancer", "service", "database", "cache"],
    dependencies: ["core-flow", "capacity"],
    defaultScenarioIds: ["spof-remediation", "cache-vs-replicas"],
    determinismSupported: true,
    workspaceKey: "analysis-workspace",
    scopeNotes: "Structural graph analysis paired with comparative simulation runs.",
  },
  {
    id: "practice-labs",
    phase: "05.4.23",
    name: "Interview Challenges, Rubrics & Guided Labs",
    category: "platform-learning",
    description: "Requirements estimation, progressive hints, and evidence-backed grading.",
    requiredAnyNodeTypes: [],
    optionalNodeTypes: ["client", "api-gateway", "service", "database", "cache"],
    dependencies: ["architecture-analysis"],
    defaultScenarioIds: ["url-shortener-challenge", "notification-system-lab"],
    determinismSupported: true,
    workspaceKey: "practice-workspace",
    scopeNotes: "Evidence-graded against simulated trace + graph invariants.",
  },
  {
    id: "templates",
    phase: "05.4.24",
    name: "Reference Architecture Templates & Library",
    category: "platform-learning",
    description: "Versioned executable templates, walkthroughs, JSON portability, and instantiation.",
    requiredAnyNodeTypes: [],
    optionalNodeTypes: ["client", "cdn", "api-gateway", "load-balancer", "service", "database", "cache", "queue"],
    dependencies: ["core-flow"],
    defaultScenarioIds: ["url-shortener-read-heavy", "ecommerce-order-pipeline"],
    determinismSupported: true,
    workspaceKey: "templates-workspace",
    scopeNotes: "Instantiates verified graph schemas into the shared editor canvas.",
  },
];

function extractNodeKind(node: BaseNode): string {
  const data = (node.data || {}) as Record<string, unknown>;
  const raw = String(data.componentType || node.type || "service").toLowerCase();
  if (raw === "db" || raw === "postgres" || raw === "sql") return "database";
  if (raw === "kafka" || raw === "broker" || raw === "topic") return "queue";
  if (raw === "gateway" || raw === "ingress") return "api-gateway";
  if (raw === "lb" || raw === "alb") return "load-balancer";
  if (raw === "redis" || raw === "memcached") return "cache";
  return raw;
}

/**
 * Canonical Phase 05.4 Capability Registry & Topology Detector.
 */
export class CapabilityRegistry {
  public static listAll(): SimulationCapabilityMetadata[] {
    return [...CANONICAL_SIMULATION_CAPABILITIES];
  }

  public static getById(id: SimulationCapabilityId): SimulationCapabilityMetadata | undefined {
    return CANONICAL_SIMULATION_CAPABILITIES.find((c) => c.id === id);
  }

  /**
   * Inspects the active architecture graph and determines which of the 24 capabilities are
   * supported, partial, unsupported, or misconfigured.
   */
  public static inspectTopology(
    nodes: BaseNode[],
    edges: BaseEdge[]
  ): TopologyCapabilityInspection {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const safeEdges = Array.isArray(edges) ? edges : [];
    const snapshotDigest = computeDeterministicDigest(
      safeNodes.map((n) => `${n.id}:${extractNodeKind(n)}`).join("|") +
        "::" +
        safeEdges.map((e) => `${e.source}->${e.target}`).join("|")
    );

    const nodeKinds = new Map<string, string[]>();
    const nodeIds = new Set<string>();

    for (const node of safeNodes) {
      nodeIds.add(node.id);
      const kind = extractNodeKind(node);
      const bucket = nodeKinds.get(kind) || [];
      bucket.push(node.id);
      nodeKinds.set(kind, bucket);
    }

    const topologyWarnings: string[] = [];
    if (safeNodes.length === 0) {
      topologyWarnings.push("Canvas contains no architecture components.");
    } else if (safeNodes.length > 1 && safeEdges.length === 0) {
      topologyWarnings.push("Multiple components present without connecting edges.");
    }

    // Detect dangling edges or isolated components
    const connectedIds = new Set<string>();
    for (const edge of safeEdges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        topologyWarnings.push(`Edge "${edge.id}" references a missing source or target node.`);
      } else {
        connectedIds.add(edge.source);
        connectedIds.add(edge.target);
      }
    }
    if (safeNodes.length > 1) {
      const disconnected = safeNodes.filter((n) => !connectedIds.has(n.id));
      if (disconnected.length > 0) {
        topologyWarnings.push(
          `${disconnected.length} component(s) are disconnected from the request graph.`
        );
      }
    }

    const detectedMap = new Map<SimulationCapabilityId, DetectedCapabilityState>();
    const results: DetectedCapabilityState[] = [];

    for (const meta of CANONICAL_SIMULATION_CAPABILITIES) {
      const matchedSet = new Set<string>();
      const missingConfigs: string[] = [];
      const incompatibleDetails: string[] = [];

      for (const reqKind of meta.requiredAnyNodeTypes) {
        for (const nid of nodeKinds.get(reqKind) || []) {
          matchedSet.add(nid);
        }
      }
      for (const optKind of meta.optionalNodeTypes) {
        for (const nid of nodeKinds.get(optKind) || []) {
          matchedSet.add(nid);
        }
      }

      // Config checks for sensitive modules when relevant nodes exist
      if (meta.id === "traffic-control" || meta.id === "traffic") {
        const gwIds = nodeKinds.get("api-gateway") || [];
        for (const gid of gwIds) {
          const n = safeNodes.find((item) => item.id === gid);
          const data = (n?.data || {}) as Record<string, unknown>;
          if (
            meta.id === "traffic-control" &&
            data.rateLimitRps === undefined &&
            data.rateLimit === undefined
          ) {
            missingConfigs.push(`Gateway "${n?.label || gid}" lacks explicit rateLimitRps config (uses default).`);
          }
        }
      }

      if (meta.id === "raft" && (nodeKinds.get("database")?.length || 0) < 3) {
        if ((nodeKinds.get("database")?.length || 0) > 0 && (nodeKinds.get("consensus")?.length || 0) === 0) {
          missingConfigs.push("Raft consensus benefits from 3+ quorum database/consensus nodes (runs in virtual quorum overlay).");
        }
      }

      if (safeNodes.length > 1 && matchedSet.size > 0 && connectedIds.size === 0 && meta.id !== "templates") {
        incompatibleDetails.push("Components are not connected by directed edges.");
      }

      const missingNodeTypes =
        meta.requiredAnyNodeTypes.length > 0 &&
        !meta.requiredAnyNodeTypes.some((req) => (nodeKinds.get(req)?.length || 0) > 0)
          ? [...meta.requiredAnyNodeTypes]
          : [];

      let status: DetectedCapabilityState["status"] = "supported";
      if (safeNodes.length === 0 && meta.id !== "templates" && meta.id !== "practice-labs") {
        status = "unsupported";
      } else if (incompatibleDetails.length > 0) {
        status = "misconfigured";
      } else if (missingNodeTypes.length > 0) {
        status =
          meta.category === "platform-learning" || meta.id === "observability"
            ? "partial"
            : "unsupported";
      } else if (missingConfigs.length > 0) {
        status = "partial";
      }

      const state: DetectedCapabilityState = {
        capabilityId: meta.id,
        metadata: meta,
        status,
        matchedNodeIds: Array.from(matchedSet),
        missingNodeTypes,
        missingConfigs,
        incompatibleDetails,
        unmetDependencies: [],
        recommendedScenarioIds:
          status === "supported" || status === "partial" ? meta.defaultScenarioIds : [],
      };

      detectedMap.set(meta.id, state);
      results.push(state);
    }

    // Second pass: resolve cross-capability dependency status
    for (const state of results) {
      const unmet = state.metadata.dependencies.filter((depId) => {
        const dep = detectedMap.get(depId);
        return dep && (dep.status === "unsupported" || dep.status === "misconfigured");
      });
      state.unmetDependencies = unmet;
      if (unmet.length > 0 && state.status === "supported") {
        state.status = "partial";
      }
    }

    const supportedCapabilities = results.filter((r) => r.status === "supported");
    const partialCapabilities = results.filter((r) => r.status === "partial");
    const unsupportedCapabilities = results.filter((r) => r.status === "unsupported");
    const misconfiguredCapabilities = results.filter((r) => r.status === "misconfigured");

    const recommendedScenarios = supportedCapabilities
      .slice(0, 6)
      .flatMap((cap) =>
        cap.recommendedScenarioIds.slice(0, 1).map((scenarioId) => ({
          capabilityId: cap.capabilityId,
          scenarioId,
          reason: `Matched ${cap.matchedNodeIds.length} component(s) for ${cap.metadata.name}.`,
        }))
      );

    return {
      snapshotDigest,
      nodeCount: safeNodes.length,
      edgeCount: safeEdges.length,
      supportedCapabilities,
      partialCapabilities,
      unsupportedCapabilities,
      misconfiguredCapabilities,
      recommendedScenarios,
      topologyWarnings,
    };
  }
}

