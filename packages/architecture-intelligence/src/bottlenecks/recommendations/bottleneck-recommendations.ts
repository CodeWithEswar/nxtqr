export interface BottleneckRecommendation {
  id: string;
  title: string;
  description: string;
  actionableStep: string;
  tradeOffs: string[];
}

export const BOTTLENECK_RECOMMENDATION_REGISTRY: Record<string, BottleneckRecommendation> = {
  "REC-BOT-SRV-001": {
    id: "REC-BOT-SRV-001",
    title: "Scale Compute Horizontally & Distribute Load",
    description: "Increase the number of active service replicas (`replicas > 1`) and ensure upstream load balancer distributes traffic evenly.",
    actionableStep: "Increase `replicas` in the Inspector or configure horizontal autoscaling boundaries.",
    tradeOffs: [
      "Increases cloud compute hosting costs.",
      "Requires stateless application design (externalized sessions/state).",
    ],
  },
  "REC-BOT-QUE-001": {
    id: "REC-BOT-QUE-001",
    title: "Increase Consumer Concurrency & Process in Batches",
    description: "Scale out consumer worker instances or implement message batching to raise total queue drain throughput.",
    actionableStep: "Increase consumer replica count or enable consumer batch processing (`batchSize: 50`).",
    tradeOffs: [
      "Downstream database write contention can increase if consumers commit concurrently.",
      "Batch failures require partial failure handling (e.g. dead-letter routing).",
    ],
  },
  "REC-BOT-DB-001": {
    id: "REC-BOT-DB-001",
    title: "Route Reads to Read Replicas or Introduce Distributed Cache",
    description: "Offload read queries from the primary database using read replicas or an in-memory caching layer.",
    actionableStep: "Attach read replicas or insert a Distributed Cache (Redis) node in front of the database.",
    tradeOffs: [
      "Replication lag can cause temporary read-after-write inconsistency.",
      "Cache management requires invalidation strategies to avoid stale data.",
    ],
  },
  "REC-BOT-DB-002": {
    id: "REC-BOT-DB-002",
    title: "Introduce Connection Pool Proxy (PgBouncer)",
    description: "Deploy an external connection pool proxy to multiplex thousands of client connections over a lean pool of physical database sockets.",
    actionableStep: "Set `connectionPoolSize` to match maximum worker limits or add a Connection Pool node.",
    tradeOffs: [
      "Adds an extra network hop (0.5ms–1ms).",
      "Transaction-level pooling limits session-level state and prepared statements across requests.",
    ],
  },
  "REC-BOT-CACHE-001": {
    id: "REC-BOT-CACHE-001",
    title: "Optimize Cache Keys & Extend TTL",
    description: "Normalize cache keys to reduce fragmentation, raise cache memory limits, and extend TTL where permissible.",
    actionableStep: "Increase `cacheHitRate` or extend `cacheTtlSeconds` in the Cache configuration.",
    tradeOffs: [
      "Longer TTL increases staleness risks if entity mutations do not reliably purge cache keys.",
      "Larger in-memory footprint increases cache hosting cost.",
    ],
  },
  "REC-BOT-CACHE-002": {
    id: "REC-BOT-CACHE-002",
    title: "Implement Request Coalescing (Singleflight)",
    description: "Prevent simultaneous backend queries on key expiration by using mutex locks so only one worker queries the database while others await the result.",
    actionableStep: "Enable request coalescing or implement probabilistic early expiration (XFetch algorithm).",
    tradeOffs: [
      "Slightly increases cache client software complexity.",
      "Workers waiting on the single flight lock hold open their client connection.",
    ],
  },
  "REC-BOT-NET-001": {
    id: "REC-BOT-NET-001",
    title: "Enable Response Compression & Upgrade Bandwidth",
    description: "Compress large payloads (gzip/brotli) or move media/file downloads to an edge CDN or direct S3 presigned URLs.",
    actionableStep: "Configure payload compression or offload blob transfers to Object Storage with CDN.",
    tradeOffs: [
      "Real-time compression consumes additional CPU cycles on the server.",
      "Presigned URLs require client coordination for download access.",
    ],
  },
  "REC-BOT-EXT-001": {
    id: "REC-BOT-EXT-001",
    title: "Implement Client-Side Token Bucket Rate Limiting & Batching",
    description: "Throttle outbound requests to third-party APIs using a token-bucket queue to avoid HTTP 429 rate limit rejections.",
    actionableStep: "Place an asynchronous Queue before the external API to buffer calls at contracted rate limits.",
    tradeOffs: [
      "Requests to external services may experience queue buffering latency during traffic peaks.",
      "Higher tier contracted quotas require vendor contract renegotiation.",
    ],
  },
};

