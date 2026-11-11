/**
 * NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
 * Contract Drift & Discrepancy Detector
 */

import type {
  APIContract,
  ContractDriftFinding,
} from "../contracts/contract.types";

export interface ObservedOperationTelemetry {
  method?: string;
  path?: string;
  rpcName?: string;
  channelName?: string;
  observedCallCount: number;
  lastObservedAt: string;
}

export class ContractDriftDetector {
  /**
   * Compares declared API contract operations against observed runtime telemetry.
   */
  public static detectDrift(
    contract: APIContract,
    observedOperations: ObservedOperationTelemetry[]
  ): ContractDriftFinding[] {
    const findings: ContractDriftFinding[] = [];
    const currentRev =
      contract.revisions.find((r) => r.id === contract.currentRevisionId) ||
      contract.revisions[0];

    if (!currentRev) return findings;

    // Map declared operations by unique key
    const declaredKeyMap = new Map<string, string>();
    for (const op of currentRev.operations) {
      const key = `${op.method || op.rpcName || op.channelName || ""}:${op.path || op.operationId}`;
      declaredKeyMap.set(key, op.operationId);
    }

    // Map observed operations
    const observedKeyMap = new Set<string>();
    for (const obs of observedOperations) {
      const key = `${obs.method || obs.rpcName || obs.channelName || ""}:${obs.path || ""}`;
      observedKeyMap.add(key);

      // Check for undeclared observed operation (Shadow API)
      if (!declaredKeyMap.has(key) && (obs.path || obs.rpcName || obs.channelName)) {
        findings.push({
          id: `drift-undeclared-${contract.id}-${key.replace(/[^a-zA-Z0-9]/g, "_")}`,
          contractId: contract.id,
          serviceId: contract.providerServiceId,
          driftType: "undeclared_observed_operation",
          severity: "high",
          description: `Shadow API Endpoint detected: Observed traffic on "${obs.method || ""} ${obs.path || obs.rpcName || obs.channelName}" (${obs.observedCallCount} calls) which is not declared in contract "${contract.name}".`,
        });
      }
    }

    // Check for declared operations that have zero observed runtime invocations
    for (const [key, opId] of declaredKeyMap.entries()) {
      if (!observedKeyMap.has(key)) {
        findings.push({
          id: `drift-unimplemented-${contract.id}-${opId}`,
          contractId: contract.id,
          serviceId: contract.providerServiceId,
          driftType: "unimplemented_declared_operation",
          severity: "low",
          description: `Operation "${opId}" is declared in contract "${contract.name}", but no runtime traffic has been observed.`,
          operationId: opId,
        });
      }
    }

    return findings;
  }
}

