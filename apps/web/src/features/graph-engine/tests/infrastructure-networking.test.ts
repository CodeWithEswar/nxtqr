import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  NETWORKING_AND_TRAFFIC_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_NETWORKING_SLUGS = [
  "load-balancer",
  "layer-4-load-balancer",
  "layer-7-load-balancer",
  "api-gateway",
  "ingress-controller",
  "forward-proxy",
  "nat-gateway",
  "vpc",
  "subnet",
  "service-discovery",
  "service-mesh",
  "network-firewall",
] as const;

describe("Phase 05.1.3 — Networking & Traffic Infrastructure Library", () => {
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
    it("registers the canonical category 'networking-and-traffic'", () => {
      const category = infrastructureRegistry.getCategory(NETWORKING_AND_TRAFFIC_CATEGORY_ID);
      expect(category).toBeDefined();
      expect(category?.name).toBe("Networking & Traffic");
      expect(category?.order).toBe(3);
    });

    it("registers exactly the 12 required Networking & Traffic component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(NETWORKING_AND_TRAFFIC_CATEGORY_ID);
      expect(components.length).toBe(12);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_NETWORKING_SLUGS].sort());
    });

    it("ensures every Networking & Traffic component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_NETWORKING_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Node Factory & Graph Schema Compliance", () => {
    it("creates valid BaseNode instances conforming to @nxtqr/graph-schema", () => {
      for (const slug of EXPECTED_NETWORKING_SLUGS) {
        const node = infrastructureRegistry.createInfrastructureNode(slug, {
          position: { x: 200, y: 300 },
          label: `Network Node ${slug}`,
        });

        const parseResult = BaseNodeSchema.safeParse(node);
        expect(
          parseResult.success,
          `Node created for "${slug}" failed BaseNodeSchema validation: ${JSON.stringify(
            (parseResult as any).error?.errors
          )}`
        ).toBe(true);

        expect(node.type).toBe(slug);
        expect(node.position).toEqual({ x: 200, y: 300 });
        expect(node.label).toBe(`Network Node ${slug}`);
        expect(node.ports).toBeDefined();
        expect(node.ports!.length).toBeGreaterThanOrEqual(1);
        expect(node.data.isInfrastructure).toBe(true);
        expect(node.data.categoryId).toBe(NETWORKING_AND_TRAFFIC_CATEGORY_ID);
      }
    });

    it("correctly assigns protocol-aware ports with data types for API Gateway", () => {
      const gatewayNode = infrastructureRegistry.createInfrastructureNode("api-gateway");
      expect(gatewayNode.ports).toBeDefined();

      const clientIn = gatewayNode.ports?.find((p) => p.id === "client-api-in");
      expect(clientIn).toBeDefined();
      expect(clientIn?.type).toBe("input");
      expect(clientIn?.dataType).toBe("API_Call");

      const upstreamOut = gatewayNode.ports?.find((p) => p.id === "upstream-service-out");
      expect(upstreamOut).toBeDefined();
      expect(upstreamOut?.type).toBe("output");
      expect(upstreamOut?.dataType).toBe("Internal_RPC");
    });

    it("correctly assigns ports for VPC and Subnets", () => {
      const vpcNode = infrastructureRegistry.createInfrastructureNode("vpc");
      const igwPort = vpcNode.ports?.find((p) => p.id === "igw-conn");
      expect(igwPort).toBeDefined();
      expect(igwPort?.dataType).toBe("Internet_Gateway");

      const subnetNode = infrastructureRegistry.createInfrastructureNode("subnet");
      const vpcParentPort = subnetNode.ports?.find((p) => p.id === "vpc-parent-in");
      expect(vpcParentPort).toBeDefined();
      expect(vpcParentPort?.type).toBe("input");
    });
  });

  describe("3. Graph Editor Store Operations (Add, Connect, Undo)", () => {
    it("adds a networking node into the store and updates selection", () => {
      const newNode = infrastructureRegistry.createInfrastructureNode("load-balancer", {
        position: { x: 100, y: 100 },
      });

      const { addNode, selectNode } = useGraphEditorStore.getState();
      addNode(newNode);
      selectNode(newNode.id, false);

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(1);
      expect(state.nodes[0].id).toBe(newNode.id);
      expect(state.selectedNodeIds).toEqual([newNode.id]);
      expect(state.canUndo).toBe(true);
    });

    it("connects an Anycast Network (Cat 02) to a Load Balancer (Cat 03) to an API Gateway", () => {
      const { addNode, addEdge } = useGraphEditorStore.getState();

      const anycast = infrastructureRegistry.createInfrastructureNode("anycast-network", {
        position: { x: 50, y: 50 },
      });
      const lb = infrastructureRegistry.createInfrastructureNode("load-balancer", {
        position: { x: 250, y: 50 },
      });
      const apiGw = infrastructureRegistry.createInfrastructureNode("api-gateway", {
        position: { x: 450, y: 50 },
      });

      addNode(anycast);
      addNode(lb);
      addNode(apiGw);

      addEdge({
        id: "edge_anycast_to_lb",
        source: anycast.id,
        target: lb.id,
        sourceHandle: "anycast-pop-egress",
        targetHandle: "traffic-in",
        type: "bezier",
        status: "idle",
        data: {},
      });

      addEdge({
        id: "edge_lb_to_gateway",
        source: lb.id,
        target: apiGw.id,
        sourceHandle: "pool-out",
        targetHandle: "client-api-in",
        type: "bezier",
        status: "idle",
        data: {},
      });

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(3);
      expect(state.edges.length).toBe(2);
    });

    it("supports transactional undo and redo on networking node mutations", () => {
      const { addNode, undo, redo } = useGraphEditorStore.getState();

      const mesh = infrastructureRegistry.createInfrastructureNode("service-mesh", {
        position: { x: 100, y: 200 },
      });

      addNode(mesh);
      expect(useGraphEditorStore.getState().nodes.length).toBe(1);

      undo();
      expect(useGraphEditorStore.getState().nodes.length).toBe(0);

      redo();
      expect(useGraphEditorStore.getState().nodes.length).toBe(1);
      expect(useGraphEditorStore.getState().nodes[0].type).toBe("service-mesh");
    });
  });

  describe("4. 1,000 Component High-Volume Benchmark", () => {
    it("instantiates and validates 1,000 infrastructure nodes across all 3 categories in < 150ms", () => {
      const allComponents = [
        ...infrastructureRegistry.listComponentsByCategory("clients-and-user-interfaces"),
        ...infrastructureRegistry.listComponentsByCategory("dns-cdn-edge"),
        ...infrastructureRegistry.listComponentsByCategory("networking-and-traffic"),
      ];
      expect(allComponents.length).toBe(32); // 10 Clients + 10 DNS/Edge + 12 Networking = 32

      const start = performance.now();
      const generatedNodes: any[] = [];

      for (let i = 0; i < 1000; i++) {
        const comp = allComponents[i % allComponents.length];
        const node = infrastructureRegistry.createInfrastructureNode(comp.id, {
          position: { x: (i % 50) * 200, y: Math.floor(i / 50) * 120 },
          label: `Bench ${comp.display.shortName} #${i}`,
        });
        generatedNodes.push(node);
      }

      const duration = performance.now() - start;
      expect(generatedNodes.length).toBe(1000);
      expect(duration).toBeLessThan(150); // High-performance throughput requirement
    });
  });
});
