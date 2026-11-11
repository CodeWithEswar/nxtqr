import { describe, it, expect } from "vitest";
import type { BaseNode, BaseEdge } from "@nxtqr/graph-schema";
import { DecimalMoney } from "../cost/pricing/decimal-money";
import { TieredPricingEvaluator } from "../cost/pricing/tiered-pricing";
import { DEFAULT_PRICING_CATALOGS } from "../cost/pricing/default-catalogs";
import { ResourceMapper } from "../cost/models/resource-mapper";
import { CostCalculator } from "../cost/engine/cost-calculator";
import { CostAggregator } from "../cost/engine/cost-aggregator";
import { CostOptimizationEngine } from "../cost/engine/optimization-engine";
import { architectureCostEngine } from "../cost/engine/cost-engine";
import { PricingCatalogSchema } from "../cost/schemas/pricing.schemas";
import { CostEstimateSchema } from "../cost/schemas/cost.schemas";
import type { PricingRate } from "../cost/contracts/pricing.types";

describe("Cost Intelligence - DecimalMoney", () => {
  it("performs exact, scaled decimal arithmetic without floating point drift", () => {
    // 0.1 + 0.2 in JS is 0.30000000000000004
    const sum = DecimalMoney.add("0.10", "0.20");
    expect(sum).toBe("0.30");

    const multiSum = DecimalMoney.add(DecimalMoney.add("10.50", "20.25"), "5.15");
    expect(multiSum).toBe("35.90");
  });

  it("handles subtraction and negative balances correctly", () => {
    const diff = DecimalMoney.subtract("100.00", "35.50");
    expect(diff).toBe("64.50");

    const negative = DecimalMoney.subtract("25.00", "50.00");
    expect(negative).toBe("-25.00");
  });

  it("handles multiplication with non-integer scaling factors", () => {
    // 730 hours * $0.0208 = $15.184 -> rounded to 15.18
    const extended = DecimalMoney.multiply("0.0208", 730);
    expect(extended).toBe("15.18");

    // Multiple replicas
    const threeReplicas = DecimalMoney.multiply(extended, 3);
    expect(threeReplicas).toBe("45.54");
  });

  it("compares decimal values correctly", () => {
    expect(DecimalMoney.compare("10.00", "15.00")).toBe(-1);
    expect(DecimalMoney.compare("20.50", "20.50")).toBe(0);
    expect(DecimalMoney.compare("50.00", "12.00")).toBe(1);
    expect(DecimalMoney.isZero("0.00")).toBe(true);
    expect(DecimalMoney.isZero("0.000000")).toBe(true);
    expect(DecimalMoney.isZero("0.01")).toBe(false);
  });

  it("formats currency strings cleanly", () => {
    expect(DecimalMoney.formatCurrency("1240.50", "USD")).toBe("$1,240.50");
    expect(DecimalMoney.formatCurrency("0.00", "USD")).toBe("$0.00");
  });
});

describe("Cost Intelligence - TieredPricingEvaluator", () => {
  it("calculates flat rates regardless of consumption units", () => {
    const rate: PricingRate = {
      id: "test-flat",
      providerId: "custom",
      serviceId: "service",
      skuId: "flat-plan",
      name: "Flat Plan",
      billingUnit: "flat_monthly",
      unitPrice: "49.00",
      tierType: "flat",
      source: "user_defined",
      version: 1,
    };

    expect(TieredPricingEvaluator.calculateCost(rate, 1)).toBe("49.00");
    expect(TieredPricingEvaluator.calculateCost(rate, 500)).toBe("49.00");
    expect(TieredPricingEvaluator.calculateCost(rate, 0)).toBe("0.00");
  });

  it("calculates linear per-unit rates", () => {
    const rate: PricingRate = {
      id: "test-per-unit",
      providerId: "aws",
      serviceId: "ec2",
      skuId: "t3.small",
      name: "t3.small",
      billingUnit: "instance_hour",
      unitPrice: "0.0208",
      tierType: "per_unit",
      source: "verified_catalog",
      version: 1,
    };

    expect(TieredPricingEvaluator.calculateCost(rate, 730)).toBe("15.18");
  });

  it("evaluates graduated progressive bracket tiers", () => {
    const rate: PricingRate = {
      id: "test-graduated",
      providerId: "aws",
      serviceId: "s3",
      skuId: "storage.s3.standard",
      name: "S3 Storage",
      billingUnit: "gb_month",
      unitPrice: "0.023",
      tierType: "graduated",
      tiers: [
        { startUnits: 0, endUnits: 50, unitPrice: "0.023" }, // 50 * 0.023 = 1.15
        { startUnits: 50, endUnits: 150, unitPrice: "0.020" }, // 100 * 0.020 = 2.00
        { startUnits: 150, unitPrice: "0.015" },
      ],
      source: "verified_catalog",
      version: 1,
    };

    // 30 GB -> inside first tier: 30 * 0.023 = 0.69
    expect(TieredPricingEvaluator.calculateCost(rate, 30)).toBe("0.69");

    // 100 GB -> 50 in tier 1 ($1.15) + 50 in tier 2 (50 * 0.020 = $1.00) = $2.15
    expect(TieredPricingEvaluator.calculateCost(rate, 100)).toBe("2.15");

    // 200 GB -> 50 * 0.023 ($1.15) + 100 * 0.020 ($2.00) + 50 * 0.015 ($0.75) = $3.90
    expect(TieredPricingEvaluator.calculateCost(rate, 200)).toBe("3.90");
  });
});

