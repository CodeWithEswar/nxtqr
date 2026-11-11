/**
 * Architecture Messaging Intelligence — Engine Facade
 *
 * Master orchestrator for distributed messaging analysis.
 * Integrates broker capabilities, delivery semantics, retry storms,
 * idempotency, partition ordering, backpressure, replay safety,
 * pub/sub fan-out, event flow tracing, and Saga workflows.
 */

import {
  MessagingTopology,
  MessagingFinding,
  RetryStormEvaluation,
  QueueBacklogProjection,
  ReplaySafetyEvaluation,
  EventFlowTrace,
  SagaWorkflow,
  BrokerCapabilities,
  MessagingFindingSeverity,
} from "../contracts/messaging.types";
import { MessagingTopologySchema } from "../schemas/messaging.schemas";
import { BrokerCapabilityRegistry } from "../providers/capability-registry";
import { DeliverySemanticsAnalyzer } from "../analysis/delivery-semantics-analyzer";
import { RetryAmplificationAnalyzer } from "../analysis/retry-amplification-analyzer";
import { MessagingIdempotencyAnalyzer } from "../analysis/idempotency-analyzer";
import { OrderingPartitionAnalyzer } from "../analysis/ordering-partition-analyzer";
import { BackpressureQueueAnalyzer } from "../analysis/backpressure-queue-analyzer";
import { ReplaySafetyAnalyzer } from "../analysis/replay-safety-analyzer";
import { FanoutAnalyzer } from "../analysis/fanout-analyzer";
import { EventFlowTraversal } from "../workflows/event-flow-traversal";
import { SagaWorkflowAnalyzer } from "../workflows/saga-workflow-analyzer";

export interface MessagingAnalysisSummary {
  brokerCount: number;
  destinationCount: number;
  producerCount: number;
  consumerCount: number;
  consumerGroupCount: number;
  sagaCount: number;
  findingsCount: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    total: number;
  };
  stormRiskDestinationsCount: number;
  unboundedGrowthDestinationsCount: number;
  atLeastOnceWithNoIdempotencyCount: number;
  uncompensatedSagasCount: number;
  replayHazardCount: number;
}

export interface MessagingAnalysisOutput {
  topology: MessagingTopology;
  summary: MessagingAnalysisSummary;
  findings: MessagingFinding[];
  brokerCapabilities: Record<string, BrokerCapabilities>;
  retryStormEvaluations: RetryStormEvaluation[];
  queueBacklogProjections: QueueBacklogProjection[];
  replaySafetyEvaluations: ReplaySafetyEvaluation[];
  fanoutRatios: Record<string, number>;
  eventFlowTraces: EventFlowTrace[];
  sagas: SagaWorkflow[];
}

export class ArchitectureMessagingEngine {
  private readonly capabilityRegistry = new BrokerCapabilityRegistry();
  private readonly replaySafetyAnalyzer = new ReplaySafetyAnalyzer();
  private readonly fanoutAnalyzer = new FanoutAnalyzer();
  private readonly eventFlowTraversal = new EventFlowTraversal();
  private readonly sagaWorkflowAnalyzer = new SagaWorkflowAnalyzer();

