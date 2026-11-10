import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  SearchEngineIcon,
  FullTextSearchIndexIcon,
  SearchIndexerIcon,
  AutocompleteServiceIcon,
  RecommendationEngineIcon,
  DiscoveryServiceIcon,
  SearchCacheIcon,
  QueryProcessorIcon,
  searchAndDiscoveryIconRegistry,
  getSearchAndDiscoveryInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_11_ICONS = [
  { slug: "search-engine", name: "SearchEngineIcon", Component: SearchEngineIcon },
  { slug: "full-text-search-index", name: "FullTextSearchIndexIcon", Component: FullTextSearchIndexIcon },
  { slug: "search-indexer", name: "SearchIndexerIcon", Component: SearchIndexerIcon },
  { slug: "autocomplete-service", name: "AutocompleteServiceIcon", Component: AutocompleteServiceIcon },
  { slug: "recommendation-engine", name: "RecommendationEngineIcon", Component: RecommendationEngineIcon },
  { slug: "discovery-service", name: "DiscoveryServiceIcon", Component: DiscoveryServiceIcon },
  { slug: "search-cache", name: "SearchCacheIcon", Component: SearchCacheIcon },
  { slug: "query-processor", name: "QueryProcessorIcon", Component: QueryProcessorIcon },
] as const;

describe("Category 11 — Search & Discovery Infrastructure Icons", () => {
  it("renders all 8 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_11_ICONS).toHaveLength(8);

    for (const { slug, name, Component } of ALL_CATEGORY_11_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 8 icons in monochrome mode with accessible titles", () => {
    for (const { name, Component } of ALL_CATEGORY_11_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain("<title>" + name + "</title>");
      expect(html).toContain('width="24"');
      expect(html).toContain('height="24"');
    }
  });

  it("registers all 8 icons correctly in searchAndDiscoveryIconRegistry", () => {
    expect(Object.keys(searchAndDiscoveryIconRegistry)).toHaveLength(8);

    for (const { slug, Component } of ALL_CATEGORY_11_ICONS) {
      expect(searchAndDiscoveryIconRegistry[slug]).toBe(Component);
      expect(getSearchAndDiscoveryInfrastructureIcon(slug)).toBe(Component);
    }
  });

  it("registers all 8 icons in global allInfrastructureIconRegistry via getInfrastructureIcon", () => {
    for (const { slug, Component } of ALL_CATEGORY_11_ICONS) {
      expect(getInfrastructureIcon(slug)).toBe(Component);
    }
  });
});
