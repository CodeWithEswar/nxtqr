import type { IReliabilityAnalyzer, ReliabilityContext } from "../contracts/reliability.types";
import type { ReliabilityFinding } from "../schemas/reliability.schemas";

export class RetryAnalyzer implements IReliabilityAnalyzer {
  public readonly category = "retry";

  public analyze(context: ReliabilityContext): ReliabilityFinding[] {
    const findings: ReliabilityFinding[] = [];

    // 1. Evaluate node-level retry configurations
    for (const node of context.nodes) {
      const profile = context.nodeProfiles[node.id];
      if (!profile) continue;

      const raw = (node.data || {}) as Record<string, unknown>;
      const retries = profile.maxRetryAttempts;
      const retryEnabled = raw.retryEnabled === true || (retries !== null && retries > 0);

      // REL-RETRY-001: Excessive or Unbounded Retries
      if (retries !== null && retries > 5) {
        findings.push({
          id: `REL-RETRY-001-${node.id}`,
          ruleId: "REL-RETRY-001",
          category: "retry",
          severity: "high",
          classification: "potential-risk",
          title: `Excessive Retry Limit on "${node.label || node.id}" (${retries} attempts)`,
          explanation: `Component "${node.label || node.id}" is configured with ${retries} retry attempts. During downstream outages or brownouts, excessive retries amplify traffic by ${(retries + 1)}x, exhausting worker threads and turning transient hiccups into complete system collapse.`,
          affectedNodeIds: [node.id],
          affectedEdgeIds: (context.outgoingEdgesMap.get(node.id) || []).map((e) => e.id),
          evidence: [
            {
              kind: "property",
              elementId: node.id,
              propertyKey: "maxRetries",
              expectedValue: "<= 3",
              actualValue: retries,
              description: `Configured retry attempts is ${retries}, which exceeds the recommended 3 attempts.`,
            },
          ],
          assumptions: [
            "Downstream dependencies are vulnerable to request storming during degraded states.",
            "Retries are executed without a restrictive retry budget token bucket.",
          ],
          confidence: "high",
          propagationChain: [node.id],
          remediation: "Cap maximum retry attempts to 2 or 3 and introduce a retry budget (e.g. max 10% retried traffic).",
          remediationAction: "configure_backoff",
        });
      }

      // REL-RETRY-002: Fixed or Missing Exponential Backoff with Jitter
      if (retryEnabled) {
        const backoffType = String(raw.backoffType || raw.retryBackoff || "fixed").toLowerCase();
        const hasJitter = Boolean(raw.jitter || raw.jitterEnabled);

        if (backoffType === "immediate" || backoffType === "fixed" || !hasJitter) {
          findings.push({
            id: `REL-RETRY-002-${node.id}`,
            ruleId: "REL-RETRY-002",
            category: "retry",
            severity: "medium",
            classification: "configuration-gap",
            title: `Retry Storm Risk: Missing Exponential Backoff & Jitter on "${node.label || node.id}"`,
            explanation: `Component "${node.label || node.id}" uses ${backoffType} retry delay without full randomized jitter. When a shared dependency experiences a transient spike, synchronized retries from concurrent callers create cyclical thundering herd spikes.`,
            affectedNodeIds: [node.id],
            affectedEdgeIds: (context.outgoingEdgesMap.get(node.id) || []).map((e) => e.id),
            evidence: [
              {
                kind: "property",
                elementId: node.id,
                propertyKey: "backoffType",
                expectedValue: "exponential_with_full_jitter",
                actualValue: `${backoffType}${hasJitter ? " + jitter" : " without jitter"}`,
                description: "Missing exponential backoff with full randomized decorrelation jitter.",
              },
            ],
            assumptions: [
              "Concurrent requests fail simultaneously during downstream latency spikes.",
            ],
            confidence: "high",
            propagationChain: [node.id],
            remediation: "Configure truncated exponential backoff with full randomized jitter: delay = rand(0, min(maxBackoff, base * 2^attempt)).",
            remediationAction: "configure_backoff",
          });
        }
      }

      // REL-RETRY-004: Retrying Non-Idempotent Operations
      if (retryEnabled && !profile.isIdempotent) {
        const componentType = String(raw.componentType || node.type || "");
        const isMutating =
          raw.isMutating === true ||
          raw.isPaymentGateway === true ||
          componentType.includes("payment") ||
          componentType.includes("order") ||
          componentType.includes("checkout");

        if (isMutating && !raw.idempotencyKey) {
          findings.push({
            id: `REL-RETRY-004-${node.id}`,
            ruleId: "REL-RETRY-004",
            category: "retry",
            severity: "critical",
            classification: "modeled-conflict",
            title: `Non-Idempotent Mutation Retried on "${node.label || node.id}" Without Deduplication Key`,
            explanation: `Component "${node.label || node.id}" performs mutating state changes (orders/payments) and allows retries, but lacks a unique idempotency key mechanism. If a response is lost over the network after successful processing, a client retry will execute duplicate charges or duplicate state mutations.`,
            affectedNodeIds: [node.id],
            affectedEdgeIds: (context.incomingEdgesMap.get(node.id) || []).map((e) => e.id),
            evidence: [
              {
                kind: "property",
                elementId: node.id,
                propertyKey: "idempotencyKey",
                expectedValue: "required",
                actualValue: "unspecified",
                description: "Retries are permitted on mutating transaction without idempotency key.",
              },
            ],
            assumptions: [
              "Network timeouts can occur after the downstream server has already processed the mutation.",
            ],
            confidence: "high",
            propagationChain: [node.id],
            remediation: "Require an Idempotency-Key header on all mutating requests and cache previous responses in Redis/shared storage.",
            remediationAction: "enable_idempotency",
          });
        }
      }
    }

    // 2. REL-RETRY-003: Multi-tier Retry Amplification Chain Detection
    for (const edge of context.edges) {
      const sourceProfile = context.nodeProfiles[edge.source];
      const targetProfile = context.nodeProfiles[edge.target];
      if (!sourceProfile || !targetProfile) continue;

      const sourceRetries = sourceProfile.maxRetryAttempts ?? 0;
      const targetRetries = targetProfile.maxRetryAttempts ?? 0;

      if (sourceRetries > 0 && targetRetries > 0) {
        const worstCaseFactor = (sourceRetries + 1) * (targetRetries + 1);
        if (worstCaseFactor >= 9) {
          const sourceNode = context.nodeMap.get(edge.source);
          const targetNode = context.nodeMap.get(edge.target);
          findings.push({
            id: `REL-RETRY-003-${edge.id}`,
            ruleId: "REL-RETRY-003",
            category: "retry",
            severity: "high",
            classification: "potential-risk",
            title: `Multi-Tier Retry Amplification (${worstCaseFactor}x multiplier) between "${sourceNode?.label || edge.source}" and "${targetNode?.label || edge.target}"`,
            explanation: `Both caller "${sourceNode?.label || edge.source}" (${sourceRetries} retries) and callee "${targetNode?.label || edge.target}" (${targetRetries} retries) retry failed requests. Under worst-case failure conditions, a single user request can amplify into ${worstCaseFactor} downstream operations.`,
            affectedNodeIds: [edge.source, edge.target],
            affectedEdgeIds: [edge.id],
            evidence: [
              {
                kind: "edge",
                elementId: edge.id,
                propertyKey: "amplificationMultiplier",
                expectedValue: "< 6x",
                actualValue: `${worstCaseFactor}x`,
                description: `Caller retries (${sourceRetries}) multiply callee retries (${targetRetries}) to ${worstCaseFactor}x worst-case operations.`,
              },
            ],
            assumptions: [
              "Retry limits are executed independently without centralized retry token coordination.",
            ],
            confidence: "high",
            propagationChain: [edge.source, edge.target],
            remediation: "Assign retry ownership to a single tier (e.g. edge ingress or backend worker, never both) or use a token-bucket retry budget.",
            remediationAction: "configure_backoff",
          });
        }
      }
    }

    return findings;
  }
}

