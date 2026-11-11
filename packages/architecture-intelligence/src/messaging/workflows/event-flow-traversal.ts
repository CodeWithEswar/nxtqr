/**
 * Architecture Messaging Intelligence — Event Flow Traversal
 *
 * Performs cycle-safe multi-hop traversal of event topologies from producers
 * through destinations, consumers, dead-letter queues, and downstream emissions.
 * Includes path explosion limits and cyclic loop detection.
 */

import {
  MessagingTopology,
  MessagingDestination,
  MessagingProducer,
  MessagingConsumer,
  EventFlowTrace,
  EventFlowPathNode,
  MessagingFinding,
} from "../contracts/messaging.types";

export interface EventFlowTraversalOptions {
  maxDepth?: number;
  maxPaths?: number;
}

export interface EventFlowTraversalResult {
  traces: EventFlowTrace[];
  findings: MessagingFinding[];
}

export class EventFlowTraversal {
  private readonly defaultMaxDepth = 8;
  private readonly defaultMaxPaths = 50;

  public traverse(
    topology: MessagingTopology,
    options?: EventFlowTraversalOptions
  ): EventFlowTraversalResult {
    const maxDepth = options?.maxDepth ?? this.defaultMaxDepth;
    const maxPaths = options?.maxPaths ?? this.defaultMaxPaths;

    const traces: EventFlowTrace[] = [];
    const findings: MessagingFinding[] = [];

    const destinationMap = new Map<string, MessagingDestination>(
      topology.destinations.map((d) => [d.id, d])
    );
    const consumersByDest = new Map<string, MessagingConsumer[]>();
    for (const consumer of topology.consumers) {
      const list = consumersByDest.get(consumer.destinationId) || [];
      list.push(consumer);
      consumersByDest.set(consumer.destinationId, list);
    }

    // Map serviceId -> producers (for follow-up event publication)
    const producersByService = new Map<string, MessagingProducer[]>();
    for (const producer of topology.producers) {
      const list = producersByService.get(producer.serviceId) || [];
      list.push(producer);
      producersByService.set(producer.serviceId, list);
    }

    // For each root producer
    for (const producer of topology.producers) {
      if (traces.length >= maxPaths) break;

      const destination = destinationMap.get(producer.destinationId);
      if (!destination) continue;

      const rootEvents =
        producer.eventTypesPublished && producer.eventTypesPublished.length > 0
          ? producer.eventTypesPublished
          : ["*"];

      for (const eventType of rootEvents) {
        if (traces.length >= maxPaths) break;

        const visitedBranch = new Set<string>();
        visitedBranch.add(`producer:${producer.id}`);
        visitedBranch.add(`dest:${destination.id}`);

        const initialPath: EventFlowPathNode[] = [
          {
            type: "producer",
            id: producer.id,
            name: `Producer (${producer.serviceId})`,
            serviceId: producer.serviceId,
            status: "healthy",
          },
          {
            type: "destination",
            id: destination.id,
            name: destination.name,
            status: "healthy",
          },
        ];

        const deadLetterPaths: EventFlowPathNode[][] = [];
        if (destination.deadLetterDestinationId) {
          const dlq = destinationMap.get(destination.deadLetterDestinationId);
          if (dlq) {
            deadLetterPaths.push([
              ...initialPath,
              {
                type: "dead_letter",
                id: dlq.id,
                name: `DLQ: ${dlq.name}`,
                status: "dead_letter",
              },
            ]);
          }
        }

        const consumersReached = new Set<string>();
        const downstreamEventsEmitted = new Set<string>();
        let hasCyclicDependency = false;

        // Traverse downstream from destination
        this.traverseHop(
          destination.id,
          1,
          maxDepth,
          visitedBranch,
          destinationMap,
          consumersByDest,
          producersByService,
          consumersReached,
          downstreamEventsEmitted,
          initialPath,
          (cyclicNodeId) => {
            hasCyclicDependency = true;
            findings.push({
              id: `cycle-detected-${producer.id}-${cyclicNodeId}`,
              category: "cyclic_event_loop",
              severity: "high",
              affectedProducerId: producer.id,
              affectedDestinationId: destination.id,
              title: `Cyclic Event Loop Detected in Flow from ${producer.serviceId}`,
              explanation: `An event flow originating from "${producer.serviceId}" via "${destination.name}" triggers a cyclical loop returning to node "${cyclicNodeId}". Without explicit loop-breaking headers or deduplication, this causes runaway event cascades.`,
              evidence: [
                `Root event type: ${eventType}`,
                `Cyclic node: ${cyclicNodeId}`,
                `Max depth reached: ${maxDepth}`,
              ],
              riskAnalysis:
                "Unbounded message loop, broker disk saturation, infinite compute expenditure, and system-wide cascading failure.",
              remediation:
                "Introduce event correlation causation IDs to reject self-generated loops or break cyclic choreography with a dedicated state orchestrator.",
            });
          }
        );

        traces.push({
          id: `trace-${producer.id}-${destination.id}-${eventType}`,
          rootEventType: eventType,
          producerId: producer.id,
          producerName: producer.serviceId,
          destinationId: destination.id,
          destinationName: destination.name,
          flowDepth: initialPath.length,
          path: initialPath,
          deadLetterPaths,
          consumersReachedCount: consumersReached.size,
          downstreamEventsEmitted: Array.from(downstreamEventsEmitted),
          hasCyclicDependency,
        });
      }
    }

    return { traces, findings };
  }

