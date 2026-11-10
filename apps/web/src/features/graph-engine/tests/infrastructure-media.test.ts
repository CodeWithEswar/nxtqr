import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  MEDIA_AND_REAL_TIME_COMMUNICATION_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_MEDIA_SLUGS = [
  "websocket-server",
  "webrtc-signaling-server",
  "media-server",
  "video-transcoder",
  "live-streaming-server",
  "media-cdn",
  "notification-gateway",
  "push-notification-service",
  "chat-service",
  "presence-service",
] as const;

describe("Phase 05.1.14 — Media & Real-Time Communication Infrastructure Library", () => {
  beforeEach(() => {
    useGraphEditorStore.setState({
      nodes: [],
      edges: [],
      selectedNodeIds: [],
      selectedEdgeIds: [],
      canUndo: false,
      canRedo: false,
    });
  });

  describe("1. Registry & Category Inventory", () => {
    it("registers the canonical category 'media-and-real-time-communication'", () => {
      const category = infrastructureRegistry.getCategory(
        MEDIA_AND_REAL_TIME_COMMUNICATION_CATEGORY_ID
      );
      expect(category).toBeDefined();
      expect(category?.name).toBe("Media & Real-Time Communication");
      expect(category?.order).toBe(14);
    });

    it("registers exactly the 10 required Media & Real-Time Communication component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(
        MEDIA_AND_REAL_TIME_COMMUNICATION_CATEGORY_ID
      );
      expect(components.length).toBe(10);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_MEDIA_SLUGS].sort());
    });

    it("ensures every Media & Real-Time Communication component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_MEDIA_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Default Configuration & Zod Schemas", () => {
    it("validates all 10 components against their respective Zod config schemas", () => {
      for (const slug of EXPECTED_MEDIA_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def, `Component definition for ${slug} must exist`).toBeDefined();
        if (!def) continue;

        const parseResult = def.configSchema.safeParse(def.defaultConfig);
        expect(
          parseResult.success,
          `Default config for ${slug} failed validation: ${
            !parseResult.success ? JSON.stringify(parseResult.error) : ""
          }`
        ).toBe(true);
      }
    });

    it("ensures no plaintext credentials or sensitive keys exist in default configs", () => {
      for (const slug of EXPECTED_MEDIA_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        const serialized = JSON.stringify(def.defaultConfig).toLowerCase();
        expect(serialized).not.toContain("rawpassword");
        expect(serialized).not.toContain("apikeysecret");
        expect(serialized).not.toContain("privatekey");
        expect(serialized).not.toContain("bearer eyj");
      }
    });
  });

  describe("3. Real-Time Connection Semantics & Port Topology", () => {
    it("defines protocol-accurate input and output ports for every media and real-time component", () => {
      for (const slug of EXPECTED_MEDIA_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        expect(def.ports.length).toBeGreaterThanOrEqual(2);

        const hasInput = def.ports.some((p) => p.type === "input");
        const hasOutput = def.ports.some((p) => p.type === "output");
        expect(hasInput, `${slug} must declare at least one input port`).toBe(true);
        expect(hasOutput, `${slug} must declare at least one output port`).toBe(true);

        for (const port of def.ports) {
          expect(port.dataType).toBeTruthy();
          expect(port.capacity).toBeGreaterThan(0);
        }
      }
    });

    it("distinguishes WebRTC signaling from SFU media transport", () => {
      const signaling = infrastructureRegistry.getComponent("webrtc-signaling-server");
      expect(signaling).toBeDefined();
      const sigPortTypes = signaling?.ports.map((p) => p.dataType);
      expect(sigPortTypes).toContain("Sdp_Offer_Payload");
      expect(sigPortTypes).toContain("Sdp_Answer_Payload");
      expect(sigPortTypes).toContain("Ice_Candidate_Stream");

      const sfu = infrastructureRegistry.getComponent("media-server");
      expect(sfu).toBeDefined();
      const sfuPortTypes = sfu?.ports.map((p) => p.dataType);
      expect(sfuPortTypes).toContain("Media_Stream_Track");
      expect(sfuPortTypes).toContain("Forwarded_Media_Track");
    });

    it("validates specific port types for live streaming, push notifications, and presence", () => {
      const live = infrastructureRegistry.getComponent("live-streaming-server");
      expect(live).toBeDefined();
      const livePortTypes = live?.ports.map((p) => p.dataType);
      expect(livePortTypes).toContain("Live_Ingest_Stream");
      expect(livePortTypes).toContain("Live_Segment_Stream");

      const push = infrastructureRegistry.getComponent("push-notification-service");
      expect(push).toBeDefined();
      const pushPortTypes = push?.ports.map((p) => p.dataType);
      expect(pushPortTypes).toContain("Push_Delivery_Command");
      expect(pushPortTypes).toContain("Device_Push_Stream");

      const presence = infrastructureRegistry.getComponent("presence-service");
      expect(presence).toBeDefined();
      const presPortTypes = presence?.ports.map((p) => p.dataType);
      expect(presPortTypes).toContain("Client_Heartbeat_Ping");
      expect(presPortTypes).toContain("Presence_Status_Event");
    });
  });

  describe("4. Graph Editor Store & Lifecycle Integration", () => {
    it("creates, selects, updates, and removes media components in the store", () => {
      const store = useGraphEditorStore.getState();

      const wsNode = infrastructureRegistry.createInfrastructureNode(
        "websocket-server",
        {
          position: { x: 250, y: 150 },
          label: "Primary WebSocket Gateway",
        }
      );

      store.addNode(wsNode);
      expect(useGraphEditorStore.getState().nodes).toHaveLength(1);

      const validated = BaseNodeSchema.safeParse(
        useGraphEditorStore.getState().nodes[0]
      );
      expect(validated.success).toBe(true);

      store.selectNode(wsNode.id, false);
      expect(useGraphEditorStore.getState().selectedNodeIds).toEqual([wsNode.id]);

      store.updateNodeConfig(wsNode.id, {
        data: {
          ...wsNode.data,
          heartbeatIntervalSeconds: 45,
          maxConnections: 100000,
        },
      });

      const updatedNode = useGraphEditorStore.getState().nodes[0];
      expect(updatedNode.data.heartbeatIntervalSeconds).toBe(45);
      expect(updatedNode.data.maxConnections).toBe(100000);

      store.deleteNodeById(wsNode.id);
      expect(useGraphEditorStore.getState().nodes).toHaveLength(0);
    });

    it("builds an end-to-end Real-Time Video Call & Chat Architecture graph topology", () => {
      const store = useGraphEditorStore.getState();

      // 1. WebRTC Signaling Server
      const sigNode = infrastructureRegistry.createInfrastructureNode("webrtc-signaling-server", {
        position: { x: 50, y: 100 },
        label: "Signaling Hub",
      });

      // 2. Media SFU Server
      const sfuNode = infrastructureRegistry.createInfrastructureNode("media-server", {
        position: { x: 300, y: 100 },
        label: "Media SFU",
      });

      // 3. WebSocket Server
      const wsNode = infrastructureRegistry.createInfrastructureNode("websocket-server", {
        position: { x: 50, y: 300 },
        label: "Chat Socket Gateway",
      });

      // 4. Chat Service
      const chatNode = infrastructureRegistry.createInfrastructureNode("chat-service", {
        position: { x: 300, y: 300 },
        label: "Real-Time Chat Service",
      });

      // 5. Presence Service
      const presenceNode = infrastructureRegistry.createInfrastructureNode("presence-service", {
        position: { x: 550, y: 300 },
        label: "Presence Tracker",
      });

      // 6. Notification Gateway
      const notifNode = infrastructureRegistry.createInfrastructureNode("notification-gateway", {
        position: { x: 550, y: 450 },
        label: "Push Gateway",
      });

      // 7. Push Notification Service
      const pushNode = infrastructureRegistry.createInfrastructureNode("push-notification-service", {
        position: { x: 800, y: 450 },
        label: "APNs/FCM Service",
      });

      store.addNode(sigNode);
      store.addNode(sfuNode);
      store.addNode(wsNode);
      store.addNode(chatNode);
      store.addNode(presenceNode);
      store.addNode(notifNode);
      store.addNode(pushNode);

      expect(useGraphEditorStore.getState().nodes).toHaveLength(7);

      // Connect Signaling to SFU
      store.addEdge({
        id: "edge-sig-sfu",
        source: sigNode.id,
        target: sfuNode.id,
        sourceHandle: "peer-candidate-out",
        targetHandle: "signaling-ctrl-in",
        data: {},
      });

      // Connect WebSocket to Chat
      store.addEdge({
        id: "edge-ws-chat",
        source: wsNode.id,
        target: chatNode.id,
        sourceHandle: "client-conn-out",
        targetHandle: "user-message-in",
        data: {},
      });

      // Connect Chat to Presence
      store.addEdge({
        id: "edge-presence-chat",
        source: presenceNode.id,
        target: chatNode.id,
        sourceHandle: "state-change-out",
        targetHandle: "presence-sync-in",
        data: {},
      });

      // Connect Chat to Notification Gateway
      store.addEdge({
        id: "edge-chat-notif",
        source: chatNode.id,
        target: notifNode.id,
        sourceHandle: "room-broadcast-out",
        targetHandle: "notification-event-in",
        data: {},
      });

      // Connect Notification Gateway to Push Service
      store.addEdge({
        id: "edge-notif-push",
        source: notifNode.id,
        target: pushNode.id,
        sourceHandle: "push-channel-out",
        targetHandle: "push-command-in",
        data: {},
      });

      expect(useGraphEditorStore.getState().edges).toHaveLength(5);
    });
  });
});

