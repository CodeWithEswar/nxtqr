import type { IReliabilityAnalyzer, ReliabilityContext } from "../contracts/reliability.types";
import type { ReliabilityFinding } from "../schemas/reliability.schemas";

export class TimeoutAnalyzer implements IReliabilityAnalyzer {
  public readonly category = "timeout";

  public analyze(context: ReliabilityContext): ReliabilityFinding[] {
    const findings: ReliabilityFinding[] = [];

    // 1. Evaluate edges for missing timeouts and deadline inversions
    for (const edge of context.edges) {
      const edgeData = (edge.data || {}) as Record<string, unknown>;
      const isAsync = edgeData.isSynchronous === false || edgeData.protocol === "amqp" || edgeData.protocol === "kafka";
      if (isAsync) continue;

      const sourceNode = context.nodeMap.get(edge.source);
      const targetNode = context.nodeMap.get(edge.target);
      if (!sourceNode || !targetNode) continue;

      const sourceProfile = context.nodeProfiles[edge.source];
      const targetProfile = context.nodeProfiles[edge.target];
      if (!sourceProfile || !targetProfile) continue;

      // REL-TIME-001: Missing Documented Timeout on Remote Synchronous Dependency
      const hasTimeout =
        typeof edgeData.timeoutMs === "number" ||
        targetProfile.declaredTimeoutMs !== null;

      if (!hasTimeout && targetProfile.criticality !== "optional") {
        findings.push({
          id: `REL-TIME-001-${edge.id}`,
          ruleId: "REL-TIME-001",
          category: "timeout",
          severity: "high",
          classification: "configuration-gap",
          title: `Missing Timeout Policy on Call from "${sourceNode.label || edge.source}" to "${targetNode.label || edge.target}"`,
          explanation: `The synchronous network call from "${sourceNode.label || edge.source}" to "${targetNode.label || edge.target}" has no explicit connection, read, or request timeout specified. If the downstream dependency freezes or hangs, caller threads will block indefinitely, leading to socket and worker thread exhaustion.`,
          affectedNodeIds: [edge.source, edge.target],
          affectedEdgeIds: [edge.id],
          evidence: [
            {
              kind: "edge",
              elementId: edge.id,
              propertyKey: "timeoutMs",
              expectedValue: "> 0",
              actualValue: "unspecified",
              description: "No timeout policy is declared on this synchronous remote connection.",
            },
          ],
          assumptions: [
            "Default OS TCP socket timeouts can take up to several minutes before timing out.",
          ],
          confidence: "high",
          propagationChain: [edge.source, edge.target],
          remediation: "Configure an explicit request timeout (e.g. 500ms to 2000ms) with cancellation propagation.",
          remediationAction: "align_timeouts",
        });
      }

      // REL-TIME-002: Deadline Inversion (Caller Deadline < Callee Operation Timeout)
      const callerTimeout = sourceProfile.declaredTimeoutMs ?? (typeof edgeData.timeoutMs === "number" ? edgeData.timeoutMs : null);
      const calleeTimeout = targetProfile.declaredTimeoutMs;

      if (callerTimeout !== null && calleeTimeout !== null && callerTimeout < calleeTimeout) {
        findings.push({
          id: `REL-TIME-002-${edge.id}`,
          ruleId: "REL-TIME-002",
          category: "timeout",
          severity: "high",
          classification: "modeled-conflict",
          title: `Deadline Inversion: Caller "${sourceNode.label || edge.source}" (${callerTimeout}ms) Times Out Faster Than Target "${targetNode.label || edge.target}" (${calleeTimeout}ms)`,
          explanation: `Caller timeout (${callerTimeout}ms) is shorter than target operation timeout (${calleeTimeout}ms). When target latency rises, the caller will abort and return a 504 Gateway Timeout to the user, while the downstream service continues executing unneeded work without cancellation, wasting compute and database connections.`,
          affectedNodeIds: [edge.source, edge.target],
          affectedEdgeIds: [edge.id],
          evidence: [
            {
              kind: "property",
              elementId: edge.source,
              propertyKey: "callerTimeoutMs",
              expectedValue: `>= ${calleeTimeout}ms`,
              actualValue: `${callerTimeout}ms`,
              description: `Caller timeout (${callerTimeout}ms) is shorter than callee timeout (${calleeTimeout}ms).`,
            },
          ],
          assumptions: [
            "Downstream operations do not listen to cancellation tokens when client sockets disconnect.",
          ],
          confidence: "high",
          propagationChain: [edge.source, edge.target],
          remediation: "Align timeouts such that caller deadline accommodates downstream SLA plus network margin, or pass an explicit deadline context header that cancels downstream work upon caller abort.",
          remediationAction: "align_timeouts",
        });
      }
    }

    // 2. REL-TIME-003: Cumulative Sequential Downstream Timeouts Exceeding Ingress
    for (const node of context.nodes) {
      const profile = context.nodeProfiles[node.id];
      if (!profile || profile.declaredTimeoutMs === null) continue;

      const parentTimeout = profile.declaredTimeoutMs;
      const outgoingEdges = context.outgoingEdgesMap.get(node.id) || [];
      if (outgoingEdges.length < 2) continue;

      let sequentialTimeoutSum = 0;
      const childNames: string[] = [];

      for (const outEdge of outgoingEdges) {
        const targetProf = context.nodeProfiles[outEdge.target];
        if (targetProf && targetProf.declaredTimeoutMs !== null) {
          sequentialTimeoutSum += targetProf.declaredTimeoutMs;
          const targetNode = context.nodeMap.get(outEdge.target);
          childNames.push(targetNode?.label || outEdge.target);
        }
      }

      if (sequentialTimeoutSum > parentTimeout * 1.5) {
        findings.push({
          id: `REL-TIME-003-${node.id}`,
          ruleId: "REL-TIME-003",
          category: "timeout",
          severity: "medium",
          classification: "potential-risk",
          title: `Cumulative Downstream Timeout (${sequentialTimeoutSum}ms) Exceeds Entry Deadline (${parentTimeout}ms) on "${node.label || node.id}"`,
          explanation: `Service "${node.label || node.id}" has an ingress timeout of ${parentTimeout}ms, but sequentially queries downstream dependencies (${childNames.join(", ")}) whose combined timeouts sum to ${sequentialTimeoutSum}ms. Under degraded conditions, requests will fail at the ingress tier before downstream responses complete.`,
          affectedNodeIds: [node.id, ...outgoingEdges.map((e) => e.target)],
          affectedEdgeIds: outgoingEdges.map((e) => e.id),
          evidence: [
            {
              kind: "property",
              elementId: node.id,
              propertyKey: "cumulativeTimeoutMs",
              expectedValue: `<= ${parentTimeout}ms`,
              actualValue: `${sequentialTimeoutSum}ms`,
              description: `Combined sequential child timeouts (${sequentialTimeoutSum}ms) exceed ingress deadline (${parentTimeout}ms).`,
            },
          ],
          assumptions: [
            "Dependencies are executed sequentially rather than in parallel.",
          ],
          confidence: "medium",
          propagationChain: [node.id, ...outgoingEdges.map((e) => e.target)],
          remediation: "Execute independent downstream dependencies concurrently via Promise.all / fan-out, or reduce child operation timeouts to fit within parent budget.",
          remediationAction: "align_timeouts",
        });
      }
    }

    return findings;
  }
}

