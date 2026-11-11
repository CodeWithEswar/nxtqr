-- NXTQR — Phase 05.3.16: Architecture Observability & Telemetry Mapping Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Telemetry Connections Table (Authorized monitoring sources: Prometheus, OpenTelemetry, Mock)
CREATE TABLE IF NOT EXISTS public.telemetry_connections (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    source_type TEXT NOT NULL, -- 'prometheus' | 'opentelemetry' | 'mock' | 'custom'
    endpoint_url TEXT NOT NULL,
    auth_type TEXT NOT NULL DEFAULT 'none', -- 'none' | 'bearer' | 'basic' | 'api_key' | 'custom'
    encrypted_credentials TEXT, -- isolated server-side credential storage
    status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'testing' | 'error' | 'unreachable'
    capabilities JSONB NOT NULL DEFAULT '[]'::jsonb, -- ['metrics', 'traces', 'logs', 'service_discovery']
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    last_tested_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_telemetry_conn_project ON public.telemetry_connections(project_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_conn_source_type ON public.telemetry_connections(source_type);

-- 2. Telemetry Service Mappings Table (Architecture node to discovered runtime service identity)
CREATE TABLE IF NOT EXISTS public.telemetry_service_mappings (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    component_id TEXT NOT NULL,
    connection_id TEXT NOT NULL REFERENCES public.telemetry_connections(id) ON DELETE CASCADE,
    service_identity JSONB NOT NULL, -- { serviceName, namespace, environment, cluster }
    confidence TEXT NOT NULL DEFAULT 'suggested', -- 'confirmed' | 'suggested' | 'ambiguous' | 'unmapped' | 'stale'
    evidence_score NUMERIC(4,3) NOT NULL DEFAULT 1.000,
    evidence_reasons JSONB NOT NULL DEFAULT '[]'::jsonb,
    last_verified_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_telemetry_map_project_arch ON public.telemetry_service_mappings(project_id, architecture_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_map_component ON public.telemetry_service_mappings(component_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_map_connection ON public.telemetry_service_mappings(connection_id);

-- 3. Telemetry SLOs Table (Service-Level Objectives and Error Budget targets)
CREATE TABLE IF NOT EXISTS public.telemetry_slos (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    component_id TEXT NOT NULL,
    name TEXT NOT NULL,
    indicator TEXT NOT NULL, -- 'availability' | 'latency' | 'error_rate'
    target_threshold NUMERIC(10,3) NOT NULL, -- e.g. 200.000 (ms) or 99.900 (%)
    target_percentage NUMERIC(5,3) NOT NULL DEFAULT 99.900,
    window_days INTEGER NOT NULL DEFAULT 30,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_telemetry_slos_project_arch ON public.telemetry_slos(project_id, architecture_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_slos_component ON public.telemetry_slos(component_id);

-- 4. Enable Row Level Security (RLS) on all tables
ALTER TABLE public.telemetry_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_service_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telemetry_slos ENABLE ROW LEVEL SECURITY;

-- 5. Helper Function: Project Membership Check (Security Definer with immutable search_path)
CREATE OR REPLACE FUNCTION public.check_user_observability_access(project_id_param text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN (
        auth.uid() IS NOT NULL AND (
            EXISTS (
                SELECT 1 FROM public.projects
                WHERE id = project_id_param
                AND owner_id = auth.uid()::text
            )
            OR
            EXISTS (
                SELECT 1 FROM public.project_members
                WHERE project_id = project_id_param
                AND user_id = auth.uid()::text
            )
        )
    );
END;
$$;

-- 6. Row Level Security Policies
CREATE POLICY "Users can view telemetry connections for accessible projects"
    ON public.telemetry_connections
    FOR SELECT
    USING (public.check_user_observability_access(project_id));

CREATE POLICY "Users can create telemetry connections for accessible projects"
    ON public.telemetry_connections
    FOR INSERT
    WITH CHECK (public.check_user_observability_access(project_id));

CREATE POLICY "Users can update telemetry connections for accessible projects"
    ON public.telemetry_connections
    FOR UPDATE
    USING (public.check_user_observability_access(project_id));

CREATE POLICY "Users can delete telemetry connections for accessible projects"
    ON public.telemetry_connections
    FOR DELETE
    USING (public.check_user_observability_access(project_id));

-- Mappings Policies
CREATE POLICY "Users can view telemetry mappings for accessible projects"
    ON public.telemetry_service_mappings
    FOR SELECT
    USING (public.check_user_observability_access(project_id));

CREATE POLICY "Users can create telemetry mappings for accessible projects"
    ON public.telemetry_service_mappings
    FOR INSERT
    WITH CHECK (public.check_user_observability_access(project_id));

CREATE POLICY "Users can update telemetry mappings for accessible projects"
    ON public.telemetry_service_mappings
    FOR UPDATE
    USING (public.check_user_observability_access(project_id));

CREATE POLICY "Users can delete telemetry mappings for accessible projects"
    ON public.telemetry_service_mappings
    FOR DELETE
    USING (public.check_user_observability_access(project_id));

-- SLOs Policies
CREATE POLICY "Users can view telemetry SLOs for accessible projects"
    ON public.telemetry_slos
    FOR SELECT
    USING (public.check_user_observability_access(project_id));

CREATE POLICY "Users can create telemetry SLOs for accessible projects"
    ON public.telemetry_slos
    FOR INSERT
    WITH CHECK (public.check_user_observability_access(project_id));

CREATE POLICY "Users can update telemetry SLOs for accessible projects"
    ON public.telemetry_slos
    FOR UPDATE
    USING (public.check_user_observability_access(project_id));

CREATE POLICY "Users can delete telemetry SLOs for accessible projects"
    ON public.telemetry_slos
    FOR DELETE
    USING (public.check_user_observability_access(project_id));
