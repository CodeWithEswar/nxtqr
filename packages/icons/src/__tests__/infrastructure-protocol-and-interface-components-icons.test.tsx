import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  HttpEndpointIcon,
  HttpsEndpointIcon,
  RestEndpointIcon,
  GraphqlEndpointIcon,
  GrpcEndpointIcon,
  WebsocketEndpointIcon,
  TcpEndpointIcon,
  UdpEndpointIcon,
  MqttBrokerIcon,
  EventSubscriptionIcon,
  StreamingEndpointIcon,
  FileTransferEndpointIcon,
  protocolAndInterfaceComponentsIconRegistry,
  getProtocolAndInterfaceComponentsIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_20_ICONS = [
  { slug: "http-endpoint", name: "HttpEndpointIcon", Component: HttpEndpointIcon },
  { slug: "https-endpoint", name: "HttpsEndpointIcon", Component: HttpsEndpointIcon },
  { slug: "rest-endpoint", name: "RestEndpointIcon", Component: RestEndpointIcon },
  { slug: "graphql-endpoint", name: "GraphqlEndpointIcon", Component: GraphqlEndpointIcon },
  { slug: "grpc-endpoint", name: "GrpcEndpointIcon", Component: GrpcEndpointIcon },
  { slug: "websocket-endpoint", name: "WebsocketEndpointIcon", Component: WebsocketEndpointIcon },
  { slug: "tcp-endpoint", name: "TcpEndpointIcon", Component: TcpEndpointIcon },
  { slug: "udp-endpoint", name: "UdpEndpointIcon", Component: UdpEndpointIcon },
  { slug: "mqtt-broker", name: "MqttBrokerIcon", Component: MqttBrokerIcon },
  { slug: "event-subscription", name: "EventSubscriptionIcon", Component: EventSubscriptionIcon },
  { slug: "streaming-endpoint", name: "StreamingEndpointIcon", Component: StreamingEndpointIcon },
  { slug: "file-transfer-endpoint", name: "FileTransferEndpointIcon", Component: FileTransferEndpointIcon },
] as const;

describe("Category 20 — Protocol & Interface Components Icons", () => {
  it("renders all 12 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_20_ICONS).toHaveLength(12);

    for (const { slug, name, Component } of ALL_CATEGORY_20_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 12 icons in monochrome mode with neutral tokens", () => {
    for (const { slug, name, Component } of ALL_CATEGORY_20_ICONS) {
      const html = renderToString(<Component size={24} variant="monochrome" />);
      expect(html, `Monochrome "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('width="24"');
      expect(html).toContain('height="24"');
      expect(html).toContain("#A3A3A3");
    }
  });

  it("resolves all 12 icons from the protocols and global infrastructure registries", () => {
    for (const { slug, Component } of ALL_CATEGORY_20_ICONS) {
      expect(protocolAndInterfaceComponentsIconRegistry[slug]).toBe(Component);
      expect(getProtocolAndInterfaceComponentsIcon(slug)).toBe(Component);
      expect(getInfrastructureIcon(slug)).toBe(Component);
    }
  });
});
