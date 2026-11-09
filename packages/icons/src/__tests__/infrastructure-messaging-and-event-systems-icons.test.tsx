import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
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
  messagingAndEventSystemsIconRegistry,
  getMessagingAndEventSystemsInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_07_ICONS = [
  { slug: "message-queue", name: "MessageQueueIcon", Component: MessageQueueIcon },
  { slug: "message-broker", name: "MessageBrokerIcon", Component: MessageBrokerIcon },
  { slug: "event-bus", name: "EventBusIcon", Component: EventBusIcon },
  { slug: "pub-sub-topic", name: "PubSubTopicIcon", Component: PubSubTopicIcon },
  { slug: "event-stream", name: "EventStreamIcon", Component: EventStreamIcon },
  { slug: "kafka-broker", name: "KafkaBrokerIcon", Component: KafkaBrokerIcon },
  { slug: "rabbitmq-broker", name: "RabbitmqBrokerIcon", Component: RabbitmqBrokerIcon },
  { slug: "dead-letter-queue", name: "DeadLetterQueueIcon", Component: DeadLetterQueueIcon },
  { slug: "retry-queue", name: "RetryQueueIcon", Component: RetryQueueIcon },
  { slug: "event-consumer", name: "EventConsumerIcon", Component: EventConsumerIcon },
  { slug: "event-producer", name: "EventProducerIcon", Component: EventProducerIcon },
  { slug: "webhook-dispatcher", name: "WebhookDispatcherIcon", Component: WebhookDispatcherIcon },
  { slug: "stream-processor", name: "StreamProcessorIcon", Component: StreamProcessorIcon },
  { slug: "event-store", name: "EventStoreIcon", Component: EventStoreIcon },
] as const;

describe("Category 07 — Messaging & Event Systems Infrastructure Icons", () => {
  it("renders all 14 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_07_ICONS).toHaveLength(14);

    for (const { slug, name, Component } of ALL_CATEGORY_07_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 14 icons in monochrome mode with accessible titles", () => {
    for (const { name, Component } of ALL_CATEGORY_07_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain("<title>" + name + "</title>");
      expect(html).toContain('role="img"');
    }
  });

  it("scales correctly across standard engineering dimensions (16, 20, 24, 32, 48)", () => {
    const sizes = [16, 20, 24, 32, 48] as const;

    for (const size of sizes) {
      const html = renderToString(<MessageQueueIcon size={size} />);
      expect(html).toContain(`width="${size}"`);
      expect(html).toContain(`height="${size}"`);
    }
  });

  it("registers all 14 icons in the messaging and infrastructure icon registries", () => {
    for (const { slug, Component } of ALL_CATEGORY_07_ICONS) {
      const fromCategory = getMessagingAndEventSystemsInfrastructureIcon(slug);
      const fromGlobal = getInfrastructureIcon(slug);
      const fromDict = messagingAndEventSystemsIconRegistry[slug];

      expect(fromCategory, `Registry should resolve slug: ${slug}`).toBe(Component);
      expect(fromGlobal, `Global registry should resolve slug: ${slug}`).toBe(Component);
      expect(fromDict, `Dictionary should contain slug: ${slug}`).toBe(Component);
    }
  });
});
