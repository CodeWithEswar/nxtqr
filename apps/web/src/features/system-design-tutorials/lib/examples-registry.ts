import type { ArchitectureExample } from "../schemas/tutorial.schema";
import { infrastructureRegistry } from "@nxtqr/node-registry";
import { CURRENT_GRAPH_SCHEMA_VERSION, type BaseNode, type BaseEdge } from "@nxtqr/graph-schema";

function createHelperNode(
  compType: string,
  id: string,
  label: string,
  x: number,
  y: number,
  configOverrides?: Record<string, unknown>
): BaseNode {
  const comp = infrastructureRegistry.getComponent(compType);
  if (comp) {
    return infrastructureRegistry.createInfrastructureNode(compType, {
      id,
      label,
      position: { x, y },
      config: configOverrides,
    });
  }
  // Fallback for generic node types
  return {
    id,
    type: compType,
    label,
    position: { x, y },
    dimensions: { width: 220, height: 76 },
    status: "idle",
    data: { name: label, ...(configOverrides || {}) },
    ports: [
      { id: "in", name: "In", type: "input", dataType: "Any" },
      { id: "out", name: "Out", type: "output", dataType: "Any" },
    ],
  };
}

function createHelperEdge(
  id: string,
  source: string,
  target: string,
  label?: string,
  sourceHandle?: string,
  targetHandle?: string
): BaseEdge {
  return {
    id,
    source,
    target,
    sourceHandle: sourceHandle || "out",
    targetHandle: targetHandle || "in",
    type: "bezier",
    status: "idle",
    label,
    data: {},
  };
}

// 1. URL Shortener (TinyURL)
const urlShortenerNodes: BaseNode[] = [
  createHelperNode("web-browser", "node_client", "Web & API Clients", 50, 180),
  createHelperNode("authoritative-dns", "node_dns", "Authoritative Anycast DNS", 300, 180),
  createHelperNode("rate-limiter", "node_ratelimit", "Edge Rate Limiter", 550, 180),
  createHelperNode("layer-7-load-balancer", "node_alb", "Layer 7 Load Balancer", 800, 180),
  createHelperNode("backend-service", "node_api", "URL Shortener Service (Go/Rust)", 1050, 180),
  createHelperNode("distributed-cache", "node_cache", "Redis Cluster (Cache-Aside)", 1320, 90),
  createHelperNode("relational-database", "node_db", "PostgreSQL Sharded Cluster", 1320, 270),
];

const urlShortenerEdges: BaseEdge[] = [
  createHelperEdge("e1", "node_client", "node_dns", "1. Resolve Host"),
  createHelperEdge("e2", "node_client", "node_ratelimit", "2. HTTPS /shorten"),
  createHelperEdge("e3", "node_ratelimit", "node_alb", "3. Allowed Traffic"),
  createHelperEdge("e4", "node_alb", "node_api", "4. Round-Robin Route"),
  createHelperEdge("e5", "node_api", "node_cache", "5. Check Shortlink Cache"),
  createHelperEdge("e6", "node_api", "node_db", "6. DB Query on Miss / Write"),
];

// 2. E-Commerce Checkout & Inventory
const ecommerceNodes: BaseNode[] = [
  createHelperNode("mobile-application", "eco_client", "Mobile & Web Shoppers", 50, 200),
  createHelperNode("api-gateway", "eco_apigw", "Kong / Envoy API Gateway", 300, 200),
  createHelperNode("backend-service", "eco_checkout", "Checkout & Order Service", 560, 200),
  createHelperNode("saga-orchestrator", "eco_saga", "Temporal Saga Orchestrator", 820, 100),
  createHelperNode("circuit-breaker", "eco_circuit", "Resilience Circuit Breaker", 820, 290),
  createHelperNode("payment-gateway", "eco_payment", "Stripe / Adyen External Gateway", 1080, 290),
  createHelperNode("kafka-broker", "eco_kafka", "Kafka Order Events Bus", 1080, 100),
  createHelperNode("relational-database", "eco_orders_db", "PostgreSQL Orders DB", 1340, 100),
  createHelperNode("relational-database", "eco_inventory_db", "Inventory Allocation DB", 1340, 200),
  createHelperNode("notification-gateway", "eco_notify", "Notification Gateway", 1340, 300),
];

const ecommerceEdges: BaseEdge[] = [
  createHelperEdge("ec1", "eco_client", "eco_apigw", "POST /checkout"),
  createHelperEdge("ec2", "eco_apigw", "eco_checkout", "Auth & Ingress"),
  createHelperEdge("ec3", "eco_checkout", "eco_saga", "Start Checkout Saga"),
  createHelperEdge("ec4", "eco_saga", "eco_circuit", "Authorize Charge"),
  createHelperEdge("ec5", "eco_circuit", "eco_payment", "Protected Call"),
  createHelperEdge("ec6", "eco_saga", "eco_kafka", "Publish OrderCreated"),
  createHelperEdge("ec7", "eco_checkout", "eco_orders_db", "Commit Order Record"),
  createHelperEdge("ec8", "eco_kafka", "eco_inventory_db", "Deduct Stock"),
  createHelperEdge("ec9", "eco_kafka", "eco_notify", "Trigger Email/SMS Confirmation"),
];

// 3. Real-Time Chat & Collaboration
const chatNodes: BaseNode[] = [
  createHelperNode("desktop-application", "chat_user1", "Chat Client Alice", 50, 120),
  createHelperNode("mobile-application", "chat_user2", "Chat Client Bob", 50, 260),
  createHelperNode("layer-4-load-balancer", "chat_lb", "Layer-4 TCP Load Balancer", 300, 190),
  createHelperNode("websocket-server", "chat_ws1", "WebSocket Gateway #1", 560, 120),
  createHelperNode("websocket-server", "chat_ws2", "WebSocket Gateway #2", 560, 260),
  createHelperNode("presence-service", "chat_presence", "Presence Service", 830, 70),
  createHelperNode("redis-cache", "chat_redis", "Redis Pub/Sub & Presence Cache", 830, 200),
  createHelperNode("message-queue", "chat_queue", "Async Persistence Queue", 830, 330),
  createHelperNode("wide-column-database", "chat_db", "Cassandra / ScyllaDB Message Store", 1100, 330),
  createHelperNode("push-notification-service", "chat_push", "Apple APNs / Google FCM", 1100, 190),
];

const chatEdges: BaseEdge[] = [
  createHelperEdge("ch1", "chat_user1", "chat_lb", "WSS Handshake"),
  createHelperEdge("ch2", "chat_user2", "chat_lb", "WSS Handshake"),
  createHelperEdge("ch3", "chat_lb", "chat_ws1", "Persistent TCP Session"),
  createHelperEdge("ch4", "chat_lb", "chat_ws2", "Persistent TCP Session"),
  createHelperEdge("ch5", "chat_ws1", "chat_presence", "Heartbeat Ping"),
  createHelperEdge("ch6", "chat_ws1", "chat_redis", "Publish Message"),
  createHelperEdge("ch7", "chat_redis", "chat_ws2", "Broadcast to Channel Sub"),
  createHelperEdge("ch8", "chat_ws1", "chat_queue", "Enqueue History Write"),
  createHelperEdge("ch9", "chat_queue", "chat_db", "Batch Write Messages"),
  createHelperEdge("ch10", "chat_redis", "chat_push", "Notify Offline User"),
];

