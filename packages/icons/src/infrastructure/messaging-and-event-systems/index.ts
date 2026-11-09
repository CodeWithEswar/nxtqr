export * from "./message-queue-icon";
export * from "./message-broker-icon";
export * from "./event-bus-icon";
export * from "./pub-sub-topic-icon";
export * from "./event-stream-icon";
export * from "./kafka-broker-icon";
export * from "./rabbitmq-broker-icon";
export * from "./dead-letter-queue-icon";
export * from "./retry-queue-icon";
export * from "./event-consumer-icon";
export * from "./event-producer-icon";
export * from "./webhook-dispatcher-icon";
export * from "./stream-processor-icon";
export * from "./event-store-icon";

import type { InfrastructureIconComponent } from "../types";
import { MessageQueueIcon } from "./message-queue-icon";
import { MessageBrokerIcon } from "./message-broker-icon";
import { EventBusIcon } from "./event-bus-icon";
import { PubSubTopicIcon } from "./pub-sub-topic-icon";
import { EventStreamIcon } from "./event-stream-icon";
import { KafkaBrokerIcon } from "./kafka-broker-icon";
import { RabbitmqBrokerIcon } from "./rabbitmq-broker-icon";
import { DeadLetterQueueIcon } from "./dead-letter-queue-icon";
import { RetryQueueIcon } from "./retry-queue-icon";
import { EventConsumerIcon } from "./event-consumer-icon";
import { EventProducerIcon } from "./event-producer-icon";
import { WebhookDispatcherIcon } from "./webhook-dispatcher-icon";
import { StreamProcessorIcon } from "./stream-processor-icon";
import { EventStoreIcon } from "./event-store-icon";

export {
  MessageQueueIcon,
  MessageBrokerIcon,
  EventBusIcon,
  PubSubTopicIcon,
  EventStreamIcon,
  KafkaBrokerIcon,
  RabbitmqBrokerIcon,
  DeadLetterQueueIcon,
  RetryQueueIcon,
  EventConsumerIcon,
  EventProducerIcon,
  WebhookDispatcherIcon,
  StreamProcessorIcon,
  EventStoreIcon,
};

export const messagingAndEventSystemsIconRegistry: Record<string, InfrastructureIconComponent> = {
  "message-queue": MessageQueueIcon,
  "message-broker": MessageBrokerIcon,
  "event-bus": EventBusIcon,
  "pub-sub-topic": PubSubTopicIcon,
  "event-stream": EventStreamIcon,
  "kafka-broker": KafkaBrokerIcon,
  "rabbitmq-broker": RabbitmqBrokerIcon,
  "dead-letter-queue": DeadLetterQueueIcon,
  "retry-queue": RetryQueueIcon,
  "event-consumer": EventConsumerIcon,
  "event-producer": EventProducerIcon,
  "webhook-dispatcher": WebhookDispatcherIcon,
  "stream-processor": StreamProcessorIcon,
  "event-store": EventStoreIcon,
};

export function getMessagingAndEventSystemsInfrastructureIcon(
  componentId: string
): InfrastructureIconComponent | null {
  return messagingAndEventSystemsIconRegistry[componentId] || null;
}
