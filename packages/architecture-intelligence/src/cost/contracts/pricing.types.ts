export type CloudProviderId = "aws" | "gcp" | "azure" | "cloudflare" | "custom";

export type BillingPeriod = "hourly" | "daily" | "monthly" | "annual";

export type PricingSourceType =
  | "user_defined"
  | "verified_catalog"
  | "contractual"
  | "imported_billing"
  | "estimated";

export type BillingUnit =
  | "hour"
  | "month"
  | "gb_month"
  | "gb_transfer"
  | "million_requests"
  | "million_invocations"
  | "million_messages"
  | "iops_month"
  | "instance_hour"
  | "flat_monthly";

export type TierType = "flat" | "per_unit" | "volume" | "graduated";

export interface PricingTier {
  startUnits: number;
  endUnits?: number; // undefined means infinity
  unitPrice: string; // Decimal string e.g. "0.023"
}

export interface PricingRate {
  id: string;
  providerId: CloudProviderId;
  serviceId: string;
  skuId: string;
  name: string;
  regionId?: string;
  currency?: string; // ISO 4217, inherits from catalog if omitted
  billingUnit: BillingUnit;
  unitPrice: string; // Base unit price as decimal string
  tierType: TierType;
  tiers?: PricingTier[];
  source: PricingSourceType;
  effectiveDate?: string;
  verifiedAt?: string;
  version: number;
  notes?: string;
}

export interface PricingCatalog {
  id: string;
  name: string;
  providerId: CloudProviderId;
  currency: string;
  rates: Record<string, PricingRate>; // Key is SKU id
  version: number;
  updatedAt: string;
}

