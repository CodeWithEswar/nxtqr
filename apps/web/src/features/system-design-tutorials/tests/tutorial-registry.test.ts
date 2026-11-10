import { describe, it, expect } from "vitest";
import { tutorialRegistry } from "../lib/tutorial-registry";
import { getAllExamples, getExampleBySlug, getExamplesForComponent } from "../lib/examples-registry";
import { getAllConcepts, getConceptBySlug } from "../lib/concepts-registry";
import { searchSystemDesign } from "../lib/search-index";
import { GraphDocumentSchema, BaseNodeSchema, BaseEdgeSchema } from "@nxtqr/graph-schema";
import { infrastructureRegistry } from "@nxtqr/node-registry";

describe("System Design Tutorial Registry", () => {
  it("indexes all infrastructure components from the node registry", () => {
    const tutorials = tutorialRegistry.getAllComponentTutorials();
    const registeredCount = infrastructureRegistry.listComponents().length;
    expect(tutorials.length).toBe(registeredCount);
    expect(tutorials.length).toBeGreaterThanOrEqual(200);
  });

  it("ensures every component tutorial has valid structure and preview scenarios", () => {
    const tutorials = tutorialRegistry.getAllComponentTutorials();

    for (const t of tutorials) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.shortName).toBeTruthy();
      expect(t.categoryId).toBeTruthy();
      expect(t.categoryName).toBeTruthy();
      expect(t.tagline).toBeTruthy();
      expect(t.problemSolved).toBeTruthy();
      expect(t.ports.length).toBeGreaterThanOrEqual(1);

      // Verify all 3 preview scenarios
      expect(t.previewNodes.isolated.length).toBeGreaterThanOrEqual(1);
      expect(t.previewNodes.connected.length).toBeGreaterThanOrEqual(3);
      expect(t.previewNodes.architecture.length).toBeGreaterThanOrEqual(4);

      // Validate preview nodes schema
      for (const node of t.previewNodes.connected) {
        expect(() => BaseNodeSchema.parse(node)).not.toThrow();
      }
      for (const edge of t.previewEdges.connected) {
        expect(() => BaseEdgeSchema.parse(edge)).not.toThrow();
      }
    }
  });

  it("groups components into all canonical infrastructure categories", () => {
    const groups = tutorialRegistry.getAllCategoriesWithCounts();
    const registeredCats = infrastructureRegistry.listCategories().length;
    expect(groups.length).toBe(registeredCats);

    let totalCount = 0;
    for (const g of groups) {
      expect(g.count).toBeGreaterThan(0);
      expect(g.components.length).toBe(g.count);
      totalCount += g.count;
    }
    expect(totalCount).toBe(infrastructureRegistry.listComponents().length);
  });

  it("retrieves individual components by id", () => {
    const lb = tutorialRegistry.getComponentTutorial("load-balancer");
    expect(lb).toBeDefined();
    expect(lb?.name).toBe("Load Balancer");
    expect(lb?.categoryId).toBe("networking-and-traffic");
    expect(lb?.tradeoffs.length).toBeGreaterThanOrEqual(1);
    expect(lb?.failureModes.length).toBeGreaterThanOrEqual(1);

    const k8s = tutorialRegistry.getComponentTutorial("container-cluster");
    expect(k8s).toBeDefined();
    expect(k8s?.categoryId).toBe("compute-and-application-services");
  });

  it("verifies all 12 architecture examples parse with valid GraphDocumentSchema", () => {
    const examples = getAllExamples();
    expect(examples.length).toBe(12);

    for (const ex of examples) {
      expect(ex.id).toBeTruthy();
      expect(ex.slug).toBeTruthy();
      expect(ex.title).toBeTruthy();
      expect(ex.flowSteps.length).toBeGreaterThanOrEqual(3);
      expect(ex.keyDecisions.length).toBeGreaterThanOrEqual(1);
      expect(ex.tradeoffs.length).toBeGreaterThanOrEqual(1);

      // Validate entire graph document against schema
      expect(() => GraphDocumentSchema.parse(ex.graphDocument)).not.toThrow();
      expect(ex.graphDocument.nodes.length).toBeGreaterThanOrEqual(5);
      expect(ex.graphDocument.edges.length).toBeGreaterThanOrEqual(4);
    }
  });

  it("resolves architecture examples by slug and component", () => {
    const tinyurl = getExampleBySlug("url-shortener");
    expect(tinyurl).toBeDefined();
    expect(tinyurl?.title).toContain("TinyURL");

    const chat = getExampleBySlug("realtime-chat");
    expect(chat).toBeDefined();

    const relatedExamples = getExamplesForComponent("layer-7-load-balancer");
    expect(relatedExamples.length).toBeGreaterThanOrEqual(1);
  });

  it("indexes and retrieves all 6 core concepts", () => {
    const concepts = getAllConcepts();
    expect(concepts.length).toBe(6);

    const cap = getConceptBySlug("cap-theorem");
    expect(cap).toBeDefined();
    expect(cap?.sections.length).toBeGreaterThanOrEqual(3);

    const idemp = getConceptBySlug("idempotency");
    expect(idemp).toBeDefined();
  });

  it("performs fast fuzzy search and acronym resolution", () => {
    // Search acronyms
    const lbResults = searchSystemDesign("lb");
    expect(lbResults.length).toBeGreaterThan(0);
    expect(lbResults.some((r) => r.id === "load-balancer" || r.id === "layer-7-load-balancer")).toBe(true);

    const ragResults = searchSystemDesign("rag");
    expect(ragResults.length).toBeGreaterThan(0);
    expect(ragResults.some((r) => r.id === "vector-database" || r.id === "enterprise-rag-ai")).toBe(true);

    const kafkaResults = searchSystemDesign("kafka");
    expect(kafkaResults.length).toBeGreaterThan(0);
    expect(kafkaResults.some((r) => r.id === "kafka-broker")).toBe(true);

    // Search blueprint titles
    const tinyurlResults = searchSystemDesign("tinyurl");
    expect(tinyurlResults.some((r) => r.id === "url-shortener")).toBe(true);
  });
});
