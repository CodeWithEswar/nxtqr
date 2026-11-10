import { z } from "zod";

// Base shared infrastructure fields
const baseInfrastructureFields = {
  label: z.string().min(1).max(64),
  description: z.string().max(256).optional(),
  environment: z.enum(["development", "staging", "production", "edge", "local"]).default("production"),
  tags: z.array(z.string()).default([]),
  notes: z.string().max(1024).optional(),
  enabled: z.boolean().default(true),
};

// Reusable classification for protocols and interfaces
export const protocolClassificationSchema = z.enum([
  "application-endpoint",
  "api-interface",
  "transport-endpoint",
  "messaging-broker",
  "event-subscription",
  "stream-interface",
  "file-transfer-interface",
]);
export type ProtocolClassification = z.infer<typeof protocolClassificationSchema>;

// Shared interface attachment metadata
export const interfaceAttachmentMetadataSchema = z.object({
  protocolClassification: protocolClassificationSchema.default("application-endpoint"),
  protocolLayer: z.enum(["transport", "application", "interface"]).default("application"),
  direction: z.enum(["inbound", "outbound", "bidirectional"]).default("inbound"),
  secureTransport: z.boolean().default(true),
  hostComponentId: z.string().max(64).optional(),
  contractReference: z.string().max(128).optional(),
});
export type InterfaceAttachmentMetadata = z.infer<typeof interfaceAttachmentMetadataSchema>;

// 1. HTTP Endpoint Schema
export const httpEndpointConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("http-endpoint").default("http-endpoint"),
  protocolClassification: z.literal("application-endpoint").default("application-endpoint"),
  httpVersion: z.enum(["HTTP/1.1", "HTTP/2", "HTTP/3"]).default("HTTP/1.1"),
  hostPlaceholder: z.string().max(128).default("api.example.internal"),
  port: z.number().int().min(1).max(65535).default(8080),
  path: z.string().min(1).max(256).default("/api/v1"),
  supportedMethods: z
    .array(z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"]))
    .min(1)
    .default(["GET", "POST", "PUT", "DELETE"]),
  requestContentTypes: z
    .array(z.enum(["application/json", "application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]))
    .default(["application/json"]),
  responseContentTypes: z
    .array(z.enum(["application/json", "text/html", "application/xml", "text/plain"]))
    .default(["application/json"]),
  timeoutMs: z.number().int().min(100).max(120000).default(5000),
  connectionBehavior: z.enum(["keep-alive", "close", "upgrade"]).default("keep-alive"),
  hostComponentId: z.string().max(64).optional(),
});
export type HttpEndpointConfig = z.infer<typeof httpEndpointConfigSchema>;

// 2. HTTPS Endpoint Schema
export const httpsEndpointConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("https-endpoint").default("https-endpoint"),
  protocolClassification: z.literal("application-endpoint").default("application-endpoint"),
  httpVersion: z.enum(["HTTP/1.1", "HTTP/2", "HTTP/3"]).default("HTTP/2"),
  tlsVersion: z.enum(["TLS 1.2", "TLS 1.3"]).default("TLS 1.3"),
  certificateRef: z.string().max(128).default("wildcard.example.com.crt"),
  hostPlaceholder: z.string().max(128).default("gateway.example.com"),
  port: z.number().int().min(1).max(65535).default(443),
  path: z.string().min(1).max(256).default("/"),
  supportedMethods: z
    .array(z.enum(["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]))
    .min(1)
    .default(["GET", "POST", "PUT", "DELETE"]),
  tlsTermination: z.enum(["edge-reverse-proxy", "ingress-gateway", "service-pod", "hardware-hsm"]).default("ingress-gateway"),
  mutualTlsEnabled: z.boolean().default(false),
  rateLimitPerSec: z.number().int().min(1).max(100000).default(2000),
  hostComponentId: z.string().max(64).optional(),
});
export type HttpsEndpointConfig = z.infer<typeof httpsEndpointConfigSchema>;

// 3. REST Endpoint Schema
export const restEndpointConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("rest-endpoint").default("rest-endpoint"),
  protocolClassification: z.literal("api-interface").default("api-interface"),
  resourcePath: z.string().min(1).max(256).default("/api/v1/orders/{id}"),
  httpMethods: z
    .array(z.enum(["GET", "POST", "PUT", "DELETE", "PATCH"]))
    .min(1)
    .default(["GET", "POST", "PUT"]),
  requestSchemaRef: z.string().max(128).default("OrderCreateRequest.schema.json"),
  responseSchemaRef: z.string().max(128).default("OrderResponse.schema.json"),
  authentication: z.enum(["bearer-jwt", "api-key", "oauth2", "mtls", "none"]).default("bearer-jwt"),
  paginationStrategy: z.enum(["cursor-based", "offset-limit", "page-number", "none"]).default("cursor-based"),
  versioningStrategy: z.enum(["uri-path", "header-version", "query-parameter"]).default("uri-path"),
  idempotencyRequired: z.boolean().default(true),
  targetLatencyP99Ms: z.number().int().min(1).max(10000).default(100),
  hostComponentId: z.string().max(64).optional(),
});
export type RestEndpointConfig = z.infer<typeof restEndpointConfigSchema>;

// 4. GraphQL Endpoint Schema
export const graphqlEndpointConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("graphql-endpoint").default("graphql-endpoint"),
  protocolClassification: z.literal("api-interface").default("api-interface"),
  schemaRef: z.string().max(128).default("schema.graphql"),
  querySupport: z.boolean().default(true),
  mutationSupport: z.boolean().default(true),
  subscriptionSupport: z.boolean().default(true),
  authentication: z.enum(["bearer-jwt", "api-key", "session-cookie", "none"]).default("bearer-jwt"),
  maxQueryDepth: z.number().int().min(1).max(50).default(10),
  maxQueryComplexity: z.number().int().min(10).max(5000).default(500),
  paginationStrategy: z.enum(["relay-cursor-connections", "offset-limit"]).default("relay-cursor-connections"),
  timeoutMs: z.number().int().min(100).max(60000).default(5000),
  hostComponentId: z.string().max(64).optional(),
});
export type GraphqlEndpointConfig = z.infer<typeof graphqlEndpointConfigSchema>;

