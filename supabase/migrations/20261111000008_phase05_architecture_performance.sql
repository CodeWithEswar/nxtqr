-- NXTQR — Phase 05.3.17: Architecture Performance Benchmarking & Load Testing Planner
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Benchmark Definitions Table (Versioned load test and benchmark configurations)
CREATE TABLE IF NOT EXISTS public.benchmark_definitions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    test_type TEXT NOT NULL, -- 'baseline' | 'load' | 'stress' | 'spike' | 'soak' | 'capacity'
    workload_model TEXT NOT NULL, -- 'closed_loop' | 'open_loop'
    target_host TEXT NOT NULL,
    environment JSONB NOT NULL DEFAULT '{}'::jsonb,
    workload_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    operations JSONB NOT NULL DEFAULT '[]'::jsonb,
    targets JSONB NOT NULL DEFAULT '[]'::jsonb,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_benchmark_def_project_arch ON public.benchmark_definitions(project_id, architecture_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_def_test_type ON public.benchmark_definitions(test_type);
CREATE INDEX IF NOT EXISTS idx_benchmark_def_workload_model ON public.benchmark_definitions(workload_model);

-- 2. Benchmark Runs Table (Normalized empirical test execution metrics & data quality reports)
CREATE TABLE IF NOT EXISTS public.benchmark_runs (
    id TEXT PRIMARY KEY,
    benchmark_definition_id TEXT NOT NULL REFERENCES public.benchmark_definitions(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    run_number INTEGER NOT NULL DEFAULT 1,
    source_tool TEXT NOT NULL DEFAULT 'k6', -- 'k6' | 'jmeter' | 'locust' | 'opentelemetry' | 'custom'
    source_version TEXT,
    duration_seconds NUMERIC(10,2) NOT NULL,
    environment JSONB NOT NULL DEFAULT '{}'::jsonb,
    workload_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    overall_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    operation_summaries JSONB NOT NULL DEFAULT '{}'::jsonb,
    target_evaluations JSONB NOT NULL DEFAULT '[]'::jsonb,
    data_quality JSONB NOT NULL DEFAULT '{}'::jsonb,
    raw_summary_export JSONB,
    executed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_benchmark_runs_def ON public.benchmark_runs(benchmark_definition_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_project_arch ON public.benchmark_runs(project_id, architecture_id);
CREATE INDEX IF NOT EXISTS idx_benchmark_runs_executed_at ON public.benchmark_runs(executed_at DESC);

-- 3. Security Helper Function with explicit search_path
CREATE OR REPLACE FUNCTION public.check_user_benchmark_access(project_id_param TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.project_members
        WHERE project_id::text = project_id_param
          AND user_id = auth.uid()
    );
$$;

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.benchmark_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benchmark_runs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for benchmark_definitions
CREATE POLICY "Users can view benchmark definitions in their projects"
    ON public.benchmark_definitions
    FOR SELECT
    USING (public.check_user_benchmark_access(project_id));

CREATE POLICY "Users can create benchmark definitions in their projects"
    ON public.benchmark_definitions
    FOR INSERT
    WITH CHECK (public.check_user_benchmark_access(project_id));

CREATE POLICY "Users can update benchmark definitions in their projects"
    ON public.benchmark_definitions
    FOR UPDATE
    USING (public.check_user_benchmark_access(project_id))
    WITH CHECK (public.check_user_benchmark_access(project_id));

CREATE POLICY "Users can delete benchmark definitions in their projects"
    ON public.benchmark_definitions
    FOR DELETE
    USING (public.check_user_benchmark_access(project_id));

-- 6. RLS Policies for benchmark_runs
CREATE POLICY "Users can view benchmark runs in their projects"
    ON public.benchmark_runs
    FOR SELECT
    USING (public.check_user_benchmark_access(project_id));

CREATE POLICY "Users can insert benchmark runs in their projects"
    ON public.benchmark_runs
    FOR INSERT
    WITH CHECK (public.check_user_benchmark_access(project_id));

CREATE POLICY "Users can delete benchmark runs in their projects"
    ON public.benchmark_runs
    FOR DELETE
    USING (public.check_user_benchmark_access(project_id));
