-- NXTQR — Phase 05.3.23: Architecture Database Design, Query Performance & Storage Intelligence Engine
-- PostgreSQL / Supabase Schema Migration with Row Level Security (RLS)

-- 1. Helper function for workspace project access authorization
CREATE OR REPLACE FUNCTION public.check_user_database_access(project_id_param text)
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

-- 2. Database Topologies Table
CREATE TABLE IF NOT EXISTS public.database_topologies (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    architecture_id TEXT NOT NULL,
    graph_revision TEXT NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    connection_pooling JSONB,
    read_replica_routing JSONB,
    sharding JSONB,
    migration_plan JSONB,
    storage_forecast JSONB,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_database_topologies_proj_arch ON public.database_topologies(project_id, architecture_id);

-- 3. Database Assets Table
CREATE TABLE IF NOT EXISTS public.database_assets (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.database_topologies(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    family TEXT NOT NULL, -- 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'dynamodb' | 'clickhouse' | 'cockroachdb' | 'custom'
    provider_technology TEXT NOT NULL,
    engine_version TEXT NOT NULL,
    environment TEXT NOT NULL DEFAULT 'production', -- 'development' | 'staging' | 'production'
    ownership_team TEXT NOT NULL,
    port INTEGER,
    connection_string_secret_name TEXT,
    node_id TEXT,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_database_assets_topology ON public.database_assets(topology_id);
CREATE INDEX IF NOT EXISTS idx_database_assets_family ON public.database_assets(family);

-- 4. Database Schemas Table
CREATE TABLE IF NOT EXISTS public.database_schemas (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.database_topologies(id) ON DELETE CASCADE,
    asset_id TEXT NOT NULL REFERENCES public.database_assets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_database_schemas_topology ON public.database_schemas(topology_id);
CREATE INDEX IF NOT EXISTS idx_database_schemas_asset ON public.database_schemas(asset_id);

-- 5. Database Tables Table
CREATE TABLE IF NOT EXISTS public.database_tables (
    id TEXT PRIMARY KEY,
    schema_id TEXT NOT NULL REFERENCES public.database_schemas(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    row_count_estimate BIGINT NOT NULL DEFAULT 0,
    average_row_size_bytes INTEGER NOT NULL DEFAULT 128,
    total_size_bytes BIGINT NOT NULL DEFAULT 0,
    partitioning JSONB,
    is_junction_table BOOLEAN NOT NULL DEFAULT false,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_database_tables_schema ON public.database_tables(schema_id);
CREATE INDEX IF NOT EXISTS idx_database_tables_name ON public.database_tables(name);

-- 6. Database Columns Table
CREATE TABLE IF NOT EXISTS public.database_columns (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL REFERENCES public.database_tables(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    data_type TEXT NOT NULL,
    is_primary_key BOOLEAN NOT NULL DEFAULT false,
    is_nullable BOOLEAN NOT NULL DEFAULT true,
    is_unique BOOLEAN NOT NULL DEFAULT false,
    default_value TEXT,
    is_generated BOOLEAN NOT NULL DEFAULT false,
    generation_expression TEXT,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_database_columns_table ON public.database_columns(table_id);
CREATE INDEX IF NOT EXISTS idx_database_columns_pk ON public.database_columns(is_primary_key);

-- 7. Database Indexes Table
CREATE TABLE IF NOT EXISTS public.database_indexes (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.database_topologies(id) ON DELETE CASCADE,
    table_id TEXT NOT NULL REFERENCES public.database_tables(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    column_names TEXT[] NOT NULL,
    method TEXT NOT NULL DEFAULT 'btree', -- 'btree' | 'hash' | 'gin' | 'gist' | 'brin' | 'spgist' | 'custom'
    is_unique BOOLEAN NOT NULL DEFAULT false,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    is_partial BOOLEAN NOT NULL DEFAULT false,
    where_clause TEXT,
    fill_factor INTEGER,
    estimated_size_bytes BIGINT,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_database_indexes_topology ON public.database_indexes(topology_id);
CREATE INDEX IF NOT EXISTS idx_database_indexes_table ON public.database_indexes(table_id);

-- 8. Database Foreign Keys Table
CREATE TABLE IF NOT EXISTS public.database_foreign_keys (
    id TEXT PRIMARY KEY,
    table_id TEXT NOT NULL REFERENCES public.database_tables(id) ON DELETE CASCADE,
    source_column_names TEXT[] NOT NULL,
    target_table_id TEXT NOT NULL REFERENCES public.database_tables(id) ON DELETE CASCADE,
    target_column_names TEXT[] NOT NULL,
    relationship_type TEXT NOT NULL DEFAULT 'one_to_many', -- 'one_to_one' | 'one_to_many' | 'many_to_many'
    on_delete_action TEXT NOT NULL DEFAULT 'restrict', -- 'cascade' | 'set_null' | 'restrict' | 'no_action'
    on_update_action TEXT NOT NULL DEFAULT 'cascade',
    is_indexed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_database_foreign_keys_table ON public.database_foreign_keys(table_id);
CREATE INDEX IF NOT EXISTS idx_database_foreign_keys_target ON public.database_foreign_keys(target_table_id);

-- 9. Query Workloads Table
CREATE TABLE IF NOT EXISTS public.query_workloads (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.database_topologies(id) ON DELETE CASCADE,
    asset_id TEXT NOT NULL REFERENCES public.database_assets(id) ON DELETE CASCADE,
    primary_table_id TEXT NOT NULL REFERENCES public.database_tables(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    raw_sql TEXT NOT NULL,
    normalized_sql TEXT,
    fingerprint_hash TEXT,
    query_pattern TEXT NOT NULL, -- 'point_lookup' | 'range_scan' | 'aggregate' | 'multi_join' | 'full_scan_report' | 'bulk_insert' | 'batch_update' | 'custom'
    estimated_qps NUMERIC(10,2) NOT NULL DEFAULT 1.0,
    p95_latency_ms NUMERIC(10,2),
    reads_per_execution INTEGER NOT NULL DEFAULT 1,
    writes_per_execution INTEGER NOT NULL DEFAULT 0,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_query_workloads_topology ON public.query_workloads(topology_id);
CREATE INDEX IF NOT EXISTS idx_query_workloads_pattern ON public.query_workloads(query_pattern);
CREATE INDEX IF NOT EXISTS idx_query_workloads_fingerprint ON public.query_workloads(fingerprint_hash);

-- 10. Query Execution Plans Table
CREATE TABLE IF NOT EXISTS public.query_execution_plans (
    id TEXT PRIMARY KEY,
    query_workload_id TEXT NOT NULL REFERENCES public.query_workloads(id) ON DELETE CASCADE,
    format TEXT NOT NULL DEFAULT 'postgres_json',
    is_actual_execution BOOLEAN NOT NULL DEFAULT false,
    total_execution_time_ms NUMERIC(10,3),
    planning_time_ms NUMERIC(10,3),
    root_operator JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_query_execution_plans_workload ON public.query_execution_plans(query_workload_id);

-- 11. Transaction Models Table
CREATE TABLE IF NOT EXISTS public.transaction_models (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.database_topologies(id) ON DELETE CASCADE,
    asset_id TEXT NOT NULL REFERENCES public.database_assets(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    isolation_level TEXT NOT NULL DEFAULT 'read_committed', -- 'read_uncommitted' | 'read_committed' | 'repeatable_read' | 'serializable'
    read_only BOOLEAN NOT NULL DEFAULT false,
    operations JSONB NOT NULL DEFAULT '[]'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_transaction_models_topology ON public.transaction_models(topology_id);
CREATE INDEX IF NOT EXISTS idx_transaction_models_isolation ON public.transaction_models(isolation_level);

-- 12. Database Findings Records Table
CREATE TABLE IF NOT EXISTS public.database_findings_records (
    id TEXT PRIMARY KEY,
    topology_id TEXT NOT NULL REFERENCES public.database_topologies(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    severity TEXT NOT NULL, -- 'critical' | 'high' | 'medium' | 'low' | 'info'
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    rationale TEXT NOT NULL,
    table_id TEXT,
    query_id TEXT,
    index_id TEXT,
    remediation JSONB NOT NULL DEFAULT '{}'::jsonb,
    provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_database_findings_topology ON public.database_findings_records(topology_id);
CREATE INDEX IF NOT EXISTS idx_database_findings_severity ON public.database_findings_records(severity);

-- ============================================================================
-- Enable Row Level Security (RLS) on all tables
-- ============================================================================
ALTER TABLE public.database_topologies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_schemas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_indexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_foreign_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_workloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_execution_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.database_findings_records ENABLE ROW LEVEL SECURITY;

-- Topologies Policy
CREATE POLICY "Users can manage database topologies of accessible projects"
ON public.database_topologies
FOR ALL
USING (public.check_user_database_access(project_id))
WITH CHECK (public.check_user_database_access(project_id));

-- Assets Policy
CREATE POLICY "Users can manage database assets of accessible topologies"
ON public.database_assets
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.database_topologies dt
        WHERE dt.id = topology_id
          AND public.check_user_database_access(dt.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.database_topologies dt
        WHERE dt.id = topology_id
          AND public.check_user_database_access(dt.project_id)
    )
);

-- Schemas Policy
CREATE POLICY "Users can manage database schemas of accessible topologies"
ON public.database_schemas
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.database_topologies dt
        WHERE dt.id = topology_id
          AND public.check_user_database_access(dt.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.database_topologies dt
        WHERE dt.id = topology_id
          AND public.check_user_database_access(dt.project_id)
    )
);

-- Tables Policy
CREATE POLICY "Users can manage database tables of accessible topologies"
ON public.database_tables
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.database_schemas ds
        JOIN public.database_topologies dt ON dt.id = ds.topology_id
        WHERE ds.id = schema_id
          AND public.check_user_database_access(dt.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.database_schemas ds
        JOIN public.database_topologies dt ON dt.id = ds.topology_id
        WHERE ds.id = schema_id
          AND public.check_user_database_access(dt.project_id)
    )
);

-- Columns Policy
CREATE POLICY "Users can manage database columns of accessible topologies"
ON public.database_columns
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.database_tables dtb
        JOIN public.database_schemas ds ON ds.id = dtb.schema_id
        JOIN public.database_topologies dt ON dt.id = ds.topology_id
        WHERE dtb.id = table_id
          AND public.check_user_database_access(dt.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.database_tables dtb
        JOIN public.database_schemas ds ON ds.id = dtb.schema_id
        JOIN public.database_topologies dt ON dt.id = ds.topology_id
        WHERE dtb.id = table_id
          AND public.check_user_database_access(dt.project_id)
    )
);

-- Indexes Policy
CREATE POLICY "Users can manage database indexes of accessible topologies"
ON public.database_indexes
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.database_topologies dt
        WHERE dt.id = topology_id
          AND public.check_user_database_access(dt.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.database_topologies dt
        WHERE dt.id = topology_id
          AND public.check_user_database_access(dt.project_id)
    )
);

-- Foreign Keys Policy
CREATE POLICY "Users can manage database foreign keys of accessible topologies"
ON public.database_foreign_keys
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.database_tables dtb
        JOIN public.database_schemas ds ON ds.id = dtb.schema_id
        JOIN public.database_topologies dt ON dt.id = ds.topology_id
        WHERE dtb.id = table_id
          AND public.check_user_database_access(dt.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.database_tables dtb
        JOIN public.database_schemas ds ON ds.id = dtb.schema_id
        JOIN public.database_topologies dt ON dt.id = ds.topology_id
        WHERE dtb.id = table_id
          AND public.check_user_database_access(dt.project_id)
    )
);

-- Workloads Policy
CREATE POLICY "Users can manage query workloads of accessible topologies"
ON public.query_workloads
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.database_topologies dt
        WHERE dt.id = topology_id
          AND public.check_user_database_access(dt.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.database_topologies dt
        WHERE dt.id = topology_id
          AND public.check_user_database_access(dt.project_id)
    )
);

-- Plans Policy
CREATE POLICY "Users can manage query plans of accessible workloads"
ON public.query_execution_plans
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.query_workloads qw
        JOIN public.database_topologies dt ON dt.id = qw.topology_id
        WHERE qw.id = query_workload_id
          AND public.check_user_database_access(dt.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.query_workloads qw
        JOIN public.database_topologies dt ON dt.id = qw.topology_id
        WHERE qw.id = query_workload_id
          AND public.check_user_database_access(dt.project_id)
    )
);

-- Transaction Models Policy
CREATE POLICY "Users can manage transaction models of accessible topologies"
ON public.transaction_models
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.database_topologies dt
        WHERE dt.id = topology_id
          AND public.check_user_database_access(dt.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.database_topologies dt
        WHERE dt.id = topology_id
          AND public.check_user_database_access(dt.project_id)
    )
);

-- Findings Records Policy
CREATE POLICY "Users can manage database findings records of accessible topologies"
ON public.database_findings_records
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.database_topologies dt
        WHERE dt.id = topology_id
          AND public.check_user_database_access(dt.project_id)
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.database_topologies dt
        WHERE dt.id = topology_id
          AND public.check_user_database_access(dt.project_id)
    )
);