  public analyzeTopology(rawTopology: MessagingTopology): MessagingAnalysisOutput {
    // 1. Validate Topology Schema
    const topology = MessagingTopologySchema.parse(rawTopology);

    const allFindings: MessagingFinding[] = [];

    // 2. Broker Capabilities
    const brokerCapabilities: Record<string, BrokerCapabilities> = {};
    for (const broker of topology.brokers) {
      brokerCapabilities[broker.id] = this.capabilityRegistry.resolveCapabilities(broker);
    }

    // 3. Delivery Semantics Analysis
    const deliveryFindings = DeliverySemanticsAnalyzer.analyze(
      topology.destinations,
      topology.consumers,
      topology.producers,
      topology.brokers
    );
    allFindings.push(...deliveryFindings);

    // 4. Retry Amplification & Storm Analysis
    const { evaluations: retryStormEvaluations, findings: retryFindings } =
      RetryAmplificationAnalyzer.analyze(
        topology.destinations,
        topology.consumers,
        topology.producers
      );
    allFindings.push(...retryFindings);

    // 5. Idempotency & Deduplication Analysis
    const idempotencyFindings = MessagingIdempotencyAnalyzer.analyze(
      topology.destinations,
      topology.consumers,
      topology.producers
    );
    allFindings.push(...idempotencyFindings);

    // 6. Ordering & Partitioning Analysis
    const orderingFindings = OrderingPartitionAnalyzer.analyze(
      topology.destinations,
      topology.consumerGroups
    );
    allFindings.push(...orderingFindings);

    // 7. Backpressure & Queue Backlog Analysis
    const { projections: queueBacklogProjections, findings: backlogFindings } =
      BackpressureQueueAnalyzer.analyze(
        topology.destinations,
        topology.consumers,
        topology.producers,
        topology.consumerGroups
      );
    allFindings.push(...backlogFindings);

    // 8. Replay Safety Analysis
    const { evaluations: replaySafetyEvaluations, findings: replayFindings } =
      this.replaySafetyAnalyzer.analyze(topology);
    allFindings.push(...replayFindings);

    // 9. Fanout & Competing Consumers Analysis
    const { findings: fanoutFindings, fanoutRatios } = this.fanoutAnalyzer.analyze(topology);
    allFindings.push(...fanoutFindings);

    // 10. Event Flow Traversal
    const { traces: eventFlowTraces, findings: flowFindings } =
      this.eventFlowTraversal.traverse(topology);
    allFindings.push(...flowFindings);

    // 11. Saga Workflow Analysis
    const { analyzedSagas, findings: sagaFindings } = this.sagaWorkflowAnalyzer.analyze(topology);
    allFindings.push(...sagaFindings);

    // Deduplicate findings by ID & sort by severity
    const uniqueFindingsMap = new Map<string, MessagingFinding>();
    for (const finding of allFindings) {
      if (!uniqueFindingsMap.has(finding.id)) {
        uniqueFindingsMap.set(finding.id, finding);
      }
    }

    const severityWeight: Record<MessagingFindingSeverity, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
      info: 0,
    };

    const sortedFindings = Array.from(uniqueFindingsMap.values()).sort(
      (a, b) => severityWeight[b.severity] - severityWeight[a.severity]
    );

    // Compute Summary Metrics
    const findingsCount = {
      critical: sortedFindings.filter((f) => f.severity === "critical").length,
      high: sortedFindings.filter((f) => f.severity === "high").length,
      medium: sortedFindings.filter((f) => f.severity === "medium").length,
      low: sortedFindings.filter((f) => f.severity === "low").length,
      info: sortedFindings.filter((f) => f.severity === "info").length,
      total: sortedFindings.length,
    };

    const stormRiskDestinationsCount = retryStormEvaluations.filter(
      (e: RetryStormEvaluation) => e.isStormRisk
    ).length;
    const unboundedGrowthDestinationsCount = queueBacklogProjections.filter(
      (p: QueueBacklogProjection) => p.isUnboundedGrowth
    ).length;

    const atLeastOnceWithNoIdempotencyCount = topology.consumers.filter(
      (c) => c.hasSideEffects && !c.idempotency.isConfigured
    ).length;

    const uncompensatedSagasCount = analyzedSagas.filter(
      (s) => !s.consistencyAnalysis.isFullyCompensated
    ).length;

    const replayHazardCount = replaySafetyEvaluations.filter((r) => !r.isSafeForReplay).length;

    const summary: MessagingAnalysisSummary = {
      brokerCount: topology.brokers.length,
      destinationCount: topology.destinations.length,
      producerCount: topology.producers.length,
      consumerCount: topology.consumers.length,
      consumerGroupCount: topology.consumerGroups.length,
      sagaCount: analyzedSagas.length,
      findingsCount,
      stormRiskDestinationsCount,
      unboundedGrowthDestinationsCount,
      atLeastOnceWithNoIdempotencyCount,
      uncompensatedSagasCount,
      replayHazardCount,
    };

    return {
      topology: {
        ...topology,
        sagas: analyzedSagas,
      },
      summary,
      findings: sortedFindings,
      brokerCapabilities,
      retryStormEvaluations,
      queueBacklogProjections,
      replaySafetyEvaluations,
      fanoutRatios,
      eventFlowTraces,
      sagas: analyzedSagas,
    };
  }

  public getCapabilityRegistry(): BrokerCapabilityRegistry {
    return this.capabilityRegistry;
  }
}

export const architectureMessagingEngine = new ArchitectureMessagingEngine();
