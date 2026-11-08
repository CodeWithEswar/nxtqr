import type { NodeDefinition } from "./registry";

export const standardNodeDefinitions: NodeDefinition[] = [
  {
    type: "input",
    visualizerType: "system-design",
    label: "Ingress / Trigger",
    category: "Entrypoint",
    description: "Initial HTTP request, event trigger, or client connection source.",
    defaultData: {
      protocol: "HTTPS",
      rateLimitRps: 1000,
      authRequired: true,
      path: "/api/v1/stream",
    },
    ports: [
      { id: "out", name: "Out", type: "output", dataType: "RequestPayload" },
    ],
  },
  {
    type: "process",
    visualizerType: "system-design",
    label: "Compute Worker",
    category: "Processing",
    description: "Transformation worker, matrix processor, or compute lambda.",
    defaultData: {
      concurrency: 4,
      timeoutMs: 5000,
      memoryMb: 512,
      runtime: "NodeJS 20 LTS",
    },
    ports: [
      { id: "in", name: "In", type: "input", dataType: "RequestPayload" },
      { id: "out", name: "Out", type: "output", dataType: "ProcessedData" },
    ],
  },
  {
    type: "decision",
    visualizerType: "system-design",
    label: "Routing Decision",
    category: "Logic",
    description: "Conditional logic branch based on payload evaluation or status code.",
    defaultData: {
      condition: "payload.status === 200",
      fallbackRoute: "error_handler",
    },
    ports: [
      { id: "in", name: "In", type: "input", dataType: "ProcessedData" },
      { id: "true", name: "True", type: "output", dataType: "ProcessedData" },
      { id: "false", name: "False", type: "output", dataType: "ErrorPayload" },
    ],
  },
  {
    type: "service",
    visualizerType: "system-design",
    label: "Microservice API",
    category: "Services",
    description: "Downstream microservice client or third-party API integration.",
    defaultData: {
      endpoint: "https://svc.internal:8443",
      retryCount: 3,
      circuitBreaker: true,
    },
    ports: [
      { id: "req", name: "Request", type: "input", dataType: "ServiceRequest" },
      { id: "res", name: "Response", type: "output", dataType: "ServiceResponse" },
    ],
  },
  {
    type: "database",
    visualizerType: "system-design",
    label: "State Storage",
    category: "Persistence",
    description: "Relational database, key-value store, or persistent state table.",
    defaultData: {
      engine: "PostgreSQL 16",
      connectionPool: 20,
      readReplicas: 2,
    },
    ports: [
      { id: "query", name: "Query", type: "input", dataType: "SQLQuery" },
      { id: "data", name: "Result", type: "output", dataType: "RowSet" },
    ],
  },
  {
    type: "queue",
    visualizerType: "system-design",
    label: "Message Queue",
    category: "Streaming",
    description: "Decoupled asynchronous FIFO queue, Kafka partition, or buffer.",
    defaultData: {
      maxDepth: 10000,
      retentionHours: 24,
      batchSize: 50,
    },
    ports: [
      { id: "enqueue", name: "Enqueue", type: "input", dataType: "Message" },
      { id: "dequeue", name: "Dequeue", type: "output", dataType: "MessageBatch" },
    ],
  },
  {
    type: "output",
    visualizerType: "system-design",
    label: "Egress / Response",
    category: "Exit",
    description: "Final client response, telemetry sink, or webhook callback.",
    defaultData: {
      format: "application/json",
      status: 200,
      compress: true,
    },
    ports: [
      { id: "in", name: "In", type: "input", dataType: "ProcessedData" },
    ],
  },
];