describe("Cost Intelligence - ResourceMapper & CostCalculator", () => {
  const nodes: BaseNode[] = [
    {
      id: "api-gw",
      type: "loadBalancer",
      position: { x: 0, y: 0 },
      data: {
        label: "API Gateway",
        pricingSku: "ingress.alb",
      },
    },
    {
      id: "svc-order",
      type: "service",
      position: { x: 100, y: 0 },
      data: {
        label: "Order Service",
        replicas: 2,
        pricingSku: "compute.t3.medium",
        subsystem: "orders",
      },
    },
    {
      id: "db-order",
      type: "database",
      position: { x: 200, y: 0 },
      data: {
        label: "Order PostgreSQL",
        pricingSku: "db.rds.postgres.t3.medium",
        storageGb: 100,
        subsystem: "orders",
      },
    },
  ];

  const edges: BaseEdge[] = [
    { id: "e1", source: "api-gw", target: "svc-order", data: {} },
    { id: "e2", source: "svc-order", target: "db-order", data: {} },
  ];

  it("decomposes nodes into accurate billable resource definitions", () => {
    const resources = ResourceMapper.mapTopologyToResources(nodes, edges);
    // api-gw: ingress (1)
    // svc-order: compute (2 replicas) + network egress (1)
    // db-order: db compute (1) + db storage (100 GB)
    expect(resources.length).toBeGreaterThanOrEqual(5);

    const computeRes = resources.find((r) => r.nodeId === "svc-order" && r.category === "compute");
    expect(computeRes).toBeDefined();
    expect(computeRes?.quantity).toBe(2 * 730); // 2 replicas * 730 hours

    const storageRes = resources.find((r) => r.nodeId === "db-order" && r.category === "storage");
    expect(storageRes).toBeDefined();
    expect(storageRes?.quantity).toBe(100);
  });

  it("calculates cost using verified AWS default catalog", () => {
    const catalog = DEFAULT_PRICING_CATALOGS.aws;
    const resources = ResourceMapper.mapTopologyToResources(nodes, edges);
    const lineItems = CostCalculator.calculateLineItems(resources, catalog);

    expect(lineItems.length).toBe(resources.length);
    const unpriced = lineItems.filter((i) => i.isUnpriced);
    expect(unpriced.length).toBe(0); // All SKUs are present in catalog

    const estimate = CostAggregator.buildEstimate(
      "est-test-1",
      "test-arch",
      "rev_1",
      catalog,
      "monthly",
      lineItems
    );

    expect(estimate.status).toBe("complete");
    expect(DecimalMoney.compare(estimate.totalMonthlyCost, "0.00")).toBe(1);
    expect(estimate.unpricedResourcesCount).toBe(0);
    expect(estimate.categorySummaries.compute.lineItemCount).toBe(1);
    expect(estimate.categorySummaries.database.lineItemCount).toBe(1);
    expect(estimate.categorySummaries.storage.lineItemCount).toBe(1);
  });

  it("marks estimate as partial and transparently highlights unpriced components", () => {
    const unpricedNodes: BaseNode[] = [
      {
        id: "custom-ai-node",
        type: "service",
        position: { x: 0, y: 0 },
        data: {
          label: "Custom ML Inference",
          pricingSku: "proprietary.gpu.h100.unknown",
        },
      },
    ];

    const catalog = DEFAULT_PRICING_CATALOGS.aws;
    const resources = ResourceMapper.mapTopologyToResources(unpricedNodes, []);
    const lineItems = CostCalculator.calculateLineItems(resources, catalog);

    const unpricedItem = lineItems.find((i) => i.skuId === "proprietary.gpu.h100.unknown");
    expect(unpricedItem).toBeDefined();
    expect(unpricedItem?.isUnpriced).toBe(true);
    expect(unpricedItem?.extendedMonthlyCost).toBe("0.00");

    const estimate = CostAggregator.buildEstimate(
      "est-unpriced",
      "test-arch",
      "rev_unpriced",
      catalog,
      "monthly",
      lineItems
    );

    expect(estimate.status).toBe("partial");
    expect(estimate.unpricedResourcesCount).toBeGreaterThan(0);
  });
});

