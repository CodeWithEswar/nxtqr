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

// 1. WebSocket Server Schema
export const webSocketServerConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("websocket-server").default("websocket-server"),
  endpointPath: z.string().min(1).max(128).default("/ws"),
  authStrategy: z
    .enum(["token-query", "bearer-header", "cookie-session", "mutual-tls"])
    .default("bearer-header"),
  connectionLifecycle: z
    .enum(["persistent", "hibernating", "auto-reconnect", "long-polling-fallback"])
    .default("persistent"),
  heartbeatIntervalSeconds: z.number().int().min(1).max(300).default(30),
  idleTimeoutSeconds: z.number().int().min(5).max(3600).default(120),
  maxConnections: z.number().int().min(100).max(10000000).default(50000),
  maxMessageSizeBytes: z.number().int().min(1024).max(104857600).default(65536),
  backpressureStrategy: z
    .enum(["drop-oldest", "drop-newest", "buffer-memory", "disconnect-slow-client"])
    .default("buffer-memory"),
  scalingApproach: z
    .enum(["redis-pubsub-adapter", "nats-jetstream", "cluster-gossip", "dedicated-gateway"])
    .default("redis-pubsub-adapter"),
  estimatedMessageRatePerSec: z.number().int().min(0).max(10000000).default(10000),
});

export type WebSocketServerConfig = z.infer<typeof webSocketServerConfigSchema>;

// 2. WebRTC Signaling Server Schema
export const webRtcSignalingServerConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("webrtc-signaling-server").default("webrtc-signaling-server"),
  signalingTransport: z
    .enum(["websocket-json", "grpc-bidi-streaming", "https-sse", "sip-over-ws"])
    .default("websocket-json"),
  sessionNegotiationStrategy: z
    .enum(["sdp-offer-answer", "trickle-ice", "full-bundle-ice", "roap"])
    .default("trickle-ice"),
  stunTurnServerMode: z
    .enum(["managed-coturn", "cloud-turn-service", "twillio-network-traversal", "stun-only"])
    .default("cloud-turn-service"),
  authStrategy: z
    .enum(["ephemeral-rest-credentials", "jwt-token", "pre-shared-session-key"])
    .default("ephemeral-rest-credentials"),
  sessionTimeoutSeconds: z.number().int().min(10).max(86400).default(3600),
  reconnectionStrategy: z
    .enum(["ice-restart", "session-renegotiation", "fast-failover", "reconnect-room"])
    .default("ice-restart"),
  roomModel: z
    .enum(["mesh-direct", "sfu-star-topology", "mcu-composite", "broadcast-p2p"])
    .default("sfu-star-topology"),
  maxConcurrentSessions: z.number().int().min(1).max(500000).default(10000),
});

export type WebRtcSignalingServerConfig = z.infer<typeof webRtcSignalingServerConfigSchema>;

// 3. Media Server Schema
export const mediaServerConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("media-server").default("media-server"),
  mediaServerRole: z
    .enum(["sfu", "mcu", "media-relay", "recording-server"])
    .default("sfu"),
  supportedMediaTypes: z
    .array(z.enum(["audio-only", "video-only", "audio-video", "screen-share", "data-channel"]))
    .min(1)
    .default(["audio-video", "screen-share"]),
  transportProtocols: z
    .array(z.enum(["webrtc-srtp", "rtmp", "rtsp", "srt", "rist"]))
    .min(1)
    .default(["webrtc-srtp"]),
  videoCodecs: z
    .array(z.enum(["vp8", "vp9", "h264", "h265-hevc", "av1"]))
    .min(1)
    .default(["vp8", "h264"]),
  audioCodecs: z
    .array(z.enum(["opus", "aac", "pcmu-g711u", "pcma-g711a"]))
    .min(1)
    .default(["opus"]),
  sessionManagement: z
    .enum(["room-based", "channel-based", "track-subscription", "peer-to-peer-fallback"])
    .default("room-based"),
  recordingEnabled: z.boolean().default(false),
  routingStrategy: z
    .enum(["selective-forwarding", "spatial-simulcast", "svc-layering", "transcoded-compositing"])
    .default("spatial-simulcast"),
  maxConcurrentStreams: z.number().int().min(1).max(100000).default(2500),
});

export type MediaServerConfig = z.infer<typeof mediaServerConfigSchema>;

