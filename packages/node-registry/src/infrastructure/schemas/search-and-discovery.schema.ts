import { z } from "zod";
import { SharedInfrastructureConfigSchema } from "./clients.schema";

// 01 — Search Engine
export const SearchEngineConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("search-engine"),
  searchBackendCategory: z
    .enum(["opensearch", "elasticsearch", "solr", "meilisearch", "typesense", "vespa"])
    .default("opensearch"),
  queryCapabilities: z
    .array(z.enum(["keyword", "full-text", "faceted", "fuzzy", "hybrid", "vector"]))
    .default(["keyword", "full-text", "faceted"]),
  rankingStrategy: z
    .enum(["bm25", "tfidf", "learning-to-rank", "vector-cosine", "hybrid-reciprocal-rank-fusion"])
    .default("bm25"),
  shardCount: z.number().int().min(1).max(128).default(5),
  replicaCount: z.number().int().min(0).max(10).default(1),
  queryTimeoutMs: z.number().int().min(50).max(30000).default(1000),
  consistencyAssumption: z
    .enum(["near-real-time", "eventual-consistency", "strict-serializable"])
    .default("near-real-time"),
  queryRateAssumption: z.string().default("5000 queries/sec"),
  targetP95LatencyMs: z.number().int().min(1).max(10000).default(45),
});
export type SearchEngineConfig = z.infer<typeof SearchEngineConfigSchema>;

// 02 — Full-Text Search Index
export const FullTextSearchIndexConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("full-text-search-index"),
  indexName: z.string().min(1).default("articles_v1"),
  analyzerStrategy: z
    .enum(["standard", "custom-ngram", "whitespace", "language-specific", "icu-tokenizer"])
    .default("standard"),
  tokenization: z
    .enum(["word-boundary", "character-ngram", "edge-ngram", "whitespace-only"])
    .default("word-boundary"),
  stopwordHandling: z.boolean().default(true),
  stemming: z
    .enum(["porter", "kstem", "snowball", "lemmatization", "disabled"])
    .default("porter"),
  languageConfiguration: z
    .enum(["english", "multilingual", "cjk", "spanish", "german"])
    .default("english"),
  refreshIntervalSeconds: z.number().int().min(1).max(300).default(1),
  shardCount: z.number().int().min(1).max(128).default(3),
  replicaCount: z.number().int().min(0).max(10).default(1),
  assumedDocumentCount: z.number().int().min(1).max(1000000000).default(5000000),
});
export type FullTextSearchIndexConfig = z.infer<typeof FullTextSearchIndexConfigSchema>;

// 03 — Search Indexer
export const SearchIndexerConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("search-indexer"),
  ingestionMode: z
    .enum(["batch-bulk", "streaming-cdc", "scheduled-poll", "event-driven"])
    .default("streaming-cdc"),
  batchSize: z.number().int().min(10).max(50000).default(1000),
  refreshStrategy: z
    .enum(["near-real-time-commit", "wait-for-refresh", "async-periodic"])
    .default("near-real-time-commit"),
  transformationPipeline: z
    .enum(["json-enrichment", "text-extraction", "denormalization", "pass-through"])
    .default("denormalization"),
  maxRetryAttempts: z.number().int().min(0).max(10).default(3),
  backoffMultiplier: z.number().min(1).max(5).default(2),
  deadLetterDestination: z
    .enum(["dlq-queue", "s3-failed-payloads", "error-log-only", "abort-pipeline"])
    .default("dlq-queue"),
  indexingRateAssumption: z.string().default("10000 docs/sec"),
});
export type SearchIndexerConfig = z.infer<typeof SearchIndexerConfigSchema>;

// 04 — Autocomplete Service
export const AutocompleteServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("autocomplete-service"),
  suggestionSource: z
    .enum(["prefix-completion-index", "trie-memory-store", "search-engine-suggester", "n-gram-table"])
    .default("prefix-completion-index"),
  prefixMatchingStrategy: z
    .enum(["edge-ngram", "prefix-query", "fuzzy-prefix", "completion-suggester"])
    .default("completion-suggester"),
  minQueryLength: z.number().int().min(1).max(10).default(2),
  maxSuggestions: z.number().int().min(1).max(20).default(5),
  rankingStrategy: z
    .enum(["popularity-weighted", "exact-match-first", "recency-boosted", "personalized"])
    .default("popularity-weighted"),
  debounceMs: z.number().int().min(0).max(1000).default(150),
  cacheEnabled: z.boolean().default(true),
  targetResponseTimeMs: z.number().int().min(1).max(500).default(15),
});
export type AutocompleteServiceConfig = z.infer<typeof AutocompleteServiceConfigSchema>;

