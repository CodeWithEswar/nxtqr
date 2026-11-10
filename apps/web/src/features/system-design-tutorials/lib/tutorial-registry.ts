import { infrastructureRegistry, type InfrastructureComponentDefinition, type InfrastructureCategoryDefinition } from "@nxtqr/node-registry";
import type {
  ComponentTutorial,
  TutorialPortInfo,
  TutorialScenario,
} from "../schemas/tutorial.schema";
import { getExamplesForComponent } from "./examples-registry";
import { type BaseNode, type BaseEdge } from "@nxtqr/graph-schema";

// Custom detailed technical enrichment for key infrastructure components
interface ComponentEnrichment {
  classification: string;
  tagline: string;
  problemSolved: string;
  overview?: string;
  howItWorksSteps?: {
    step: number;
    title: string;
    description: string;
    latency?: string;
    failureRisk?: string;
  }[];
  whenToUse: string[];
  whenToAvoid: string[];
  tradeoffs: {
    dimension: string;
    choiceA: string;
    choiceB: string;
    analysis: string;
    recommendedContext: string;
  }[];
  failureModes: {
    name: string;
    trigger: string;
    impact: string;
    mitigation: string;
  }[];
  upstreamReason?: string;
  downstreamReason?: string;
}

const COMPONENT_ENRICHMENTS: Record<string, ComponentEnrichment> = {
  "load-balancer": {
    classification: "Traffic Distribution (Layer 4 / Layer 7)",
    tagline: "Distribute incoming client requests evenly across healthy backend instances to maximize throughput and eliminate single points of failure.",
    problemSolved:
      "A single application server can only process a finite number of concurrent TCP connections and HTTP requests before exhausting CPU, memory, and socket file descriptors. A load balancer acts as a reverse proxy fronting multiple backend servers, continuously evaluating their health and balancing load across the server fleet.",
    howItWorksSteps: [
      { step: 1, title: "Client Connection Termination", description: "Accepts incoming TCP SYN packets or terminates TLS 1.3 handshakes, offloading cryptographic overhead from upstream backends.", latency: "1-2ms" },
      { step: 2, title: "Health Check Inspection", description: "Consults active keep-alive probes and passive error rate counters to filter out unresponsive or crashing backend instances." },
      { step: 3, title: "Algorithm Routing Decision", description: "Selects the optimal backend server based on Round Robin, Least Connections, Consistent IP Hash, or Weighted Response Time." },
      { step: 4, title: "Upstream Proxy & Keep-Alive Pooling", description: "Forwards the request over persistent multiplexed backend connections, streaming the response back to the client seamlessly.", latency: "0.5ms" },
    ],
    whenToUse: [
      "When running 2 or more backend instances for high availability or horizontal scalability.",
      "When rolling out zero-downtime blue/green deployments or canary releases.",
      "When terminating SSL/TLS certificates centrally to reduce compute overhead on application servers.",
      "When requiring active health checks to automatically isolate failing instances.",
    ],
    whenToAvoid: [
      "For simple single-server monolithic prototypes where high availability is not required.",
      "For strictly internal batch processing workers that consume messages directly from a queue (e.g. SQS/Kafka consumers do not require load balancers).",
    ],
    tradeoffs: [
      {
        dimension: "Layer 4 (Transport) vs Layer 7 (Application)",
        choiceA: "Layer 4 (TCP/UDP IP Hash)",
        choiceB: "Layer 7 (HTTP Path/Header/Cookie)",
        analysis: "Layer 4 delivers 10x higher packets-per-second throughput by avoiding HTTP payload parsing, while Layer 7 enables content-based routing, header mutation, and cookie stickiness at the expense of higher CPU.",
        recommendedContext: "Use Layer 7 for modern microservices and web APIs; use Layer 4 for gaming, WebSockets, DNS, and ultra-high packet volumes.",
      },
    ],
    failureModes: [
      {
        name: "Backend Health Check Flapping (Cascading Collapse)",
        trigger: "High traffic spike causes backend response times to exceed health check timeout threshold.",
        impact: "Load balancer marks slow servers as dead, routing 100% of traffic to the remaining healthy servers, causing them to collapse sequentially in a domino effect.",
        mitigation: "Implement graceful degradation, generous health check retry counts (e.g. 3 consecutive failures before ejection), and circuit breakers.",
      },
      {
        name: "Load Balancer Single Point of Failure (SPOF)",
        trigger: "Physical hardware failure or network interface saturation on a standalone balancer node.",
        impact: "Total ingress blackout for the entire application fleet.",
        mitigation: "Deploy active-passive pairs using VRRP (Virtual Router Redundancy Protocol) with Keepalived, or BGP Anycast equal-cost multi-path (ECMP) routing.",
      },
    ],
  },

  "api-gateway": {
    classification: "Edge Management & Microservices Ingress",
    tagline: "Centralized entry point that encapsulates internal microservice architecture and enforces authentication, rate limiting, and routing.",
    problemSolved:
      "Direct client-to-microservice communication exposes internal topologies, requires clients to authenticate with dozens of distinct endpoints, and duplicates cross-cutting concerns (CORS, SSL, rate limiting, telemetry) across every backend service.",
    howItWorksSteps: [
      { step: 1, title: "Edge Ingress & Protocol Translation", description: "Accepts public HTTPS, WebSocket, or gRPC-web connections and translates them to internal gRPC or HTTP/2 RPCs.", latency: "1-3ms" },
      { step: 2, title: "Authentication & Token Verification", description: "Validates JWT signatures, client API keys, or mTLS certificates without burdening downstream application services." },
      { step: 3, title: "Rate Limiting & Threat Inspection", description: "Enforces per-client token bucket limits and verifies request body size to protect against abusive scraping." },
      { step: 4, title: "Dynamic Routing & Service Discovery", description: "Looks up healthy target pods in the service registry (Consul / Kubernetes) and rewrites URL paths before dispatching." },
    ],
    whenToUse: [
      "When running a microservices architecture with multiple decoupled backend domains.",
      "When standardizing authentication, rate limiting, and CORS headers in a single edge tier.",
      "When aggregating data from multiple microservices into a single optimized client response (BFF pattern).",
    ],
    whenToAvoid: [
      "In small monolithic architectures where direct reverse proxying via Nginx or Caddy is sufficient.",
      "When ultra-low microsecond latency is mandatory (e.g. high-frequency trading where an extra hop is unacceptable).",
    ],
    tradeoffs: [
      {
        dimension: "Single Gateway vs Backend-for-Frontend (BFF)",
        choiceA: "Monolithic Central API Gateway",
        choiceB: "Domain-Specific BFF (Mobile vs Web)",
        analysis: "A central gateway simplifies DevOps but becomes an organizational bottleneck. BFF gateways allow mobile and web teams to optimize payload shapes independently.",
        recommendedContext: "Adopt BFF when mobile clients have constrained bandwidth and need aggressive field filtering.",
      },
    ],
    failureModes: [
      {
        name: "Gateway Memory Exhaustion via Large Payload Buffering",
        trigger: "Concurrent upload of large files without streaming chunk proxies enabled.",
        impact: "Gateway node crashes with Out of Memory (OOM), dropping thousands of active client connections.",
        mitigation: "Bypass gateway for large file uploads using S3 Presigned URLs, and enforce strict client payload limits (e.g. 10MB max).",
      },
    ],
  },

  "in-memory-cache": {
    classification: "Sub-Millisecond Performance Accelerator",
    tagline: "Store frequently accessed, computationally expensive data in high-speed RAM to minimize database latency and prevent traffic spikes.",
    problemSolved:
      "Disk-based relational and NoSQL databases become bottlenecks under read-heavy loads due to disk I/O, index scans, and lock contention. An in-memory cache delivers sub-millisecond responses by storing key-value pairs directly in RAM.",
    howItWorksSteps: [
      { step: 1, title: "Hash Index Lookup", description: "Computes cryptographic hash or murmur3 hash of the key to index memory buckets directly in O(1) time.", latency: "< 0.5ms" },
      { step: 2, title: "TTL Expiration & Eviction Check", description: "Verifies if the item has passed its time-to-live or if LRU/LFU memory eviction needs to prune cold keys." },
      { step: 3, title: "Zero-Copy Data Return", description: "Transmits serialized byte arrays directly across socket buffers without disk seek delays.", latency: "< 1ms" },
    ],
    whenToUse: [
      "For read-heavy workloads with 80/20 query distribution (Pareto principle).",
      "For ephemeral session storage, user tokens, rate limit counters, and leaderboard rankings.",
      "To protect downstream relational databases from being crushed by burst traffic.",
    ],
    whenToAvoid: [
      "When data must never be lost under any crash condition (caches are inherently volatile).",
      "When access patterns are completely uniform or write-heavy with rarely re-read data.",
    ],
    tradeoffs: [
      {
        dimension: "Cache-Aside (Lazy) vs Write-Through",
        choiceA: "Cache-Aside",
        choiceB: "Write-Through",
        analysis: "Cache-Aside only caches requested data (saving memory) but incurs high latency on initial cold reads. Write-Through keeps cache always fresh but wastes memory caching unread rows.",
        recommendedContext: "Cache-Aside is the gold standard for general web applications.",
      },
    ],
    failureModes: [
      {
        name: "Cache Stampede (Thundering Herd)",
        trigger: "A hot key expires under high concurrency (e.g. breaking news post accessed by 50,000 users/sec).",
        impact: "Thousands of concurrent requests miss the cache simultaneously and slam the primary database, causing database CPU to hit 100% and collapse.",
        mitigation: "Use mutex locking per key (single-flight), background probabilistic early refresh (XFetch), or serve stale data while recomputing.",
      },
      {
        name: "Cache Penetration",
        trigger: "Malicious clients query millions of non-existent IDs that will never be in cache.",
        impact: "Every request misses the cache and directly queries the database.",
        mitigation: "Store null values with short TTLs or deploy a Bloom Filter at the cache ingress.",
      },
    ],
  },

  "event-streaming-platform": {
    classification: "Distributed Asynchronous Backbone",
    tagline: "High-throughput, distributed, append-only commit log for decoupled event-driven architectures and real-time streaming.",
    problemSolved:
      "Direct synchronous HTTP calls between microservices create tight coupling, cascading latency, and complete failure if downstream services are temporarily unreachable. Event streams decouple producers from consumers with persistent logs.",
    howItWorksSteps: [
      { step: 1, title: "Partitioned Append-Only Write", description: "Producers hash message keys to assign them to specific partitions, appending events sequentially to disk with zero seek time.", latency: "2-5ms" },
      { step: 2, title: "In-Sync Replica (ISR) Quorum", description: "Replicates message to followers based on `acks=all` to guarantee durability against broker failures." },
      { step: 3, title: "Consumer Offset Tracking", description: "Consumer groups independently read sequential offsets, maintaining high throughput via OS page cache zero-copy reads.", latency: "5-10ms" },
    ],
    whenToUse: [
      "When building event-driven microservices with decoupled domain events (e.g. OrderCreated).",
      "For real-time data pipelines (CDC, analytics ingestion, clickstream telemetry).",
      "When messages need to be replayed from arbitrary points in time by new consumers.",
    ],
    whenToAvoid: [
      "For simple job queues where individual task acknowledgement and per-message retry/routing is needed (RabbitMQ or SQS are better fits).",
      "In small applications where operating a multi-broker ZooKeeper/KRaft cluster adds excessive operational overhead.",
    ],
    tradeoffs: [
      {
        dimension: "Partition Ordering vs Horizontal Scalability",
        choiceA: "Single Partition",
        choiceB: "Multiple Partitions",
        analysis: "A single partition guarantees strict global message ordering but limits throughput to one consumer thread. Multiple partitions scale horizontally but only guarantee ordering within a partition key.",
        recommendedContext: "Partition by entity ID (e.g. `order_id` or `user_id`) to ensure sequential ordering per entity while scaling fleet-wide.",
      },
    ],
    failureModes: [
      {
        name: "Consumer Group Lag Accumulation",
        trigger: "Downstream consumer processing slows down or crashes while producers continue publishing at peak volume.",
        impact: "Disk fills up, message latency balloons from milliseconds to hours, and consumers fall behind SLA.",
        mitigation: "Scale consumer group instances up to partition count, optimize consumer batch sizes, and monitor lag metrics closely.",
      },
    ],
  },

  "relational-database": {
    classification: "ACID Structured Persistence",
    tagline: "Strongly consistent relational data store with full ACID transaction guarantees, schema validation, and expressive SQL joins.",
    problemSolved:
      "Financial, ledger, and transactional business systems require mathematical guarantees that data will never be corrupted, lost, or left in partial states across concurrent operations.",
    howItWorksSteps: [
      { step: 1, title: "Write-Ahead Logging (WAL)", description: "Writes all changes sequentially to disk WAL before updating data pages in memory, guaranteeing durability (D in ACID).", latency: "1-4ms" },
      { step: 2, title: "Locking & MVCC Isolation", description: "Multi-Version Concurrency Control allows readers to read consistent snapshots without blocking writers.", latency: "0.5ms" },
      { step: 3, title: "B-Tree Index Traversal", description: "Traverses balanced index trees in O(log N) operations to locate target row pointers in disk pages.", latency: "1-3ms" },
    ],
    whenToUse: [
      "When financial accuracy, double-entry ledgers, and ACID transactions are required.",
      "When data entities have complex relational connections requiring relational foreign keys and relational integrity.",
      "When schemas are well-defined and change predictably.",
    ],
    whenToAvoid: [
      "For semi-structured documents with completely dynamic, unbounded nested JSON schemas.",
      "When write volume exceeds the IOPS of a single server and requires complex manual sharding.",
    ],
    tradeoffs: [
      {
        dimension: "Normalized Schema vs Denormalized Performance",
        choiceA: "3rd Normal Form (Normalized)",
        choiceB: "Denormalized (Pre-joined tables)",
        analysis: "Normalization eliminates data duplication and anomalies but requires multi-table JOINs at read time. Denormalization speeds reads but requires multi-record write updates.",
        recommendedContext: "Normalize transactional core ledgers; denormalize read-heavy views and reporting aggregates.",
      },
    ],
    failureModes: [
      {
        name: "Connection Pool Starvation",
        trigger: "Slow database queries hold client connection slots while incoming HTTP traffic continues to request connections.",
        impact: "Connection pool fills up (e.g. max 100 connections), causing all application servers to fail with connection timeout errors.",
        mitigation: "Deploy a connection pooler like PgBouncer, enforce strict query execution timeouts (`statement_timeout`), and optimize slow indexes.",
      },
    ],
  },

  "vector-database": {
    classification: "High-Dimensional Semantic AI Retrieval",
    tagline: "Specialized engine for storing high-dimensional embeddings and executing approximate nearest neighbor (ANN) similarity searches.",
    problemSolved:
      "Traditional SQL and keyword search engines match literal characters, failing completely on semantic concepts, synonyms, and natural language embeddings produced by LLMs.",
    howItWorksSteps: [
      { step: 1, title: "Vector Embedding Ingestion", description: "Accepts 768-3072 dimensional floating point vectors generated by embedding models (e.g. OpenAI text-embedding-3).", latency: "2-5ms" },
      { step: 2, title: "Hierarchical Navigable Small World (HNSW) Indexing", description: "Organizes vectors into multi-layer graph structures for fast O(log N) proximity jumps.", latency: "10-20ms" },
      { step: 3, title: "Cosine / Dot Product Distance Calculation", description: "Computes geometric angles between the query vector and candidate neighbors to rank top-K closest items.", latency: "5-15ms" },
    ],
    whenToUse: [
      "For Retrieval-Augmented Generation (RAG) AI applications querying enterprise document lakes.",
      "For semantic similarity search, recommendation engines, and image/audio similarity retrieval.",
    ],
    whenToAvoid: [
      "For exact keyword matching or full-text boolean filtering (Elasticsearch or Postgres tsvector are faster and cheaper).",
      "When datasets are small (< 10,000 vectors can simply be queried in memory via FAISS or pgvector).",
    ],
    tradeoffs: [
      {
        dimension: "Index Build Time vs Search Accuracy (Recall)",
        choiceA: "HNSW (Graph-based)",
        choiceB: "IVF-Flat (Inverted File)",
        analysis: "HNSW delivers 99%+ recall and fast queries at the cost of high RAM usage and slow indexing time. IVF-Flat indexes fast with lower memory but sacrifices recall accuracy.",
        recommendedContext: "Use HNSW for production real-time user-facing AI assistants.",
      },
    ],
    failureModes: [
      {
        name: "RAM Starvation via Index Memory Overhead",
        trigger: "HNSW graphs require storing all vectors and their graph edges resident in physical RAM.",
        impact: "Out-of-memory crash when scaling beyond server RAM boundaries.",
        mitigation: "Enable product quantization (PQ) or scalar quantization (SQ) to compress vectors 4x-8x with minimal recall loss.",
      },
    ],
  },
};

