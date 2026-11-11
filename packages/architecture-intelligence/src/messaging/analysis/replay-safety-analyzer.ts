/**
 * Architecture Messaging Intelligence — Replay Safety Analyzer
 *
 * Analyzes event streams and consumers for historical replay safety,
 * identifying hazardous external side-effects (duplicate billing, duplicate notifications,
 * external webhooks, inventory mutations) and stale state overwrites.
 */

import {
  MessagingTopology,
  MessagingDestination,
  MessagingConsumer,
  ReplaySafetyEvaluation,
  MessagingFinding,
} from "../contracts/messaging.types";

export interface ReplaySafetyAnalysisResult {
  evaluations: ReplaySafetyEvaluation[];
  findings: MessagingFinding[];
}

export class ReplaySafetyAnalyzer {
  public analyze(topology: MessagingTopology): ReplaySafetyAnalysisResult {
    const evaluations: ReplaySafetyEvaluation[] = [];
    const findings: MessagingFinding[] = [];

    const destinationMap = new Map<string, MessagingDestination>(
      topology.destinations.map((d) => [d.id, d])
    );

    for (const consumer of topology.consumers) {
      const destination = destinationMap.get(consumer.destinationId);
      if (!destination) continue;

      const evalResult = this.evaluateConsumer(destination, consumer);
      evaluations.push(evalResult.evaluation);
      findings.push(...evalResult.findings);
    }

    return { evaluations, findings };
  }

  private evaluateConsumer(
    destination: MessagingDestination,
    consumer: MessagingConsumer
  ): { evaluation: ReplaySafetyEvaluation; findings: MessagingFinding[] } {
    const hazards: ReplaySafetyEvaluation["hazards"] = [];
    const requiredSafeguards: string[] = [];
    const findings: MessagingFinding[] = [];

    const hasIdempotency =
      consumer.idempotency.isConfigured &&
      consumer.idempotency.deduplicationStore !== "none" &&
      consumer.idempotency.deduplicationStore !== "in_memory";

    // 1. Side Effect Hazards Analysis
    if (consumer.hasSideEffects && consumer.sideEffectTypes && consumer.sideEffectTypes.length > 0) {
      for (const sideEffect of consumer.sideEffectTypes) {
        if (sideEffect === "payment_charge") {
          hazards.push({
            type: "duplicate_payments",
            severity: "critical",
            description: `Consumer ${consumer.serviceId} triggers payment charges. Replaying events on destination "${destination.name}" without transactional deduplication risks duplicate financial transactions.`,
          });
          requiredSafeguards.push(
            "Persistent unique payment transaction ID with payment gateway idempotency keys",
            "Deduplication table check with SERIALIZABLE transaction isolation"
          );

          if (!hasIdempotency) {
            findings.push({
              id: `replay-hazard-payment-${consumer.id}`,
              category: "replay_side_effect_hazard",
              severity: "critical",
              affectedDestinationId: destination.id,
              affectedConsumerId: consumer.id,
              title: `Critical Replay Hazard: Duplicate Payment Charges on ${destination.name}`,
              explanation: `Consumer "${consumer.serviceId}" triggers financial payment charges but does not configure persistent durable idempotency (deduplication store: "${consumer.idempotency.deduplicationStore}"). Replaying historical events will trigger multiple unauthorized charges against end users.`,
              evidence: [
                `Side-effect configured: payment_charge`,
                `Idempotency configured: ${consumer.idempotency.isConfigured}`,
                `Deduplication store: ${consumer.idempotency.deduplicationStore}`,
              ],
              riskAnalysis:
                "Financial loss, severe user trust degradation, chargeback penalties, and potential regulatory non-compliance.",
              remediation:
                "Configure persistent deduplication store ('database_table' or 'redis') with multi-day deduplication window and pass client-generated idempotency keys to payment gateways.",
            });
          }
        } else if (sideEffect === "email_sms_notification") {
          hazards.push({
            type: "unbounded_notifications",
            severity: "medium",
            description: `Consumer ${consumer.serviceId} dispatches emails/SMS. Replay could spam users with historical notifications.`,
          });
          requiredSafeguards.push(
            "Replay filter flag on notification dispatcher",
            "Event timestamp freshness check (drop if event age > 1 hour during replay)"
          );

          if (!hasIdempotency) {
            findings.push({
              id: `replay-hazard-notification-${consumer.id}`,
              category: "replay_side_effect_hazard",
              severity: "medium",
              affectedDestinationId: destination.id,
              affectedConsumerId: consumer.id,
              title: `Replay Alert: Duplicate User Notifications from ${destination.name}`,
              explanation: `Consumer "${consumer.serviceId}" sends emails/SMS notifications without durable idempotency. Replaying events will send duplicate or outdated messages to users.`,
              evidence: [
                `Side-effect configured: email_sms_notification`,
                `Idempotency store: ${consumer.idempotency.deduplicationStore}`,
              ],
              riskAnalysis:
                "User confusion, spam complaints, and unnecessary third-party messaging provider costs.",
              remediation:
                "Check event age prior to dispatching notifications and introduce replay-mode bypass headers.",
            });
          }
        } else if (sideEffect === "external_webhook") {
          hazards.push({
            type: "duplicate_external_api",
            severity: "high",
            description: `Consumer ${consumer.serviceId} invokes third-party partner webhooks. Replay may bombard external partners with duplicate webhooks.`,
          });
          requiredSafeguards.push(
            "Webhook event delivery deduplication records",
            "Outbox replay suppress flag"
          );

          findings.push({
            id: `replay-hazard-webhook-${consumer.id}`,
            category: "replay_side_effect_hazard",
            severity: "high",
            affectedDestinationId: destination.id,
            affectedConsumerId: consumer.id,
            title: `External Webhook Replay Hazard on ${consumer.serviceId}`,
            explanation: `Consumer "${consumer.serviceId}" invokes external third-party webhooks upon consuming from "${destination.name}". Replaying stream messages may trigger unintended duplicate API calls to partner endpoints.`,
            evidence: [
              `Side-effect configured: external_webhook`,
              `Destination: ${destination.name}`,
            ],
            riskAnalysis:
              "Partner rate-limit throttling, duplicate order processing in external vendor systems, and webhook partner SLA breach.",
            remediation:
              "Require webhook event deduplication IDs and provide an explicit replay suppression toggle for external webhook dispatchers.",
          });
        } else if (sideEffect === "inventory_mutation") {
          hazards.push({
            type: "stale_state_override",
            severity: "high",
            description: `Consumer ${consumer.serviceId} mutates inventory counts. Replaying historical inventory allocations will corrupt warehouse stock levels.`,
          });
          requiredSafeguards.push(
            "Optimistic locking / version checks on inventory rows",
            "Delta mutation ledger instead of absolute counter updates"
          );
        }
      }
    }

    // 2. Stale State Override Analysis
    // If the consumer lacks inbox deduplication or idempotency, replaying older events
    // can write stale values over newer state
    if (!hasIdempotency && !consumer.usesInboxDeduplication) {
      hazards.push({
        type: "stale_state_override",
        severity: "medium",
        description: `Consumer ${consumer.serviceId} lacks inbox deduplication. Out-of-order replay can overwrite current entity state with obsolete historical records.`,
      });
      requiredSafeguards.push(
        "Entity revision number or monotonically increasing updated_at timestamp guard"
      );
    }

    const isSafeForReplay = hazards.length === 0;

    const evaluation: ReplaySafetyEvaluation = {
      destinationId: destination.id,
      consumerId: consumer.id,
      isSafeForReplay,
      hazards,
      requiredSafeguards,
    };

    return { evaluation, findings };
  }
}
