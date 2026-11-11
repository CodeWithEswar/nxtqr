-- NXTQR — Phase 05.3.18: Architecture Deployment Topology & Infrastructure Mapping Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Deployment Environments Table
CREATE TABLE IF NOT EXISTS public.deployment_environments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'development' | 'testing' | 'staging' | 'production' | 'disaster_recovery' | 'custom'
    isolation_level TEXT NOT NULL, -- 'separate_account' | 'separate_vpc' | 'shared_cluster' | 'shared_infrastructure'
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dep_env_project ON public.deployment_environments(project_id);
CREATE INDEX IF NOT EXISTS idx_dep_env_category ON public.deployment_environments(category);

-- 2. Deployment Topologies Table
CREATE TABLE IF NOT EXISTS public.deployment_topologies (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    environment_id TEXT NOT NULL REFERENCES public.deployment_environments(id) ON DELETE CASCADE,
    graph_revision TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dep_topo_project_arch ON public.deployment_topologies(project_id, architecture_id);
CREATE INDEX IF NOT EXISTS idx_dep_topo_env ON public.deployment_topologies(environment_id);

-- 3. Infrastructure Resources Table
CREATE TABLE IF NOT EXISTS public.infrastructure_resources (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.deployment_topologies(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    provider TEXT NOT NULL,
    region_id TEXT,
    zone_id TEXT,
    parent_id TEXT,
    cidr TEXT,
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    tags JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_infra_res_topo ON public.infrastructure_resources(topology_id);
CREATE INDEX IF NOT EXISTS idx_infra_res_project ON public.infrastructure_resources(project_id);
CREATE INDEX IF NOT EXISTS idx_infra_res_type ON public.infrastructure_resources(type);
CREATE INDEX IF NOT EXISTS idx_infra_res_parent ON public.infrastructure_resources(parent_id);

-- 4. Infrastructure Relationships Table
CREATE TABLE IF NOT EXISTS public.infrastructure_relationships (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.deployment_topologies(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    source_resource_id TEXT NOT NULL,
    target_resource_id TEXT NOT NULL,
    relationship_type TEXT NOT NULL,
    protocol TEXT,
    port_range TEXT,
    direction TEXT DEFAULT 'outbound',
    is_encrypted BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_infra_rel_topo ON public.infrastructure_relationships(topology_id);
CREATE INDEX IF NOT EXISTS idx_infra_rel_source ON public.infrastructure_relationships(source_resource_id);
CREATE INDEX IF NOT EXISTS idx_infra_rel_target ON public.infrastructure_relationships(target_resource_id);

-- 5. Deployment Mappings Table (Logical to Physical bindings)
CREATE TABLE IF NOT EXISTS public.deployment_mappings (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.deployment_topologies(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    logical_component_id TEXT NOT NULL,
    infrastructure_resource_id TEXT NOT NULL REFERENCES public.infrastructure_resources(id) ON DELETE CASCADE,
    environment_id TEXT NOT NULL,
    mapping_type TEXT NOT NULL, -- 'runs_on' | 'implemented_by' | 'stored_in' | 'served_by' | 'depends_on'
    replicas INTEGER NOT NULL DEFAULT 1,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    confirmed BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_dep_map_topo ON public.deployment_mappings(topology_id);
CREATE INDEX IF NOT EXISTS idx_dep_map_logical ON public.deployment_mappings(logical_component_id);
CREATE INDEX IF NOT EXISTS idx_dep_map_infra ON public.deployment_mappings(infrastructure_resource_id);

-- 6. Topology Drift Records Table
CREATE TABLE IF NOT EXISTS public.topology_drift_records (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.deployment_topologies(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL,
    drift_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    resource_id TEXT,
    planned_value JSONB,
    actual_value JSONB,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_topo_drift_topo ON public.topology_drift_records(topology_id);
CREATE INDEX IF NOT EXISTS idx_topo_drift_severity ON public.topology_drift_records(severity);

-- 7. Security Helper Function with explicit search_path
CREATE OR REPLACE FUNCTION public.check_user_deployment_access(project_id_param TEXT)
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
ALTER TABLE public.deployment_environments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_topologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.infrastructure_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deployment_mappings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topology_drift_records ENABLE ROW LEVEL SECURITY;

-- 9. RLS Policies
CREATE POLICY "Users can manage deployment environments in their projects"
    ON public.deployment_environments
    FOR ALL
    USING (public.check_user_deployment_access(project_id))
    WITH CHECK (public.check_user_deployment_access(project_id));

CREATE POLICY "Users can manage deployment topologies in their projects"
    ON public.deployment_topologies
    FOR ALL
    USING (public.check_user_deployment_access(project_id))
    WITH CHECK (public.check_user_deployment_access(project_id));

CREATE POLICY "Users can manage infrastructure resources in their projects"
    ON public.infrastructure_resources
    FOR ALL
    USING (public.check_user_deployment_access(project_id))
    WITH CHECK (public.check_user_deployment_access(project_id));

CREATE POLICY "Users can manage infrastructure relationships in their projects"
    ON public.infrastructure_relationships
    FOR ALL
    USING (public.check_user_deployment_access(project_id))
    WITH CHECK (public.check_user_deployment_access(project_id));

CREATE POLICY "Users can manage deployment mappings in their projects"
    ON public.deployment_mappings
    FOR ALL
    USING (public.check_user_deployment_access(project_id))
    WITH CHECK (public.check_user_deployment_access(project_id));

CREATE POLICY "Users can manage topology drift records in their projects"
    ON public.topology_drift_records
    FOR ALL
    USING (public.check_user_deployment_access(project_id))
    WITH CHECK (public.check_user_deployment_access(project_id));

