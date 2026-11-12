import type {
  LocalOperation,
  ParticipantInitialStore,
} from "./transaction-schemas";

export interface LocalExecutionResult {
  ok: boolean;
  reason: string;
  summary: string;
}

export function cloneStore(store: ParticipantInitialStore): ParticipantInitialStore {
  return {
    inventory: { ...store.inventory },
    balances: { ...store.balances },
    orders: { ...store.orders },
    shipments: { ...store.shipments },
    reservations: { ...store.reservations },
  };
}

export function validateAndApplyLocalOperation(
  store: ParticipantInitialStore,
  op: LocalOperation,
  mutateStore: boolean
): LocalExecutionResult {
  if (op.forceOutcome === "vote_no_insufficient") {
    return {
      ok: false,
      reason: `Insufficient balance/stock for ${op.kind} (${op.resourceKey})`,
      summary: `REJECTED ${op.kind}(${op.resourceKey})`,
    };
  }
  if (op.forceOutcome === "step_fail") {
    return {
      ok: false,
      reason: `Downstream business validation failure on ${op.kind} (${op.resourceKey})`,
      summary: `FAILED ${op.kind}(${op.resourceKey})`,
    };
  }
  if (op.forceOutcome === "step_timeout") {
    return {
      ok: false,
      reason: `Local execution timed out on ${op.kind} (${op.resourceKey})`,
      summary: `TIMEOUT ${op.kind}(${op.resourceKey})`,
    };
  }
  if (op.forceOutcome === "storage_error") {
    return {
      ok: false,
      reason: `Durable storage write failed during ${op.kind}`,
      summary: `STORAGE_ERR ${op.kind}`,
    };
  }
  if (op.forceOutcome === "compensation_fail_irreversible") {
    return {
      ok: false,
      reason: `Operation ${op.kind} on ${op.resourceKey} is irreversible (shipment already handed to carrier)`,
      summary: `IRREVERSIBLE ${op.kind}(${op.resourceKey})`,
    };
  }
  if (op.forceOutcome === "compensation_fail_unavailable") {
    return {
      ok: false,
      reason: `Compensation service unavailable during ${op.kind}`,
      summary: `UNAVAILABLE ${op.kind}(${op.resourceKey})`,
    };
  }

  switch (op.kind) {
    case "RESERVE_INVENTORY": {
      const avail = store.inventory[op.resourceKey] ?? 10;
      if (avail < op.amount) {
        return {
          ok: false,
          reason: `Insufficient inventory for ${op.resourceKey}: available ${avail}, requested ${op.amount}`,
          summary: `OUT_OF_STOCK ${op.resourceKey}`,
        };
      }
      if (mutateStore) {
        store.inventory[op.resourceKey] = avail - op.amount;
        store.reservations[op.resourceKey] =
          (store.reservations[op.resourceKey] ?? 0) + op.amount;
      }
      return {
        ok: true,
        reason: `Reserved ${op.amount} unit(s) of ${op.resourceKey}`,
        summary: `RESERVE ${op.resourceKey} x${op.amount}`,
      };
    }

    case "RELEASE_INVENTORY": {
      if (mutateStore) {
        const reserved = store.reservations[op.resourceKey] ?? op.amount;
        const releaseQty = Math.min(reserved, op.amount);
        store.reservations[op.resourceKey] = Math.max(0, reserved - releaseQty);
        store.inventory[op.resourceKey] =
          (store.inventory[op.resourceKey] ?? 0) + op.amount;
      }
      return {
        ok: true,
        reason: `Released ${op.amount} unit(s) back to ${op.resourceKey}`,
        summary: `RELEASE ${op.resourceKey} +${op.amount}`,
      };
    }

    case "HOLD_PAYMENT":
    case "CAPTURE_PAYMENT": {
      const bal = store.balances[op.resourceKey] ?? 500;
      if (bal < op.amount) {
        return {
          ok: false,
          reason: `Insufficient funds in ${op.resourceKey}: balance ${bal}, amount ${op.amount}`,
          summary: `INSUFFICIENT_FUNDS ${op.resourceKey}`,
        };
      }
      if (mutateStore) {
        store.balances[op.resourceKey] = bal - op.amount;
      }
      return {
        ok: true,
        reason: `${op.kind === "HOLD_PAYMENT" ? "Authorized hold" : "Captured"} $${op.amount} on ${op.resourceKey}`,
        summary: `${op.kind === "HOLD_PAYMENT" ? "HOLD" : "CAPTURE"} $${op.amount} ${op.resourceKey}`,
      };
    }

    case "VOID_PAYMENT":
    case "REFUND_PAYMENT": {
      if (mutateStore) {
        store.balances[op.resourceKey] =
          (store.balances[op.resourceKey] ?? 0) + op.amount;
      }
      return {
        ok: true,
        reason: `${op.kind === "VOID_PAYMENT" ? "Voided hold" : "Refunded"} $${op.amount} to ${op.resourceKey}`,
        summary: `${op.kind === "VOID_PAYMENT" ? "VOID" : "REFUND"} $${op.amount} ${op.resourceKey}`,
      };
    }

    case "CREATE_ORDER": {
      if (mutateStore) {
        store.orders[op.resourceKey] = "PENDING";
      }
      return {
        ok: true,
        reason: `Created order ${op.resourceKey} (PENDING)`,
        summary: `CREATE_ORDER ${op.resourceKey}`,
      };
    }

    case "CONFIRM_ORDER": {
      if (mutateStore) {
        store.orders[op.resourceKey] = "CONFIRMED";
      }
      return {
        ok: true,
        reason: `Confirmed order ${op.resourceKey}`,
        summary: `CONFIRM_ORDER ${op.resourceKey}`,
      };
    }

    case "CANCEL_ORDER": {
      if (mutateStore) {
        store.orders[op.resourceKey] = "CANCELLED";
      }
      return {
        ok: true,
        reason: `Cancelled order ${op.resourceKey}`,
        summary: `CANCEL_ORDER ${op.resourceKey}`,
      };
    }

    case "SCHEDULE_SHIPMENT": {
      if (mutateStore) {
        store.shipments[op.resourceKey] = "SCHEDULED";
      }
      return {
        ok: true,
        reason: `Scheduled shipment ${op.resourceKey}`,
        summary: `SCHEDULE_SHIPMENT ${op.resourceKey}`,
      };
    }

    case "CANCEL_SHIPMENT": {
      if (op.reversible === "irreversible") {
        return {
          ok: false,
          reason: `Shipment ${op.resourceKey} is irreversible (already dispatched)`,
          summary: `IRREVERSIBLE_SHIPMENT ${op.resourceKey}`,
        };
      }
      if (mutateStore) {
        store.shipments[op.resourceKey] = "CANCELLED";
      }
      return {
        ok: true,
        reason: `Cancelled shipment ${op.resourceKey}`,
        summary: `CANCEL_SHIPMENT ${op.resourceKey}`,
      };
    }
  }
}