  private traverseHop(
    currentDestId: string,
    currentDepth: number,
    maxDepth: number,
    visitedBranch: Set<string>,
    destinationMap: Map<string, MessagingDestination>,
    consumersByDest: Map<string, MessagingConsumer[]>,
    producersByService: Map<string, MessagingProducer[]>,
    consumersReached: Set<string>,
    downstreamEventsEmitted: Set<string>,
    pathBuilder: EventFlowPathNode[],
    onCycle: (cyclicNodeId: string) => void
  ): void {
    if (currentDepth >= maxDepth) return;

    const consumers = consumersByDest.get(currentDestId) || [];
    for (const consumer of consumers) {
      consumersReached.add(consumer.id);
      const consumerKey = `consumer:${consumer.id}`;

      if (visitedBranch.has(consumerKey)) {
        onCycle(consumer.serviceId);
        continue;
      }

      visitedBranch.add(consumerKey);

      pathBuilder.push({
        type: "consumer",
        id: consumer.id,
        name: `Consumer (${consumer.serviceId})`,
        serviceId: consumer.serviceId,
        status: consumer.hasSideEffects && !consumer.idempotency.isConfigured ? "hazard" : "healthy",
      });

      // Does this consumer service also act as a producer of downstream events?
      const downstreamProducers = producersByService.get(consumer.serviceId) || [];
      for (const nextProducer of downstreamProducers) {
        if (nextProducer.destinationId === currentDestId) {
          // Immediate loopback
          onCycle(nextProducer.serviceId);
          continue;
        }

        const nextDest = destinationMap.get(nextProducer.destinationId);
        if (!nextDest) continue;

        const nextDestKey = `dest:${nextDest.id}`;
        if (visitedBranch.has(nextDestKey)) {
          onCycle(nextDest.name);
          continue;
        }

        visitedBranch.add(nextDestKey);
        for (const evt of nextProducer.eventTypesPublished || []) {
          downstreamEventsEmitted.add(evt);
        }

        pathBuilder.push({
          type: "follow_up_event",
          id: nextProducer.id,
          name: `Publishes -> ${nextDest.name}`,
          serviceId: consumer.serviceId,
          status: "healthy",
        });

        // Recurse next hop
        this.traverseHop(
          nextDest.id,
          currentDepth + 1,
          maxDepth,
          new Set(visitedBranch),
          destinationMap,
          consumersByDest,
          producersByService,
          consumersReached,
          downstreamEventsEmitted,
          pathBuilder,
          onCycle
        );
      }
    }
  }
}
