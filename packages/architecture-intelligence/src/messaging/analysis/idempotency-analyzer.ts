/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Idempotency, Deduplication & Transactional Outbox Analyzer
 */

import type {
  MessagingDestination,
  MessagingConsumer,
  MessagingProducer,
  MessagingFinding,
} from "../contracts/messaging.types";

export class MessagingIdempotencyAnalyzer {
  public static analyze(
    destinations: MessagingDestination[],
    consumers: MessagingConsumer[],
    producers: MessagingProducer[]
  ): MessagingFinding[] {
    const findings: MessagingFinding[] = [];
    const destMap = new Map(destinations.map((d) => [d.id, d]));

    // 1. Evaluate Side Effects without Idempotency on At-Least-Once Delivery
    for (const consumer of consumers) {
      const dest = destMap.get(consumer.destinationId);
      const isAtLeastOnce = !dest || dest.deliverySemantics === "at_least_once";

      if (isAtLeastOnce && consumer.hasSideEffects && !consumer.idempotency.isConfigured) {
        findings.push({
          id: `finding-idempotency-gap-${consumer.id}`,
          category: "missing_idempotency",
          severity: "critical",
          affectedConsumerId: consumer.id,
          affectedDestinationId: consumer.destinationId,
          title: `Missing Idempotency Protection for Side Effects on ${consumer.serviceId}`,
          explanation: `Consumer "${consumer.serviceId}" processes messages from at-least-once destination "${dest?.name || consumer.destinationId}" and performs critical side-effects (${consumer.sideEffectTypes?.join(", ") || "external mutations"}), but has no idempotency or deduplication configured.`,
          evidence: [
            `Consumer: ${consumer.serviceId}`,
            `Destination Delivery Semantics: ${dest?.deliverySemantics || "at_least_once"}`,
            `Side Effect Types: ${consumer.sideEffectTypes?.join(", ") || "unspecified"}`,
            `Idempotency Configured: false`,
          ],
          riskAnalysis: `Network retransmissions, broker partition rebalances, worker restarts, or consumer timeouts will deliver identical messages more than once, leading to duplicate financial charges, duplicate customer notifications, or corrupted inventory counts.`,
          remediation: `Implement deterministic message deduplication using an idempotency key (e.g. event ID or business correlation ID) stored in a persistent store or database inbox table before executing side effects.`,
        });
      }

      // 2. Evaluate In-Memory Deduplication Fragility
      if (
        consumer.idempotency.isConfigured &&
        consumer.idempotency.deduplicationStore === "in_memory" &&
        consumer.workerConcurrency > 1
      ) {
        findings.push({
          id: `finding-in-memory-dedup-${consumer.id}`,
          category: "missing_idempotency",
          severity: "high",
          affectedConsumerId: consumer.id,
          affectedDestinationId: consumer.destinationId,
          title: `Fragile In-Memory Deduplication Store on ${consumer.serviceId}`,
          explanation: `Consumer "${consumer.serviceId}" uses an 'in_memory' deduplication store with ${consumer.workerConcurrency} concurrent workers. In-memory keys are not shared across distributed worker instances and are wiped on process restart.`,
          evidence: [
            `deduplicationStore: in_memory`,
            `workerConcurrency: ${consumer.workerConcurrency}`,
            `scope: ${consumer.idempotency.scope}`,
          ],
          riskAnalysis: `If a duplicate message is received by a different worker instance or after a pod restart, the in-memory check succeeds and the duplicate message is processed again.`,
          remediation: `Switch deduplication store to a distributed key-value store (e.g. Redis with TTL) or a relational database unique constraint index on the idempotency key.`,
        });
      }
    }

    // 3. Evaluate Transactional Outbox Pattern on Producers
    for (const producer of producers) {
      if (!producer.usesTransactionalOutbox && producer.deliveryGuarantee !== "two_phase_commit") {
        const dest = destMap.get(producer.destinationId);

        findings.push({
          id: `finding-outbox-gap-${producer.id}`,
          category: "outbox_dual_write_gap",
          severity: "high",
          affectedProducerId: producer.id,
          affectedDestinationId: producer.destinationId,
          title: `Dual-Write Vulnerability on Producer ${producer.serviceId}`,
          explanation: `Producer service "${producer.serviceId}" publishes events to "${dest?.name || producer.destinationId}" without a Transactional Outbox pattern or atomic two-phase commit.`,
          evidence: [
            `Producer: ${producer.serviceId}`,
            `Destination: ${dest?.name || producer.destinationId}`,
            `usesTransactionalOutbox: false`,
            `deliveryGuarantee: ${producer.deliveryGuarantee}`,
          ],
          riskAnalysis: `Updating a local business database and then directly publishing to an external message broker constitutes an unsafe dual-write. If the database commits but the network or broker fails during publish, the event is permanently lost, causing inconsistent downstream state.`,
          remediation: `Implement the Transactional Outbox pattern: write the event to an 'outbox' table within the same local database transaction as the business entity update, then use a reliable CDC / publisher process to push outbox records to the broker.`,
        });
      }
    }

    return findings;
  }
}
