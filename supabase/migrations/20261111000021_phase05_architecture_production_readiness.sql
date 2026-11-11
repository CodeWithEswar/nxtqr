-- ==============================================================================
-- Migration: 20261111000021_phase05_architecture_production_readiness.sql
-- Description: Architecture Production Readiness & Final Integration Tables with RLS & Indices
-- Phase: 05.3.30 - Architecture Intelligence Final Integration, Performance Optimization & Production Readiness
-- ==============================================================================

-- 1. Production Readiness Assessments Table
CREATE TABLE IF NOT EXISTS public.arch_readiness_assessments (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  architecture_id TEXT,
  revision_id TEXT NOT NULL,
  overall_verdict TEXT NOT NULL,
  readiness_score NUMERIC(5, 2) NOT NULL DEFAULT 100.0,
  summary TEXT NOT NULL,
  pillars JSONB NOT NULL DEFAULT '{}'::jsonb,
  capability_stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  blockers JSONB NOT NULL DEFAULT '[]'::jsonb,
  sign_off_required BOOLEAN NOT NULL DEFAULT false,
  signed_off_by TEXT,
  signed_off_at TIMESTAMPTZ,
  non_fabrication_verified BOOLEAN NOT NULL DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_readiness_assessments_project ON public.arch_readiness_assessments(project_id);
CREATE INDEX IF NOT EXISTS idx_arch_readiness_assessments_revision ON public.arch_readiness_assessments(revision_id);
CREATE INDEX IF NOT EXISTS idx_arch_readiness_assessments_verdict ON public.arch_readiness_assessments(overall_verdict);
CREATE INDEX IF NOT EXISTS idx_arch_readiness_assessments_created ON public.arch_readiness_assessments(created_at DESC);

-- 2. Release Gate Results Table
CREATE TABLE IF NOT EXISTS public.arch_production_readiness_gates (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES public.arch_readiness_assessments(id) ON DELETE CASCADE,
  gate_id TEXT NOT NULL,
  pillar TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL,
  evidence_ref TEXT NOT NULL,
  blocker BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_prod_readiness_gates_assessment ON public.arch_production_readiness_gates(assessment_id);
CREATE INDEX IF NOT EXISTS idx_arch_prod_readiness_gates_pillar ON public.arch_production_readiness_gates(pillar);
CREATE INDEX IF NOT EXISTS idx_arch_prod_readiness_gates_status ON public.arch_production_readiness_gates(status);

-- 3. Performance Benchmarks Table
CREATE TABLE IF NOT EXISTS public.arch_performance_benchmarks (
  id TEXT PRIMARY KEY,
  assessment_id TEXT NOT NULL REFERENCES public.arch_readiness_assessments(id) ON DELETE CASCADE,
  graph_load_duration_ms NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
  graph_render_duration_ms NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
  analysis_wave_duration_ms NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
  cache_speedup_ratio NUMERIC(6, 2) NOT NULL DEFAULT 1.0,
  memory_usage_estimate_mb NUMERIC(8, 3) NOT NULL DEFAULT 0.0,
  report_generation_duration_ms NUMERIC(8, 2) NOT NULL DEFAULT 0.0,
  nodes_evaluated INTEGER NOT NULL DEFAULT 0,
  edges_evaluated INTEGER NOT NULL DEFAULT 0,
  analyzers_ran INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_arch_perf_benchmarks_assessment ON public.arch_performance_benchmarks(assessment_id);
CREATE INDEX IF NOT EXISTS idx_arch_perf_benchmarks_created ON public.arch_performance_benchmarks(created_at DESC);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.arch_readiness_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_production_readiness_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arch_performance_benchmarks ENABLE ROW LEVEL SECURITY;

-- arch_readiness_assessments policies
CREATE POLICY "Users can view readiness assessments in their accessible projects"
  ON public.arch_readiness_assessments FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id::text = arch_readiness_assessments.project_id AND wm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can create readiness assessments in their accessible projects"
  ON public.arch_readiness_assessments FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id::text = arch_readiness_assessments.project_id AND wm.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update readiness assessments in their accessible projects"
  ON public.arch_readiness_assessments FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND (
      created_by = auth.uid()::text OR
      EXISTS (
        SELECT 1 FROM public.projects p
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id::text = arch_readiness_assessments.project_id AND wm.user_id = auth.uid()
      )
    )
  );

-- arch_production_readiness_gates policies
CREATE POLICY "Users can view readiness gates in their accessible assessments"
  ON public.arch_production_readiness_gates FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.arch_readiness_assessments a
      WHERE a.id = arch_production_readiness_gates.assessment_id AND (
        a.created_by = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM public.projects p
          JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
          WHERE p.id::text = a.project_id AND wm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert readiness gates in their accessible assessments"
  ON public.arch_production_readiness_gates FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.arch_readiness_assessments a
      WHERE a.id = arch_production_readiness_gates.assessment_id AND (
        a.created_by = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM public.projects p
          JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
          WHERE p.id::text = a.project_id AND wm.user_id = auth.uid()
        )
      )
    )
  );

-- arch_performance_benchmarks policies
CREATE POLICY "Users can view performance benchmarks in their accessible assessments"
  ON public.arch_performance_benchmarks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.arch_readiness_assessments a
      WHERE a.id = arch_performance_benchmarks.assessment_id AND (
        a.created_by = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM public.projects p
          JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
          WHERE p.id::text = a.project_id AND wm.user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can insert performance benchmarks in their accessible assessments"
  ON public.arch_performance_benchmarks FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.arch_readiness_assessments a
      WHERE a.id = arch_performance_benchmarks.assessment_id AND (
        a.created_by = auth.uid()::text OR
        EXISTS (
          SELECT 1 FROM public.projects p
          JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
          WHERE p.id::text = a.project_id AND wm.user_id = auth.uid()
        )
      )
    )
  );
