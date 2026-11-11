-- NXTQR — Phase 05.3.26: Architecture Migration, Modernization & Evolution Planning Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Helper function for workspace project access authorization
CREATE OR REPLACE FUNCTION public.check_user_evolution_access(project_id_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Check if user is authenticated and belongs to the project's workspace
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;

    RETURN EXISTS (
        SELECT 1
        FROM public.projects p
        JOIN public.workspace_members wm ON wm.workspace_id = p.workspace_id
        WHERE p.id::text = project_id_param
          AND wm.user_id = auth.uid()
    );
END;
$$;

-- 2. Migration Projects Table
CREATE TABLE IF NOT EXISTS public.migration_projects (
    id TEXT PRIMARY KEY,
    architecture_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    source_revision_id TEXT NOT NULL,
    target_revision_id TEXT NOT NULL,
    strategy_id TEXT NOT NULL, -- 'rehost' | 'replatform' | 'refactor' | 'rearchitect' | 'replace' | 'retire' | 'retain' | 'strangler_fig' | 'parallel_run' | 'blue_green' | 'progressive_cutover'
    status TEXT NOT NULL DEFAULT 'planning', -- 'draft' | 'planning' | 'in_review' | 'approved' | 'in_progress' | 'completed' | 'cancelled'
    source_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    target_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_migration_projects_arch ON public.migration_projects(architecture_id);
CREATE INDEX IF NOT EXISTS idx_migration_projects_status ON public.migration_projects(status);

-- 3. Migration Requirements Table
CREATE TABLE IF NOT EXISTS public.migration_requirements (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.migration_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL,
    source_node_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    target_node_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    affected_edge_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'candidate',
    priority TEXT NOT NULL DEFAULT 'high',
    estimated_effort_hours NUMERIC NOT NULL DEFAULT 0,
    rationale TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_migration_reqs_proj ON public.migration_requirements(project_id);
CREATE INDEX IF NOT EXISTS idx_migration_reqs_cat ON public.migration_requirements(category);

-- 4. Migration Waves Table
CREATE TABLE IF NOT EXISTS public.migration_waves (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.migration_projects(id) ON DELETE CASCADE,
    wave_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    objective TEXT NOT NULL,
    target_intermediate_snapshot_id TEXT,
    prerequisites JSONB NOT NULL DEFAULT '[]'::jsonb,
    completion_criteria JSONB NOT NULL DEFAULT '[]'::jsonb,
    rollback_strategy TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_migration_waves_proj ON public.migration_waves(project_id, wave_number);

-- 5. Migration Tasks Table
CREATE TABLE IF NOT EXISTS public.migration_tasks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.migration_projects(id) ON DELETE CASCADE,
    wave_id TEXT NOT NULL REFERENCES public.migration_waves(id) ON DELETE CASCADE,
    requirement_id TEXT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    component_id TEXT,
    task_type TEXT NOT NULL,
    estimated_hours NUMERIC NOT NULL DEFAULT 0,
    depends_on_task_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    verification_gate_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_point_of_no_return BOOLEAN NOT NULL DEFAULT false,
    rollback_procedure TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'planned',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_migration_tasks_wave ON public.migration_tasks(wave_id);
CREATE INDEX IF NOT EXISTS idx_migration_tasks_proj ON public.migration_tasks(project_id);

-- 6. Migration Dependencies Table (Prerequisite Graph)
CREATE TABLE IF NOT EXISTS public.migration_dependencies (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.migration_projects(id) ON DELETE CASCADE,
    source_task_id TEXT NOT NULL,
    target_task_id TEXT NOT NULL,
    dependency_type TEXT NOT NULL,
    is_blocking BOOLEAN NOT NULL DEFAULT true,
    rationale TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_migration_deps_tasks ON public.migration_dependencies(project_id, source_task_id, target_task_id);

-- 7. Intermediate Architecture Snapshots Table
CREATE TABLE IF NOT EXISTS public.intermediate_architectures (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.migration_projects(id) ON DELETE CASCADE,
    wave_id TEXT NOT NULL REFERENCES public.migration_waves(id) ON DELETE CASCADE,
    wave_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    reachability_verified BOOLEAN NOT NULL DEFAULT true,
    security_score NUMERIC NOT NULL DEFAULT 85,
    availability_score NUMERIC NOT NULL DEFAULT 90,
    validation_status TEXT NOT NULL DEFAULT 'valid',
    validation_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_intermediate_archs_wave ON public.intermediate_architectures(project_id, wave_number);

-- 8. Verification Gates Table
CREATE TABLE IF NOT EXISTS public.verification_gates (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.migration_projects(id) ON DELETE CASCADE,
    wave_id TEXT,
    title TEXT NOT NULL,
    gate_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'passed',
    required_evidence_type TEXT NOT NULL,
    actual_evidence_id TEXT,
    evaluator_version TEXT NOT NULL,
    evaluated_at TIMESTAMPTZ,
    evaluation_notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_verification_gates_wave ON public.verification_gates(project_id, wave_id);

-- 9. Cutover Plans Table
CREATE TABLE IF NOT EXISTS public.cutover_plans (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.migration_projects(id) ON DELETE CASCADE,
    wave_id TEXT NOT NULL REFERENCES public.migration_waves(id) ON DELETE CASCADE,
    cutover_type TEXT NOT NULL,
    source_target TEXT NOT NULL,
    destination_target TEXT NOT NULL,
    traffic_scope TEXT NOT NULL,
    steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    rollback_triggers JSONB NOT NULL DEFAULT '[]'::jsonb,
    owner TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cutover_plans_proj ON public.cutover_plans(project_id);

-- 10. Rollback Plans Table
CREATE TABLE IF NOT EXISTS public.rollback_plans (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.migration_projects(id) ON DELETE CASCADE,
    wave_id TEXT NOT NULL REFERENCES public.migration_waves(id) ON DELETE CASCADE,
    is_feasible BOOLEAN NOT NULL DEFAULT true,
    feasibility_status TEXT NOT NULL DEFAULT 'fully_reversible',
    rollback_trigger_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    recovery_procedure_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    data_reconciliation_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    traffic_restoration_steps JSONB NOT NULL DEFAULT '[]'::jsonb,
    point_of_no_return_step_index INTEGER,
    point_of_no_return_warning TEXT,
    responsible_owner TEXT NOT NULL,
    notes TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_rollback_plans_wave ON public.rollback_plans(wave_id);

-- 11. Migration Risks Table
CREATE TABLE IF NOT EXISTS public.migration_risks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.migration_projects(id) ON DELETE CASCADE,
    wave_id TEXT NOT NULL REFERENCES public.migration_waves(id) ON DELETE CASCADE,
    affected_component_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    failure_mode TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    likelihood TEXT NOT NULL,
    mitigation_plan TEXT NOT NULL,
    owner TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'identified',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_migration_risks_proj ON public.migration_risks(project_id);
CREATE INDEX IF NOT EXISTS idx_migration_risks_sev ON public.migration_risks(severity);

-- 12. Migration Drift Records Table
CREATE TABLE IF NOT EXISTS public.migration_drift_records (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.migration_projects(id) ON DELETE CASCADE,
    baseline_revision TEXT NOT NULL,
    current_revision TEXT NOT NULL,
    drift_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    has_regressions BOOLEAN NOT NULL DEFAULT false,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_migration_drift_proj ON public.migration_drift_records(project_id);

-- =========================================================================
-- Enable Row Level Security (RLS) & Define Access Policies
-- =========================================================================

ALTER TABLE public.migration_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_waves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intermediate_architectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_gates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cutover_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rollback_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_drift_records ENABLE ROW LEVEL SECURITY;

-- Migration Projects Policies
CREATE POLICY "Users can manage migration projects for accessible projects"
    ON public.migration_projects
    FOR ALL
    USING (public.check_user_evolution_access(architecture_id))
    WITH CHECK (public.check_user_evolution_access(architecture_id));

-- Requirements Policies
CREATE POLICY "Users can manage migration requirements"
    ON public.migration_requirements
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)));

-- Waves Policies
CREATE POLICY "Users can manage migration waves"
    ON public.migration_waves
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)));

-- Tasks Policies
CREATE POLICY "Users can manage migration tasks"
    ON public.migration_tasks
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)));

-- Dependencies Policies
CREATE POLICY "Users can manage migration dependencies"
    ON public.migration_dependencies
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)));

-- Intermediate Architectures Policies
CREATE POLICY "Users can manage intermediate architectures"
    ON public.intermediate_architectures
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)));

-- Verification Gates Policies
CREATE POLICY "Users can manage verification gates"
    ON public.verification_gates
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)));

-- Cutover Plans Policies
CREATE POLICY "Users can manage cutover plans"
    ON public.cutover_plans
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)));

-- Rollback Plans Policies
CREATE POLICY "Users can manage rollback plans"
    ON public.rollback_plans
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)));

-- Migration Risks Policies
CREATE POLICY "Users can manage migration risks"
    ON public.migration_risks
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)));

-- Migration Drift Records Policies
CREATE POLICY "Users can manage migration drift records"
    ON public.migration_drift_records
    FOR ALL
    USING (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)))
    WITH CHECK (EXISTS (SELECT 1 FROM public.migration_projects mp WHERE mp.id = project_id AND public.check_user_evolution_access(mp.architecture_id)));

