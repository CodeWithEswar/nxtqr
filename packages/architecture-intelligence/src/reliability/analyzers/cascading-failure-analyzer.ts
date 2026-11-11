import type { IReliabilityAnalyzer, ReliabilityContext } from "../contracts/reliability.types";
import type { ReliabilityFinding } from "../schemas/reliability.schemas";
import { FailurePropagationEngine } from "../engine/failure-propagation";

export class CascadingFailureAnalyzer implements IReliabilityAnalyzer {
  public readonly category = "cascading-failure";

  public analyze(context: ReliabilityContext): ReliabilityFinding[] {
    const findings: ReliabilityFinding[] = [];

    // Trace all propagation paths
    const paths = FailurePropagationEngine.tracePropagationPaths(
      context.nodes,
      context.edges,
      context.nodeProfiles
    );

    for (const path of paths) {
      if (path.riskType === "cascading-collapse" && path.chain.length >= 3 && !path.isContained) {
        const chainNames = path.chain.map((id) => context.nodeMap.get(id)?.label || id);

        findings.push({
          id: `REL-CASC-001-${path.originNodeId}-${path.targetNodeId}`,
          ruleId: "REL-CASC-001",
          category: "cascading-failure",
          severity: "high",
          classification: "potential-risk",
          title: `Cascading Failure Path Detected (${path.chain.length} hops): ${chainNames[0]} &rarr; ${chainNames[chainNames.length - 1]}`,
          explanation: `A synchronous deep call chain exists (${chainNames.join(" \u2192 ")}) without circuit breaking, bulkhead isolation, or fallback containment. If the leaf dependency "${chainNames[chainNames.length - 1]}" suffers latency degradation, all upstream caller threads will block sequentially, rapidly propagating failures all the way back to the user entrypoint.`,
          affectedNodeIds: path.chain,
          affectedEdgeIds: [],
          evidence: [
            {
              kind: "path",
              elementId: path.originNodeId,
              propertyKey: "propagationDepth",
              expectedValue: "< 3 synchronous uncontained hops",
              actualValue: `${path.chain.length} uncontained hops`,
              description: `Synchronous chain (${chainNames.join(" -> ")}) has no circuit breaker or fallback mechanism.`,
            },
          ],
          assumptions: [
            "Downstream latency spikes hold upstream caller threads and connection pools.",
          ],
          confidence: "high",
          propagationChain: path.chain,
          remediation: "Deploy circuit breakers or asynchronous queue buffers along intermediate boundaries to break cascading dependency chains.",
          remediationAction: "add_circuit_breaker",
        });
      }
    }

    return findings;
  }
}
