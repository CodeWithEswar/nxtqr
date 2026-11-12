import type {
  DistributedTransactionScenario,
  TransactionParticipantConfig,
} from "./transaction-schemas";

export const DISTRIBUTED_TRANSACTION_PRESET_METADATA = [
  {
    id: "successful_2pc",
    label: "Successful Two-Phase Commit",
    description: "Inventory, Payment & Orders vote YES; coordinator durably commits and releases locks.",
  },
  {
    id: "participant_votes_no",
    label: "Participant Votes NO (Abort)",
    description: "Payment insufficient funds returns VOTE_NO; coordinator writes GLOBAL_ABORT and rolls back Inventory.",
  },
  {
    id: "prepare_timeout",
    label: "Prepare Timeout Triggers Abort",
    description: "Orders partitioned during Phase 1; coordinator aborts on missing vote expiration.",
  },
  {
    id: "coordinator_crash_before_decision",
    label: "Coordinator Crash Before Decision",
    description: "Participants prepare & lock resources, coordinator crashes, restarts and executes safe abort.",
  },
  {
    id: "coordinator_crash_after_commit",
    label: "Coordinator Crash After COMMIT",
    description: "Coordinator durably logs GLOBAL_COMMIT, crashes, restarts and retransmits COMMIT.",
  },
  {
    id: "participant_crash_before_prepare",
    label: "Participant Crash Before PREPARE",
    description: "Crashed participant misses PREPARE; coordinator aborts on timeout.",
  },
  {
    id: "participant_crash_after_prepare",
    label: "Participant Crash After PREPARE",
    description: "Prepared participant crashes, restarts with durable log, queries coordinator & commits.",
  },
  {
    id: "in_doubt_transaction",
    label: "In-Doubt Prepared Participant",
    description: "Coordinator unavailable after participant votes YES; participant remains in doubt holding locks.",
  },
  {
    id: "twopc_blocking",
    label: "2PC Blocking Limitation",
    description: "Demonstrates participants blocking indefinitely when coordinator crashes while holding exclusive locks.",
  },
  {
    id: "lock_contention",
    label: "2PC Exclusive Lock Contention",
    description: "TX-2 blocks waiting on SKU-101 lock held by in-doubt TX-1 until TX-1 resolves.",
  },
  {
    id: "duplicate_commit_delivery",
    label: "Idempotent Duplicate GLOBAL_COMMIT",
    description: "Duplicate GLOBAL_COMMIT arrives safely without double-applying inventory/payment mutations.",
  },
  {
    id: "lost_decision_ack",
    label: "Lost Decision ACK Retransmission",
    description: "Dropped DECISION_ACK causes coordinator retransmission; participant handles idempotently.",
  },
  {
    id: "successful_saga_orchestration",
    label: "Successful Saga Orchestration",
    description: "Orchestrator commits CreateOrder → ReserveInventory → HoldPayment → ScheduleShipment.",
  },
  {
    id: "successful_saga_choreography",
    label: "Successful Saga Choreography",
    description: "Event-driven choreography reacts to OrderCreated → InventoryReserved → PaymentHeld without orchestrator.",
  },
  {
    id: "saga_step_failure",
    label: "Saga Step Failure & Abort Path",
    description: "Payment step fails on insufficient funds; orchestrator stops forward progress cleanly.",
  },
  {
    id: "reverse_compensation",
    label: "Saga Reverse Topological Compensation",
    description: "Shipment failure compensates Payment (Void) then Inventory (Release) then Order (Cancel) in reverse order.",
  },
  {
    id: "compensation_failure",
    label: "Compensation Failure & Retry",
    description: "Irreversible or unavailable compensation fails explicitly instead of silently marking COMPENSATED.",
  },
  {
    id: "duplicate_saga_event",
    label: "Duplicate Saga Command & Idempotency",
    description: "At-least-once command replay hits IdempotencyRecord and avoids double inventory reservation.",
  },
  {
    id: "outbox_dispatcher_failure",
    label: "Transactional Outbox Dispatcher Failure",
    description: "Local step commits with durable outbox record; dispatcher recovers later and publishes reliably.",
  },
  {
    id: "inbox_deduplication",
    label: "Consumer Inbox Deduplication",
    description: "Duplicate choreography domain event is absorbed by participant inbox messageId deduplication.",
  },
  {
    id: "tx_network_partition",
    label: "Transaction Network Partition",
    description: "Partition prevents Phase 1 vote delivery; safety preserved via prepare timeout abort.",
  },
  {
    id: "retry_exhaustion",
    label: "Saga Step Retry Exhaustion",
    description: "Transient failures exhaust exponential backoff attempts and trigger backward recovery.",
  },
  {
    id: "manual_intervention",
    label: "Manual Intervention Escalation",
    description: "Irreversible shipment compensation fails and escalates Saga to MANUAL_INTERVENTION_REQUIRED.",
  },
  {
    id: "partial_business_completion",
    label: "Saga Partial Business Completion",
    description: "Forward steps commit independently showing visible intermediate state prior to compensation.",
  },
  {
    id: "recovery_after_coordinator_restart",
    label: "Full Recovery After Coordinator Restart",
    description: "Coordinator recovers durable COMMIT log after restart and completes pending notifications.",
  },
  {
    id: "recovery_after_participant_restart",
    label: "Full Recovery After Participant Restart",
    description: "Restarted participant queries coordinator decision and unlocks prepared resources.",
  },
] as const;

