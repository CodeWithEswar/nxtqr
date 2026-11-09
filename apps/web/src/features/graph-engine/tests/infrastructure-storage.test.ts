import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  STORAGE_AND_FILE_SYSTEMS_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_STORAGE_SLUGS = [
  "object-storage",
  "block-storage",
  "file-storage",
  "distributed-file-system",
  "blob-storage",
  "media-storage",
  "backup-storage",
  "archive-storage",
  "storage-gateway",
  "content-repository",
] as const;

describe("Phase 05.1.8 — Storage & File Systems Infrastructure Library", () => {
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
    it("registers the canonical category 'storage-and-file-systems'", () => {
      const category = infrastructureRegistry.getCategory(
        STORAGE_AND_FILE_SYSTEMS_CATEGORY_ID
      );
      expect(category).toBeDefined();
      expect(category?.name).toBe("Storage & File Systems");
      expect(category?.order).toBe(8);
    });

    it("registers exactly the 10 required Storage & File Systems component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(
        STORAGE_AND_FILE_SYSTEMS_CATEGORY_ID
      );
      expect(components.length).toBe(10);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_STORAGE_SLUGS].sort());
    });

    it("ensures every Storage component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_STORAGE_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Node Factory & Graph Schema Compliance", () => {
    it("creates compliant BaseNode instances for all 10 component types", () => {
      EXPECTED_STORAGE_SLUGS.forEach((slug, index) => {
        const node = infrastructureRegistry.createInfrastructureNode(slug, {
          position: { x: index * 120, y: index * 80 },
        });

        expect(node.id).toBeDefined();
        expect(node.type).toBe(slug);
        expect(node.data.isInfrastructure).toBe(true);
        expect(node.data.categoryId).toBe(STORAGE_AND_FILE_SYSTEMS_CATEGORY_ID);
        expect(node.data.componentType).toBe(slug);
        expect(node.data.environment).toBe("production");
        expect(node.ports?.length).toBeGreaterThanOrEqual(2);

        const parseResult = BaseNodeSchema.safeParse(node);
        expect(
          parseResult.success,
          `Node for ${slug} must pass BaseNodeSchema: ${
            !parseResult.success ? JSON.stringify(parseResult.error) : ""
          }`
        ).toBe(true);
      });
    });
  });

  describe("3. Zustand Graph Store Lifecycle", () => {
    it("adds and selects an Object Storage component node in store", () => {
      const node = infrastructureRegistry.createInfrastructureNode("object-storage", {
        position: { x: 300, y: 200 },
      });

      const store = useGraphEditorStore.getState();
      store.addNode(node);
      store.selectNode(node.id, false);

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(1);
      expect(state.nodes[0].id).toBe(node.id);
      expect(state.nodes[0].type).toBe("object-storage");
      expect(state.selectedNodeIds).toContain(node.id);
    });

    it("updates Storage component configuration data through store action", () => {
      const node = infrastructureRegistry.createInfrastructureNode("block-storage", {
        position: { x: 100, y: 100 },
      });

      const store = useGraphEditorStore.getState();
      store.addNode(node);

      store.updateNodeConfig(node.id, {
        data: {
          capacityGb: 2048,
          provisionedIops: 16000,
        },
      });

      const updated = useGraphEditorStore.getState().nodes.find((n) => n.id === node.id);
      expect(updated?.data.capacityGb).toBe(2048);
      expect(updated?.data.provisionedIops).toBe(16000);
    });
  });

  describe("4. Storage Architecture Topologies", () => {
    it("assembles an Object Storage Lifecycle Archival Architecture (App Server -> Object Storage -> Archive Storage)", () => {
      const appServer = infrastructureRegistry.createInfrastructureNode("application-server", {
        position: { x: 100, y: 200 },
      });
      const objectStorage = infrastructureRegistry.createInfrastructureNode("object-storage", {
        position: { x: 350, y: 200 },
      });
      const archiveStorage = infrastructureRegistry.createInfrastructureNode("archive-storage", {
        position: { x: 600, y: 200 },
      });

      const store = useGraphEditorStore.getState();
      store.addNode(appServer);
      store.addNode(objectStorage);
      store.addNode(archiveStorage);

      // 1. App Server -> Object Storage (PUT upload)
      store.addEdge({
        id: "edge_app_to_s3",
        source: appServer.id,
        sourceHandle: "api-out",
        target: objectStorage.id,
        targetHandle: "object-in",
        data: {},
      });

      // 2. Object Storage -> Archive Storage (Cold Tier Transition)
      store.addEdge({
        id: "edge_s3_to_archive",
        source: objectStorage.id,
        sourceHandle: "lifecycle-out",
        target: archiveStorage.id,
        targetHandle: "archive-in",
        data: {},
      });

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(3);
      expect(state.edges.length).toBe(2);
    });

    it("assembles a Block Volume Snapshot & Backup Pipeline (VM -> Block Storage -> Backup Storage)", () => {
      const vm = infrastructureRegistry.createInfrastructureNode("virtual-machine", {
        position: { x: 100, y: 150 },
      });
      const blockStorage = infrastructureRegistry.createInfrastructureNode("block-storage", {
        position: { x: 350, y: 150 },
      });
      const backupStorage = infrastructureRegistry.createInfrastructureNode("backup-storage", {
        position: { x: 600, y: 150 },
      });

      const store = useGraphEditorStore.getState();
      store.addNode(vm);
      store.addNode(blockStorage);
      store.addNode(backupStorage);

      // 1. VM -> Block Storage Attachment
      store.addEdge({
        id: "edge_vm_to_block",
        source: vm.id,
        sourceHandle: "egress-out",
        target: blockStorage.id,
        targetHandle: "block-attach-in",
        data: {},
      });

      // 2. Block Storage -> Backup Storage (Snapshot Feed)
      store.addEdge({
        id: "edge_block_to_backup",
        source: blockStorage.id,
        sourceHandle: "snapshot-out",
        target: backupStorage.id,
        targetHandle: "backup-source-in",
        data: {},
      });

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(3);
      expect(state.edges.length).toBe(2);
    });

    it("assembles a Hybrid Storage Gateway topology (NFS Client -> Storage Gateway -> S3 Backend)", () => {
      const client = infrastructureRegistry.createInfrastructureNode("cli-client", {
        position: { x: 80, y: 220 },
      });
      const gateway = infrastructureRegistry.createInfrastructureNode("storage-gateway", {
        position: { x: 320, y: 220 },
      });
      const s3 = infrastructureRegistry.createInfrastructureNode("object-storage", {
        position: { x: 580, y: 220 },
      });

      const store = useGraphEditorStore.getState();
      store.addNode(client);
      store.addNode(gateway);
      store.addNode(s3);

      // 1. Client -> Gateway (NFS / SMB local mount)
      store.addEdge({
        id: "edge_client_to_gateway",
        source: client.id,
        sourceHandle: "client-egress",
        target: gateway.id,
        targetHandle: "client-protocol-in",
        data: {},
      });

      // 2. Gateway -> S3 Backend (REST HTTPS sync)
      store.addEdge({
        id: "edge_gateway_to_s3",
        source: gateway.id,
        sourceHandle: "backend-cloud-out",
        target: s3.id,
        targetHandle: "object-in",
        data: {},
      });

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(3);
      expect(state.edges.length).toBe(2);
    });

    it("verifies multi-category coexistence across Categories 01–08 (95 components total)", () => {
      const allComponents = [
        ...infrastructureRegistry.listComponentsByCategory("clients-and-user-interfaces"),
        ...infrastructureRegistry.listComponentsByCategory("dns-cdn-edge"),
        ...infrastructureRegistry.listComponentsByCategory("networking-and-traffic"),
        ...infrastructureRegistry.listComponentsByCategory("compute-and-application-services"),
        ...infrastructureRegistry.listComponentsByCategory("databases-and-persistence"),
        ...infrastructureRegistry.listComponentsByCategory("caching-and-performance"),
        ...infrastructureRegistry.listComponentsByCategory("messaging-and-event-systems"),
        ...infrastructureRegistry.listComponentsByCategory(STORAGE_AND_FILE_SYSTEMS_CATEGORY_ID),
      ];

      // 10 (clients) + 10 (dns/cdn) + 12 (network) + 14 (compute) + 15 (db) + 10 (cache) + 14 (messaging) + 10 (storage) = 95
      expect(allComponents.length).toBe(95);

      const uniqueSlugs = new Set(allComponents.map((c) => c.id));
      expect(uniqueSlugs.size).toBe(95);
    });
  });
});
