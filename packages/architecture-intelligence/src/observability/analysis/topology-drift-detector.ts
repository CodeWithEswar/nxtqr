import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import type {
  TelemetryServiceMapping,
  TopologyDriftFinding,
  TraceSpan,
} from "../contracts/observability.types";

export class TopologyDriftDetector {
  /**
   * Compares observed service call traffic with modeled architecture topology.
   */
  public static detectDrift(params: {
    nodes: BaseNode[];
    edges: BaseEdge[];
    mappings: TelemetryServiceMapping[];
    observedSpans: TraceSpan[];
  }): TopologyDriftFinding[] {
    const { nodes, edges, mappings, observedSpans } = params;
    const findings: TopologyDriftFinding[] = [];

    // Map serviceName -> componentId
    const serviceToComponentMap = new Map<string, string>();
    const mappedComponentIds = new Set<string>();

    for (const m of mappings) {
      if (m.confidence === "confirmed" || m.confidence === "suggested") {
        serviceToComponentMap.set(m.serviceIdentity.serviceName.toLowerCase(), m.componentId);
        mappedComponentIds.add(m.componentId);
      }
    }

    // 1. Check for unmonitored architecture components (Missing Telemetry Coverage)
    for (const node of nodes) {
      if (!mappedComponentIds.has(node.id)) {
        findings.push({
          id: `drift-missing-cov-${node.id}`,
          type: "missing_telemetry",
          severity: "low",
          sourceComponentId: node.id,
          title: `Unmonitored Component: ${node.data?.label || node.id}`,
          explanation: `Component #${node.id} has no mapped telemetry source or confirmed service identity in active monitoring connections.`,
          evidence: "0 active telemetry connections bound to this node.",
          suggestedAction: "Map an authorized Prometheus or OpenTelemetry service identity to establish observability.",
        });
      }
    }

    // 2. Map observed calls between spans
    const spanMap = new Map<string, TraceSpan>();
    for (const span of observedSpans) {
      spanMap.set(span.spanId, span);
    }

    const observedEdgePairs = new Set<string>(); // "sourceComponentId->targetComponentId"
    const edgePairToServices = new Map<string, { parentService: string; childService: string }>();

    for (const span of observedSpans) {
      if (span.parentSpanId) {
        const parent = spanMap.get(span.parentSpanId);
        if (parent && parent.serviceName !== span.serviceName) {
          const parentCompId = serviceToComponentMap.get(parent.serviceName.toLowerCase());
          const childCompId = serviceToComponentMap.get(span.serviceName.toLowerCase());

          if (parentCompId && childCompId && parentCompId !== childCompId) {
            const pairKey = `${parentCompId}->${childCompId}`;
            observedEdgePairs.add(pairKey);
            edgePairToServices.set(pairKey, {
              parentService: parent.serviceName,
              childService: span.serviceName,
            });
          }
        }
      }
    }

    // Existing modeled edge pairs
    const modeledEdgePairs = new Set<string>();
    for (const e of edges) {
      modeledEdgePairs.add(`${e.source}->${e.target}`);
    }

    // 3. Detect unmodeled dependencies (Shadow / Unexpected calls in production)
    for (const pair of observedEdgePairs) {
      if (!modeledEdgePairs.has(pair)) {
        const [sourceId, targetId] = pair.split("->");
        const sourceNode = nodes.find((n) => n.id === sourceId);
        const targetNode = nodes.find((n) => n.id === targetId);
        const svcPair = edgePairToServices.get(pair);

        findings.push({
          id: `drift-unmodeled-${sourceId}-${targetId}`,
          type: "unmapped_dependency",
          severity: "high",
          sourceComponentId: sourceId,
          targetComponentId: targetId,
          title: `Unmodeled Dependency Call: ${sourceNode?.data?.label || sourceId} ➔ ${targetNode?.data?.label || targetId}`,
          explanation: `Distributed traces recorded cross-service RPC/HTTP calls from '${sourceNode?.data?.label || sourceId}' to '${targetNode?.data?.label || targetId}', but no connection edge exists in the architecture diagram.`,
          evidence: svcPair
            ? `Recorded cross-service runtime dependency call (${svcPair.parentService} -> ${svcPair.childService}) in distributed trace spans.`
            : `Recorded cross-service runtime dependency call (${sourceId} -> ${targetId}) in distributed trace spans.`,
          suggestedAction: "Propose an architecture graph update to add this dependency connection edge.",
        });
      }
    }

    // 4. Detect modeled edges without observed traffic (if traces available)
    if (observedSpans.length > 5) {
      for (const edge of edges) {
        const pair = `${edge.source}->${edge.target}`;
        const sourceMapped = mappedComponentIds.has(edge.source);
        const targetMapped = mappedComponentIds.has(edge.target);

        // Only flag if both endpoints have confirmed telemetry mapping
        if (sourceMapped && targetMapped && !observedEdgePairs.has(pair)) {
          const sourceNode = nodes.find((n) => n.id === edge.source);
          const targetNode = nodes.find((n) => n.id === edge.target);

          findings.push({
            id: `drift-missing-traffic-${edge.id}`,
            type: "missing_modeled_traffic",
            severity: "low",
            sourceComponentId: edge.source,
            targetComponentId: edge.target,
            title: `Modeled Edge Without Observed Traffic: ${sourceNode?.data?.label || edge.source} ➔ ${targetNode?.data?.label || edge.target}`,
            explanation: `Connection edge #${edge.id} exists in architecture model, but zero request traffic was observed between these mapped services during the query time window.`,
            evidence: `0 spans captured across this boundary in current trace sample.`,
            suggestedAction: "Verify if this communication path is dormant, fallback-only, or decommissioned.",
          });
        }
      }
    }

    return findings;
  }
}