// 5. gRPC Endpoint Schema
export const grpcEndpointConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("grpc-endpoint").default("grpc-endpoint"),
  protocolClassification: z.literal("api-interface").default("api-interface"),
  serviceDefinitionRef: z.string().max(128).default("orders.v1.OrderService.proto"),
  rpcMethods: z.array(z.string()).min(1).default(["CreateOrder", "StreamOrderStatus", "BatchOrders"]),
  streamingMode: z.enum(["unary", "client-streaming", "server-streaming", "bidirectional-streaming"]).default("bidirectional-streaming"),
  transportSecurity: z.enum(["tls", "plaintext", "alts"]).default("tls"),
  deadlineMs: z.number().int().min(50).max(60000).default(3000),
  maxMessageSizeBytes: z.number().int().min(1024).max(67108864).default(4194304),
  retryEnabled: z.boolean().default(true),
  hostComponentId: z.string().max(64).optional(),
});
export type GrpcEndpointConfig = z.infer<typeof grpcEndpointConfigSchema>;

// 6. WebSocket Endpoint Schema
export const websocketEndpointConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("websocket-endpoint").default("websocket-endpoint"),
  protocolClassification: z.literal("application-endpoint").default("application-endpoint"),
  endpointPath: z.string().min(1).max(256).default("/ws/v1/events"),
  authentication: z.enum(["ticket-token", "bearer-jwt", "query-token", "none"]).default("ticket-token"),
  subprotocol: z.string().max(64).default("graphql-transport-ws"),
  heartbeatIntervalSeconds: z.number().int().min(1).max(300).default(30),
  idleTimeoutSeconds: z.number().int().min(5).max(3600).default(60),
  maxMessageSizeBytes: z.number().int().min(512).max(16777216).default(65536),
  backpressureStrategy: z.enum(["drop-oldest", "buffer-queue", "client-slowdown"]).default("buffer-queue"),
  maxConcurrentSessions: z.number().int().min(10).max(500000).default(10000),
  hostComponentId: z.string().max(64).optional(),
});
export type WebsocketEndpointConfig = z.infer<typeof websocketEndpointConfigSchema>;