// Generic systematic generator for any of the 223 components
function generateFallbackEnrichment(
  comp: InfrastructureComponentDefinition,
  category: InfrastructureCategoryDefinition
): ComponentEnrichment {
  const name = comp.display.name;
  const catName = category.name;

  return {
    classification: `${catName} Component`,
    tagline: comp.display.description,
    problemSolved: `In modern scalable architectures, ${name} solves critical requirements in ${catName.toLowerCase()}, providing standardized interfaces, high availability, and operational isolation for engineering workloads.`,
    howItWorksSteps: [
      { step: 1, title: "Ingress & Contract Verification", description: `Receives incoming payloads according to configured ports, validating schemas and connection integrity.`, latency: "1-2ms" },
      { step: 2, title: "Core Processing Engine", description: `Executes domain-specific operations according to configuration parameters and capabilities.`, latency: "2-5ms" },
      { step: 3, title: "Egress Dispatch & Telemetry", description: `Transmits processed records or events downstream while exporting execution telemetry and health indicators.`, latency: "1-3ms" },
    ],
    whenToUse: [
      `When implementing decoupled, production-grade ${catName.toLowerCase()} workflows.`,
      `When standardizing infrastructure boundaries and maintaining operational observability.`,
      `When scaling workloads horizontally across multiple nodes or cloud availability zones.`,
    ],
    whenToAvoid: [
      `For trivial localized scripts where direct in-process execution is sufficient.`,
      `When simpler foundational primitives can fulfill requirements without adding operational complexity.`,
    ],
    tradeoffs: [
      {
        dimension: "Specialized Managed Service vs In-Cluster Self-Hosted",
        choiceA: "Self-Hosted Infrastructure",
        choiceB: "Cloud Managed Service",
        analysis: "Self-hosting grants full control and lower raw compute costs but incurs significant engineering maintenance. Managed services eliminate maintenance at the cost of cloud vendor lock-in.",
        recommendedContext: "Start with managed offerings until traffic scale justifies dedicated engineering teams.",
      },
    ],
    failureModes: [
      {
        name: "Upstream Saturation / Resource Exhaustion",
        trigger: "Unexpected traffic spike exceeding provisioned capacity or connection limits.",
        impact: "Increased latency, thread starvation, and potential cascading timeouts to calling services.",
        mitigation: "Implement rate limiting, backpressure signaling, and automated autoscaling triggers.",
      },
      {
        name: "Network Partition / Health Check Degradation",
        trigger: "Transient packet loss or unresponsive dependencies in the same cluster.",
        impact: "Intermittent timeouts on client requests.",
        mitigation: "Deploy redundant multi-zone instances with circuit breakers and retry controllers with jitter.",
      },
    ],
  };
}

