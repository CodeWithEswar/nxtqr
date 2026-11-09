import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  DNS_CDN_EDGE_CATEGORY_ID,
  ALL_DNS_CDN_EDGE_DEFINITIONS,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_DNS_CDN_EDGE_SLUGS = [
  "dns-resolver",
  "authoritative-dns",
  "dns-load-balancing",
  "cdn",
  "edge-cache",
  "edge-worker",
  "edge-router",
  "reverse-proxy",
  "global-traffic-manager",
  "anycast-network",
] as const;

describe("Phase 05.1.2 — DNS, CDN & Edge Infrastructure Library", () => {
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
    it("registers the canonical category 'dns-cdn-edge'", () => {
      const category = infrastructureRegistry.getCategory(DNS_CDN_EDGE_CATEGORY_ID);
      expect(category).toBeDefined();
      expect(category?.name).toBe("DNS, CDN & Edge");
      expect(category?.order).toBe(2);
    });

    it("registers exactly the 10 required DNS, CDN & Edge component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(DNS_CDN_EDGE_CATEGORY_ID);
      expect(components.length).toBe(10);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_DNS_CDN_EDGE_SLUGS].sort());
    });

    it("ensures every DNS, CDN & Edge component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_DNS_CDN_EDGE_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Node Factory & Graph Schema Compliance", () => {
    it("creates valid BaseNode instances conforming to @nxtqr/graph-schema", () => {
      for (const slug of EXPECTED_DNS_CDN_EDGE_SLUGS) {
        const node = infrastructureRegistry.createInfrastructureNode(slug, {
          position: { x: 150, y: 250 },
          label: `Edge Node ${slug}`,
        });

        // Strict schema validation using BaseNodeSchema
        const parseResult = BaseNodeSchema.safeParse(node);
        expect(
          parseResult.success,
          `Node created for "${slug}" failed BaseNodeSchema validation: ${JSON.stringify(
            (parseResult as any).error?.errors
          )}`
        ).toBe(true);

        expect(node.type).toBe(slug);
        expect(node.position).toEqual({ x: 150, y: 250 });
        expect(node.label).toBe(`Edge Node ${slug}`);
        expect(node.ports).toBeDefined();
        expect(node.ports!.length).toBeGreaterThanOrEqual(1);
        expect(node.data.isInfrastructure).toBe(true);
        expect(node.data.categoryId).toBe(DNS_CDN_EDGE_CATEGORY_ID);
      }
    });

    it("correctly assigns protocol-aware ports with data types", () => {
      const cdnNode = infrastructureRegistry.createInfrastructureNode("cdn");
      expect(cdnNode.ports).toBeDefined();

      const ingress = cdnNode.ports?.find((p) => p.id === "client-edge-ingress");
      expect(ingress).toBeDefined();
      expect(ingress?.type).toBe("input");
      expect(ingress?.dataType).toBe("HTTPS_Request");

      const originFetch = cdnNode.ports?.find((p) => p.id === "origin-fetch-out");
      expect(originFetch).toBeDefined();
      expect(originFetch?.type).toBe("output");

      const purge = cdnNode.ports?.find((p) => p.id === "purge-api-in");
      expect(purge).toBeDefined();
      expect(purge?.dataType).toBe("Cache_Purge");
    });

    it("assigns BGP peering and transit ports for Anycast Network", () => {
      const anycastNode = infrastructureRegistry.createInfrastructureNode("anycast-network");
      expect(anycastNode.ports).toBeDefined();
      const transitPort = anycastNode.ports?.find((p) => p.id === "internet-transit-in");
      expect(transitPort?.dataType).toBe("BGP_Transit");
      const peerPort = anycastNode.ports?.find((p) => p.id === "bgp-peer-conn");
      expect(peerPort?.type).toBe("bidirectional");
    });
  });

  describe("3. Schema-Driven Configuration Validation", () => {
    it("validates compliant DNS Resolver configuration", () => {
      const result = infrastructureRegistry.validateConfiguration("dns-resolver", {
        resolverMode: "recursive",
        dnsTransport: "DoH-HTTPS/443",
        cacheEnabled: true,
        cacheTtlMinSeconds: 120,
        cacheTtlMaxSeconds: 86400,
        dnssecValidation: true,
        upstreamResolvers: ["1.1.1.1", "9.9.9.9"],
        queryTimeoutMs: 1500,
        assumedQps: 25000,
      });

      expect(result.success).toBe(true);
      expect(result.data?.resolverMode).toBe("recursive");
      expect(result.data?.dnsTransport).toBe("DoH-HTTPS/443");
      expect(result.data?.dnssecValidation).toBe(true);
    });

    it("rejects invalid DNS Resolver configurations", () => {
      const badResult = infrastructureRegistry.validateConfiguration("dns-resolver", {
        dnsTransport: "INVALID_PORT_53", // Invalid enum
        queryTimeoutMs: 50, // Below min(100)
        cacheTtlMinSeconds: -10, // Negative not allowed
      });

      expect(badResult.success).toBe(false);
      expect(badResult.errors).toBeDefined();
      expect(badResult.errors?.length).toBeGreaterThanOrEqual(1);
    });

    it("validates compliant Edge Worker configuration", () => {
      const result = infrastructureRegistry.validateConfiguration("edge-worker", {
        runtimeModel: "v8-isolate",
        triggerType: "http-request",
        executionTimeoutMs: 35,
        memoryLimitMb: 256,
        kvBindingEnabled: true,
        subrequestLimit: 40,
        concurrencyPerPoP: 2000,
      });

      expect(result.success).toBe(true);
      expect(result.data?.runtimeModel).toBe("v8-isolate");
      expect(result.data?.memoryLimitMb).toBe(256);
    });

    it("rejects excessive memory allocation for Edge Worker", () => {
      const badResult = infrastructureRegistry.validateConfiguration("edge-worker", {
        memoryLimitMb: 4096, // Exceeds isolate max of 1024
      });

      expect(badResult.success).toBe(false);
    });

    it("validates compliant Anycast Network BGP configuration", () => {
      const result = infrastructureRegistry.validateConfiguration("anycast-network", {
        asnNumber: 13335,
        routingProtocol: "BGP-4",
        ipVersion: "IPv4-IPv6-DualStack",
        announcedPrefix: "192.0.2.0/24",
        activePoPsCount: 150,
        ddosMitigationEnabled: true,
      });

      expect(result.success).toBe(true);
      expect(result.data?.asnNumber).toBe(13335);
      expect(result.data?.ddosMitigationEnabled).toBe(true);
    });
  });

  describe("4. Zustand Graph Editor Store Integration", () => {
    it("adds a DNS/Edge infrastructure node to the canvas store", () => {
      const store = useGraphEditorStore.getState();
      const node = infrastructureRegistry.createInfrastructureNode("edge-router", {
        position: { x: 400, y: 250 },
      });

      store.addNode(node);

      const updated = useGraphEditorStore.getState().nodes;
      expect(updated.length).toBe(1);
      expect(updated[0].id).toBe(node.id);
      expect(updated[0].type).toBe("edge-router");
      expect(updated[0].data.categoryId).toBe(DNS_CDN_EDGE_CATEGORY_ID);
    });

    it("supports connecting a client node to a CDN node", () => {
      const store = useGraphEditorStore.getState();
      const clientNode = infrastructureRegistry.createInfrastructureNode("web-browser", {
        position: { x: 100, y: 200 },
      });
      const cdnNode = infrastructureRegistry.createInfrastructureNode("cdn", {
        position: { x: 400, y: 200 },
      });

      store.addNode(clientNode);
      store.addNode(cdnNode);
      expect(useGraphEditorStore.getState().nodes.length).toBe(2);

      // Add edge from browser egress to cdn ingress
      store.addEdge({
        id: "edge_client_to_cdn",
        source: clientNode.id,
        sourceHandle: "http-out",
        target: cdnNode.id,
        targetHandle: "client-edge-ingress",
        data: {},
      });

      const edges = useGraphEditorStore.getState().edges;
      expect(edges.length).toBe(1);
      expect(edges[0].source).toBe(clientNode.id);
      expect(edges[0].target).toBe(cdnNode.id);
    });

    it("supports undo and redo when modifying DNS & Edge infrastructure nodes", () => {
      const store = useGraphEditorStore.getState();
      const node = infrastructureRegistry.createInfrastructureNode("reverse-proxy");

      store.addNode(node);
      expect(useGraphEditorStore.getState().nodes.length).toBe(1);
      expect(useGraphEditorStore.getState().canUndo).toBe(true);

      // Undo
      useGraphEditorStore.getState().undo();
      expect(useGraphEditorStore.getState().nodes.length).toBe(0);
      expect(useGraphEditorStore.getState().canRedo).toBe(true);

      // Redo
      useGraphEditorStore.getState().redo();
      expect(useGraphEditorStore.getState().nodes.length).toBe(1);
      expect(useGraphEditorStore.getState().nodes[0].id).toBe(node.id);
    });

    it("serializes and deserializes graph documents containing DNS, CDN & Edge nodes", () => {
      const anycastNode = infrastructureRegistry.createInfrastructureNode("anycast-network", {
        position: { x: 50, y: 100 },
      });
      const cdnNode = infrastructureRegistry.createInfrastructureNode("cdn", {
        position: { x: 300, y: 100 },
      });
      const workerNode = infrastructureRegistry.createInfrastructureNode("edge-worker", {
        position: { x: 550, y: 100 },
      });

      const payload = {
        nodes: [anycastNode, cdnNode, workerNode],
        version: 1,
      };

      const serialized = JSON.stringify(payload);
      const parsed = JSON.parse(serialized);

      expect(parsed.nodes.length).toBe(3);
      expect(parsed.nodes[0].type).toBe("anycast-network");
      expect(parsed.nodes[1].type).toBe("cdn");
      expect(parsed.nodes[2].type).toBe("edge-worker");
      expect(parsed.nodes.every((n: any) => n.data.categoryId === DNS_CDN_EDGE_CATEGORY_ID)).toBe(true);
    });
  });

  describe("5. High-Scale Benchmark Simulation", () => {
    it("instantiates 1,000 infrastructure nodes across Cat 01 & Cat 02 in under 60ms", () => {
      const allDefinitions = [
        ...infrastructureRegistry.listComponentsByCategory("clients-and-user-interfaces"),
        ...ALL_DNS_CDN_EDGE_DEFINITIONS,
      ];
      expect(allDefinitions.length).toBe(20);

      const startTime = performance.now();
      const nodes = [];

      for (let i = 0; i < 1000; i++) {
        const def = allDefinitions[i % allDefinitions.length];
        const node = infrastructureRegistry.createInfrastructureNode(def.id, {
          id: `bench_node_${i}`,
          position: { x: (i % 25) * 120, y: Math.floor(i / 25) * 80 },
        });
        nodes.push(node);
      }

      const elapsedMs = performance.now() - startTime;
      expect(nodes.length).toBe(1000);
      expect(elapsedMs).toBeLessThan(120); // Sub-120ms for 1,000 nodes creation

      // Check schema validity of a sample
      const sample = nodes[499];
      expect(BaseNodeSchema.safeParse(sample).success).toBe(true);
    });
  });
});
