import type { BaseNode } from "@nxtqr/graph-schema";
import type {
  DiscoveredService,
  TelemetryServiceMapping,
  MappingConfidence,
} from "../contracts/observability.types";

export class ServiceIdentityMapper {
  /**
   * Evaluates mapping confidence between a discovered service and an architecture node.
   */
  public static evaluateConfidence(
    service: DiscoveredService,
    node: BaseNode
  ): { confidence: MappingConfidence; score: number; reasons: string[] } {
    const reasons: string[] = [];
    const svcName = service.serviceIdentity.serviceName.toLowerCase().replace(/[-_.]/g, "");
    const nodeId = node.id.toLowerCase().replace(/[-_.]/g, "");
    const nodeLabel = ((node.data?.label as string) || "").toLowerCase().replace(/[-_.]/g, "");

    // 1. Exact ID or Label match
    if (svcName === nodeId || svcName === nodeLabel) {
      reasons.push(`Exact name match with node ${node.id} (${node.data?.label || node.id})`);
      return { confidence: "suggested", score: 0.95, reasons };
    }

    // 2. Substring containment
    if (svcName.includes(nodeId) || nodeId.includes(svcName) || (nodeLabel && (svcName.includes(nodeLabel) || nodeLabel.includes(svcName)))) {
      reasons.push(`Partial token match between service '${service.serviceIdentity.serviceName}' and node '${node.data?.label || node.id}'`);
      return { confidence: "suggested", score: 0.75, reasons };
    }

    // 3. Category match (e.g. database in node type and 'postgres'/'db' in service)
    const nodeType = (node.type || "").toLowerCase();
    if (
      (nodeType.includes("database") || nodeType.includes("sql")) &&
      (svcName.includes("db") || svcName.includes("postgres") || svcName.includes("mysql"))
    ) {
      reasons.push(`Component type '${node.type}' matches database service signature`);
      return { confidence: "suggested", score: 0.60, reasons };
    }

    return { confidence: "unmapped", score: 0.1, reasons: ["No clear naming correlation detected"] };
  }

  /**
   * Generates suggested mappings for discovered services across active graph nodes.
   */
  public static generateSuggestions(
    services: DiscoveredService[],
    nodes: BaseNode[],
    connectionId: string,
    architectureId: string,
    projectId: string
  ): TelemetryServiceMapping[] {
    const mappings: TelemetryServiceMapping[] = [];

    for (const svc of services) {
      let bestNode: BaseNode | null = null;
      let highestScore = 0;
      let bestReasons: string[] = [];
      let matchCount = 0;

      for (const node of nodes) {
        const { score, reasons } = this.evaluateConfidence(svc, node);
        if (score >= 0.7) {
          matchCount++;
          if (score > highestScore) {
            highestScore = score;
            bestNode = node;
            bestReasons = reasons;
          }
        }
      }

      if (bestNode && highestScore >= 0.7) {
        const confidence: MappingConfidence = matchCount > 1 ? "ambiguous" : "suggested";
        if (confidence === "ambiguous") {
          bestReasons.push(`Multiple components matched this service (${matchCount} candidates). Explicit user confirmation required.`);
        }

        mappings.push({
          id: `map-${Date.now()}-${bestNode.id}`,
          projectId,
          architectureId,
          componentId: bestNode.id,
          connectionId,
          serviceIdentity: svc.serviceIdentity,
          confidence,
          evidenceScore: highestScore,
          evidenceReasons: bestReasons,
          lastVerifiedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    return mappings;
  }

  /**
   * Validates saved mappings against current graph nodes to detect stale or invalid component mappings.
   */
  public static validateMappings(
    mappings: TelemetryServiceMapping[],
    nodes: BaseNode[]
  ): TelemetryServiceMapping[] {
    const nodeIds = new Set(nodes.map((n) => n.id));

    return mappings.map((m) => {
      if (!nodeIds.has(m.componentId)) {
        return {
          ...m,
          confidence: "stale",
          evidenceReasons: [
            ...m.evidenceReasons,
            `Target component #${m.componentId} was removed or modified in current graph revision.`,
          ],
        };
      }
      return m;
    });
  }
}
