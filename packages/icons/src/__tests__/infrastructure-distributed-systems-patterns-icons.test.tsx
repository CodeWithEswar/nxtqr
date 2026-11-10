import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import {
  CircuitBreakerIcon,
  BulkheadIcon,
  RetryControllerIcon,
  SagaOrchestratorIcon,
  LeaderElectionIcon,
  DistributedLockIcon,
  ConsensusCoordinatorIcon,
  IdempotencyServiceIcon,
  DistributedSchedulerIcon,
  ServiceRegistryIcon,
  distributedSystemsPatternsIconRegistry,
  getDistributedSystemsPatternsIcon,
  getInfrastructureIcon,
} from "../index";

const ALL_CATEGORY_18_ICONS = [
  { slug: "circuit-breaker", name: "CircuitBreakerIcon", Component: CircuitBreakerIcon },
  { slug: "bulkhead", name: "BulkheadIcon", Component: BulkheadIcon },
  { slug: "retry-controller", name: "RetryControllerIcon", Component: RetryControllerIcon },
  { slug: "saga-orchestrator", name: "SagaOrchestratorIcon", Component: SagaOrchestratorIcon },
  { slug: "leader-election", name: "LeaderElectionIcon", Component: LeaderElectionIcon },
  { slug: "distributed-lock", name: "DistributedLockIcon", Component: DistributedLockIcon },
  { slug: "consensus-coordinator", name: "ConsensusCoordinatorIcon", Component: ConsensusCoordinatorIcon },
  { slug: "idempotency-service", name: "IdempotencyServiceIcon", Component: IdempotencyServiceIcon },
  { slug: "distributed-scheduler", name: "DistributedSchedulerIcon", Component: DistributedSchedulerIcon },
  { slug: "service-registry", name: "ServiceRegistryIcon", Component: ServiceRegistryIcon },
] as const;

describe("Category 18 — Distributed Systems Patterns Icons", () => {
  it("renders all 10 icons in colored mode with 32x32 viewBox", () => {
    expect(ALL_CATEGORY_18_ICONS).toHaveLength(10);

    for (const { slug, name, Component } of ALL_CATEGORY_18_ICONS) {
      const html = renderToString(<Component size={32} variant="colored" />);
      expect(html, `Icon "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('viewBox="0 0 32 32"');
      expect(html).toContain('width="32"');
      expect(html).toContain('height="32"');
      expect(html).not.toContain("NaN");
      expect(html).not.toContain("undefined");
    }
  });

  it("renders all 10 icons in monochrome mode with neutral tokens", () => {
    for (const { slug, name, Component } of ALL_CATEGORY_18_ICONS) {
      const html = renderToString(<Component size={24} variant="monochrome" />);
      expect(html, `Monochrome "${name}" (${slug}) should render valid SVG`).toContain("<svg");
      expect(html).toContain('width="24"');
      expect(html).toContain('height="24"');
      expect(html).toContain("#A3A3A3");
    }
  });

  it("resolves all 10 icons from the patterns and global infrastructure registries", () => {
    for (const { slug, Component } of ALL_CATEGORY_18_ICONS) {
      expect(distributedSystemsPatternsIconRegistry[slug]).toBe(Component);
      expect(getDistributedSystemsPatternsIcon(slug)).toBe(Component);
      expect(getInfrastructureIcon(slug)).toBe(Component);
    }
  });
});