// 05 — Recommendation Engine
export const RecommendationEngineConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("recommendation-engine"),
  recommendationApproach: z
    .enum(["collaborative-filtering", "content-based", "hybrid-ensemble", "rule-based", "two-tower-dnn"])
    .default("hybrid-ensemble"),
  inputSignals: z
    .array(z.enum(["click-history", "purchase-events", "dwell-time", "search-queries", "user-demographics"]))
    .default(["click-history", "search-queries", "purchase-events"]),
  candidateGenerationStrategy: z
    .enum(["approximate-nearest-neighbors", "inverted-index-retrieval", "matrix-factorization", "popularity-baseline"])
    .default("approximate-nearest-neighbors"),
  rankingModel: z
    .enum(["gradient-boosted-trees", "logistic-regression", "deep-ranking-network", "rule-priority"])
    .default("gradient-boosted-trees"),
  coldStartHandling: z
    .enum(["popularity-fallback", "category-exploration", "attribute-matching", "bandit-algorithm"])
    .default("popularity-fallback"),
  feedbackLoop: z
    .enum(["real-time-streaming", "hourly-batch", "daily-retraining"])
    .default("real-time-streaming"),
  maxRecommendations: z.number().int().min(1).max(100).default(10),
  recommendationRateAssumption: z.string().default("2500 req/sec"),
});
export type RecommendationEngineConfig = z.infer<typeof RecommendationEngineConfigSchema>;

// 06 — Discovery Service
export const DiscoveryServiceConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("discovery-service"),
  discoveryDomain: z
    .enum(["content-catalog", "api-marketplace", "enterprise-assets", "media-library", "knowledge-base"])
    .default("content-catalog"),
  discoveryStrategy: z
    .enum(["faceted-drilldown", "semantic-clustering", "tag-hierarchy", "curated-collections"])
    .default("faceted-drilldown"),
  filteringRules: z
    .array(z.enum(["geo-availability", "user-entitlements", "content-rating", "active-status"]))
    .default(["user-entitlements", "active-status"]),
  refreshIntervalSeconds: z.number().int().min(5).max(86400).default(60),
  cacheStrategy: z
    .enum(["edge-cached", "in-memory-lru", "redis-distributed", "no-cache"])
    .default("edge-cached"),
  resourceCountAssumption: z.number().int().min(1).max(10000000).default(250000),
});
export type DiscoveryServiceConfig = z.infer<typeof DiscoveryServiceConfigSchema>;

// 07 — Search Cache
export const SearchCacheConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("search-cache"),
  cacheScope: z
    .enum(["full-query-response", "shard-request-cache", "filter-bitset-cache", "field-data-cache"])
    .default("full-query-response"),
  cacheKeyStrategy: z
    .enum(["normalized-query-hash", "exact-raw-string", "ast-semantic-canonical"])
    .default("normalized-query-hash"),
  ttlSeconds: z.number().int().min(1).max(604800).default(300),
  invalidationStrategy: z
    .enum(["time-to-live", "index-commit-flush", "tag-based-eviction", "explicit-api"])
    .default("index-commit-flush"),
  maxEntriesAssumption: z.number().int().min(100).max(50000000).default(500000),
  staleResponsePolicy: z
    .enum(["serve-stale-while-revalidate", "strict-reject", "bypass-to-origin"])
    .default("serve-stale-while-revalidate"),
  targetHitRatePercent: z.number().min(0).max(100).default(65),
});
export type SearchCacheConfig = z.infer<typeof SearchCacheConfigSchema>;

// 08 — Query Processor
export const QueryProcessorConfigSchema = SharedInfrastructureConfigSchema.extend({
  componentType: z.literal("query-processor"),
  queryLanguageCategory: z
    .enum(["lucene-syntax", "dsl-json", "sql-search", "natural-language-query", "graphql-search"])
    .default("lucene-syntax"),
  parsingStrategy: z
    .enum(["recursive-descent-ast", "regex-tokenizer", "peg-grammar-parser", "nl-entity-extractor"])
    .default("recursive-descent-ast"),
  queryValidation: z
    .enum(["strict-schema", "permissive-sanitize", "syntax-only"])
    .default("strict-schema"),
  rewriteStrategy: z
    .enum(["synonym-expansion", "spellcheck-did-you-mean", "boosting-rules", "stopword-removal", "none"])
    .default("synonym-expansion"),
  maxQueryClauses: z.number().int().min(1).max(2048).default(256),
  queryTimeoutMs: z.number().int().min(10).max(10000).default(500),
  indexSelectionStrategy: z
    .enum(["alias-routing", "time-range-partition", "type-routing", "sharding-hash"])
    .default("alias-routing"),
  queryRateAssumption: z.string().default("8000 req/sec"),
});
export type QueryProcessorConfig = z.infer<typeof QueryProcessorConfigSchema>;

