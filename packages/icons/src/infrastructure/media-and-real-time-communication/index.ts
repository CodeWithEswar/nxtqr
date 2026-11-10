export * from "./websocket-server-icon";
export * from "./webrtc-signaling-server-icon";
export * from "./media-server-icon";
export * from "./video-transcoder-icon";
export * from "./live-streaming-server-icon";
export * from "./media-cdn-icon";
export * from "./notification-gateway-icon";
export * from "./push-notification-service-icon";
export * from "./chat-service-icon";
export * from "./presence-service-icon";

import type { InfrastructureIconComponent } from "../types";
import { WebSocketServerIcon } from "./websocket-server-icon";
import { WebRtcSignalingServerIcon } from "./webrtc-signaling-server-icon";
import { MediaServerIcon } from "./media-server-icon";
import { VideoTranscoderIcon } from "./video-transcoder-icon";
import { LiveStreamingServerIcon } from "./live-streaming-server-icon";
import { MediaCdnIcon } from "./media-cdn-icon";
import { NotificationGatewayIcon } from "./notification-gateway-icon";
import { PushNotificationServiceIcon } from "./push-notification-service-icon";
import { ChatServiceIcon } from "./chat-service-icon";
import { PresenceServiceIcon } from "./presence-service-icon";

export const mediaAndRealTimeCommunicationIconRegistry: Record<string, InfrastructureIconComponent> = {
  "websocket-server": WebSocketServerIcon,
  "webrtc-signaling-server": WebRtcSignalingServerIcon,
  "media-server": MediaServerIcon,
  "video-transcoder": VideoTranscoderIcon,
  "live-streaming-server": LiveStreamingServerIcon,
  "media-cdn": MediaCdnIcon,
  "notification-gateway": NotificationGatewayIcon,
  "push-notification-service": PushNotificationServiceIcon,
  "chat-service": ChatServiceIcon,
  "presence-service": PresenceServiceIcon,
};

export function getMediaAndRealTimeCommunicationInfrastructureIcon(
  slug: string
): InfrastructureIconComponent | undefined {
  return mediaAndRealTimeCommunicationIconRegistry[slug];
}

