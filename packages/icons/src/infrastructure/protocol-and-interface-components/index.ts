import * as React from "react";
import type { InfrastructureIconProps } from "../types";
import { HttpEndpointIcon } from "./http-endpoint-icon";
import { HttpsEndpointIcon } from "./https-endpoint-icon";
import { RestEndpointIcon } from "./rest-endpoint-icon";
import { GraphqlEndpointIcon } from "./graphql-endpoint-icon";
import { GrpcEndpointIcon } from "./grpc-endpoint-icon";
import { WebsocketEndpointIcon } from "./websocket-endpoint-icon";
import { TcpEndpointIcon } from "./tcp-endpoint-icon";
import { UdpEndpointIcon } from "./udp-endpoint-icon";
import { MqttBrokerIcon } from "./mqtt-broker-icon";
import { EventSubscriptionIcon } from "./event-subscription-icon";
import { StreamingEndpointIcon } from "./streaming-endpoint-icon";
import { FileTransferEndpointIcon } from "./file-transfer-endpoint-icon";

export {
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
};

export const protocolAndInterfaceComponentsIconRegistry: Record<
  string,
  React.FC<InfrastructureIconProps>
> = {
  "http-endpoint": HttpEndpointIcon,
  "https-endpoint": HttpsEndpointIcon,
  "rest-endpoint": RestEndpointIcon,
  "graphql-endpoint": GraphqlEndpointIcon,
  "grpc-endpoint": GrpcEndpointIcon,
  "websocket-endpoint": WebsocketEndpointIcon,
  "tcp-endpoint": TcpEndpointIcon,
  "udp-endpoint": UdpEndpointIcon,
  "mqtt-broker": MqttBrokerIcon,
  "event-subscription": EventSubscriptionIcon,
  "streaming-endpoint": StreamingEndpointIcon,
  "file-transfer-endpoint": FileTransferEndpointIcon,
};

export function getProtocolAndInterfaceComponentsIcon(
  slug: string
): React.FC<InfrastructureIconProps> | undefined {
  return protocolAndInterfaceComponentsIconRegistry[slug];
}
