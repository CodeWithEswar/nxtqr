/**
 * NXTQR — Phase 05.3.21: Architecture Event-Driven Systems & Distributed Messaging Intelligence Engine
 * Delivery Semantics & Acknowledgment Analyzer
 */

import type {
  MessagingDestination,
  MessagingConsumer,
  MessagingProducer,
  MessagingBroker,
  MessagingFinding,
} from "../contracts/messaging.types";
import { brokerCapabilityRegistry } from "../providers/capability-registry";

export class DeliverySemanticsAnalyzer {
  public static analyze(
    destinations: MessagingDestination[],
    consumers: MessagingConsumer[],
    _producers: MessagingProducer[],
    brokers: MessagingBroker[]
  ): MessagingFinding[] {
    const findings: MessagingFinding[] = [];
    const brokerMap = new Map(brokers.map((b) => [b.id, b]));
    const destMap = new Map(destinations.map((d) => [d.id, d]));

    // 1. Analyze Auto-Acknowledgment Message Loss Hazard
    for (const consumer of consumers) {
      if (consumer.ackMode === "auto") {
        const dest = destMap.get(consumer.destinationId);
        findings.push({
          id: `finding-auto-ack-${consumer.id}`,
          category: "poison_message_risk",
          severity: "high",
          affectedConsumerId: consumer.id,
          affectedDestinationId: consumer.destinationId,
          title: `Auto-Acknowledgment Message Loss Risk on ${consumer.serviceId}`,
          explanation: `Consumer service "${consumer.serviceId}" uses automatic acknowledgment ('auto') on destination "${dest?.name || consumer.destinationId}". Messages are acknowledged immediately upon receipt before processing completes.`,
          evidence: [
            `Consumer ID: ${consumer.id}`,
            `ackMode: auto`,
            `Destination: ${dest?.name || consumer.destinationId}`,
            `Delivery Semantics: ${dest?.deliverySemantics || "unknown"}`,
          ],
          riskAnalysis: `If the consumer worker crashes, runs out of memory, or encounters a fatal exception during processing, the message is permanently lost from the queue with zero opportunity for retry or dead-letter routing.`,
          remediation: `Switch to explicit acknowledgment ('explicit' or 'visibility_timeout') where the consumer acknowledges the broker only after successful business processing or commits offsets safely.`,
        });
      }
    }

    // 2. Analyze Poison Message Head-of-Line Blocking (Missing or Unbounded DLQ)
    for (const dest of destinations) {
      const destConsumers = consumers.filter((c) => c.destinationId === dest.id);

      for (const consumer of destConsumers) {
        const hasDlq = Boolean(dest.deadLetterDestinationId || consumer.retryPolicy.retryDestinationId);
        const maxAttempts = dest.maxDeliveryAttemptsBeforeDeadLetter || consumer.retryPolicy.maxAttempts;

        if (!hasDlq && maxAttempts > 10) {
          findings.push({
            id: `finding-poison-blocking-${dest.id}-${consumer.id}`,
            category: "poison_message_risk",
            severity: "critical",
            affectedDestinationId: dest.id,
            affectedConsumerId: consumer.id,
            title: `Poison Message Infinite Loop Risk on ${dest.name}`,
            explanation: `Destination "${dest.name}" has no Dead-Letter Queue (DLQ) configured, and consumer "${consumer.serviceId}" allows high retry attempts (${maxAttempts}).`,
            evidence: [
              `Destination: ${dest.name} (${dest.type})`,
              `Dead-Letter Destination: none`,
              `Max Attempts: ${maxAttempts}`,
              `Backoff: ${consumer.retryPolicy.backoffStrategy}`,
            ],
            riskAnalysis: `A malformed payload or unrecoverable error will cause repeated failures, consuming worker capacity and blocking healthy subsequent messages from being processed (head-of-line blocking).`,
            remediation: `Configure a dedicated Dead-Letter Queue with maxDeliveryAttempts between 3 and 5, and alert on non-empty DLQ depth.`,
          });
        }
      }
    }

    // 3. Analyze Broker Capabilities vs Configured Semantics
    for (const dest of destinations) {
      const broker = brokerMap.get(dest.brokerId);
      if (!broker) continue;

      const caps = brokerCapabilityRegistry.getCapabilities(broker.technology, broker.provenance.source);

      // SQS / RabbitMQ with topic expectations or Kafka with queue expectations
      if (dest.type === "queue" && !caps.supportsQueueDelivery) {
        findings.push({
          id: `finding-broker-capability-mismatch-${dest.id}`,
          category: "broker_single_point_of_failure",
          severity: "high",
          affectedBrokerId: broker.id,
          affectedDestinationId: dest.id,
          title: `Broker Capability Mismatch: Queue Mode on ${broker.technology}`,
          explanation: `Destination "${dest.name}" is modeled as a Point-to-Point Queue, but broker technology "${broker.technology}" is primarily a distributed log/stream platform without native queue visibility-timeout semantics.`,
          evidence: [
            `Broker: ${broker.name} (${broker.technology})`,
            `Destination Type: ${dest.type}`,
            `supportsQueueDelivery: false`,
          ],
          riskAnalysis: `Assuming queue semantics (like message-level acknowledgment and immediate individual redelivery) on partition-based stream brokers leads to architectural impedance mismatches.`,
          remediation: `Model as a Partitioned Topic with consumer groups, or introduce a message broker supporting native queue semantics (e.g. RabbitMQ, SQS, or Service Bus).`,
        });
      }
    }

    return findings;
  }
}
