-- NXTQR — Phase 05.3.22: Architecture Caching, Data Consistency & State Management Intelligence Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Helper function for workspace project access authorization
CREATE OR REPLACE FUNCTION public.check_user_cache_state_access(project_id_param text)
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

-- 2. Cache State Topologies Table
CREATE TABLE IF NOT EXISTS public.cache_state_topologies (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    graph_revision TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cache_topologies_proj_arch ON public.cache_state_topologies(project_id, architecture_id);

-- 3. Cache Layers Table
CREATE TABLE IF NOT EXISTS public.cache_layers (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.cache_state_topologies(id) ON DELETE CASCADE,
    node_id TEXT,
    name TEXT NOT NULL,
    cache_type TEXT NOT NULL, -- 'browser_cache' | 'cdn_cache' | 'edge_cache' | 'app_memory_cache' | 'distributed_cache' | 'database_query_cache' | 'object_cache' | 'custom'
    technology TEXT NOT NULL, -- 'redis' | 'valkey' | 'memcached' | 'cloudflare_kv' | 'cloudflare_cache' | 'aws_elasticache' | 'aws_memorydb' | 'fastly' | 'browser_native' | 'in_memory' | 'custom'
    strategy TEXT NOT NULL, -- 'cache_aside' | 'read_through' | 'write_through' | 'write_behind' | 'refresh_ahead' | 'hybrid'
    tier_order INTEGER NOT NULL DEFAULT 1,
    region_id TEXT,
    eviction_policy TEXT NOT NULL DEFAULT 'lru', -- 'lru' | 'lfu' | 'fifo' | 'random' | 'ttl_only' | 'no_eviction' | 'custom'
    allocated_memory_mb INTEGER NOT NULL DEFAULT 512,
    ttl_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    fallback_behavior TEXT NOT NULL DEFAULT 'database_direct',
    request_coalescing_enabled BOOLEAN NOT NULL DEFAULT true,
    negative_caching_enabled BOOLEAN NOT NULL DEFAULT true,
    negative_cache_ttl_seconds INTEGER DEFAULT 60,
    read_hit_ratio_modeled NUMERIC(4,3),
    read_hit_ratio_observed NUMERIC(4,3),
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cache_layers_topology ON public.cache_layers(topology_id);
CREATE INDEX IF NOT EXISTS idx_cache_layers_tier ON public.cache_layers(tier_order);
CREATE INDEX IF NOT EXISTS idx_cache_layers_tech ON public.cache_layers(technology);

-- 4. Cache Key Spaces Table
CREATE TABLE IF NOT EXISTS public.cache_keyspaces (
    id TEXT PRIMARY KEY,
    layer_id TEXT NOT NULL REFERENCES public.cache_layers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    namespace_pattern TEXT NOT NULL,
    includes_tenant_scope BOOLEAN NOT NULL DEFAULT true,
    includes_environment_scope BOOLEAN NOT NULL DEFAULT true,
    includes_version_scope BOOLEAN NOT NULL DEFAULT false,
    data_classification TEXT NOT NULL DEFAULT 'internal', -- 'public' | 'internal' | 'confidential' | 'restricted'
    estimated_entry_size_bytes INTEGER NOT NULL DEFAULT 1024,
    estimated_key_count BIGINT NOT NULL DEFAULT 10000,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cache_keyspaces_layer ON public.cache_keyspaces(layer_id);
CREATE INDEX IF NOT EXISTS idx_cache_keyspaces_tenant ON public.cache_keyspaces(includes_tenant_scope);

-- 5. Sources of Truth Table
CREATE TABLE IF NOT EXISTS public.state_sources_of_truth (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.cache_state_topologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    storage_type TEXT NOT NULL, -- 'primary_relational_database' | 'distributed_nosql_database' | 'event_log_stream' | 'external_saas_api' | 'authoritative_microservice' | 'custom'
    is_authoritative_master BOOLEAN NOT NULL DEFAULT true,
    storage_engine TEXT,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_sources_of_truth_topology ON public.state_sources_of_truth(topology_id);

-- 6. Cache Invalidation Rules Table
CREATE TABLE IF NOT EXISTS public.cache_invalidation_rules (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.cache_state_topologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    target_cache_layer_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    mechanism TEXT NOT NULL, -- 'time_based_ttl' | 'explicit_api_purge' | 'event_driven_messaging' | 'change_data_capture' | 'versioned_key_rotation' | 'namespace_purge' | 'write_synchronous_invalidation'
    trigger_event_or_table TEXT NOT NULL,
    is_asynchronous BOOLEAN NOT NULL DEFAULT false,
    invalidation_key_pattern TEXT NOT NULL,
    propagation_latency_ms_expected INTEGER,
    re_refill_policy TEXT NOT NULL DEFAULT 'on_demand_lazy', -- 'on_demand_lazy' | 'immediate_warmup' | 'none'
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cache_inv_rules_topology ON public.cache_invalidation_rules(topology_id);

-- 7. Replica Groups Table
CREATE TABLE IF NOT EXISTS public.replica_groups (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.cache_state_topologies(id) ON DELETE CASCADE,
    source_of_truth_id TEXT NOT NULL,
    topology_type TEXT NOT NULL DEFAULT 'leader_follower', -- 'leader_follower' | 'multi_leader' | 'leaderless_dynamo' | 'single_node'
    replication_mode TEXT NOT NULL DEFAULT 'asynchronous', -- 'synchronous' | 'asynchronous' | 'semi_synchronous' | 'quorum_based' | 'none'
    read_quorum_size INTEGER,
    write_quorum_size INTEGER,
    consistency_model TEXT NOT NULL DEFAULT 'eventual',
    conflict_resolution TEXT NOT NULL DEFAULT 'last_write_wins_timestamp',
    replicas JSONB NOT NULL DEFAULT '[]'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_replica_groups_topology ON public.replica_groups(topology_id);

-- 8. State Owners Table
CREATE TABLE IF NOT EXISTS public.state_owners (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.cache_state_topologies(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL,
    state_domain TEXT NOT NULL,
    state_type TEXT NOT NULL DEFAULT 'entity', -- 'session' | 'workflow' | 'entity' | 'materialized_projection'
    is_exclusive_authoritative_writer BOOLEAN NOT NULL DEFAULT true,
    source_of_truth_id TEXT NOT NULL,
    associated_cache_layer_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    optimistic_concurrency_field TEXT,
    distributed_lock_config JSONB,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_state_owners_topology ON public.state_owners(topology_id);
CREATE INDEX IF NOT EXISTS idx_state_owners_domain ON public.state_owners(state_domain);

-- 9. Cache State Findings Records Table
CREATE TABLE IF NOT EXISTS public.cache_state_findings_records (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.cache_state_topologies(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'critical' | 'high' | 'medium' | 'low' | 'info'
    affected_cache_layer_id TEXT,
    affected_source_of_truth_id TEXT,
    affected_state_owner_id TEXT,
    affected_replica_group_id TEXT,
    title TEXT NOT NULL,
    explanation TEXT NOT NULL,
    risk_analysis TEXT NOT NULL,
    remediation TEXT NOT NULL,
    deterministic_calculation JSONB,
    evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_cache_findings_topology ON public.cache_state_findings_records(topology_id);
CREATE INDEX IF NOT EXISTS idx_cache_findings_severity ON public.cache_state_findings_records(severity);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.cache_state_topologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_layers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_keyspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_sources_of_truth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_invalidation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.replica_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.state_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cache_state_findings_records ENABLE ROW LEVEL SECURITY;

-- Topologies RLS Policies
CREATE POLICY "Users can view cache state topologies in their projects"
    ON public.cache_state_topologies FOR SELECT
    USING (public.check_user_cache_state_access(project_id));

CREATE POLICY "Users can create cache state topologies in their projects"
    ON public.cache_state_topologies FOR INSERT
    WITH CHECK (public.check_user_cache_state_access(project_id));

CREATE POLICY "Users can update cache state topologies in their projects"
    ON public.cache_state_topologies FOR UPDATE
    USING (public.check_user_cache_state_access(project_id));

CREATE POLICY "Users can delete cache state topologies in their projects"
    ON public.cache_state_topologies FOR DELETE
    USING (public.check_user_cache_state_access(project_id));

-- Sub-table RLS via Topology join
CREATE POLICY "Users can manage cache layers in their projects"
    ON public.cache_layers FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.cache_state_topologies t
        WHERE t.id = cache_layers.topology_id
          AND public.check_user_cache_state_access(t.project_id)
    ));

CREATE POLICY "Users can manage cache keyspaces in their projects"
    ON public.cache_keyspaces FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.cache_layers l
        JOIN public.cache_state_topologies t ON t.id = l.topology_id
        WHERE l.id = cache_keyspaces.layer_id
          AND public.check_user_cache_state_access(t.project_id)
    ));

CREATE POLICY "Users can manage sources of truth in their projects"
    ON public.state_sources_of_truth FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.cache_state_topologies t
        WHERE t.id = state_sources_of_truth.topology_id
          AND public.check_user_cache_state_access(t.project_id)
    ));

CREATE POLICY "Users can manage cache invalidation rules in their projects"
    ON public.cache_invalidation_rules FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.cache_state_topologies t
        WHERE t.id = cache_invalidation_rules.topology_id
          AND public.check_user_cache_state_access(t.project_id)
    ));

CREATE POLICY "Users can manage replica groups in their projects"
    ON public.replica_groups FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.cache_state_topologies t
        WHERE t.id = replica_groups.topology_id
          AND public.check_user_cache_state_access(t.project_id)
    ));

CREATE POLICY "Users can manage state owners in their projects"
    ON public.state_owners FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.cache_state_topologies t
        WHERE t.id = state_owners.topology_id
          AND public.check_user_cache_state_access(t.project_id)
    ));

CREATE POLICY "Users can manage cache state findings in their projects"
    ON public.cache_state_findings_records FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.cache_state_topologies t
        WHERE t.id = cache_state_findings_records.topology_id
          AND public.check_user_cache_state_access(t.project_id)
    ));
