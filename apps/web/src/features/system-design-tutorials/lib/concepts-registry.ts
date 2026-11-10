import type { ConceptGuide } from "../schemas/tutorial.schema";

export const SYSTEM_DESIGN_CONCEPTS: ConceptGuide[] = [
  {
    id: "cap-theorem",
    slug: "cap-theorem",
    title: "The CAP Theorem & PACELC in Practice",
    subtitle: "Navigating consistency, availability, and latency across distributed network partitions",
    readTime: "8 min read",
    summary:
      "Every distributed data store operating across a network must make trade-offs between linearizable consistency and high availability when partitions occur. PACELC extends this model by formalizing trade-offs even during normal, non-partitioned operation.",
    sections: [
      {
        title: "The Reality of Network Partitions",
        content:
          "In distributed systems, networks are inherently unreliable. Switches crash, BGP routes fail, garbage collection pauses mimic network drops, and packet loss occurs. Because partitions (P) are an immutable reality of physical networking, systems cannot choose 'CA'. They must choose between Consistency (C) or Availability (A) during a partition.",
        codeOrFormula: "P is unavoidable ⇒ Must choose CP (Linearizable) or AP (Eventual Consistency)",
      },
      {
        title: "CP: Prioritizing Linearizability",
        content:
          "CP systems reject writes or block client requests if quorum cannot be established across partitioned replicas. If a split-brain condition is detected, minority partitions cease processing updates to prevent divergent state. Examples include etcd, ZooKeeper, and Spanner.",
      },
      {
        title: "AP: Prioritizing High Availability",
        content:
          "AP systems accept reads and writes on all available partitions, returning stale data or accepting conflicting updates that must be reconciled later via vector clocks, Last-Write-Wins (LWW), or Conflict-Free Replicated Data Types (CRDTs). Examples include DynamoDB, Cassandra, and Couchbase.",
      },
      {
        title: "The PACELC Extension",
        content:
          "CAP only describes behavior during partitions. PACELC states: if there is a Partition (P), how does your system trade off Availability (A) and Consistency (C); Else (E), when the system is running normally without partitions, how does your system trade off Latency (L) and Consistency (C)?",
        codeOrFormula: "PC/EC (e.g. Spanner) vs PA/EL (e.g. DynamoDB default) vs PC/EL (e.g. MongoDB primary)",
      },
    ],
    relatedComponentIds: [
      "relational-database",
      "distributed-nosql-database",
      "consensus-coordinator",
      "distributed-lock",
    ],
    relatedExampleIds: ["ecommerce-platform", "payment-processing", "social-feed"],
  },
  {
    id: "idempotency",
    slug: "idempotency",
    title: "Idempotent API Design & Safe Retries",
    subtitle: "Guaranteeing exactly-once execution semantics across unreliable network boundaries",
    readTime: "7 min read",
    summary:
      "When network timeouts occur between clients, proxies, and services, clients cannot differentiate between a dropped request, an in-flight execution, or a dropped response. Idempotency guarantees that executing an operation multiple times produces identical state.",
    sections: [
      {
        title: "The Ambiguous Network Failure Problem",
        content:
          "TCP disconnects and HTTP 504 timeouts are ambiguous: did the service fail before processing the payment, or did it process the charge and fail while sending the 200 OK? Blindly retrying non-idempotent operations creates duplicate charges, phantom orders, and data corruption.",
      },
      {
        title: "Idempotency Keys & Distributed Storage",
        content:
          "Clients generate a unique cryptographic UUID or deterministic hash for each logical mutation and pass it via the `Idempotency-Key` HTTP header. The receiving service uses an atomic lock (Redis `SETNX` or Postgres `INSERT ON CONFLICT`) to record the key before processing.",
        codeOrFormula: "SET key:order_123 status:in_flight NX EX 120",
      },
      {
        title: "State Transitions: In-Flight, Committed, and Cached Responses",
        content:
          "If a duplicate request arrives while the first execution is still running, the server rejects it with `409 Conflict` or blocks until completion. When the operation succeeds, the server caches the HTTP status and payload alongside the key so future retries receive the exact cached response instantly.",
      },
      {
        title: "Database Deduplication & Unique Constraints",
        content:
          "Application-level idempotency should always be backed by immutable database constraints, such as unique indexes on `(client_id, idempotency_key)` or transactional outbox records.",
      },
    ],
    relatedComponentIds: [
      "idempotency-service",
      "retry-controller",
      "circuit-breaker",
      "payment-gateway",
    ],
    relatedExampleIds: ["payment-processing", "ecommerce-platform", "notification-gateway"],
  },
  {
    id: "caching-strategies",
    slug: "caching-strategies",
    title: "Enterprise Caching Strategies & Invalidation",
    subtitle: "Optimizing throughput and sub-millisecond latency while preventing cache stampedes",
    readTime: "9 min read",
    summary:
      "Caching dramatically reduces database load and latency, but introduces state divergence and synchronization challenges. Choosing the right pattern—Cache-Aside, Write-Through, Write-Behind, or Refresh-Ahead—depends on access patterns and consistency tolerances.",
    sections: [
      {
        title: "Cache-Aside (Lazy Loading)",
        content:
          "The application code queries the cache first. On a cache miss, it reads from the primary database, populates the cache with a TTL, and returns the result. This pattern is resilient to cache crashes (fallback to DB) but incurs latency penalty on initial cold reads.",
      },
      {
        title: "Write-Through & Write-Behind (Write-Back)",
        content:
          "Write-Through updates the cache and database synchronously before returning to the caller. Write-Behind updates the cache immediately and enqueues an asynchronous write to the database, delivering high write throughput at the risk of data loss if the cache node crashes before flushing.",
      },
      {
        title: "The Thundering Herd & Cache Stampede",
        content:
          "When a hot key expires or is invalidated under high concurrency, thousands of concurrent requests miss simultaneously and overwhelm the backend database. Mitigations include probabilistic early expiration (XFetch algorithm), mutex locking per key, and background refresh workers.",
        codeOrFormula: "Δt = -β * log(rand()) * TTL  // Probabilistic early recomputation",
      },
      {
        title: "Eviction Policies: LRU, LFU, and Segmented LRU",
        content:
          "When memory is exhausted, eviction algorithms decide which keys to discard. Least Recently Used (LRU) discards items that haven't been accessed for the longest time, while Least Frequently Used (LFU) retains hot items despite temporary bursts of cold keys.",
      },
    ],
    relatedComponentIds: [
      "in-memory-cache",
      "distributed-cache",
      "cache-aside-pattern",
      "content-delivery-network",
    ],
    relatedExampleIds: ["url-shortener", "social-feed", "video-streaming"],
  },
  {
    id: "event-driven-architecture",
    slug: "event-driven-architecture",
    title: "Event-Driven Architecture & Transactional Outbox",
    subtitle: "Decoupling services, managing event streams, and avoiding dual-write distributed failures",
    readTime: "10 min read",
    summary:
      "Event-driven architectures decouple producers from consumers through immutable event streams. However, publishing events while writing to a local database introduces the dual-write problem, which requires transactional outbox patterns to guarantee reliability.",
    sections: [
      {
        title: "The Dual-Write Anti-Pattern",
        content:
          "Writing to a local relational database and then publishing to Kafka in the same HTTP handler is inherently flawed: if the network to Kafka fails after the DB commits, the event is lost forever; if Kafka succeeds and the DB transaction rolls back, downstream services consume phantom events.",
      },
      {
        title: "The Transactional Outbox Pattern",
        content:
          "The application writes business entities and outbound event payloads into an `outbox` table within the same atomic ACID database transaction. A Change Data Capture (CDC) connector (e.g. Debezium) or poller reads the transaction log and streams events to Kafka with at-least-once delivery guarantees.",
        codeOrFormula: "BEGIN TRANSACTION; INSERT INTO orders (...); INSERT INTO outbox (...); COMMIT;",
      },
      {
        title: "Orchestration vs Choreography in Sagas",
        content:
          "In choreographed sagas, services listen to events and trigger local actions autonomously; this avoids central bottlenecks but increases complexity. In orchestrated sagas, a centralized state machine commands each participant step-by-step and initiates compensating transactions on failure.",
      },
      {
        title: "Dead Letter Queues (DLQ) & Poison Pills",
        content:
          "Malformed payloads or unhandled edge cases will crash consumer threads repeatedly. DLQs isolate failing messages after maximum retries so the consumer can continue processing healthy traffic while engineers inspect and replay failed events.",
      },
    ],
    relatedComponentIds: [
      "event-streaming-platform",
      "message-broker",
      "cdc-connector",
      "saga-orchestrator",
      "dead-letter-queue",
    ],
    relatedExampleIds: ["ecommerce-platform", "iot-telemetry-pipeline", "notification-gateway"],
  },
  {
    id: "rate-limiting",
    slug: "rate-limiting",
    title: "Rate Limiting & Traffic Shaping Algorithms",
    subtitle: "Defending systems against abuse, DDoS attacks, and noisy neighbor resource starvation",
    readTime: "8 min read",
    summary:
      "Rate limiters protect API gateways, compute instances, and downstream databases from being overwhelmed by spikes, DDoS attacks, or runaway scraping loops. Different algorithms balance memory usage, burst handling, and computational precision.",
    sections: [
      {
        title: "Token Bucket Algorithm",
        content:
          "Tokens are added to a bucket of capacity B at a constant refill rate R. Each request consumes one token. If the bucket is empty, requests are dropped (`429 Too Many Requests`). This allows controlled traffic bursts up to bucket capacity while enforcing an average rate limit.",
        codeOrFormula: "Tokens = min(Capacity, CurrentTokens + (ElapsedTime * RefillRate))",
      },
      {
        title: "Leaky Bucket Algorithm",
        content:
          "Requests enter a FIFO queue of capacity N and leak out at a constant, smoothed rate. While Token Bucket permits bursts, Leaky Bucket strictly smooths egress traffic, making it ideal for downstream databases with rigid IOPS ceilings.",
      },
      {
        title: "Sliding Window Counter",
        content:
          "Combines the low memory footprint of Fixed Window with the boundary accuracy of Sliding Window Log. Estimates request count by weighting the previous window's volume proportionally against the elapsed progress in the current window.",
        codeOrFormula: "Count = CurrentWindowRequests + (PreviousWindowRequests * (1 - Elapsed%))",
      },
      {
        title: "Distributed Rate Limiting with Redis & Lua",
        content:
          "When multiple API gateway instances scale horizontally, rate counters must be shared. Executing rate-limiting logic inside Redis Lua scripts guarantees atomicity without race conditions or extra round-trips.",
      },
    ],
    relatedComponentIds: [
      "rate-limiter",
      "api-gateway",
      "web-application-firewall",
      "circuit-breaker",
    ],
    relatedExampleIds: ["url-shortener", "payment-processing", "global-cdn-security"],
  },
  {
    id: "database-sharding",
    slug: "database-sharding",
    title: "Database Sharding & Consistent Hashing",
    subtitle: "Scaling databases horizontally beyond the physical memory and disk bounds of a single node",
    readTime: "9 min read",
    summary:
      "When dataset size, write IOPS, or connection counts exceed the vertical limits of single servers, sharding partitions rows across independent database clusters. Choosing the right shard key and distribution mechanism is critical to prevent hot spots.",
    sections: [
      {
        title: "Shard Key Selection & Skew",
        content:
          "The shard key determines where a row lives. A poor shard key (like monotonic timestamps or geographic region) leads to massive hotspot shards where a single server handles 90% of write traffic while others sit idle. High-cardinality keys (like `user_id` or `uuid`) ensure uniform distribution.",
      },
      {
        title: "Consistent Hashing & Virtual Nodes",
        content:
          "Traditional hash mod N (`hash(key) % N`) forces a complete data rebalance whenever a node is added or removed. Consistent hashing maps keys and nodes onto a circular 360° ring. Adding a node only requires migrating keys from its immediate successor.",
        codeOrFormula: "Virtual Nodes = Each physical server maps to 100-256 tokens on the hash ring",
      },
      {
        title: "Cross-Shard Queries & Two-Phase Commit",
        content:
          "Transactions spanning multiple shards require distributed two-phase commit (2PC) or Saga patterns, increasing latency significantly. Ideal schema design ensures 99% of queries can be routed to a single shard via the shard key.",
      },
      {
        title: "Directory-Based Routing & Shard Catalogs",
        content:
          "A lightweight lookup service or routing proxy (like Vitess or Citus) maintains the shard mapping and transparently routes queries, hides topology changes, and orchestrates live online resharding.",
      },
    ],
    relatedComponentIds: [
      "database-sharding-proxy",
      "relational-database",
      "distributed-nosql-database",
      "data-lakehouse",
    ],
    relatedExampleIds: ["social-feed", "ecommerce-platform", "iot-telemetry-pipeline"],
  },
];

export function getAllConcepts(): ConceptGuide[] {
  return SYSTEM_DESIGN_CONCEPTS;
}

export function getConceptBySlug(slug: string): ConceptGuide | undefined {
  return SYSTEM_DESIGN_CONCEPTS.find((c) => c.slug === slug || c.id === slug);
}
