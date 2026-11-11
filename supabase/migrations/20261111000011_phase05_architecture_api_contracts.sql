-- NXTQR — Phase 05.3.20: Architecture API Contracts & Service Interface Intelligence Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. API Contracts Table
CREATE TABLE IF NOT EXISTS public.api_contracts (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    protocol TEXT NOT NULL, -- 'rest' | 'graphql' | 'grpc' | 'asyncapi'
    format TEXT NOT NULL,   -- 'openapi_v3' | 'graphql_sdl' | 'protobuf_v3' | 'asyncapi_v2'
    provider_service_id TEXT NOT NULL,
    exposure TEXT NOT NULL DEFAULT 'internal', -- 'internal' | 'partner' | 'public'
    active_revision_id TEXT,
    lifecycle_status TEXT NOT NULL DEFAULT 'draft', -- 'draft' | 'proposed' | 'active' | 'deprecated' | 'sunset' | 'retired'
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_contracts_proj_arch ON public.api_contracts(project_id, architecture_id);
CREATE INDEX IF NOT EXISTS idx_contracts_provider ON public.api_contracts(provider_service_id);
CREATE INDEX IF NOT EXISTS idx_contracts_protocol ON public.api_contracts(protocol);

-- 2. Contract Revisions Table
CREATE TABLE IF NOT EXISTS public.contract_revisions (
    id TEXT PRIMARY KEY,
    contract_id TEXT NOT NULL REFERENCES public.api_contracts(id) ON DELETE CASCADE,
    version TEXT NOT NULL,
    specification_format TEXT NOT NULL,
    raw_specification TEXT NOT NULL,
    parsed_model JSONB NOT NULL DEFAULT '{}'::jsonb,
    normalized_operations JSONB NOT NULL DEFAULT '[]'::jsonb,
    normalized_schemas JSONB NOT NULL DEFAULT '{}'::jsonb,
    lifecycle_status TEXT NOT NULL DEFAULT 'draft',
    change_summary TEXT,
    evidence_source TEXT NOT NULL DEFAULT 'declared', -- 'declared' | 'implemented' | 'observed' | 'inferred' | 'unknown'
    author TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_revisions_contract ON public.contract_revisions(contract_id);
CREATE INDEX IF NOT EXISTS idx_revisions_version ON public.contract_revisions(contract_id, version);

-- 3. Service Interfaces Table
CREATE TABLE IF NOT EXISTS public.service_interfaces (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    service_id TEXT NOT NULL,
    contract_id TEXT NOT NULL REFERENCES public.api_contracts(id) ON DELETE CASCADE,
    port INTEGER,
    protocol TEXT NOT NULL,
    exposure TEXT NOT NULL,
    endpoint_url TEXT,
    is_public BOOLEAN NOT NULL DEFAULT false,
    evidence_source TEXT NOT NULL DEFAULT 'declared',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_interfaces_proj ON public.service_interfaces(project_id);
CREATE INDEX IF NOT EXISTS idx_interfaces_service ON public.service_interfaces(service_id);
CREATE INDEX IF NOT EXISTS idx_interfaces_contract ON public.service_interfaces(contract_id);

-- 4. Consumer Dependencies Table
CREATE TABLE IF NOT EXISTS public.consumer_dependencies (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    consumer_service_id TEXT NOT NULL,
    provider_service_id TEXT NOT NULL,
    contract_id TEXT NOT NULL REFERENCES public.api_contracts(id) ON DELETE CASCADE,
    contract_version_constraint TEXT,
    consumed_operations JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_source TEXT NOT NULL DEFAULT 'declared',
    coverage_status TEXT NOT NULL DEFAULT 'uncovered',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_consumer_deps_proj ON public.consumer_dependencies(project_id);
CREATE INDEX IF NOT EXISTS idx_consumer_deps_consumer ON public.consumer_dependencies(consumer_service_id);
CREATE INDEX IF NOT EXISTS idx_consumer_deps_provider ON public.consumer_dependencies(provider_service_id);
CREATE INDEX IF NOT EXISTS idx_consumer_deps_contract ON public.consumer_dependencies(contract_id);

-- 5. Compatibility Findings Records Table
CREATE TABLE IF NOT EXISTS public.compatibility_findings_records (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    contract_id TEXT NOT NULL REFERENCES public.api_contracts(id) ON DELETE CASCADE,
    baseline_revision_id TEXT NOT NULL,
    candidate_revision_id TEXT NOT NULL,
    classification TEXT NOT NULL, -- 'breaking' | 'potentially_breaking' | 'safe_additive' | 'compatible'
    rule_id TEXT NOT NULL,
    affected_operation_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    affected_consumer_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    explanation TEXT NOT NULL,
    remediation TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_findings_contract ON public.compatibility_findings_records(contract_id);
CREATE INDEX IF NOT EXISTS idx_findings_classification ON public.compatibility_findings_records(classification);

-- 6. Migration Plans Records Table
CREATE TABLE IF NOT EXISTS public.migration_plans_records (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    contract_id TEXT NOT NULL REFERENCES public.api_contracts(id) ON DELETE CASCADE,
    provider_service_id TEXT NOT NULL,
    title TEXT NOT NULL,
    strategy TEXT NOT NULL,
    rationale TEXT NOT NULL,
    phases JSONB NOT NULL DEFAULT '[]'::jsonb,
    rollback_strategy JSONB,
    affected_consumer_teams JSONB NOT NULL DEFAULT '[]'::jsonb,
    estimated_duration TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_plans_contract ON public.migration_plans_records(contract_id);

-- 7. Security Definer Helper for Access Verification
CREATE OR REPLACE FUNCTION public.check_user_contract_access(project_id_param text)
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

-- 8. Enable Row Level Security (RLS)
ALTER TABLE public.api_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_interfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumer_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compatibility_findings_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migration_plans_records ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
CREATE POLICY "Users can manage contracts in their projects"
    ON public.api_contracts
    FOR ALL
    USING (public.check_user_contract_access(project_id))
    WITH CHECK (public.check_user_contract_access(project_id));

CREATE POLICY "Users can manage revisions of contracts in their projects"
    ON public.contract_revisions
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.api_contracts c
            WHERE c.id = contract_revisions.contract_id
              AND public.check_user_contract_access(c.project_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.api_contracts c
            WHERE c.id = contract_revisions.contract_id
              AND public.check_user_contract_access(c.project_id)
        )
    );

CREATE POLICY "Users can manage service interfaces in their projects"
    ON public.service_interfaces
    FOR ALL
    USING (public.check_user_contract_access(project_id))
    WITH CHECK (public.check_user_contract_access(project_id));

CREATE POLICY "Users can manage consumer dependencies in their projects"
    ON public.consumer_dependencies
    FOR ALL
    USING (public.check_user_contract_access(project_id))
    WITH CHECK (public.check_user_contract_access(project_id));

CREATE POLICY "Users can manage compatibility findings in their projects"
    ON public.compatibility_findings_records
    FOR ALL
    USING (public.check_user_contract_access(project_id))
    WITH CHECK (public.check_user_contract_access(project_id));

CREATE POLICY "Users can manage migration plans in their projects"
    ON public.migration_plans_records
    FOR ALL
    USING (public.check_user_contract_access(project_id))
    WITH CHECK (public.check_user_contract_access(project_id));

