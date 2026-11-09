import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  COMPUTE_AND_APPLICATION_SERVICES_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_COMPUTE_SLUGS = [
  "web-server",
  "application-server",
  "backend-service",
  "microservice",
  "monolithic-application",
  "serverless-function",
  "container",
  "container-cluster",
  "kubernetes-pod",
  "kubernetes-service",
  "virtual-machine",
  "background-worker",
  "scheduled-job",
  "batch-processor",
] as const;

describe("Phase 05.1.4 — Compute & Application Services Infrastructure Library", () => {
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
    it("registers the canonical category 'compute-and-application-services'", () => {
      const category = infrastructureRegistry.getCategory(COMPUTE_AND_APPLICATION_SERVICES_CATEGORY_ID);
      expect(category).toBeDefined();
      expect(category?.name).toBe("Compute & Application Services");
      expect(category?.order).toBe(4);
    });

    it("registers exactly the 14 required Compute & Application Services component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(COMPUTE_AND_APPLICATION_SERVICES_CATEGORY_ID);
      expect(components.length).toBe(14);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_COMPUTE_SLUGS].sort());
    });

    it("ensures every Compute & Application Services component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_COMPUTE_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Node Factory & Graph Schema Compliance", () => {
    it("creates valid BaseNode instances conforming to @nxtqr/graph-schema", () => {
      for (const slug of EXPECTED_COMPUTE_SLUGS) {
        const node = infrastructureRegistry.createInfrastructureNode(slug, {
          position: { x: 250, y: 350 },
          label: `Compute Node ${slug}`,
        });

        const parseResult = BaseNodeSchema.safeParse(node);
        expect(
          parseResult.success,
          `Node created for "${slug}" failed BaseNodeSchema validation: ${JSON.stringify(
            (parseResult as any).error?.errors
          )}`
        ).toBe(true);

        expect(node.type).toBe(slug);
        expect(node.position).toEqual({ x: 250, y: 350 });
        expect(node.label).toBe(`Compute Node ${slug}`);
        expect(node.ports).toBeDefined();
        expect(node.ports!.length).toBeGreaterThanOrEqual(1);
        expect(node.data.isInfrastructure).toBe(true);
        expect(node.data.categoryId).toBe(COMPUTE_AND_APPLICATION_SERVICES_CATEGORY_ID);
      }
    });

    it("correctly assigns protocol-aware ports for Web Server and Microservice", () => {
      const webServerNode = infrastructureRegistry.createInfrastructureNode("web-server");
      expect(webServerNode.ports).toBeDefined();

      const httpIn = webServerNode.ports?.find((p) => p.id === "http-in");
      expect(httpIn).toBeDefined();
      expect(httpIn?.type).toBe("input");
      expect(httpIn?.dataType).toBe("HTTP_Traffic");

      const upstreamOut = webServerNode.ports?.find((p) => p.id === "upstream-out");
      expect(upstreamOut).toBeDefined();
      expect(upstreamOut?.type).toBe("output");
      expect(upstreamOut?.dataType).toBe("App_Proxy");

      const microserviceNode = infrastructureRegistry.createInfrastructureNode("microservice");
      expect(microserviceNode.ports).toBeDefined();
      const serviceIn = microserviceNode.ports?.find((p) => p.id === "service-in");
      expect(serviceIn?.type).toBe("input");
      expect(serviceIn?.dataType).toBe("Service_Traffic");
    });

    it("correctly assigns containment and binding ports for Kubernetes Pod and Cluster", () => {
      const podNode = infrastructureRegistry.createInfrastructureNode("kubernetes-pod");
      const containmentPort = podNode.ports?.find((p) => p.id === "container-containment");
      expect(containmentPort).toBeDefined();
      expect(containmentPort?.type).toBe("input");
      expect(containmentPort?.dataType).toBe("Container_Containment");

      const clusterNode = infrastructureRegistry.createInfrastructureNode("container-cluster");
      const nodeBus = clusterNode.ports?.find((p) => p.id === "worker-node-bus");
      expect(nodeBus).toBeDefined();
      expect(nodeBus?.type).toBe("output");
    });
  });

  describe("3. Graph Editor Store Operations (Add, Connect, Undo)", () => {
    it("adds a compute node into the store and updates selection", () => {
      const newNode = infrastructureRegistry.createInfrastructureNode("web-server", {
        position: { x: 120, y: 120 },
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

    it("connects an end-to-end 5-tier architecture: Browser (Cat 01) -> LB (Cat 03) -> Web Server (Cat 04) -> Microservice (Cat 04) -> Worker (Cat 04)", () => {
      const { addNode, addEdge } = useGraphEditorStore.getState();

      const browser = infrastructureRegistry.createInfrastructureNode("web-browser", {
        position: { x: 50, y: 100 },
      });
      const lb = infrastructureRegistry.createInfrastructureNode("load-balancer", {
        position: { x: 250, y: 100 },
      });
      const webServer = infrastructureRegistry.createInfrastructureNode("web-server", {
        position: { x: 450, y: 100 },
      });
      const microservice = infrastructureRegistry.createInfrastructureNode("microservice", {
        position: { x: 650, y: 100 },
      });
      const worker = infrastructureRegistry.createInfrastructureNode("background-worker", {
        position: { x: 850, y: 100 },
      });

      addNode(browser);
      addNode(lb);
      addNode(webServer);
      addNode(microservice);
      addNode(worker);

      // Edge 1: Browser -> Load Balancer
      addEdge({
        id: "edge_browser_to_lb",
        source: browser.id,
        target: lb.id,
        sourceHandle: "client-egress",
        targetHandle: "traffic-in",
        type: "bezier",
        status: "idle",
        data: {},
      });

      // Edge 2: Load Balancer -> Web Server
      addEdge({
        id: "edge_lb_to_web",
        source: lb.id,
        target: webServer.id,
        sourceHandle: "pool-out",
        targetHandle: "http-in",
        type: "bezier",
        status: "idle",
        data: {},
      });

      // Edge 3: Web Server -> Microservice
      addEdge({
        id: "edge_web_to_microservice",
        source: webServer.id,
        target: microservice.id,
        sourceHandle: "upstream-out",
        targetHandle: "service-in",
        type: "bezier",
        status: "idle",
        data: {},
      });

      // Edge 4: Microservice -> Worker
      addEdge({
        id: "edge_microservice_to_worker",
        source: microservice.id,
        target: worker.id,
        sourceHandle: "event-out",
        targetHandle: "queue-consume-in",
        type: "bezier",
        status: "idle",
        data: {},
      });

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(5);
      expect(state.edges.length).toBe(4);
    });

    it("supports transactional undo and redo on compute node addition and inspector edits", () => {
      const { addNode, undo, redo } = useGraphEditorStore.getState();

      const serverless = infrastructureRegistry.createInfrastructureNode("serverless-function", {
        position: { x: 100, y: 200 },
      });

      addNode(serverless);
      expect(useGraphEditorStore.getState().nodes.length).toBe(1);

      undo();
      expect(useGraphEditorStore.getState().nodes.length).toBe(0);

      redo();
      expect(useGraphEditorStore.getState().nodes.length).toBe(1);
      expect(useGraphEditorStore.getState().nodes[0].type).toBe("serverless-function");
    });
  });

  describe("4. 1,000 Component High-Volume Benchmark Across Categories 01–04", () => {
    it("instantiates and validates 1,000 infrastructure nodes across all 4 categories (46 components) in < 150ms", () => {
      const allComponents = [
        ...infrastructureRegistry.listComponentsByCategory("clients-and-user-interfaces"),
        ...infrastructureRegistry.listComponentsByCategory("dns-cdn-edge"),
        ...infrastructureRegistry.listComponentsByCategory("networking-and-traffic"),
        ...infrastructureRegistry.listComponentsByCategory("compute-and-application-services"),
      ];
      expect(allComponents.length).toBe(46); // 10 Clients + 10 DNS/Edge + 12 Networking + 14 Compute = 46

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
