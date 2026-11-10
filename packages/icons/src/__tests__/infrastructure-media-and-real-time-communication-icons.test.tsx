import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  WebSocketServerIcon,
  WebRtcSignalingServerIcon,
  MediaServerIcon,
  VideoTranscoderIcon,
  LiveStreamingServerIcon,
  MediaCdnIcon,
  NotificationGatewayIcon,
  PushNotificationServiceIcon,
  ChatServiceIcon,
  PresenceServiceIcon,
  mediaAndRealTimeCommunicationIconRegistry,
  getMediaAndRealTimeCommunicationInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_14_ICONS = [
  { slug: "websocket-server", name: "WebSocketServerIcon", Component: WebSocketServerIcon },
  { slug: "webrtc-signaling-server", name: "WebRtcSignalingServerIcon", Component: WebRtcSignalingServerIcon },
  { slug: "media-server", name: "MediaServerIcon", Component: MediaServerIcon },
  { slug: "video-transcoder", name: "VideoTranscoderIcon", Component: VideoTranscoderIcon },
  { slug: "live-streaming-server", name: "LiveStreamingServerIcon", Component: LiveStreamingServerIcon },
  { slug: "media-cdn", name: "MediaCdnIcon", Component: MediaCdnIcon },
  { slug: "notification-gateway", name: "NotificationGatewayIcon", Component: NotificationGatewayIcon },
  { slug: "push-notification-service", name: "PushNotificationServiceIcon", Component: PushNotificationServiceIcon },
  { slug: "chat-service", name: "ChatServiceIcon", Component: ChatServiceIcon },
  { slug: "presence-service", name: "PresenceServiceIcon", Component: PresenceServiceIcon },
] as const;

describe("Category 14 — Media & Real-Time Communication Infrastructure Icons", () => {
  it("renders all 10 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_14_ICONS).toHaveLength(10);

    for (const { slug, name, Component } of ALL_CATEGORY_14_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 10 icons in monochrome mode with accessible titles", () => {
    for (const { name, Component } of ALL_CATEGORY_14_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain("<title>" + name + "</title>");
      expect(html).toContain('width="24"');
      expect(html).toContain('height="24"');
    }
  });

  it("registers all 10 icons correctly in mediaAndRealTimeCommunicationIconRegistry", () => {
    expect(Object.keys(mediaAndRealTimeCommunicationIconRegistry)).toHaveLength(10);

    for (const { slug, Component } of ALL_CATEGORY_14_ICONS) {
      expect(mediaAndRealTimeCommunicationIconRegistry[slug]).toBe(Component);
      expect(getMediaAndRealTimeCommunicationInfrastructureIcon(slug)).toBe(Component);
      expect(getInfrastructureIcon(slug)).toBe(Component);
    }
  });

  it("returns undefined for unknown icon slug in Category 14", () => {
    expect(getMediaAndRealTimeCommunicationInfrastructureIcon("unknown-slug")).toBeUndefined();
  });
});