// 4. Video Streaming Platform
const videoNodes: BaseNode[] = [
  createHelperNode("desktop-application", "vid_tv", "Living Room TV Client", 50, 120),
  createHelperNode("mobile-application", "vid_mob", "Mobile Video App", 50, 260),
  createHelperNode("cdn", "vid_cdn", "Global Edge CDN (CloudFront)", 320, 190),
  createHelperNode("api-gateway", "vid_apigw", "Playback API Gateway", 600, 90),
  createHelperNode("object-storage", "vid_s3", "S3 Video Chunk Storage (HLS/DASH)", 600, 280),
  createHelperNode("backend-service", "vid_meta", "Metadata & Recommendation Service", 880, 90),
  createHelperNode("video-transcoder", "vid_transcoder", "Distributed Video Transcoder", 880, 280),
  createHelperNode("wide-column-database", "vid_db", "Video Catalog & User History DB", 1150, 90),
];

const videoEdges: BaseEdge[] = [
  createHelperEdge("v1", "vid_tv", "vid_cdn", "GET /manifest.m3u8"),
  createHelperEdge("v2", "vid_mob", "vid_cdn", "GET /chunks/segment_4k.ts"),
  createHelperEdge("v3", "vid_cdn", "vid_s3", "Origin Pull Video Segments"),
  createHelperEdge("v4", "vid_tv", "vid_apigw", "Fetch Watch History & DRM"),
  createHelperEdge("v5", "vid_apigw", "vid_meta", "Authorize Stream"),
  createHelperEdge("v6", "vid_meta", "vid_db", "Query User Watch State"),
  createHelperEdge("v7", "vid_transcoder", "vid_s3", "Store 4K/1080p/720p HLS Chunks"),
];

// 5. Social Feed with Fanout-on-Write
const feedNodes: BaseNode[] = [
  createHelperNode("mobile-application", "feed_author", "Post Author", 50, 120),
  createHelperNode("web-browser", "feed_follower", "Follower Reading Feed", 50, 280),
  createHelperNode("api-gateway", "feed_gw", "Edge Ingress Gateway", 300, 200),
  createHelperNode("backend-service", "feed_post_svc", "Post Ingestion Service", 560, 120),
  createHelperNode("backend-service", "feed_read_svc", "Feed Reader Service", 560, 280),
  createHelperNode("kafka-broker", "feed_kafka", "Kafka Fanout Topic", 820, 120),
  createHelperNode("graph-database", "feed_graph_db", "Social Graph DB (Followers)", 820, 280),
  createHelperNode("background-worker", "feed_workers", "Fanout-on-Write Workers", 1080, 120),
  createHelperNode("redis-cache", "feed_redis", "Redis Timeline Caches", 1080, 280),
  createHelperNode("document-database", "feed_doc_db", "MongoDB Post Store", 1340, 120),
];

const feedEdges: BaseEdge[] = [
  createHelperEdge("f1", "feed_author", "feed_gw", "POST /posts/create"),
  createHelperEdge("f2", "feed_follower", "feed_gw", "GET /feed/timeline"),
  createHelperEdge("f3", "feed_gw", "feed_post_svc", "Route Mutation"),
  createHelperEdge("f4", "feed_gw", "feed_read_svc", "Route Query"),
  createHelperEdge("f5", "feed_post_svc", "feed_doc_db", "Persist Full Post"),
  createHelperEdge("f6", "feed_post_svc", "feed_kafka", "Emit PostPublished"),
  createHelperEdge("f7", "feed_kafka", "feed_workers", "Consume Event"),
  createHelperEdge("f8", "feed_workers", "feed_graph_db", "Fetch Followers (if < 25k)"),
  createHelperEdge("f9", "feed_workers", "feed_redis", "LPUSH PostID to Timeline"),
  createHelperEdge("f10", "feed_read_svc", "feed_redis", "LRANGE 0 20 (Fast Read)"),
];

// 6. Multi-Channel Notification Gateway
const notifyNodes: BaseNode[] = [
  createHelperNode("backend-service", "not_source", "Internal Microservices", 50, 180),
  createHelperNode("api-gateway", "not_gw", "Internal Ingress API", 280, 180),
  createHelperNode("idempotency-service", "not_idemp", "Notification Dedup Service", 520, 180),
  createHelperNode("message-queue", "not_p0_queue", "Priority Queue (OTP / Alerts)", 780, 90),
  createHelperNode("message-queue", "not_p1_queue", "Standard Queue (Marketing / Digests)", 780, 270),
  createHelperNode("push-notification-service", "not_apns", "Apple / Google Push Service", 1060, 70),
  createHelperNode("external-rest-api", "not_email", "Email Delivery Provider (SendGrid)", 1060, 180),
  createHelperNode("external-rest-api", "not_sms", "SMS Gateway (Twilio)", 1060, 290),
  createHelperNode("dead-letter-queue", "not_dlq", "Failed Delivery DLQ", 1320, 180),
];

const notifyEdges: BaseEdge[] = [
  createHelperEdge("n1", "not_source", "not_gw", "Send Notification"),
  createHelperEdge("n2", "not_gw", "not_idemp", "Verify Idempotency Key"),
  createHelperEdge("n3", "not_idemp", "not_p0_queue", "Route Critical Urgent"),
  createHelperEdge("n4", "not_idemp", "not_p1_queue", "Route Standard Batch"),
  createHelperEdge("n5", "not_p0_queue", "not_apns", "Dispatch Instant Push"),
  createHelperEdge("n6", "not_p0_queue", "not_sms", "Dispatch 2FA OTP"),
  createHelperEdge("n7", "not_p1_queue", "not_email", "Dispatch Newsletter / Digest"),
  createHelperEdge("n8", "not_apns", "not_dlq", "On 3x Failed Retries"),
  createHelperEdge("n9", "not_email", "not_dlq", "On Hard Bounce"),
];

// 7. Fault-Tolerant Payment Processing
const paymentNodes: BaseNode[] = [
  createHelperNode("backend-service", "pay_app", "Checkout App Service", 50, 180),
  createHelperNode("idempotency-service", "pay_idemp", "Redis Distributed Lock & Dedup", 280, 180),
  createHelperNode("backend-service", "pay_ledger", "Immutable Double-Entry Ledger", 540, 180),
  createHelperNode("circuit-breaker", "pay_cb", "External PSP Circuit Breaker", 800, 180),
  createHelperNode("retry-controller", "pay_retry", "Exponential Backoff & Jitter", 800, 280),
  createHelperNode("payment-gateway", "pay_psp", "External Card Processor (Stripe)", 1080, 180),
  createHelperNode("relational-database", "pay_db", "Encrypted Financial Ledger DB", 800, 70),
  createHelperNode("dead-letter-queue", "pay_dlq", "Manual Reconciliation DLQ", 1340, 180),
];

const paymentEdges: BaseEdge[] = [
  createHelperEdge("p1", "pay_app", "pay_idemp", "Lock Mutation with IdempotencyKey"),
  createHelperEdge("p2", "pay_idemp", "pay_ledger", "Record Pending Journal Entry"),
  createHelperEdge("p3", "pay_ledger", "pay_db", "Atomic ACID Commit"),
  createHelperEdge("p4", "pay_ledger", "pay_cb", "Execute PSP Charge"),
  createHelperEdge("p5", "pay_cb", "pay_psp", "Secure TLS Mutual Auth"),
  createHelperEdge("p6", "pay_cb", "pay_retry", "On 503 / Timeout (Tripped)"),
  createHelperEdge("p7", "pay_retry", "pay_psp", "Retry with Jitter"),
  createHelperEdge("p8", "pay_cb", "pay_dlq", "Exhausted Retries → Manual Audit"),
];

