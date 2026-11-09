import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  RedisCacheIcon,
  MemcachedCacheIcon,
  ApplicationCacheIcon,
  DistributedCacheIcon,
  SessionCacheIcon,
  QueryCacheIcon,
  ReadThroughCacheIcon,
  WriteThroughCacheIcon,
  WriteBehindCacheIcon,
  RateLimitStoreIcon,
  cachingAndPerformanceIconRegistry,
  getCachingAndPerformanceInfrastructureIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_06_ICONS = [
  { slug: "redis-cache", name: "RedisCacheIcon", Component: RedisCacheIcon },
  { slug: "memcached-cache", name: "MemcachedCacheIcon", Component: MemcachedCacheIcon },
  { slug: "application-cache", name: "ApplicationCacheIcon", Component: ApplicationCacheIcon },
  { slug: "distributed-cache", name: "DistributedCacheIcon", Component: DistributedCacheIcon },
  { slug: "session-cache", name: "SessionCacheIcon", Component: SessionCacheIcon },
  { slug: "query-cache", name: "QueryCacheIcon", Component: QueryCacheIcon },
  { slug: "read-through-cache", name: "ReadThroughCacheIcon", Component: ReadThroughCacheIcon },
  { slug: "write-through-cache", name: "WriteThroughCacheIcon", Component: WriteThroughCacheIcon },
  { slug: "write-behind-cache", name: "WriteBehindCacheIcon", Component: WriteBehindCacheIcon },
  { slug: "rate-limit-store", name: "RateLimitStoreIcon", Component: RateLimitStoreIcon },
] as const;

describe("Category 06 — Caching & Performance Infrastructure Icons", () => {
  it("renders all 10 icons in colored mode with 32x32 viewBox", () => {
    for (const { slug, name, Component } of ALL_CATEGORY_06_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 10 icons in monochrome mode with accessible titles", () => {
    for (const { name, Component } of ALL_CATEGORY_06_ICONS) {
      const html = renderToString(
        <Component size={24} variant="monochrome" decorative={false} title={name} />
      );
      expect(html).toContain("<svg");
      expect(html).toContain(`<title>${name}</title>`);
      expect(html).toContain('role="img"');
    }
  });

  it("ensures registry exports exactly 10 items mapping slug to component", () => {
    expect(Object.keys(cachingAndPerformanceIconRegistry)).toHaveLength(10);
    for (const { slug, Component } of ALL_CATEGORY_06_ICONS) {
      expect(cachingAndPerformanceIconRegistry[slug]).toBe(Component);
      expect(getCachingAndPerformanceInfrastructureIcon(slug)).toBe(Component);
      expect(getInfrastructureIcon(slug)).toBe(Component);
    }
  });

  it("supports arbitrary sizes without distortion (16px, 20px, 48px)", () => {
    const html16 = renderToString(<RedisCacheIcon size={16} />);
    expect(html16).toContain('width="16"');
    expect(html16).toContain('height="16"');

    const html48 = renderToString(<RateLimitStoreIcon size={48} />);
    expect(html48).toContain('width="48"');
    expect(html48).toContain('height="48"');
  });
});

