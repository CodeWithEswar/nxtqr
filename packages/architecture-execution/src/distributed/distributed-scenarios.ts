import type { DistributedScenarioConfig } from "../schemas/distributed.schemas";

export const DISTRIBUTED_SCENARIOS: Record<string, DistributedScenarioConfig> = {
  "parallel-fanout": {
    id: "scen_parallel_fanout",
    name: "Parallel API Calls with Fan-In Synchronization",
    description: "Order Service concurrently calls Payment Service and Inventory Service, synchronizes at a fan-in barrier, and returns 201.",
    presetId: "parallel-fanout",
    entryNodeId: "client_1",
    entryRequest: {
      method: "POST",
      path: "/api/v1/orders",
      body: { item: "MacBook Pro M4 Max", quantity: 1, amount: 3999.0 },
      headers: { "x-client-id": "web_storefront" },
    },
    parallelBranches: [
      {
        id: "branch_payment",
        targetNodeId: "payment_service",
        operation: "Authorize and Capture Card Payment",
        durationMs: 180,
        willFail: false,
      },
      {
        id: "branch_inventory",
        targetNodeId: "inventory_service",
        operation: "Reserve Physical Warehouse SKU",
        durationMs: 120,
        willFail: false,
      },
    ],
    fanInPolicy: "all",
    fanInNodeId: "order_service",
    queues: [],
    messagesToPublish: [],
  },

  "async-queue-workers": {
    id: "scen_async_workers",
    name: "Asynchronous Message Queue with Pub/Sub Workers",
    description: "Order Service publishes an order event to an asynchronous queue. Email Worker and Analytics Worker process and acknowledge independently.",
    presetId: "async-queue-workers",
    entryNodeId: "client_1",
    entryRequest: {
      method: "POST",
      path: "/api/v1/checkout",
      body: { orderId: "ord_9981", status: "confirmed" },
      headers: { "x-channel": "web" },
    },
    parallelBranches: [],
    fanInPolicy: "all",
    queues: [
      {
        id: "queue_order_events",
        name: "Order Events Pub/Sub Topic",
        nodeId: "order_events_queue",
        capacity: 500,
        deliveryMode: "pub-sub",
        subscriberNodeIds: ["email_worker", "analytics_worker"],
        consumerConcurrency: 2,
        processingDurationMs: 140,
        retryDelayMs: 200,
        maxRetries: 3,
      },
    ],
    messagesToPublish: [
      {
        producerNodeId: "order_service",
        destinationQueueId: "order_events_queue",
        delayMs: 40,
        payload: {
          eventId: "evt_order_created",
          orderId: "ord_9981",
          customerEmail: "dev@nxtqr.engineering",
          amount: 3999.0,
        },
        idempotencyKey: "idemp_ord_9981",
      },
    ],
  },

  "message-retry-dlq": {
    id: "scen_retry_dlq",
    name: "Message Failure, Exponential Retry & Dead-Letter Routing",
    description: "Settlement message fails processing, triggers virtual-time exponential retry, exhausts attempts, and routes to DLQ.",
    presetId: "message-retry-dlq",
    entryNodeId: "client_1",
    entryRequest: {
      method: "POST",
      path: "/api/v1/settlements",
      body: { settlementId: "stl_550", amount: 15000.0 },
      headers: {},
    },
    parallelBranches: [],
    fanInPolicy: "all",
    queues: [
      {
        id: "queue_settlements",
        name: "Settlement Job Queue",
        nodeId: "settlement_queue",
        capacity: 100,
        deliveryMode: "competing-workers",
        deadLetterQueueId: "dead_letter_queue",
        subscriberNodeIds: ["settlement_worker"],
        consumerConcurrency: 1,
        processingDurationMs: 90,
        retryDelayMs: 250,
        maxRetries: 2,
      },
      {
        id: "queue_dlq",
        name: "Dead Letter Queue (DLQ)",
        nodeId: "dead_letter_queue",
        capacity: 1000,
        deliveryMode: "competing-workers",
        subscriberNodeIds: [],
        consumerConcurrency: 0,
        processingDurationMs: 0,
        retryDelayMs: 0,
        maxRetries: 0,
      },
    ],
    messagesToPublish: [
      {
        producerNodeId: "order_service",
        destinationQueueId: "settlement_queue",
        delayMs: 30,
        payload: { settlementId: "stl_550", externalBank: "SwiftFed" },
        idempotencyKey: "idemp_stl_550",
        willFailOnAttempt: 99, // Fails all attempts to exhaust retries
        failError: "Bank Gateway GatewayTimeout (504)",
      },
    ],
  },

  "fanin-partial-failure": {
    id: "scen_fanin_failure",
    name: "Parallel Fan-In with Branch Failure & Policy Evaluation",
    description: "Evaluates fan-in barrier semantics when one parallel branch fails (e.g. Fraud Check fails while Inventory succeeds).",
    presetId: "fanin-partial-failure",
    entryNodeId: "client_1",
    entryRequest: {
      method: "POST",
      path: "/api/v1/orders/sensitive",
      body: { flagged: true },
      headers: {},
    },
    parallelBranches: [
      {
        id: "branch_inventory",
        targetNodeId: "inventory_service",
        operation: "Reserve Physical Stock",
        durationMs: 80,
        willFail: false,
      },
      {
        id: "branch_fraud",
        targetNodeId: "fraud_service",
        operation: "Evaluate Anti-Fraud Risk Matrix",
        durationMs: 140,
        willFail: true,
        errorMessage: "Risk score 98 exceeded acceptable threshold (Declined)",
      },
    ],
    fanInPolicy: "all",
    fanInNodeId: "order_service",
    queues: [],
    messagesToPublish: [],
  },
};

export function getDistributedScenarioPreset(
  presetId: string = "parallel-fanout"
): DistributedScenarioConfig {
  return DISTRIBUTED_SCENARIOS[presetId] || DISTRIBUTED_SCENARIOS["parallel-fanout"];
}
