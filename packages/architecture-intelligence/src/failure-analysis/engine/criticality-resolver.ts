import type { BaseNode } from "@nxtqr/graph-schema";
import type { GraphIndex } from "../../core/graph-index";
import type { CriticalityLevel, BusinessCapability } from "../contracts/failure.types";

export class CriticalityResolver {
  public static resolveNodeCriticality(node: BaseNode, index: GraphIndex): CriticalityLevel {
    const explicit = (node.data?.criticality as string)?.toLowerCase();
    if (
      explicit === "mission-critical" ||
      explicit === "high" ||
      explicit === "medium" ||
      explicit === "low" ||
      explicit === "informational"
    ) {
      return explicit as CriticalityLevel;
    }

    const type = node.type.toLowerCase();
    const def = index.infraDefMap.get(node.id);
    const caps = def?.capabilities || [];

    // Observability / Telemetry / Logs are informational / low criticality
    if (
      type.includes("log") ||
      type.includes("metric") ||
      type.includes("trace") ||
      type.includes("telemetry") ||
      caps.includes("metrics-collection") ||
      caps.includes("log-aggregation")
    ) {
      return "low";
    }

    // Central Auth / Primary DB / API Gateway are mission-critical
    if (
      type.includes("identity") ||
      type.includes("auth") ||
      type.includes("gateway") ||
      type.includes("relational-database") ||
      type.includes("primary-database") ||
      caps.includes("authentication")
    ) {
      return "mission-critical";
    }

    // Other databases, message queues, core services default to high
    if (
      index.dataStoreIds.includes(node.id) ||
      index.queueIds.includes(node.id) ||
      index.computeIds.includes(node.id)
    ) {
      return "high";
    }

    return "medium";
  }

  public static resolveCapabilities(
    nodes: BaseNode[],
    index: GraphIndex
  ): Record<string, BusinessCapability> {
    const capabilities: Record<string, BusinessCapability> = {};

    // 1. Check for explicitly defined capabilities in node configurations
    for (const node of nodes) {
      const explicitCaps = node.data?.capabilitiesSupported || node.data?.businessCapabilities;
      if (Array.isArray(explicitCaps)) {
        for (const capName of explicitCaps) {
          const capId = `cap_${String(capName).toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
          if (!capabilities[capId]) {
            capabilities[capId] = {
              id: capId,
              name: String(capName),
              criticality: this.resolveNodeCriticality(node, index),
              entryPointNodeIds: index.entryPointIds,
              supportedNodeIds: [],
            };
          }
          if (!capabilities[capId].supportedNodeIds.includes(node.id)) {
            capabilities[capId].supportedNodeIds.push(node.id);
          }
        }
      }
    }

    // 2. Synthesize default business capabilities if none explicitly configured
    if (Object.keys(capabilities).length === 0) {
      // Ingress capability
      if (index.entryPointIds.length > 0) {
        capabilities["cap_ingress"] = {
          id: "cap_ingress",
          name: "User Ingress & API Routing",
          criticality: "mission-critical",
          entryPointNodeIds: index.entryPointIds,
          supportedNodeIds: [...index.entryPointIds],
        };
      }

      // Persistence capability
      if (index.dataStoreIds.length > 0) {
        capabilities["cap_data_persistence"] = {
          id: "cap_data_persistence",
          name: "Core Data Persistence & Storage",
          criticality: "mission-critical",
          entryPointNodeIds: index.entryPointIds,
          supportedNodeIds: [...index.dataStoreIds],
        };
      }

      // Background Processing capability
      if (index.queueIds.length > 0) {
        capabilities["cap_async_processing"] = {
          id: "cap_async_processing",
          name: "Asynchronous Message Processing",
          criticality: "high",
          entryPointNodeIds: index.entryPointIds,
          supportedNodeIds: [...index.queueIds],
        };
      }
    }

    return capabilities;
  }
}

