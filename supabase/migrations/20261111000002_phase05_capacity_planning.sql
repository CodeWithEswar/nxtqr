-- Migration: 20261111000002_phase05_capacity_planning.sql
-- Description: Phase 05.3.11 - Capacity Planning & Workload Forecasting Engine Persistence
-- Stores capacity forecast scenarios, growth parameters, and computed forecast reports with strict RLS.

-- 1. Create Capacity Scenarios Table
CREATE TABLE IF NOT EXISTS public.capacity_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  architecture_id TEXT NOT NULL,
  scenario_key TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  growth_model TEXT NOT NULL CHECK (growth_model IN ('constant', 'linear', 'compound', 'step', 'seasonal', 'custom')),
  growth_params JSONB NOT NULL DEFAULT '{}'::jsonb,
  horizon_intervals INTEGER NOT NULL DEFAULT 12,
  interval_unit TEXT NOT NULL DEFAULT 'month' CHECK (interval_unit IN ('day', 'week', 'month')),
  warning_threshold NUMERIC NOT NULL DEFAULT 0.70,
  critical_threshold NUMERIC NOT NULL DEFAULT 0.85,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create Capacity Forecast Reports Table
CREATE TABLE IF NOT EXISTS public.capacity_forecast_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  architecture_id TEXT NOT NULL,
  scenario_id UUID REFERENCES public.capacity_scenarios(id) ON DELETE CASCADE,
  graph_revision TEXT NOT NULL,
  time_series JSONB NOT NULL DEFAULT '[]'::jsonb,
  component_evaluations JSONB NOT NULL DEFAULT '{}'::jsonb,
  category_summaries JSONB NOT NULL DEFAULT '{}'::jsonb,
  findings JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Indexes for efficient lookup
CREATE INDEX IF NOT EXISTS idx_capacity_scenarios_project 
  ON public.capacity_scenarios(project_id, architecture_id);

CREATE INDEX IF NOT EXISTS idx_capacity_reports_project_revision 
  ON public.capacity_forecast_reports(project_id, architecture_id, graph_revision);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.capacity_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capacity_forecast_reports ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies: Project Owner or Member Access
CREATE POLICY "Users can manage capacity scenarios for accessible projects"
  ON public.capacity_scenarios
  FOR ALL
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = capacity_scenarios.project_id
        AND (p.owner_id = auth.uid() OR p.created_by = auth.uid())
    )
  );

CREATE POLICY "Users can read/write capacity reports for accessible projects"
  ON public.capacity_forecast_reports
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = capacity_forecast_reports.project_id
        AND (p.owner_id = auth.uid() OR p.created_by = auth.uid())
    )
  );