// 8. High-Throughput IoT Telemetry Pipeline
const iotNodes: BaseNode[] = [
  createHelperNode("iot-device", "iot_fleet", "1,000,000 Connected Edge Sensors", 50, 180),
  createHelperNode("mqtt-broker", "iot_mqtt", "Clustered MQTT Broker (EMQX)", 300, 180),
  createHelperNode("kafka-broker", "iot_kafka", "Kafka Telemetry Topic", 560, 180),
  createHelperNode("stream-processor", "iot_flink", "Stream Processor (Window Aggregation)", 820, 180),
  createHelperNode("time-series-database", "iot_tsdb", "InfluxDB / TimescaleDB (Metrics)", 1100, 100),
  createHelperNode("data-warehouse", "iot_clickhouse", "Analytical Data Warehouse", 1100, 260),
  createHelperNode("monitoring-service", "iot_alerts", "Anomaly Alerting & Rule Engine", 1360, 180),
];

const iotEdges: BaseEdge[] = [
  createHelperEdge("i1", "iot_fleet", "iot_mqtt", "MQTT QoS 1 Publish"),
  createHelperEdge("i2", "iot_mqtt", "iot_kafka", "Stream Bridge Ingestion"),
  createHelperEdge("i3", "iot_kafka", "iot_flink", "Real-Time Event Stream"),
  createHelperEdge("i4", "iot_flink", "iot_tsdb", "Write 10s Window Metrics"),
  createHelperEdge("i5", "iot_flink", "iot_clickhouse", "Bulk Columnar Append"),
  createHelperEdge("i6", "iot_flink", "iot_alerts", "Threshold Trigger"),
];

// 9. Global CDN & Zero-Trust Security
const cdnSecNodes: BaseNode[] = [
  createHelperNode("web-browser", "sec_user", "Global Web User", 50, 180),
  createHelperNode("authoritative-dns", "sec_dns", "Geo-DNS Anycast", 280, 180),
  createHelperNode("cdn", "sec_cdn", "CloudFlare / Fastly Edge CDN", 520, 180),
  createHelperNode("web-application-firewall", "sec_waf", "Edge WAF (OWASP Top 10 + DDoS)", 780, 180),
  createHelperNode("layer-7-load-balancer", "sec_alb", "mTLS Ingress Load Balancer", 1040, 180),
  createHelperNode("cloud-iam", "sec_iam", "Zero-Trust Identity Provider", 1040, 70),
  createHelperNode("container-cluster", "sec_k8s", "Kubernetes Backend Origin", 1300, 180),
];

const cdnSecEdges: BaseEdge[] = [
  createHelperEdge("s1", "sec_user", "sec_dns", "Resolve nearest PoP"),
  createHelperEdge("s2", "sec_user", "sec_cdn", "HTTPS Connection"),
  createHelperEdge("s3", "sec_cdn", "sec_waf", "Origin Request Inspection"),
  createHelperEdge("s4", "sec_waf", "sec_alb", "Filtered Clean Traffic"),
  createHelperEdge("s5", "sec_alb", "sec_iam", "Validate JWT & Client Cert"),
  createHelperEdge("s6", "sec_alb", "sec_k8s", "Forward to Pod Service"),
];

// 10. Enterprise RAG AI Knowledge Assistant
const ragNodes: BaseNode[] = [
  createHelperNode("desktop-application", "rag_user", "Knowledge Worker", 50, 180),
  createHelperNode("api-gateway", "rag_gw", "AI Gateway & Prompt Filter", 280, 180),
  createHelperNode("redis-cache", "rag_cache", "Semantic Embeddings Cache (Redis)", 540, 90),
  createHelperNode("backend-service", "rag_orchestrator", "RAG Pipeline Orchestrator", 540, 270),
  createHelperNode("vector-database", "rag_vector_db", "Pinecone / Milvus Vector Store", 820, 270),
  createHelperNode("object-storage", "rag_docs", "Enterprise PDF & Doc Lake (S3)", 820, 390),
  createHelperNode("external-rest-api", "rag_llm", "Large Language Model (Claude / Gemini)", 1100, 270),
];

const ragEdges: BaseEdge[] = [
  createHelperEdge("r1", "rag_user", "rag_gw", "Query: 'Explain SOC2 retention'"),
  createHelperEdge("r2", "rag_gw", "rag_cache", "Check Semantic Vector Hit"),
  createHelperEdge("r3", "rag_gw", "rag_orchestrator", "On Cache Miss: Execute RAG"),
  createHelperEdge("r4", "rag_orchestrator", "rag_vector_db", "Top-K Cosine Similarity Search"),
  createHelperEdge("r5", "rag_vector_db", "rag_docs", "Retrieve Document Chunks"),
  createHelperEdge("r6", "rag_orchestrator", "rag_llm", "Prompt + Grounded Context Injection"),
  createHelperEdge("r7", "rag_llm", "rag_orchestrator", "Synthesized Answer with Citations"),
  createHelperEdge("r8", "rag_orchestrator", "rag_cache", "Store Query Embedding & Response"),
];

// 11. Distributed Large File Upload
const uploadNodes: BaseNode[] = [
  createHelperNode("web-browser", "up_client", "Creator Browser (10GB Video)", 50, 180),
  createHelperNode("backend-service", "up_api", "Upload Coordination Service", 300, 90),
  createHelperNode("object-storage", "up_s3", "S3 Bucket (Multipart Ingestion)", 580, 180),
  createHelperNode("kafka-broker", "up_event", "S3 Event Notification (SQS/Kafka)", 840, 180),
  createHelperNode("background-worker", "up_scanner", "ClamAV Malware & Virus Scanner", 1100, 100),
  createHelperNode("video-transcoder", "up_transcoder", "Adaptive Transcoder (HLS/DASH)", 1100, 260),
  createHelperNode("third-party-webhook", "up_webhook", "Client Webhook Notification", 1360, 180),
];

const uploadEdges: BaseEdge[] = [
  createHelperEdge("u1", "up_client", "up_api", "1. Request Presigned Multipart URLs"),
  createHelperEdge("u2", "up_api", "up_s3", "Generate Chunk Keys"),
  createHelperEdge("u3", "up_client", "up_s3", "2. Direct Parallel Chunk Uploads (5MB ea)"),
  createHelperEdge("u4", "up_s3", "up_event", "3. ObjectCreated Event"),
  createHelperEdge("u5", "up_event", "up_scanner", "Trigger Security Scan"),
  createHelperEdge("u6", "up_scanner", "up_transcoder", "Clean: Start Video Transcoding"),
  createHelperEdge("u7", "up_transcoder", "up_webhook", "Dispatch 'UploadReady' Payload"),
];

// 12. Microservices Service Mesh & Observability
const meshNodes: BaseNode[] = [
  createHelperNode("api-gateway", "mesh_ingress", "Envoy Edge Ingress Gateway", 50, 180),
  createHelperNode("backend-service", "mesh_auth", "Identity & Auth Service", 320, 90),
  createHelperNode("backend-service", "mesh_order", "Order Management Service", 320, 270),
  createHelperNode("service-discovery", "mesh_registry", "Consul / K8s CoreDNS Registry", 600, 90),
  createHelperNode("circuit-breaker", "mesh_cb", "Sidecar Circuit Breaker (Envoy)", 600, 270),
  createHelperNode("distributed-tracing", "mesh_jaeger", "OpenTelemetry Collector / Jaeger", 880, 90),
  createHelperNode("monitoring-service", "mesh_prom", "Prometheus Metrics & Grafana", 880, 270),
  createHelperNode("relational-database", "mesh_db", "Isolated Microservice Database", 1140, 270),
];

const meshEdges: BaseEdge[] = [
  createHelperEdge("m1", "mesh_ingress", "mesh_auth", "Verify Token"),
  createHelperEdge("m2", "mesh_ingress", "mesh_order", "Forward Authorized Request"),
  createHelperEdge("m3", "mesh_order", "mesh_registry", "Resolve Target Pod IP"),
  createHelperEdge("m4", "mesh_order", "mesh_cb", "Egress via Sidecar Proxy"),
  createHelperEdge("m5", "mesh_order", "mesh_db", "Query SQL Database"),
  createHelperEdge("m6", "mesh_order", "mesh_jaeger", "Export W3C Trace Context"),
  createHelperEdge("m7", "mesh_cb", "mesh_prom", "Export Request Latency & Error Rate"),
];

