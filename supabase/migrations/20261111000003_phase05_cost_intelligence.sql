-- Migration: 20261111000003_phase05_cost_intelligence.sql
-- Description: Phase 05.3.14 - Architecture Cost Estimation & Optimization Engine Persistence
-- Stores pricing catalogs, architecture cost estimates, and What-If cost scenarios with strict RLS.

-- 1. Create Pricing Catalogs Table
CREATE TABLE IF NOT EXISTS public.pricing_catalogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  catalog_key TEXT NOT NULL,
  provider_id TEXT NOT NULL CHECK (provider_id IN ('aws', 'gcp', 'azure', 'cloudflare', 'custom')),
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  version INTEGER NOT NULL DEFAULT 1,
  rates JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Architecture Cost Estimates Table
CREATE TABLE IF NOT EXISTS public.architecture_cost_estimates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  architecture_id TEXT NOT NULL,
  graph_revision TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL CHECK (status IN ('complete', 'partial', 'unavailable')),
  total_monthly_cost TEXT NOT NULL,
  total_annual_cost TEXT NOT NULL,
  fixed_monthly_cost TEXT NOT NULL,
  variable_monthly_cost TEXT NOT NULL,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  category_summaries JSONB NOT NULL DEFAULT '{}'::jsonb,
  subsystem_summaries JSONB NOT NULL DEFAULT '{}'::jsonb,
  unpriced_count INTEGER NOT NULL DEFAULT 0,
  total_count INTEGER NOT NULL DEFAULT 0,
  assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Cost Scenarios & What-If Comparisons Table
CREATE TABLE IF NOT EXISTS public.cost_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  architecture_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  overrides JSONB NOT NULL DEFAULT '{}'::jsonb,
  baseline_estimate_id UUID REFERENCES public.architecture_cost_estimates(id) ON DELETE SET NULL,
  candidate_estimate_id UUID REFERENCES public.architecture_cost_estimates(id) ON DELETE SET NULL,
  net_monthly_savings TEXT,
  percentage_difference NUMERIC,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Indexes for rapid lookups
CREATE INDEX IF NOT EXISTS idx_pricing_catalogs_provider
  ON public.pricing_catalogs(provider_id, version);

CREATE INDEX IF NOT EXISTS idx_cost_estimates_lookup
  ON public.architecture_cost_estimates(project_id, architecture_id, graph_revision);

CREATE INDEX IF NOT EXISTS idx_cost_scenarios_project
  ON public.cost_scenarios(project_id, architecture_id);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.pricing_catalogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_cost_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost_scenarios ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies: Pricing Catalogs (Global verified catalogs accessible to all authenticated, custom catalogs project-scoped)
CREATE POLICY "Users can read global verified catalogs"
  ON public.pricing_catalogs
  FOR SELECT
  USING (project_id IS NULL AND is_verified = true);

CREATE POLICY "Users can manage custom catalogs for accessible projects"
  ON public.pricing_catalogs
  FOR ALL
  USING (
    project_id IS NOT NULL AND (
      auth.uid() = created_by OR
      EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = pricing_catalogs.project_id
          AND (p.owner_id = auth.uid() OR p.created_by = auth.uid())
      )
    )
  );

-- 7. RLS Policies: Architecture Cost Estimates
CREATE POLICY "Users can manage cost estimates for accessible projects"
  ON public.architecture_cost_estimates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = architecture_cost_estimates.project_id
        AND (p.owner_id = auth.uid() OR p.created_by = auth.uid())
    )
  );

-- 8. RLS Policies: Cost Scenarios
CREATE POLICY "Users can manage cost scenarios for accessible projects"
  ON public.cost_scenarios
  FOR ALL
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = cost_scenarios.project_id
        AND (p.owner_id = auth.uid() OR p.created_by = auth.uid())
    )
  );