export type DistributedTransactionPresetId =
  (typeof DISTRIBUTED_TRANSACTION_PRESET_METADATA)[number]["id"];

function baseParticipants(): TransactionParticipantConfig[] {
  return [
    {
      id: "orders",
      serviceId: "svc-orders",
      label: "Orders",
      online: true,
      idempotencyEnabled: true,
      outboxEnabled: true,
      inboxEnabled: true,
      initialStore: { inventory: {}, balances: {}, orders: {}, shipments: {}, reservations: {} },
    },
    {
      id: "inventory",
      serviceId: "svc-inventory",
      label: "Inventory",
      online: true,
      idempotencyEnabled: true,
      outboxEnabled: true,
      inboxEnabled: true,
      initialStore: {
        inventory: { "SKU-101": 10 },
        balances: {},
        orders: {},
        shipments: {},
        reservations: {},
      },
    },
    {
      id: "payment",
      serviceId: "svc-payment",
      label: "Payment",
      online: true,
      idempotencyEnabled: true,
      outboxEnabled: true,
      inboxEnabled: true,
      initialStore: {
        inventory: {},
        balances: { "acct-42": 500 },
        orders: {},
        shipments: {},
        reservations: {},
      },
    },
    {
      id: "shipping",
      serviceId: "svc-shipping",
      label: "Shipping",
      online: true,
      idempotencyEnabled: true,
      outboxEnabled: true,
      inboxEnabled: true,
      initialStore: { inventory: {}, balances: {}, orders: {}, shipments: {}, reservations: {} },
    },
  ];
}

function defaultTwoPCSteps(failPayment = false) {
  return [
    {
      participantId: "orders",
      operation: {
        id: "op-order",
        kind: "CREATE_ORDER" as const,
        resourceKey: "ORD-104",
        amount: 1,
        reversible: "reversible" as const,
        forceOutcome: "auto" as const,
      },
      required: true,
    },
    {
      participantId: "inventory",
      operation: {
        id: "op-inv",
        kind: "RESERVE_INVENTORY" as const,
        resourceKey: "SKU-101",
        amount: 2,
        reversible: "reversible" as const,
        forceOutcome: "auto" as const,
      },
      required: true,
    },
    {
      participantId: "payment",
      operation: {
        id: "op-pay",
        kind: "HOLD_PAYMENT" as const,
        resourceKey: "acct-42",
        amount: 120,
        reversible: "reversible" as const,
        forceOutcome: failPayment ? ("vote_no_insufficient" as const) : ("auto" as const),
      },
      required: true,
    },
  ];
}

