import type { FailureRecommendation } from "../contracts/failure.types";

export const FAILURE_RECOMMENDATION_REGISTRY: Record<string, FailureRecommendation> = {
  "REC-FAIL-SPOF-001": {
    id: "REC-FAIL-SPOF-001",
    title: "Deploy Redundant Instances with Health-Aware Load Balancing",
    description:
      "Scale the single-instance service to 2 or more replicas fronted by a health-checking load balancer or service mesh to ensure traffic drains gracefully during unexpected instance failure.",
    tradeOffs: [
      "Increased server/compute operational expenditure",
      "Requires stateless session handling or centralized session cache",
    ],
    implementationGuidance:
      "Increase component replicas to >= 2 and connect via an upstream Load Balancer or API Gateway with health check probes enabled.",
  },
  "REC-FAIL-SPOF-002": {
    id: "REC-FAIL-SPOF-002",
    title: "Decouple Synchronous Call Path with Asynchronous Queue",
    description:
      "Convert the synchronous request-response dependency into an event-driven queue or stream to buffer requests when downstream workers fail or experience restarts.",
    tradeOffs: [
      "Transition from immediate consistency to eventual consistency",
      "Requires asynchronous status polling or Webhook/WebSocket notifications for client feedback",
    ],
    implementationGuidance:
      "Insert a Message Queue or Event Stream between producer and consumer to isolate transient outages.",
  },
  "REC-FAIL-DB-001": {
    id: "REC-FAIL-DB-001",
    title: "Enable Multi-AZ High Availability with Automated Failover",
    description:
      "Configure synchronous multi-zone replication with an automated standby instance and health-triggered DNS/IP failover to prevent database downtime.",
    tradeOffs: [
      "Doubles database compute and storage cost",
      "Minor write latency overhead due to synchronous replication acknowledgments",
    ],
    implementationGuidance:
      "Toggle Multi-AZ / High Availability to true on the primary database and ensure failover mode is set to automatic.",
  },
  "REC-FAIL-DB-002": {
    id: "REC-FAIL-DB-002",
    title: "Provision Read Replicas to Protect Core Reads from Primary Outage",
    description:
      "Distribute query workload across read replicas so critical read capabilities (product search, browsing, reporting) remain online during primary maintenance or failover.",
    tradeOffs: [
      "Application must support separate read and write database connections",
      "Potential replication lag (few milliseconds) on read-after-write queries",
    ],
    implementationGuidance:
      "Add 1 or more read replicas in database configuration and route read-only queries to replica endpoints.",
  },
  "REC-FAIL-SHARED-001": {
    id: "REC-FAIL-SHARED-001",
    title: "Decouple Shared Dependency or Implement Dedicated Sharding",
    description:
      "Ensure apparently redundant services do not share a single bottleneck resource (such as an un-replicated database, central auth provider, or single NAT gateway).",
    tradeOffs: [
      "Architectural refactoring to isolate state across service boundaries",
      "Higher configuration complexity and operational surface area",
    ],
    implementationGuidance:
      "Decompose shared databases into service-owned databases or provision redundant gateway/auth instances with independent connection pools.",
  },
  "REC-FAIL-FDOM-001": {
    id: "REC-FAIL-FDOM-001",
    title: "Distribute Replicas Across Distinct Availability Zones / Regions",
    description:
      "Ensure redundant instances and database replicas are deployed across at least two physically distinct Availability Zones (AZs) to prevent entire datacenter or rack outages.",
    tradeOffs: [
      "Inter-zone data transfer costs on high-volume traffic",
      "Slight cross-AZ network latency (sub-millisecond to ~1ms)",
    ],
    implementationGuidance:
      "Assign replicas to distinct Availability Zones (e.g. us-east-1a, us-east-1b) in the failure domain properties.",
  },
  "REC-FAIL-FAILOVER-001": {
    id: "REC-FAIL-FAILOVER-001",
    title: "Implement Automated Health Probing and Failover Promotion",
    description:
      "Eliminate manual intervention gaps by defining automated heartbeat health checks, failure detection thresholds, and automated routing promotion for standby nodes.",
    tradeOffs: [
      "Requires careful threshold tuning to prevent false-positive failover flaps",
      "Must implement fencing or quorum mechanisms to avoid split-brain scenarios",
    ],
    implementationGuidance:
      "Set failover mode to 'automatic' with explicit health-check interval and failure threshold properties.",
  },
  "REC-FAIL-EXT-001": {
    id: "REC-FAIL-EXT-001",
    title: "Isolate External Integrations with Circuit Breakers & Fallbacks",
    description:
      "Wrap external third-party API dependencies with circuit breakers, short timeouts, and degraded fallback logic (such as cached results or asynchronous retries).",
    tradeOffs: [
      "Requires degraded-mode UX handling in client applications",
      "Stale fallback data may be displayed during provider downtime",
    ],
    implementationGuidance:
      "Place a Circuit Breaker pattern or Bulkhead between your application and external APIs, with configured fallback policies.",
  },
};