// 7. TCP Endpoint Schema
export const tcpEndpointConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("tcp-endpoint").default("tcp-endpoint"),
  protocolClassification: z.literal("transport-endpoint").default("transport-endpoint"),
  hostPlaceholder: z.string().max(128).default("tcp.internal.mesh"),
  port: z.number().int().min(1).max(65535).default(9000),
  connectionTimeoutMs: z.number().int().min(50).max(60000).default(3000),
  idleTimeoutSeconds: z.number().int().min(1).max(86400).default(300),
  keepaliveEnabled: z.boolean().default(true),
  framingAssumption: z.enum(["length-prefixed", "delimiter-terminated", "fixed-size", "raw-byte-stream"]).default("length-prefixed"),
  tlsEnabled: z.boolean().default(true),
  maxConnections: z.number().int().min(1).max(100000).default(5000),
  hostComponentId: z.string().max(64).optional(),
});
export type TcpEndpointConfig = z.infer<typeof tcpEndpointConfigSchema>;

// 8. UDP Endpoint Schema
export const udpEndpointConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("udp-endpoint").default("udp-endpoint"),
  protocolClassification: z.literal("transport-endpoint").default("transport-endpoint"),
  hostPlaceholder: z.string().max(128).default("telemetry.internal.local"),
  port: z.number().int().min(1).max(65535).default(5141),
  maxDatagramSizeBytes: z.number().int().min(64).max(65507).default(1472),
  packetOrderingAssumed: z.boolean().default(false),
  retransmissionStrategy: z.enum(["none-best-effort", "application-arq", "fec-forward-error-correction"]).default("none-best-effort"),
  multicastEnabled: z.boolean().default(false),
  expectedPacketRatePerSec: z.number().int().min(1).max(500000).default(25000),
  hostComponentId: z.string().max(64).optional(),
});
export type UdpEndpointConfig = z.infer<typeof udpEndpointConfigSchema>;

// 9. MQTT Broker Schema
export const mqttBrokerConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("mqtt-broker").default("mqtt-broker"),
  protocolClassification: z.literal("messaging-broker").default("messaging-broker"),
  mqttVersion: z.enum(["MQTT 3.1.1", "MQTT 5.0"]).default("MQTT 5.0"),
  port: z.number().int().min(1).max(65535).default(8883),
  topicNamespace: z.string().min(1).max(128).default("telemetry/devices/#"),
  defaultQos: z.enum(["QoS 0 - At most once", "QoS 1 - At least once", "QoS 2 - Exactly once"]).default("QoS 1 - At least once"),
  retainedMessagesSupported: z.boolean().default(true),
  cleanSessionDefault: z.boolean().default(false),
  tlsEnabled: z.boolean().default(true),
  maxClientConnections: z.number().int().min(10).max(1000000).default(50000),
  hostComponentId: z.string().max(64).optional(),
});
export type MqttBrokerConfig = z.infer<typeof mqttBrokerConfigSchema>;

