import { describe, it, expect, beforeEach } from "vitest";
import {
  infrastructureRegistry,
  SECURITY_AND_IDENTITY_CATEGORY_ID,
} from "@nxtqr/node-registry";
import { getInfrastructureIcon } from "@nxtqr/icons";
import { BaseNodeSchema } from "@nxtqr/graph-schema";
import { useGraphEditorStore } from "../store/graph-editor-store";

const EXPECTED_SECURITY_SLUGS = [
  "authentication-service",
  "authorization-service",
  "identity-provider",
  "oauth-provider",
  "openid-connect-provider",
  "api-key-service",
  "secrets-manager",
  "key-management-service",
  "web-application-firewall",
  "ddos-protection",
  "rate-limiter",
  "certificate-authority",
  "token-service",
  "policy-engine",
] as const;

describe("Phase 05.1.9 — Security & Identity Infrastructure Library", () => {
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
    it("registers the canonical category 'security-and-identity'", () => {
      const category = infrastructureRegistry.getCategory(
        SECURITY_AND_IDENTITY_CATEGORY_ID
      );
      expect(category).toBeDefined();
      expect(category?.name).toBe("Security & Identity");
      expect(category?.order).toBe(9);
    });

    it("registers exactly the 14 required Security & Identity component definitions", () => {
      const components = infrastructureRegistry.listComponentsByCategory(
        SECURITY_AND_IDENTITY_CATEGORY_ID
      );
      expect(components.length).toBe(14);

      const registeredSlugs = components.map((c) => c.id).sort();
      expect(registeredSlugs).toEqual([...EXPECTED_SECURITY_SLUGS].sort());
    });

    it("ensures every Security component has an icon mapped via getInfrastructureIcon", () => {
      for (const slug of EXPECTED_SECURITY_SLUGS) {
        const Icon = getInfrastructureIcon(slug);
        expect(Icon, `Icon for ${slug} must be registered`).toBeDefined();
        expect(typeof Icon).toBe("function");
      }
    });
  });

  describe("2. Default Configuration & Zod Schemas", () => {
    it("validates all 14 components against their respective Zod config schemas", () => {
      for (const slug of EXPECTED_SECURITY_SLUGS) {
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

    it("ensures no plaintext passwords, raw private keys, or credentials exist in default configs", () => {
      for (const slug of EXPECTED_SECURITY_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        const serialized = JSON.stringify(def.defaultConfig).toLowerCase();
        expect(serialized).not.toContain("rawpassword");
        expect(serialized).not.toContain("clientsecret");
        expect(serialized).not.toContain("privatekey");
        expect(serialized).not.toContain("bearer eyj");
      }
    });
  });

  describe("3. Security Connection Semantics & Port Topology", () => {
    it("defines protocol-accurate input and output ports for every security component", () => {
      for (const slug of EXPECTED_SECURITY_SLUGS) {
        const def = infrastructureRegistry.getComponent(slug);
        expect(def).toBeDefined();
        if (!def) continue;

        expect(def.ports.length).toBeGreaterThanOrEqual(2);
        const inputs = def.ports.filter((p) => p.type === "input");
        const outputs = def.ports.filter((p) => p.type === "output");
        expect(inputs.length, `${slug} must have at least one input port`).toBeGreaterThanOrEqual(1);
        expect(outputs.length, `${slug} must have at least one output port`).toBeGreaterThanOrEqual(1);

        for (const port of def.ports) {
          expect(port.dataType).toBeDefined();
          expect(port.description).toBeDefined();
        }
      }
    });

    it("verifies OAuth Provider and OpenID Connect Provider have distinct connection ports", () => {
      const oauth = infrastructureRegistry.getComponent("oauth-provider");
      const oidc = infrastructureRegistry.getComponent("openid-connect-provider");
      expect(oauth).toBeDefined();
      expect(oidc).toBeDefined();

      const oauthPortIds = oauth?.ports.map((p) => p.id);
      const oidcPortIds = oidc?.ports.map((p) => p.id);

      expect(oauthPortIds).toContain("oauth-authorize-in");
      expect(oauthPortIds).toContain("oauth-token-out");
      expect(oidcPortIds).toContain("id-token-out");
      expect(oidcPortIds).toContain("jwks-out");
      expect(oidcPortIds).toContain("userinfo-out");
    });

    it("verifies Secrets Manager and KMS have distinct cryptographic ports", () => {
      const secrets = infrastructureRegistry.getComponent("secrets-manager");
      const kms = infrastructureRegistry.getComponent("key-management-service");
      expect(secrets).toBeDefined();
      expect(kms).toBeDefined();

      const secretsPortIds = secrets?.ports.map((p) => p.id);
      const kmsPortIds = kms?.ports.map((p) => p.id);

      expect(secretsPortIds).toContain("secret-fetch-in");
      expect(secretsPortIds).toContain("secret-payload-out");
      expect(kmsPortIds).toContain("crypto-op-in");
      expect(kmsPortIds).toContain("public-key-out");
    });
  });

  describe("4. Graph Editor Store & React Flow Node Lifecycle", () => {
    it("creates BaseNode instances for every security component and verifies schema compliance", () => {
      for (const slug of EXPECTED_SECURITY_SLUGS) {
        const node = infrastructureRegistry.createInfrastructureNode(slug, {
          position: { x: 100, y: 150 },
          label: `Primary ${slug}`,
          environment: "production",
        });

        expect(node.id).toBeDefined();
        expect(node.type).toBe(slug);
        expect(node.data.componentType).toBe(slug);
        expect(node.data.isInfrastructure).toBe(true);

        const schemaValidation = BaseNodeSchema.safeParse(node);
        expect(
          schemaValidation.success,
          `BaseNode schema failed for ${slug}: ${
            !schemaValidation.success ? JSON.stringify(schemaValidation.error) : ""
          }`
        ).toBe(true);
      }
    });

    it("adds, selects, and removes Security components in the graph store", () => {
      const store = useGraphEditorStore.getState();

      const wafNode = infrastructureRegistry.createInfrastructureNode("web-application-firewall", {
        position: { x: 50, y: 50 },
      });
      const authNode = infrastructureRegistry.createInfrastructureNode("authentication-service", {
        position: { x: 250, y: 50 },
      });

      store.addNode(wafNode);
      store.addNode(authNode);

      let state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(2);

      store.selectNode(wafNode.id, false);
      state = useGraphEditorStore.getState();
      expect(state.selectedNodeIds).toEqual([wafNode.id]);

      store.deleteNodeById(wafNode.id);
      state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(1);
      expect(state.nodes[0].id).toBe(authNode.id);
    });

    it("connects a full security architecture pipeline in the graph store", () => {
      const store = useGraphEditorStore.getState();

      const ddos = infrastructureRegistry.createInfrastructureNode("ddos-protection", {
        position: { x: 0, y: 0 },
      });
      const waf = infrastructureRegistry.createInfrastructureNode("web-application-firewall", {
        position: { x: 200, y: 0 },
      });
      const rateLimiter = infrastructureRegistry.createInfrastructureNode("rate-limiter", {
        position: { x: 400, y: 0 },
      });
      const auth = infrastructureRegistry.createInfrastructureNode("authentication-service", {
        position: { x: 600, y: 0 },
      });

      store.addNode(ddos);
      store.addNode(waf);
      store.addNode(rateLimiter);
      store.addNode(auth);

      store.addEdge({
        id: "edge_ddos_waf",
        source: ddos.id,
        target: waf.id,
        sourceHandle: "clean-traffic-out",
        targetHandle: "waf-http-in",
        type: "smoothstep",
        data: {},
      });

      store.addEdge({
        id: "edge_waf_rate",
        source: waf.id,
        target: rateLimiter.id,
        sourceHandle: "waf-http-out",
        targetHandle: "traffic-meter-in",
        type: "smoothstep",
        data: {},
      });

      store.addEdge({
        id: "edge_rate_auth",
        source: rateLimiter.id,
        target: auth.id,
        sourceHandle: "traffic-forward-out",
        targetHandle: "auth-req-in",
        type: "smoothstep",
        data: {},
      });

      const state = useGraphEditorStore.getState();
      expect(state.nodes.length).toBe(4);
      expect(state.edges.length).toBe(3);
    });
  });
});