export const ARCHITECTURE_EXAMPLES: ArchitectureExample[] = [
  {
    id: "url-shortener",
    slug: "url-shortener",
    title: "High-Volume URL Shortener (TinyURL)",
    subtitle: "Handling 100,000+ reads/sec with Cache-Aside, Base62 encoding, and sharded persistence",
    category: "Web & API Systems",
    difficulty: "Beginner",
    scale: {
      requestsPerSec: "100,000 reads/sec, 1,000 writes/sec",
      storagePerDay: "100M URLs/year ≈ 50GB/year",
      latencyTarget: "< 10ms read latency (p99)",
      availabilityTarget: "99.99%",
    },
    summary:
      "A classic system design problem balancing high read-to-write ratios (100:1), sub-10ms redirection latency, predictable hash collisions, and massive distributed caching.",
    requirements: {
      functional: [
        "Given a long URL, generate a unique 7-character short URL.",
        "When a user navigates to the short URL, redirect them with HTTP 301/302 to the original URL.",
        "Support custom user aliases and configurable expiration timestamps.",
      ],
      nonFunctional: [
        "Ultra-low latency: Redirection lookup must complete in under 10ms.",
        "High availability: The system must never experience downtime on link clicks.",
        "Non-guessable shortlinks to prevent enumeration scraping attacks.",
      ],
    },
    flowSteps: [
      { step: 1, from: "Web Client", to: "DNS Server", protocol: "DNS", description: "Client queries anycast DNS to find nearest edge load balancer IP." },
      { step: 2, from: "Web Client", to: "Rate Limiter", protocol: "HTTPS", description: "Client sends POST /shorten or GET /{hash}. Rate limiter verifies token bucket." },
      { step: 3, from: "Rate Limiter", to: "Load Balancer", protocol: "TCP", description: "Legitimate requests are forwarded across stateless application servers." },
      { step: 4, from: "API Service", to: "Distributed Cache", protocol: "RESP", description: "Service checks Redis cache for hash. On cache hit (90%+), returns HTTP 301 instantly." },
      { step: 5, from: "API Service", to: "Relational DB", protocol: "PostgreSQL", description: "On cache miss, queries database by primary key, populates cache with TTL, and redirects." },
    ],
    keyDecisions: [
      {
        topic: "Hash Algorithm vs Distributed Sequence Generator",
        decision: "Distributed Counter + Base62 Encoding",
        why: "MD5/SHA256 truncation causes hash collisions that require database lookup loops. Base62 of a 64-bit integer produces collision-free 7-character slugs.",
        alternativeRejected: "Truncated MD5 (produces frequent birthday paradox collisions under billions of rows).",
      },
      {
        topic: "HTTP 301 (Permanent) vs HTTP 302 (Temporary) Redirect",
        decision: "HTTP 302 Temporary Redirect",
        why: "HTTP 301 is cached by client browsers, which prevents the URL shortener from tracking click analytics and telemetry.",
        alternativeRejected: "HTTP 301 (loses analytics tracking capabilities).",
      },
    ],
    tradeoffs: [
      "Cache-Aside reduces DB load by 95% at the cost of slight cache warmup delay on initial creation.",
      "Base62 sequence generation requires a distributed ticket server or Snowflake ID generator.",
    ],
    graphDocument: {
      id: "doc_example_url_shortener",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: "URL Shortener Architecture (TinyURL)",
      nodes: urlShortenerNodes,
      edges: urlShortenerEdges,
      viewport: { x: 0, y: 0, zoom: 0.85 },
      metadata: { slug: "url-shortener", category: "Web & API Systems" },
    },
    featuredComponentIds: [
      "layer-7-load-balancer",
      "rate-limiter",
      "distributed-cache",
      "relational-database",
      "backend-service",
    ],
  },
  {
    id: "ecommerce-platform",
    slug: "ecommerce-platform",
    title: "E-Commerce Checkout & Distributed Saga",
    subtitle: "Orchestrating payments, inventory allocation, and order state with transactional sagas",
    category: "Financial & Commerce",
    difficulty: "Advanced",
    scale: {
      requestsPerSec: "15,000 checkouts/sec peak (Flash sales)",
      storagePerDay: "500GB transaction & order logs/day",
      latencyTarget: "< 350ms end-to-end checkout commit",
      availabilityTarget: "99.999% ledger consistency",
    },
    summary:
      "A mission-critical commerce architecture that prevents double-charging, overselling out-of-stock items, and inconsistent states across distributed microservices using Temporal and Kafka.",
    requirements: {
      functional: [
        "Atomically reserve inventory, charge payment gateway, and create orders.",
        "Compensate (rollback) previously completed steps if any subsequent step fails.",
        "Provide real-time order confirmation tracking.",
      ],
      nonFunctional: [
        "Absolute consistency: Zero overselling of inventory under high concurrent flash sales.",
        "Idempotency: Network retries must never execute double credit card charges.",
      ],
    },
    flowSteps: [
      { step: 1, from: "Shopper", to: "API Gateway", protocol: "HTTPS", description: "Submits checkout payload with client-generated Idempotency-Key." },
      { step: 2, from: "API Gateway", to: "Checkout Service", protocol: "gRPC", description: "Gateway authenticates JWT and forwards to Order Service." },
      { step: 3, from: "Checkout Service", to: "Saga Orchestrator", protocol: "Temporal", description: "Spawns CheckoutSaga state machine with defined compensation steps." },
      { step: 4, from: "Saga Orchestrator", to: "Circuit Breaker", protocol: "HTTPS", description: "Executes credit card charge through circuit breaker to isolate third-party latency." },
      { step: 5, from: "Saga Orchestrator", to: "Kafka Events", protocol: "Kafka", description: "Publishes OrderCreated event for downstream warehouse, inventory, and notifications." },
    ],
    keyDecisions: [
      {
        topic: "Orchestrated Saga vs Choreographed Saga",
        decision: "Centralized Orchestration (Temporal / Step Functions)",
        why: "Financial transactions require explicit state inspection, deterministic rollbacks, and clear audit logs which choreography obfuscates.",
        alternativeRejected: "Choreographed Saga (prone to cyclic dependency deadlocks and invisible failure states).",
      },
    ],
    tradeoffs: [
      "Saga orchestration adds small workflow execution overhead in exchange for bulletproof financial consistency.",
      "Optimistic locking on inventory items prevents database lock contention during flash sales.",
    ],
    graphDocument: {
      id: "doc_example_ecommerce_platform",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: "E-Commerce Checkout & Distributed Saga",
      nodes: ecommerceNodes,
      edges: ecommerceEdges,
      viewport: { x: 0, y: 0, zoom: 0.8 },
      metadata: { slug: "ecommerce-platform", category: "Financial & Commerce" },
    },
    featuredComponentIds: [
      "saga-orchestrator",
      "payment-gateway",
      "circuit-breaker",
      "kafka-broker",
      "api-gateway",
    ],
  },
  {
    id: "realtime-chat",
    slug: "realtime-chat",
    title: "Real-Time Chat & Collaboration",
    subtitle: "Powering millions of concurrent WebSocket connections, online presence, and message history",
    category: "Real-Time & Communication",
    difficulty: "Intermediate",
    scale: {
      requestsPerSec: "2,000,000 concurrent WebSocket connections",
      storagePerDay: "10B messages/day (5TB/day)",
      latencyTarget: "< 50ms message delivery p95",
      availabilityTarget: "99.99%",
    },
    summary:
      "A scalable Slack/WhatsApp-style messaging infrastructure using horizontally scaled WebSocket gateways, Redis Pub/Sub backplane, ScyllaDB for append-only chat history, and push fallbacks.",
    requirements: {
      functional: [
        "1-on-1 direct messaging and multi-user group channels.",
        "Live presence indicators (Online, Away, Offline) with heartbeats.",
        "Push notifications for disconnected or backgrounded clients.",
      ],
      nonFunctional: [
        "Sub-50ms message propagation to online peers.",
        "Zero lost messages during server reboots or connection handoffs.",
      ],
    },
    flowSteps: [
      { step: 1, from: "Clients", to: "TCP Load Balancer", protocol: "TCP/WSS", description: "Establish persistent bidirectional TLS WebSocket connections." },
      { step: 2, from: "WS Gateway", to: "Presence Service", protocol: "gRPC", description: "Registers client connection and publishes presence heartbeats." },
      { step: 3, from: "WS Gateway", to: "Redis Pub/Sub", protocol: "RESP", description: "Publishes message payload to user/room channel topic." },
      { step: 4, from: "Redis Pub/Sub", to: "Peer WS Gateway", protocol: "RESP", description: "Delivers payload to whichever gateway holds the recipient's active socket." },
      { step: 5, from: "WS Gateway", to: "Message Queue", protocol: "AMQP", description: "Asynchronously flushes chat history to ScyllaDB without blocking socket I/O." },
    ],
    keyDecisions: [
      {
        topic: "WebSocket vs Server-Sent Events (SSE) vs Long Polling",
        decision: "WebSocket (Bidirectional Full-Duplex)",
        why: "Minimizes HTTP header overhead for frequent tiny chat payloads and allows instant client typing indicator broadcasts.",
        alternativeRejected: "Long Polling (crushes servers with connection teardown overhead at scale).",
      },
    ],
    tradeoffs: [
      "Maintaining stateful WebSocket connections requires sophisticated connection draining during deployments.",
      "Decoupling persistence via message queues ensures socket threads never stall on disk I/O.",
    ],
    graphDocument: {
      id: "doc_example_realtime_chat",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: "Real-Time Chat & Presence System",
      nodes: chatNodes,
      edges: chatEdges,
      viewport: { x: 0, y: 0, zoom: 0.8 },
      metadata: { slug: "realtime-chat", category: "Real-Time & Communication" },
    },
    featuredComponentIds: [
      "websocket-server",
      "presence-service",
      "redis-cache",
      "wide-column-database",
      "push-notification-service",
    ],
  },
  {
    id: "video-streaming",
    slug: "video-streaming",
    title: "Global Video Streaming Platform",
    subtitle: "Serving petabytes of adaptive bitrate video with global CDN edge caching",
    category: "Media & Streaming",
    difficulty: "Advanced",
    scale: {
      requestsPerSec: "50,000,000 peak concurrent streams",
      storagePerDay: "100TB new video uploaded daily",
      latencyTarget: "< 200ms initial buffer, 0 rebuffering",
      availabilityTarget: "99.999%",
    },
    summary:
      "A YouTube/Netflix grade video ingestion and delivery pipeline featuring automated parallel chunk transcoding, multi-bitrate HLS packaging, edge caching, and dynamic DRM entitlement.",
    requirements: {
      functional: [
        "Upload raw multi-gigabyte video files in any format.",
        "Automatically encode into 4K, 1080p, 720p, 480p HLS chunks.",
        "Deliver seamless adaptive bitrate streaming globally without stutter.",
      ],
      nonFunctional: [
        "99%+ CDN cache hit ratio for popular video segments.",
        "Resilient against regional cloud outages via multi-CDN origin fallback.",
      ],
    },
    flowSteps: [
      { step: 1, from: "TV / Mobile", to: "Edge CDN", protocol: "HTTPS", description: "Requests master manifest file (.m3u8) indicating available bitrates." },
      { step: 2, from: "Edge CDN", to: "S3 Origin", protocol: "HTTPS", description: "On cache miss, pulls video chunks (.ts / .m4s) from object storage." },
      { step: 3, from: "Client", to: "API Gateway", protocol: "HTTPS", description: "Periodically reports playback telemetry and syncs watch progress." },
      { step: 4, from: "Transcoder", to: "Object Storage", protocol: "S3 API", description: "Encodes ingested video chunks in parallel and saves segmented files." },
    ],
    keyDecisions: [
      {
        topic: "Adaptive Bitrate Streaming: HLS vs MP4 Progressive Download",
        decision: "HLS (HTTP Live Streaming) / MPEG-DASH",
        why: "Segments video into small 2-6 second chunks so players can seamlessly step down resolution when cellular bandwidth drops.",
        alternativeRejected: "Monolithic MP4 (requires downloading large portions of the file before seeking).",
      },
    ],
    tradeoffs: [
      "Transcoding to 5 distinct bitrate resolutions increases storage cost 3x but ensures zero rebuffering on bad connections.",
    ],
    graphDocument: {
      id: "doc_example_video_streaming",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: "Global Video Streaming Architecture",
      nodes: videoNodes,
      edges: videoEdges,
      viewport: { x: 0, y: 0, zoom: 0.8 },
      metadata: { slug: "video-streaming", category: "Media & Streaming" },
    },
    featuredComponentIds: [
      "cdn",
      "video-transcoder",
      "object-storage",
      "api-gateway",
      "wide-column-database",
    ],
  },
  {
    id: "social-feed",
    slug: "social-feed",
    title: "Social Feed with Fanout-on-Write",
    subtitle: "Balancing millions of writes and sub-20ms timeline reads across skewed celebrity graphs",
    category: "Web & API Systems",
    difficulty: "Advanced",
    scale: {
      requestsPerSec: "500,000 feed reads/sec, 20,000 posts/sec",
      storagePerDay: "10TB post data/day",
      latencyTarget: "< 20ms timeline read latency",
      availabilityTarget: "99.99%",
    },
    summary:
      "A Twitter/Instagram-scale feed generation engine. Utilizes Fanout-on-Write for normal users, Fanout-on-Read for high-follower celebrities, and in-memory Redis lists for instant timeline reads.",
    requirements: {
      functional: [
        "Post text, images, and links to followers.",
        "Render a reverse-chronological or ranked personalized home feed.",
        "Follow and unfollow users with immediate feed reflection.",
      ],
      nonFunctional: [
        "Home feed must render in under 20ms.",
        "Celebrity posts (e.g. 100M followers) must not choke system message queues.",
      ],
    },
    flowSteps: [
      { step: 1, from: "Author", to: "Ingress Gateway", protocol: "HTTPS", description: "Author publishes post payload." },
      { step: 2, from: "Post Service", to: "MongoDB", protocol: "WiredTiger", description: "Stores complete post document." },
      { step: 3, from: "Post Service", to: "Kafka Fanout", protocol: "Kafka", description: "Publishes PostCreated event with author ID." },
      { step: 4, from: "Fanout Workers", to: "Graph DB", protocol: "Bolt/Cypher", description: "Queries follower list. If < 25k followers, pushes PostID to all followers' Redis timelines." },
      { step: 5, from: "Follower", to: "Read Service", protocol: "HTTPS", description: "Fetches timeline: merges pre-computed Redis timeline with active celebrity posts on read." },
    ],
    keyDecisions: [
      {
        topic: "Pure Fanout-on-Write vs Hybrid Fanout",
        decision: "Hybrid Fanout Model",
        why: "Writing to 100 million follower lists for a single celebrity post takes minutes and exhausts Redis memory. Merging celebrity posts on read solves this.",
        alternativeRejected: "Pure Fanout-on-Write (causes massive write amplification on celebrity accounts).",
      },
    ],
    tradeoffs: [
      "Hybrid fanout requires slight CPU overhead on timeline read to merge celebrity posts into the cached timeline list.",
    ],
    graphDocument: {
      id: "doc_example_social_feed",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: "Social Feed with Hybrid Fanout",
      nodes: feedNodes,
      edges: feedEdges,
      viewport: { x: 0, y: 0, zoom: 0.8 },
      metadata: { slug: "social-feed", category: "Web & API Systems" },
    },
    featuredComponentIds: [
      "kafka-broker",
      "graph-database",
      "redis-cache",
      "background-worker",
      "document-database",
    ],
  },
  {
    id: "notification-gateway",
    slug: "notification-gateway",
    title: "Multi-Channel Notification Gateway",
    subtitle: "Delivering billions of urgent OTPs, transactional emails, and push alerts with priority queues",
    category: "Messaging & Notifications",
    difficulty: "Intermediate",
    scale: {
      requestsPerSec: "200,000 notifications/sec",
      storagePerDay: "1TB delivery logs/day",
      latencyTarget: "< 1s delivery for 2FA OTPs",
      availabilityTarget: "99.999%",
    },
    summary:
      "A centralized notification platform that abstracts multi-provider channels (APNs, FCM, Twilio, SendGrid), isolates critical 2FA traffic from promotional blasts, and tracks delivery receipts.",
    requirements: {
      functional: [
        "Deliver across Push, SMS, WhatsApp, and Email through unified APIs.",
        "Prioritize time-sensitive 2FA authentication codes over bulk promotional emails.",
        "Prevent duplicate notifications within a 5-minute sliding window.",
      ],
      nonFunctional: [
        "Guaranteed delivery: Failed messages move to dead-letter queues for automatic retry.",
        "Provider failover: If SMS provider A fails, route automatically through provider B.",
      ],
    },
    flowSteps: [
      { step: 1, from: "Microservice", to: "Notification Gateway", protocol: "gRPC", description: "Sends notification payload with channel preference and priority tier (P0/P1)." },
      { step: 2, from: "Gateway", to: "Idempotency Service", protocol: "RESP", description: "Deduplicates notification to prevent user alert spam." },
      { step: 3, from: "Gateway", to: "Priority Queues", protocol: "RabbitMQ/SQS", description: "P0 (OTP) enters dedicated high-priority queue; P1 enters bulk queue." },
      { step: 4, from: "Queue Workers", to: "External Providers", protocol: "HTTPS", description: "Dispatches to APNs, FCM, Twilio, or SendGrid." },
      { step: 5, from: "Workers", to: "DLQ", protocol: "AMQP", description: "Failing dispatches are routed to DLQ after 3 exponential backoff retries." },
    ],
    keyDecisions: [
      {
        topic: "Unified Queue vs Priority Tiered Queues",
        decision: "Strict Priority-Tiered Queues (P0 Urgent vs P1 Bulk)",
        why: "A marketing blast of 10 million newsletter emails must never delay a user waiting for an urgent password-reset SMS.",
        alternativeRejected: "Single FIFO Queue (causes critical 2FA OTP starvation during marketing campaigns).",
      },
    ],
    tradeoffs: [
      "Tiered queues require dedicated worker pools scaled separately to guarantee SLA on P0 traffic.",
    ],
    graphDocument: {
      id: "doc_example_notification_gateway",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: "Multi-Channel Notification Gateway",
      nodes: notifyNodes,
      edges: notifyEdges,
      viewport: { x: 0, y: 0, zoom: 0.8 },
      metadata: { slug: "notification-gateway", category: "Messaging & Notifications" },
    },
    featuredComponentIds: [
      "notification-gateway",
      "message-queue",
      "idempotency-service",
      "push-notification-service",
      "dead-letter-queue",
    ],
  },
  {
    id: "payment-processing",
    slug: "payment-processing",
    title: "Fault-Tolerant Payment Processing & Ledger",
    subtitle: "Guaranteeing exactly-once charges, circuit breakers, and immutable audit ledgers",
    category: "Financial & Commerce",
    difficulty: "Advanced",
    scale: {
      requestsPerSec: "5,000 financial transactions/sec",
      storagePerDay: "100GB immutable audit ledger/day",
      latencyTarget: "< 500ms authorization latency",
      availabilityTarget: "99.999% data consistency",
    },
    summary:
      "A banking-grade payment execution system designed around double-entry bookkeeping, strict idempotency enforcement, circuit breakers on external acquirers, and automated reconciliation.",
    requirements: {
      functional: [
        "Process credit card charges, refunds, and bank transfers safely.",
        "Record every movement of money as a balanced double-entry ledger entry.",
        "Safely handle timeouts from external payment acquirers without ambiguous states.",
      ],
      nonFunctional: [
        "Zero duplicate charges under any network condition.",
        "Auditability: Financial records are append-only and strictly tamper-evident.",
      ],
    },
    flowSteps: [
      { step: 1, from: "App Service", to: "Idempotency Service", protocol: "gRPC", description: "Acquires distributed lock for order mutation with 120s TTL." },
      { step: 2, from: "Idempotency Service", to: "Ledger Service", protocol: "gRPC", description: "Creates pending transaction record in Postgres ledger table." },
      { step: 3, from: "Ledger Service", to: "Circuit Breaker", protocol: "TLS", description: "Attempts PSP call through circuit breaker. If PSP is returning 5xx, trips open." },
      { step: 4, from: "Circuit Breaker", to: "Payment Gateway", protocol: "HTTPS", description: "Performs mTLS authorization with Stripe/Adyen." },
      { step: 5, from: "Ledger Service", to: "DLQ", protocol: "Kafka", description: "On ambiguous network timeout, enqueues to reconciliation queue for background status verification." },
    ],
    keyDecisions: [
      {
        topic: "Single Balance Field vs Double-Entry Bookkeeping",
        decision: "Immutable Double-Entry Ledger (Credits & Debits)",
        why: "Mutating a single `user.balance` column destroys financial audit trails. Double-entry ensures sum(debits) = sum(credits) at all times.",
        alternativeRejected: "Single balance column update (untraceable discrepancies during concurrent adjustments).",
      },
    ],
    tradeoffs: [
      "Strict double-entry bookkeeping requires calculating balances from journal entries (mitigated with periodic snapshotting).",
    ],
    graphDocument: {
      id: "doc_example_payment_processing",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: "Fault-Tolerant Payment Processing & Ledger",
      nodes: paymentNodes,
      edges: paymentEdges,
      viewport: { x: 0, y: 0, zoom: 0.8 },
      metadata: { slug: "payment-processing", category: "Financial & Commerce" },
    },
    featuredComponentIds: [
      "payment-gateway",
      "circuit-breaker",
      "retry-controller",
      "idempotency-service",
      "relational-database",
    ],
  },
  {
    id: "iot-telemetry-pipeline",
    slug: "iot-telemetry-pipeline",
    title: "High-Throughput IoT Telemetry Pipeline",
    subtitle: "Ingesting millions of sensor metrics per second with MQTT, Kafka, Flink, and ClickHouse",
    category: "Data & Analytics",
    difficulty: "Advanced",
    scale: {
      requestsPerSec: "1,000,000 telemetry packets/sec",
      storagePerDay: "15TB compressed time-series data/day",
      latencyTarget: "< 5s end-to-end ingestion & dashboard visibility",
      availabilityTarget: "99.99%",
    },
    summary:
      "A massive-scale industrial IoT streaming pipeline. Ingests lightweight MQTT messages from connected vehicles/sensors, buffers them in Kafka, calculates sliding window aggregates in Flink, and stores them in ClickHouse.",
    requirements: {
      functional: [
        "Maintain low-power, lightweight connections with millions of devices.",
        "Aggregate temperature, velocity, and pressure metrics across 10-second windows.",
        "Detect equipment anomalies in real-time and trigger emergency shutdowns.",
      ],
      nonFunctional: [
        "Backpressure resilience: System must absorb sudden traffic spikes without dropping packets.",
        "High columnar compression for multi-year historical telemetry storage.",
      ],
    },
    flowSteps: [
      { step: 1, from: "Sensors", to: "MQTT Broker", protocol: "MQTT", description: "Publish telemetry payload over lightweight TCP/TLS connection." },
      { step: 2, from: "MQTT Broker", to: "Kafka Cluster", protocol: "Kafka Bridge", description: "Forwards binary telemetry batches to partitioned Kafka topics." },
      { step: 3, from: "Kafka", to: "Apache Flink", protocol: "Stream", description: "Computes tumbling and sliding window averages per device ID." },
      { step: 4, from: "Flink", to: "Timescale / InfluxDB", protocol: "TSDB", description: "Stores high-resolution raw metrics with 30-day retention." },
      { step: 5, from: "Flink", to: "ClickHouse", protocol: "Bulk Insert", description: "Appends compressed columnar batches for long-term analytical queries." },
    ],
    keyDecisions: [
      {
        topic: "HTTP vs MQTT for IoT Ingress",
        decision: "MQTT (Message Queuing Telemetry Transport)",
        why: "MQTT has a 2-byte header compared to HTTP's multi-kilobyte headers, saving massive cellular battery and bandwidth on remote edge devices.",
        alternativeRejected: "HTTP/REST (too much header overhead for frequent tiny sensor pings).",
      },
    ],
    tradeoffs: [
      "ClickHouse delivers 100x analytical query speed over traditional SQL databases by sacrificing row-level update transactions.",
    ],
    graphDocument: {
      id: "doc_example_iot_telemetry_pipeline",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: "IoT Telemetry Streaming Architecture",
      nodes: iotNodes,
      edges: iotEdges,
      viewport: { x: 0, y: 0, zoom: 0.8 },
      metadata: { slug: "iot-telemetry-pipeline", category: "Data & Analytics" },
    },
    featuredComponentIds: [
      "mqtt-broker",
      "kafka-broker",
      "stream-processor",
      "time-series-database",
      "data-warehouse",
    ],
  },
  {
    id: "global-cdn-security",
    slug: "global-cdn-security",
    title: "Global CDN Edge & Zero-Trust Security",
    subtitle: "Protecting origin servers against terabit DDoS attacks with Anycast, WAF, and mTLS",
    category: "Security & Networking",
    difficulty: "Intermediate",
    scale: {
      requestsPerSec: "10,000,000 requests/sec across 250+ Edge PoPs",
      storagePerDay: "50TB edge cached assets",
      latencyTarget: "< 15ms TTFB globally at edge",
      availabilityTarget: "100% DDoS uptime",
    },
    summary:
      "A battle-hardened edge architecture combining Anycast BGP routing, Layer 3/4 SYN flood absorption, Layer 7 WAF inspection, TLS 1.3 termination, and zero-trust identity verification before hitting origin servers.",
    requirements: {
      functional: [
        "Terminate SSL/TLS at nearest geographic edge point of presence (PoP).",
        "Block SQL injection, cross-site scripting (XSS), and credential stuffing at edge.",
        "Enforce strict Zero-Trust client certificates and mTLS for origin communication.",
      ],
      nonFunctional: [
        "Absorb volumetric DDoS attacks up to 2 Tbps without origin degradation.",
        "Global cache invalidation in under 150 milliseconds.",
      ],
    },
    flowSteps: [
      { step: 1, from: "User", to: "Geo-DNS", protocol: "DNS", description: "BGP Anycast routes user packets to nearest physical PoP." },
      { step: 2, from: "User", to: "Edge CDN", protocol: "HTTPS / TLS 1.3", description: "Terminates TLS handshake with sub-millisecond crypto offload." },
      { step: 3, from: "Edge CDN", to: "Web Application Firewall", protocol: "Internal", description: "Inspects headers and request body against OWASP rule sets." },
      { step: 4, from: "WAF", to: "Origin Load Balancer", protocol: "mTLS", description: "Authenticates via mutual TLS client certificates through private cloud interconnect." },
      { step: 5, from: "Load Balancer", to: "Kubernetes Origin", protocol: "HTTP/2", description: "Dispatches validated traffic to internal backend containers." },
    ],
    keyDecisions: [
      {
        topic: "Unicast vs Anycast DNS Routing",
        decision: "BGP Anycast Routing",
        why: "Anycast assigns the same IP address to hundreds of data centers globally. A DDoS attack is naturally diluted across all edge centers rather than concentrating on one.",
        alternativeRejected: "Unicast (a single data center IP easily gets overwhelmed by volumetric DDoS).",
      },
    ],
    tradeoffs: [
      "Terminating TLS at the edge requires distributing SSL certificates across edge nodes (automated via ACME).",
    ],
    graphDocument: {
      id: "doc_example_global_cdn_security",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: "Global CDN & Zero-Trust Security",
      nodes: cdnSecNodes,
      edges: cdnSecEdges,
      viewport: { x: 0, y: 0, zoom: 0.8 },
      metadata: { slug: "global-cdn-security", category: "Security & Networking" },
    },
    featuredComponentIds: [
      "cdn",
      "web-application-firewall",
      "authoritative-dns",
      "layer-7-load-balancer",
      "cloud-iam",
    ],
  },
  {
    id: "enterprise-rag-ai",
    slug: "enterprise-rag-ai",
    title: "Enterprise RAG AI Knowledge Assistant",
    subtitle: "Querying internal document lakes with semantic caching, embeddings, and vector similarity",
    category: "AI & Machine Learning",
    difficulty: "Advanced",
    scale: {
      requestsPerSec: "1,000 queries/sec",
      storagePerDay: "10,000,000 vector embeddings indexed",
      latencyTarget: "< 800ms full generation p90",
      availabilityTarget: "99.9%",
    },
    summary:
      "A production Retrieval-Augmented Generation (RAG) architecture. Features semantic Redis caching of query embeddings, vector similarity search across Pinecone/Milvus, document chunking pipelines, and LLM context synthesis.",
    requirements: {
      functional: [
        "Index enterprise PDFs, Notion docs, and Jira tickets automatically.",
        "Perform dense semantic search using vector cosine similarity.",
        "Synthesize grounded answers using LLMs with explicit source citations.",
      ],
      nonFunctional: [
        "Eliminate hallucination by strictly constraining prompts to retrieved context.",
        "Sub-50ms response for semantically identical questions via embedding cache.",
      ],
    },
    flowSteps: [
      { step: 1, from: "User", to: "AI Gateway", protocol: "HTTPS", description: "Submits natural language prompt." },
      { step: 2, from: "AI Gateway", to: "Semantic Cache", protocol: "RESP", description: "Checks if vector cosine similarity > 0.95 with prior cached question. If so, returns cached response instantly." },
      { step: 3, from: "Orchestrator", to: "Vector DB", protocol: "gRPC", description: "Computes query embedding and retrieves top-5 most relevant document chunks." },
      { step: 4, from: "Orchestrator", to: "Object Storage", protocol: "S3 API", description: "Pulls original document metadata and text snippets." },
      { step: 5, from: "Orchestrator", to: "LLM Provider", protocol: "HTTPS", description: "Constructs augmented prompt (System Prompt + Retrieved Chunks + User Question) and streams answer back." },
    ],
    keyDecisions: [
      {
        topic: "Exact String Caching vs Semantic Embedding Caching",
        decision: "Semantic Vector Caching (Redis VSS)",
        why: "'What is our PTO policy?' and 'How many vacation days do I get?' have different text but identical meaning. Semantic cache catches both.",
        alternativeRejected: "Exact string cache (fails whenever users phrase the same question differently).",
      },
    ],
    tradeoffs: [
      "Vector chunk retrieval adds 100-200ms latency but prevents costly LLM hallucinations.",
    ],
    graphDocument: {
      id: "doc_example_enterprise_rag_ai",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: "Enterprise RAG AI Architecture",
      nodes: ragNodes,
      edges: ragEdges,
      viewport: { x: 0, y: 0, zoom: 0.8 },
      metadata: { slug: "enterprise-rag-ai", category: "AI & Machine Learning" },
    },
    featuredComponentIds: [
      "vector-database",
      "redis-cache",
      "api-gateway",
      "object-storage",
      "external-rest-api",
    ],
  },
  {
    id: "distributed-file-upload",
    slug: "distributed-file-upload",
    title: "Resumable Large File Upload System",
    subtitle: "Uploading 50GB+ files reliably via S3 Presigned URLs, multipart chunks, and event pipelines",
    category: "Storage & File Systems",
    difficulty: "Intermediate",
    scale: {
      requestsPerSec: "50,000 concurrent file uploads",
      storagePerDay: "500TB raw uploaded assets/day",
      latencyTarget: "Instant chunk ack (< 50ms), zero memory pressure on app servers",
      availabilityTarget: "99.999%",
    },
    summary:
      "A battle-tested architecture for uploading multi-gigabyte files. Bypasses application server bottlenecks by issuing presigned S3 URLs directly to clients, followed by asynchronous virus scanning and transcoding pipelines.",
    requirements: {
      functional: [
        "Upload files up to 100GB without socket disconnect failures.",
        "Pause and resume uploads across network disconnections.",
        "Perform automatic virus inspection before making assets available.",
      ],
      nonFunctional: [
        "Zero file bytes must stream through backend API server RAM or CPU.",
        "Strict chunk integrity verification using MD5/SHA256 checksums.",
      ],
    },
    flowSteps: [
      { step: 1, from: "Client", to: "Upload API", protocol: "HTTPS", description: "Requests multipart upload session with file size and chunk count." },
      { step: 2, from: "Upload API", to: "Client", protocol: "JSON", description: "Returns presigned S3 URLs for each 5MB chunk." },
      { step: 3, from: "Client", to: "S3 Storage", protocol: "HTTPS PUT", description: "Uploads chunks directly to S3 in parallel." },
      { step: 4, from: "S3", to: "Event Bus", protocol: "EventBridge", description: "Emits ObjectCreated event when all chunks are assembled." },
      { step: 5, from: "Event Bus", to: "Virus Scanner & Transcoder", protocol: "Queue", description: "Triggers background scanning and post-processing workers." },
    ],
    keyDecisions: [
      {
        topic: "Streaming Through API Servers vs Direct S3 Presigned URLs",
        decision: "Direct Presigned URLs to S3",
        why: "Streaming 10GB files through Node/Go backend pods exhausts network sockets, worker memory, and increases server costs 10x.",
        alternativeRejected: "Proxying upload through app servers (causes severe memory leaks and pod OOM crashes).",
      },
    ],
    tradeoffs: [
      "Direct presigned uploads require clients to handle chunk retry orchestration (Tus / AWS S3 SDK).",
    ],
    graphDocument: {
      id: "doc_example_distributed_file_upload",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: "Resumable Large File Upload Architecture",
      nodes: uploadNodes,
      edges: uploadEdges,
      viewport: { x: 0, y: 0, zoom: 0.8 },
      metadata: { slug: "distributed-file-upload", category: "Storage & File Systems" },
    },
    featuredComponentIds: [
      "object-storage",
      "kafka-broker",
      "background-worker",
      "video-transcoder",
      "third-party-webhook",
    ],
  },
  {
    id: "microservices-service-mesh",
    slug: "microservices-service-mesh",
    title: "Microservices Service Mesh & Observability",
    subtitle: "Zero-trust service discovery, circuit breakers, and distributed tracing with Envoy & Jaeger",
    category: "DevOps & Observability",
    difficulty: "Advanced",
    scale: {
      requestsPerSec: "500,000 internal RPC calls/sec",
      storagePerDay: "2TB distributed trace telemetry/day",
      latencyTarget: "< 1ms sidecar proxy overhead",
      availabilityTarget: "99.999%",
    },
    summary:
      "An enterprise Kubernetes service mesh architecture utilizing Envoy sidecars for dynamic service discovery, mTLS zero-trust communication, circuit breakers, and end-to-end W3C distributed trace propagation.",
    requirements: {
      functional: [
        "Dynamically discover healthy service endpoints as pods scale up/down.",
        "Enforce zero-trust mutual TLS encryption between all internal services.",
        "Collect end-to-end distributed traces for every incoming request.",
      ],
      nonFunctional: [
        "Sub-millisecond latency overhead for sidecar proxy intercepts.",
        "Automatic traffic diversion away from failing pods via active health checks.",
      ],
    },
    flowSteps: [
      { step: 1, from: "Ingress", to: "Service Sidecar", protocol: "mTLS", description: "Routes external traffic to target service's Envoy sidecar." },
      { step: 2, from: "Sidecar", to: "Service Registry", protocol: "xDS API", description: "Queries healthy endpoints from Consul / Kubernetes CoreDNS." },
      { step: 3, from: "Sidecar", to: "Downstream Service", protocol: "gRPC / mTLS", description: "Forwards RPC with circuit breaker protection and connection pooling." },
      { step: 4, from: "Sidecar", to: "OpenTelemetry / Jaeger", protocol: "OTLP", description: "Emits span with trace ID, latency, and response code." },
      { step: 5, from: "Sidecar", to: "Prometheus", protocol: "Metrics", description: "Exposes p50/p95/p99 latency histograms and error rate counters." },
    ],
    keyDecisions: [
      {
        topic: "Application-Level Libraries (Netflix Eureka/Hystrix) vs Sidecar Service Mesh (Envoy)",
        decision: "Sidecar Service Mesh (Envoy)",
        why: "Sidecars provide polyglot language independence: Go, Python, Node, and Java services gain mTLS, retries, and tracing without changing any application code.",
        alternativeRejected: "In-code client libraries (must be rewritten and patched across every programming language).",
      },
    ],
    tradeoffs: [
      "Service mesh sidecars add ~1-2MB RAM per pod and ~0.8ms network hop latency.",
    ],
    graphDocument: {
      id: "doc_example_microservices_service_mesh",
      schemaVersion: CURRENT_GRAPH_SCHEMA_VERSION,
      visualizerType: "generic",
      title: "Microservices Service Mesh Architecture",
      nodes: meshNodes,
      edges: meshEdges,
      viewport: { x: 0, y: 0, zoom: 0.8 },
      metadata: { slug: "microservices-service-mesh", category: "DevOps & Observability" },
    },
    featuredComponentIds: [
      "service-discovery",
      "circuit-breaker",
      "distributed-tracing",
      "api-gateway",
      "relational-database",
    ],
  },
];

export function getAllExamples(): ArchitectureExample[] {
  return ARCHITECTURE_EXAMPLES;
}

export function getExampleBySlug(slug: string): ArchitectureExample | undefined {
  return ARCHITECTURE_EXAMPLES.find((e) => e.slug === slug || e.id === slug);
}

export function getExamplesForComponent(componentId: string): ArchitectureExample[] {
  return ARCHITECTURE_EXAMPLES.filter((e) =>
    e.featuredComponentIds.includes(componentId) ||
    e.graphDocument.nodes.some((n) => n.type === componentId)
  );
}
