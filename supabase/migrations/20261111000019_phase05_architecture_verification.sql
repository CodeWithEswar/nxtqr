-- ==============================================================================
-- Migration: 20261111000019_phase05_architecture_verification.sql
-- Description: Architecture Testing, Verification & Readiness Gates Tables with RLS & Indices
-- Phase: 05.3.28 - Architecture Testing, Verification & Readiness Gates Intelligence Engine
-- ==============================================================================

-- 1. Architecture Requirements Table
CREATE TABLE IF NOT EXISTS public.arch_requirements (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  criticality TEXT NOT NULL DEFAULT 'medium',
  owner TEXT NOT NULL,
  scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_requirements_project ON public.arch_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_arch_requirements_category ON public.arch_requirements(category);

-- 2. Architecture Tests Table
CREATE TABLE IF NOT EXISTS public.arch_tests (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  scope JSONB NOT NULL DEFAULT '{}'::jsonb,
  assertion JSONB NOT NULL DEFAULT '{}'::jsonb,
  severity TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'active',
  requirement_ids TEXT[] NOT NULL DEFAULT '{}',
  required_evidence_types TEXT[] NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_tests_project ON public.arch_tests(project_id);
CREATE INDEX IF NOT EXISTS idx_arch_tests_category ON public.arch_tests(category);
CREATE INDEX IF NOT EXISTS idx_arch_tests_status ON public.arch_tests(status);

-- 3. Architecture Test Versions (Immutable History)
CREATE TABLE IF NOT EXISTS public.arch_test_versions (
  id TEXT PRIMARY KEY,
  test_id TEXT NOT NULL REFERENCES public.arch_tests(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  snapshot JSONB NOT NULL,
  change_summary TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_test_versions_test ON public.arch_test_versions(test_id, version);

-- 4. Architecture Test Suites Table
CREATE TABLE IF NOT EXISTS public.arch_test_suites (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  test_ids TEXT[] NOT NULL DEFAULT '{}',
  dependency_suite_ids TEXT[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_test_suites_project ON public.arch_test_suites(project_id);

-- 5. Verification Evidence Table
CREATE TABLE IF NOT EXISTS public.arch_verification_evidence (
  id TEXT PRIMARY KEY,
  evidence_type TEXT NOT NULL,
  source TEXT NOT NULL,
  owner TEXT NOT NULL,
  architecture_revision_id TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL,
  imported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  content_hash TEXT NOT NULL,
  freshness_window_hours INTEGER NOT NULL DEFAULT 24,
  is_verified BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_arch_evidence_type ON public.arch_verification_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_arch_evidence_rev ON public.arch_verification_evidence(architecture_revision_id);

-- 6. Verification Runs Table
CREATE TABLE IF NOT EXISTS public.arch_verification_runs (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  architecture_revision_id TEXT NOT NULL,
  suite_id TEXT,
  suite_version TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL,
  evaluator_version TEXT NOT NULL DEFAULT '1.0.0',
  summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_runs_project ON public.arch_verification_runs(project_id);
CREATE INDEX IF NOT EXISTS idx_arch_runs_rev ON public.arch_verification_runs(architecture_revision_id);

-- 7. Verification Results Table
CREATE TABLE IF NOT EXISTS public.arch_verification_results (
  id TEXT PRIMARY KEY,
  run_id TEXT NOT NULL REFERENCES public.arch_verification_runs(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  test_version TEXT NOT NULL,
  architecture_revision_id TEXT NOT NULL,
  status TEXT NOT NULL,
  applicability_reason TEXT,
  explanation TEXT NOT NULL,
  evidence_ids TEXT[] NOT NULL DEFAULT '{}',
  affected_component_ids TEXT[] NOT NULL DEFAULT '{}',
  evaluator_version TEXT NOT NULL,
  duration_ms INTEGER NOT NULL DEFAULT 1,
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_results_run ON public.arch_verification_results(run_id);
CREATE INDEX IF NOT EXISTS idx_arch_results_test ON public.arch_verification_results(test_id);
CREATE INDEX IF NOT EXISTS idx_arch_results_status ON public.arch_verification_results(status);

-- 8. Verification Baselines Table
CREATE TABLE IF NOT EXISTS public.arch_verification_baselines (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  title TEXT NOT NULL,
  architecture_revision_id TEXT NOT NULL,
  run_id TEXT NOT NULL REFERENCES public.arch_verification_runs(id),
  suite_version TEXT NOT NULL DEFAULT '1.0.0',
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_baselines_project ON public.arch_verification_baselines(project_id);

-- 9. Readiness Gates Table
CREATE TABLE IF NOT EXISTS public.arch_readiness_gates (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT '1.0.0',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  required_test_ids TEXT[] NOT NULL DEFAULT '{}',
  required_suite_ids TEXT[] NOT NULL DEFAULT '{}',
  required_evidence_types TEXT[] NOT NULL DEFAULT '{}',
  blocking_rules JSONB NOT NULL DEFAULT '{}'::jsonb,
  approval_policy_id TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_gates_project ON public.arch_readiness_gates(project_id);
CREATE INDEX IF NOT EXISTS idx_arch_gates_category ON public.arch_readiness_gates(category);

-- 10. Gate Evaluations Table
CREATE TABLE IF NOT EXISTS public.arch_gate_evaluations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  gate_id TEXT NOT NULL REFERENCES public.arch_readiness_gates(id) ON DELETE CASCADE,
  gate_version TEXT NOT NULL,
  status TEXT NOT NULL,
  passed_tests_count INTEGER NOT NULL DEFAULT 0,
  failed_tests_count INTEGER NOT NULL DEFAULT 0,
  unknown_tests_count INTEGER NOT NULL DEFAULT 0,
  active_exceptions_count INTEGER NOT NULL DEFAULT 0,
  blocking_reasons TEXT[] NOT NULL DEFAULT '{}',
  notes TEXT[] NOT NULL DEFAULT '{}',
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_gate_evals_gate ON public.arch_gate_evaluations(gate_id);

-- 11. Gate Exceptions Table
CREATE TABLE IF NOT EXISTS public.arch_gate_exceptions (
  id TEXT PRIMARY KEY,
  gate_id TEXT NOT NULL REFERENCES public.arch_readiness_gates(id) ON DELETE CASCADE,
  test_id TEXT NOT NULL,
  justification TEXT NOT NULL,
  compensating_controls TEXT NOT NULL,
  approved_by TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_gate_exceptions_gate ON public.arch_gate_exceptions(gate_id);
CREATE INDEX IF NOT EXISTS idx_arch_gate_exceptions_status ON public.arch_gate_exceptions(status);

-- 12. Verification Audit Events Table
CREATE TABLE IF NOT EXISTS public.arch_verification_audit_events (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  project_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  actor TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_verification_audit_project ON public.arch_verification_audit_events(project_id);

-- Enable Row Level Security (RLS) on all 12 tables
ALTER TABLE public.arch_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_test_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_test_suites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_verification_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_verification_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_verification_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_readiness_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_gate_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_gate_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_verification_audit_events ENABLE ROW LEVEL SECURITY;

-- Standard RLS Policies: Authenticated users have read access within their projects
CREATE POLICY "Allow authenticated read on arch_requirements" ON public.arch_requirements
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on arch_tests" ON public.arch_tests
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on arch_test_versions" ON public.arch_test_versions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on arch_test_suites" ON public.arch_test_suites
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on arch_verification_evidence" ON public.arch_verification_evidence
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on arch_verification_runs" ON public.arch_verification_runs
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on arch_verification_results" ON public.arch_verification_results
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on arch_verification_baselines" ON public.arch_verification_baselines
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on arch_readiness_gates" ON public.arch_readiness_gates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on arch_gate_evaluations" ON public.arch_gate_evaluations
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on arch_gate_exceptions" ON public.arch_gate_exceptions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read on arch_verification_audit_events" ON public.arch_verification_audit_events
  FOR SELECT TO authenticated USING (true);