describe("Cost Intelligence - CostOptimizationEngine", () => {
  it("identifies compute rightsizing while strictly respecting multi-AZ minimums", () => {
    const overprovisionedNodes: BaseNode[] = [
      {
        id: "web-fleet",
        type: "service",
        position: { x: 0, y: 0 },
        data: {
          label: "Web Fleet",
          replicas: 6, // Overprovisioned: 6 replicas for moderate load
          pricingSku: "compute.t3.medium",
        },
      },
    ];

    const estimate = architectureCostEngine.estimateCost(overprovisionedNodes, [], { providerId: "aws" });
    const ops = CostOptimizationEngine.analyze(overprovisionedNodes, estimate);

    const rightsizing = ops.find((o) => o.strategyId === "opt-compute-rightsizing");
    expect(rightsizing).toBeDefined();
    expect(DecimalMoney.compare(rightsizing!.estimatedMonthlySavings, "0.00")).toBe(1);
    // Verify it doesn't reduce below 2 replicas
    const newReplicas = rightsizing?.proposedOperations?.[0]?.changes?.replicas;
    expect(newReplicas).toBeGreaterThanOrEqual(2);
  });

  it("identifies cache offloading when a costly database has no cache layer", () => {
    const dbOnlyNodes: BaseNode[] = [
      {
        id: "heavy-db",
        type: "database",
        position: { x: 0, y: 0 },
        data: {
          label: "Heavy Database",
          pricingSku: "db.rds.postgres.r6g.xlarge", // ~$360/mo
          storageGb: 250,
        },
      },
    ];

    const estimate = architectureCostEngine.estimateCost(dbOnlyNodes, [], { providerId: "aws" });
    const ops = CostOptimizationEngine.analyze(dbOnlyNodes, estimate);

    const cacheOffload = ops.find((o) => o.strategyId === "opt-cache-offload");
    expect(cacheOffload).toBeDefined();
    expect(DecimalMoney.compare(cacheOffload!.estimatedMonthlySavings, "0.00")).toBe(1);
    expect(cacheOffload?.tradeoffDetails.reliability).toBe("positive");
  });

  it("identifies ARM / Graviton modernization opportunities", () => {
    const x86Nodes: BaseNode[] = [
      {
        id: "x86-service",
        type: "service",
        position: { x: 0, y: 0 },
        data: {
          label: "Legacy App Service",
          replicas: 4,
          pricingSku: "compute.t3.medium", // x86
        },
      },
    ];

    const estimate = architectureCostEngine.estimateCost(x86Nodes, [], { providerId: "aws" });
    const ops = CostOptimizationEngine.analyze(x86Nodes, estimate);

    const graviton = ops.find((o) => o.strategyId === "opt-graviton-modernization");
    expect(graviton).toBeDefined();
    expect(graviton?.confidence).toBe("high");
    expect(graviton?.tradeoffDetails.costDirection).toBe("decrease");
  });
});

describe("Cost Intelligence - Zod Schema Validation", () => {
  it("validates verified default pricing catalogs against schema", () => {
    const awsResult = PricingCatalogSchema.safeParse(DEFAULT_PRICING_CATALOGS.aws);
    expect(awsResult.success).toBe(true);

    const gcpResult = PricingCatalogSchema.safeParse(DEFAULT_PRICING_CATALOGS.gcp);
    expect(gcpResult.success).toBe(true);

    const cfResult = PricingCatalogSchema.safeParse(DEFAULT_PRICING_CATALOGS.cloudflare);
    expect(cfResult.success).toBe(true);
  });

  it("validates generated cost estimates against schema", () => {
    const testNodes: BaseNode[] = [
      {
        id: "svc-1",
        type: "service",
        position: { x: 0, y: 0 },
        data: { label: "API", replicas: 2, pricingSku: "compute.t3.small" },
      },
    ];
    const estimate = architectureCostEngine.estimateCost(testNodes, [], { providerId: "aws" });
    const result = CostEstimateSchema.safeParse(estimate);
    expect(result.success).toBe(true);
  });
});
