/**
 * NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
 * Lineage Drift & Discrepancy Detector
 */

import type {
  ArchitectureDataLineageModel,
  DataFlow,
  LineageDriftFinding,
} from "../contracts/lineage.types";

export interface ObservedTrafficFlow {
  sourceComponentId: string;
  destinationComponentId: string;
  observedProtocol?: string;
  observedAssetId?: string;
  requestCount?: number;
  lastObservedAt: string;
}

export class LineageDriftDetector {
  /**
   * Compares the modeled architecture data flows against observed runtime traffic
   * or imported specifications to identify shadow data flows, missing flows, or unclassified movement.
   */
  public static detectDrift(
    modeled: ArchitectureDataLineageModel,
    observedFlows: ObservedTrafficFlow[]
  ): LineageDriftFinding[] {
    const findings: LineageDriftFinding[] = [];

    // Map modeled flows by "source->destination"
    const modeledFlowMap = new Map<string, DataFlow>();
    for (const flow of modeled.flows) {
      const key = `${flow.sourceComponentId}->${flow.destinationComponentId}`;
      modeledFlowMap.set(key, flow);
    }

    // Map observed flows
    const observedFlowMap = new Map<string, ObservedTrafficFlow>();
    for (const obs of observedFlows) {
      const key = `${obs.sourceComponentId}->${obs.destinationComponentId}`;
      observedFlowMap.set(key, obs);

      // Check for unexpected flows (observed in traffic, but absent from architecture model)
      if (!modeledFlowMap.has(key)) {
        findings.push({
          id: `drift-unexpected-${obs.sourceComponentId}-${obs.destinationComponentId}`,
          type: "unexpected_flow",
          title: `Shadow Data Flow: ${obs.sourceComponentId} -> ${obs.destinationComponentId}`,
          severity: "high",
          description: `Observed ${obs.requestCount || 1} runtime transmissions between "${obs.sourceComponentId}" and "${obs.destinationComponentId}" that are not documented in the architecture lineage model.`,
          componentId: obs.sourceComponentId,
        });
      }
    }

    // Check for missing flows (modeled in architecture, but completely absent from observed traffic)
    for (const flow of modeled.flows) {
      const key = `${flow.sourceComponentId}->${flow.destinationComponentId}`;
      if (!observedFlowMap.has(key)) {
        findings.push({
          id: `drift-missing-${flow.id}`,
          type: "missing_flow",
          title: `Inactive / Missing Flow: ${flow.sourceComponentId} -> ${flow.destinationComponentId}`,
          severity: "low",
          description: `Flow "${flow.name || flow.id}" is modeled in architecture, but no matching traffic was observed in telemetry.`,
          flowId: flow.id,
          componentId: flow.sourceComponentId,
        });
      }

      // Check for unclassified flow
      if (flow.dataAssetIds.length === 0) {
        findings.push({
          id: `drift-unclassified-${flow.id}`,
          type: "unclassified_flow",
          title: `Unclassified Data Flow: ${flow.sourceComponentId} -> ${flow.destinationComponentId}`,
          severity: "medium",
          description: `Active data flow between "${flow.sourceComponentId}" and "${flow.destinationComponentId}" carries no classified data assets.`,
          flowId: flow.id,
          componentId: flow.sourceComponentId,
        });
      }
    }

    return findings;
  }
}

