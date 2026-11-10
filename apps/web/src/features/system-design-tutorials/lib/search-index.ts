import { tutorialRegistry } from "./tutorial-registry";
import { getAllExamples } from "./examples-registry";
import { getAllConcepts } from "./concepts-registry";
import { infrastructureRegistry } from "@nxtqr/node-registry";

export interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: "Component" | "Category" | "Example" | "Concept";
  href: string;
  iconSlug?: string;
  keywords?: readonly string[];
}

// Common tech acronym expansions and synonyms
const ACRONYM_MAP: Record<string, string[]> = {
  lb: ["load-balancer", "layer-4-load-balancer", "layer-7-load-balancer"],
  alb: ["layer-7-load-balancer"],
  nlb: ["layer-4-load-balancer"],
  cdn: ["cdn", "edge-cache"],
  waf: ["web-application-firewall"],
  rag: ["vector-database", "vector-embedding-pipeline", "enterprise-rag-ai"],
  llm: ["model-serving", "agent-orchestrator", "inference-cache", "enterprise-rag-ai"],
  vllm: ["model-serving"],
  gpu: ["gpu-cluster", "model-serving"],
  lora: ["fine-tuning-job", "model-registry"],
  agent: ["agent-orchestrator"],
  guardrail: ["guardrail-proxy"],
  featurestore: ["feature-store"],
  k8s: ["container-cluster", "kubernetes-pod", "kubernetes-service"],
  db: ["relational-database", "postgresql", "mysql", "document-database"],
  sql: ["relational-database", "postgresql", "mysql", "distributed-sql-database"],
  nosql: ["document-database", "wide-column-database", "key-value-database"],
  pubsub: ["message-queue", "message-broker", "pub-sub-topic", "kafka-broker"],
  queue: ["message-queue", "dead-letter-queue", "retry-queue"],
  kafka: ["kafka-broker", "event-stream"],
  redis: ["redis-cache", "in-memory-database"],
  cdc: ["cdc-connector"],
  etl: ["etl-pipeline", "elt-pipeline"],
  mqtt: ["mqtt-broker"],
  ws: ["websocket-server", "websocket-endpoint"],
  grpc: ["grpc-endpoint", "grpc-service"],
  mtls: ["api-gateway", "layer-7-load-balancer", "global-cdn-security"],
  saga: ["saga-orchestrator", "ecommerce-platform"],
  dns: ["authoritative-dns", "dns-resolver", "dns-load-balancing"],
  iam: ["cloud-iam"],
  apm: ["apm-collector", "microservices-service-mesh"],
  tinyurl: ["url-shortener"],
  chat: ["realtime-chat"],
  video: ["video-streaming", "video-transcoder"],
  ecommerce: ["ecommerce-platform"],
  payment: ["payment-processing", "payment-gateway"],
};

export function searchSystemDesign(query: string): SearchResultItem[] {
  if (!query || !query.trim()) {
    return [];
  }

  const rawQ = query.toLowerCase().trim();
  const searchTokens = rawQ.split(/\s+/).filter(Boolean);

  const results: SearchResultItem[] = [];

  // Check if query is an acronym
  const acronymMatches = ACRONYM_MAP[rawQ] || [];

  // 1. Search Components (All 223)
  const allTutorials = tutorialRegistry.getAllComponentTutorials();
  for (const item of allTutorials) {
    const isAcronymHit = acronymMatches.includes(item.id);
    const idMatch = item.id.toLowerCase().includes(rawQ);
    const nameMatch = item.name.toLowerCase().includes(rawQ);
    const shortNameMatch = item.shortName.toLowerCase().includes(rawQ);
    const catMatch = item.categoryName.toLowerCase().includes(rawQ);
    const descMatch = item.tagline.toLowerCase().includes(rawQ);
    const keywordMatch = searchTokens.some((tok) =>
      item.ports.some((p) => p.name.toLowerCase().includes(tok))
    );

    if (isAcronymHit || idMatch || nameMatch || shortNameMatch || catMatch || descMatch || keywordMatch) {
      results.push({
        id: item.id,
        title: item.name,
        subtitle: `${item.categoryName} • ${item.classification}`,
        category: "Component",
        href: `/tutorial/system-design/components/${item.id}`,
        iconSlug: item.iconSlug,
      });
    }
  }

  // 2. Search Categories (All 20)
  const allCategories = infrastructureRegistry.listCategories();
  for (const cat of allCategories) {
    if (cat.name.toLowerCase().includes(rawQ) || cat.description.toLowerCase().includes(rawQ)) {
      results.push({
        id: cat.id,
        title: cat.name,
        subtitle: cat.description,
        category: "Category",
        href: `/tutorial/system-design/categories/${cat.id}`,
      });
    }
  }

  // 3. Search Real-World Examples (12)
  const allExamples = getAllExamples();
  for (const ex of allExamples) {
    const isAcronymHit = acronymMatches.includes(ex.slug);
    const slugMatch = ex.slug.toLowerCase().includes(rawQ);
    const titleMatch = ex.title.toLowerCase().includes(rawQ);
    const subMatch = ex.subtitle.toLowerCase().includes(rawQ);
    const catMatch = ex.category.toLowerCase().includes(rawQ);

    if (isAcronymHit || slugMatch || titleMatch || subMatch || catMatch) {
      results.push({
        id: ex.id,
        title: ex.title,
        subtitle: `${ex.category} • ${ex.difficulty} • ${ex.subtitle}`,
        category: "Example",
        href: `/tutorial/system-design/examples/${ex.slug}`,
      });
    }
  }

  // 4. Search Concepts (6)
  const allConcepts = getAllConcepts();
  for (const c of allConcepts) {
    if (
      c.title.toLowerCase().includes(rawQ) ||
      c.subtitle.toLowerCase().includes(rawQ) ||
      c.slug.toLowerCase().includes(rawQ)
    ) {
      results.push({
        id: c.id,
        title: c.title,
        subtitle: `Core Concept • ${c.readTime}`,
        category: "Concept",
        href: `/tutorial/system-design/concepts/${c.slug}`,
      });
    }
  }

  return results.slice(0, 20);
}
