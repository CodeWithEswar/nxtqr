-- NXTQR — Phase 05.3.25: Architecture Compliance, Governance & Policy-as-Code Intelligence Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Helper function for workspace project access authorization
CREATE OR REPLACE FUNCTION public.check_user_governance_access(project_id_param text)
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
        WHERE p.id = project_id_param
          AND wm.user_id = auth.uid()
    );
END;
$$;

-- 2. Governance Topologies Table
CREATE TABLE IF NOT EXISTS public.governance_topologies (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    graph_revision TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_governance_topologies_proj_arch ON public.governance_topologies(project_id, architecture_id);

-- 3. Governance Policies Table (Policy-as-Code Declarative Registry)
CREATE TABLE IF NOT EXISTS public.governance_policies (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    workspace_id TEXT,
    project_id TEXT,
    version TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL, -- 'security' | 'reliability' | 'cost' | 'operations' | 'data_protection' | 'compliance' | 'api_governance' | 'observability' | 'technology_standards'
    severity TEXT NOT NULL, -- 'critical' | 'high' | 'medium' | 'low'
    status TEXT NOT NULL DEFAULT 'active', -- 'draft' | 'active' | 'enforced' | 'audit_only' | 'deprecated'
    scope JSONB NOT NULL DEFAULT '{}'::jsonb,
    rule JSONB NOT NULL DEFAULT '{}'::jsonb,
    required_evidence_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    remediation_guidance TEXT NOT NULL,
    control_mappings JSONB NOT NULL DEFAULT '[]'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_governance_policies_scope ON public.governance_policies(organization_id, category, severity);
CREATE INDEX IF NOT EXISTS idx_governance_policies_project ON public.governance_policies(project_id) WHERE project_id IS NOT NULL;

-- 4. Policy Bundles Table
CREATE TABLE IF NOT EXISTS public.policy_bundles (
    id TEXT PRIMARY KEY,
    bundle_type TEXT NOT NULL, -- 'baseline_architecture' | 'production_readiness' | 'cloud_security_guardrails' | 'data_privacy_gdpr' | 'zero_trust_network' | 'financial_compliance' | 'custom'
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    version TEXT NOT NULL,
    policy_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_mandatory BOOLEAN NOT NULL DEFAULT false,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_policy_bundles_type ON public.policy_bundles(bundle_type);

-- 5. Evidence Proof Artifacts Table
CREATE TABLE IF NOT EXISTS public.evidence_artifacts (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.governance_topologies(id) ON DELETE CASCADE,
    evidence_type TEXT NOT NULL, -- 'architecture_graph' | 'security_configuration' | 'deployment_metadata' | 'data_classification' | 'api_contract' | 'telemetry_metric' | 'audit_log' | 'human_review' | 'backup_verification' | 'database_schema'
    source_identifier TEXT NOT NULL,
    resource_id TEXT,
    observed_at TIMESTAMPTZ NOT NULL,
    freshness_window_seconds INTEGER NOT NULL,
    integrity_hash TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    owner TEXT NOT NULL,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_evidence_artifacts_topo ON public.evidence_artifacts(topology_id);
CREATE INDEX IF NOT EXISTS idx_evidence_artifacts_type ON public.evidence_artifacts(evidence_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_evidence_artifacts_hash ON public.evidence_artifacts(integrity_hash);

-- 6. Policy Exceptions & Time-Bound Waivers Table
CREATE TABLE IF NOT EXISTS public.policy_exceptions (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.governance_topologies(id) ON DELETE CASCADE,
    policy_id TEXT NOT NULL REFERENCES public.governance_policies(id) ON DELETE RESTRICT,
    policy_version TEXT NOT NULL,
    resource_scope JSONB NOT NULL DEFAULT '[]'::jsonb,
    justification TEXT NOT NULL,
    compensating_controls JSONB NOT NULL DEFAULT '[]'::jsonb,
    requester_id TEXT NOT NULL,
    approver_id TEXT,
    status TEXT NOT NULL DEFAULT 'under_review', -- 'requested' | 'under_review' | 'approved' | 'rejected' | 'expired' | 'revoked'
    start_date TIMESTAMPTZ NOT NULL,
    expiration_date TIMESTAMPTZ NOT NULL,
    is_expired BOOLEAN NOT NULL DEFAULT false,
    audit_history JSONB NOT NULL DEFAULT '[]'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_policy_exceptions_topo ON public.policy_exceptions(topology_id);
CREATE INDEX IF NOT EXISTS idx_policy_exceptions_policy ON public.policy_exceptions(policy_id, status);
CREATE INDEX IF NOT EXISTS idx_policy_exceptions_exp ON public.policy_exceptions(expiration_date, is_expired);

-- 7. Policy Evaluations Table (Deterministic 4-State Outcomes)
CREATE TABLE IF NOT EXISTS public.policy_evaluations (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.governance_topologies(id) ON DELETE CASCADE,
    policy_id TEXT NOT NULL REFERENCES public.governance_policies(id) ON DELETE RESTRICT,
    policy_version TEXT NOT NULL,
    policy_title TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    resource_id TEXT,
    resource_name TEXT,
    status TEXT NOT NULL, -- 'pass' | 'fail' | 'unknown' | 'not_applicable'
    is_applicable BOOLEAN NOT NULL DEFAULT true,
    applicable_reason TEXT,
    evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    missing_evidence_types JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanation TEXT NOT NULL,
    remediation_guidance TEXT NOT NULL,
    exception_id TEXT,
    has_active_exception BOOLEAN NOT NULL DEFAULT false,
    evaluated_at TIMESTAMPTZ NOT NULL,
    evaluator_version TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_policy_evaluations_topo ON public.policy_evaluations(topology_id);
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_status ON public.policy_evaluations(status, severity);
CREATE INDEX IF NOT EXISTS idx_policy_evaluations_resource ON public.policy_evaluations(resource_id);

-- 8. Governance Findings Table
CREATE TABLE IF NOT EXISTS public.governance_findings (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.governance_topologies(id) ON DELETE CASCADE,
    policy_id TEXT NOT NULL,
    policy_version TEXT NOT NULL,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    severity TEXT NOT NULL,
    affected_resource_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    evaluation_status TEXT NOT NULL,
    summary TEXT NOT NULL,
    rationale TEXT NOT NULL,
    remediation TEXT NOT NULL,
    has_approved_exception BOOLEAN NOT NULL DEFAULT false,
    exception_id TEXT,
    evidence_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_governance_findings_topo ON public.governance_findings(topology_id);
CREATE INDEX IF NOT EXISTS idx_governance_findings_severity ON public.governance_findings(severity);

-- 9. Governance Baselines Table
CREATE TABLE IF NOT EXISTS public.governance_baselines (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_revision TEXT NOT NULL,
    bundle_versions JSONB NOT NULL DEFAULT '{}'::jsonb,
    evaluations JSONB NOT NULL DEFAULT '[]'::jsonb,
    active_exception_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_by TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_governance_baselines_proj ON public.governance_baselines(project_id, architecture_revision);

-- 10. Governance Drift Records Table
CREATE TABLE IF NOT EXISTS public.governance_drift_records (
    id TEXT PRIMARY KEY,
    baseline_id TEXT NOT NULL REFERENCES public.governance_baselines(id) ON DELETE CASCADE,
    current_revision TEXT NOT NULL,
    drift_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_new_violations INTEGER NOT NULL DEFAULT 0,
    total_resolved_violations INTEGER NOT NULL DEFAULT 0,
    total_expired_exceptions INTEGER NOT NULL DEFAULT 0,
    has_regressions BOOLEAN NOT NULL DEFAULT false,
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_governance_drift_baseline ON public.governance_drift_records(baseline_id);

-- ============================================================================
-- Enable Row Level Security (RLS) on All Tables
-- ============================================================================

ALTER TABLE public.governance_topologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_bundles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.governance_drift_records ENABLE ROW LEVEL SECURITY;

-- 11. RLS Policies: governance_topologies
CREATE POLICY "Users can access governance topologies of member projects"
ON public.governance_topologies
FOR ALL
USING (public.check_user_governance_access(project_id))
WITH CHECK (public.check_user_governance_access(project_id));

-- 12. RLS Policies: governance_policies
CREATE POLICY "Users can read global, workspace, and project policies"
ON public.governance_policies
FOR SELECT
USING (
    project_id IS NULL OR public.check_user_governance_access(project_id)
);

CREATE POLICY "Users can manage project policies"
ON public.governance_policies
FOR ALL
USING (
    project_id IS NOT NULL AND public.check_user_governance_access(project_id)
)
WITH CHECK (
    project_id IS NOT NULL AND public.check_user_governance_access(project_id)
);

-- 13. RLS Policies: policy_bundles (Standard bundles are readable by all authenticated users)
CREATE POLICY "Authenticated users can read policy bundles"
ON public.policy_bundles
FOR SELECT
TO authenticated
USING (true);

-- 14. RLS Policies: evidence_artifacts
CREATE POLICY "Users can access evidence artifacts of member project topologies"
ON public.evidence_artifacts
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.governance_topologies t
        WHERE t.id = evidence_artifacts.topology_id
          AND public.check_user_governance_access(t.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.governance_topologies t
        WHERE t.id = evidence_artifacts.topology_id
          AND public.check_user_governance_access(t.project_id)
    )
);

-- 15. RLS Policies: policy_exceptions
CREATE POLICY "Users can access policy exceptions of member project topologies"
ON public.policy_exceptions
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.governance_topologies t
        WHERE t.id = policy_exceptions.topology_id
          AND public.check_user_governance_access(t.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.governance_topologies t
        WHERE t.id = policy_exceptions.topology_id
          AND public.check_user_governance_access(t.project_id)
    )
);

-- 16. RLS Policies: policy_evaluations
CREATE POLICY "Users can access policy evaluations of member project topologies"
ON public.policy_evaluations
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.governance_topologies t
        WHERE t.id = policy_evaluations.topology_id
          AND public.check_user_governance_access(t.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.governance_topologies t
        WHERE t.id = policy_evaluations.topology_id
          AND public.check_user_governance_access(t.project_id)
    )
);

-- 17. RLS Policies: governance_findings
CREATE POLICY "Users can access governance findings of member project topologies"
ON public.governance_findings
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.governance_topologies t
        WHERE t.id = governance_findings.topology_id
          AND public.check_user_governance_access(t.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.governance_topologies t
        WHERE t.id = governance_findings.topology_id
          AND public.check_user_governance_access(t.project_id)
    )
);

-- 18. RLS Policies: governance_baselines
CREATE POLICY "Users can access governance baselines of member projects"
ON public.governance_baselines
FOR ALL
USING (public.check_user_governance_access(project_id))
WITH CHECK (public.check_user_governance_access(project_id));

-- 19. RLS Policies: governance_drift_records
CREATE POLICY "Users can access governance drift records of member projects"
ON public.governance_drift_records
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.governance_baselines b
        WHERE b.id = governance_drift_records.baseline_id
          AND public.check_user_governance_access(b.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.governance_baselines b
        WHERE b.id = governance_drift_records.baseline_id
          AND public.check_user_governance_access(b.project_id)
    )
);
