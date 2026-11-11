-- NXTQR — Phase 05.3.15: Architecture Simulation & Failure Testing Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Architecture Failure Scenarios Table
CREATE TABLE IF NOT EXISTS public.architecture_failure_scenarios (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    graph_revision TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    duration_ms INTEGER NOT NULL DEFAULT 60000,
    injections JSONB NOT NULL DEFAULT '[]'::jsonb,
    critical_journeys JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_rto_ms INTEGER,
    target_rpo_ms INTEGER,
    random_seed INTEGER,
    assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sim_scenarios_project_arch ON public.architecture_failure_scenarios(project_id, architecture_id);
CREATE INDEX IF NOT EXISTS idx_sim_scenarios_created_by ON public.architecture_failure_scenarios(created_by);

-- 2. Architecture Simulation Runs Table (Deterministic simulation execution results)
CREATE TABLE IF NOT EXISTS public.architecture_simulation_runs (
    id TEXT PRIMARY KEY,
    scenario_id TEXT NOT NULL REFERENCES public.architecture_failure_scenarios(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    graph_revision TEXT NOT NULL,
    engine_version TEXT NOT NULL DEFAULT '1.0.0',
    events_count INTEGER NOT NULL DEFAULT 0,
    timeline_steps_count INTEGER NOT NULL DEFAULT 0,
    blast_radius_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    unaffected_nodes_count INTEGER NOT NULL DEFAULT 0,
    directly_impacted_count INTEGER NOT NULL DEFAULT 0,
    indirectly_impacted_count INTEGER NOT NULL DEFAULT 0,
    rto_met BOOLEAN NOT NULL DEFAULT true,
    rpo_met BOOLEAN NOT NULL DEFAULT true,
    modeled_recovery_ms INTEGER NOT NULL DEFAULT 0,
    raw_result JSONB NOT NULL,
    executed_by TEXT NOT NULL,
    completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sim_runs_scenario ON public.architecture_simulation_runs(scenario_id);
CREATE INDEX IF NOT EXISTS idx_sim_runs_project_arch ON public.architecture_simulation_runs(project_id, architecture_id);

-- 3. Architecture Simulation Comparisons Table (Baseline vs Candidate resilience comparisons)
CREATE TABLE IF NOT EXISTS public.architecture_simulation_comparisons (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    baseline_run_id TEXT NOT NULL REFERENCES public.architecture_simulation_runs(id) ON DELETE CASCADE,
    candidate_run_id TEXT NOT NULL REFERENCES public.architecture_simulation_runs(id) ON DELETE CASCADE,
    baseline_blast_radius_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    candidate_blast_radius_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    blast_radius_score_delta NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    journey_availability_delta INTEGER NOT NULL DEFAULT 0,
    comparison_data JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sim_comparisons_project_arch ON public.architecture_simulation_comparisons(project_id, architecture_id);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.architecture_failure_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_simulation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.architecture_simulation_comparisons ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function: Project Membership Check (Security Definer with immutable search_path)
CREATE OR REPLACE FUNCTION public.check_user_simulation_access(project_id_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = project_id_param
        AND (
            p.owner_id = auth.uid()::text
            OR EXISTS (
                SELECT 1 FROM public.project_members pm
                WHERE pm.project_id = project_id_param
                AND pm.user_id = auth.uid()::text
            )
        )
    );
END;
$$;

-- 6. RLS Policies
CREATE POLICY "scenarios_access_policy" ON public.architecture_failure_scenarios
    FOR ALL USING (
        public.check_user_simulation_access(project_id)
    );

CREATE POLICY "runs_access_policy" ON public.architecture_simulation_runs
    FOR ALL USING (
        public.check_user_simulation_access(project_id)
    );

CREATE POLICY "comparisons_access_policy" ON public.architecture_simulation_comparisons
    FOR ALL USING (
        public.check_user_simulation_access(project_id)
    );