export class TutorialRegistryClass {
  private tutorials = new Map<string, ComponentTutorial>();

  constructor() {
    this.buildTutorials();
  }

  private buildTutorials(): void {
    const components = infrastructureRegistry.listComponents();

    for (const comp of components) {
      const category = infrastructureRegistry.getCategory(comp.categoryId) || {
        id: comp.categoryId,
        name: comp.categoryId.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        description: "Infrastructure Category",
        order: 99,
      };

      const customEnrichment = COMPONENT_ENRICHMENTS[comp.id];
      const enrichment = customEnrichment || generateFallbackEnrichment(comp, category);

      // Map ports
      const ports: TutorialPortInfo[] = comp.ports.map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        dataType: p.dataType,
        description: p.description || `${p.name} port for ${comp.display.name}`,
        compatibleTypes: p.dataType ? [p.dataType] : ["Any"],
      }));

      // Synthesize 3 interactive preview scenarios
      const previewNodes: Record<TutorialScenario, BaseNode[]> = {
        isolated: [
          infrastructureRegistry.createInfrastructureNode(comp.id, {
            id: `isolated_${comp.id}`,
            label: comp.display.name,
            position: { x: 280, y: 140 },
          }),
        ],
        connected: [
          {
            id: `caller_${comp.id}`,
            type: "web-browser",
            label: "Calling Client",
            position: { x: 50, y: 140 },
            dimensions: { width: 180, height: 70 },
            status: "idle",
            data: { name: "Client Ingress" },
            ports: [{ id: "out", name: "Out", type: "output", dataType: "Any" }],
          },
          infrastructureRegistry.createInfrastructureNode(comp.id, {
            id: `target_${comp.id}`,
            label: comp.display.name,
            position: { x: 320, y: 140 },
          }),
          {
            id: `dep_${comp.id}`,
            type: "relational-database",
            label: "Downstream Target",
            position: { x: 620, y: 140 },
            dimensions: { width: 180, height: 70 },
            status: "idle",
            data: { name: "Downstream Target" },
            ports: [{ id: "in", name: "In", type: "input", dataType: "Any" }],
          },
        ],
        architecture: [
          {
            id: `arch_client_${comp.id}`,
            type: "web-browser",
            label: "Web Clients",
            position: { x: 40, y: 140 },
            dimensions: { width: 160, height: 70 },
            status: "idle",
            data: { name: "Web Clients" },
            ports: [{ id: "out", name: "Out", type: "output", dataType: "Any" }],
          },
          infrastructureRegistry.createInfrastructureNode(comp.id, {
            id: `arch_core_${comp.id}`,
            label: comp.display.name,
            position: { x: 280, y: 140 },
          }),
          {
            id: `arch_cache_${comp.id}`,
            type: "redis-cache",
            label: "Fast Cache",
            position: { x: 540, y: 70 },
            dimensions: { width: 170, height: 70 },
            status: "idle",
            data: { name: "Fast Cache" },
            ports: [
              { id: "in", name: "In", type: "input", dataType: "Any" },
              { id: "out", name: "Out", type: "output", dataType: "Any" },
            ],
          },
          {
            id: `arch_store_${comp.id}`,
            type: "relational-database",
            label: "Primary Database",
            position: { x: 540, y: 220 },
            dimensions: { width: 170, height: 70 },
            status: "idle",
            data: { name: "Primary Database" },
            ports: [{ id: "in", name: "In", type: "input", dataType: "Any" }],
          },
        ],
      };

      const previewEdges: Record<TutorialScenario, BaseEdge[]> = {
        isolated: [],
        connected: [
          {
            id: `edge_c1_${comp.id}`,
            source: `caller_${comp.id}`,
            target: `target_${comp.id}`,
            sourceHandle: "out",
            targetHandle: comp.ports.find((p) => p.type === "input" || p.type === "bidirectional")?.id || "in",
            type: "bezier",
            status: "idle",
            label: "Request Ingress",
            data: {},
          },
          {
            id: `edge_c2_${comp.id}`,
            source: `target_${comp.id}`,
            target: `dep_${comp.id}`,
            sourceHandle: comp.ports.find((p) => p.type === "output" || p.type === "bidirectional")?.id || "out",
            targetHandle: "in",
            type: "bezier",
            status: "idle",
            label: "Egress Traffic",
            data: {},
          },
        ],
        architecture: [
          {
            id: `edge_a1_${comp.id}`,
            source: `arch_client_${comp.id}`,
            target: `arch_core_${comp.id}`,
            sourceHandle: "out",
            targetHandle: comp.ports.find((p) => p.type === "input" || p.type === "bidirectional")?.id || "in",
            type: "bezier",
            status: "idle",
            label: "HTTPS Ingress",
            data: {},
          },
          {
            id: `edge_a2_${comp.id}`,
            source: `arch_core_${comp.id}`,
            target: `arch_cache_${comp.id}`,
            sourceHandle: comp.ports.find((p) => p.type === "output" || p.type === "bidirectional")?.id || "out",
            targetHandle: "in",
            type: "bezier",
            status: "idle",
            label: "Check Cache",
            data: {},
          },
          {
            id: `edge_a3_${comp.id}`,
            source: `arch_core_${comp.id}`,
            target: `arch_store_${comp.id}`,
            sourceHandle: comp.ports.find((p) => p.type === "output" || p.type === "bidirectional")?.id || "out",
            targetHandle: "in",
            type: "bezier",
            status: "idle",
            label: "Store / Miss",
            data: {},
          },
        ],
      };

      // Find compatible peers in the same or adjacent categories
      const allCategoryComps = infrastructureRegistry.listComponentsByCategory(comp.categoryId);
      const relatedComponentIds = allCategoryComps
        .filter((c) => c.id !== comp.id)
        .slice(0, 4)
        .map((c) => c.id);

      const examples = getExamplesForComponent(comp.id);

      const tutorial: ComponentTutorial = {
        id: comp.id,
        name: comp.display.name,
        shortName: comp.display.shortName,
        categoryId: category.id,
        categoryName: category.name,
        iconSlug: comp.display.iconSlug,
        classification: enrichment.classification,
        tagline: enrichment.tagline,
        overview: enrichment.overview || comp.display.description,
        problemSolved: enrichment.problemSolved,
        howItWorks: {
          summary: `Traffic and state transition through ${comp.display.name} via high-performance pipelines.`,
          steps: enrichment.howItWorksSteps || [],
        },
        whenToUse: enrichment.whenToUse,
        whenToAvoid: enrichment.whenToAvoid,
        tradeoffs: enrichment.tradeoffs,
        failureModes: enrichment.failureModes,
        ports,
        compatibleUpstream: [
          { id: "api-gateway", name: "API Gateway", reason: "Standard edge ingress routing" },
          { id: "layer-7-load-balancer", name: "Layer 7 Load Balancer", reason: "Even traffic distribution" },
        ],
        compatibleDownstream: [
          { id: "relational-database", name: "Relational Database", reason: "Persistent state commits" },
          { id: "redis-cache", name: "Redis Cache", reason: "Fast sub-millisecond retrieval" },
        ],
        relatedComponentIds,
        exampleArchitectureIds: examples.map((e) => e.slug),
        previewNodes,
        previewEdges,
      };

      this.tutorials.set(comp.id, tutorial);
    }
  }

  public getAllComponentTutorials(): ComponentTutorial[] {
    return Array.from(this.tutorials.values());
  }

  public getComponentTutorial(idOrSlug: string): ComponentTutorial | undefined {
    return this.tutorials.get(idOrSlug);
  }

  public getTutorialsByCategory(categoryId: string): ComponentTutorial[] {
    return Array.from(this.tutorials.values()).filter((t) => t.categoryId === categoryId);
  }

  public getAllCategoriesWithCounts(): {
    category: InfrastructureCategoryDefinition;
    count: number;
    components: ComponentTutorial[];
  }[] {
    const categories = infrastructureRegistry.listCategories();
    return categories.map((cat) => {
      const components = this.getTutorialsByCategory(cat.id);
      return {
        category: cat,
        count: components.length,
        components,
      };
    });
  }
}

export const tutorialRegistry = new TutorialRegistryClass();
