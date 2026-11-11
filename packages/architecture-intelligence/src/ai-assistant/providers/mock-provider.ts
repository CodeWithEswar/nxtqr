import type {
  AIMessage,
  AICitation,
  AIArchitectureProposal,
  AIStreamChunk,
  AIToolCall,
} from "../contracts/ai-assistant.types";
import type {
  IAIProvider,
  ProviderCompletionRequest,
  ProviderCompletionResponse,
} from "./provider-interface";
import { architectureToolRegistry } from "../tools/tool-registry";
import { EvidenceVerifier } from "../orchestration/evidence-verifier";

export class DeterministicMockProvider implements IAIProvider {
  public readonly providerId = "deterministic-mock";
  public readonly modelId = "nxtqr-mock-copilot-v1";

  public async complete(request: ProviderCompletionRequest): Promise<ProviderCompletionResponse> {
    const chunks: AIStreamChunk[] = [];
    return this.stream(request, (chunk) => chunks.push(chunk));
  }

  public async stream(
    request: ProviderCompletionRequest,
    onChunk: (chunk: AIStreamChunk) => void
  ): Promise<ProviderCompletionResponse> {
    const { messages, executionContext } = request;
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");
    const query = (lastUserMessage?.content || "").toLowerCase().trim();

    const citations: AICitation[] = [];
    let proposal: AIArchitectureProposal | undefined;
    let responseText = "";

    // 1. Intent: Proposal generation (e.g., "add cache", "propose", "what if")
    if (query.includes("cache") && (query.includes("add") || query.includes("propose") || query.includes("what if") || query.includes("introduce"))) {
      const dbNode = executionContext.nodes.find((n) => n.type.includes("database") || n.type.includes("sql") || n.id.includes("db"));
      const serviceNode = executionContext.nodes.find((n) => n.type.includes("service") || n.type.includes("api") || n.type.includes("backend"));

      const targetDbId = dbNode ? dbNode.id : "database-primary";
      const targetSvcId = serviceNode ? serviceNode.id : "api-service";

      const connectingEdge = executionContext.edges.find(
        (e) => (e.source === targetSvcId && e.target === targetDbId) || (e.source === targetDbId && e.target === targetSvcId)
      );

      // Execute tool to get bottleneck info
      const toolCall: AIToolCall = {
        id: `call_${Date.now()}_1`,
        name: "get_bottleneck_findings",
        arguments: {},
      };
      onChunk({ type: "tool_call_start", toolCall });
      const toolRes = await architectureToolRegistry.executeTool("get_bottleneck_findings", {}, executionContext);
      onChunk({
        type: "tool_call_result",
        toolResult: { toolCallId: toolCall.id, name: toolCall.name, result: toolRes.result },
      });

      const cacheNodeId = "cache-redis-01";
      proposal = {
        id: `prop_${Date.now()}`,
        architectureId: executionContext.architectureId,
        baseGraphRevision: executionContext.graphRevision,
        title: "Introduce Distributed Caching Layer",
        explanation: `Add a Redis in-memory cache between \`${targetSvcId}\` and \`${targetDbId}\` to offload high read RPS and eliminate database contention.`,
        operations: connectingEdge
          ? [
              {
                type: "insert_mediator",
                replaceEdgeId: connectingEdge.id,
                mediatorNode: {
                  id: cacheNodeId,
                  type: "redis-cache",
                  position: { x: 350, y: 250 },
                  label: "Redis Cache Tier",
                  data: {
                    tier: "cache",
                    cacheStrategy: "cache-aside",
                    evictionPolicy: "volatile-lru",
                    maxMemoryMb: 4096,
                  },
                },
                inProtocol: "tcp",
                outProtocol: "tcp",
              },
            ]
          : [
              {
                type: "add_node",
                node: {
                  id: cacheNodeId,
                  type: "redis-cache",
                  position: { x: 350, y: 250 },
                  label: "Redis Cache Tier",
                  data: {
                    tier: "cache",
                    cacheStrategy: "cache-aside",
                  },
                },
              },
            ],
        assumptions: [
          "Read workload exhibits at least 70% cache locality.",
          "Cache-aside pattern with TTL invalidation is compatible with service domain logic.",
        ],
        prerequisites: [
          "Network VPC peering between application cluster and Redis subnet.",
        ],
        tradeoffs: [
          "Slight eventual consistency window during updates.",
          "Additional operational overhead for cache cluster management.",
        ],
        sourceFindingIds: ["BOT-DB-001"],
        validationStatus: "valid",
        validationErrors: [],
      };

      responseText = `### Proposed Architecture Modification: Cache Tier Insertion

I have analyzed the current data access patterns and identified significant read contention on \`${targetDbId}\`.

#### Architectural Strategy
1. **Insert Distributed Cache**: Introducing \`${cacheNodeId}\` (Redis) as a low-latency read buffer.
2. **Read-Through / Cache-Aside**: Offloads up to 85% of repeated read queries from primary storage.
3. **Reduced Latency**: Drops P95 response times from ~120ms to under 15ms.

Review the structured proposal card below. You can preview this change non-destructively on the canvas before deciding whether to confirm and apply it.`;

      if (dbNode) citations.push({ type: "node", targetId: dbNode.id, label: dbNode.label || dbNode.id });
      if (serviceNode) citations.push({ type: "node", targetId: serviceNode.id, label: serviceNode.label || serviceNode.id });

    // 2. Intent: SPOF / Single Point of Failure
    } else if (query.includes("spof") || query.includes("single point") || query.includes("failure")) {
      const toolCall: AIToolCall = {
        id: `call_${Date.now()}_2`,
        name: "get_spof_findings",
        arguments: {},
      };
      onChunk({ type: "tool_call_start", toolCall });
      const toolRes = await architectureToolRegistry.executeTool("get_spof_findings", {}, executionContext);
      onChunk({
        type: "tool_call_result",
        toolResult: { toolCallId: toolCall.id, name: toolCall.name, result: toolRes.result },
      });

      const spofs = (toolRes.result as any)?.findings || (toolRes.result as any)?.spofs || [];
      if (spofs.length > 0) {
        const topSpof = spofs[0];
        const blastScore = topSpof.blastRadiusScore || 85;
        const remediationText = topSpof.remediation || topSpof.mitigation || "Deploy a multi-AZ secondary standby with automated heartbeat failover and circuit breaker protection.";
        responseText = `### Single Point of Failure (SPOF) Analysis

Based on deterministic failure dependency modeling:

- **Critical Component**: \`${topSpof.nodeId}\`
- **Severity**: **${(topSpof.severity || "high").toUpperCase()}**
- **Failure Category**: \`${topSpof.category || "single-point-of-failure"}\`
- **Blast Radius Score**: **${blastScore}/100**

#### Impact & Vulnerability
Component \`${topSpof.nodeId}\` is on the critical synchronous path without automated failover or redundant replicas. If this instance experiences partition or crash fault, all upstream callers will fail synchronously.

#### Recommended Mitigation
${remediationText}`;

        citations.push({ type: "node", targetId: topSpof.nodeId, label: topSpof.nodeId });
        citations.push({ type: "finding", targetId: topSpof.id, label: `SPOF Finding (${topSpof.nodeId})` });
      } else {
        responseText = `### Single Point of Failure (SPOF) Analysis

The current topology has no detected single points of failure. Redundancy and multi-zone failover configurations satisfy standard high-availability requirements.`;
      }

    // 3. Intent: Bottlenecks
    } else if (query.includes("bottleneck") || query.includes("latency") || query.includes("contention")) {
      const toolCall: AIToolCall = {
        id: `call_${Date.now()}_3`,
        name: "get_bottleneck_findings",
        arguments: {},
      };
      onChunk({ type: "tool_call_start", toolCall });
      const toolRes = await architectureToolRegistry.executeTool("get_bottleneck_findings", {}, executionContext);
      onChunk({
        type: "tool_call_result",
        toolResult: { toolCallId: toolCall.id, name: toolCall.name, result: toolRes.result },
      });

      const bottlenecks = (toolRes.result as any)?.bottlenecks || (toolRes.result as any)?.findings || [];
      if (bottlenecks.length > 0) {
        const b = bottlenecks[0];
        responseText = `### Bottleneck Investigation

Our deterministic performance analysis identified throughput constraints on component \`${b.nodeId}\`:

| Metric | Finding Details |
| :--- | :--- |
| **Bottleneck Type** | \`${b.type || b.bottleneckType || "contention"}\` |
| **Severity** | **${(b.severity || "high").toUpperCase()}** |
| **Target Component** | \`${b.nodeId}\` |
| **Delta** | \`${b.metricDelta || "Exceeds saturation threshold"}\` |

#### Root Cause
\`${b.explanation || b.summary || "High request concurrency causes connection exhaustion."}\`

#### Solution Strategy
Consider horizontal partitioning, read-replica offloading, or introducing an asynchronous message queue.`;

        citations.push({ type: "node", targetId: b.nodeId, label: b.nodeId });
        citations.push({ type: "finding", targetId: b.id, label: `Bottleneck: ${b.type || b.bottleneckType || "contention"}` });
      } else {
        responseText = `### Bottleneck Analysis

All components operate within safe headroom margins under the configured workload profile. No acute throughput or contention bottlenecks were detected.`;
      }

    // 4. Intent: Security Architecture
    } else if (query.includes("security") || query.includes("tls") || query.includes("auth") || query.includes("boundary")) {
      const toolCall: AIToolCall = {
        id: `call_${Date.now()}_4`,
        name: "get_security_findings",
        arguments: {},
      };
      onChunk({ type: "tool_call_start", toolCall });
      const toolRes = await architectureToolRegistry.executeTool("get_security_findings", {}, executionContext);
      onChunk({
        type: "tool_call_result",
        toolResult: { toolCallId: toolCall.id, name: toolCall.name, result: toolRes.result },
      });

      const findings = (toolRes.result as any)?.findings || [];
      if (findings.length > 0) {
        const f = findings[0];
        const affectedNodeId = f.affectedNodeIds?.[0] || "system";
        responseText = `### Security Architecture Assessment

A security policy finding was detected:

- **Rule Code**: \`${f.ruleId || f.code}\`
- **Severity**: **${(f.severity || "high").toUpperCase()}**
- **Title**: ${f.title}
- **Affected Node**: \`${affectedNodeId}\`

#### Policy Rule
Unencrypted boundary crossings or public-facing databases violate Zero Trust isolation standards.

#### Remediation
${f.remediation || f.recommendation || "Enforce mutual TLS (mTLS) and place data tier inside a private subnet behind a VPC gateway."}`;

        if (affectedNodeId !== "system") {
          citations.push({ type: "node", targetId: affectedNodeId, label: affectedNodeId });
        }
        citations.push({ type: "finding", targetId: f.id, label: f.ruleId || f.code });
      } else {
        responseText = `### Security Architecture Assessment

All network boundaries, authentication handshakes, and encryption configurations pass the active Zero Trust and OWASP architectural security rules.`;
      }

    // 5. Intent: Component Documentation or details
    } else if (query.includes("component") || query.includes("what does") || query.includes("explain")) {
      const selectedId = executionContext.selectedNodeIds?.[0] || executionContext.nodes[0]?.id;
      if (selectedId) {
        const toolCall: AIToolCall = {
          id: `call_${Date.now()}_5`,
          name: "get_component_details",
          arguments: { nodeId: selectedId },
        };
        onChunk({ type: "tool_call_start", toolCall });
        const toolRes = await architectureToolRegistry.executeTool("get_component_details", { nodeId: selectedId }, executionContext);
        onChunk({
          type: "tool_call_result",
          toolResult: { toolCallId: toolCall.id, name: toolCall.name, result: toolRes.result },
        });

        const details = toolRes.result as any;
        responseText = `### Component Inspection: \`${details.label || selectedId}\`

- **Type**: \`${details.type}\`
- **Replicas**: \`${details.config?.replicas ?? 1}\`
- **Inbound Connections**: ${details.incomingConnections?.length || 0}
- **Outbound Connections**: ${details.outgoingConnections?.length || 0}

#### Architecture Context
This component serves as a core part of the system design. Upstream callers communicate via \`${details.incomingConnections?.[0]?.protocol || "HTTP"}\`, and state is maintained per configured policies.`;

        citations.push({ type: "node", targetId: selectedId, label: details.label || selectedId });
      } else {
        responseText = `Please select a component on the canvas or specify a component ID to inspect its architectural specifications.`;
      }

    // 6. Default / General Architecture Summary
    } else {
      const toolCall: AIToolCall = {
        id: `call_${Date.now()}_6`,
        name: "get_architecture_summary",
        arguments: {},
      };
      onChunk({ type: "tool_call_start", toolCall });
      const toolRes = await architectureToolRegistry.executeTool("get_architecture_summary", {}, executionContext);
      onChunk({
        type: "tool_call_result",
        toolResult: { toolCallId: toolCall.id, name: toolCall.name, result: toolRes.result },
      });

      const summary = toolRes.result as any;
      responseText = `### Architecture Overview (Revision: \`${summary.graphRevision}\`)

- **Total Components**: ${summary.totalNodes}
- **Total Connections**: ${summary.totalEdges}
- **Active Scenario**: \`${summary.activeScenarioId}\`

How would you like to proceed? You can ask about:
1. **Bottleneck & Capacity Analysis**: Investigate throughput limits and latency hotspots.
2. **Single Point of Failure (SPOF)**: Trace blast radiuses and critical singletons.
3. **Security Architecture**: Check zero-trust boundaries and credential isolation.
4. **Architecture Proposals**: Suggest caching, horizontal scaling, or asynchronous decoupling.`;

      for (const node of executionContext.nodes.slice(0, 3)) {
        citations.push({ type: "node", targetId: node.id, label: node.label || node.id });
      }
    }

    // Auto extract implicit citations
    const implicit = EvidenceVerifier.extractImplicitCitations(responseText, executionContext);
    for (const c of implicit) {
      if (!citations.some((existing) => existing.targetId === c.targetId)) {
        citations.push(c);
      }
    }

    // Stream text in words
    const words = responseText.split(" ");
    for (const word of words) {
      onChunk({ type: "token", content: word + " " });
    }

    // Emit citations & proposal
    for (const c of citations) {
      onChunk({ type: "citation", citation: c });
    }

    if (proposal) {
      onChunk({ type: "proposal", proposal });
    }

    onChunk({ type: "done" });

    const assistantMessage: AIMessage = {
      id: `msg_${Date.now()}`,
      conversationId: lastUserMessage?.conversationId || "conv_default",
      role: "assistant",
      content: responseText,
      timestamp: new Date().toISOString(),
      citations,
      proposal,
    };

    return {
      message: assistantMessage,
      citations,
      proposal,
      tokensUsed: {
        promptTokens: Math.ceil(request.contextPrompt.length / 4),
        completionTokens: Math.ceil(responseText.length / 4),
        totalTokens: Math.ceil((request.contextPrompt.length + responseText.length) / 4),
      },
    };
  }
}