// 10. Event Subscription Schema
export const eventSubscriptionConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("event-subscription").default("event-subscription"),
  protocolClassification: z.literal("event-subscription").default("event-subscription"),
  eventSourceRef: z.string().min(1).max(128).default("OrdersEventBus"),
  topicOrStream: z.string().min(1).max(128).default("orders.events.v1"),
  consumerGroup: z.string().max(64).default("payment-processor-group"),
  subscriptionMode: z.enum(["push-webhook", "pull-polling", "streaming-consumer"]).default("streaming-consumer"),
  ackStrategy: z.enum(["auto-ack", "manual-explicit", "batch-ack"]).default("manual-explicit"),
  retryPolicy: z.enum(["exponential-backoff", "fixed-interval", "immediate-dead-letter"]).default("exponential-backoff"),
  deadLetterDestination: z.string().max(128).default("orders.dlq.v1"),
  strictOrderingGuaranteed: z.boolean().default(true),
  expectedEventRatePerSec: z.number().int().min(1).max(100000).default(500),
  hostComponentId: z.string().max(64).optional(),
});
export type EventSubscriptionConfig = z.infer<typeof eventSubscriptionConfigSchema>;

// 11. Streaming Endpoint Schema
export const streamingEndpointConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("streaming-endpoint").default("streaming-endpoint"),
  protocolClassification: z.literal("stream-interface").default("stream-interface"),
  streamingProtocol: z.enum(["server-sent-events", "http-chunked", "grpc-streaming", "websocket-stream", "webrtc-data"]).default("server-sent-events"),
  streamDirection: z.enum(["inbound-stream", "outbound-stream", "bidirectional-stream"]).default("outbound-stream"),
  framingType: z.enum(["json-lines", "protobuf-frames", "raw-binary-chunks", "text-event-stream"]).default("text-event-stream"),
  backpressureEnabled: z.boolean().default(true),
  bufferSizeBytes: z.number().int().min(4096).max(67108864).default(1048576),
  heartbeatTimeoutMs: z.number().int().min(500).max(120000).default(15000),
  autoReconnectEnabled: z.boolean().default(true),
  targetThroughputKbps: z.number().int().min(1).max(1000000).default(5000),
  hostComponentId: z.string().max(64).optional(),
});
export type StreamingEndpointConfig = z.infer<typeof streamingEndpointConfigSchema>;

// 12. File Transfer Endpoint Schema
export const fileTransferEndpointConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("file-transfer-endpoint").default("file-transfer-endpoint"),
  protocolClassification: z.literal("file-transfer-interface").default("file-transfer-interface"),
  transferProtocol: z.enum(["https-multipart", "sftp", "ftps", "presigned-s3-upload", "tus-resumable"]).default("https-multipart"),
  transferDirection: z.enum(["upload-only", "download-only", "bidirectional"]).default("bidirectional"),
  maxFileSizeBytes: z.number().int().min(1024).max(107374182400).default(5368709120),
  chunkingEnabled: z.boolean().default(true),
  chunkSizeMb: z.number().int().min(1).max(500).default(16),
  resumableUploadsSupported: z.boolean().default(true),
  checksumVerification: z.enum(["sha256", "md5", "crc32c", "none"]).default("sha256"),
  storageDestinationRef: z.string().max(128).default("s3://customer-uploads-bucket"),
  hostComponentId: z.string().max(64).optional(),
});
export type FileTransferEndpointConfig = z.infer<typeof fileTransferEndpointConfigSchema>;

// Discriminated union of all 12 Protocol & Interface configs
export const protocolAndInterfaceComponentsConfigSchema = z.discriminatedUnion("componentType", [
  httpEndpointConfigSchema,
  httpsEndpointConfigSchema,
  restEndpointConfigSchema,
  graphqlEndpointConfigSchema,
  grpcEndpointConfigSchema,
  websocketEndpointConfigSchema,
  tcpEndpointConfigSchema,
  udpEndpointConfigSchema,
  mqttBrokerConfigSchema,
  eventSubscriptionConfigSchema,
  streamingEndpointConfigSchema,
  fileTransferEndpointConfigSchema,
]);

export type ProtocolAndInterfaceComponentsConfig = z.infer<typeof protocolAndInterfaceComponentsConfigSchema>;
