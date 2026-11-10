export * from "./search-engine-icon";
export * from "./full-text-search-index-icon";
export * from "./search-indexer-icon";
export * from "./autocomplete-service-icon";
export * from "./recommendation-engine-icon";
export * from "./discovery-service-icon";
export * from "./search-cache-icon";
export * from "./query-processor-icon";

import type { InfrastructureIconComponent } from "../types";
import { SearchEngineIcon } from "./search-engine-icon";
import { FullTextSearchIndexIcon } from "./full-text-search-index-icon";
import { SearchIndexerIcon } from "./search-indexer-icon";
import { AutocompleteServiceIcon } from "./autocomplete-service-icon";
import { RecommendationEngineIcon } from "./recommendation-engine-icon";
import { DiscoveryServiceIcon } from "./discovery-service-icon";
import { SearchCacheIcon } from "./search-cache-icon";
import { QueryProcessorIcon } from "./query-processor-icon";

export const searchAndDiscoveryIconRegistry: Record<string, InfrastructureIconComponent> = {
  "search-engine": SearchEngineIcon,
  "full-text-search-index": FullTextSearchIndexIcon,
  "search-indexer": SearchIndexerIcon,
  "autocomplete-service": AutocompleteServiceIcon,
  "recommendation-engine": RecommendationEngineIcon,
  "discovery-service": DiscoveryServiceIcon,
  "search-cache": SearchCacheIcon,
  "query-processor": QueryProcessorIcon,
};

export function getSearchAndDiscoveryInfrastructureIcon(
  slug: string
): InfrastructureIconComponent | undefined {
  return searchAndDiscoveryIconRegistry[slug];
}
