import { infrastructureRegistry, type InfrastructureComponentDefinition, type InfrastructureCategoryDefinition } from "@nxtqr/node-registry";
import type {
  ComponentTutorial,
  TutorialPortInfo,
  TutorialScenario,
} from "../schemas/tutorial.schema";
import { getAllExamples, getExamplesForComponent } from "./examples-registry";
import { type BaseNode, type BaseEdge } from "@nxtqr/graph-schema";

const connectedNodeSpacing = 376;
const connectedPreviewCopy: Record<string, {
  description: string;
  source: { label: string; description: string; action: string };
  destination: { label: string; description: string; action: string };
}> = {
  "artifact-registry": {
    description: "Stores versioned packages and build artifacts.",
    source: {
      label: "CI build",
      description: "Builds and publishes a versioned package.",
      action: "Publish package",
    },
    destination: {
      label: "Deployment",
      description: "Downloads the pinned package version.",
      action: "Download package",
    },
  },
};

function previewPortLabel(name: string): string {
  return name.replace(/\s+(?:in|out)$/i, "");
}

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

  "model-serving": {
    classification: "Inference Acceleration & Serving Runtime",
    tagline: "Low-latency foundation model inference runtime leveraging continuous batching, PagedAttention, and tensor parallelism across GPU clusters.",
    problemSolved:
      "Standard naive model execution runs sequential inference, wasting over 80% of GPU compute and VRAM due to fixed batch padding and fragmentation of Key-Value (KV) cache tensors. Model serving runtimes partition and page the KV-cache, continuously batching incoming requests at each iteration step to maximize GPU utilization and tokens-per-second throughput.",
    howItWorksSteps: [
      { step: 1, title: "Tokenization & Request Intake", description: "Converts client prompt strings into token integer arrays, applying ChatML / Alpaca system prompt templates." },
      { step: 2, title: "PagedAttention Memory Allocation", description: "Dynamically allocates non-contiguous virtual memory blocks for attention key/values, eliminating memory fragmentation." },
      { step: 3, title: "Continuous Iteration Batching", description: "Injects incoming requests into the current decode step without waiting for older generation sequences to complete." },
      { step: 4, title: "Parallel Tensor Forward Pass", description: "Executes distributed matrix multiplications across GPU tensor cores via NVLink high-speed interconnects.", latency: "15-30ms" },
      { step: 5, title: "Token Streaming & Detokenization", description: "Streams generated output tokens progressively back to the client via Server-Sent Events (SSE).", latency: "10-20ms per token" },
    ],
    whenToUse: [
      "When hosting self-hosted open-weights LLMs (Llama, Mistral, DeepSeek) at production scale.",
      "When requiring strict sub-50ms Time-to-First-Token (TTFT) and high token generation throughput.",
      "When deploying multi-GPU tensor parallelism for models whose parameters exceed a single GPU's VRAM.",
    ],
    whenToAvoid: [
      "When third-party managed serverless model APIs (OpenAI, Anthropic, Gemini) satisfy data privacy and latency requirements at lower operational complexity.",
      "For lightweight statistical models (e.g. Scikit-learn, XGBoost) where lightweight CPU microservices suffice.",
    ],
    tradeoffs: [
      {
        dimension: "Precision vs Throughput",
        choiceA: "bfloat16 Full Precision",
        choiceB: "FP8 / INT4 Quantized (AWQ/GPTQ)",
        analysis: "BF16 preserves full mathematical precision for nuanced reasoning tasks but requires 2 bytes per parameter (140GB VRAM for a 70B model). FP8/INT4 halves or quarters VRAM consumption and doubles throughput with negligible perplexity degradation.",
        recommendedContext: "Use BF16 for high-stakes clinical/financial reasoning; use FP8/AWQ for general conversational and customer-facing RAG workloads.",
      },
    ],
    failureModes: [
      {
        name: "KV-Cache OOM Under Thundering Herd Traffic",
        trigger: "Concurrent long-context prompt submissions exhausting available GPU VRAM allocation.",
        impact: "Request rejection or degraded Time-to-First-Token due to preemption.",
        mitigation: "Configure max-num-seqs bounds, enable prompt caching, and auto-scale serving replicas across GPU pools.",
      },
    ],
  },

  "agent-orchestrator": {
    classification: "Autonomous Cognition & Tool Orchestration",
    tagline: "Cognitive planning engine coordinating iterative reasoning loops, dynamic tool calling, persistent state checkpoints, and human approval gates.",
    problemSolved:
      "Standard single-shot LLM prompts fail on multi-step engineering workflows requiring database queries, external API execution, and iterative error recovery. Agent Orchestrators govern structured execution graphs (e.g., LangGraph, ReAct), managing state checkpoints, validating tool arguments against schemas, handling execution errors gracefully, and pausing for human approval when invoking high-risk actions.",
    howItWorksSteps: [
      { step: 1, title: "Goal Deconstruction & Planning", description: "Deconstructs the user goal into a directed acyclic plan with intermediate sub-goals and tool requirements." },
      { step: 2, title: "Tool Selection & Argument Generation", description: "Prompts the foundation model with tool JSON schemas, extracting structured tool call signatures." },
      { step: 3, title: "Sandboxed Tool Execution", description: "Dispatches RPC or API calls to external services, databases, or terminal environments within strict execution sandboxes." },
      { step: 4, title: "Observation Feedback & Replanning", description: "Injects tool outputs back into the agent context scratchpad to evaluate progress and adapt next steps." },
      { step: 5, title: "Checkpoint Persistence & Delivery", description: "Persists conversational thread state to PostgreSQL and streams final synthesized artifacts to the user." },
    ],
    whenToUse: [
      "Building autonomous coding, data analysis, or customer support agents that interact with external APIs.",
      "Workflows requiring dynamic branching, retry loops, and schema-validated tool calling.",
      "Enterprise operations where critical actions (e.g. payments, deletions) require human-in-the-loop review.",
    ],
    whenToAvoid: [
      "Simple single-turn question-answering or summarization tasks that require no external tools.",
      "Hard real-time systems where multi-turn LLM reasoning latency (>2 seconds) is unacceptable.",
    ],
    tradeoffs: [
      {
        dimension: "Autonomous Execution vs Human Governance",
        choiceA: "Full Autonomous ReAct Loop",
        choiceB: "Human-in-the-Loop Interrupt Gates",
        analysis: "Full autonomy minimizes human friction and executes high-speed workflows, but risks unintended side-effects on destructive operations. Interrupt gates guarantee compliance and safety at the expense of requiring synchronous human review.",
        recommendedContext: "Use full autonomy for read-only analytical queries and drafting; require human review before write operations, financial transactions, or code merges.",
      },
    ],
    failureModes: [
      {
        name: "Infinite ReAct Loop / Tool Thrashing",
        trigger: "Agent repeatedly calling failing tools with identical arguments without making forward progress.",
        impact: "Token quota depletion, latency timeouts, and user frustration.",
        mitigation: "Enforce strict maxExecutionSteps bounds, error reflection prompts, and circuit breakers on consecutive tool failures.",
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

      const copy = connectedPreviewCopy[comp.id];
      const isolated = infrastructureRegistry.createInfrastructureNode(comp.id, {
        id: `preview_${comp.id}`,
        position: { x: connectedNodeSpacing, y: 120 },
      });
      if (copy) isolated.description = copy.description;
      const connectedNodes = [isolated];
      const connectedEdges: BaseEdge[] = [];
      const input = comp.ports.find((port) => port.type !== "output");
      const output = comp.ports.find((port) => port.type !== "input");

      if (input) {
        const id = `upstream_${comp.id}`;
        connectedNodes.unshift({
          id,
          type: "input",
          label: copy?.source.label ?? "Upstream",
          description: copy?.source.description ?? "Sends data to the featured component.",
          position: { x: 0, y: 120 },
          ports: [{ id: "out", name: input.name, type: "output", dataType: input.dataType }],
          data: {},
        });
        connectedEdges.push({
          id: `${id}_link`,
          source: id,
          target: isolated.id,
          sourceHandle: "out",
          sourcePort: "out",
          targetHandle: input.id,
          targetPort: input.id,
          type: "bezier",
          label: copy?.source.action ?? previewPortLabel(input.name),
          data: {},
        });
      }

      if (output) {
        const id = `downstream_${comp.id}`;
        connectedNodes.push({
          id,
          type: "output",
          label: copy?.destination.label ?? "Downstream",
          description: copy?.destination.description ?? "Receives data from the featured component.",
          position: { x: connectedNodeSpacing * 2, y: 120 },
          ports: [{ id: "in", name: output.name, type: "input", dataType: output.dataType }],
          data: {},
        });
        connectedEdges.push({
          id: `${id}_link`,
          source: isolated.id,
          target: id,
          sourceHandle: output.id,
          sourcePort: output.id,
          targetHandle: "in",
          targetPort: "in",
          type: "bezier",
          label: copy?.destination.action ?? previewPortLabel(output.name),
          data: {},
        });
      }

      const examples = getExamplesForComponent(comp.id);
      const architecture = (examples.find((example) =>
        example.graphDocument.nodes.some((node) => node.type === comp.id),
      ) ?? getAllExamples().find((example) =>
        example.graphDocument.nodes.some((node) => node.type === comp.id),
      ))?.graphDocument;
      const previewNodes: Record<TutorialScenario, BaseNode[]> = {
        isolated: [isolated],
        connected: connectedEdges.length ? connectedNodes : [],
        architecture: architecture?.nodes ?? [],
      };
      const previewEdges: Record<TutorialScenario, BaseEdge[]> = {
        isolated: [],
        connected: connectedEdges,
        architecture: architecture?.edges ?? [],
      };

      // Find compatible peers in the same or adjacent categories
      const allCategoryComps = infrastructureRegistry.listComponentsByCategory(comp.categoryId);
      const relatedComponentIds = allCategoryComps
        .filter((c) => c.id !== comp.id)
        .slice(0, 4)
        .map((c) => c.id);

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
