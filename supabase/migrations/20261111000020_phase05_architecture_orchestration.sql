-- ==============================================================================
-- Migration: 20261111000020_phase05_architecture_orchestration.sql
-- Description: Architecture Intelligence Orchestration & Unified Analysis Tables with RLS & Indices
-- Phase: 05.3.29 - Architecture Intelligence Orchestration & Unified Analysis Engine
-- ==============================================================================

-- 1. Orchestration Runs Table
CREATE TABLE IF NOT EXISTS public.arch_orchestration_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  architecture_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  revision_hash TEXT NOT NULL,
  completeness_status TEXT NOT NULL DEFAULT 'completed',
  health_score NUMERIC(5, 2) NOT NULL DEFAULT 100.0,
  analyzers_run INTEGER NOT NULL DEFAULT 0,
  analyzers_completed INTEGER NOT NULL DEFAULT 0,
  analyzers_failed INTEGER NOT NULL DEFAULT 0,
  analyzers_cached INTEGER NOT NULL DEFAULT 0,
  execution_duration_ms INTEGER NOT NULL DEFAULT 0,
  configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_orchestration_runs_project ON public.arch_orchestration_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_arch_orchestration_runs_arch ON public.arch_orchestration_runs(architecture_id);
CREATE INDEX IF NOT EXISTS idx_arch_orchestration_runs_revision ON public.arch_orchestration_runs(revision_id);
CREATE INDEX IF NOT EXISTS idx_arch_orchestration_runs_created ON public.arch_orchestration_runs(created_at DESC);

-- 2. Analyzer Run Records Table
CREATE TABLE IF NOT EXISTS public.arch_orchestration_analyzer_runs (
  id TEXT PRIMARY KEY,
  orchestration_run_id TEXT NOT NULL REFERENCES public.arch_orchestration_runs(id) ON DELETE CASCADE,
  analyzer_id TEXT NOT NULL,
  analyzer_version TEXT NOT NULL,
  status TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  findings_count INTEGER NOT NULL DEFAULT 0,
  is_cached BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_arch_orch_analyzer_runs_run ON public.arch_orchestration_analyzer_runs(orchestration_run_id);
CREATE INDEX IF NOT EXISTS idx_arch_orch_analyzer_runs_analyzer ON public.arch_orchestration_analyzer_runs(analyzer_id);

-- 3. Unified Assessments Table
CREATE TABLE IF NOT EXISTS public.arch_unified_assessments (
  id TEXT PRIMARY KEY,
  orchestration_run_id TEXT NOT NULL REFERENCES public.arch_orchestration_runs(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  revision_id TEXT NOT NULL,
  completeness_status TEXT NOT NULL,
  findings_count INTEGER NOT NULL DEFAULT 0,
  critical_count INTEGER NOT NULL DEFAULT 0,
  high_count INTEGER NOT NULL DEFAULT 0,
  medium_count INTEGER NOT NULL DEFAULT 0,
  low_count INTEGER NOT NULL DEFAULT 0,
  assessment_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_unified_assess_project ON public.arch_unified_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_arch_unified_assess_run ON public.arch_unified_assessments(orchestration_run_id);

-- 4. Finding Correlation Groups Table
CREATE TABLE IF NOT EXISTS public.arch_finding_correlations (
  id TEXT PRIMARY KEY,
  orchestration_run_id TEXT NOT NULL REFERENCES public.arch_orchestration_runs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  primary_category TEXT NOT NULL,
  shared_component_ids TEXT[] NOT NULL DEFAULT '{}',
  finding_ids TEXT[] NOT NULL DEFAULT '{}',
  candidate_root_cause TEXT NOT NULL,
  recommended_unified_action TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_finding_correlations_run ON public.arch_finding_correlations(orchestration_run_id);

-- 5. Contradiction Records Table
CREATE TABLE IF NOT EXISTS public.arch_contradiction_records (
  id TEXT PRIMARY KEY,
  orchestration_run_id TEXT NOT NULL REFERENCES public.arch_orchestration_runs(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  involved_analyzer_ids TEXT[] NOT NULL DEFAULT '{}',
  involved_finding_ids TEXT[] NOT NULL DEFAULT '{}',
  affected_component_ids TEXT[] NOT NULL DEFAULT '{}',
  explanation TEXT NOT NULL,
  resolution_guidance TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_contradictions_run ON public.arch_contradiction_records(orchestration_run_id);
CREATE INDEX IF NOT EXISTS idx_arch_contradictions_type ON public.arch_contradiction_records(type);

-- 6. Orchestration Audit Events Table
CREATE TABLE IF NOT EXISTS public.arch_orchestration_audit_events (
  id TEXT PRIMARY KEY,
  orchestration_run_id TEXT REFERENCES public.arch_orchestration_runs(id) ON DELETE SET NULL,
  project_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_orch_audit_project ON public.arch_orchestration_audit_events(project_id);
CREATE INDEX IF NOT EXISTS idx_arch_orch_audit_run ON public.arch_orchestration_audit_events(orchestration_run_id);

-- ==============================================================================
-- Row-Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.arch_orchestration_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_orchestration_analyzer_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_unified_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_finding_correlations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_contradiction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_orchestration_audit_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view orchestration runs"
  ON public.arch_orchestration_runs FOR SELECT
  USING (true);

CREATE POLICY "Users can insert orchestration runs"
  ON public.arch_orchestration_runs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update orchestration runs"
  ON public.arch_orchestration_runs FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete orchestration runs"
  ON public.arch_orchestration_runs FOR DELETE
  USING (true);

CREATE POLICY "Users can manage analyzer runs"
  ON public.arch_orchestration_analyzer_runs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage unified assessments"
  ON public.arch_unified_assessments FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage finding correlations"
  ON public.arch_finding_correlations FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage contradiction records"
  ON public.arch_contradiction_records FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can manage orchestration audit events"
  ON public.arch_orchestration_audit_events FOR ALL
  USING (true)
  WITH CHECK (true);
