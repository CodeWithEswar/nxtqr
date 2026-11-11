-- NXTQR — Phase 05.3.27: Architecture Incident Response, Disaster Recovery & Operational Readiness Intelligence Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Helper function for workspace project access authorization
CREATE OR REPLACE FUNCTION public.check_user_operations_access(project_id_param text)
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

-- 2. Operational Projects Table
CREATE TABLE IF NOT EXISTS public.operational_projects (
    id TEXT PRIMARY KEY,
    architecture_id TEXT NOT NULL,
    architecture_revision_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    created_by TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_operational_projects_arch ON public.operational_projects(architecture_id);

-- 3. Incident Scenarios Table
CREATE TABLE IF NOT EXISTS public.incident_scenarios (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.operational_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- 'service_outage' | 'database_outage' | 'network_failure' | ...
    affected_component_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    affected_journey_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    severity TEXT NOT NULL DEFAULT 'SEV2', -- 'SEV1' | 'SEV2' | 'SEV3' | 'SEV4'
    assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
    trigger_condition TEXT NOT NULL,
    expected_failure_mode TEXT NOT NULL,
    owner_role TEXT NOT NULL DEFAULT 'incident_commander',
    playbook_id TEXT,
    recovery_strategy_id TEXT,
    evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_incident_scenarios_proj ON public.incident_scenarios(project_id);
CREATE INDEX IF NOT EXISTS idx_incident_scenarios_cat ON public.incident_scenarios(category);
CREATE INDEX IF NOT EXISTS idx_incident_scenarios_sev ON public.incident_scenarios(severity);

-- 4. Critical User Journeys Table
CREATE TABLE IF NOT EXISTS public.critical_journeys (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.operational_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    entry_point_component_id TEXT NOT NULL,
    traversed_component_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    recovery_priority INTEGER NOT NULL DEFAULT 1,
    max_allowed_downtime_seconds INTEGER NOT NULL DEFAULT 300,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_critical_journeys_proj ON public.critical_journeys(project_id);

-- 5. Operational Runbooks Table
CREATE TABLE IF NOT EXISTS public.operational_runbooks (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.operational_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    purpose TEXT NOT NULL,
    applicable_component_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    incident_scenario_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    revision TEXT NOT NULL DEFAULT '1.0.0',
    safety_warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
    prerequisites JSONB NOT NULL DEFAULT '[]'::jsonb,
    rollback_guidance TEXT NOT NULL,
    owner TEXT NOT NULL,
    review_date TIMESTAMPTZ NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT false,
    approval_reviewer TEXT,
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_operational_runbooks_proj ON public.operational_runbooks(project_id);
CREATE INDEX IF NOT EXISTS idx_operational_runbooks_approved ON public.operational_runbooks(is_approved);

-- 6. Runbook Steps Table
CREATE TABLE IF NOT EXISTS public.operational_runbook_steps (
    id TEXT PRIMARY KEY,
    runbook_id TEXT NOT NULL REFERENCES public.operational_runbooks(id) ON DELETE CASCADE,
    step_number INTEGER NOT NULL,
    type TEXT NOT NULL, -- 'instruction' | 'observation' | 'decision' | 'verification' | 'approval' | 'recovery' | 'rollback'
    title TEXT NOT NULL,
    details TEXT NOT NULL,
    preconditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    expected_observation TEXT,
    failure_branch_step_id TEXT,
    is_destructive BOOLEAN NOT NULL DEFAULT false,
    requires_approval BOOLEAN NOT NULL DEFAULT false,
    verification_gate TEXT,
    estimated_minutes NUMERIC DEFAULT 5
);

CREATE INDEX IF NOT EXISTS idx_runbook_steps_rb ON public.operational_runbook_steps(runbook_id);

-- 7. Disaster Recovery Objectives Table
CREATE TABLE IF NOT EXISTS public.recovery_objectives (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.operational_projects(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL,
    service_name TEXT NOT NULL,
    journey_id TEXT,
    rto_target_seconds INTEGER NOT NULL,
    rpo_target_seconds INTEGER NOT NULL,
    supporting_strategy_type TEXT NOT NULL,
    observed_rto_seconds INTEGER,
    observed_rpo_seconds INTEGER,
    is_rto_verified BOOLEAN NOT NULL DEFAULT false,
    is_rpo_verified BOOLEAN NOT NULL DEFAULT false,
    evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_recovery_objectives_proj ON public.recovery_objectives(project_id);
CREATE INDEX IF NOT EXISTS idx_recovery_objectives_svc ON public.recovery_objectives(service_id);

-- 8. Recovery Dependencies Table
CREATE TABLE IF NOT EXISTS public.recovery_dependencies (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.operational_projects(id) ON DELETE CASCADE,
    source_component_id TEXT NOT NULL,
    target_component_id TEXT NOT NULL,
    dependency_type TEXT NOT NULL, -- 'infrastructure' | 'identity' | 'data' | 'network' | 'secrets'
    is_blocking BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_recovery_dependencies_proj ON public.recovery_dependencies(project_id);

-- 9. Backup Capabilities Table
CREATE TABLE IF NOT EXISTS public.backup_capabilities (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.operational_projects(id) ON DELETE CASCADE,
    component_id TEXT NOT NULL,
    component_name TEXT NOT NULL,
    backup_type TEXT NOT NULL, -- 'full' | 'incremental' | 'snapshot' | 'point_in_time' | 'replication' | 'object_versioning'
    schedule_expression TEXT NOT NULL,
    retention_days INTEGER NOT NULL DEFAULT 30,
    is_encrypted BOOLEAN NOT NULL DEFAULT true,
    storage_location TEXT NOT NULL,
    last_successful_backup_at TIMESTAMPTZ,
    last_restore_test_at TIMESTAMPTZ,
    restore_verified BOOLEAN NOT NULL DEFAULT false,
    evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_backup_capabilities_proj ON public.backup_capabilities(project_id);

-- 10. Tabletop Exercises Table
CREATE TABLE IF NOT EXISTS public.tabletop_exercises (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.operational_projects(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    scenario_id TEXT NOT NULL,
    facilitator TEXT NOT NULL,
    participants JSONB NOT NULL DEFAULT '[]'::jsonb,
    scheduled_date DATE NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled', -- 'scheduled' | 'in_progress' | 'completed'
    assumptions JSONB NOT NULL DEFAULT '[]'::jsonb,
    injects JSONB NOT NULL DEFAULT '[]'::jsonb,
    observations JSONB NOT NULL DEFAULT '[]'::jsonb,
    findings JSONB NOT NULL DEFAULT '[]'::jsonb,
    action_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_tabletop_exercises_proj ON public.tabletop_exercises(project_id);

-- 11. Operational Findings Table
CREATE TABLE IF NOT EXISTS public.operational_findings (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.operational_projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'critical' | 'high' | 'medium' | 'low'
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_component_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    remediation_recommendation TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_operational_findings_proj ON public.operational_findings(project_id);
CREATE INDEX IF NOT EXISTS idx_operational_findings_sev ON public.operational_findings(severity);

-- 12. Operational Readiness Assessments Table
CREATE TABLE IF NOT EXISTS public.operational_readiness_assessments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES public.operational_projects(id) ON DELETE CASCADE,
    architecture_revision_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_ready', -- 'ready' | 'not_ready' | 'unknown'
    overall_score_percent NUMERIC NOT NULL DEFAULT 0,
    dimension_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    evaluator_version TEXT NOT NULL,
    summary_notes JSONB NOT NULL DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_readiness_assessments_proj ON public.operational_readiness_assessments(project_id);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.operational_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.critical_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_runbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_runbook_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recovery_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tabletop_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_readiness_assessments ENABLE ROW LEVEL SECURITY;

-- Operational Projects RLS
CREATE POLICY "Users can view operational projects in their workspace"
    ON public.operational_projects FOR SELECT
    USING (public.check_user_operations_access(architecture_id));

CREATE POLICY "Users can create operational projects in their workspace"
    ON public.operational_projects FOR INSERT
    WITH CHECK (public.check_user_operations_access(architecture_id));

CREATE POLICY "Users can update operational projects in their workspace"
    ON public.operational_projects FOR UPDATE
    USING (public.check_user_operations_access(architecture_id));

CREATE POLICY "Users can delete operational projects in their workspace"
    ON public.operational_projects FOR DELETE
    USING (public.check_user_operations_access(architecture_id));

-- Cascaded Child Tables RLS (via parent operational_project)
CREATE POLICY "Users can manage incident scenarios"
    ON public.incident_scenarios FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.operational_projects op
        WHERE op.id = incident_scenarios.project_id
          AND public.check_user_operations_access(op.architecture_id)
    ));

CREATE POLICY "Users can manage critical journeys"
    ON public.critical_journeys FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.operational_projects op
        WHERE op.id = critical_journeys.project_id
          AND public.check_user_operations_access(op.architecture_id)
    ));

CREATE POLICY "Users can manage operational runbooks"
    ON public.operational_runbooks FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.operational_projects op
        WHERE op.id = operational_runbooks.project_id
          AND public.check_user_operations_access(op.architecture_id)
    ));

CREATE POLICY "Users can manage operational runbook steps"
    ON public.operational_runbook_steps FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.operational_runbooks rb
        JOIN public.operational_projects op ON op.id = rb.project_id
        WHERE rb.id = operational_runbook_steps.runbook_id
          AND public.check_user_operations_access(op.architecture_id)
    ));

CREATE POLICY "Users can manage recovery objectives"
    ON public.recovery_objectives FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.operational_projects op
        WHERE op.id = recovery_objectives.project_id
          AND public.check_user_operations_access(op.architecture_id)
    ));

CREATE POLICY "Users can manage recovery dependencies"
    ON public.recovery_dependencies FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.operational_projects op
        WHERE op.id = recovery_dependencies.project_id
          AND public.check_user_operations_access(op.architecture_id)
    ));

CREATE POLICY "Users can manage backup capabilities"
    ON public.backup_capabilities FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.operational_projects op
        WHERE op.id = backup_capabilities.project_id
          AND public.check_user_operations_access(op.architecture_id)
    ));

CREATE POLICY "Users can manage tabletop exercises"
    ON public.tabletop_exercises FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.operational_projects op
        WHERE op.id = tabletop_exercises.project_id
          AND public.check_user_operations_access(op.architecture_id)
    ));

CREATE POLICY "Users can manage operational findings"
    ON public.operational_findings FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.operational_projects op
        WHERE op.id = operational_findings.project_id
          AND public.check_user_operations_access(op.architecture_id)
    ));

CREATE POLICY "Users can manage readiness assessments"
    ON public.operational_readiness_assessments FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.operational_projects op
        WHERE op.id = operational_readiness_assessments.project_id
          AND public.check_user_operations_access(op.architecture_id)
    ));