function defaultSagaSteps(opts?: {
  failStep?: "payment" | "shipping";
  compFail?: boolean;
  retryAttempts?: number;
}) {
  return [
    {
      id: "step-order",
      serviceId: "svc-orders",
      participantId: "orders",
      label: "Create Order",
      operation: {
        id: "op-s-order",
        kind: "CREATE_ORDER" as const,
        resourceKey: "ORD-208",
        amount: 1,
        reversible: "reversible" as const,
        forceOutcome: "auto" as const,
      },
      compensation: {
        id: "comp-s-order",
        kind: "CANCEL_ORDER" as const,
        resourceKey: "ORD-208",
        amount: 1,
        reversible: "reversible" as const,
        forceOutcome: "auto" as const,
      },
      retryPolicy: {
        enabled: true,
        maxAttempts: opts?.retryAttempts ?? 2,
        backoffType: "exponential" as const,
        baseDelayMs: 40,
        jitterRatio: 0.1,
        overallDeadlineMs: 2500,
      },
      timeoutMs: 220,
      dependsOn: [],
    },
    {
      id: "step-inventory",
      serviceId: "svc-inventory",
      participantId: "inventory",
      label: "Reserve Inventory",
      operation: {
        id: "op-s-inv",
        kind: "RESERVE_INVENTORY" as const,
        resourceKey: "SKU-101",
        amount: 3,
        reversible: "reversible" as const,
        forceOutcome: "auto" as const,
      },
      compensation: {
        id: "comp-s-inv",
        kind: "RELEASE_INVENTORY" as const,
        resourceKey: "SKU-101",
        amount: 3,
        reversible: "reversible" as const,
        forceOutcome: "auto" as const,
      },
      retryPolicy: {
        enabled: true,
        maxAttempts: opts?.retryAttempts ?? 2,
        backoffType: "exponential" as const,
        baseDelayMs: 40,
        jitterRatio: 0.1,
        overallDeadlineMs: 2500,
      },
      timeoutMs: 220,
      dependsOn: ["step-order"],
    },
    {
      id: "step-payment",
      serviceId: "svc-payment",
      participantId: "payment",
      label: "Authorize Payment",
      operation: {
        id: "op-s-pay",
        kind: "HOLD_PAYMENT" as const,
        resourceKey: "acct-42",
        amount: 150,
        reversible: "reversible" as const,
        forceOutcome:
          opts?.failStep === "payment" ? ("step_fail" as const) : ("auto" as const),
      },
      compensation: {
        id: "comp-s-pay",
        kind: "VOID_PAYMENT" as const,
        resourceKey: "acct-42",
        amount: 150,
        reversible: opts?.compFail ? ("irreversible" as const) : ("reversible" as const),
        forceOutcome: opts?.compFail
          ? ("compensation_fail_irreversible" as const)
          : ("auto" as const),
      },
      retryPolicy: {
        enabled: true,
        maxAttempts: opts?.retryAttempts ?? 2,
        backoffType: "exponential" as const,
        baseDelayMs: 40,
        jitterRatio: 0.1,
        overallDeadlineMs: 2500,
      },
      timeoutMs: 220,
      dependsOn: ["step-inventory"],
    },
    {
      id: "step-shipping",
      serviceId: "svc-shipping",
      participantId: "shipping",
      label: "Schedule Shipment",
      operation: {
        id: "op-s-ship",
        kind: "SCHEDULE_SHIPMENT" as const,
        resourceKey: "SHP-208",
        amount: 1,
        reversible: "conditionally_reversible" as const,
        forceOutcome:
          opts?.failStep === "shipping" ? ("step_fail" as const) : ("auto" as const),
      },
      compensation: {
        id: "comp-s-ship",
        kind: "CANCEL_SHIPMENT" as const,
        resourceKey: "SHP-208",
        amount: 1,
        reversible: "reversible" as const,
        forceOutcome: "auto" as const,
      },
      retryPolicy: {
        enabled: true,
        maxAttempts: opts?.retryAttempts ?? 2,
        backoffType: "exponential" as const,
        baseDelayMs: 40,
        jitterRatio: 0.1,
        overallDeadlineMs: 2500,
      },
      timeoutMs: 220,
      dependsOn: ["step-payment"],
    },
  ];
}

