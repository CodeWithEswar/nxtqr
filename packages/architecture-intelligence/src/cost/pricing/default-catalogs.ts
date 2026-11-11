import type { PricingCatalog, CloudProviderId } from "../contracts/pricing.types";

export const DEFAULT_PRICING_CATALOGS: Record<CloudProviderId, PricingCatalog> = {
  aws: {
    id: "catalog_aws_us_east_1",
    name: "Amazon Web Services (US East)",
    providerId: "aws",
    currency: "USD",
    version: 1,
    updatedAt: "2026-11-01T00:00:00Z",
    rates: {
      // Compute Instances (t3 / c6g / general)
      "compute.t3.small": {
        id: "aws-compute-t3-small",
        providerId: "aws",
        serviceId: "ec2",
        skuId: "compute.t3.small",
        name: "EC2 t3.small (2 vCPU, 2GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.0208", // ~$15.18/mo for 730 hrs
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "compute.t3.medium": {
        id: "aws-compute-t3-medium",
        providerId: "aws",
        serviceId: "ec2",
        skuId: "compute.t3.medium",
        name: "EC2 t3.medium (2 vCPU, 4GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.0416", // ~$30.37/mo for 730 hrs
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "compute.c6g.large": {
        id: "aws-compute-c6g-large",
        providerId: "aws",
        serviceId: "ec2",
        skuId: "compute.c6g.large",
        name: "EC2 c6g.large Graviton (2 vCPU, 4GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.0680", // ~$49.64/mo for 730 hrs
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "compute.c6g.xlarge": {
        id: "aws-compute-c6g-xlarge",
        providerId: "aws",
        serviceId: "ec2",
        skuId: "compute.c6g.xlarge",
        name: "EC2 c6g.xlarge Graviton (4 vCPU, 8GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.1360", // ~$99.28/mo
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },

      // Database Instances (RDS PostgreSQL / MySQL)
      "database.db.t3.medium": {
        id: "aws-rds-t3-medium",
        providerId: "aws",
        serviceId: "rds",
        skuId: "database.db.t3.medium",
        name: "RDS Single-AZ db.t3.medium (2 vCPU, 4GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.0680", // ~$49.64/mo
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "database.db.r6g.large": {
        id: "aws-rds-r6g-large",
        providerId: "aws",
        serviceId: "rds",
        skuId: "database.db.r6g.large",
        name: "RDS Single-AZ db.r6g.large (2 vCPU, 16GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.1760", // ~$128.48/mo
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "database.db.r6g.xlarge": {
        id: "aws-rds-r6g-xlarge",
        providerId: "aws",
        serviceId: "rds",
        skuId: "database.db.r6g.xlarge",
        name: "RDS Single-AZ db.r6g.xlarge (4 vCPU, 32GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.3520", // ~$256.96/mo
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "database.storage.gp3": {
        id: "aws-rds-storage-gp3",
        providerId: "aws",
        serviceId: "rds",
        skuId: "database.storage.gp3",
        name: "RDS General Purpose SSD (gp3)",
        billingUnit: "gb_month",
        unitPrice: "0.1150", // $0.115 per GB-month
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },

      // Cache Instances (ElastiCache Redis)
      "cache.cache.t3.small": {
        id: "aws-cache-t3-small",
        providerId: "aws",
        serviceId: "elasticache",
        skuId: "cache.cache.t3.small",
        name: "ElastiCache Redis cache.t3.small (1.37 GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.0340",
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "cache.cache.t3.medium": {
        id: "aws-cache-t3-medium",
        providerId: "aws",
        serviceId: "elasticache",
        skuId: "cache.cache.t3.medium",
        name: "ElastiCache Redis cache.t3.medium (3.09 GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.0680",
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "cache.cache.m6g.large": {
        id: "aws-cache-m6g-large",
        providerId: "aws",
        serviceId: "elasticache",
        skuId: "cache.cache.m6g.large",
        name: "ElastiCache Redis cache.m6g.large (6.38 GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.1340",
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },

      // Object Storage (S3 Standard)
      "storage.s3.standard": {
        id: "aws-s3-standard",
        providerId: "aws",
        serviceId: "s3",
        skuId: "storage.s3.standard",
        name: "S3 Standard Storage",
        billingUnit: "gb_month",
        unitPrice: "0.0230",
        tierType: "graduated",
        tiers: [
          { startUnits: 0, endUnits: 51200, unitPrice: "0.0230" }, // First 50 TB: $0.023/GB
          { startUnits: 51200, endUnits: 512000, unitPrice: "0.0220" }, // Next 450 TB: $0.022/GB
          { startUnits: 512000, unitPrice: "0.0210" }, // Over 500 TB: $0.021/GB
        ],
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },

      // Network Egress (Internet Transfer)
      "network.egress.internet": {
        id: "aws-network-egress",
        providerId: "aws",
        serviceId: "data_transfer",
        skuId: "network.egress.internet",
        name: "Data Transfer Out to Internet",
        billingUnit: "gb_transfer",
        unitPrice: "0.0900",
        tierType: "graduated",
        tiers: [
          { startUnits: 0, endUnits: 100, unitPrice: "0.0000" }, // First 100 GB/mo free
          { startUnits: 100, endUnits: 10240, unitPrice: "0.0900" }, // Next 10 TB: $0.09/GB
          { startUnits: 10240, unitPrice: "0.0700" }, // Over 10 TB: $0.07/GB
        ],
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },

      // Load Balancer (ALB)
      "network.alb": {
        id: "aws-network-alb",
        providerId: "aws",
        serviceId: "elb",
        skuId: "network.alb",
        name: "Application Load Balancer",
        billingUnit: "instance_hour",
        unitPrice: "0.0225", // ~$16.42/mo + LCU
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },

      // Messaging (SQS Standard)
      "messaging.sqs.standard": {
        id: "aws-sqs-standard",
        providerId: "aws",
        serviceId: "sqs",
        skuId: "messaging.sqs.standard",
        name: "Amazon SQS Standard Requests",
        billingUnit: "million_requests",
        unitPrice: "0.4000", // $0.40 per 1M requests (first 1M free)
        tierType: "graduated",
        tiers: [
          { startUnits: 0, endUnits: 1, unitPrice: "0.0000" },
          { startUnits: 1, unitPrice: "0.4000" },
        ],
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },

      // Serverless (Lambda)
      "serverless.lambda.invocations": {
        id: "aws-lambda-invocations",
        providerId: "aws",
        serviceId: "lambda",
        skuId: "serverless.lambda.invocations",
        name: "AWS Lambda Invocations",
        billingUnit: "million_invocations",
        unitPrice: "0.2000", // $0.20 per 1M invocations
        tierType: "graduated",
        tiers: [
          { startUnits: 0, endUnits: 1, unitPrice: "0.0000" },
          { startUnits: 1, unitPrice: "0.2000" },
        ],
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
    },
  },

  gcp: {
    id: "catalog_gcp_us_central1",
    name: "Google Cloud Platform (us-central1)",
    providerId: "gcp",
    currency: "USD",
    version: 1,
    updatedAt: "2026-11-01T00:00:00Z",
    rates: {
      "compute.e2.medium": {
        id: "gcp-compute-e2-medium",
        providerId: "gcp",
        serviceId: "compute_engine",
        skuId: "compute.e2.medium",
        name: "E2-Standard-2 (2 vCPU, 4GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.0335",
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "database.cloudsql.pg.small": {
        id: "gcp-cloudsql-pg-small",
        providerId: "gcp",
        serviceId: "cloud_sql",
        skuId: "database.cloudsql.pg.small",
        name: "Cloud SQL PostgreSQL (2 vCPU, 3.75GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.0825",
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "storage.gcs.standard": {
        id: "gcp-gcs-standard",
        providerId: "gcp",
        serviceId: "cloud_storage",
        skuId: "storage.gcs.standard",
        name: "Google Cloud Storage Standard",
        billingUnit: "gb_month",
        unitPrice: "0.0200",
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "network.egress.internet": {
        id: "gcp-network-egress",
        providerId: "gcp",
        serviceId: "network",
        skuId: "network.egress.internet",
        name: "GCP Internet Egress",
        billingUnit: "gb_transfer",
        unitPrice: "0.0850",
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
    },
  },

  azure: {
    id: "catalog_azure_east_us",
    name: "Microsoft Azure (East US)",
    providerId: "azure",
    currency: "USD",
    version: 1,
    updatedAt: "2026-11-01T00:00:00Z",
    rates: {
      "compute.b2s": {
        id: "azure-compute-b2s",
        providerId: "azure",
        serviceId: "vm",
        skuId: "compute.b2s",
        name: "Azure VM Standard_B2s (2 vCPU, 4GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.0416",
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "database.azure_pg.flexible": {
        id: "azure-pg-flexible",
        providerId: "azure",
        serviceId: "database",
        skuId: "database.azure_pg.flexible",
        name: "Azure Database for PostgreSQL Flexible (2 vCPU, 4GB)",
        billingUnit: "instance_hour",
        unitPrice: "0.0710",
        tierType: "per_unit",
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
    },
  },

  cloudflare: {
    id: "catalog_cloudflare",
    name: "Cloudflare Edge & Storage",
    providerId: "cloudflare",
    currency: "USD",
    version: 1,
    updatedAt: "2026-11-01T00:00:00Z",
    rates: {
      "serverless.workers": {
        id: "cf-workers",
        providerId: "cloudflare",
        serviceId: "workers",
        skuId: "serverless.workers",
        name: "Cloudflare Workers Standard",
        billingUnit: "million_requests",
        unitPrice: "0.3000", // $0.30 per 1M requests above included 10M
        tierType: "graduated",
        tiers: [
          { startUnits: 0, endUnits: 10, unitPrice: "0.0000" },
          { startUnits: 10, unitPrice: "0.3000" },
        ],
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
      "storage.r2": {
        id: "cf-r2-storage",
        providerId: "cloudflare",
        serviceId: "r2",
        skuId: "storage.r2",
        name: "Cloudflare R2 Object Storage",
        billingUnit: "gb_month",
        unitPrice: "0.0150", // $0.015 per GB-month (zero egress fee!)
        tierType: "graduated",
        tiers: [
          { startUnits: 0, endUnits: 10, unitPrice: "0.0000" },
          { startUnits: 10, unitPrice: "0.0150" },
        ],
        source: "verified_catalog",
        effectiveDate: "2026-11-01",
        version: 1,
      },
    },
  },

  custom: {
    id: "catalog_custom",
    name: "Custom Enterprise Contract Rates",
    providerId: "custom",
    currency: "USD",
    version: 1,
    updatedAt: "2026-11-01T00:00:00Z",
    rates: {},
  },
};

