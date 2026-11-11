import { z } from "zod";

export const CloudProviderIdSchema = z.enum(["aws", "gcp", "azure", "cloudflare", "custom"]);

export const BillingPeriodSchema = z.enum(["hourly", "daily", "monthly", "annual"]);

export const PricingSourceTypeSchema = z.enum([
  "user_defined",
  "verified_catalog",
  "contractual",
  "imported_billing",
  "estimated",
]);

export const BillingUnitSchema = z.enum([
  "hour",
  "month",
  "gb_month",
  "gb_transfer",
  "million_requests",
  "million_invocations",
  "million_messages",
  "iops_month",
  "instance_hour",
  "flat_monthly",
]);

export const TierTypeSchema = z.enum(["flat", "per_unit", "volume", "graduated"]);

export const PricingTierSchema = z.object({
  startUnits: z.number().min(0),
  endUnits: z.number().min(0).optional(),
  unitPrice: z.string().regex(/^\d+(\.\d+)?$/, "unitPrice must be a valid non-negative decimal string"),
});

export const PricingRateSchema = z.object({
  id: z.string().min(1),
  providerId: CloudProviderIdSchema,
  serviceId: z.string().min(1),
  skuId: z.string().min(1),
  name: z.string().min(1),
  regionId: z.string().optional(),
  currency: z.string().length(3).optional(),
  billingUnit: BillingUnitSchema,
  unitPrice: z.string().regex(/^\d+(\.\d+)?$/, "unitPrice must be a valid non-negative decimal string"),
  tierType: TierTypeSchema,
  tiers: z.array(PricingTierSchema).optional(),
  source: PricingSourceTypeSchema,
  effectiveDate: z.string().optional(),
  verifiedAt: z.string().optional(),
  version: z.number().int().min(1),
  notes: z.string().optional(),
});

export const PricingCatalogSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  providerId: CloudProviderIdSchema,
  currency: z.string().length(3),
  version: z.number().int().min(1),
  updatedAt: z.string(),
  rates: z.record(PricingRateSchema),
});