export function createDistributedTransactionPresetScenario(
  presetId: DistributedTransactionPresetId
): DistributedTransactionScenario {
  const meta = DISTRIBUTED_TRANSACTION_PRESET_METADATA.find((m) => m.id === presetId)!;
  const participants = baseParticipants();

  const make2PC = (
    txs: Array<{
      transactionId: string;
      atMs: number;
      prepareTimeoutMs?: number;
      failPayment?: boolean;
    }>,
    failures: DistributedTransactionScenario["failures"] = [],
    dupProb = 0
  ): DistributedTransactionScenario => ({
    version: 1,
    id: `tx_${presetId}`,
    presetId,
    name: meta.label,
    description: meta.description,
    architectureRevisionId: "rev_tx_001",
    seed: 104,
    protocol: "two_phase_commit",
    participants: participants.slice(0, 3),
    workflow: {
      protocol: "two_phase_commit",
      transactions: txs.map((t) => ({
        transactionId: t.transactionId,
        atMs: t.atMs,
        prepareTimeoutMs: t.prepareTimeoutMs ?? 240,
        coordinatorId: "tx-coordinator",
        steps: defaultTwoPCSteps(t.failPayment),
      })),
    },
    network: {
      baseLatencyMs: 20,
      jitterMs: 2,
      packetLossProbability: 0,
      duplicateProbability: dupProb,
    },
    failures,
    limits: {
      maxParticipants: 10,
      maxTransactions: 20,
      maxEvents: 800,
      maxVirtualDurationMs: 5000,
      maxRetriesPerStep: 4,
    },
  });

  const makeSagaOrch = (
    opts?: {
      failStep?: "payment" | "shipping";
      compFail?: boolean;
      retryAttempts?: number;
      failures?: DistributedTransactionScenario["failures"];
      dupProb?: number;
    }
  ): DistributedTransactionScenario => ({
    version: 1,
    id: `tx_${presetId}`,
    presetId,
    name: meta.label,
    description: meta.description,
    architectureRevisionId: "rev_tx_001",
    seed: 208,
    protocol: "saga_orchestration",
    participants,
    workflow: {
      protocol: "saga_orchestration",
      sagaId: `SAGA-${presetId.slice(0, 6).toUpperCase()}`,
      workflowVersion: 1,
      failurePolicy: "backward_recovery",
      steps: defaultSagaSteps({
        failStep: opts?.failStep,
        compFail: opts?.compFail,
        retryAttempts: opts?.retryAttempts,
      }),
    },
    network: {
      baseLatencyMs: 20,
      jitterMs: 2,
      packetLossProbability: 0,
      duplicateProbability: opts?.dupProb ?? 0,
    },
    failures: opts?.failures ?? [],
    limits: {
      maxParticipants: 10,
      maxTransactions: 20,
      maxEvents: 800,
      maxVirtualDurationMs: 5000,
      maxRetriesPerStep: 4,
    },
  });

  const makeChoreography = (
    opts?: {
      failures?: DistributedTransactionScenario["failures"];
      dupProb?: number;
      failPayment?: boolean;
    }
  ): DistributedTransactionScenario => ({
    version: 1,
    id: `tx_${presetId}`,
    presetId,
    name: meta.label,
    description: meta.description,
    architectureRevisionId: "rev_tx_001",
    seed: 305,
    protocol: "saga_choreography",
    participants,
    workflow: {
      protocol: "saga_choreography",
      sagaId: "SAGA-CHOREO-1",
      workflowVersion: 1,
      initialEvent: {
        eventType: "OrderPlaced",
        producer: "api-gateway",
        aggregateId: "ORD-305",
      },
      subscriptions: [
        {
          id: "sub-order",
          participantId: "orders",
          consumesEvent: "OrderPlaced",
          operation: {
            id: "ch-order",
            kind: "CREATE_ORDER",
            resourceKey: "ORD-305",
            amount: 1,
            reversible: "reversible",
            forceOutcome: "auto",
          },
          emitsOnSuccess: "OrderCreated",
          retryPolicy: { enabled: true, maxAttempts: 2, backoffType: "fixed", baseDelayMs: 30, jitterRatio: 0.1, overallDeadlineMs: 2000 },
        },
        {
          id: "sub-inv",
          participantId: "inventory",
          consumesEvent: "OrderCreated",
          operation: {
            id: "ch-inv",
            kind: "RESERVE_INVENTORY",
            resourceKey: "SKU-101",
            amount: 2,
            reversible: "reversible",
            forceOutcome: "auto",
          },
          emitsOnSuccess: "InventoryReserved",
          retryPolicy: { enabled: true, maxAttempts: 2, backoffType: "fixed", baseDelayMs: 30, jitterRatio: 0.1, overallDeadlineMs: 2000 },
        },
        {
          id: "sub-pay",
          participantId: "payment",
          consumesEvent: "InventoryReserved",
          operation: {
            id: "ch-pay",
            kind: "HOLD_PAYMENT",
            resourceKey: "acct-42",
            amount: 140,
            reversible: "reversible",
            forceOutcome: opts?.failPayment ? "step_fail" : "auto",
          },
          emitsOnSuccess: "PaymentAuthorized",
          emitsOnFailure: "PaymentFailed",
          retryPolicy: { enabled: true, maxAttempts: 2, backoffType: "fixed", baseDelayMs: 30, jitterRatio: 0.1, overallDeadlineMs: 2000 },
        },
        {
          id: "sub-ship",
          participantId: "shipping",
          consumesEvent: "PaymentAuthorized",
          operation: {
            id: "ch-ship",
            kind: "SCHEDULE_SHIPMENT",
            resourceKey: "SHP-305",
            amount: 1,
            reversible: "reversible",
            forceOutcome: "auto",
          },
          emitsOnSuccess: "ShipmentScheduled",
          retryPolicy: { enabled: true, maxAttempts: 2, backoffType: "fixed", baseDelayMs: 30, jitterRatio: 0.1, overallDeadlineMs: 2000 },
        },
      ],
    },
    network: {
      baseLatencyMs: 20,
      jitterMs: 2,
      packetLossProbability: 0,
      duplicateProbability: opts?.dupProb ?? 0,
    },
    failures: opts?.failures ?? [],
    limits: {
      maxParticipants: 10,
      maxTransactions: 20,
      maxEvents: 800,
      maxVirtualDurationMs: 5000,
      maxRetriesPerStep: 4,
    },
  });

  switch (presetId) {
    case "successful_2pc":
      return make2PC([{ transactionId: "TX-104", atMs: 10 }]);

    case "participant_votes_no":
      return make2PC([{ transactionId: "TX-105", atMs: 10, failPayment: true }]);

    case "prepare_timeout":
      return make2PC(
        [{ transactionId: "TX-106", atMs: 10, prepareTimeoutMs: 120 }],
        [
          {
            id: "f-part",
            type: "network_partition",
            targetId: "cluster",
            atMs: 5,
            partitionGroups: [["tx-coordinator", "orders", "inventory"], ["payment"]],
            description: "Payment isolated during Phase 1 prepare",
          },
        ]
      );

    case "coordinator_crash_before_decision":
      return make2PC(
        [{ transactionId: "TX-107", atMs: 10, prepareTimeoutMs: 260 }],
        [
          {
            id: "f-coord-crash",
            type: "coordinator_crash",
            atMs: 42,
            targetId: "tx-coordinator",
            description: "Coordinator crashes before collecting all votes / persisting decision",
          },
          {
            id: "f-coord-restart",
            type: "coordinator_restart",
            atMs: 300,
            targetId: "tx-coordinator",
            description: "Coordinator restarts and aborts undecided TX-107 safely",
          },
        ]
      );

    case "coordinator_crash_after_commit":
    case "recovery_after_coordinator_restart":
      return make2PC(
        [{ transactionId: "TX-108", atMs: 10, prepareTimeoutMs: 400 }],
        [
          {
            id: "f-drop-commit",
            type: "network_partition",
            targetId: "cluster",
            atMs: 56,
            durationMs: 180,
            partitionGroups: [["tx-coordinator"], ["orders", "inventory", "payment"]],
            description: "GLOBAL_COMMIT blocked temporarily after decision is durably logged",
          },
          {
            id: "f-coord-crash-after",
            type: "coordinator_crash",
            atMs: 65,
            targetId: "tx-coordinator",
            description: "Coordinator crashes right after persisting GLOBAL_COMMIT",
          },
          {
            id: "f-coord-restart-after",
            type: "coordinator_restart",
            atMs: 260,
            targetId: "tx-coordinator",
            description: "Coordinator restarts and replays durable GLOBAL_COMMIT",
          },
        ]
      );

    case "participant_crash_before_prepare":
      return make2PC(
        [{ transactionId: "TX-109", atMs: 10, prepareTimeoutMs: 140 }],
        [
          {
            id: "f-p-crash-early",
            type: "participant_crash",
            atMs: 5,
            targetId: "payment",
            description: "Payment crashes before PREPARE arrives",
          },
        ]
      );

    case "participant_crash_after_prepare":
    case "recovery_after_participant_restart":
      return make2PC(
        [{ transactionId: "TX-110", atMs: 10, prepareTimeoutMs: 350 }],
        [
          {
            id: "f-p-crash-after",
            type: "participant_crash",
            atMs: 55,
            targetId: "payment",
            description: "Payment crashes while holding durable PREPARED state",
          },
          {
            id: "f-p-restart-after",
            type: "participant_restart",
            atMs: 260,
            targetId: "payment",
            description: "Payment restarts and resolves TX-110 via DECISION_QUERY",
          },
        ]
      );

    case "in_doubt_transaction":
    case "twopc_blocking":
      return make2PC(
        [{ transactionId: "TX-111", atMs: 10, prepareTimeoutMs: 500 }],
        [
          {
            id: "f-coord-down",
            type: "coordinator_crash",
            atMs: 42,
            targetId: "tx-coordinator",
            description: "Coordinator remains down leaving prepared participants IN_DOUBT and locked",
          },
        ]
      );

    case "lock_contention":
      return make2PC(
        [
          { transactionId: "TX-A", atMs: 10, prepareTimeoutMs: 450 },
          { transactionId: "TX-B", atMs: 80, prepareTimeoutMs: 600 },
        ],
        [
          {
            id: "f-coord-stall",
            type: "coordinator_crash",
            atMs: 42,
            targetId: "tx-coordinator",
            description: "TX-A holds SKU-101 lock while coordinator crashed; restarts at 280ms",
          },
          {
            id: "f-coord-up",
            type: "coordinator_restart",
            atMs: 280,
            targetId: "tx-coordinator",
            description: "Coordinator restarts to resolve TX-A and unblock TX-B",
          },
        ]
      );

    case "duplicate_commit_delivery":
      return make2PC([{ transactionId: "TX-112", atMs: 10 }], [], 0.9);

    case "lost_decision_ack":
      return make2PC(
        [{ transactionId: "TX-113", atMs: 10 }],
        [
          {
            id: "f-drop-ack",
            type: "drop_next_rpc",
            atMs: 55,
            targetId: "tx-coordinator",
            description: "Drop DECISION_ACK triggering coordinator GLOBAL_COMMIT retransmission",
          },
        ]
      );

    case "successful_saga_orchestration":
      return makeSagaOrch();

    case "successful_saga_choreography":
      return makeChoreography();

    case "saga_step_failure":
    case "retry_exhaustion":
      return makeSagaOrch({ failStep: "payment", retryAttempts: 3 });

    case "reverse_compensation":
    case "partial_business_completion":
      return makeSagaOrch({ failStep: "shipping", retryAttempts: 1 });

    case "compensation_failure":
    case "manual_intervention":
      return makeSagaOrch({ failStep: "shipping", compFail: true, retryAttempts: 2 });

    case "duplicate_saga_event":
      return makeSagaOrch({ dupProb: 1.0 });

    case "outbox_dispatcher_failure":
      return makeChoreography({
        failures: [
          {
            id: "f-ob-fail",
            type: "outbox_dispatcher_fail",
            atMs: 5,
            targetId: "orders",
            description: "Orders outbox dispatcher fails temporarily then recovers",
          },
          {
            id: "f-ob-rec",
            type: "outbox_dispatcher_recover",
            atMs: 160,
            targetId: "orders",
            description: "Orders outbox dispatcher recovers and publishes pending record",
          },
        ],
      });

    case "inbox_deduplication":
      return makeChoreography({ dupProb: 1.0 });

    case "tx_network_partition":
      return make2PC(
        [{ transactionId: "TX-114", atMs: 10, prepareTimeoutMs: 140 }],
        [
          {
            id: "f-net-part",
            type: "network_partition",
            targetId: "cluster",
            atMs: 5,
            partitionGroups: [["tx-coordinator"], ["orders", "inventory", "payment"]],
            description: "Full partition prevents coordinator from reaching participants",
          },
        ]
      );
  }
}
