-- NXTQR — Phase 05.3.19: Architecture Data Flow, Lineage & Privacy Analysis Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Architecture Data Lineage Models Table
CREATE TABLE IF NOT EXISTS public.architecture_data_lineage_models (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    graph_revision TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_lineage_model_proj_arch ON public.architecture_data_lineage_models(project_id, architecture_id);

-- 2. Data Assets Table
CREATE TABLE IF NOT EXISTS public.data_assets (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES public.architecture_data_lineage_models(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    classification_level TEXT NOT NULL, -- 'public' | 'internal' | 'confidential' | 'restricted'
    classification_categories JSONB NOT NULL DEFAULT '[]'::jsonb,
    owner JSONB NOT NULL DEFAULT '{}'::jsonb,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb,
    storage_bindings JSONB NOT NULL DEFAULT '[]'::jsonb,
    retention_policy JSONB,
    deletion_policy JSONB,
    purposes JSONB NOT NULL DEFAULT '[]'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_data_assets_model ON public.data_assets(model_id);
CREATE INDEX IF NOT EXISTS idx_data_assets_proj ON public.data_assets(project_id);
CREATE INDEX IF NOT EXISTS idx_data_assets_level ON public.data_assets(classification_level);

-- 3. Data Flows Table
CREATE TABLE IF NOT EXISTS public.data_flows (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES public.architecture_data_lineage_models(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    name TEXT,
    source_component_id TEXT NOT NULL,
    destination_component_id TEXT NOT NULL,
    data_asset_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    protocol TEXT DEFAULT 'HTTPS',
    direction TEXT DEFAULT 'forward',
    encryption_in_transit JSONB,
    crosses_trust_boundary BOOLEAN NOT NULL DEFAULT false,
    trust_boundary_details TEXT,
    is_third_party_transfer BOOLEAN NOT NULL DEFAULT false,
    recipient_organization TEXT,
    source_region TEXT,
    destination_region TEXT,
    source_jurisdiction TEXT,
    destination_jurisdiction TEXT,
    purposes JSONB NOT NULL DEFAULT '[]'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    confirmed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_data_flows_model ON public.data_flows(model_id);
CREATE INDEX IF NOT EXISTS idx_data_flows_proj ON public.data_flows(project_id);
CREATE INDEX IF NOT EXISTS idx_data_flows_source ON public.data_flows(source_component_id);
CREATE INDEX IF NOT EXISTS idx_data_flows_dest ON public.data_flows(destination_component_id);

-- 4. Data Transformations Table
CREATE TABLE IF NOT EXISTS public.data_transformations (
    id TEXT PRIMARY KEY,
    model_id TEXT NOT NULL REFERENCES public.architecture_data_lineage_models(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    type TEXT NOT NULL,
    component_id TEXT NOT NULL,
    name TEXT NOT NULL,
    input_asset_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    output_asset_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    resulting_sensitivity TEXT,
    configuration_reference TEXT,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_data_transform_model ON public.data_transformations(model_id);
CREATE INDEX IF NOT EXISTS idx_data_transform_comp ON public.data_transformations(component_id);

-- 5. Privacy Findings Records Table
CREATE TABLE IF NOT EXISTS public.privacy_findings_records (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    severity TEXT NOT NULL,
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    affected_asset_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    affected_flow_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    affected_component_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    remediation TEXT NOT NULL,
    is_confirmed_risk BOOLEAN NOT NULL DEFAULT false,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_privacy_findings_proj ON public.privacy_findings_records(project_id);
CREATE INDEX IF NOT EXISTS idx_privacy_findings_sev ON public.privacy_findings_records(severity);

-- 6. Security Helper Function with explicit search_path
CREATE OR REPLACE FUNCTION public.check_user_lineage_access(project_id_param TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.project_members
        WHERE project_id = project_id_param
          AND user_id = auth.uid()
    );
$$;

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.architecture_data_lineage_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_transformations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_findings_records ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies
CREATE POLICY "Users can manage lineage models in their projects"
    ON public.architecture_data_lineage_models
    FOR ALL
    USING (public.check_user_lineage_access(project_id))
    WITH CHECK (public.check_user_lineage_access(project_id));

CREATE POLICY "Users can manage data assets in their projects"
    ON public.data_assets
    FOR ALL
    USING (public.check_user_lineage_access(project_id))
    WITH CHECK (public.check_user_lineage_access(project_id));

CREATE POLICY "Users can manage data flows in their projects"
    ON public.data_flows
    FOR ALL
    USING (public.check_user_lineage_access(project_id))
    WITH CHECK (public.check_user_lineage_access(project_id));

CREATE POLICY "Users can manage data transformations in their projects"
    ON public.data_transformations
    FOR ALL
    USING (public.check_user_lineage_access(project_id))
    WITH CHECK (public.check_user_lineage_access(project_id));

CREATE POLICY "Users can manage privacy findings in their projects"
    ON public.privacy_findings_records
    FOR ALL
    USING (public.check_user_lineage_access(project_id))
    WITH CHECK (public.check_user_lineage_access(project_id));