// 4. Video Transcoder Schema
export const videoTranscoderConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("video-transcoder").default("video-transcoder"),
  processingMode: z
    .enum(["offline-batch", "real-time-live", "hybrid-event-driven"])
    .default("real-time-live"),
  inputFormats: z
    .array(z.enum(["mp4", "mkv", "mov", "flv", "ts-stream", "prores"]))
    .min(1)
    .default(["mp4", "ts-stream"]),
  outputFormats: z
    .array(z.enum(["hls-m3u8", "dash-mpd", "mp4-fragmented", "cmaf", "webm"]))
    .min(1)
    .default(["hls-m3u8", "dash-mpd"]),
  videoCodecs: z
    .array(z.enum(["h264", "h265-hevc", "av1", "vp9"]))
    .min(1)
    .default(["h264", "h265-hevc"]),
  audioCodecs: z
    .array(z.enum(["aac", "opus", "mp3", "ac3"]))
    .min(1)
    .default(["aac", "opus"]),
  resolutionProfiles: z
    .array(z.enum(["2160p-4k", "1440p-2k", "1080p-fhd", "720p-hd", "480p-sd", "360p-ld"]))
    .min(1)
    .default(["1080p-fhd", "720p-hd", "480p-sd"]),
  hardwareAcceleration: z
    .enum(["nvidia-nvenc", "intel-qsv", "apple-videotoolbox", "amd-amf", "software-cpu"])
    .default("nvidia-nvenc"),
  chunkDurationSeconds: z.number().int().min(1).max(30).default(4),
  targetBitrateKbps: z.number().int().min(100).max(100000).default(4500),
  maxParallelJobs: z.number().int().min(1).max(1000).default(16),
});

export type VideoTranscoderConfig = z.infer<typeof videoTranscoderConfigSchema>;

// 5. Live Streaming Server Schema
export const liveStreamingServerConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("live-streaming-server").default("live-streaming-server"),
  ingestProtocol: z
    .enum(["rtmp", "srt", "webrtc-whip", "rtsp", "rist"])
    .default("rtmp"),
  playbackProtocol: z
    .enum(["ll-hls", "standard-hls", "dash-cmaf", "webrtc-whep"])
    .default("ll-hls"),
  streamingLatencyClass: z
    .enum(["ultra-low-sub-second", "low-latency-2-5s", "standard-broadcast-15-30s"])
    .default("low-latency-2-5s"),
  segmentDurationSeconds: z.number().int().min(1).max(10).default(2),
  adaptiveBitrateEnabled: z.boolean().default(true),
  streamAuthentication: z
    .enum(["token-query", "publish-key", "jwt-signature", "ip-allowlist"])
    .default("publish-key"),
  dvrRecordingEnabled: z.boolean().default(false),
  maxConcurrentViewers: z.number().int().min(10).max(10000000).default(25000),
});

export type LiveStreamingServerConfig = z.infer<typeof liveStreamingServerConfigSchema>;

// 6. Media CDN Schema
export const mediaCdnConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("media-cdn").default("media-cdn"),
  cacheStrategy: z
    .enum(["edge-segment-caching", "manifest-microcaching", "whole-asset-caching", "origin-shield-hierarchical"])
    .default("origin-shield-hierarchical"),
  supportedMediaFormats: z
    .array(z.enum(["hls-ts", "hls-fmp4", "dash-cmaf", "mp4-progressive", "webp-thumbnails"]))
    .min(1)
    .default(["hls-fmp4", "dash-cmaf"]),
  segmentTtlSeconds: z.number().int().min(5).max(86400).default(300),
  manifestTtlSeconds: z.number().int().min(1).max(60).default(2),
  geographicDistribution: z
    .enum(["global-multi-tier", "regional-edge-only", "domestic-optimized", "local-cache-appliance"])
    .default("global-multi-tier"),
  signedUrlsEnabled: z.boolean().default(true),
  byteRangeRequestsSupported: z.boolean().default(true),
  originShieldEnabled: z.boolean().default(true),
  bandwidthCapacityGbps: z.number().int().min(1).max(100000).default(100),
});

export type MediaCdnConfig = z.infer<typeof mediaCdnConfigSchema>;

// 7. Notification Gateway Schema
export const notificationGatewayConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("notification-gateway").default("notification-gateway"),
  supportedChannels: z
    .array(z.enum(["push", "sms", "email", "whatsapp", "webhook", "in-app"]))
    .min(1)
    .default(["push", "sms", "email"]),
  routingStrategy: z
    .enum(["priority-tier", "fallback-cascade", "least-cost-routing", "geographic-provider"])
    .default("priority-tier"),
  templateEngineStrategy: z
    .enum(["mustache-templates", "liquid-engine", "react-email", "provider-native"])
    .default("react-email"),
  retryPolicy: z
    .enum(["exponential-backoff", "immediate-retry-3x", "dead-letter-spillover", "circuit-breaker"])
    .default("exponential-backoff"),
  deduplicationWindowSeconds: z.number().int().min(0).max(86400).default(300),
  rateLimitPerSecond: z.number().int().min(1).max(500000).default(5000),
  batchDispatchSize: z.number().int().min(1).max(10000).default(500),
  maxDailyQuota: z.number().int().min(100).max(1000000000).default(1000000),
});

export type NotificationGatewayConfig = z.infer<typeof notificationGatewayConfigSchema>;

// 8. Push Notification Service Schema
export const pushNotificationServiceConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("push-notification-service").default("push-notification-service"),
  pushPlatformCategory: z
    .enum(["apns-apple", "fcm-google", "web-push-vapid", "unified-cross-platform"])
    .default("unified-cross-platform"),
  payloadSizeLimitBytes: z.number().int().min(256).max(65536).default(4096),
  defaultTtlSeconds: z.number().int().min(0).max(2419200).default(86400),
  priority: z
    .enum(["high-immediate", "normal-power-conserving", "background-silent"])
    .default("high-immediate"),
  topicSubscriptionModel: z
    .enum(["pubsub-topic", "user-tag-segmentation", "single-device-direct", "geo-fencing-radius"])
    .default("pubsub-topic"),
  tokenInvalidationHandling: z
    .enum(["auto-prune-on-failure", "dead-token-queue", "feedback-service-polling"])
    .default("auto-prune-on-failure"),
  retryAttempts: z.number().int().min(0).max(10).default(3),
  estimatedDispatchRatePerSec: z.number().int().min(1).max(1000000).default(15000),
});

export type PushNotificationServiceConfig = z.infer<typeof pushNotificationServiceConfigSchema>;

// 9. Chat Service Schema
export const chatServiceConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("chat-service").default("chat-service"),
  conversationModel: z
    .enum(["direct-1-to-1", "group-channel", "large-broadcast-room", "threaded-channel"])
    .default("group-channel"),
  messagePersistence: z
    .enum(["relational-sql", "distributed-document-nosql", "wide-column-cassandra", "ephemeral-in-memory"])
    .default("distributed-document-nosql"),
  deliverySemantics: z
    .enum(["at-least-once", "exactly-once-dedup", "at-most-once-lossy"])
    .default("at-least-once"),
  orderingGuarantee: z
    .enum(["strict-total-order", "causal-per-room", "monotonic-client-timestamp"])
    .default("causal-per-room"),
  readReceiptsSupported: z.boolean().default(true),
  typingIndicatorsSupported: z.boolean().default(true),
  attachmentStorageMode: z
    .enum(["presigned-s3-direct", "chunked-proxy-upload", "external-media-cdn"])
    .default("presigned-s3-direct"),
  moderationIntegration: z
    .enum(["none", "automated-ai-filter", "human-in-the-loop", "keyword-regex-blocklist"])
    .default("automated-ai-filter"),
  maxGroupMembers: z.number().int().min(2).max(1000000).default(1000),
  maxMessageLengthChars: z.number().int().min(100).max(100000).default(4000),
});

export type ChatServiceConfig = z.infer<typeof chatServiceConfigSchema>;

// 10. Presence Service Schema
export const presenceServiceConfigSchema = z.object({
  ...baseInfrastructureFields,
  componentType: z.literal("presence-service").default("presence-service"),
  supportedStates: z
    .array(z.enum(["online", "offline", "away", "busy", "custom-status", "invisible"]))
    .min(1)
    .default(["online", "offline", "away", "busy"]),
  heartbeatIntervalSeconds: z.number().int().min(1).max(300).default(15),
  expirationTimeoutSeconds: z.number().int().min(5).max(900).default(45),
  stateStorageBackend: z
    .enum(["redis-sorted-sets", "redis-hashes", "distributed-cache-memcached", "in-memory-cluster-gossip"])
    .default("redis-sorted-sets"),
  subscriptionModel: z
    .enum(["friend-list-pull", "room-roster-push", "on-demand-query", "hybrid-viewport-presence"])
    .default("room-roster-push"),
  multiDeviceHandling: z
    .enum(["most-active-device", "aggregate-any-online", "per-device-substatus"])
    .default("aggregate-any-online"),
  reconnectionBehavior: z
    .enum(["instant-reannounce", "grace-period-dampening", "silent-catchup"])
    .default("grace-period-dampening"),
  consistencyLevel: z
    .enum(["eventual-consistency", "strong-redis-lease", "probabilistic-crdt"])
    .default("eventual-consistency"),
  estimatedTrackedUsers: z.number().int().min(10).max(50000000).default(100000),
});

export type PresenceServiceConfig = z.infer<typeof presenceServiceConfigSchema>;

// Discriminated Union Schema
export const mediaAndRealTimeCommunicationComponentSchema = z.discriminatedUnion("componentType", [
  webSocketServerConfigSchema,
  webRtcSignalingServerConfigSchema,
  mediaServerConfigSchema,
  videoTranscoderConfigSchema,
  liveStreamingServerConfigSchema,
  mediaCdnConfigSchema,
  notificationGatewayConfigSchema,
  pushNotificationServiceConfigSchema,
  chatServiceConfigSchema,
  presenceServiceConfigSchema,
]);

export type MediaAndRealTimeCommunicationComponentConfig = z.infer<
  typeof mediaAndRealTimeCommunicationComponentSchema
>;

